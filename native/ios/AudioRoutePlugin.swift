import Foundation
import AVFoundation
import UIKit
import Capacitor

// Padanan iOS dari AudioRoutePlugin.java.
// NAMA PLUGIN ("AudioRoute") HARUS SAMA PERSIS dengan versi Android --
// di situlah polimorfismenya: registerPlugin('AudioRoute') di TypeScript
// memanggil berkas ini di iOS dan berkas .java di Android, tanpa percabangan.
//
// Kontrak yang dipenuhi (lihat src/renderer/src/services/audio-route.service.ts):
//   startCall({speaker}) -> {speaker}
//   setSpeaker({speaker}) -> {speaker}
//   stopCall()
// Balikan "speaker" adalah rute yang BENAR-BENAR terpakai, bukan yang diminta.
@objc(AudioRoutePlugin)
public class AudioRoutePlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "AudioRoutePlugin"
    public let jsName = "AudioRoute"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startCall",  returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setSpeaker", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopCall",   returnType: CAPPluginReturnPromise)
    ]

    private let session = AVAudioSession.sharedInstance()
    private var active = false

    @objc func startCall(_ call: CAPPluginCall) {
        let speaker = call.getBool("speaker") ?? false
        do {
            // .voiceChat = mode panggilan suara: default keluar ke EARPIECE,
            // echo cancellation aktif. Inilah padanan MODE_IN_COMMUNICATION.
            // .allowBluetooth mengaktifkan HFP supaya headset BT bisa dipakai
            // dua arah (A2DP sengaja TIDAK dipakai: output-only, mic mati).
            try session.setCategory(.playAndRecord,
                                    mode: .voiceChat,
                                    options: [.allowBluetooth])
            try session.setActive(true)
            active = true
            call.resolve(["speaker": applyRoute(speaker)])
        } catch {
            call.reject("Gagal menyiapkan AVAudioSession: \(error.localizedDescription)")
        }
    }

    @objc func setSpeaker(_ call: CAPPluginCall) {
        let speaker = call.getBool("speaker") ?? false
        call.resolve(["speaker": applyRoute(speaker)])
    }

    @objc func stopCall(_ call: CAPPluginCall) {
        setProximity(false)
        if active {
            try? session.overrideOutputAudioPort(.none)
            // notifyOthersOnDeactivation: musik/podcast yang tadi kita hentikan
            // boleh lanjut sendiri. Padanan abandonAudioFocus di Android.
            try? session.setActive(false, options: [.notifyOthersOnDeactivation])
            active = false
        }
        call.resolve()
    }

    // MARK: - Rute

    // Balikan: true kalau audio akhirnya keluar lewat loudspeaker.
    private func applyRoute(_ speaker: Bool) -> Bool {
        // Headset kabel/Bluetooth SELALU menang -- perilaku ini sengaja
        // dibuat identik dengan AudioRoutePlugin.java supaya UI tombol
        // speaker berperilaku sama di kedua platform.
        if hasExternalOutput() {
            try? session.overrideOutputAudioPort(.none)
            setProximity(false)
            return false
        }
        do {
            try session.overrideOutputAudioPort(speaker ? .speaker : .none)
        } catch {
            print("[AudioRoute] overrideOutputAudioPort gagal: \(error)")
        }
        // iPad tanpa earpiece: rute jatuh ke speaker sendiri, isSpeakerActive()
        // yang menentukan -- jangan percaya nilai yang diminta.
        let actual = isSpeakerActive()
        setProximity(!actual)
        return actual
    }

    private func hasExternalOutput() -> Bool {
        let external: Set<AVAudioSession.Port> = [
            .bluetoothHFP, .bluetoothA2DP, .bluetoothLE,
            .headphones, .headsetMic, .usbAudio, .carAudio
        ]
        return session.currentRoute.outputs.contains { external.contains($0.portType) }
    }

    private func isSpeakerActive() -> Bool {
        session.currentRoute.outputs.contains { $0.portType == .builtInSpeaker }
    }

    // Padanan PROXIMITY_SCREEN_OFF_WAKE_LOCK Android, tapi jauh lebih ringkas:
    // iOS yang mengurus mematikan & menyalakan layarnya. WAJIB di main thread.
    private func setProximity(_ on: Bool) {
        DispatchQueue.main.async {
            UIDevice.current.isProximityMonitoringEnabled = on
        }
    }
}
