import Ember from 'ember';

const {
  Component,
  computed
} = Ember;

export default Component.extend({
  tagName: 'footer',
  elementId: 'footer',

  year: computed(function () {
    return new Date().getFullYear();
  })
});
