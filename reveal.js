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
});
