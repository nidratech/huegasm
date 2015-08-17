import Em from 'ember';

export default Em.Component.extend(Em.TargetActionSupport, {

  actions: {
    clickLight: function(id, data){
      this.attrs.selectLight(id, data);
    },
    lightStartHover: function(id){
      if(this.get('activeLights').contains(id)){
        Em.$.ajax(this.get('apiURL')  + '/lights/' + id + '/state', {
          data: JSON.stringify({"alert": "lselect"}),
          contentType: 'application/json',
          type: 'PUT'
        });
      }
    },
    lightStopHover: function(id){
      if(this.get('activeLights').contains(id)){
        Em.$.ajax(this.get('apiURL')  + '/lights/' + id + '/state', {
          data: JSON.stringify({"alert": "none"}),
          contentType: 'application/json',
          type: 'PUT'
        });
      }
    }
  },

  classNames: ['lightGroup'],

  // list of all the lights in the hue system
  lightsList: function(){
    var lightsData = this.get('lightsData'), lightsList = [], type;
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

        lightsList.push({type: type, name: lightsData[key].name, id: key, data: lightsData[key], activeClass: this.get('activeLights').contains(key) ? 'active' : 'inactive' });
      }
    }

    return lightsList;
  }.property('lightsData', 'activeLights')
});
