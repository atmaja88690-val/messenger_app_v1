package com.bsi.messenger;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.net.Uri;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Tulis gambar ke clipboard SISTEM Android via content:// URI (FileProvider).
// Android tak punya API publik utk tulis bitmap mentah langsung (beda dgn
// Electron clipboard.writeImage) - pola baku: ClipData.newUri ke ClipboardManager,
// aplikasi lain (WhatsApp/Chrome/dll) baca via URI itu saat paste.
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
            Uri uri = Uri.parse(uriString);
            ClipboardManager cm = (ClipboardManager) getContext().getSystemService(Context.CLIPBOARD_SERVICE);
            ClipData clip = ClipData.newUri(getContext().getContentResolver(), "Image", uri);
            cm.setPrimaryClip(clip);
            call.resolve();
        } catch (Exception e) {
            call.reject("Gagal copy image: " + e.getMessage());
        }
    }
}
