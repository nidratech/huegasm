import Ember from 'ember';

const {
  Component,
  observer,
  computed,
  isEmpty,
  isNone,
  $
} = Ember;

export default Component.extend({
  url: null,

  onIsShowingModalChange: observer('isShowingModal', function(){
    if(this.get('isShowingModal')){
      this.set('url', null);
      setTimeout(()=>{
        $('md-input-container input').focus();
      }, 500);
    }

  }),

  saveDisabled: computed('url', function(){
    return isNone(this.get('url')) || isEmpty(this.get('url').trim());
  }),

  didInsertElement: function() {
    $(document).keypress((event)=>{
      if(!this.get('saveDisabled') && event.which === 13) {
        this.send('add');
      }
    });
  },

  actions: {
    close () {
      this.sendAction();
    },
    add (){
      this.sendAction('action', this.get('url'));
    }
  }
});
