(() => {
  const ring = document.getElementById('cursor-ring');
  const intro = document.getElementById('intro');
  if (!ring || !intro) return;

  const RING_SIZE = 42;          // muss zu CSS width/height passen
  const HALF = RING_SIZE / 2;
  const ease = 0.12;             // kleiner = mehr Delay

  // Startposition: Screenmitte (damit kein "Sprung")
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  let scale = 1;

  // Mausziel updaten
  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  // Hover auf Buttons
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('mouseenter', () => (scale = 1.3));
    btn.addEventListener('mouseleave', () => (scale = 1));
  });

  // Cursor nur im Intro sichtbar
  const observer = new IntersectionObserver(
    ([entry]) => document.body.classList.toggle('intro-active', entry.isIntersecting),
    { threshold: 0.2 }
  );
  observer.observe(intro);

  function animate() {
    currentX += (targetX - currentX) * ease;
    currentY += (targetY - currentY) * ease;

    // ✅ Maus zeigt auf Mitte vom Kreis
    ring.style.transform =
      `translate(${currentX - HALF}px, ${currentY - HALF}px) scale(${scale})`;

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();
