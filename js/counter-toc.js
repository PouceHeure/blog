document.addEventListener("DOMContentLoaded", function () {
  const toc = document.querySelector("#TableOfContents");
  if (!toc) return;

  let counters = [];

  function buildNumbering(ul, depth = 0) {
    let index = 1;

    ul.querySelectorAll(":scope > li").forEach(li => {
      counters[depth] = index;
      const number = counters.slice(0, depth + 1).join(".") + ".";

      const a = li.querySelector(":scope > a");
      if (a && !a.dataset.numbered) {
        a.dataset.numbered = "true";
        a.innerHTML = `<span class="toc-num">${number}</span> ${a.innerHTML}`;
      }

      const childUl = li.querySelector(":scope > ul");
      if (childUl) buildNumbering(childUl, depth + 1);

      index++;
    });
  }

  const rootUl = toc.querySelector(":scope > ul");
  if (rootUl) buildNumbering(rootUl);
});
