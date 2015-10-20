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
    gotoURL(URL){
      Em.$('.tooltip').remove();
      window.open(URL, '_blank');
    },
    handleNewSoundCloudURL(URL){
      if(URL) {
        SC.resolve(URL).then((resultObj)=>{
          var processResult = (result)=>{
            if(result.kind === 'user'){
              this.get('notify').alert({html: this.get('scUserNotSupportedHtml')});
            } else if(result.kind === 'track') {
              if(result.streamable === true){
                var picture = null;

                if(result.artwork_url){
                  picture = result.artwork_url;
                } else if(result.user.avatar_url){
                  picture = result.user.avatar_url;
                }

                this.get('playQueue').pushObject({url: result.stream_url + '?client_id=' + this.get('SC_CLIENT_ID'), fileName: result.title + ' - ' + result.user.username, artist: result.user.username, scUrl: result.permalink_url, title: result.title, artworkUrl: result.artwork_url, picture: picture });
              } else {
                failedSongs.push(result.title);
              }
            } else if(result.kind === 'playlist'){
              if(result.streamable === true){
                result.tracks.forEach(processResult);
              } else {
                failedSongs.push(result.title);
              }
            }
          },
            failedSongs = [];

          if(resultObj instanceof Array){
            resultObj.forEach(processResult);

            if(failedSongs.length > 0) {
              this.get('notify').alert({html: this.get('notStreamableHtml')(failedSongs)});
            }
          } else {
            processResult(resultObj);
          }

          if(this.get('playQueuePointer') === -1 && !this.get('firstVisit')){
            this.send('next');
          }
        }, () => {
          this.get('notify').alert({html: this.get('urlNotFoundHtml')(URL)});
        });
      }

      this.set('isShowingAddSoundCloudModal', false);
    },
    toggleIsShowingAddSoundCloudModal() {
      this.toggleProperty('isShowingAddSoundCloudModal');
    },
    useLocalAudio(){
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
      this.$('#playerBottom').slideToggle();
      this.changePlayerControl('playerBottomDisplayed', !this.get('playerBottomDisplayed'));
    },
    goToSong(index, playSong, scrollToSong){
      var dancer = this.get('dancer'), playQueue = this.get('playQueue');

      if(dancer.audio) {
        this.clearCurrentAudio(true);
      }

      if(!Em.isNone(playQueue[index])) {
        var audio = new Audio();
        audio.src = this.get('playQueue')[index].url;

        audio.crossOrigin = "anonymous";
        audio.oncanplay = ()=>{
          this.set('timeTotal', Math.floor(audio.duration));
        };
        audio.onerror = ()=>{
          var playQueuePointer =this.get('playQueuePointer'),
            song = this.get('playQueue')[playQueuePointer];

          this.send('removeAudio', playQueuePointer);

          this.get('notify').alert({html: this.get('failedToPlayFileHtml')(song.fileName)});
        };
        audio.ontimeupdate = ()=>{
          this.set('timeElapsed', Math.floor(audio.currentTime));
        };
        audio.onended = ()=> {
          this.send('next');
        };

        dancer.load(audio);

        this.set('playQueuePointer', index);

        this.loadSongBeatPreferences();

        if(playSong){
          this.send('play');
        }

        if(scrollToSong){
          var playListArea = Em.$('#playListArea');

          // this is just a bad workaround to make sure that the track has been rendered to the playlist
          Em.run.later(()=>{
            var track = Em.$('.track'+index);

            if(!Em.isNone(track)) {
              playListArea.animate({
                scrollTop: track.offset().top - playListArea.offset().top + playListArea.scrollTop()
              });
            }
          }, 1000);
        }
      }
    },
    removeAudio(index){
      this.get('playQueue').removeAt(index);

      // need to manually remove the tooltip
      Em.$('body .tooltip').remove();

      if(index === this.get('playQueuePointer')) {
        this.send('goToSong', index, true, true);
      }
    },
    defaultControls(){
      var beatOptions = this.get('beatOptions');

      this.changePlayerControl('threshold', beatOptions.threshold.defaultValue);
      this.changePlayerControl('interval', beatOptions.interval.defaultValue);
      this.changePlayerControl('frequency', beatOptions.frequency.defaultValue);
      this.changePlayerControl('transitionTime', beatOptions.transitionTime.defaultValue);
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

          if(!replayPause){
            this.set('timeElapsed', Math.floor(dancer.getTime()));
          }
        } else {
          var timeTotal = this.get('timeTotal');

          if(this.get('volumeMuted')) {
            dancer.setVolume(0);
          } else {
            dancer.setVolume(this.get('volume')/100);
          }

          // replay song
          if(this.get('timeElapsed') === timeTotal && timeTotal !== 0){
            this.send('seekChanged', 0);
          }

          dancer.play();
        }

        this.toggleProperty('playing');
      }
    },
    volumeChanged(value) {
      this.changePlayerControl('volume', value);
      if(this.get('playing')) {
        this.get('dancer').setVolume(value/100);
      }

      if(this.get('volume') > 0 && this.get('volumeMuted')){
        this.changePlayerControl('volumeMuted', false);
      }
    },
    next(userTriggered) {
      var playQueuePointer = this.get('playQueuePointer'),
        playQueueLength = this.get('playQueue.length'),
        nextSong = (playQueuePointer + 1),
        repeat = this.get('repeat'),
        shuffle = this.get('shuffle');

      this.get('beatHistory').clear();

      if(repeat === 2){ // repeating one song takes precedence over shuffling
        if(playQueuePointer === -1 && playQueueLength > 0) {
          nextSong = 0;
        } else {
          nextSong = playQueuePointer;
        }
      } else if(shuffle){
        var shufflePlayed = this.get('shufflePlayed');

        // played all the song in shuffle mode
        if(shufflePlayed.length === playQueueLength){
          shufflePlayed.clear();
          this.send('play', true);
          return;
        }

        do {
          nextSong = Math.floor(Math.random() * playQueueLength);
        } while(shufflePlayed.contains(nextSong));

        shufflePlayed.pushObject(nextSong);
      } else if(nextSong > playQueueLength-1){
        if(repeat === 1 || userTriggered){
          nextSong = nextSong % playQueueLength;
        } else {
          this.send('play', true);
          return;
        }
      }

      this.send('goToSong', nextSong, true, true);
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

        this.send('goToSong', nextSong, true, true);
      }
    },
    toggleVisualizations() {
      this.toggleProperty('visualizationsDisplayed');
    },
    fullscreen() {},
    seekChanged(position) {
      var dancer = this.get('dancer');

      if(dancer.audio){
        dancer.audio.currentTime = Math.floor(this.get('timeTotal') * position / 100);
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
    addLocalAudio: function () {
      Em.$('#fileInput').click();
    },
    shuffleChanged(value) {
      this.changePlayerControl('shuffle', Em.isNone(value) ? !this.get('shuffle') : value);
    },
    repeatChanged(value) {
      this.changePlayerControl('repeat', Em.isNone(value) ? (this.get('repeat') + 1) % 3 : value);
    },
    transitionTimeChanged(value) {
      this.changePlayerControl('transitionTime', value);
    },
    playerBottomDisplayedChanged(value) {
      this.changePlayerControl('playerBottomDisplayed', value);
    },
    thresholdChanged(value) {
      this.changePlayerControl('threshold', value, true);
    },
    intervalChanged(value){
      this.changePlayerControl('interval', value, true);
    },
    frequencyChanged(value){
      this.changePlayerControl('frequency', value, true);
    },
    audioModeChanged(value){
      if(value === 1) {
        this.startUsingMic();
      } else if(value === 0) {
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
          var tags = ID3.getAllTags("local"),
            picture = null;

          if(tags.picture){
            var base64String = "";
            for (var i = 0; i < tags.picture.data.length; i++) {
              base64String += String.fromCharCode(tags.picture.data[i]);
            }

            picture = "data:" + tags.picture.format + ";base64," + window.btoa(base64String);
          }

          playQueue.pushObject({filename: this.name.replace(/\.[^/.]+$/, ""), url: URL.createObjectURL(this), artist: tags.artist, title: tags.title, picture: picture });

          ID3.clearAll();

          if(self.get('playQueuePointer') === -1){
            self.send('next');
          }
        };

      for (var key in files) {
        if (files.hasOwnProperty(key)) {
          var file = files[key];

          if(file.type.startsWith('audio')) {
            ID3.loadTags("local", updatePlayQueue.bind(file),{
              dataReader: new FileAPIReader(file),
              tags: ['title', 'artist', 'album', 'track', 'picture']
            });
          }
        }
      }
    }
  },

  changePlayerControl(name, value, saveBeatPrefs){
    this.set(name, value);

    if(saveBeatPrefs && this.get('usingLocalAudio') && this.get('playQueuePointer') !== -1){
      this.saveSongBeatPreferences();
    }

    if(name === 'frequency'){
      var options = {};
      options[name] = value;
      this.get('kick').set(options);
    }

    this.get('storage').set('huegasm.' + name, value);
  },

  saveSongBeatPreferences() {
    var song = this.get('playQueue')[this.get('playQueuePointer')],
      title = Em.isEmpty(song.artist) ? song.filename : song.artist + '-' + song.title,
      songBeatPreferences = this.get('songBeatPreferences');

    songBeatPreferences[title] = {threshold: this.get('threshold'), interval: this.get('interval'), frequency: this.get('frequency') };

    this.set('usingBeatPreferences', true);
    this.get('storage').set('huegasm.songBeatPreferences', songBeatPreferences, { compress: true });
  },

  loadSongBeatPreferences() {
    var song = this.get('playQueue')[this.get('playQueuePointer')],
      title = Em.isEmpty(song.artist) ? song.filename : song.artist + '-' + song.title,
      songBeatPreferences = this.get('songBeatPreferences'),
      preference = songBeatPreferences[title],
      oldBeatPrefCache = this.get('oldBeatPrefCache'),
      newOldBeatPrefCache = null;

    if(!Em.isNone(preference)) { // load existing beat prefs
      newOldBeatPrefCache = {threshold: this.get('threshold'), interval: this.get('interval'), frequency: this.get('frequency') };

      this.changePlayerControl('threshold', preference.threshold);
      this.changePlayerControl('interval', preference.interval);
      this.changePlayerControl('frequency', preference.frequency);
      this.set('usingBeatPreferences', true);
    } else if(!Em.isNone(oldBeatPrefCache)) { // revert to using beat prefs before the remembered song
      this.changePlayerControl('threshold', oldBeatPrefCache.threshold);
      this.changePlayerControl('interval', oldBeatPrefCache.interval);
      this.changePlayerControl('frequency', oldBeatPrefCache.frequency);
      this.set('usingBeatPreferences', false);
    }

    this.set('oldBeatPrefCache', newOldBeatPrefCache);
  },

  startUsingMic() {
    navigator.getUserMedia(
      {audio: true},
      (stream) => {
        this.changePlayerControl('audioMode', 1);
        var dancer = this.get('dancer');

        if(dancer.audio && dancer.audio.pause) {
          dancer.pause();
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
    var validBeat = (this.get('threshold') < mag),
      beatInterval = this.get('interval');

    if(validBeat){
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
          lightBopIndex,
          light;

        if(randomTransition) {
          lightBopIndex = Math.floor(Math.random() * activeLights.length);

          // let's try not to select the same light twice in a row
          if(activeLights.length > 1) {
            while(lightBopIndex === lastLightBopIndex) {
              lightBopIndex = Math.floor(Math.random() * activeLights.length);
            }
          }
        } else {
          lightBopIndex = (lastLightBopIndex + 1) % activeLights.length;
        }

        light = activeLights[lightBopIndex];
        this.set('lastLightBopIndex', lightBopIndex);

        if(onBeatBriAndColor) {
          color = Math.floor(Math.random() * 65535);
        }

        stimulateLight(light, 254, color);
        setTimeout(stimulateLight, transitionTime + 50, light, 1);
      }
    }

    if(beatInterval > 0 && validBeat){
      this.set('paused', true);
      setTimeout(() => {
        this.set('paused', false);
      }, beatInterval * 1000);
    }

    //work the music beat area
    if(this.get('speakerViewed')){
      if(validBeat){
        // simulate the speaker vibration by running a CSS animation on it
        Em.$('#beatSpeakerCenterOuter').removeClass('vibrateOuter').prop('offsetWidth', Em.$('#beatSpeakerCenterOuter').prop('offsetWidth')).addClass('vibrateOuter');
        Em.$('#beatSpeakerCenterInner').removeClass('vibrateInner').prop('offsetWidth', Em.$('#beatSpeakerCenterInner').prop('offsetWidth')).addClass('vibrateInner');
      }
    } else {
      var beatHistory = this.get('beatHistory'),
        debugFiltered = this.get('debugFiltered'),
        maxSize = this.get('maxBeatHistorySize'),
        html = 'Beat intesity of <b>' + mag.toFixed(3) + '</b> at <b>' + this.get('timeElapsedTxt') + '</b>';

      if(!validBeat){
        if(!debugFiltered){
          return;
        }
        html = '<span class="filterBeat">' + html + ' ( filtered ) </span>';
      }
      beatHistory.unshiftObjects(html);

      if(beatHistory.length > maxSize){
        beatHistory.popObject();
      }
    }
  },

  init() {
    this._super();

    var dancer = new Dancer(),
      self = this,
      storage = this.get('storage'),
      frequency = this.get('frequency'),
      kick = dancer.createKick({
        threshold: this.beatOptions.threshold.range.min,
        frequency: frequency,
        onKick: function (mag) {
          if (self.get('paused') === false) {
            self.simulateKick(mag);
          }
        }
      });

    kick.on();

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

    ['volume', 'shuffle', 'repeat', 'volumeMuted', 'threshold', 'interval', 'frequency', 'speakerViewed', 'transitionTime', 'randomTransition', 'playerBottomDisplayed', 'onBeatBriAndColor', 'audioMode', 'songBeatPreferences', 'debugFiltered', 'firstVisit'].forEach(function (item) {
      if (!Em.isNone(storage.get('huegasm.' + item))) {
        var itemVal = storage.get('huegasm.' + item);

        if(Em.isNone(self.actions[item+'Changed'])){
          self.set(item, itemVal);
        } else {
          self.send(item + 'Changed', itemVal);
        }
      }
    });

    SC.initialize({
      client_id: this.get('SC_CLIENT_ID')
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

    // demo tracks
    if(this.get('firstVisit')){
      this.send('handleNewSoundCloudURL', 'https://soundcloud.com/jacobanthony43/jacobychillcatalystbarstommisch');
      this.send('handleNewSoundCloudURL', 'https://soundcloud.com/odesza/light-feat-little-dragon');
      this.send('handleNewSoundCloudURL', 'https://soundcloud.com/sinusic-prod/lisboa');
      // TODO: uncomment and test
      //this.get('storage').set('huegasm.firstVisit', false);
    }

    if(!this.get('playerBottomDisplayed')) {
      Em.$('#playerBottom').hide();
    }
  }
});
