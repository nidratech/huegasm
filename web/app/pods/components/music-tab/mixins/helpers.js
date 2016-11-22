import Ember from 'ember';

const {
  Mixin,
  observer,
  computed,
  isNone,
  $,
  inject,
  on,
  A
} = Ember;

export default Mixin.create({
  classNames: ['col-sm-10', 'col-sm-offset-1', 'col-xs-12'],
  classNameBindings: ['active::hidden'],
  elementId: 'music-tab',

  dancer: null,

  notify: inject.service(),

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
              value = '';
            } else {
              value = 'Less';
            }

            return value;
          },
          from: function ( value ) { return value; }
        }
      }
    },
    hueRange: {
      range: {min: 0, max: 65535},
      step: 1,
      defaultValue: 0.3,
      pips: {
        mode: 'values',
        values: [0, 25500, 46920, 65535],
        density: 10,
        format: {
          to: function ( value ) {
            if(value === 0 || value === 65535) {
              value = 'Red';
            } else if(value === 25500 ) {
              value = 'Green';
            } else {
              value = 'Blue';
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
  hueRange: [0, 65535],
  micBoost: 5,
  oldThreshold: null,

  playQueuePointer: -1,
  playQueue: A(),
  timeElapsed: 0,
  timeTotal: 0,
  lastLightBopIndex: 0,
  usingMicSupported: false,

  // 0 - local, 1 - mic, possibly more to come
  audioMode: 0,
  usingLocalAudio: computed.equal('audioMode', 0),
  usingMicAudio: computed.equal('audioMode', 1),

  playerBottomDisplayed: true,
  dragging: false,
  draggingOverPlayListArea: false,
  dragLeaveTimeoutHandle: null,
  ambienceModeHandle: null,
  audioStream: null,
  dimmerOn: false,
  isShowingAddSoundCloudModal: false,

  colorloopMode: false,
  ambienceMode: false,
  flashingTransitions: false,

  // 0 - no repeat, 1 - repeat all, 2 - repeat one
  repeat: 0,
  shuffle: false,
  volumeMuted: false,
  volume: 100,
  // beat detection related pausing
  paused: false,
  // audio: playing or paused
  playing: false,
  songBeatPreferences: {},
  usingBeatPreferences: false,
  oldBeatPrefCache: null,
  storage: null,
  firstVisit: true,
  ambienceWorkedLights: [],
  ambienceWorkedLightsHandles: {},

  soundCloudFuckUps: 0,
  maxSoundCloudFuckUps: 3,

  // used to insure that we don't replay the same thing multiple times in shuffle mode
  shufflePlayed: [],

  // noUiSlider connection specification
  filledConnect: [true, false],
  hueRangeConnect: [false, true, false],

  SC_CLIENT_ID: 'aeec0034f58ecd85c2bd1deaecc41594',
  notFoundHtml: '<div class="alert alert-danger" role="alert">A microphone was not found.</div>',
  scUserNotSupportedHtml: '<div class="alert alert-danger" role="alert">SoundCloud user URLs are not supported.</div>',
  tooManySoundCloudFuckUps: '<div class="alert alert-danger" role="alert">The SoundCloud API is not seving the audio properly. More details <a href="https://www.soundcloudcommunity.com/soundcloud/topics/some-soundcloud-cdn-hosted-tracks-dont-have-access-control-allow-origin-header" target="_blank" rel="noopener noreferrer">HERE</a>.</div>',
  notStreamableHtml(fileNames){
    let html =  '<div class="alert alert-danger" role="alert">The following file(s) could not be added because they are not allowed to be streamed:<br>' + fileNames.toString().replace(/,/g, '<br>') + '</div>';

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

  scUrl: computed('playQueuePointer', 'playQueue.[]', 'usingMicAudio', function(){
    let rtn = null,
      currentSong = this.get('playQueue')[this.get('playQueuePointer')];

    if(currentSong && currentSong.scUrl && !this.get('usingMicAudio')){
      rtn = currentSong.scUrl;
    }

    return rtn;
  }),

  playQueueEmpty: computed.empty('playQueue'),
  playQueueNotEmpty: computed.notEmpty('playQueue'),
  playQueueMultiple: computed('playQueue.[]', function(){
    return this.get('playQueue').length > 1;
  }),

  seekPosition: computed('timeElapsed', 'timeTotal', function(){
    let timeTotal = this.get('timeTotal'),
      timeElapsed = this.get('timeElapsed');

    if (timeTotal === 0) {
      return 0;
    }

    return timeElapsed/timeTotal*100;
  }),

  largeArtworkPic: computed('playQueuePointer', 'usingMicAudio', 'currentVisName', function(){
    let pic = '',
      currentVisName = this.get('currentVisName'),
      usingMicAudio = this.get('usingMicAudio'),
      playQueuePointer = this.get('playQueuePointer'),
      playQueue = this.get('playQueue');

    if(playQueuePointer !== -1 && !usingMicAudio && currentVisName === 'None'){
      let song = playQueue[playQueuePointer];
      if(song.scUrl && !isNone(song.picture)){
        pic = song.picture.replace('67x67', '500x500');
      }
    }

    return pic;
  }),

  micIcon: computed('usingMicAudio', function(){
    if(this.get('usingMicAudio')) {
      return 'mic';
    }

    return 'mic-off';
  }),

  repeatIcon: computed('repeat', function() {
    if(this.get('repeat') === 2) {
      return 'repeat-one';
    }

    return 'repeat';
  }),

  playingIcon: computed('playing', function() {
    if(this.get('playing')){
      return 'pause';
    } else if(this.get('timeElapsed') === this.get('timeTotal') && this.get('timeTotal') !== 0){
      return 'replay';
    } else {
      return 'play-arrow';
    }
  }),

  playerAreaClickIcon: computed('playing', function() {
    if(this.get('playing')){
      return 'play-arrow';
    } else {
      return 'pause';
    }
  }),

  playListAreaClass: computed('dragging', 'draggingOverPlayListArea', 'dimmerOn', function(){
    let classes = 'pointer';

    if(this.get('dragging')){
      classes += ' drag-here-highlight';
    }

    if(this.get('draggingOverPlayListArea')){
      classes += ' dragging-over';
    }

    if(this.get('dimmerOn')){
      classes += ' dimmerOn';
    }

    return classes;
  }),

  dimmerOnClass: computed('dimmerOn', function(){
    return this.get('dimmerOn') ? 'dimmerOn' : null;
  }),

  volumeMutedClass: computed('volumeMuted', function(){
    let classes = 'player-control-icon volumeButton';

    if(this.get('volumeMuted')){
      classes += ' active';
    }

    return classes;
  }),

  usingLocalAudioClass: computed('usingLocalAudio', function(){
    return this.get('usingLocalAudio') ? 'player-control-icon active' : 'player-control-icon';
  }),

  usingMicAudioClass: computed('usingMicAudio', function(){
    return this.get('usingMicAudio') ? 'player-control-icon active' : 'player-control-icon';
  }),

  repeatClass: computed('repeat', function(){
    return this.get('repeat') !== 0 ? 'player-control-icon active' : 'player-control-icon';
  }),

  shuffleClass: computed('shuffle', function(){
    return this.get('shuffle') ? 'player-control-icon active' : 'player-control-icon';
  }),

  volumeIcon: computed('volumeMuted', 'volume', function() {
    let volume = this.get('volume');

    if (this.get('volumeMuted')) {
      return "volume-off";
    } else if (volume >= 70) {
      return "volume-up";
    } else if (volume > 10) {
      return "volume-down";
    } else {
      return 'volume-mute';
    }
  }),

  beatDetectionAreaArrowIcon: computed('playerBottomDisplayed', function(){
    if(!this.get('playerBottomDisplayed')){
      return 'keyboard-arrow-down';
    } else {
      return 'keyboard-arrow-up';
    }
  }),

  timeElapsedTxt: computed('timeElapsed', function(){
    return this.formatTime(this.get('timeElapsed'));
  }),

  timeTotalTxt: computed('timeTotal', function() {
    return this.formatTime(this.get('timeTotal'));
  }),

  onColorloopModeChange: observer('colorloopMode', 'usingMicAudio', 'playing', function(){
    let colorLoop = ((this.get('playing') || this.get('usingMicAudio')) && this.get('colorloopMode')) ? true : false;

    this.set('colorLoopOn', colorLoop);
  }),

  onOptionChange: observer('flashingTransitions', 'playQueue.[]', 'playQueuePointer', 'colorloopMode', 'ambienceMode', function(self, option){
    option = option.replace('.[]', '');
    this.get('storage').set('huegasm.' + option, this.get(option));
  }),

  onRepeatChange: on('init', observer('repeat', function () {
    let tooltipTxt = 'Repeat all', type = 'repeat';

    if (this.get(type) === 1) {
      tooltipTxt = 'Repeat one';
    } else if (this.get(type) === 2) {
      tooltipTxt = 'Repeat off';
    }

    this.changeTooltipText(type, tooltipTxt);
  })),

  onUsingMicAudioChange: on('init', observer('usingMicAudio', function(){
    let tooltipTxt = 'Listen to audio through mic', type = 'usingMicAudio';

    if (this.get(type)) {
      tooltipTxt = 'Listen to audio files';
    }

    this.changeTooltipText(type, tooltipTxt);
  })),

  onShuffleChange: on('init', observer('shuffle', function () {
    let tooltipTxt = 'Shuffle', type = 'shuffle';

    if (this.get(type)) {
      this.get('shufflePlayed').clear();
      tooltipTxt = 'Unshuffle';
    }

    this.changeTooltipText(type, tooltipTxt);
  })),

  onVolumeMutedChange: on('init', observer('volumeMuted', function() {
    let tooltipTxt = 'Mute', type = 'volumeMuted',
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
  })),

  onPrevChange: on('init', observer('timeElapsed', 'playQueueNotEmpty', 'playQueue.[]', function() {
    if(this.get('playQueueNotEmpty')){
      let tooltipTxt = 'Previous', type = 'prev';

      if(this.get('timeElapsed') > 5 || this.get('playQueue').length === 1) {
        tooltipTxt = 'Replay';
      }

      this.changeTooltipText(type, tooltipTxt);
    }
  })),

  onPlayingChange: on('init', observer('playing', function () {
    let tooltipTxt = 'Play', type = 'playing';

    if (this.get(type)) {
      tooltipTxt = 'Pause';
    } else if(this.get('timeElapsed') === this.get('timeTotal') && this.get('timeTotal') !== 0){
      tooltipTxt = 'Replay';
    }

    this.changeTooltipText(type, tooltipTxt);
  })),

  changeTooltipText(type, text) {
    // change the tooltip text if it's already visible
    $('#' + type + 'Tooltip + .tooltip .tooltip-inner').html(text);
    //change the tooltip text for hover
    $('#' + type + 'Tooltip').attr('data-original-title', text);

    if(isNone(this.get(type + 'TooltipTxt'))) {
      this.set(type + 'TooltipTxt', text);
    }
  },

  formatTime(time){
    return this.pad(Math.floor(time/60), 2) + ':' + this.pad(time%60, 2);
  },

  pad(num, size){ return ('000000000' + num).substr(-size); }
});
