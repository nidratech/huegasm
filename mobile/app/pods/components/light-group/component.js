import Ember from 'ember';

const {
  A,
  Component,
  computed,
  isNone,
  observer
} = Ember;

export default Component.extend({
  elementId: 'active-lights',
  classNames: ['light-group'],
  activeLights: A(),

  // list of all the lights in the hue system
  lightsList: computed('lightsData', 'activeLights.[]', 'dimmerOn', function(){
    let lightsData = this.get('lightsData'),
      activeLights = this.get('activeLights'),
      dimmerOn = this.get('dimmerOn'),
      lightsList = A(),
      type,
      activeClass;

    for (let key in lightsData) {
      activeClass = 'light-active';

      if (lightsData.hasOwnProperty(key) && lightsData[key].state.reachable) {
        switch(lightsData[key].modelid){
          case 'LCT001':
            type = 'a19';
            break;
          case 'LCT002':
            type = 'br30';
            break;
          case 'LCT003':
            type = 'gu10';
            break;
          case 'LST001':
            type = 'lightstrip';
            break;
          case 'LLC010':
            type = 'lc_iris';
            break;
          case 'LLC011':
            type = 'lc_bloom';
            break;
          case 'LLC012':
            type = 'lc_bloom';
            break;
          case 'LLC006':
            type = 'lc_iris';
            break;
          case 'LLC007':
            type = 'lc_aura';
            break;
          case 'LLC013':
            type = 'storylight';
            break;
          case 'LWB004':
            type ='a19';
            break;
          case 'LLC020':
            type = 'huego';
            break;
          default:
            type = 'a19';
        }

        if(dimmerOn){
          type += 'w';
        }

        if(!activeLights.includes(key)){
          activeClass = 'light-inactive';
        }

        lightsList.push({type: type, name: lightsData[key].name, id: key, data: lightsData[key], activeClass: activeClass});
      }
    }

    return lightsList;
  }),

  onActiveLightsChange: observer('activeLights.[]', function(){
    this.get('storage').set('huegasm.activeLights', this.get('activeLights'));
  }),

  init(){
    this._super(...arguments);

    let lightsData = this.get('lightsData'),
      activeLights = this.get('activeLights'),
      activeLightsCache = this.get('storage').get('huegasm.activeLights');

    if(!isNone(activeLightsCache)){
      activeLightsCache.forEach(function(i){
        if (lightsData.hasOwnProperty(i) && lightsData[i].state.reachable) {
          activeLights.pushObject(i);
        }
      });
    } else {
      for (let key in lightsData) {
        if (lightsData.hasOwnProperty(key) && lightsData[key].state.reachable) {
          activeLights.pushObject(key);
        }
      }
    }
  },

  actions: {
    clickLight(id){
      let activeLights = this.get('activeLights'),
        lightId = activeLights.indexOf(id);

      if(lightId !== -1){
        activeLights.removeObject(id);
      } else {
        activeLights.pushObject(id);
        this.set('syncLight', id);
      }
    }
  }
});
