import Em from 'ember';

export default Em.Component.extend({
  classNames:['colorpicker'],

  rgb: null,

  canvas: null,
  canvasContext: null,

  actions: {
    colorSelect: function() {
      var canvasOffset = Em.$(this.get('canvas')).offset();
      var canvasX = Math.floor(event.pageX - canvasOffset.left), canvasY = Math.floor(event.pageY - canvasOffset.top);

      // get current pixel
      var imageData = this.get('canvasContext').getImageData(canvasX, canvasY, 1, 1);
      var pixel = imageData.data;

      if( !(pixel[0] === 0 && pixel[1] === 0 && pixel[2] === 0) ) {
        this.set('rgb', [pixel[0], pixel[1], pixel[2]]);
      }
    }
  },

  // https://dzone.com/articles/creating-your-own-html5
  didInsertElement: function(){
    // handle color changes
    var canvas = Em.$('#picker')[0],
      canvasContext = canvas.getContext('2d'),
      image = new Image();

    image.src ='assets/images/colormap.png';
    image.onload = function () {
      canvasContext.drawImage(image, 0, 0, image.width, image.height); // draw the image on the canvas
    };

    this.setProperties({
      canvas: canvas,
      canvasContext: canvasContext
    });
  }
});
