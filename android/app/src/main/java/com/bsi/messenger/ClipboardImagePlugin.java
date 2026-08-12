package com.bsi.messenger;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

// Tulis gambar ke clipboard SISTEM Android via content:// URI (FileProvider).
// Filesystem.getUri() (JS) balikin URI berskema file:// -- Android StrictMode
// MELARANG file:// diedarkan ke app lain (FileUriExposedException). Plugin
// resmi @capacitor/share sudah otomatis convert file://->content:// via
// FileProvider; kita replikasi konversi yg sama di sini (pakai FileProvider
// yg SUDAH terpasang utk Share, authority=${applicationId}.fileprovider).
@CapacitorPlugin(name = "ClipboardImage")
public class ClipboardImagePlugin extends Plugin {

    @PluginMethod
    public void copyUri(PluginCall call) {
        String uriString = call.getString("uri");
        if (uriString == null) {
            call.reject("uri wajib diisi");
            return;
        }
        try {
            Uri rawUri = Uri.parse(uriString);
            Uri contentUri;
            if ("file".equals(rawUri.getScheme())) {
                File file = new File(rawUri.getPath());
                String authority = getContext().getPackageName() + ".fileprovider";
                contentUri = FileProvider.getUriForFile(getContext(), authority, file);
            } else {
                contentUri = rawUri;
            }
            ClipboardManager cm = (ClipboardManager) getContext().getSystemService(Context.CLIPBOARD_SERVICE);
            ClipData clip = ClipData.newUri(getContext().getContentResolver(), "Image", contentUri);
            cm.setPrimaryClip(clip);
            call.resolve();
        } catch (Exception e) {
            call.reject("Gagal copy image: " + e.getMessage());
        }
    }
}
