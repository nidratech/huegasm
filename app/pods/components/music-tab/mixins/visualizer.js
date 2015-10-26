import Em from 'ember';

export default Em.Mixin.create({
  currentVisName: 'Wave',

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
      canvasEl = Em.$('#visualization')[0],
      ctx = canvasEl.getContext('2d'),
      spacing = 0,
      h = canvasEl.height,
      w = canvasEl.width;

    dancer.bind('update', () => {
      var currentVisName = this.get('currentVisName');
      if(currentVisName === 'None'){
        return;
      }

      ctx.clearRect(0, 0, w, h);

      if (currentVisName === 'Wave') {
        let width = 2,
          count = 1024,
          gradient = ctx.createLinearGradient(0, 0, 0, 300);

        gradient.addColorStop(0, '#0036FA');
        gradient.addColorStop(0.3, 'white');

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
          count = 128,
          gradient = ctx.createLinearGradient(0, 0, 0, 300);

        gradient.addColorStop(0.5, '#0f0');
        gradient.addColorStop(0.4, '#ff0');
        gradient.addColorStop(0, '#F12B24');

        ctx.fillStyle = gradient;
        var spectrum = dancer.getSpectrum();
        for (let i = 0, l = spectrum.length; i < l && i < count; i++) {
          ctx.fillRect(i * ( spacing + width ), h, width, -spectrum[i] * h - 23);
        }
      }
    });
  }
})
;
