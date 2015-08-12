import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('controls/lights-modal-control', 'Integration | Component | controls/lights modal control', {
  integration: true
});

test('it renders', function(assert) {
  assert.expect(2);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{controls/lights-modal-control}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#controls/lights-modal-control}}
      template block text
    {{/controls/lights-modal-control}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
