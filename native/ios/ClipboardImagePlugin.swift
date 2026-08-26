import Foundation
import UIKit
import Capacitor

// Padanan iOS dari ClipboardImagePlugin.java.
// Kontrak sama persis: copyUri({ uri }) -> void  (AttachmentImage.tsx:191)
//
// Android harus mengubah file:// menjadi content:// lewat FileProvider karena
// StrictMode melarang file:// diedarkan antar-app. iOS tidak punya batasan itu:
// berkas di Caches milik app sendiri boleh dibaca langsung.
//
// Catatan format: UIImage men-dekode lalu UIPasteboard menyimpan representasi
// gambar yang sudah dinormalkan. Efeknya sama dengan perbaikan WebP di sisi
// desktop (transcode ke PNG sebelum masuk clipboard Electron) -- format asli
// tidak dipertahankan, tapi menempel di aplikasi mana pun selalu berhasil.
@objc(ClipboardImagePlugin)
public class ClipboardImagePlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "ClipboardImagePlugin"
    public let jsName = "ClipboardImage"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "copyUri", returnType: CAPPluginReturnPromise)
    ]

    @objc func copyUri(_ call: CAPPluginCall) {
        guard let uriString = call.getString("uri") else {
            call.reject("uri wajib diisi")
            return
        }

        // Filesystem.getUri() di iOS mengembalikan file:///... , tapi terima
        // juga path polos supaya pemanggil tidak perlu tahu bedanya.
        let url: URL
        if uriString.hasPrefix("file://") {
            guard let parsed = URL(string: uriString) else {
                call.reject("uri tidak valid: \(uriString)")
                return
            }
            url = parsed
        } else {
            url = URL(fileURLWithPath: uriString)
        }

        do {
            let data = try Data(contentsOf: url)
            guard let image = UIImage(data: data) else {
                call.reject("Format gambar tidak dikenali")
                return
            }
            // UIPasteboard WAJIB disentuh dari main thread.
            DispatchQueue.main.async {
                UIPasteboard.general.image = image
                call.resolve()
            }
        } catch {
            call.reject("Gagal copy image: \(error.localizedDescription)")
        }
    }
}
