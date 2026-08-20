package com.bsi.messenger;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Jembatan native -> JS utk "call masuk tertunda" (dari full-screen intent
// notif call, lihat BsimMessagingService.buildCallIntent()). MainActivity
// mengisi static holder ini saat baca Intent extras; JS panggil
// consumePendingCall() sekali saat startup utk ambil & KONSUMSI (dikosongkan
// setelah dibaca - one-shot, supaya tak ke-trigger ulang saat HMR/remount).
@CapacitorPlugin(name = "IncomingCall")
public class IncomingCallPlugin extends Plugin {

    private static IncomingCallPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    // Dipanggil MainActivity saat user tekan "Jawab" di notif call. onNewIntent
    // (app sudah hidup) TIDAK memicu ulang useEffect consumePendingCall di web,
    // jadi kirim event ke JS supaya auto-accept SEGERA, kapan pun.
    static void emitAnswerNow() {
        if (instance != null) {
            instance.notifyListeners("answerNow", new JSObject());
        }
    }

    static String pendingCallId;
    static String pendingCallType;
    static String pendingConversationId;
    static String pendingCallerId;
    static String pendingCallerName;
    static String pendingOpenConversationId;
    static String pendingRingingCallId;
    static String pendingRingingCallType;
    static String pendingRingingConversationId;
    static String pendingRingingCallerId;
    static String pendingRingingCallerName;

    static void setPending(String callId, String callType, String conversationId,
                            String callerId, String callerName) {
        pendingCallId = callId;
        pendingCallType = callType;
        pendingConversationId = conversationId;
        pendingCallerId = callerId;
        pendingCallerName = callerName;
    }

    static void setPendingOpenConversation(String conversationId) {
        pendingOpenConversationId = conversationId;
    }

    static void setPendingRinging(String callId, String callType, String conversationId,
                            String callerId, String callerName) {
        pendingRingingCallId = callId;
        pendingRingingCallType = callType;
        pendingRingingConversationId = conversationId;
        pendingRingingCallerId = callerId;
        pendingRingingCallerName = callerName;
    }

    @PluginMethod
    public void consumePendingCall(PluginCall call) {
        if (pendingCallId == null) {
            call.resolve(new JSObject().put("pending", false));
            return;
        }
        JSObject result = new JSObject();
        result.put("pending", true);
        result.put("callId", pendingCallId);
        result.put("callType", pendingCallType);
        result.put("conversationId", pendingConversationId);
        result.put("callerId", pendingCallerId);
        result.put("callerName", pendingCallerName);

        pendingCallId = null;
        pendingCallType = null;
        pendingConversationId = null;
        pendingCallerId = null;
        pendingCallerName = null;

        call.resolve(result);
    }

    @PluginMethod
    public void consumePendingOpenConversation(PluginCall call) {
        if (pendingOpenConversationId == null) {
            call.resolve(new JSObject().put("pending", false));
            return;
        }
        JSObject result = new JSObject();
        result.put("pending", true);
        result.put("conversationId", pendingOpenConversationId);
        pendingOpenConversationId = null;
        call.resolve(result);
    }

    @PluginMethod
    public void consumePendingRingingCall(PluginCall call) {
        if (pendingRingingCallId == null) {
            call.resolve(new JSObject().put("pending", false));
            return;
        }
        JSObject result = new JSObject();
        result.put("pending", true);
        result.put("callId", pendingRingingCallId);
        result.put("callType", pendingRingingCallType);
        result.put("conversationId", pendingRingingConversationId);
        result.put("callerId", pendingRingingCallerId);
        result.put("callerName", pendingRingingCallerName);

        pendingRingingCallId = null;
        pendingRingingCallType = null;
        pendingRingingConversationId = null;
        pendingRingingCallerId = null;
        pendingRingingCallerName = null;

        call.resolve(result);
    }

    @PluginMethod
    public void stopIncomingRing(PluginCall call) {
        try {
            Intent i = new Intent(getContext(), IncomingCallService.class)
                .setAction(IncomingCallService.ACTION_STOP);
            getContext().startService(i);
        } catch (Exception ignored) {}
        call.resolve();
    }
}
