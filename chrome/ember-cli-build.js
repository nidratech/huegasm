/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var Funnel = require('broccoli-funnel');

module.exports = function (defaults) {
  var app = new EmberApp(defaults, {
    fingerprint: {
      enabled: false
    }
  });
  var extraAssets = new Funnel('bower_components/bootstrap-sass/assets/fonts/bootstrap/', {
    srcDir: '/',
    include: ['**'],
    destDir: '/fonts/bootstrap'
  });

  app.import('bower_components/bootstrap-sass/assets/javascripts/bootstrap/tooltip.js');
  app.import('bower_components/bootstrap-sass/assets/javascripts/bootstrap/popover.js');
  app.import('bower_components/velocity/velocity.js');

  return app.toTree(extraAssets);
};
