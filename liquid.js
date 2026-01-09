(() => {
  const btn = document.querySelector('.btn-glass-liquid');
  if (!btn) return;

  let x = 0.5, y = 0.5;
  let tx = 0.5, ty = 0.5; // target
  let hovering = false;

  // smoothing: je kleiner, desto “flüssiger / verzögert”
  const ease = 0.12;

  let raf = null;
  let t = 0;

  function loop() {
    raf = null;

    // smooth follow
    x += (tx - x) * ease;
    y += (ty - y) * ease;

    // movement vector (für Flow)
    const dx = (x - 0.5);
    const dy = (y - 0.5);

    t += hovering ? 0.02 : 0.01;

    // Highlight position
    btn.style.setProperty('--mx', `${x * 100}%`);
    btn.style.setProperty('--my', `${y * 100}%`);

    // Flow layer: leichtes “Strömen” je nach Mausposition + Zeit
    btn.style.setProperty('--lx', `${dx * 18}px`);
    btn.style.setProperty('--ly', `${dy * 18}px`);
    btn.style.setProperty('--rot', `${(dx - dy) * 18 + Math.sin(t) * 8}deg`);

    // weiter animieren solange hover oder easing noch nicht “da”
    if (hovering || Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001) {
      raf = requestAnimationFrame(loop);
    }
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(loop);
  }

  btn.addEventListener('mouseenter', () => {
    hovering = true;
    schedule();
  });

  btn.addEventListener('mouseleave', () => {
    hovering = false;
    // zurück zur Mitte
    tx = 0.5; ty = 0.5;
    schedule();
  });

  btn.addEventListener('mousemove', (e) => {
    const r = btn.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width;
    ty = (e.clientY - r.top) / r.height;
    schedule();
  });
})();
