/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  var app = new EmberApp(defaults);

  app.import('vendor/dancer.js');

  app.import('bower_components/intro.js/intro.js');
  app.import('bower_components/intro.js/introjs.css');
  app.import('bower_components/intro.js/themes/introjs-nassim.css');
  app.import('bower_components/JavaScript-ID3-Reader/dist/id3-minimized.js');
  app.import('bower_components/locallyjs/dist/locally.min.js');
  app.import('bower_components/velocity/velocity.js');

  return app.toTree();
};
