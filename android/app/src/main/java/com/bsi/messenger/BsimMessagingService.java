package com.bsi.messenger;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

// Override service FCM bawaan @capacitor/push-notifications.
// Bawaan cuma forward ke JS bridge (mati saat app killed). Service ini bangun
// notifikasi NATIVE langsung dari data-only payload -> tampil walau app
// foreground/background/killed. super.onMessageReceived tetap dipanggil supaya
// listener JS jalan saat app hidup, dan onNewToken plugin diwarisi (refresh token).
public class BsimMessagingService extends MessagingService {

    private static final String CHANNEL_ID = "bsim_messages";
    private static final String CHANNEL_NAME = "Messages";

    private static final String CALL_CHANNEL_ID = "bsim_calls";
    private static final String CALL_CHANNEL_NAME = "Calls";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        String type = data.get("type");
        if ("call".equals(type)) {
            startIncomingCall(data);
        } else {
            String title = data.get("title");
            String body = data.get("body");
            if (title != null || body != null) {
                String t = (title != null) ? title : "BSI Messenger";
                String b = (body != null) ? body : "";
                showNotification(t, b, data.get("messageId"), data.get("conversationId"));
            }
        }
        super.onMessageReceived(remoteMessage);
    }

    private void showNotification(String title, String body, String messageId, String conversationId) {
        createChannel(CHANNEL_ID, CHANNEL_NAME);
        int id = (messageId != null) ? messageId.hashCode() : (int) System.currentTimeMillis();
        PendingIntent openIntent = buildOpenAppIntent(conversationId, id);
        // Full-screen intent utk notif pesan (bukan cuma call). App INTERNAL
        // perusahaan, bukan Play Store -- kebijakan USE_FULL_SCREEN_INTENT
        // Android 14+ (dibatasi utk call/alarm) diterima sebagai trade-off.
        // Android hanya benar2 ambil alih layar saat HP terkunci/idle; saat
        // HP aktif dipakai otomatis turun jadi heads-up biasa (tidak berubah
        // dari perilaku sekarang).
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(getApplicationInfo().icon)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(openIntent)
            .setFullScreenIntent(openIntent, true)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setPriority(NotificationCompat.PRIORITY_HIGH);
        try {
            NotificationManagerCompat.from(this).notify(id, b.build());
        } catch (SecurityException ignored) {
            // POST_NOTIFICATIONS belum di-grant (API33+); diminta di sisi JS saat login.
        }
    }

    private void createChannel(String channelId, String channelName) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                channelId, channelName, NotificationManager.IMPORTANCE_HIGH);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    // Notif panggilan masuk - channel terpisah dari pesan (suara/getar beda).
    // Fase A: tap = buka app (default). Fase B (belum): setFullScreenIntent +
    // layar accept/decline dari lockscreen ala WhatsApp.
    // Panggilan masuk ala WhatsApp: delegasi ke IncomingCallService (dering
    // loop + getar + notif CallStyle). Kalau app sedang dibuka, web sudah
    // menampilkan panggilan lewat WS -> skip supaya tidak dering dobel.
    private void startIncomingCall(Map<String, String> data) {
        if (MainActivity.isAppForeground) return;
        Intent svc = new Intent(this, IncomingCallService.class)
            .setAction(IncomingCallService.ACTION_INCOMING);
        svc.putExtra("callId", data.get("callId"));
        svc.putExtra("callType", data.get("callType"));
        svc.putExtra("conversationId", data.get("conversationId"));
        svc.putExtra("callerId", data.get("callerId"));
        svc.putExtra("callerName", data.get("callerName"));
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(svc);
            } else {
                startService(svc);
            }
        } catch (Exception ignored) {}
    }

    private void showCallNotification(Map<String, String> data) {
        createChannel(CALL_CHANNEL_ID, CALL_CHANNEL_NAME);
        String callerName = data.get("callerName");
        String callType = data.get("callType");
        String name = (callerName != null) ? callerName : "Someone";
        boolean isVideo = "VIDEO".equals(callType);
        String title = (isVideo ? "Incoming video call from " : "Incoming call from ") + name;
        String callId = data.get("callId");
        int id = (callId != null) ? callId.hashCode() : (int) System.currentTimeMillis();
        PendingIntent fullScreenIntent = buildCallIntent(data, id);
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CALL_CHANNEL_ID)
            .setSmallIcon(getApplicationInfo().icon)
            .setContentTitle(title)
            .setContentText("Tap to open BSI Messenger")
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setAutoCancel(true)
            .setContentIntent(fullScreenIntent)
            .setFullScreenIntent(fullScreenIntent, true)
            .setPriority(NotificationCompat.PRIORITY_HIGH);
        try {
            NotificationManagerCompat.from(this).notify(id, b.build());
        } catch (SecurityException ignored) {
            // POST_NOTIFICATIONS belum di-grant (API33+).
        }
    }

    // PendingIntent utk buka app saat notif pesan di-tap. requestCode UNIK
    // (id notif) spy tiap notif pesan bawa conversationId sendiri2 - identity
    // PendingIntent itu requestCode+action+data, BUKAN extras, jadi requestCode
    // fix=0 lama bisa bikin extras ke-timpa notif lain.
    private PendingIntent buildOpenAppIntent(String conversationId, int requestCode) {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launchIntent == null) launchIntent = new Intent();
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (conversationId != null) {
            launchIntent.putExtra("openConversationId", conversationId);
        }
        return PendingIntent.getActivity(
            this, requestCode, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    // PendingIntent khusus call - requestCode UNIK (id notif) supaya tak
    // timpa buildOpenAppIntent() (notif pesan, requestCode=0 tetap). Bawa
    // extras call utk dibaca MainActivity (Fase B: buka CallOverlay langsung).
    private PendingIntent buildCallIntent(Map<String, String> data, int requestCode) {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launchIntent == null) launchIntent = new Intent();
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        launchIntent.putExtra("pendingCallAction", "incoming");
        launchIntent.putExtra("callId", data.get("callId"));
        launchIntent.putExtra("callType", data.get("callType"));
        launchIntent.putExtra("conversationId", data.get("conversationId"));
        launchIntent.putExtra("callerId", data.get("callerId"));
        launchIntent.putExtra("callerName", data.get("callerName"));
        return PendingIntent.getActivity(
            this, requestCode, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
