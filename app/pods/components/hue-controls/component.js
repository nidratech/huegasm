import Em from 'ember';

export default Em.Component.extend({
  classNames: ['container-fluid'],
  elementId: 'hueControls',

  bridgeIp: null,
  manualBridgeIp: null,
  bridgeUsername: null,

  updateGroupsData: true,
  groupsData: null,
  lightsData: null,

  activeLights: [],

  actions: {
    changeTab(tabName){
      var index = this.get('tabList').indexOf(tabName);
      this.set('selectedTab', index);
      this.get('storage').set('huegasm.selectedTab', index);
    },
    clearBridge() {
      var storage = this.get('storage');
      storage.remove('huegasm.bridgeUsername');
      storage.remove('huegasm.bridgeIp');
      location.reload();
    },
    clearAllSettings() {
      this.get('storage').clear();
      location.reload();
    },
    startIntro(){
      var INTRO = introJs,
        intro = INTRO(),
        playerBottom = Em.$('#playerBottom'),
        beatDetectionAreaArrowIcon = Em.$('#beatDetectionAreaArrowIcon');

      this.set('dimmerOn', false);

      intro.setOptions({
        steps: [
          {
            intro: 'Welcome! This short wizard will introduce you to Huegasm.'
          },
          {
            element: '#musicTab',
            intro: 'This is the music player. You\'ll use this to play music and synchronize it with your active lights.<br><br>' +
            '<i><b>TIP</b>: Control which lights are active through the <b>Lights</b> tab or through the <b>Groups</b> menu dropdown.</i>'
          },
          {
            element: '#playlist',
            intro: 'You can add and select music to play from your playlist here. You may listen to local audio files, stream music from soundcloud or stream directly from a connected microphone.<br><br>' +
            '<i><b>TIP</b>: Songs added through Soundcloud will be saved for when you visit this page again.</i>'
          },
          {
            element: '#playerArea',
            intro: 'The audio playback may be controlled with the controls here. Basic music visualization effects may be shown here by selecting them from the menu ( eyeball icon in the bottom right ).'
          },
          {
            element: '#beatOptionRow',
            intro: 'These are the settings for the music tab:<br>' +
            '<b>Sensitivity</b> - The sensitivity of the beat detector ( more sensitivity results in more registered beats )<br>' +
            '<b>Hue Range</b> - The hue range that the lights may change to on beat.<br>' +
            '<b>Flashing Transitions</b> - Quickly flash the lights on beat<br>' +
            '<b>Colorloop</b> - Slowly cycle the lights through all the colors while the music is playing<br>' +
            '<i><b>TIP</b>: Your sensitivity settings are saved per song as indicated by the red star icon in the top left corner. These settings they will be restored if you ever listen to the same song again.</i>',
            position: 'top'
          },
          {
            element: '#beatContainer',
            intro: 'An interactive speaker that will bump when a beat is registered. <br><br>' +
            '<i><b>TIP</b>: Click on the center of the speaker to simulate a beat.</i>',
            position: 'top'
          },
          {
            element: '#lightsTab',
            intro: 'This is the lights tab. Here you\'ll be able to change various light properties:<br>' +
            '<b>Power</b> - Turn the selected lights on/off<br>' +
            '<b>Brightness</b> - The brightness level of the selected lights<br>' +
            '<b>Color</b> - The color of the selected lights<br>' +
            '<b>Strobe</b> - Selected lights will flash in sequential order<br>' +
            '<b>Colorloop</b> - Selected lights will slowly cycle through all the colors<br>'
          },
          {
            element: '#activeLights',
            intro: 'These icons represent the hue lights in your system. Active lights will be controlled by the application while the inactive lights will have a red X over them and will not be controlled.<br>' +
            'You may toggle a light\'s state by clicking on it.'
          },
          {
            element: Em.$('.settingsItem')[0],
            intro: 'The Groups menu allows for saving and quickly selecting groups of lights.',
            position: 'left'
          },
          {
            element: Em.$('.settingsItem')[1],
            intro: 'A few miscellaneous settings can be found here.<br><br>' +
            '<b>WARNING</b>: clearing application settings will resto re the application to its original state. This will even delete your playlist and any saved song beat preferences.',
            position: 'left'
          },
          {
            element: '#dimmer',
            intro: 'And that\'s it...Feel free to reach out to me through the link at the bottom of the page.<br>' +
            'Hope you enjoy the application. ;)<br><br>' +
            '<i><b>TIP</b>: click on the icon to switch to a darker theme.</i>',
            position: 'top'
          }
        ]
      });

      // it's VERY ugly but it works
      intro.onchange((element) => {
        if(element.id === 'musicTab' || element.id === 'playlist' || element.id === 'playerArea' || element.id === 'beatOptionRow' || element.id === 'beatOptionButtonGroup' || element.id === 'beatContainer' || element.id === 'usingMicAudioTooltip'){
          Em.$('#musicTab').removeClass('hidden');
          Em.$('#lightsTab').addClass('hidden');
          Em.$('.navigationItem').eq(0).removeClass('active');
          Em.$('.navigationItem').eq(1).addClass('active');
        } else {
          Em.$('#lightsTab').removeClass('hidden');
          Em.$('#musicTab').addClass('hidden');
          Em.$('.navigationItem').eq(1).removeClass('active');
          Em.$('.navigationItem').eq(0).addClass('active');
        }

        if(element.id === 'musicTab' || element.id === 'playlist' || element.id === 'playerArea'){
          playerBottom.hide();

          if(beatDetectionAreaArrowIcon.hasClass('keyboard-arrow-up')){
            beatDetectionAreaArrowIcon.removeClass('keyboard-arrow-up').addClass('keyboard-arrow-down');
          }
        } else if(element.id === 'beatOptionRow' || element.id === 'beatOptionButtonGroup' || element.id === 'beatContainer'){
          playerBottom.show();

          if(beatDetectionAreaArrowIcon.hasClass('keyboard-arrow-down')){
            beatDetectionAreaArrowIcon.removeClass('keyboard-arrow-down').addClass('keyboard-arrow-up');
          }
        } else if(element.id === 'dimmer'){
          Em.$(document).click();
        }
      });

      var onFinish = ()=>{
        this.set('activeTab', 1);
        Em.$('#musicTab').removeClass('hidden');
        Em.$('#lightsTab').addClass('hidden');
        Em.$('.navigationItem').eq(0).removeClass('active');
        Em.$('.navigationItem').eq(1).addClass('active');

        if(beatDetectionAreaArrowIcon.hasClass('keyboard-arrow-up')){
          playerBottom.show();
        } else {
          playerBottom.hide();
        }
      }, onExit = ()=>{
        var dimmer = Em.$('#dimmer');

        onFinish();
        dimmer.popover({
          trigger: 'manual',
          placement: 'top',
          content: 'Click on this icon to toggle the dark theme.'
        }).popover('show');

        setTimeout(()=>{
          dimmer.popover('hide');
        }, 5000);
      };

      // skip hidden/missing elements
      intro.onafterchange((element)=>{
        var elem = Em.$(element);
        if(elem.html() === '<!---->'){
          Em.$('.introjs-nextbutton').click();
        }
      }).onexit(onExit).oncomplete(onFinish).start();
    }
  },

  apiURL: function(){
    return 'http://' + this.get('bridgeIp') + '/api/' + this.get('bridgeUsername');
  }.property('bridgeIp', 'bridgeUsername'),

  didInsertElement(){
    // here's a weird way to automatically initialize bootstrap tooltips
    var observer = new MutationObserver(function(mutations) {
      var haveTooltip = !mutations.every(function(mutation) {
        return Em.isEmpty(mutation.addedNodes) || Em.isNone(mutation.addedNodes[0].classList) || mutation.addedNodes[0].classList.contains('tooltip');
      });

      if(haveTooltip) {
        Em.run.once(this, function(){
          Em.$('.bootstrapTooltip').tooltip();
        });
      }
    });

    observer.observe(Em.$('#hueControls')[0], {childList: true, subtree: true});
  },

  init() {
    this._super();

    if(!this.get('trial')) {
      this.doUpdateGroupsData();
      this.updateLightData();
      this.set('lightsDataIntervalHandle', setInterval(this.updateLightData.bind(this), 2000));
    }

    if (!Em.isNone(this.get('storage').get('huegasm.selectedTab'))) {
      this.set('selectedTab', this.get('storage').get('huegasm.selectedTab'));
    }
  },

  onUpdateGroupsDataChange: function(){
    if(this.get('updateGroupsData')){
      setTimeout(()=>{ this.doUpdateGroupsData(); }, 1000);
    }
  }.observes('updateGroupsData'),

  doUpdateGroupsData(){
    Em.$.get(this.get('apiURL') + '/groups', (result, status)=>{
      if (status === 'success' ) {
        this.set('groupsData', result);
      }
    });

    this.toggleProperty('updateGroupsData');
  },

  tabList: ["Lights", "Music"],
  selectedTab: 1,
  tabData: function(){
    var tabData = [], selectedTab = this.get('selectedTab');

    this.get('tabList').forEach(function(tab, i){
      var selected = false;

      if(i === selectedTab){
        selected = true;
      }

      tabData.push({"name": tab, "selected": selected });
    });

    return tabData;
  }.property('tabList', 'selectedTab'),

  lightsTabSelected: Em.computed.equal('selectedTab', 0),
  musicTabSelected: Em.computed.equal('selectedTab', 1),

  pauseLightUpdates: false,

  updateLightData(){
    var fail = ()=>{
      clearInterval(this.get('lightsDataIntervalHandle'));

      this.get('storage').remove('huegasm.bridgeIp');
      this.get('storage').remove('huegasm.bridgeUsername');

      location.reload();
    };

    if(!this.get('pauseLightUpdates')){
      Em.$.get(this.get('apiURL') + '/lights', (result, status)=>{
        if(!Em.isNone(result[0]) && !Em.isNone(result[0].error)){
          fail();
        } else if (status === 'success' && JSON.stringify(this.get('lightsData')) !== JSON.stringify(result)) {
          this.set('lightsData', result);
        }
      }).fail(fail);
    }
  },

  dimmerOnClass: function(){
    return this.get('dimmerOn') ? 'dimmerOn' : null;
  }.property('dimmerOn'),

  ready: function() {
    return this.get('trial') || !Em.isNone(this.get('lightsData'));
  }.property('lightsData', 'trial')
});
