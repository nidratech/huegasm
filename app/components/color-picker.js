import Em from 'ember';

export default Em.Component.extend({
  classNames:['colorpicker'],

  // https://dzone.com/articles/creating-your-own-html5
  didInsertElement: function(){
    // handle color changes
    var self = this,
      canvas = Em.$('#picker')[0].getContext('2d'),
      image = new Image();

    image.src ='assets/images/colorwheel.png';
    image.onload = function () {
      canvas.drawImage(image, 0, 0, image.width, image.height); // draw the image on the canvas
    };
  },

  // http://www.developers.meethue.com/documentation/color-conversions-rgb-xy
  rgbToXy: function(red, green, blue){
    var X, Y, Z, x, y;

    // normalize
    red = Number((red/255).toFixed(2));
    green = Number((green/255).toFixed(2));
    blue = Number((blue/255).toFixed(2));

    // gamma correction
    red = (red > 0.04045) ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : (red / 12.92);
    green = (green > 0.04045) ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4) : (green / 12.92);
    blue = (blue > 0.04045) ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4) : (blue / 12.92);

    // RGB to XYZ
    X = red * 0.664511 + green * 0.154324 + blue * 0.162028;
    Y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
    Z = red * 0.000088 + green * 0.072310 + blue * 0.986039;

    x = X / (X + Y + Z);
    y = Y / (X + Y + Z);

    return [x,y];
  },

  xyTorgb: function(x, y){
    var r, g, b, X, Y, Z, activeLights = this.get('activeLights'), lightsData = this.get('lightsData');

    z = 1 - x - y;
    Y = lightsData[activeLights[0]].state.bri;
    X = (Y / y) * x;
    Z = (Y / y) * z;

    r =  X * 1.656492 - Y * 0.354851 - Z * 0.255038;
    g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
    b =  X * 0.051713 - Y * 0.121364 + Z * 1.011530;

    r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
    g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
    b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;

    r = Math.floor(r * 255);
    g = Math.floor(g * 255);
    b = Math.floor(b * 255);

    return [r, g, b];
  }
});
