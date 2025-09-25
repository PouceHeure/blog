function get_base_url(url) {
  const splitted = url.split("/");
  return splitted.length < 2 ? "" : splitted[1];
}

document.addEventListener("DOMContentLoaded", function () {
  const currentPath = window.location.pathname;
  const currentPathBase = get_base_url(currentPath);

  const navLinks = document.querySelectorAll('a.nav-link');

  navLinks.forEach(link => {
    const linkBaseUrl = get_base_url(link.getAttribute("href"));
    if (linkBaseUrl === currentPathBase) {
      link.classList.add("active");
    }
  });
});
