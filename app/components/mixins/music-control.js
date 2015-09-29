import Em from 'ember';

export default Em.Mixin.create({
  dancer: null,

  beatOptions: {
    threshold: {
      range: {min: 0.1, max: 0.9},
      step: 0.01,
      defaultValue: 0.3,
      pips: {
        mode: 'positions',
        values: [0,25,50,75,100],
        density: 3,
        format: {
          to: function ( value ) {return value;},
          from: function ( value ) { return value; }
        }
      }
    },
    decay: {
      range: {min: 0, max: 0.1},
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
      defaultValue: [0,4],
      pips: {
        mode: 'values',
        values: [0,2,4,6,8,10],
        density: 10,
        format: {
          to: function ( value ) {return value;},
          from: function ( value ) { return value; }
        }
      }
    },
    transitionTime: {
      range:  {min: 0, max: 0.5},
      step: 0.1,
      defaultValue: 0,
      pips: {
        mode: 'positions',
        values: [0,20,40,60,80,100],
        density: 10,
        format: {
          to: function ( value ) {return value;},
          from: function ( value ) { return value; }
        }
      }
    }
  },

  transitionTime: 0,
  threshold: 0.3,
  decay: 0.02,
  frequency: [0,4],

  playQueuePointer: -1,
  playQueue: Em.A(),
  beatHistory: Em.A(),
  maxBeatHistorySize: 30,
  timeElapsed: 0,
  timeTotal: 0,
  lastLightBopIndex: 0,

  dragging: false,
  draggingOverPlayListArea: false,
  dragLeaveTimeoutHandle: null,
  visualizationsDisplayed: false,

  playQueueEmpty: Em.computed.empty('playQueue'),
  playQueueNotEmpty: Em.computed.notEmpty('playQueue'),
  playQueueMultiple: function(){
    return this.get('playQueue.length') > 1;
  }.property('playQueue'),

  seekPosition: function() {
    var timeTotal = this.get('timeTotal'), timeElapsed = this.get('timeElapsed');

    if (timeTotal === 0) {
      return 0;
    }

    return timeElapsed/timeTotal*100;
  }.property('timeElapsed', 'timeTotal'),

  // 0 - no repeat, 1 - repeat all, 2 - repeat one
  repeat: 0,
  shuffle: false,
  volumeMuted: false,
  volume: 100,
  // beat detection related pausing
  paused: false,
  // audio: playing or paused
  playing: false,

  fadeOutNotification: false,

  speakerViewed: true,
  speakerLabel: function() {
    if(this.get('speakerViewed')){
      return 'Speaker View';
    } else {
      return 'Debug View';
    }
  }.property('speakerViewed'),

  sequentialTransition: true,
  sequentialTransitionLabel: function() {
    if(this.get('sequentialTransition')){
      return 'Sequential';
    } else {
      return 'Random';
    }
  }.property('sequentialTransition'),

  changePlayerControl: function(name, value, isOption){
    if(isOption){
      var options = {};
      options[name] = value;
      this.get('kick').set(options);
    }

    this.set(name, value);
    localStorage.setItem('huegasm.' + name, value);
  },

  incrementElapseTimeHandle: null,
  incrementElapseTime: function(){
    this.incrementProperty('timeElapsed');
    if(this.get('timeElapsed') > this.get('timeTotal')){
      this.goToNextSong();
    }
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

  playListAreaClass: function(){
    var classes = 'cursorPointer';

    if(this.get('dragging')){
      classes += ' dragHereHighlight';
    }

    if(this.get('draggingOverPlayListArea')){
      classes += ' draggingOver';
    }

    return classes;
  }.property('dragging', 'draggingOverPlayListArea'),

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

  onSpeakerViewedChange: function(){
    localStorage.setItem('huegasm.speakerViewed', this.get('speakerViewed'));
    this.get('beatHistory').clear();
  }.observes('speakerViewed'),

  onSequentialTransitionChange: function(){
    localStorage.setItem('huegasm.sequentialTransition', this.get('sequentialTransition'));
  }.observes('sequentialTransition'),

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

  onPrevChange: function() {
    if(this.get('playQueueMultiple')){
      var tooltipTxt = 'Previous', type = 'prev';

      if(this.get('timeElapsed') > 5) {
        tooltipTxt = 'Replay';
      }

      this.changeTooltipText(type, tooltipTxt);
    }
  }.observes('timeElapsed', 'playQueueMultiple'),

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
    Em.$('#' + type + 'Tooltip').attr('data-original-title', text);

    if(Em.isNone(this.get(type + 'TooltipTxt'))) {
      this.set(type + 'TooltipTxt', text);
    }
  },

  timeElapsedTxt: function(){
    return this.formatTime(this.get('timeElapsed'));
  }.property('timeElapsed'),

  timeTotalTxt: function() {
    return this.formatTime(this.get('timeTotal'));
  }.property('timeTotal'),

  formatTime: function(time){
    return this.pad(Math.floor(time/60), 2) + ':' + this.pad(time%60, 2);
  },

  pad: function(num, size){ return ('000000000' + num).substr(-size); }
});
