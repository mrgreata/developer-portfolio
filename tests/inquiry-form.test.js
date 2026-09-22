const test = require('node:test');
const assert = require('node:assert/strict');
const { initializeInquiryForm } = require('../inquiry-form');
function setup(search = '') {
  const listeners = {};
  const kind = { value: '', addEventListener: (event, fn) => { listeners[event] = fn; } };
  const branch = (name, required = false) => ({ dataset: { inquiryBranch: name }, hidden: false,
    controls: [{ disabled: false, required: false, hasAttribute: () => required }],
    querySelectorAll() { return this.controls; } });
  const branches = [branch('Eigenes Projekt', true), branch('Entwicklungspartnerschaft', true), branch('Eigenes Projekt|Öffentliches Projekt / Ausschreibung')];
  const form = { querySelector: () => kind, querySelectorAll: () => branches, addEventListener: (event, fn) => { listeners[event] = fn; } };
  initializeInquiryForm(form, search);
  return { kind, branches, listeners };
}
test('partner links preselect partnership and exclude budget from validation and submission', () => {
  const { kind, branches } = setup('?anfrage=partner');
  assert.equal(kind.value, 'Entwicklungspartnerschaft');
  assert.equal(branches[1].hidden, false);
  assert.equal(branches[1].controls[0].required, true);
  assert.equal(branches[2].controls[0].disabled, true);
  assert.equal(branches[0].controls[0].required, false);
});
test('switching branches never leaves hidden required controls enabled', () => {
  const {kind,branches,listeners}=setup();
  for(const value of ['Eigenes Projekt','Entwicklungspartnerschaft','Öffentliches Projekt / Ausschreibung','Sonstiges','']) {
    kind.value=value;listeners.change();
    for(const branch of branches) {
      assert.equal(branch.controls[0].disabled,branch.hidden);
      if(branch.hidden) assert.equal(branch.controls[0].required,false);
    }
  }
});
test('public project links show budget but no irrelevant project-type fields', () => {
  const {kind,branches}=setup('?anfrage=oeffentlich');
  assert.equal(kind.value,'Öffentliches Projekt / Ausschreibung');
  assert.equal(branches[2].hidden,false);assert.equal(branches[0].hidden,true);
});
test('successful native reset hides and disables all conditional fields', async () => {
  const {kind,branches,listeners}=setup('?anfrage=partner');
  listeners.reset();kind.value='';await Promise.resolve();
  assert.ok(branches.every(branch=>branch.hidden && branch.controls[0].disabled));
});
