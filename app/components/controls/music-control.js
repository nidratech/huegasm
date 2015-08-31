import Em from 'ember';

export default Em.Component.extend({
  dancer: null,

  classNames: ['container-fluid'],

  actions: {
    play: function(){
      if(this.get('status') === 'playing'){
        this.get('dancer').pause();
        this.set('status', 'paused');
      } else if(this.get('status') === 'paused'){
        this.get('dancer').play();
        this.set('status', 'playing');
      }
    },
    volumeSliderChanged: function(){

    },

    next : function(){

    },
    previous: function(){

    },

    fullscreen: function(){

    }
  },

  nextPrevEnabled: function(){
    return this.get('playQueue').length > 1;
  }.property('playQueue.[]'),

  status: null,

  playQueue: [],
  timeElapsed: '0:00',
  timeRemaining: '0:00',
  volume: 100,

  playButton: function(){
    if(this.get('status') === 'playing'){
      return 'pause';
    } else {
      return 'play-arrow';
    }
  }.property('status'),

  init: function(){
    this._super();

    var dancer = new Dancer(),
      self = this,
      briOff  = function(i){
        Em.$.ajax(self.get('apiURL') + '/lights/' + i + '/state', {
          data: JSON.stringify({'bri': 1, 'transitiontime': 0}),
          contentType: 'application/json',
          type: 'PUT'
        });
      },
      kick = dancer.createKick({
        threshold : 0.45,
        frequency: [0, 3],
        onKick: function ( mag ) {

          if(self.get('paused') === false){
            for(let i=1; i <= 1; i++){
              Em.$.ajax(self.get('apiURL') + '/lights/' + i + '/state', {
                data: JSON.stringify({'bri': 254, 'transitiontime': 0}),
                contentType: 'application/json',
                type: 'PUT'
              });

              setTimeout(briOff, 50, i);
            }

            self.set('paused', true);

            setTimeout(function(){ self.set('paused', false); }, 150);

            console.log('Kick at ' + mag);
          }

        }
      });

    kick.on();

    if(localStorage.getItem('huegasm.volume')){
      this.set('volume', localStorage.getItem('huegasm.volume'));
    }

    this.setProperties({
      dancer: dancer,
      kick: kick
    });
  },

  didInsertElement: function () {
    var dancer = this.get('dancer'), self = this;
    audio_file.onchange = function(){
      var files = this.files, a = new Audio();
      var file = URL.createObjectURL(files[0]);
      a.src = file;
      dancer.load(a);
      self.set('status', 'paused');
    };
  },

  paused: false
});
