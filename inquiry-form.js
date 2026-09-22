/* Conditional fields use native controls and retain the existing mail endpoint. */
function initializeInquiryForm(form, search = '') {
  const kind = form.querySelector('[data-inquiry-kind]');
  if (!kind) return;
  const branches = [...form.querySelectorAll('[data-inquiry-branch]')];
  const sync = () => {
    branches.forEach(branch => {
      const active = branch.dataset.inquiryBranch.split('|').includes(kind.value);
      branch.hidden = !active;
      branch.querySelectorAll('input,select,textarea').forEach(control => {
        control.disabled = !active;
        control.required = active && control.hasAttribute('data-required');
      });
    });
  };
  const route = new URLSearchParams(search).get('anfrage');
  if (route === 'partner') kind.value = 'Entwicklungspartnerschaft';
  if (route === 'oeffentlich') kind.value = 'Öffentliches Projekt / Ausschreibung';
  kind.addEventListener('change', sync);
  form.addEventListener('reset', () => queueMicrotask(sync));
  sync();
}
if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-contact-form]').forEach(form => initializeInquiryForm(form, location.search));
}
if (typeof module !== 'undefined') module.exports = { initializeInquiryForm };
