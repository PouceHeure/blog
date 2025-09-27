function highlightNavbar(basePath) {
  function stripBase(path, basePath) {
    if (basePath.endsWith("/")) {
      basePath = basePath.slice(0, -1); 
    }

    if (path.startsWith(basePath)) {
      path = path.substring(basePath.length);
    }


    if (path.length > 1 && path.endsWith("/")) {
      path = path.slice(0, -1);
    }

    return path || "/";
  }

  const currentPath = stripBase(window.location.pathname, basePath);

  document.querySelectorAll("a.nav-link").forEach(link => {
    const linkUrl = new URL(link.getAttribute("href"), window.location.origin);
    const linkPath = stripBase(linkUrl.pathname, basePath);

    if (currentPath === linkPath) {
      link.classList.add("active");
    }
  });
}
