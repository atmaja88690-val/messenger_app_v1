import Foundation
import PushKit

// PKPushRegistry harus didaftarkan saat aplikasi DILUNCURKAN, dari AppDelegate,
// bukan dari plugin Capacitor. Plugin baru hidup ketika WebView memuat --
// terlalu lambat untuk panggilan yang tiba saat aplikasi mati total.
final class VoipPushService: NSObject, PKPushRegistryDelegate {

    static let shared = VoipPushService()

    private var registry: PKPushRegistry?
    private(set) var token: String?

    var onToken: ((String) -> Void)?
    var onTokenInvalidated: (() -> Void)?

    private override init() { super.init() }

    func start() {
        if registry != nil { return }
        let r = PKPushRegistry(queue: .main)
        r.delegate = self
        r.desiredPushTypes = [.voIP]
        registry = r
    }

    // FR-2. Token VoIP BERBEDA dari device token APNs biasa; backend
    // menyimpannya sebagai baris PushToken tersendiri dengan platform IOS_VOIP.
    func pushRegistry(_ registry: PKPushRegistry,
                      didUpdate pushCredentials: PKPushCredentials,
                      for type: PKPushType) {
        guard type == .voIP else { return }
        let hex = pushCredentials.token.map { String(format: "%02x", $0) }.joined()
        token = hex
        onToken?(hex)
    }

    func pushRegistry(_ registry: PKPushRegistry,
                      didInvalidatePushTokenFor type: PKPushType) {
        guard type == .voIP else { return }
        token = nil
        onTokenInvalidated?()
    }

    // ATURAN KERAS: setiap jalur keluar di sini WAJIB melewati reportIncoming
    // dan memanggil completion. Satu return awal yang lupa membuat iOS
    // mematikan aplikasi dan mencabut hak VoIP push-nya -- dan gejalanya baru
    // muncul setelah beberapa panggilan, bukan langsung.
    func pushRegistry(_ registry: PKPushRegistry,
                      didReceiveIncomingPushWith payload: PKPushPayload,
                      for type: PKPushType,
                      completion: @escaping () -> Void) {
        guard type == .voIP else { completion(); return }
        CallKitCoordinator.shared.reportIncoming(
            payload: payload.dictionaryPayload,
            completion: completion
        )
    }
}
