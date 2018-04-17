import Ember from 'ember';

const { computed, Controller } = Ember;

export default Controller.extend({
  year: computed(function() {
    return new Date().getFullYear();
  })
});
