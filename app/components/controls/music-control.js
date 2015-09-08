import Em from 'ember';

export default Em.Component.extend({
  dancer: null,

  classNames: ['container-fluid'],

  beatOptions: {
    threshold: {
      range: {min: 0.1, max: 0.6},
      defaultValue: 0.3,
      pips: {
        mode: 'positions',
        values: [0,20,40,60,80,100],
        density: 3,
        format: {
          to: function ( value ) {return value;},
          from: function ( value ) { return value; }
        }
      }
    },
    decay: {
      range: {min: 0.01, max: 0.1},
      step: 0.01,
      defaultValue: 0.02,
      pips: {
        mode: 'positions',
        values: [0,20,40,60,80,100],
        density: 3,
        format: {
          to: function ( value ) {return value;},
          from: function ( value ) { return value; }
        }
      }
    },
    frequency: {
      range:  {min: 0, max: 10},
      step: 1,
      defaultValue: [0,5],
      pips: {
        mode: 'values',
        values: [0,2,4,6,8,10],
        density: 10,
        format: {
          to: function ( value ) {return value;},
          from: function ( value ) { return value; }
        }
      }
    }
  },

  threshold: 0.3,
  decay: 0.02,
  frequency: [0,5],

  playQueue: [],
  timeElapsed: 0,
  timeTotal: 0,

  // 0 - no repeat, 1 - repeat all, 2 - repeat one
  repeat: 0,
  shuffle: false,
  volumeMuted: false,
  volume: 100,
  paused: false,
  playing: false,

  incrementElapseTimeHandle: null,
  incrementElapseTime: function(){
      this.incrementProperty('timeElapsed');
  },

  actions: {
    defaultControls: function(){
      var beatOptions = this.get('beatOptions');

      this.changePlayerControl('threshold', beatOptions.threshold.defaultValue, true);
      this.changePlayerControl('decay', beatOptions.decay.defaultValue, true);
      this.changePlayerControl('frequency', beatOptions.frequency.defaultValue, true);
    },
    clickLight:function() {
      debugger;
    },
    play: function () {
      var dancer = this.get('dancer'),
        playQueue = this.get('playQueue');

      if (this.get('playing')) {
        dancer.pause();
        clearInterval(this.get('incrementElapseTimeHandle'));
        this.toggleProperty('playing');
        this.set('timeElapsed', Math.floor(dancer.getTime()));
      } else if(playQueue.length > 0) {
        if(this.get('volumeMuted')) {
          dancer.setVolume(0);
        } else {
          dancer.setVolume(this.get('volume')/100);
        }

        dancer.play();
        this.set('incrementElapseTimeHandle', window.setInterval(this.incrementElapseTime.bind(this), 1000));
        this.toggleProperty('playing');
      }
    },
    volumeChanged: function (value) {
      this.changePlayerControl('volume', value);
      if(this.get('playing')) {
        this.get('dancer').setVolume(value/100);
      }
    },
    next: function () {

    },
    previous: function () {

    },
    fullscreen: function () {

    },
    seekChanged: function () {

    },
    volumeMutedChanged: function (value) {
      var dancer = this.get('dancer'),
        volumeMuted = Em.isNone(value) ? !this.get('volumeMuted') : value;

      this.changePlayerControl('volumeMuted', volumeMuted);

      if(this.get('playing')){
        if(volumeMuted){
          dancer.setVolume(0);
        } else {
          dancer.setVolume(this.get('volume')/100);
        }
      }
    },
    shuffleChanged: function (value) {
      this.changePlayerControl('shuffle', Em.isNone(value) ? !this.get('shuffle') : value);
    },
    repeatChanged: function (value) {
      this.changePlayerControl('repeat', Em.isNone(value) ? (this.get('repeat') + 1) % 3 : value);
    },
    thresholdChanged: function(value) {
      this.changePlayerControl('threshold', value, true);
    },
    decayChanged: function(value){
      this.changePlayerControl('decay', value, true);
    },
    frequencyChanged: function(value){
      this.changePlayerControl('frequency', value, true);
    },
    addAudio: function () {
      Em.$('#fileInput').click();
    },
    clickSpeaker: function(){
      // simulate the speaker vibration by running a CSS animation on it
      Em.$('#beatSpeakerCenter').removeClass('pop').prop('offsetWidth', Em.$('#beatSpeakerCenter').prop('offsetWidth')).addClass('pop');
    }
  },

  changePlayerControl: function(name, value, isOption){
    if(isOption){
      var options = {};
      options[name] = value;
      this.get('kick').set(options);
    }

    this.set(name, value);
    localStorage.setItem('huegasm.' + name, value);
  },

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

  timeElapsedTxt: function(){
    return this.formatTime(this.get('timeElapsed'));
  }.property('timeElapsed'),
  timeTotalTxt: function() {
    return this.formatTime(this.get('timeTotal'));
  }.property('timeTotal'),

  formatTime: function(time){
    return this.pad(Math.floor(time/60), 2) + ':' + this.pad(time%60, 2);
  },
  pad: function(num, size){ return ('000000000' + num).substr(-size); },

  init: function () {
    this._super();

    var dancer = new Dancer(),
      self = this,
      threshold = this.get('threshold'),
      decay = this.get('decay'),
      frequency = this.get('frequency'),
      //briOff = function (i) {
      //  Em.$.ajax(self.get('apiURL') + '/lights/' + i + '/state', {
      //    data: JSON.stringify({'bri': 1, 'transitiontime': 0}),
      //    contentType: 'application/json',
      //    type: 'PUT'
      //  });
      //},
      kick = dancer.createKick({
        threshold: threshold,
        decay: decay,
        frequency: frequency,
        onKick: function (mag) {

          if (self.get('paused') === false) {
            //for (let i = 1; i <= 1; i++) {
            //  Em.$.ajax(self.get('apiURL') + '/lights/' + i + '/state', {
            //    data: JSON.stringify({'bri': 254, 'transitiontime': 0}),
            //    contentType: 'application/json',
            //    type: 'PUT'
            //  });
            //
            //  setTimeout(briOff, 50, i);
            //}

            self.set('paused', true);

            setTimeout(function () {
              self.set('paused', false);
            }, 150);

            self.send('clickSpeaker');

            console.log('Kick at ' + mag);
          }

        }
      });

    kick.on();

    dancer.bind('loaded', function(){
      self.set('timeTotal', dancer.audio.duration);
    });

    this.setProperties({
      dancer: dancer,
      kick: kick
    });

    ['volume', 'shuffle', 'repeat', 'volumeMuted', 'threshold', 'decay', 'frequency'].forEach(function (item) {
      if (localStorage.getItem('huegasm.' + item)) {
        var itemVal = localStorage.getItem('huegasm.' + item);
        if (item === 'repeat' || item === 'volume' || item === 'decay' || item === 'threshold') {
          itemVal = Number(itemVal);
        } else if(item === 'frequency') {
          itemVal = itemVal.split(',').map(function(val){return Number(val);});
        } else {
          itemVal = (itemVal === 'true');
        }

        self.send(item+'Changed', itemVal);
      }
    });
  },

  didInsertElement: function () {
    var self = this, playQueue = this.get('playQueue');

    Em.$('#fileInput').on('change', function () {
      var files = this.files,
        updatePlayQueue = function(){
          var tags = ID3.getAllTags("local");
          playQueue.push({filename: this.name.replace(/\.[^/.]+$/, ""), url: URL.createObjectURL(this), artist: tags.artist, title: tags.title });

          ID3.clearAll();
          self.notifyPropertyChange('playQueue');

          // make sure to init the first song
          if(playQueue.length > 0 && !self.get('dancer').isLoaded()){
            var a = new Audio();
            a.src = playQueue[0].url;
            self.get('dancer').load(a);
          }
        };

      for (var key in files) {
        if (files.hasOwnProperty(key)) {
          var file = files[key];

          ID3.loadTags("local", updatePlayQueue.bind(file),{
            dataReader: new FileAPIReader(file)
          });
        }
      }
    });

    Em.$('[data-toggle="tooltip"]').tooltip();
  }
});
