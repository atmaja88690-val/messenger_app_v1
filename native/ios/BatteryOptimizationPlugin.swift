import Foundation
import Capacitor

// Padanan iOS dari BatteryOptimizationPlugin.java -- dan sengaja TIDAK
// melakukan apa pun, karena memang tidak ada yang bisa dilakukan.
//
// Android punya Doze/App Standby yang membunuh proses app di background
// (root cause "notif hilang total dari shade" pada OEM agresif), sehingga
// perlu meminta whitelist lewat dialog sistem. iOS tidak punya konsep itu:
// APNs mengantar notifikasi ke sistem, bukan ke proses app, jadi app boleh
// mati total tanpa kehilangan notifikasi.
//
// KENAPA "ignoring: true": pertanyaan sebenarnya dari pemanggil (lihat
// battery-optimization.service.ts) adalah "perlu minta pengecualian ke user?"
// Di iOS jawabannya TIDAK. Mengembalikan false akan membuat App.tsx memanggil
// requestIgnoreBatteryOptimizations() yang tak punya dialog untuk dibuka.
//
// "supported: false" ditambahkan supaya UI Settings di masa depan bisa
// membedakan "aman" dari "tidak berlaku" -- jangan tampilkan centang hijau
// di iOS seolah ada pengecualian yang berhasil dipasang.
@objc(BatteryOptimizationPlugin)
public class BatteryOptimizationPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "BatteryOptimizationPlugin"
    public let jsName = "BatteryOptimization"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isIgnoringBatteryOptimizations", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestIgnoreBatteryOptimizations", returnType: CAPPluginReturnPromise)
    ]

    @objc func isIgnoringBatteryOptimizations(_ call: CAPPluginCall) {
        call.resolve(["ignoring": true, "supported": false])
    }

    @objc func requestIgnoreBatteryOptimizations(_ call: CAPPluginCall) {
        // No-op yang SUKSES. Jangan reject: battery-optimization.service.ts
        // membungkusnya dengan try/catch dan akan mencatat error palsu.
        call.resolve()
    }
}
