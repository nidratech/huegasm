import Em from 'ember';

export default Em.Mixin.create({
  currentVisName: 'None',

  visNames: ['None', 'Bars', 'Wave'],

  onCurrentVisNameChange: function () {
    var currentVisName = this.get('currentVisName');

    if(currentVisName === 'None'){
      var canvasEl = Em.$('#visualization')[0],
        ctx = canvasEl.getContext('2d');

      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    }

    this.get('storage').set('huegasm.currentVisName', currentVisName);
  }.observes('currentVisName'),

  didInsertElement(){
    var dancer = this.get('dancer'),
      canvas = Em.$('#visualization')[0],
      playerArea = Em.$('#playerArea'),
      ctx = canvas.getContext('2d'),
      spacing = 2,
      h = playerArea.height(), w;

    canvas.height = h;

    // must be done to preserver resolution so that things don't appear blurry
    // note that the height is set to 400px via css so it doesn't need to be recalculated
    var syncCanvasHeight = ()=>{
      w = playerArea.width();
      canvas.width = w;
    };

    syncCanvasHeight();

    Em.$(window).on('resize', syncCanvasHeight);

    dancer.bind('update', () => {
      var currentVisName = this.get('currentVisName'),
        gradient = ctx.createLinearGradient(0, 0, 0, h),
        pageHidden = document.hidden || document.msHidden || document.webkitHidden || document.mozHidden;

      // dont do anything if the page is hidden or no visualization
      if(currentVisName === 'None' || pageHidden || !this.get('active')){
        return;
      }

      ctx.clearRect(0, 0, w, h);

      if (currentVisName === 'Wave') {
        let width = 3,
          count = 1024;

        gradient.addColorStop(0.6, 'white');
        gradient.addColorStop(0, '#0036FA');

        ctx.lineWidth = 1;
        ctx.strokeStyle = gradient;
        var waveform = dancer.getWaveform();

        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        for (let i = 0, l = waveform.length; i < l && i < count; i++) {
          ctx.lineTo(i * ( spacing + width ), ( h / 2 ) + waveform[i] * ( h / 2 ));
        }
        ctx.stroke();
        ctx.closePath();
      } else if (currentVisName === 'Bars') {
        let width = 4,
          count = 128;

        gradient.addColorStop(1, '#0f0');
        gradient.addColorStop(0.6, '#ff0');
        gradient.addColorStop(0.2, '#F12B24');

        ctx.fillStyle = gradient;
        var spectrum = dancer.getSpectrum();
        for (let i = 0, l = spectrum.length; i < l && i < count; i++) {
          ctx.fillRect(i * ( spacing + width ), h, width, -spectrum[i] * h - 60);
        }
      }
    });
  }
});
