import Em from 'ember';
import musicControlMixin from './mixins/music-tab';
import visualizerMixin from './mixins/visualizer';

export default Em.Component.extend(musicControlMixin, visualizerMixin, {
  classNames: ['col-lg-10', 'col-lg-offset-1', 'col-xs-12'],
  classNameBindings: ['active::hidden'],
  elementId: 'musicTab',

  onActiveChange: function(){
    if(this.get('active')){
      Em.$('#playNotification').removeClass('fadeOut');
      Em.$('#beatSpeakerCenterOuter').removeClass('vibrateOuter');
      Em.$('#beatSpeakerCenterInner').removeClass('vibrateInner');
    }
  }.observes('active'),

  actions: {
    toggleDimming: function(){
      this.toggleProperty('dimmerEnabled');
    },
    useLocalAudio: function(){
      var audioStream = this.get('audioStream');
      this.changePlayerControl('audioMode', 0);

      if(!Em.isNone(audioStream)){
        audioStream.stop();

        this.setProperties({
          audioStream: null,
          playing: false
        });
      }

      if(this.get('playQueuePointer') !== -1) {
        this.send('goToSong', this.get('playQueuePointer'));
        this.send('volumeChanged', this.get('volume'));
      }

      document.title = 'Huegasm';
    },
    useMicAudio() {
      if(this.get('usingMicAudio')) {
        this.send('useLocalAudio');
      } else {
        this.startUsingMic();
      }
    },
    slideTogglePlayerBottom(){
      this.changePlayerControl('playerBottomDisplayed', !this.get('playerBottomDisplayed'));
    },
    saveSongSettings() {
    },
    goToSong(index, playSong){
      var dancer = this.get('dancer'), audio = new Audio();
      audio.src = this.get('playQueue')[index].url;

      if(dancer.audio) {
        this.clearCurrentAudio(true);
      }

      dancer.load(audio);
      this.setProperties({
        playQueuePointer: index,
        timeElapsed: 0
      });

      if(playSong){
        this.send('play');
      }
    },
    removeAudio(index){
      if(index === this.get('playQueuePointer')) {
        this.clearCurrentAudio(true);
      }

      this.get('playQueue').removeAt(index);
    },
    defaultControls(){
      var beatOptions = this.get('beatOptions');

      this.changePlayerControl('threshold', beatOptions.threshold.defaultValue, true);
      this.changePlayerControl('decay', beatOptions.decay.defaultValue, true);
      this.changePlayerControl('frequency', beatOptions.frequency.defaultValue, true);
      this.changePlayerControl('transitionTime', beatOptions.transitionTime.defaultValue, true);
    },
    playerAreaPlay(){
      if(Em.isEmpty(Em.$('#playerControls:hover')) && this.get('playQueuePointer') !== -1 ){
        this.send('play');
        this.set('fadeOutNotification', true);
        Em.$('#playNotification').removeClass('fadeOut').prop('offsetWidth', Em.$('#playNotification').prop('offsetWidth')).addClass('fadeOut');
      }
    },
    play(replayPause) {
      var dancer = this.get('dancer'), playQueuePointer = this.get('playQueuePointer');

      if(playQueuePointer !== -1 ) {
        if (this.get('playing')) {
          dancer.pause();
          clearInterval(this.get('incrementElapseTimeHandle'));
          if(!replayPause){
            this.set('timeElapsed', Math.floor(dancer.getTime()));
          }

          this.set('dimmerOn', false);
        } else {
          if(this.get('volumeMuted')) {
            dancer.setVolume(0);
          } else {
            dancer.setVolume(this.get('volume')/100);
          }

          // replay song
          if(this.get('timeElapsed') === this.get('timeTotal')){
            this.send('seekChanged', 0);
          }

          dancer.play();

          if(this.get('dimmerEnabled')){
            this.set('dimmerOn', true);
          }

          this.setProperties('incrementElapseTimeHandle', window.setInterval(this.incrementElapseTime.bind(this), 1000));
        }
        this.toggleProperty('playing');
      }
    },
    volumeChanged(value) {
      this.changePlayerControl('volume', value);
      if(this.get('playing')) {
        this.get('dancer').setVolume(value/100);
      }
    },
    next() {
      var playQueuePointer = this.get('playQueuePointer'), playQueueLength = this.get('playQueue.length');
      var nextSong = (playQueuePointer + 1), repeat = this.get('repeat');

      this.get('beatHistory').clear();

      if(repeat === 2){
        this.send('goToSong', playQueuePointer, true);
      } else if(nextSong > playQueueLength-1){
        if(repeat === 1){
          nextSong = nextSong % playQueueLength;
        } else {
          this.send('play', true);
          return;
        }
      }

      this.send('goToSong', nextSong, true);
    },
    previous() {
      if(this.get('timeElapsed') > 5) {
        this.send('seekChanged', 0);
      } else {
        var nextSong = this.get('playQueuePointer');
        nextSong--;

        if(nextSong < 0) {
          nextSong = this.get('playQueue.length') - 1;
        }

        this.send('goToSong', nextSong, true);
      }
    },
    toggleVisualizations() {
      this.toggleProperty('visualizationsDisplayed');
    },
    fullscreen() {},
    seekChanged(position) {
      var dancer = this.get('dancer');

      if(dancer.audio){
        var audioPosition = Math.floor(this.get('timeTotal') * position / 100);
        dancer.audio.currentTime = audioPosition;
        this.set('timeElapsed', audioPosition);
      }
    },
    volumeMutedChanged(value) {
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
    shuffleChanged(value) {
      this.changePlayerControl('shuffle', Em.isNone(value) ? !this.get('shuffle') : value);
    },
    repeatChanged(value) {
      this.changePlayerControl('repeat', Em.isNone(value) ? (this.get('repeat') + 1) % 3 : value);
    },
    thresholdChanged(value) {
      this.changePlayerControl('threshold', value, true);
    },
    transitionTimeChanged(value) {
      this.changePlayerControl('transitionTime', value);
    },
    playerBottomDisplayedChanged(value) {
      this.changePlayerControl('playerBottomDisplayed', value);
    },
    decayChanged(value){
      this.changePlayerControl('decay', value, true);
    },
    frequencyChanged(value){
      this.changePlayerControl('frequency', value, true);
    },
    addAudio: function () {
      Em.$('#fileInput').click();
    },
    playListAreaAddAudio(){
      this.send('addAudio');
    },
    speakerViewedChanged(value){
      this.set('speakerViewed', value);
    },
    randomTransitionChanged(value){
      this.set('randomTransition', value);
    },
    onBeatBriAndColorChanged(value){
      this.set('onBeatBriAndColor', value);
    },
    audioModeChanged(value){
      if(value === 1) {
        this.startUsingMic();
      } else if(value === 3) {
        this.send('useLocalAudio');
      } else {
        this.set('audioMode', value);
      }
    },
    clickSpeaker(){
      this.simulateKick(1);
    },
    dropFiles(){
      this.setProperties({
        dragging: false,
        draggingOverPlayListArea: false
      });
      this.send('handleNewFiles', event.dataTransfer.files);
    },
    playListAreaDragOver(){
      this.set('draggingOverPlayListArea', true);
    },
    playListAreaDragLeave(){
      this.set('draggingOverPlayListArea', false);
    },
    handleNewFiles(files){
      var self = this,
        playQueue = this.get('playQueue'),
        updatePlayQueue = function(){
          var tags = ID3.getAllTags("local");
          playQueue.push({filename: this.name.replace(/\.[^/.]+$/, ""), url: URL.createObjectURL(this), artist: tags.artist, title: tags.title });

          ID3.clearAll();
          self.notifyPropertyChange('playQueue');

          // make sure to init the first song
          if(playQueue.length > 0 && self.get('playQueuePointer') === -1){
            self.send('goToSong', 0, true);
          }
        };

      for (var key in files) {
        if (files.hasOwnProperty(key)) {
          var file = files[key];

          if(file.type.startsWith('audio')) {
            ID3.loadTags("local", updatePlayQueue.bind(file),{
              dataReader: new FileAPIReader(file)
            });
          }
        }
      }
    }
  },

  startUsingMic() {
    navigator.getUserMedia(
      {audio: true},
      (stream) => {
        this.changePlayerControl('audioMode', 1);
        var dancer = this.get('dancer');

        if(dancer.audio && dancer.audio.pause) {
          dancer.pause();
          clearInterval(this.get('incrementElapseTimeHandle'));
        }

        this.setProperties({
          volumeCache: this.get('volume'),
          playing: true,
          audioStream: stream
        });

        document.title = 'Listening to Mic - Huegasm';
        dancer.load(stream, true);
        dancer.setVolume(0);
      },
      (err) => {
        if(err.name === 'DevicesNotFoundError'){
          this.get('notify').alert({html: this.get('notFoundHtml')});
        }

        console.log('Error during navigator.getUserMedia: ' + err.name + ', ' + err.message + ', ' + err.constraintName);
      }
    );
  },

  updatePageTitle: function(){
    var title = 'Huegasm', playQueuePointer = this.get('playQueuePointer'), playQueue = this.get('playQueue');

    if(playQueuePointer !== -1){
      var song = playQueue[playQueuePointer];
      if(song.title){
        title = song.title;

        if(song.artist){
          title += (' - ' + song.artist);
        }
      } else {
        title = song.filename;
      }

      title += '- Huegasm';
    }

    document.title = title;
  }.observes('playQueuePointer'),

  clearCurrentAudio(resetPointer) {
    var dancer = this.get('dancer');

    if(dancer.audio.pause) {
      dancer.pause();
    }

    clearInterval(this.get('incrementElapseTimeHandle'));

    if(resetPointer){
      this.set('playQueuePointer', -1);
    }

    this.setProperties({
      timeElapsed: 0,
      timeTotal: 0,
      playing: false
    });
  },

  dragOver() {
    var dragLeaveTimeoutHandle = this.get('dragLeaveTimeoutHandle');
    this.set('dragging', true);

    if (dragLeaveTimeoutHandle) {
      clearTimeout(dragLeaveTimeoutHandle);
    }
  },

  dragLeave(){
    // need to delay the dragLeave notification to avoid flickering ( hovering over some page elements causes this event to be sent )
    var self = this;
    this.set('dragLeaveTimeoutHandle', setTimeout(function(){ self.set('dragging', false); }, 500));
  },

  simulateKick(mag) {
    var activeLights = this.get('activeLights'),
      transitionTime = this.get('transitionTime') * 10,
      onBeatBriAndColor = this.get('onBeatBriAndColor'),
      self = this,
      color = null,
      stimulateLight = function (light, brightness, hue) {
        var options = {'bri': brightness, 'transitiontime': transitionTime};

        if(!Em.isNone(hue)) {
          options.hue = hue;
        }

        Em.$.ajax(self.get('apiURL') + '/lights/' + light + '/state', {
          data: JSON.stringify(options),
          contentType: 'application/json',
          type: 'PUT'
        });
      };

    if(activeLights.length > 0){
      var lastLightBopIndex = this.get('lastLightBopIndex'),
        randomTransition = this.get('randomTransition'),
        light;

      if(randomTransition) {
        light = Math.floor(Math.random() * activeLights.length) + 1;
      } else {
        light = activeLights[lastLightBopIndex];
        this.set('lastLightBopIndex', (lastLightBopIndex+1) % activeLights.length);
      }

      if(onBeatBriAndColor) {
        color = Math.floor(Math.random() * 65535);
      }

      stimulateLight(light, 254, color);
      setTimeout(stimulateLight, transitionTime + 50, light, 1);

      this.set('paused', true);

      setTimeout(function () {
        self.set('paused', false);
      }, 150);
    }

    //work the music beat area
    if(this.get('speakerViewed')){
      // simulate the speaker vibration by running a CSS animation on it
      Em.$('#beatSpeakerCenterOuter').removeClass('vibrateOuter').prop('offsetWidth', Em.$('#beatSpeakerCenterOuter').prop('offsetWidth')).addClass('vibrateOuter');
      Em.$('#beatSpeakerCenterInner').removeClass('vibrateInner').prop('offsetWidth', Em.$('#beatSpeakerCenterInner').prop('offsetWidth')).addClass('vibrateInner');
    } else {
      var beatHistory = self.get('beatHistory'),
        maxSize = self.get('maxBeatHistorySize');
      beatHistory.unshiftObjects('Beat intesity of <b>' + mag.toFixed(3) + '</b> at <b>' + self.get('timeElapsedTxt') + '</b>');

      if(beatHistory.length > maxSize){
        beatHistory.popObject();
      }
    }
  },

  init() {
    this._super();

    var dancer = new Dancer(),
      self = this,
      threshold = this.get('threshold'),
      decay = this.get('decay'),
      frequency = this.get('frequency'),
      kick = dancer.createKick({
        threshold: threshold,
        decay: decay,
        frequency: frequency,
        onKick: function (mag) {
          if (self.get('paused') === false) {
            self.simulateKick(mag);
          }
        }
      });

    kick.on();

    dancer.bind('loaded', () => {
      if(this.get('usingLocalAudio')){
        this.set('timeTotal', Math.round(dancer.audio.duration));
      }
    });

    //dancer.bind('update', function(){
    //  var waveform = this.getWaveform(), spectrum = this.getSpectrum(), sumS = 0, sumW = 0;
    //  for (let i = 0, l = spectrum.length; i < l && i < 512; i++ ) {
    //    sumS += spectrum[i];
    //  }
    //
    //  for (let i = 0, l = waveform.length; i < l && i < 512; i++ ) {
    //    sumW += waveform[i];
    //  }
    //
    //  //console.log('sumW: ' + sumW + ', sumS: ' + sumS);
    //});

    this.setProperties({
      dancer: dancer,
      kick: kick
    });

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if(navigator.getUserMedia === undefined){
      this.set('usingMicSupported', false);
    }

    ['volume', 'shuffle', 'repeat', 'volumeMuted', 'threshold', 'decay', 'frequency', 'speakerViewed', 'transitionTime', 'randomTransition', 'playerBottomDisplayed', 'onBeatBriAndColor', 'audioMode'].forEach(function (item) {
      if (localStorage.getItem('huegasm.' + item)) {
        var itemVal = localStorage.getItem('huegasm.' + item);
        if (item === 'repeat' || item === 'volume' || item === 'decay' || item === 'threshold' || item === 'transitionTime' || item === 'audioMode') {
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

  didInsertElement() {
    var self = this;

    Em.$('#fileInput').on('change', function () {
      var files = this.files;
      self.send('handleNewFiles', files);
      this.value = null;
    });

    // prevent space/text selection when the user repeatedly clicks on the center
    Em.$('#beatContainer').on('mousedown', '#beatSpeakerCenterInner', function(event) {
      event.preventDefault();
    });

    Em.$(document).on('mousedown', function(event){
      if(Em.$('#musicTab').has(event.target).length === 0 && self.get('dimmerEnabled')){
        self.set('dimmerEnabled', false);
      }
    });

    // control the volume by scrolling up/down
    Em.$('#playerArea').on('mousewheel', function(event) {
      if(self.get('playQueueNotEmpty')) {
        var scrollSize = 5;

        if(event.deltaY < 0) {
          scrollSize *= -1;
        }
        var newVolume = self.get('volume') + scrollSize;

        self.send('volumeChanged', newVolume < 0 ? 0 : newVolume);
        event.preventDefault();
      }
    });
  }
});
