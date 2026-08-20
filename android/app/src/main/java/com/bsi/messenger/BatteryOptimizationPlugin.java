package com.bsi.messenger;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Minta pengecualian battery optimization -- OEM agresif (TECNO/Transsion HiOS,
// Xiaomi MIUI, Oppo ColorOS dsb) membersihkan notifikasi & mematikan proses app
// di background walau notifikasi sudah tampil (root cause "notif hilang total
// dari shade"). Android sejak M (API 23) sediakan whitelist resmi via
// PowerManager -- app yang di-whitelist tidak kena Doze/App Standby. Dialog
// sistem (ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS), bukan dialog custom --
// user tinggal tap Allow.
@CapacitorPlugin(name = "BatteryOptimization")
public class BatteryOptimizationPlugin extends Plugin {

    @PluginMethod
    public void isIgnoringBatteryOptimizations(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            ret.put("ignoring", true); // API <23 tidak punya Doze, anggap aman
            call.resolve(ret);
            return;
        }
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        boolean ignoring = pm != null
            && pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
        ret.put("ignoring", ignoring);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            call.resolve();
            return;
        }
        try {
            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            // Beberapa custom ROM tidak sediakan dialog ini -- gagal diam,
            // JS tetap lanjut normal (tidak boleh ganggu app).
            call.reject("Gagal membuka dialog battery optimization: " + e.getMessage());
        }
    }
}
