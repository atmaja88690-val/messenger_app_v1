package com.bsi.messenger;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioDeviceInfo;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.PowerManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

// Routing audio panggilan. WebView memutar audio WebRTC lewat stream MUSIK
// (selalu ke speaker) kecuali AudioManager dipaksa ke MODE_IN_COMMUNICATION.
// Voice call -> earpiece (ala WhatsApp), video call -> speaker.
// Headset kabel/Bluetooth SELALU menang atas keduanya.
@CapacitorPlugin(name = "AudioRoute")
public class AudioRoutePlugin extends Plugin {

    private AudioManager am;
    private PowerManager pm;
    private AudioFocusRequest focusRequest;
    private PowerManager.WakeLock proximityLock;

    private boolean active = false;
    private int savedMode = AudioManager.MODE_NORMAL;
    private boolean savedSpeakerphone = false;

    @Override
    public void load() {
        am = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
    }

    @PluginMethod
    public void startCall(PluginCall call) {
        if (am == null) { call.reject("AudioManager unavailable"); return; }
        boolean speaker = Boolean.TRUE.equals(call.getBoolean("speaker", false));
        if (!active) {
            savedMode = am.getMode();
            savedSpeakerphone = am.isSpeakerphoneOn();
            active = true;
        }
        requestFocus();
        am.setMode(AudioManager.MODE_IN_COMMUNICATION);
        JSObject ret = new JSObject();
        ret.put("speaker", applyRoute(speaker));
        call.resolve(ret);
    }

    @PluginMethod
    public void setSpeaker(PluginCall call) {
        if (am == null) { call.reject("AudioManager unavailable"); return; }
        boolean speaker = Boolean.TRUE.equals(call.getBoolean("speaker", false));
        if (am.getMode() != AudioManager.MODE_IN_COMMUNICATION) {
            am.setMode(AudioManager.MODE_IN_COMMUNICATION);
        }
        JSObject ret = new JSObject();
        ret.put("speaker", applyRoute(speaker));
        call.resolve(ret);
    }

    @PluginMethod
    public void stopCall(PluginCall call) {
        releaseProximity();
        if (am != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                try { am.clearCommunicationDevice(); } catch (Exception ignored) {}
            }
            if (active) {
                try { am.setSpeakerphoneOn(savedSpeakerphone); } catch (Exception ignored) {}
                try { am.setMode(savedMode); } catch (Exception ignored) {}
            }
        }
        abandonFocus();
        active = false;
        call.resolve();
    }

    // Balikan: true kalau audio akhirnya keluar lewat speaker.
    @SuppressWarnings("deprecation")
    private boolean applyRoute(boolean speaker) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            List<AudioDeviceInfo> devices = am.getAvailableCommunicationDevices();
            AudioDeviceInfo external = firstOf(devices,
                AudioDeviceInfo.TYPE_BLUETOOTH_SCO,
                AudioDeviceInfo.TYPE_BLE_HEADSET,
                AudioDeviceInfo.TYPE_WIRED_HEADSET,
                AudioDeviceInfo.TYPE_USB_HEADSET);
            if (external != null) {
                try { am.setCommunicationDevice(external); } catch (Exception ignored) {}
                releaseProximity();
                return false;
            }
            AudioDeviceInfo target = firstOf(devices, speaker
                ? AudioDeviceInfo.TYPE_BUILTIN_SPEAKER
                : AudioDeviceInfo.TYPE_BUILTIN_EARPIECE);
            if (target == null && !speaker) {
                // Tablet tanpa earpiece -> jatuh ke speaker, jangan bisu.
                target = firstOf(devices, AudioDeviceInfo.TYPE_BUILTIN_SPEAKER);
                speaker = true;
            }
            if (target != null) {
                try { am.setCommunicationDevice(target); } catch (Exception ignored) {}
            }
        } else {
            if (am.isWiredHeadsetOn() || am.isBluetoothScoOn()) {
                am.setSpeakerphoneOn(false);
                releaseProximity();
                return false;
            }
            am.setSpeakerphoneOn(speaker);
        }
        if (speaker) releaseProximity(); else acquireProximity();
        return speaker;
    }

    private AudioDeviceInfo firstOf(List<AudioDeviceInfo> devices, int... types) {
        for (int t : types) {
            for (AudioDeviceInfo d : devices) {
                if (d.getType() == t) return d;
            }
        }
        return null;
    }

    private void requestFocus() {
        if (am == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (focusRequest != null) return;
            AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build();
            focusRequest = new AudioFocusRequest
                .Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
                .setAudioAttributes(attrs)
                .build();
            try { am.requestAudioFocus(focusRequest); } catch (Exception ignored) {}
        } else {
            try {
                am.requestAudioFocus(null, AudioManager.STREAM_VOICE_CALL,
                    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE);
            } catch (Exception ignored) {}
        }
    }

    @SuppressWarnings("deprecation")
    private void abandonFocus() {
        if (am == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (focusRequest != null) {
                try { am.abandonAudioFocusRequest(focusRequest); } catch (Exception ignored) {}
                focusRequest = null;
            }
        } else {
            try { am.abandonAudioFocus(null); } catch (Exception ignored) {}
        }
    }

    // Layar mati saat HP menempel di telinga - wajib kalau audio di earpiece,
    // kalau tidak pipi menekan tombol hangup.
    private void acquireProximity() {
        if (pm == null || proximityLock != null) return;
        try {
            if (!pm.isWakeLockLevelSupported(PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK)) return;
            proximityLock = pm.newWakeLock(PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK, "bsim:call");
            proximityLock.setReferenceCounted(false);
            proximityLock.acquire(60 * 60 * 1000L);
        } catch (Exception ignored) {
            proximityLock = null;
        }
    }

    private void releaseProximity() {
        if (proximityLock == null) return;
        try { if (proximityLock.isHeld()) proximityLock.release(); } catch (Exception ignored) {}
        proximityLock = null;
    }

    @Override
    protected void handleOnDestroy() {
        releaseProximity();
        abandonFocus();
        super.handleOnDestroy();
    }
}
