package com.bsi.messenger;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;

// Foreground service panggilan masuk ala WhatsApp: dering berulang + getar,
// notifikasi CallStyle (tombol Jawab/Tolak), full-screen saat layar terkunci.
// Dimulai oleh BsimMessagingService saat FCM "call" tiba (app hidup maupun mati).
public class IncomingCallService extends Service {

    static final String ACTION_INCOMING = "com.bsi.messenger.action.INCOMING_CALL";
    static final String ACTION_ANSWER   = "com.bsi.messenger.action.ANSWER_CALL";
    static final String ACTION_DECLINE  = "com.bsi.messenger.action.DECLINE_CALL";
    static final String ACTION_STOP     = "com.bsi.messenger.action.STOP_RING";

    private static final String CALL_CHANNEL_ID = "bsim_calls";
    private static final String CALL_CHANNEL_NAME = "Calls";
    private static final int CALL_NOTIF_ID = 42424;
    private static final long RING_TIMEOUT_MS = 45000L;

    private MediaPlayer player;
    private Vibrator vibrator;
    private final Handler timeoutHandler = new Handler(Looper.getMainLooper());
    private boolean ringing = false;

    @Nullable
    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = (intent != null) ? intent.getAction() : null;
        if (ACTION_ANSWER.equals(action)) {
            answer(intent);
        } else if (ACTION_DECLINE.equals(action) || ACTION_STOP.equals(action)) {
            stopEverything();
        } else {
            startRinging(intent);
        }
        return START_NOT_STICKY;
    }

    private void startRinging(Intent intent) {
        createChannel();
        Notification notif = buildCallNotification(intent);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(CALL_NOTIF_ID, notif,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(CALL_NOTIF_ID, notif);
            }
        } catch (Exception e) {
            try { NotificationManagerCompat.from(this).notify(CALL_NOTIF_ID, notif); }
            catch (SecurityException ignored) {}
        }
        if (!ringing) {
            ringing = true;
            startRingtone();
            startVibration();
            timeoutHandler.postDelayed(this::stopEverything, RING_TIMEOUT_MS);
        }
    }

    private void startRingtone() {
        try {
            Uri uri = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_RINGTONE);
            if (uri == null) uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            player = new MediaPlayer();
            player.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build());
            player.setDataSource(this, uri);
            player.setLooping(true);
            player.prepare();
            player.start();
        } catch (Exception ignored) {}
    }

    private void startVibration() {
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator == null || !vibrator.hasVibrator()) return;
        long[] pattern = { 0, 1000, 1000 };
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
        } else {
            vibrator.vibrate(pattern, 0);
        }
    }

    private void answer(Intent intent) {
        stopRingtoneAndVibration();
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launch == null) launch = new Intent();
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        launch.putExtra("pendingCallAction", "incoming");
        copyCallExtras(intent, launch);
        try { startActivity(launch); } catch (Exception ignored) {}
        stopEverything();
    }

    private void stopEverything() {
        stopRingtoneAndVibration();
        timeoutHandler.removeCallbacksAndMessages(null);
        try { stopForeground(true); } catch (Exception ignored) {}
        stopSelf();
    }

    private void stopRingtoneAndVibration() {
        ringing = false;
        if (player != null) {
            try { if (player.isPlaying()) player.stop(); } catch (Exception ignored) {}
            try { player.release(); } catch (Exception ignored) {}
            player = null;
        }
        if (vibrator != null) {
            try { vibrator.cancel(); } catch (Exception ignored) {}
            vibrator = null;
        }
    }

    @Override
    public void onDestroy() {
        stopRingtoneAndVibration();
        timeoutHandler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CALL_CHANNEL_ID, CALL_CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("Panggilan masuk NNI Messenger");
            ch.setSound(null, null);
            ch.enableVibration(false);
            try { ch.setBypassDnd(true); } catch (Exception ignored) {}
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    private Notification buildCallNotification(Intent intent) {
        String callerName = intent != null ? intent.getStringExtra("callerName") : null;
        String callType = intent != null ? intent.getStringExtra("callType") : null;
        String name = (callerName != null) ? callerName : "Someone";
        boolean isVideo = "VIDEO".equals(callType);

        Person caller = new Person.Builder().setName(name).build();
        PendingIntent answerPI = answerActivityPI(intent);
        PendingIntent declinePI = servicePI(ACTION_DECLINE, intent, 1002);
        PendingIntent fullScreenPI = fullScreenActivityPI(intent);

        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CALL_CHANNEL_ID)
            .setSmallIcon(getApplicationInfo().icon)
            .setContentTitle(name)
            .setContentText(isVideo ? "Incoming video call" : "Incoming voice call")
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true)
            .setAutoCancel(false)
            .setFullScreenIntent(fullScreenPI, true)
            .setStyle(NotificationCompat.CallStyle.forIncomingCall(caller, declinePI, answerPI));
        return b.build();
    }

    private PendingIntent servicePI(String action, Intent src, int reqCode) {
        Intent i = new Intent(this, IncomingCallService.class).setAction(action);
        copyCallExtras(src, i);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return PendingIntent.getForegroundService(this, reqCode, i, flags);
        }
        return PendingIntent.getService(this, reqCode, i, flags);
    }

    // Tombol "Jawab": launch Activity LANGSUNG (getActivity), sama persis dgn
    // tap notif PESAN yg sudah terbukti andal. getActivity dari aksi notif
    // DIKECUALIKAN dari batasan background-activity-launch, jadi data call pasti
    // sampai & pendingCallAction diproses -> web auto-accept. (getForegroundService
    // -> startActivity lama diblokir Android 10+ shg app cuma buka ke daftar.)
    private PendingIntent answerActivityPI(Intent src) {
        // Komponen LANGSUNG (bukan launcher intent) + SINGLE_TOP -> extras SELALU
        // terkirim ke onNewIntent, baik app cold maupun warm (launcher intent utk
        // singleTask cuma memunculkan task tanpa antar extras -> buka ke daftar).
        Intent launch = new Intent(this, MainActivity.class);
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        launch.putExtra("pendingCallAction", "incoming");
        copyCallExtras(src, launch);
        return PendingIntent.getActivity(this, 2001, launch,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private PendingIntent fullScreenActivityPI(Intent src) {
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launch == null) launch = new Intent();
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        launch.putExtra("ringingCallAction", "incoming");
        copyCallExtras(src, launch);
        return PendingIntent.getActivity(this, 1003, launch,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private void copyCallExtras(Intent src, Intent dst) {
        if (src == null) return;
        dst.putExtra("callId", src.getStringExtra("callId"));
        dst.putExtra("callType", src.getStringExtra("callType"));
        dst.putExtra("conversationId", src.getStringExtra("conversationId"));
        dst.putExtra("callerId", src.getStringExtra("callerId"));
        dst.putExtra("callerName", src.getStringExtra("callerName"));
    }
}
