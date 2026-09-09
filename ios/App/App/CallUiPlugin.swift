import Foundation
import Capacitor

// Jembatan JS <-> CallKit. TIPIS dengan sengaja: seluruh state dan aturan
// hidup di CallKitCoordinator, karena coordinator harus bekerja bahkan saat
// plugin ini belum ada.
//
// Semua metode RESOLVE, tidak pernah REJECT -- pelajaran dari
// BatteryOptimizationPlugin, di mana reject menghasilkan error palsu di log.
@objc(CallUiPlugin)
public class CallUiPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "CallUiPlugin"
    public let jsName = "CallUi"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "consumePending",     returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reportAnswered",     returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reportConnected",    returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reportCallFinished", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startOutgoing",      returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setMuted",           returnType: CAPPluginReturnPromise)
    ]

    override public func load() {
        // Sejak titik ini peristiwa mengalir langsung. Sebelumnya ia mengantre
        // di coordinator -- itu kondisi normal, bukan error.
        CallKitCoordinator.shared.onEvent = { [weak self] payload in
            self?.notifyListeners("callUiEvent", data: payload)
        }
        // Sinyal provider(_:didActivate:). IosCallUi menahan peristiwa
        // 'answered' sampai ini tiba, supaya getUserMedia tidak berjalan
        // sebelum CallKit mengaktifkan sesi audio.
        CallKitCoordinator.shared.onAudioActive = { [weak self] in
            self?.notifyListeners("audioSessionActive", data: [:])
        }
    }

    @objc func consumePending(_ call: CAPPluginCall) {
        call.resolve(["events": CallKitCoordinator.shared.consumePending()])
    }

    @objc func reportAnswered(_ call: CAPPluginCall) {
        if let id = call.getString("callId") {
            CallKitCoordinator.shared.markAnswered(callId: id)
        }
        call.resolve()
    }

    @objc func reportConnected(_ call: CAPPluginCall) {
        if let id = call.getString("callId") {
            CallKitCoordinator.shared.reportOutgoingConnected(callId: id)
        }
        call.resolve()
    }

    @objc func reportCallFinished(_ call: CAPPluginCall) {
        if let id = call.getString("callId") {
            CallKitCoordinator.shared.finishCall(
                callId: id,
                reason: call.getString("reason") ?? "local"
            )
        }
        call.resolve()
    }

    @objc func startOutgoing(_ call: CAPPluginCall) {
        if let id = call.getString("callId") {
            CallKitCoordinator.shared.startOutgoing(
                callId: id,
                calleeName: call.getString("calleeName") ?? "Panggilan",
                hasVideo: call.getBool("hasVideo") ?? false
            )
        }
        call.resolve()
    }

    @objc func setMuted(_ call: CAPPluginCall) {
        if let id = call.getString("callId") {
            CallKitCoordinator.shared.setMuted(
                callId: id,
                muted: call.getBool("muted") ?? false
            )
        }
        call.resolve()
    }
}
