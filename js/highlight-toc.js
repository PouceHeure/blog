const TABLET_WIDTH = 1024;

document.addEventListener("DOMContentLoaded", function () {
  const toc = document.querySelector(".toc");
  const article = document.querySelector(".markdown-content");

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

  const sections = tocLinks
    .map(a => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const setActive = (id) => {
    tocLinks.forEach(a => {
      const active = a.getAttribute("href") === `#${id}`;
      a.classList.toggle("active", active);
      if (a.parentElement) {
        a.parentElement.classList.toggle("active", active);
      }
    });
  };

  let lastActive = null;
  let ticking = false;

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        let best = null;
        let bestTop = Infinity;

        sections.forEach(sec => {
          const rect = sec.getBoundingClientRect();
          const top = Math.abs(rect.top);

          if (rect.top >= -150 && top < bestTop) {
            bestTop = top;
            best = sec;
          }
        });

        if (best && best.id !== lastActive) {
          lastActive = best.id;
          setActive(best.id);
        }

        ticking = false;
      });

      ticking = true;
    }
  };

  document.addEventListener("scroll", onScroll);
  onScroll(); 
  if (location.hash) {
    setActive(location.hash.slice(1));
  }

  window.addEventListener("hashchange", () => {
    setActive(location.hash.slice(1));
  });

});
