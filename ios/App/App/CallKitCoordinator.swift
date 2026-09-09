import Foundation
import CallKit
import AVFoundation

// Pemilik CXProvider dan SATU-SATUNYA pemegang state panggilan iOS.
//
// Sengaja DIPISAH dari CallUiPlugin: PushKit harus terdaftar saat aplikasi
// diluncurkan, jauh sebelum plugin Capacitor diinstansiasi. Kalau logikanya
// ditaruh di dalam plugin, panggilan yang tiba saat aplikasi mati tidak akan
// pernah dilaporkan -- dan iOS menghukum itu dengan mematikan aplikasi serta
// mencabut hak VoIP push-nya.
final class CallKitCoordinator: NSObject, CXProviderDelegate {

    static let shared = CallKitCoordinator()

    private let provider: CXProvider
    private let controller = CXCallController()

    private struct CallInfo {
        let callId: String
        let conversationId: String
        let callerId: String
        let callerName: String
        let hasVideo: Bool
        var answered: Bool
        let outgoing: Bool
    }

    private var calls: [UUID: CallInfo] = [:]

    // Antrean peristiwa untuk saat WebView BELUM ada (aplikasi mati total lalu
    // dibangunkan VoIP push). Pola yang sama dengan consumePending* di Android,
    // yang sudah terbukti 7/7.
    private var pending: [[String: Any]] = []

    var onEvent: (([String: Any]) -> Void)?
    var onAudioActive: (() -> Void)?

    private override init() {
        let cfg: CXProviderConfiguration
        if #available(iOS 14.0, *) {
            cfg = CXProviderConfiguration()
            cfg.localizedName = "BSI Messenger"
        } else {
            cfg = CXProviderConfiguration(localizedName: "BSI Messenger")
        }
        cfg.supportsVideo = true
        cfg.maximumCallsPerCallGroup = 1
        cfg.maximumCallGroups = 1
        cfg.supportedHandleTypes = [.generic]
        // Keputusan pengguna: panggilan BSIM boleh tercatat di Recents iOS.
        // DAPAT DIBALIK dengan mengubah baris ini menjadi false.
        cfg.includesCallsInRecents = true

