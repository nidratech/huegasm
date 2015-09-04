import Em from 'ember';

export default Em.Component.extend({
  dancer: null,

  classNames: ['container-fluid'],

  actions: {
    play: function () {
      if (this.get('playing')) {
        this.get('dancer').pause();
      } else {
        this.get('dancer').play();
      }
      this.toggleProperty('playing');
    },
    volumeSliderChanged: function (volume) {
      this.set('volume', volume);
      localStorage.setItem('huegasm.volume', volume);
    },

    next: function () {

    },
    previous: function () {

    },

    fullscreen: function () {

    },

    seekChanged: function () {

    },

    toggleMute: function () {
      this.toggleProperty('volumeMuted');

      if(this.get('volumeMuted')){
        dancer.setVolume(0);
      } else {
        dancer.setVolume(this.get('volume')/100);
      }

      localStorage.setItem('huegasm.volumeMuted', this.get('volumeMuted'));
    },

    toggleShuffle: function () {
      this.toggleProperty('shuffle');
      localStorage.setItem('huegasm.shuffle', this.get('shuffle'));
    },

    toggleRepeat: function () {
      var repeat = (this.get('repeat') + 1) % 3;
      this.set('repeat', repeat);
      localStorage.setItem('huegasm.repeat', repeat);
    },

    addAudio: function () {
      Em.$('#fileInput').click();
    }
  },

  // 0 - no repeat, 1 - repeat all, 2 - repeat one
  repeat: 0,
  shuffle: false,
  volumeMuted: false,
  volume: 100,
  paused: false,
  playing: false,

  repeatIcon: function () {
    if (this.get('repeat') === 2) {
      return 'repeat-one';
    }

    return 'repeat';
  }.property('repeat'),

  playingIcon: function () {
    if (this.get('playing')) {
      return 'pause';
    } else {
      return 'play-arrow';
    }
  }.property('playing'),

  repeatClass: function () {
    return this.get('repeat') !== 0 ? 'playerControllIcon active' : 'playerControllIcon';
  }.property('repeat'),

  shuffleClass: function () {
    return this.get('shuffle') ? 'playerControllIcon active' : 'playerControllIcon';
  }.property('shuffle'),

  volumeClass: function () {
    var volume = this.get('volume');

    if (this.get('volumeMuted')) {
      return "volume-off";
    } else if (volume >= 70) {
      return "volume-up";
    } else if (volume > 10) {
      return "volume-down";
    } else {
      return 'volume-mute';
    }
  }.property('volumeMuted', 'volume'),

  onRepeatChange: function () {
    var tooltipTxt = 'Repeat all', type = 'repeat';

    if (this.get(type) === 1) {
      tooltipTxt = 'Repeat one';
    } else if (this.get(type) === 2) {
      tooltipTxt = 'Repeat off';
    }

    this.changeTooltipText(type, tooltipTxt);
  }.observes('repeat').on('init'),

  onShuffleChange: function () {
    var tooltipTxt = 'Shuffle', type = 'shuffle';

    if (this.get(type)) {
      tooltipTxt = 'Unshuffle';
    }

    this.changeTooltipText(type, tooltipTxt);
  }.observes('shuffle').on('init'),

  onVolumeMutedChange: function () {
    var tooltipTxt = 'Mute', type = 'volumeMuted',
      volumeMuted = this.get(type), dancer = this.get('dancer'),
      volume=0;

    if (volumeMuted) {
      tooltipTxt = 'Unmute';
      volume = 0;
    } else {
      volume = this.get('volume')/100;
    }

    if(this.get('playing')){
      dancer.setVolume(volume);
    }

    this.changeTooltipText(type, tooltipTxt);
  }.observes('volumeMuted').on('init'),

  onPlayingChange: function () {
    var tooltipTxt = 'Play', type = 'playing';

    if (this.get(type)) {
      tooltipTxt = 'Pause';
    }

    this.changeTooltipText(type, tooltipTxt);
  }.observes('playing').on('init'),

  onVolumeChange: function(){
    if(this.get('playing')){
      this.get('dancer').setVolume(this.get('volume')/100);
    }
  }.observes('volume').on('init'),

  changeTooltipText: function (type, text) {
    // change the tooltip text if it's already visible
    Em.$('#' + type + 'Tooltip + .tooltip .tooltip-inner').html(text);
    //change the tooltip text for hover
    Em.$('#' + type + 'Tooltip').attr('data-original-title', text).attr('title', text);
    this.set(type + 'TooltipTxt', text);
  },

  nextPrevEnabled: function () {
    return this.get('playQueue').length > 1;
  }.property('playQueue.[]'),

  playQueue: [],
  timeElapsed: 0,
  timeReamining: 0,
  timeElapsedTxt: '0:00',
  timeRemainingTxt: '0:00',

  init: function () {
    this._super();

    var dancer = new Dancer(),
      self = this,
      briOff = function (i) {
        Em.$.ajax(self.get('apiURL') + '/lights/' + i + '/state', {
          data: JSON.stringify({'bri': 1, 'transitiontime': 0}),
          contentType: 'application/json',
          type: 'PUT'
        });
      },
      kick = dancer.createKick({
        threshold: 0.45,
        frequency: [0, 3],
        onKick: function (mag) {

          if (self.get('paused') === false) {
            for (let i = 1; i <= 1; i++) {
              Em.$.ajax(self.get('apiURL') + '/lights/' + i + '/state', {
                data: JSON.stringify({'bri': 254, 'transitiontime': 0}),
                contentType: 'application/json',
                type: 'PUT'
              });

              setTimeout(briOff, 50, i);
            }

            self.set('paused', true);

            setTimeout(function () {
              self.set('paused', false);
            }, 150);

            console.log('Kick at ' + mag);
          }

        }
      });

    kick.on();

    ['volume', 'shuffle', 'repeat', 'volumeMuted'].forEach(function (item) {
      if (localStorage.getItem('huegasm.' + item)) {
        var itemVal = localStorage.getItem('huegasm.' + item);
        if (item === 'repeat' || item === 'volume') {
          itemVal = Number(itemVal);
        } else {
          itemVal = (itemVal === 'true');
        }
        self.set(item, itemVal);
      }
    });

    this.setProperties({
      dancer: dancer,
      kick: kick
    });
  },

  didInsertElement: function () {
    var dancer = this.get('dancer'), self = this, playQueue = this.get('playQueue');

    Em.$('#fileInput').on('change', function () {
      var files = this.files,
        updatePlayQueue = function(){
          var tags = ID3.getAllTags("local");
          playQueue.push({filaneme: this.name, url: URL.createObjectURL(this), artist: tags.artist, title: tags.title });

          self.notifyPropertyChange('playQueue');
        };

      for (var key in files) {
        if (files.hasOwnProperty(key)) {
          var file = files[key];

          ID3.loadTags("local",  updatePlayQueue.bind(file),{
            dataReader: FileAPIReader(file)
          });
        }
      }
    });

    Em.$('[data-toggle="tooltip"]').tooltip();
  }
});
