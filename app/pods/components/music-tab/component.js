import Em from 'ember';
import helperMixin from './mixins/helpers';
import visualizerMixin from './mixins/visualizer';

export default Em.Component.extend(helperMixin, visualizerMixin, {
  onActiveChange: function(){
    if(this.get('active')){
      Em.$('#playNotification').removeClass('fadeOut');
      Em.$('#beatSpeakerCenterOuter').removeClass('vibrateOuter');
      Em.$('#beatSpeakerCenterInner').removeClass('vibrateInner');
    }
  }.observes('active'),

  actions: {
    clearPlaylist(){
      this.get('playQueue').clear();
    },
    setVisName(name){
      this.set('currentVisName', name);
    },
    hideTooltip(){
      Em.$('.bootstrapTooltip').tooltip('hide');
    },
    gotoSCURL(URL){
      // need to pause the music since soundcloud is going to start playing this song anyways
      if(this.get('playing')){
        this.send('play');
      }

      this.send('gotoURL', URL);
    },
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
                  picture = result.artwork_url.replace('large', 't67x67');
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
          } else {
            processResult(resultObj);
          }

          if(failedSongs.length > 0) {
            this.get('notify').alert({html: this.get('notStreamableHtml')(failedSongs)});
          }

          if(this.get('playQueuePointer') === -1){
            if(this.get('firstVisit')){
              this.send('goToSong', 0);
            } else {
              this.send('next');
            }
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
        var tracks = audioStream.getVideoTracks();
        if (tracks && tracks[0] && tracks[0].stop) {
          tracks[0].stop();
        }

        if (audioStream.stop) {
          // deprecated, may be removed in future
          audioStream.stop();
        }

        this.setProperties({
          audioStream: null,
          playing: false
        });
      }

      if(this.get('playQueuePointer') !== -1) {
        this.send('goToSong', this.get('playQueuePointer'));
        this.send('volumeChanged', this.get('volume'));
      }

      // restore the old beat preferences ( before the user went into mic mode )
      if(!Em.isNone(this.get('oldThreshold'))){
        this.set('threshold', this.get('oldThreshold'));
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
          this.set('soundCloudFuckUps', 0);
        };
        audio.onerror = (event)=>{
          var playQueuePointer =this.get('playQueuePointer'),
            song = this.get('playQueue')[playQueuePointer];

          if(this.get('soundCloudFuckUps') >= this.get('maxSoundCloudFuckUps')) {
            this.get('notify').alert({html: this.get('tooManySoundCloudFuckUps')});
            this.send('play');
            this.set('soundCloudFuckUps', 0);
          } else {
            if(song.local){
              this.send('removeAudio', playQueuePointer);
            } else {
              this.send('next', true);
            }

            if(event.target.error.code === 2){
              this.get('notify').alert({html: this.get('failedToDecodeFileHtml')(song.fileName)});
            } else {
              this.get('notify').alert({html: this.get('failedToPlayFileHtml')(song.fileName)});
            }

            this.set('usingBeatPreferences', false);
            this.incrementProperty('soundCloudFuckUps');
          }
        };
        audio.ontimeupdate = ()=>{
          this.set('timeElapsed', Math.floor(audio.currentTime));
        };
        audio.onended = ()=> {
          this.send('next');
        };

        dancer.load(audio, 1);

        this.set('playQueuePointer', index);

        this.loadSongBeatPreferences();

        if(playSong){
          this.send('play');
        }

        if(scrollToSong){
          // this is just a bad workaround to make sure that the track has been rendered to the playlist
          Em.run.later(()=>{
            var track = Em.$('.track'+index), playListArea = Em.$('#playListArea');

            if(!Em.isNone(track) && !Em.isNone(track.offset())) {
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
    playerAreaPlay(){
      if(Em.isEmpty(Em.$('#playerControls:hover')) && this.get('playQueuePointer') !== -1 ){
        this.send('play');
        this.set('fadeOutNotification', true);
        Em.$('#playNotification').removeClass('fadeOut').prop('offsetWidth', Em.$('#playNotification').prop('offsetWidth')).addClass('fadeOut');
      }
    },
    play(replayPause) {
      var dancer = this.get('dancer'),
        playQueuePointer = this.get('playQueuePointer');

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
            this.send('next', true);
            return;
          }

          Em.$(window).trigger('resize'); // workaround to redraw the canvas for the vitualizer

          dancer.play();
        }

        this.onColorloopModeChange();
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
    next(repeatAll) {
      var playQueuePointer = this.get('playQueuePointer'),
        playQueue = this.get('playQueue'),
        nextSong = (playQueuePointer + 1),
        repeat = this.get('repeat'),
        shuffle = this.get('shuffle');

      if(repeat === 2){ // repeating one song takes precedence over shuffling
        if(playQueuePointer === -1 && playQueue.length > 0) {
          nextSong = 0;
        } else {
          nextSong = playQueuePointer;
        }
      } else if(shuffle){ // next shuffle song
        var shufflePlayed = this.get('shufflePlayed');

        // played all the song in shuffle mode
        if(shufflePlayed.length === playQueue.length){
          shufflePlayed.clear();
          this.send('play', true);
          return;
        }

        // we're going to assume that the song URL is the id
        do {
          nextSong = Math.floor(Math.random() * playQueue.length);
        } while(shufflePlayed.contains(playQueue[nextSong].url));

        shufflePlayed.pushObject(playQueue[nextSong].url);
      } else if(nextSong > playQueue.length-1){
        if(repeat === 1 || repeatAll){
          nextSong = nextSong % playQueue.length;
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
        var nextSong = this.get('playQueuePointer'),
          playQueue = this.get('playQueue');

        if(this.get('shuffle') && !Em.isNone(playQueue[nextSong])) { // go to the previously shuffled song
          var shufflePlayed = this.get('shufflePlayed'),
            shuffledSongIndx = this.get('shufflePlayed').indexOf(playQueue[nextSong].url),
            i = 0;

          if(shufflePlayed.length > 0 && shuffledSongIndx !== -1){ // only if there was one
            nextSong = shuffledSongIndx - 1;

            if(nextSong < 0){
              nextSong = shufflePlayed.length - 1;
            }

            playQueue.some(function(item){ // try to find the previous song id
              if(item.url === shufflePlayed[nextSong]){
                nextSong = i;
                return true;
              }
              i++;

              return false;
            });
          }
        } else {
          nextSong--;

          if(nextSong < 0) {
            nextSong = playQueue.length - 1;
          }
        }

        this.send('goToSong', nextSong, true, true);
      }
    },
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
    playerBottomDisplayedChanged(value) {
      this.changePlayerControl('playerBottomDisplayed', value);
    },
    thresholdChanged(value) {
      this.changePlayerControl('threshold', value, true);
    },
    hueRangeChanged(value) {
      this.changePlayerControl('hueRange', value);
    },
    micBoostChanged(value) {
      this.set('micBoost', value);
      this.get('storage').set('huegasm.micBoost', value);

      if(this.get('usingMicAudio')) {
        this.get('dancer').setBoost(value);
      }
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
    playQueuePointerChanged(value){
      this.send('goToSong', value, false, true);
    },
    clickSpeaker(){
      this.simulateKick(1);
    },
    dropFiles(files){
      this.setProperties({
        dragging: false,
        draggingOverPlayListArea: false
      });
      this.send('handleNewFiles', files);
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

          playQueue.pushObject({fileName: this.name.replace(/\.[^/.]+$/, ""), url: URL.createObjectURL(this), artist: tags.artist, title: tags.title, picture: picture, local: true });

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

    if(name === 'threshold'){
      this.get('kick').set({threshold: value});
    }

    if(saveBeatPrefs && this.get('usingLocalAudio') && this.get('playQueuePointer') !== -1){
      this.saveSongBeatPreferences();
    }

    this.get('storage').set('huegasm.' + name, value);
  },

  saveSongBeatPreferences() {
    var song = this.get('playQueue')[this.get('playQueuePointer')];
    if(song) {
      var title = Em.isEmpty(song.artist) ? song.fileName : song.artist + '-' + song.title,
        songBeatPreferences = this.get('songBeatPreferences');

      songBeatPreferences[title] = {threshold: this.get('threshold')};

      this.set('usingBeatPreferences', true);
      this.get('storage').set('huegasm.songBeatPreferences', songBeatPreferences);
    }
  },

  loadSongBeatPreferences() {
    var song = this.get('playQueue')[this.get('playQueuePointer')],
      title = Em.isEmpty(song.artist) ? song.fileName : song.artist + '-' + song.title,
      songBeatPreferences = this.get('songBeatPreferences'),
      preference = songBeatPreferences[title],
      oldBeatPrefCache = this.get('oldBeatPrefCache'),
      newOldBeatPrefCache = null;

    if(!Em.isNone(preference)) { // load existing beat prefs
      newOldBeatPrefCache = {threshold: this.get('threshold')};

      this.changePlayerControl('threshold', preference.threshold);
      this.set('usingBeatPreferences', true);
    } else if(!Em.isNone(oldBeatPrefCache)) { // revert to using beat prefs before the remembered song
      this.changePlayerControl('threshold', oldBeatPrefCache.threshold);
      this.set('usingBeatPreferences', false);
    }

    this.set('oldBeatPrefCache', newOldBeatPrefCache);
  },

  doAmbienceLightChange: function(justOneLight){
    var activeLights = this.get('activeLights'),
      lightsData = this.get('lightsData'),
      workedLights = this.get('ambienceWorkedLights'),
      hueRange = this.get('hueRange'),
      ambienceWorkedLightsHandles = this.get('ambienceWorkedLightsHandles'),
      lightOff = (light)=>{
        if(this.get('ambienceMode') && this.get('playing')){
          Em.$.ajax(this.get('apiURL') + '/lights/' + light + '/state', {
            data: JSON.stringify({'on': false, 'transitiontime': 20}),
            contentType: 'application/json',
            type: 'PUT'
          });
        }
      },
      lights = [],
      transitionTime = Math.floor(Math.random()*20),
      iterations = justOneLight ? 1 : activeLights.length/2;

    // pick some random lights
    for(let i=0; i < iterations; i++){
      let l = activeLights[Math.floor(Math.random()*activeLights.length)];

      if(!lights.contains(l) && !workedLights.contains(l)){
        lights.push(l);
        workedLights.push(l);
      } else if(justOneLight && workedLights.length !== activeLights.length){ // work a light if we only need one
        while(workedLights.contains(l)){
          l = activeLights[Math.floor(Math.random()*activeLights.length)];
        }

        lights.push(l);
        workedLights.push(l);
      }
    }

    lights.forEach((light)=>{
      var options = {'hue': Math.floor(Math.random()*(hueRange[1] - hueRange[0] + 1)+hueRange[0]), 'bri': Math.floor(Math.random()*200) + 1, 'transitiontime': transitionTime};

      if(lightsData[light].state.on === false){
        options.on = true;
      }

      Em.$.ajax(this.get('apiURL') + '/lights/' + light + '/state', {
        data: JSON.stringify(options),
        contentType: 'application/json',
        type: 'PUT'
      });

      // stop the light from turning off
      if(ambienceWorkedLightsHandles[light]){
        clearTimeout(ambienceWorkedLightsHandles[light]);
        delete ambienceWorkedLightsHandles[light];
      }

      // turn the light off after it's been idle for a while
      ambienceWorkedLightsHandles[light] = setTimeout(()=>{
        lightOff(light);
        workedLights.removeObject(light);
        delete ambienceWorkedLightsHandles[light];
      }, transitionTime * 100 + 1000);
    });
  },

  onAmbienceModeChange: function() {
    if(this.get('ambienceMode') && this.get('playing')) {
      this.set('ambienceModeHandle', setInterval(()=> {this.doAmbienceLightChange();}, 5000));
      this.setProperties({
        'colorloopMode': false,
        'flashingTransitions': false
      });
    } else if(this.get('ambienceModeHandle')) {
      this.get('activeLights').forEach((light)=>{
        Em.$.ajax(this.get('apiURL') + '/lights/' + light + '/state', {
          data: JSON.stringify({'on': true}),
          contentType: 'application/json',
          type: 'PUT'
        });
      });

      clearInterval(this.get('ambienceModeHandle'));
      this.set('ambienceModeHandle', null);
    }
  }.observes('ambienceMode', 'playing'),

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

        dancer.load(stream, this.get('micBoost'), true);
        this.set('usingBeatPreferences', false);

        // much more sensitive beat preference settings are needed for mic mode
        this.setProperties({
          oldThreshold: this.get('threshold'),
          threshold: 0.1
        });

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
        title = song.fileName;
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

  simulateKick(/*mag, ratioKickMag*/) {
    var activeLights = this.get('activeLights'),
      lightsData = this.get('lightsData'),
      color = null,
      transitiontime = this.get('flashingTransitions'),
      stimulateLight = (light, brightness, hue) => {
        var options = {'bri': brightness};

        if(transitiontime) {
          options['transitiontime'] = 0;
        } else {
          options['transitiontime'] = 1;
        }

        if(!Em.isNone(hue)) {
          options.hue = hue;
        }

        if(lightsData[light].state.on === false){
          options.on = true;
        }

        Em.$.ajax(this.get('apiURL') + '/lights/' + light + '/state', {
          data: JSON.stringify(options),
          contentType: 'application/json',
          type: 'PUT'
        });
      },
      timeToBriOff = 100;

    if(activeLights.length > 0 && !this.get('ambienceMode')){
      var lastLightBopIndex = this.get('lastLightBopIndex'),
        lightBopIndex,
        brightnessOnBeat = 254,
        light;

      lightBopIndex = Math.floor(Math.random() * activeLights.length);

      // let's try not to select the same light twice in a row
      if(activeLights.length > 1) {
        while(lightBopIndex === lastLightBopIndex) {
          lightBopIndex = Math.floor(Math.random() * activeLights.length);
        }
      }

      light = activeLights[lightBopIndex];
      this.set('lastLightBopIndex', lightBopIndex);

      if(!this.get('colorloopMode')) {
          var hueRange = this.get('hueRange');

          color = Math.floor(Math.random()*(hueRange[1] - hueRange[0] + 1)+hueRange[0]);
      }

      if(transitiontime){
        timeToBriOff = 80;
      }

      stimulateLight(light, brightnessOnBeat, color);
      setTimeout(stimulateLight, timeToBriOff, light, 1);
    }

    this.set('paused', true);
    setTimeout(() => {
      this.set('paused', false);
    }, 150);

    if(this.get('ambienceMode') && activeLights.length > 0){
      this.doAmbienceLightChange(true);
    }

    //work the music beat area - simulate the speaker vibration by running a CSS animation on it
    Em.$('#beatSpeakerCenterOuter').removeClass('vibrateOuter').prop('offsetWidth', Em.$('#beatSpeakerCenterOuter').prop('offsetWidth')).addClass('vibrateOuter');
    Em.$('#beatSpeakerCenterInner').removeClass('vibrateInner').prop('offsetWidth', Em.$('#beatSpeakerCenterInner').prop('offsetWidth')).addClass('vibrateInner');
  },

  init() {
    this._super();

    window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
    window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    var dancer = new Dancer(),
      storage = this.get('storage'),
      kick = dancer.createKick({
        threshold: this.get('threshold'),
        onKick: (mag, ratioKickMag) => {
          if (this.get('paused') === false) {
            this.simulateKick(mag, ratioKickMag);
          }
        }
      });

    kick.on();

    this.setProperties({
      dancer: dancer,
      kick: kick
    });

    if(navigator.getUserMedia === undefined){
      this.set('usingMicSupported', false);
    }

    ['volume', 'shuffle', 'repeat', 'volumeMuted', 'threshold', 'playerBottomDisplayed', 'audioMode', 'songBeatPreferences', 'firstVisit', 'currentVisName', 'playQueue', 'playQueuePointer', 'micBoost', 'flashingTransitions', 'colorloopMode', 'ambienceMode', 'hueRange'].forEach((item)=>{
      if (!Em.isNone(storage.get('huegasm.' + item))) {
        var itemVal = storage.get('huegasm.' + item);

        if(Em.isNone(this.actions[item+'Changed'])){
          this.set(item, itemVal);
        } else {
          this.send(item + 'Changed', itemVal);
        }
      }
    });

    SC.initialize({
      client_id: this.get('SC_CLIENT_ID')
    });
  },

  didInsertElement() {
    this._super();

    var self = this;

    // file input code
    Em.$('#fileInput').on('change', function () {
      var files = this.files;
      self.send('handleNewFiles', files);
      this.value = null; // reset in case upload the second file again
    });

    Em.$(document).on('click', '.alert', (event)=>{
      Em.$(event.target).addClass('removed');
    });

    // prevent space/text selection when the user repeatedly clicks on the center
    Em.$('#beatContainer').on('mousedown', '#beatSpeakerCenterInner', function(event) {
      event.preventDefault();
    });

    Em.$(document).keypress((event) => {
      if(event.which === 32 && event.target.type !== 'text'){
        this.send('play');
      }
    });

    this.$().on('drop', '#playListArea', (event)=>{
      this.send('dropFiles', event.dataTransfer.files);
    });

    // control the volume by scrolling up/down
    Em.$('#playerArea').on('mousewheel', (event)=>{
      if(this.get('playQueueNotEmpty') && !this.get('usingMicAudio')) {
        var scrollSize = 5;

        if(event.deltaY < 0) {
          scrollSize *= -1;
        }
        var newVolume = this.get('volume') + scrollSize;

        this.send('volumeChanged', newVolume < 0 ? 0 : newVolume);
        event.preventDefault();
      }
    });

     // demo tracks
    if(this.get('firstVisit')){
      this.send('handleNewSoundCloudURL', 'https://soundcloud.com/mrsuicidesheep/candyland-speechless-feat-rkcb');
      this.send('handleNewSoundCloudURL', 'https://soundcloud.com/mrsuicidesheep/andrew-luce-when-to-love-you-feat-chelsea-cutler');
      this.send('handleNewSoundCloudURL', 'https://soundcloud.com/mrsuicidesheep/ahh-ooh-carefree-with-me');
      this.send('handleNewSoundCloudURL', 'https://soundcloud.com/odesza/light-feat-little-dragon');
      this.send('handleNewSoundCloudURL', 'https://soundcloud.com/mrsuicidesheep/crywolf-slow-burn');
      this.send('handleNewSoundCloudURL', 'https://soundcloud.com/mrsuicidesheep/clozee-red-forest');
      this.send('handleNewSoundCloudURL', 'https://soundcloud.com/mrsuicidesheep/elo-method-subranger-solace');
      this.send('handleNewSoundCloudURL', 'https://soundcloud.com/mrsuicidesheep/90-pounds-of-pete-waited-too-long-feat-devon-baldwin');
      this.send('handleNewSoundCloudURL', 'https://soundcloud.com/mrsuicidesheep/draper-eyes-open');

      this.get('storage').set('huegasm.firstVisit', false);

      this.sendAction();
    }

    if(!this.get('playerBottomDisplayed')) {
      Em.$('#playerBottom').hide();
    }
  }
});
