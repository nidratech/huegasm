import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('modals/confirm-delete-modal', 'Integration | Component | modals/confirm delete modal', {
  integration: true
});

test('it renders', function(assert) {
  assert.expect(2);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{modals/confirm-delete-modal}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#modals/confirm-delete-modal}}
      template block text
    {{/modals/confirm-delete-modal}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
