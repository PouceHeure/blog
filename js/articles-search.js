document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchInput");

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        const query = searchInput.value.toLowerCase();
        const cards = document.querySelectorAll(".card");

        cards.forEach(card => {
          const titleEl = card.querySelector(".card-title");
          const conferenceEl = card.querySelector(".card-text strong");
          const conferenceText = conferenceEl?.nextSibling?.nodeValue?.toLowerCase() || "";
          const title = titleEl?.textContent.toLowerCase() || "";

          const tags = Array.from(card.querySelectorAll(".badge")).map(tag =>
            tag.textContent.toLowerCase()
          );

          const matches =
            title.includes(query) ||
            conferenceText.includes(query) ||
            tags.some(tag => tag.includes(query));

          card.parentElement.style.display = matches ? "block" : "none";
        });
      });
    }
  });