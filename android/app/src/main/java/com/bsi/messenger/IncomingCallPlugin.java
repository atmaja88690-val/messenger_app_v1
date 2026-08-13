package com.bsi.messenger;

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

    static String pendingCallId;
    static String pendingCallType;
    static String pendingConversationId;
    static String pendingCallerId;
    static String pendingCallerName;

    static void setPending(String callId, String callType, String conversationId,
                            String callerId, String callerName) {
        pendingCallId = callId;
        pendingCallType = callType;
        pendingConversationId = conversationId;
        pendingCallerId = callerId;
        pendingCallerName = callerName;
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
}
