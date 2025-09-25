const TABLET_WIDTH = 1024;

document.addEventListener("DOMContentLoaded", function () {
  const toc = document.querySelector(".toc");
  const article = document.querySelector(".markdown-content");

  // Responsive behavior for consistency
  function adjustLayout() {
    if (!toc || !article) return;
    if (window.innerWidth < TABLET_WIDTH) {
      toc.classList.add("d-none");
      article.classList.remove("w-md-75");
      article.classList.add("w-100", "mx-auto");
    } else {
      toc.classList.remove("d-none");
      article.classList.remove("w-100", "mx-auto");
      article.classList.add("w-md-75");
    }
  }
  window.addEventListener("resize", adjustLayout);
  adjustLayout();

  const tocLinks = Array.from(document.querySelectorAll(".toc a[href^='#']"));
  if (!tocLinks.length) return;

  const targets = tocLinks
    .map(a => document.getElementById(a.getAttribute("href").slice(1)))
    .filter(Boolean);

  // Helper: activer un lien
  const setActive = (id) => {
    tocLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${id}`));
  };

  // Observer pour activer le lien de la partie visible
  const io = new IntersectionObserver((entries) => {
    // Select the topmost visible element in the viewport
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top)[0];

    if (visible) setActive(visible.target.id);
  }, {
    root: null,
    rootMargin: "0px 0px -60% 0px",
    threshold: 0.1
  });

  targets.forEach(t => io.observe(t));

  // If a hash is present on load
  if (location.hash) {
    const id = location.hash.slice(1);
    setTimeout(() => setActive(id), 0);
  }

  // On navigation via hash (e.g., browser back)
  window.addEventListener("hashchange", () => {
    const id = location.hash.slice(1);
    setActive(id);
  });
});
