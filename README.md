# Huegasm

Music awesomeness for hue lights.

It lives at http://www.huegasm.com and on https://play.google.com/store/apps/details?id=com.hoboman313.huegasm

## Current priorities
- create a Huegasm Chrome extension

## SIGNING
/ember-cordova/platforms/android/release-signing.properties:
storeFile=huegasm.keystore
storeType=jks
keyAlias=huegasm
keyPassword=...
storePassword=...

## LE MONKEY PATCHES
- webView.setVerticalScrollBarEnabled(true);
- @Override
 public void handleStop() {
     if (!isInitialized()) {
         return;
     }

     sendJavascriptEvent("stop");

     pluginManager.onStop();
 }
- channel.onStop = cordova.addDocumentEventHandler('stop'); from channel.onDeviceReady = cordova.addStickyDocumentEventHandler('deviceready');
- case 'stop': after case 'pause':
- add  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" /> to Android manifest

Just search for 'pause' and add the same type of event stuff for 'stop'. This is needed for properly split screening Huegasm with other apps.
