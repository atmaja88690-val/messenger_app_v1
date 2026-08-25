package com.bsi.messenger;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    // Ditandai foreground/tidak; BsimMessagingService pakai ini utk memutuskan
    // dering native call (skip kalau app sedang dibuka - web sudah tampilkan
    // panggilan lewat WS, hindari dobel).
    public static volatile boolean isAppForeground = false;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(ClipboardImagePlugin.class);
        registerPlugin(IncomingCallPlugin.class);
        registerPlugin(BatteryOptimizationPlugin.class);
        registerPlugin(AudioRoutePlugin.class);
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }

    @Override
    public void onResume() {
        super.onResume();
        isAppForeground = true;
    }

    @Override
    public void onPause() {
        super.onPause();
        isAppForeground = false;
    }

    // singleTask -> app sudah jalan di background dapat Intent baru lewat sini,
    // BUKAN onCreate baru. Wajib override supaya notif call tetap kebaca saat
    // app cuma background (bukan killed total).
    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    // Extras dari BsimMessagingService.buildCallIntent() (full-screen intent
    // notif call). Simpan ke IncomingCallPlugin (dibaca JS via
    // consumePendingCall()) + paksa layar tampil di atas lockscreen TANPA perlu
    // unlock dulu (ala telepon native) - efek yg diminta setFullScreenIntent.
    // Hentikan dering foreground service begitu user tekan "Jawab".
    private void stopIncomingCallRing() {
        try {
            startService(new Intent(this, IncomingCallService.class)
                .setAction(IncomingCallService.ACTION_STOP));
        } catch (Exception ignored) {}
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;
        String openConversationId = intent.getStringExtra("openConversationId");
        if (openConversationId != null) {
            IncomingCallPlugin.setPendingOpenConversation(openConversationId);
            return;
        }
        String ringingCall = intent.getStringExtra("ringingCallAction");
        if ("incoming".equals(ringingCall)) {
            IncomingCallPlugin.setPendingRinging(
                intent.getStringExtra("callId"),
                intent.getStringExtra("callType"),
                intent.getStringExtra("conversationId"),
                intent.getStringExtra("callerId"),
                intent.getStringExtra("callerName")
            );
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                setShowWhenLocked(true);
                setTurnScreenOn(true);
            } else {
                getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                    | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                );
            }
            return;
        }

        String action = intent.getStringExtra("pendingCallAction");
        if (!"incoming".equals(action)) return;

        IncomingCallPlugin.setPending(
            intent.getStringExtra("callId"),
            intent.getStringExtra("callType"),
            intent.getStringExtra("conversationId"),
            intent.getStringExtra("callerId"),
            intent.getStringExtra("callerName")
        );
        IncomingCallPlugin.emitAnswerNow();
        stopIncomingCallRing();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            );
        }
    }
}
