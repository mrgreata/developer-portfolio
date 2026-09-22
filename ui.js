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


// Keep pointer effects optional: the disclosure works without JavaScript.
(() => {
  const grid = document.querySelector('.studio-values');
  if (!grid) return;
  const motion = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  let activeCard;
  const clear = () => {
    activeCard?.removeAttribute('data-edge-active');
    activeCard = null;
  };
  grid.addEventListener('pointermove', event => {
    if (!motion.matches || event.pointerType === 'touch') return;
    const card = event.target.closest('.value-card');
    if (card !== activeCard) { clear(); activeCard = card; }
    if (!card) return;
    const bounds = card.getBoundingClientRect();
    card.style.setProperty('--edge-x', `${event.clientX - bounds.left}px`);
    card.style.setProperty('--edge-y', `${event.clientY - bounds.top}px`);
    card.setAttribute('data-edge-active', '');
  }, { passive: true });
  grid.addEventListener('pointerleave', clear);
  grid.addEventListener('pointercancel', clear);
  motion.addEventListener('change', clear);
})();


// Animate the real disclosure height in both directions, including reversals.
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.value-card details').forEach(details => {
    const summary = details.querySelector('summary');
    let animation = null;
    let expanded = details.open;
    const settle = () => {
      if (animation) { animation.onfinish = null; animation.cancel(); animation = null; }
      details.open = expanded;
      details.style.removeProperty('height');
      details.style.removeProperty('overflow');
      details.dataset.expanded = String(expanded);
      summary.setAttribute('aria-expanded', String(expanded));
    };
    summary.addEventListener('click', event => {
      event.preventDefault();
      const start = details.getBoundingClientRect().height;
      expanded = !expanded;
      if (animation) { animation.onfinish = null; animation.cancel(); animation = null; }
      details.dataset.expanded = String(expanded);
      summary.setAttribute('aria-expanded', String(expanded));
      if (reducedMotion.matches || typeof details.animate !== 'function') { settle(); return; }
      details.style.removeProperty('height');
      details.open = expanded;
      const end = details.getBoundingClientRect().height;
      // Leave content rendered until the closing animation has completed.
      details.open = true;
      details.style.overflow = 'hidden';
      animation = details.animate(
        [{ height: `${start}px` }, { height: `${end}px` }],
        { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
      animation.onfinish = settle;
    });
    window.addEventListener('resize', settle, { passive: true });
    reducedMotion.addEventListener('change', settle);
  });
})();
