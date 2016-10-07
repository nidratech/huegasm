import Ember from 'ember';

const {
  Component,
  observer,
  isEmpty,
  $,
  A
} = Ember;

export default Component.extend({
  classNames: ['lightGroup'],
  isHovering: false,
  lightsList: A(),

  // list of all the lights in the hue system
  onLightsDataChange: observer('lightsData', 'activeLights.[]', 'dimmerOn', function(){
    if(!this.get('isHovering')){
      let lightsData = this.get('lightsData'),
        lightsList = A(),
        type;

      for (let key in lightsData) {
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

          let activeClass = 'lightActive';

          if(!this.get('activeLights').contains(key)){
            activeClass = 'lightInactive';
          }

          lightsList.push({type: type, name: lightsData[key].name, id: key, data: lightsData[key], activeClass: activeClass});
        }
      }

      this.set('lightsList', lightsList);
    }
  }),

  didInsertElement() {
    if(this.get('lightsData')){
      this.onLightsDataChange();
    }
  },

  actions: {
    clickLight(id, data){
      let light = $('.light'+id);

      if(!light.hasClass('bootstrapTooltip')){
        light = light.parent();
      }

      if(light.hasClass('lightInactive')){
        light.addClass('lightActive').removeClass('lightInactive');
      } else if(light.hasClass('lightActive')){
        light.addClass('lightInactive').removeClass('lightActive');
      }

      this.sendAction('action', id, data);
    },
    lightStartHover(id){
      let hoveredLight = this.get('lightsList').filter(function(light){
        return light.activeClass !== 'unreachable' && light.id === id[0];
      });

      if(!isEmpty(hoveredLight) && this.get('noHover') !== true){
        $.ajax(this.get('apiURL')  + '/lights/' + id + '/state', {
          data: JSON.stringify({"alert": "lselect"}),
          contentType: 'application/json',
          type: 'PUT'
        });
      }

      this.set('isHovering', true);
    },
    lightStopHover(id){
      let hoveredLight = this.get('lightsList').filter(function(light){
        return light.activeClass !== 'unreachable' && light.id === id[0];
      });

      if(!isEmpty(hoveredLight) && this.get('noHover') !== true){
        $.ajax(this.get('apiURL')  + '/lights/' + id + '/state', {
          data: JSON.stringify({"alert": "none"}),
          contentType: 'application/json',
          type: 'PUT'
        });
      }

      this.set('isHovering', false);
      this.onLightsDataChange();
    }
  }
});
