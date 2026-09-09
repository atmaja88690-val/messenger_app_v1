import Foundation
import AVFoundation

// Tiga pihak sama-sama ingin memiliki AVAudioSession: CallKit, AudioRoutePlugin,
// dan mesin WebRTC di dalam WKWebView. Berkas ini satu-satunya titik kebenaran
// soal siapa yang sedang memiliki sesi.
//
// ATURAN KERAS (FR-21): saat panggilan dikendalikan CallKit, aplikasi TIDAK
// BOLEH memanggil setActive(true). Aktivasi datang dari CallKit lewat
// provider(_:didActivate:). Yang boleh kita lakukan lebih dulu hanyalah
// menyetel kategori dan mode -- dan itu memang harus dilakukan SEBELUM
// reportNewIncomingCall, bukan sesudahnya.
final class AudioSessionCoordinator {

    static let shared = AudioSessionCoordinator()
    private init() {}

    // Dibaca AudioRoutePlugin untuk melewati setActive(true).
    private(set) var callKitOwnsSession = false

    private var savedCategory: AVAudioSession.Category?
    private var savedMode: AVAudioSession.Mode?
    private var savedOptions: AVAudioSession.CategoryOptions = []

    // Dipanggil dari handler VoIP push DAN dari panggilan keluar, sebelum
    // panggilan dilaporkan ke CallKit.
    func configureForCall() {
        let session = AVAudioSession.sharedInstance()

        if !callKitOwnsSession {
            savedCategory = session.category
            savedMode = session.mode
            savedOptions = session.categoryOptions
            callKitOwnsSession = true
        }

        do {
            try session.setCategory(
                .playAndRecord,
                mode: .voiceChat,
                options: [.allowBluetooth, .allowBluetoothA2DP]
            )
        } catch {
            NSLog("[AudioSession] setCategory gagal: %@", error.localizedDescription)
        }
    }

    // FR-22: rute baru diterapkan SETELAH CallKit mengaktifkan sesi.
    // Panggilan suara ke earpiece, panggilan video ke pengeras suara --
    // aturan yang sama dengan AudioRoutePlugin, hanya waktunya yang berbeda.
    func applyRouteAfterActivation(video: Bool) {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.overrideOutputAudioPort(video ? .speaker : .none)
        } catch {
            NSLog("[AudioSession] overrideOutputAudioPort gagal: %@", error.localizedDescription)
        }
    }

    // FR-23: pulihkan kategori dan mode ke keadaan sebelum panggilan.
    // Tanpa ini, pemutaran audio biasa setelah panggilan bisa tetap terjebak
    // di mode voiceChat -- volumenya terdengar kecil tanpa sebab yang jelas.
    func endCallKitOwnership() {
        guard callKitOwnsSession else { return }
        callKitOwnsSession = false

        let session = AVAudioSession.sharedInstance()
        do {
            try session.overrideOutputAudioPort(.none)
            if let category = savedCategory, let mode = savedMode {
                try session.setCategory(category, mode: mode, options: savedOptions)
            }
        } catch {
            NSLog("[AudioSession] pemulihan gagal: %@", error.localizedDescription)
        }
        savedCategory = nil
        savedMode = nil
        savedOptions = []
    }
}
