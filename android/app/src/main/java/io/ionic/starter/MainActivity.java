package io.ionic.starter;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

         // Registers the BridgePlugin
         // registerPlugin(com.getcapacitor.community.admob.AdMob.class);
    }
}