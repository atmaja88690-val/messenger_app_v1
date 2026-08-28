import Foundation
import Capacitor

// Plugin TERPISAH dari CallUi, dan itu disengaja: CallUi mengurus UI panggilan,
// VoipPush mengurus token. Layanan push di TypeScript tidak boleh mengimpor
// plugin panggilan hanya untuk mengambil token -- itu membocorkan lapisan
// platform yang sudah kita bangun.
@objc(VoipPushPlugin)
public class VoipPushPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "VoipPushPlugin"
    public let jsName = "VoipPush"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "register", returnType: CAPPluginReturnPromise)
    ]

    override public func load() {
        VoipPushService.shared.onToken = { [weak self] token in
            self?.notifyListeners("voipToken", data: ["token": token])
        }
        VoipPushService.shared.onTokenInvalidated = { [weak self] in
            self?.notifyListeners("voipTokenInvalidated", data: [:])
        }
    }

    // Idempoten. Kalau AppDelegate sudah mendaftarkan PushKit saat peluncuran
    // dan tokennya sudah tiba, kembalikan langsung; kalau belum, token akan
    // menyusul lewat peristiwa 'voipToken'.
    @objc func register(_ call: CAPPluginCall) {
        VoipPushService.shared.start()
        if let t = VoipPushService.shared.token {
            call.resolve(["token": t])
        } else {
            call.resolve([:])
        }
    }
}
