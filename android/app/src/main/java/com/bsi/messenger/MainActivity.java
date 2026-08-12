package com.bsi.messenger;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(ClipboardImagePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
