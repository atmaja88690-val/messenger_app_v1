package com.bsi.messenger;

import android.app.NotificationChannel;
import android.app.NotificationManager;
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

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        String title = data.get("title");
        String body = data.get("body");
        if (title != null || body != null) {
            String t = (title != null) ? title : "BSI Messenger";
            String b = (body != null) ? body : "";
            showNotification(t, b, data.get("messageId"));
        }
        super.onMessageReceived(remoteMessage);
    }

    private void showNotification(String title, String body, String messageId) {
        createChannel();
        int id = (messageId != null) ? messageId.hashCode() : (int) System.currentTimeMillis();
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(getApplicationInfo().icon)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH);
        try {
            NotificationManagerCompat.from(this).notify(id, b.build());
        } catch (SecurityException ignored) {
            // POST_NOTIFICATIONS belum di-grant (API33+); diminta di sisi JS saat login.
        }
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }
}
