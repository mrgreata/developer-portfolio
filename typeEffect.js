(function () {
  const typedEl = document.getElementById('intro-typed');
  const cursorEl = document.getElementById('intro-cursor');

  if (!typedEl || !cursorEl) return;

  const fullText = typedEl.getAttribute('data-text') || '';
  const typingSpeed = 38;
  const startDelay = 900; // Cursor blinkt erst kurz alleine
  const finalCursorClass = 'cursor-finished';
  let index = 0;

  typedEl.textContent = '';

  function typeNextChar() {
    if (index < fullText.length) {
      typedEl.textContent += fullText.charAt(index);
      index++;
      setTimeout(typeNextChar, typingSpeed);
    } else {
      cursorEl.classList.add(finalCursorClass);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(typeNextChar, startDelay);
  });
})();