import Em from 'ember';
import musicControlMixin from '../mixins/music-control';

export default Em.Component.extend(musicControlMixin, {
  classNames: ['innerControlFrame'],
  classNameBindings: ['active::hidden'],

  actions: {
    goToSong: function(index){
      if(index !== this.get('playQueuePointer')) {
        var dancer = this.get('dancer'), audio = new Audio();
        audio.src = this.get('playQueue')[index].url;

        if(dancer.audio) {
          this.send('clearCurrentAudio');
        }

        dancer.load(audio);
        this.setProperties({
          playQueuePointer: index,
          timeElapsed: 0
        });

        this.send('play');
      }
    },
    clearCurrentAudio: function() {
      var dancer = this.get('dancer');

      dancer.pause();
      clearInterval(this.get('incrementElapseTimeHandle'));

      this.setProperties({
        playQueuePointer: -1,
        timeElapsed: 0,
        timeTotal: 0,
        playing: false
      });
    },
    removeAudio: function(index){
      if(index === this.get('playQueuePointer')) {
        this.send('clearCurrentAudio');
      }

      this.get('playQueue').removeAt(index);

      //if(index === this.get('playQueuePointer')){
      //  this.get('dancer')
      //}
    },
    defaultControls: function(){
      var beatOptions = this.get('beatOptions');

      this.changePlayerControl('threshold', beatOptions.threshold.defaultValue, true);
      this.changePlayerControl('decay', beatOptions.decay.defaultValue, true);
      this.changePlayerControl('frequency', beatOptions.frequency.defaultValue, true);
    },
    clickLight:function() {
      debugger;
    },
    playerAreaPlay: function(){
      if(Em.isEmpty(Em.$('#playerControls:hover'))){
        this.send('play');
        Em.$('#playerArea').removeClass('material-icons').prop('offsetWidth', Em.$('#playerArea').prop('offsetWidth')).addClass('material-icons');
      }
    },
    play: function () {
      var dancer = this.get('dancer');

      if(this.get('playQueuePointer') !== -1 ) {
        if (this.get('playing')) {
          dancer.pause();
          clearInterval(this.get('incrementElapseTimeHandle'));
          this.toggleProperty('playing');
          this.set('timeElapsed', Math.floor(dancer.getTime()));
        } else {
          if(this.get('volumeMuted')) {
            dancer.setVolume(0);
          } else {
            dancer.setVolume(this.get('volume')/100);
          }

          dancer.play();
          this.set('incrementElapseTimeHandle', window.setInterval(this.incrementElapseTime.bind(this), 1000));
          this.toggleProperty('playing');
        }
      }
    },
    volumeChanged: function (value) {
      this.changePlayerControl('volume', value);
      if(this.get('playing')) {
        this.get('dancer').setVolume(value/100);
      }
    },
    next: function () {
      var playQueuePointer = this.get('playQueuePointer'), playQueueLength = this.get('playQueue.length');
      var nextSong = (playQueuePointer + 1) % playQueueLength;

      this.send('goToSong', nextSong);
    },
    previous: function () {
      if(this.get('timeElapsed') > 5) {
        this.send('seekChanged', 0);
      } else {
        var nextSong = this.get('playQueuePointer');
        nextSong--;

        if(nextSong < 0) {
          nextSong = this.get('playQueue.length') - 1;
        }

        this.send('goToSong', nextSong);
      }
    },
    fullscreen: function () {

    },
    seekChanged: function (position) {
      var audioPosition = Math.floor(this.get('timeTotal') * position / 100);
      this.get('dancer').source.currentTime = audioPosition;
      this.set('timeElapsed', audioPosition);
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
    playListAreaAddAudio: function(){
      this.send('addAudio');
    },
    speakerViewedChanged: function(value){
      this.set('speakerViewed', value);
    },
    clickSpeaker: function(){
      // simulate the speaker vibration by running a CSS animation on it
      Em.$('#beatSpeakerCenter').removeClass('pop').prop('offsetWidth', Em.$('#beatSpeakerCenter').prop('offsetWidth')).addClass('pop');
    },
    dropFiles: function(){
      this.setProperties({
        dragging: false,
        draggingOverPlayListArea: false
      });
      this.send('handleNewFiles', event.dataTransfer.files);
    },
    playListAreaDragOver: function(){
      this.set('draggingOverPlayListArea', true);
    },
    playListAreaDragLeave: function(){
      this.set('draggingOverPlayListArea', false);
    },
    handleNewFiles: function(files){
      var self = this,
        playQueue = this.get('playQueue'),
        updatePlayQueue = function(){
        var tags = ID3.getAllTags("local");
        playQueue.push({filename: this.name.replace(/\.[^/.]+$/, ""), url: URL.createObjectURL(this), artist: tags.artist, title: tags.title });

        ID3.clearAll();
        self.notifyPropertyChange('playQueue');

        // make sure to init the first song
        if(playQueue.length > 0 && self.get('playQueuePointer') === -1){
          self.send('goToSong', 0);
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

  dragLeaveTimeoutHandle: null,

  dragOver: function() {
    var dragLeaveTimeoutHandle = this.get('dragLeaveTimeoutHandle');
    this.set('dragging', true);

    if (dragLeaveTimeoutHandle) {
      clearTimeout(dragLeaveTimeoutHandle);
    }
  },

  dragLeave: function(){
    // need to delay the dragLeave notification to avoid flickering ( hovering over some page elements causes this event to be sent )
    var self = this;
    this.set('dragLeaveTimeoutHandle', setTimeout(function(){ self.set('dragging', false); }, 500));
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

            if(self.get('speakerViewed')){
              self.send('clickSpeaker');
            } else {
              var beatHistory = self.get('beatHistory'),
                maxSize = self.get('maxBeatHistorySize');
              beatHistory.unshiftObjects('Beat strength of <b>' + mag.toFixed(3) + '</b> at <b>' + self.get('timeElapsedTxt') + '</b>');
              if(beatHistory.length > maxSize){
                beatHistory.popObject();
              }
            }
          }

        }
      });

    kick.on();

    dancer.bind('loaded', function(){
      self.set('timeTotal', Math.round(dancer.audio.duration));
    });

    this.setProperties({
      dancer: dancer,
      kick: kick
    });

    ['volume', 'shuffle', 'repeat', 'volumeMuted', 'threshold', 'decay', 'frequency', 'speakerViewed'].forEach(function (item) {
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
    var self = this;

    Em.$('#fileInput').on('change', function () {
      var files = this.files;
      self.send('handleNewFiles', files);
    });

    // prevent space/text selection when the user repeatedly clicks on the center
    Em.$('#beatSpeakerContainer').on('mousedown', '#beatSpeakerCenter', function(event) {
      event.preventDefault();
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
