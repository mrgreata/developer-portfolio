document.addEventListener("DOMContentLoaded", () => {
  const reveals = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          observer.unobserve(entry.target); // nur einmal animieren
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -60px 0px"
    }
  );

  reveals.forEach(el => {
    // Stagger-Index setzen
    if (el.classList.contains("reveal-stagger")) {
      [...el.children].forEach((child, i) => {
        child.style.setProperty("--i", i);
      });
    }
    observer.observe(el);
  });

  document.querySelectorAll(".live-companies-track").forEach((track) => {
    const group = track.querySelector(".live-company-group");
    if (!group) return;

    let frame;
    const updateMarquee = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
        const distance = group.getBoundingClientRect().width + gap;
        const duration = Math.max(24, distance / 58);

        track.style.setProperty("--marquee-distance", `-${distance}px`);
        track.style.setProperty("--marquee-duration", `${duration}s`);
        track.classList.add("is-ready");
      });
    };

    const imageReady = [...group.querySelectorAll("img")].map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    });

    Promise.all(imageReady).then(updateMarquee);

    if ("ResizeObserver" in window) {
      new ResizeObserver(updateMarquee).observe(group);
    } else {
      addEventListener("resize", updateMarquee, { passive: true });
    }
  });
});
