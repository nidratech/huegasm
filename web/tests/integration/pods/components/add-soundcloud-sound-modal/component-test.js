import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('add-soundcloud-sound-modal', 'Integration | Component | add soundcloud sound modal', {
  integration: true
});

test('it renders', function(assert) {
  assert.expect(2);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{add-soundcloud-sound-modal}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#add-soundcloud-sound-modal}}
      template block text
    {{/add-soundcloud-sound-modal}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