        provider = CXProvider(configuration: cfg)
        super.init()
        provider.setDelegate(self, queue: nil)
    }

    // MARK: - Masuk dari VoIP push

    // WAJIB sinkron sampai completion(): PushKit memberi kita hitungan detik.
    func reportIncoming(payload: [AnyHashable: Any], completion: @escaping () -> Void) {
        let action = (payload["action"] as? String) ?? "incoming"
        let callId = (payload["callId"] as? String) ?? ""

        if action == "cancel" {
            handleCancel(callId: callId, completion: completion)
            return
        }

        let conversationId = (payload["conversationId"] as? String) ?? ""
        let callerId = (payload["callerId"] as? String) ?? ""
        let name = (payload["callerName"] as? String) ?? "Panggilan"
        let hasVideo = (payload["callType"] as? String) == "VIDEO"

        // FR-11: payload cacat TETAP dilaporkan, lalu segera diakhiri.
        let malformed = callId.isEmpty || conversationId.isEmpty || callerId.isEmpty
        let effectiveId = callId.isEmpty ? UUID().uuidString : callId
        let uuid = CallUuid.from(callId: effectiveId)

        // Idempoten: push ganda untuk callId yang sama tidak dilaporkan dua kali,
        // tetapi completion() TETAP dipanggil.
        if calls[uuid] != nil { completion(); return }

        // Kategori + mode SEBELUM melapor. Aktivasi tetap milik CallKit.
        AudioSessionCoordinator.shared.configureForCall()

        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .generic, value: name)
        update.localizedCallerName = name
        update.hasVideo = hasVideo
        update.supportsHolding = false
        update.supportsGrouping = false
        update.supportsUngrouping = false
        update.supportsDTMF = false

        calls[uuid] = CallInfo(callId: effectiveId, conversationId: conversationId,
                               callerId: callerId, callerName: name,
                               hasVideo: hasVideo, answered: false, outgoing: false)

        provider.reportNewIncomingCall(with: uuid, update: update) { [weak self] error in
            guard let self = self else { completion(); return }

            if let error = error {
                NSLog("[CallKit] reportNewIncomingCall gagal: %@", error.localizedDescription)
                self.calls.removeValue(forKey: uuid)
                AudioSessionCoordinator.shared.endCallKitOwnership()
                completion()
                return
            }

            if malformed {
                NSLog("[CallKit] payload VoIP cacat -- panggilan diakhiri .failed")
                self.provider.reportCall(with: uuid, endedAt: Date(), reason: .failed)
                self.calls.removeValue(forKey: uuid)
                AudioSessionCoordinator.shared.endCallKitOwnership()
            }
            // TIDAK memancarkan 'ringing': di iOS layar dering milik CallKit.
            // Memancarkannya membuat CallOverlay ikut tampil dan menumpuk.
            completion()
        }
    }

    // FR-27. Pembatalan bisa tiba di proses BARU yang petanya kosong -- dan iOS
    // tetap menuntut setiap VoIP push dijawab dengan laporan panggilan.
    private func handleCancel(callId: String, completion: @escaping () -> Void) {
        let uuid = CallUuid.from(callId: callId)

        if calls[uuid] != nil {
            provider.reportCall(with: uuid, endedAt: Date(), reason: .remoteEnded)
            calls.removeValue(forKey: uuid)
            AudioSessionCoordinator.shared.endCallKitOwnership()
            emit(["kind": "ended", "callId": callId, "reason": "remote"])
            completion()
            return
        }

        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .generic, value: "Panggilan")
        provider.reportNewIncomingCall(with: uuid, update: update) { [weak self] _ in
            self?.provider.reportCall(with: uuid, endedAt: Date(), reason: .remoteEnded)
            completion()
        }
    }

    // MARK: - Diminta dari JS

    // Di iOS jawaban SELALU berasal dari CallKit, jadi ini hanya penyelarasan
    // state. Meminta CXAnswerCallAction di sini akan memantul balik lewat
    // delegate dan memancarkan 'answered' untuk kedua kalinya.
    func markAnswered(callId: String) {
        let uuid = CallUuid.from(callId: callId)
        calls[uuid]?.answered = true
    }

    func startOutgoing(callId: String, calleeName: String, hasVideo: Bool) {
        let uuid = CallUuid.from(callId: callId)
        if calls[uuid] != nil { return }

        AudioSessionCoordinator.shared.configureForCall()
        calls[uuid] = CallInfo(callId: callId, conversationId: "", callerId: "",
                               callerName: calleeName, hasVideo: hasVideo,
                               answered: true, outgoing: true)

        let action = CXStartCallAction(call: uuid, handle: CXHandle(type: .generic, value: calleeName))
        action.isVideo = hasVideo
        controller.request(CXTransaction(action: action)) { error in
            if let error = error {
                NSLog("[CallKit] CXStartCallAction gagal: %@", error.localizedDescription)
            }
        }
    }

    // FR-20
    func reportOutgoingConnected(callId: String) {
        let uuid = CallUuid.from(callId: callId)
        guard calls[uuid] != nil else { return }
        provider.reportOutgoingCall(with: uuid, connectedAt: Date())
    }

    // FR-18. reportCall(endedAt:) DISENGAJA, bukan CXEndCallAction: aksi akan
    // memicu delegate -> memancarkan peristiwa ke JS -> JS memanggil hangup
    // lagi. Laporan langsung menutup UI sistem tanpa memantul.
    func finishCall(callId: String, reason: String) {
        let uuid = CallUuid.from(callId: callId)
        guard calls[uuid] != nil else { return }
        provider.reportCall(with: uuid, endedAt: Date(), reason: mapReason(reason))
        calls.removeValue(forKey: uuid)
        AudioSessionCoordinator.shared.endCallKitOwnership()
    }

    // Arah aplikasi -> sistem. Gemanya kembali sebagai CXSetMutedCallAction,
    // tetapi App.tsx membandingkan state lebih dulu sehingga tidak berputar.
    func setMuted(callId: String, muted: Bool) {
        let uuid = CallUuid.from(callId: callId)
        guard calls[uuid] != nil else { return }
        let action = CXSetMutedCallAction(call: uuid, muted: muted)
        controller.request(CXTransaction(action: action)) { error in
            if let error = error {
                NSLog("[CallKit] CXSetMutedCallAction gagal: %@", error.localizedDescription)
            }
        }
    }

    // MARK: - Jembatan peristiwa

    private func emit(_ payload: [String: Any]) {
        if let handler = onEvent {
            handler(payload)
        } else {
            // WebView belum siap. Ini kondisi NORMAL saat aplikasi dibangunkan
            // VoIP push, bukan error.
            pending.append(payload)
        }
    }

    func consumePending() -> [[String: Any]] {
        let out = pending
        pending.removeAll()
        return out
    }

    private func mapReason(_ r: String) -> CXCallEndedReason {
        switch r {
        case "timeout": return .unanswered
        case "failed": return .failed
        default: return .remoteEnded
        }
    }

    // MARK: - CXProviderDelegate

    func providerDidReset(_ provider: CXProvider) {
        calls.removeAll()
        pending.removeAll()
        AudioSessionCoordinator.shared.endCallKitOwnership()
    }

    // FR-14
    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        guard var info = calls[action.callUUID] else { action.fail(); return }
        info.answered = true
        calls[action.callUUID] = info

        emit([
            "kind": "answered",
            "callId": info.callId,
            "callType": info.hasVideo ? "VIDEO" : "AUDIO",
            "conversationId": info.conversationId,
            "callerId": info.callerId,
            "callerName": info.callerName
        ])
        action.fulfill()
    }

    // FR-15 dan FR-16
    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        let uuid = action.callUUID
        if let info = calls[uuid] {
            if info.answered {
                emit(["kind": "ended", "callId": info.callId, "reason": "local"])
            } else {
                emit(["kind": "declined", "callId": info.callId])
            }
            calls.removeValue(forKey: uuid)
        }
        AudioSessionCoordinator.shared.endCallKitOwnership()
        action.fulfill()
    }

    // FR-17 arah sistem -> aplikasi
    func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        if let info = calls[action.callUUID] {
            emit(["kind": "muteRequested", "callId": info.callId, "muted": action.isMuted])
        }
        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        provider.reportOutgoingCall(with: action.callUUID, startedConnectingAt: Date())
        action.fulfill()
    }

    // FR-21 dan FR-22. Inilah izin untuk mulai memakai mikrofon: WebView baru
    // boleh menjalankan getUserMedia SETELAH titik ini. IosCallUi menahan
    // peristiwa 'answered' sampai sinyal ini tiba.
    func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
        let video = calls.values.first(where: { $0.answered })?.hasVideo ?? false
        AudioSessionCoordinator.shared.applyRouteAfterActivation(video: video)
        onAudioActive?()
    }

    // FR-23
    func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
        AudioSessionCoordinator.shared.endCallKitOwnership()
    }
}
