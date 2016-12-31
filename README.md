# Huegasm

Music awesomeness for hue lights.

It lives at http://www.huegasm.com

## Current priorities
- create a hybrid app with Cardova

## SIGNING
/ember-cordova/platforms/android/release-signing.properties:
storeFile=huegasm.keystore
storeType=jks
keyAlias=huegasm
keyPassword=...
storePassword=...

keytool -genkey -v -keystore huegasm.keystore -alias huegasm -keyalg RSA -keysize 2048 -validity 10000

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
- case 'stop':

Just search for 'pause' and add the same type of event stuff for 'stop'. This is needed for properly split screening Huegasm with other apps.

## POSSIBLE FUTURE FEATURES
- decode the hue color better
- better visualizations
- beat settings by interval
- auto beat detection mode
- display player time when hovering over seek bar
