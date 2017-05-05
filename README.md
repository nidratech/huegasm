# Huegasm

Music awesomeness for hue lights.

It lives at http://www.huegasm.com and on https://play.google.com/store/apps/details?id=com.hoboman313.huegasm

Support me by paying for https://chrome.google.com/webstore/detail/huegasm-for-philips-hue-l/mbjanbdhcpohhfecjgbdpcfhnnbofooj

## Future
This app ( huegasm.com and huegasm mobile ) are not under active development. Currently my focus has shifted towards the Chrome extension linked above as well as creating new, premium, native Android and iOS apps.

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
- channel.onStop = cordova.addDocumentEventHandler('stop');
- case 'stop': after case 'pause':
- add <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" /> to Android manifest

Just search for 'pause' and add the same type of event stuff for 'stop'. This is needed for properly split screening Huegasm with other apps.
