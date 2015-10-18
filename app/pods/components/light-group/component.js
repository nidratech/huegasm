import Em from 'ember';

export default Em.Component.extend({

  classNames: ['lightGroup'],

  isHovering: false,

  lightsList: Em.A(),

  actions: {
    clickLight(id, data){
      this.sendAction('action', id, data);
    },
    lightStartHover(id){
      var hoveredLight = this.get('lightsList').filter(function(light){
        return light.activeClass !== 'unreachable' && light.id === id[0];
      });

      if(!Em.isEmpty(hoveredLight) && this.get('noHover') !== true){
        Em.$.ajax(this.get('apiURL')  + '/lights/' + id + '/state', {
          data: JSON.stringify({"alert": "lselect"}),
          contentType: 'application/json',
          type: 'PUT'
        });
      }

      this.set('isHovering', true);
    },
    lightStopHover(id){
      var hoveredLight = this.get('lightsList').filter(function(light){
        return light.activeClass !== 'unreachable' && light.id === id[0];
      });

      if(!Em.isEmpty(hoveredLight) && this.get('noHover') !== true){
        Em.$.ajax(this.get('apiURL')  + '/lights/' + id + '/state', {
          data: JSON.stringify({"alert": "none"}),
          contentType: 'application/json',
          type: 'PUT'
        });
      }

      this.set('isHovering', false);
      this.onLightsDataChange();
    }
  },

  didInsertElement() {
    if(this.get('lightsData')){
      this.onLightsDataChange();
    }
  },

  // list of all the lights in the hue system
  onLightsDataChange: function(){
    if(!this.get('isHovering')){
      var lightsData = this.get('lightsData'), lightsList = Em.A(), type;
      for (var key in lightsData) {
        if (lightsData.hasOwnProperty(key)) {
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

          var activeClass = 'lightActive';

          if(!this.get('activeLights').contains(key)){
            activeClass = 'lightInactive';
          } else if(!lightsData[key].state.reachable){
            activeClass = 'lightUnreachable';
          }

          lightsList.push({type: type, name: lightsData[key].name, id: key, data: lightsData[key], activeClass: activeClass});
        }
      }

      this.set('lightsList', lightsList);
    }
  }.observes('lightsData', 'activeLights.[]', 'dimmerOn')
});
