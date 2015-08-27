import Em from 'ember';

export default Em.Component.extend({
  classNames: ['container-fluid'],

  actions: {
    play: function(){

    },
    next : function(){

    },
    previous: function(){

    }
  },

  status: null,

  playButton: function(){
    if(this.get('status') === 'paused'){
      return 'pause';
    } else {
      return 'play-arrow';
    }
  }.property('status')
});
