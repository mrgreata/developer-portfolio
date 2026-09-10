(() => {
  document.documentElement.classList.add('js');
  const button = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  function closeMenu(returnFocus = false) {
    if (!button || !nav) return;
    nav.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    if (returnFocus) button.focus();
  }
  button?.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  nav?.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && button?.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav')) closeMenu();
  });
})();
