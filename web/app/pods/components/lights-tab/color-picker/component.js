import Ember from 'ember';

const { Component, $, run: { next } } = Ember;

export default Component.extend({
  elementId: 'color-picker',
  rgb: null,
  canvas: null,
  canvasContext: null,
  pressingDown: false,

  // for mobile
  touchStop() {
    this.set('pressingDown', false);
  },

  touchMove(event) {
    if (this.get('pressingDown')) {
      this.mouseDown(event);
    }
  },

  touchStart() {
    this.set('pressingDown', true);
  },

  mouseUp() {
    this.set('pressingDown', false);
  },

  mouseMove(event) {
    if (this.get('pressingDown')) {
      this.mouseDown(event);
    }
  },

  mouseDown(event) {
    let canvasOffset = $(this.get('canvas')).offset(),
      pageOffsetX = event.pageX === undefined ? event.originalEvent.touches[0].pageX : event.pageX,
      pageOffsetY = event.pageY === undefined ? event.originalEvent.touches[0].pageY : event.pageY,
      canvasX = Math.floor(pageOffsetX - canvasOffset.left),
      canvasY = Math.floor(pageOffsetY - canvasOffset.top);

    // get current pixel
    let imageData = this.get('canvasContext').getImageData(canvasX, canvasY, 1, 1),
      pixel = imageData.data;

    this.set('pressingDown', true);

    if (!(pixel[0] === 0 && pixel[1] === 0 && pixel[2] === 0)) {
      this.setProperties({
        rgb: [pixel[0], pixel[1], pixel[2]],
        showPointer: true
      });

      next(() => {
        $('#picker-pointer').css({
          opacity: 1,
          top: canvasY,
          left: canvasX,
          background: 'rgb(' + pixel[0] + ',' + pixel[1] + ',' + pixel[2] + ')'
        });
      });
    }
  },

  // https://dzone.com/articles/creating-your-own-html5
  didInsertElement() {
    // handle color changes
    let canvas = $('#picker')[0],
      canvasContext = canvas.getContext('2d'),
      image = new Image();

    image.src = 'assets/images/colormap.png';
    image.onload = function() {
      canvasContext.drawImage(image, 0, 0, image.width, image.height); // draw the image on the canvas
    };

    this.setProperties({
      canvas,
      canvasContext
    });
  }
});
