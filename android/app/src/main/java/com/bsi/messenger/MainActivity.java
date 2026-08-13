package com.bsi.messenger;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(ClipboardImagePlugin.class);
        registerPlugin(IncomingCallPlugin.class);
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
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
    private void handleIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getStringExtra("pendingCallAction");
        if (!"incoming".equals(action)) return;

        IncomingCallPlugin.setPending(
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
    }
}
