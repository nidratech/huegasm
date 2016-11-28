# Huegasm

Music awesomeness for hue lights.

It lives at http://www.huegasm.com

## Current priorities
- create a hybrid app with Cardova

## WTF moments
Cordova disables the volume buttons for some reason. Monkey patching:
Comment out the webView.setButtonPlumbedToJs lines for volume buttons from its source code before building android.

## POSSIBLE FUTURE FEATURES
- decode the hue color better
- better visualizations
- beat settings by interval
- auto beat detection mode
- display player time when hovering over seek bar
