import Em from 'ember';

export default Em.Mixin.create({
  classNames: ['col-lg-10', 'col-lg-offset-2', 'col-xs-12'],
  classNameBindings: ['active::hidden'],
  elementId: 'musicTab',

  dancer: null,

  notify: Em.inject.service('notify'),

  beatOptions: {
    threshold: {
      range: {min: 0, max: 0.5},
      step: 0.01,
      defaultValue: 0.3,
      pips: {
        mode: 'values',
        values: [0, 0.25, 0.5],
        density: 10,
        format: {
          to: function ( value ) {
            if(value === 0) {
              value = 'More';
            } else if(value === 0.25) {
              value = 'Neutral';
            } else {
              value = 'Less';
            }

            return value;
          },
          from: function ( value ) { return value; }
        }
      }
    },
    micBoost: {
      range:  {min: 1, max: 11},
      step: 0.5,
      defaultValue: 5,
      pips: {
        mode: 'positions',
        values: [0,20,40,60,80,100],
        density: 10,
        format: {
          to: function ( value ) {return 'x'+value;},
          from: function ( value ) { return value; }
        }
      }
    }
  },

  threshold: 0.3,
  micBoost: 5,
  oldThreshold: null,

  playQueuePointer: -1,
  playQueue: Em.A(),
  timeElapsed: 0,
  timeTotal: 0,
  lastLightBopIndex: 0,

  usingMicSupported: true,
  // 0 - local, 1 - mic, possibly more to come
  audioMode: 0,
  usingLocalAudio: Em.computed.equal('audioMode', 0),
  usingMicAudio: Em.computed.equal('audioMode', 1),

  playerBottomDisplayed: false,
  dragging: false,
  draggingOverPlayListArea: false,
  dragLeaveTimeoutHandle: null,
  audioStream: null,
  dimmerOn: false,
  isShowingAddSoundCloudModal: false,

  colorloopMode: false,
  flashingTransitions: false,

  SC_CLIENT_ID: 'aeec0034f58ecd85c2bd1deaecc41594',
  notFoundHtml: '<div class="alert alert-danger" role="alert">A microphone was not found.</div>',
  scUserNotSupportedHtml: '<div class="alert alert-danger" role="alert">SoundCloud user URLs are not supported.</div>',
  notStreamableHtml(fileNames){
    var html =  '<div class="alert alert-danger" role="alert">The following file(s) could not be added because they are not allowed to be streamed:<br>' + fileNames.toString().replace(/,/g, '<br>') + '</div>';

    return html;
  },
  urlNotFoundHtml(url){
    return '<div class="alert alert-danger" role="alert">The URL ( ' + url + ' ) could not be resolved.</div>';
  },
  failedToPlayFileHtml(fileName){
    return '<div class="alert alert-danger" role="alert">Failed to play file ( ' + fileName + ' ).</div>';
  },
  failedToDecodeFileHtml(fileName){
    return '<div class="alert alert-danger" role="alert">Failed to decode file ( ' + fileName + ' ).</div>';
  },

  scUrl: function(){
    var rtn = null,
      currentSong = this.get('playQueue')[this.get('playQueuePointer')];

    if(currentSong && currentSong.scUrl && !this.get('usingMicAudio')){
      rtn = currentSong.scUrl;
    }

    return rtn;
  }.property('playQueuePointer', 'playQueue.[]', 'usingMicAudio'),

  playQueueEmpty: Em.computed.empty('playQueue'),
  playQueueNotEmpty: Em.computed.notEmpty('playQueue'),
  playQueueMultiple: function(){
    return this.get('playQueue').length > 1;
  }.property('playQueue.[]'),

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
  songBeatPreferences: {},
  usingBeatPreferences: false,
  oldBeatPrefCache: null,
  storage: null,
  firstVisit: true,

  // used to insure that we don't replay the same thing multiple times in shuffle mode
  shufflePlayed: [],
  pauseLightUpdates: function(){
    return this.get('playing');
  }.property('playing'),

  micIcon: function () {
    if (this.get('usingMicAudio')) {
      return 'mic';
    }

    return 'mic-off';
  }.property('usingMicAudio'),

  repeatIcon: function () {
    if (this.get('repeat') === 2) {
      return 'repeat-one';
    }

    return 'repeat';
  }.property('repeat'),

  playingIcon: function () {
    if(this.get('playing')){
      return 'pause';
    } else if(this.get('timeElapsed') === this.get('timeTotal') && this.get('timeTotal') !== 0){
      return 'replay';
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

    if(this.get('dimmerOn')){
      classes += ' dimmerOn';
    }

    return classes;
  }.property('dragging', 'draggingOverPlayListArea', 'dimmerOn'),

  dimmerOnClass: function(){
    return this.get('dimmerOn') ? 'dimmerOn' : null;
  }.property('dimmerOn'),

  volumeMutedClass: function(){
    var classes = 'playerControllIcon volumeButton';

    if(this.get('volumeMuted')){
      classes += ' active';
    }

    return classes;
  }.property('volumeMuted'),

  usingLocalAudioClass: function() {
    return this.get('usingLocalAudio') ? 'playerControllIcon active' : 'playerControllIcon';
  }.property('usingLocalAudio'),

  usingMicAudioClass: function() {
    return this.get('usingMicAudio') ? 'playerControllIcon active' : 'playerControllIcon';
  }.property('usingMicAudio'),

  repeatClass: function () {
    return this.get('repeat') !== 0 ? 'playerControllIcon active' : 'playerControllIcon';
  }.property('repeat'),

  shuffleClass: function () {
    return this.get('shuffle') ? 'playerControllIcon active' : 'playerControllIcon';
  }.property('shuffle'),

  volumeIcon: function () {
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

  onColorloopModeChange: function(){
    var colorLoop = ((this.get('playing') || this.get('usingMicAudio')) && this.get('colorloopMode')) ? true : false;

    this.set('colorLoopOn', colorLoop);
  }.observes('colorloopMode', 'usingMicAudio', 'playing'),

  onOptionChange: function(self, option){
    option = option.replace('.[]', '');
    this.get('storage').set('huegasm.' + option, this.get(option));
  }.observes('blinkingTransitions', 'playQueue.[]', 'playQueuePointer', 'colorloopMode'),

  onRepeatChange: function () {
    var tooltipTxt = 'Repeat all', type = 'repeat';

    if (this.get(type) === 1) {
      tooltipTxt = 'Repeat one';
    } else if (this.get(type) === 2) {
      tooltipTxt = 'Repeat off';
    }

    this.changeTooltipText(type, tooltipTxt);
  }.observes('repeat').on('init'),

  onUsingMicAudioChange: function(){
    var tooltipTxt = 'Listen to audio through mic', type = 'usingMicAudio';

    if (this.get(type)) {
      tooltipTxt = 'Listen to audio files';
    }

    this.changeTooltipText(type, tooltipTxt);
  }.observes('usingMicAudio').on('init'),

  onShuffleChange: function () {
    var tooltipTxt = 'Shuffle', type = 'shuffle';

    if (this.get(type)) {
      this.get('shufflePlayed').clear();
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
    if(this.get('playQueueNotEmpty')){
      var tooltipTxt = 'Previous', type = 'prev';

      if(this.get('timeElapsed') > 5 || this.get('playQueue').length === 1) {
        tooltipTxt = 'Replay';
      }

      this.changeTooltipText(type, tooltipTxt);
    }
  }.observes('timeElapsed', 'playQueueNotEmpty', 'playQueue.[]'),

  onPlayingChange: function () {
    var tooltipTxt = 'Play', type = 'playing';

    if (this.get(type)) {
      tooltipTxt = 'Pause';
    } else if(this.get('timeElapsed') === this.get('timeTotal') && this.get('timeTotal') !== 0){
      tooltipTxt = 'Replay';
    }

    this.changeTooltipText(type, tooltipTxt);
  }.observes('playing').on('init'),

  changeTooltipText(type, text) {
    // change the tooltip text if it's already visible
    Em.$('#' + type + 'Tooltip + .tooltip .tooltip-inner').html(text);
    //change the tooltip text for hover
    Em.$('#' + type + 'Tooltip').attr('data-original-title', text);

    if(Em.isNone(this.get(type + 'TooltipTxt'))) {
      this.set(type + 'TooltipTxt', text);
    }
  },

  beatDetectionAreaArrowIcon: function(){
    if(!this.get('playerBottomDisplayed')){
      return 'keyboard-arrow-down';
    } else {
      return 'keyboard-arrow-up';
    }
  }.property('playerBottomDisplayed'),

  timeElapsedTxt: function(){
    return this.formatTime(this.get('timeElapsed'));
  }.property('timeElapsed'),

  timeTotalTxt: function() {
    return this.formatTime(this.get('timeTotal'));
  }.property('timeTotal'),

  formatTime(time){
    return this.pad(Math.floor(time/60), 2) + ':' + this.pad(time%60, 2);
  },

  pad(num, size){ return ('000000000' + num).substr(-size); }
});
