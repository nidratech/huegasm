import Ember from 'ember';

const {
  Mixin,
  observer,
  computed,
  isNone,
  run,
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
      range: { min: 0, max: 0.5 },
      step: 0.01,
      defaultValue: 0.3,
      pips: {
        mode: 'values',
        values: [0, 0.25, 0.5],
        density: 10,
        format: {
          to: function (value) {
            if (value === 0) {
              value = 'High';
            } else if (value === 0.25) {
              value = '';
            } else {
              value = 'Low';
            }

            return value;
          },
          from: function (value) { return value; }
        }
      }
    },
    hueRange: {
      range: { min: 0, max: 65535 },
      step: 1,
      defaultValue: 0.3,
      pips: {
        mode: 'values',
        values: [0, 25500, 46920, 65535],
        density: 10,
        format: {
          to: function (value) {
            if (value === 0 || value === 65535) {
              value = 'Red';
            } else if (value === 25500) {
              value = 'Green';
            } else {
              value = 'Blue';
            }

            return value;
          },
          from: function (value) { return value; }
        }
      }
    },
    brightnessRange: {
      range: { min: 1, max: 254 },
      step: 1,
      defaultValue: 0,
      pips: {
        mode: 'values',
        values: [1, 63, 127, 190, 254],
        density: 10,
        format: {
          to: function (value) {
            if (value === 63) {
              value = 25;
            } else if (value === 127) {
              value = 50;
            } else if (value === 190) {
              value = 75;
            } else if (value === 254) {
              value = 100;
            }

            return value;
          },
          from: function (value) { return value; }
        }
      }
    }
  },

  threshold: 0.3,
  hueRange: [0, 65535],
  brightnessRange: [1, 254],
  oldThreshold: null,

  playQueuePointer: -1,
  playQueue: A(),
  timeElapsed: 0,
  timeTotal: 0,
  lastLightBopIndex: 0,

  playerBottomDisplayed: true,
  dragging: false,
  draggingOverPlayListArea: false,
  dragLeaveTimeoutHandle: null,
  isShowingAddSoundCloudModal: false,

  colorloopMode: false,
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

  soundCloudFuckUps: 0,
  maxSoundCloudFuckUps: 3,

  // used to insure that we don't replay the same thing multiple times in shuffle mode
  shufflePlayed: [],

  // noUiSlider connection specification
  filledConnect: [true, false],
  hueRangeConnect: [false, true, false],

  SC_CLIENT_ID: 'aeec0034f58ecd85c2bd1deaecc41594',
  scUserNotSupportedHtml: '<div class="alert alert-danger" role="alert">SoundCloud user URLs are not supported.</div>',
  tooManySoundCloudFuckUps: '<div class="alert alert-danger" role="alert">The SoundCloud API is not seving the audio properly. More details <a href="https://www.soundcloudcommunity.com/soundcloud/topics/some-soundcloud-cdn-hosted-tracks-dont-have-access-control-allow-origin-header" target="_blank" rel="noopener noreferrer">HERE</a>.</div>',
  notStreamableHtml(fileNames) {
    let html = '<div class="alert alert-danger" role="alert">The following file(s) could not be added because they are not allowed to be streamed:<br>' + fileNames.toString().replace(/,/g, '<br>') + '</div>';

    return html;
  },
  urlNotFoundHtml(url) {
    return '<div class="alert alert-danger" role="alert">The URL (' + url + ') could not be resolved.</div>';
  },
  failedToPlayFileHtml(fileName) {
    return '<div class="alert alert-danger" role="alert">Failed to play file (' + fileName + ').</div>';
  },
  failedToDecodeFileHtml(fileName) {
    return '<div class="alert alert-danger" role="alert">Failed to decode file (' + fileName + ').</div>';
  },

  scUrl: computed('playQueuePointer', 'playQueue.[]', function () {
    let rtn = null,
      currentSong = this.get('playQueue')[this.get('playQueuePointer')];

    if (currentSong && currentSong.scUrl) {
      rtn = currentSong.scUrl;
    }

    return rtn;
  }),

  playQueueEmpty: computed.empty('playQueue'),
  playQueueNotEmpty: computed.notEmpty('playQueue'),
  playQueueMultiple: computed('playQueue.[]', function () {
    return this.get('playQueue').length > 1;
  }),

  seekPosition: computed('timeElapsed', 'timeTotal', function () {
    let timeTotal = this.get('timeTotal'),
      timeElapsed = this.get('timeElapsed');

    if (timeTotal === 0) {
      return 0;
    }

    return timeElapsed / timeTotal * 100;
  }),

  largeArtworkPic: computed('playQueuePointer', 'currentVisName', function () {
    let pic = '',
      currentVisName = this.get('currentVisName'),
      playQueuePointer = this.get('playQueuePointer'),
      playQueue = this.get('playQueue');

    if (playQueuePointer !== -1 && currentVisName === 'None') {
      let song = playQueue[playQueuePointer];
      if (!isNone(song.picture)) {
        pic = song.picture;

        if (song.scUrl) {
          pic = pic.replace('67x67', '500x500');
        }
      }
    }

    return pic;
  }),

  repeatIcon: computed('repeat', function () {
    if (this.get('repeat') === 2) {
      return 'repeat-one';
    }

    return 'repeat';
  }),

  playingIcon: computed('playing', function () {
    if (this.get('playing')) {
      return 'pause';
    } else if (this.get('timeElapsed') === this.get('timeTotal') && this.get('timeTotal') !== 0) {
      return 'replay';
    } else {
      return 'play-arrow';
    }
  }),

  playerAreaClickIcon: computed('playing', function () {
    if (this.get('playing')) {
      return 'play-arrow';
    } else {
      return 'pause';
    }
  }),

  playListAreaClass: computed('dragging', 'draggingOverPlayListArea', 'dimmerOn', function () {
    let classes = 'pointer';

    if (this.get('dragging')) {
      classes += ' drag-here-highlight';
    }

    if (this.get('draggingOverPlayListArea')) {
      classes += ' dragging-over';
    }

    if (this.get('dimmerOn')) {
      classes += ' dimmerOn';
    }

    return classes;
  }),

  dimmerOnClass: computed('dimmerOn', function () {
    return this.get('dimmerOn') ? 'dimmerOn' : null;
  }),

  volumeMutedClass: computed('volumeMuted', function () {
    let classes = 'player-control-icon volumeButton';

    if (this.get('volumeMuted')) {
      classes += ' active';
    }

    return classes;
  }),

  repeatClass: computed('repeat', function () {
    return this.get('repeat') !== 0 ? 'player-control-icon active' : 'player-control-icon';
  }),

  shuffleClass: computed('shuffle', function () {
    return this.get('shuffle') ? 'player-control-icon active' : 'player-control-icon';
  }),

  volumeIcon: computed('volumeMuted', 'volume', function () {
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

  beatDetectionAreaArrowIcon: computed('playerBottomDisplayed', function () {
    if (!this.get('playerBottomDisplayed')) {
      return 'keyboard-arrow-down';
    } else {
      return 'keyboard-arrow-up';
    }
  }),

  timeElapsedTxt: computed('timeElapsed', function () {
    return this.formatTime(this.get('timeElapsed'));
  }),

  timeTotalTxt: computed('timeTotal', function () {
    return this.formatTime(this.get('timeTotal'));
  }),

  onPlayQueueChange: observer('playQueue.length', function () {
    let playQueueLength = this.get('playQueue.length');

    if (playQueueLength > this.get('oldPlayQueueLength')) {
      run.once(this, () => {
        run.next(this, function () {
          $(`.track${playQueueLength - 1}`).velocity('scroll', { container: $('#play-list-area'), duration: 200 });
        });
      });
    }

    this.set('oldPlayQueueLength', playQueueLength);
  }),

  onColorloopModeChange: observer('colorloopMode', 'playing', function () {
    this.set('colorLoopOn', this.get('playing') && this.get('colorloopMode'));
  }),

  onOptionChange: observer('flashingTransitions', 'playQueue.[]', 'playQueuePointer', 'colorloopMode', function (self, option) {
    option = option.replace('.[]', '');
    let value = this.get(option);

    // can't really save local music
    if (option === 'playQueue') {
      value = value.filter((song) => {
        return !song.url.startsWith('blob:');
      });
    }

    this.get('storage').set('huegasm.' + option, value);
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

  onShuffleChange: on('init', observer('shuffle', function () {
    let tooltipTxt = 'Shuffle', type = 'shuffle';

    if (this.get(type)) {
      this.get('shufflePlayed').clear();
      tooltipTxt = 'Unshuffle';
    }

    this.changeTooltipText(type, tooltipTxt);
  })),

  onVolumeMutedChange: on('init', observer('volumeMuted', function () {
    let tooltipTxt = 'Mute', type = 'volumeMuted',
      volumeMuted = this.get(type), dancer = this.get('dancer'),
      volume = 0;

    if (volumeMuted) {
      tooltipTxt = 'Unmute';
      volume = 0;
    } else {
      volume = this.get('volume') / 100;
    }

    if (this.get('playing')) {
      dancer.setVolume(volume);
    }

    this.changeTooltipText(type, tooltipTxt);
  })),

  onPrevChange: on('init', observer('timeElapsed', 'playQueueNotEmpty', 'playQueue.[]', function () {
    if (this.get('playQueueNotEmpty')) {
      let tooltipTxt = 'Previous', type = 'prev';

      if (this.get('timeElapsed') > 5 || this.get('playQueue').length === 1) {
        tooltipTxt = 'Replay';
      }

      this.changeTooltipText(type, tooltipTxt);
    }
  })),

  onPlayingChange: on('init', observer('playing', function () {
    let tooltipTxt = 'Play', type = 'playing';

    if (this.get(type)) {
      tooltipTxt = 'Pause';
    } else if (this.get('timeElapsed') === this.get('timeTotal') && this.get('timeTotal') !== 0) {
      tooltipTxt = 'Replay';
    }

    this.changeTooltipText(type, tooltipTxt);
  })),

  changeTooltipText(type, text) {
    // change the tooltip text if it's already visible
    $('#' + type + 'Tooltip + .tooltip .tooltip-inner').html(text);
    //change the tooltip text for hover
    $('#' + type + 'Tooltip').attr('data-original-title', text);

    if (isNone(this.get(type + 'TooltipTxt'))) {
      this.set(type + 'TooltipTxt', text);
    }
  },

  formatTime(time) {
    return this.pad(Math.floor(time / 60), 2) + ':' + this.pad(time % 60, 2);
  },

  pad(num, size) { return ('000000000' + num).substr(-size); }
});
