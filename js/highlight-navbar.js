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

  function get_base_url(url){ splitted = url.split("/"); if(splitted.length < 2){ return ""; } return splitted[1]; }

  currentPath = stripBase(window.location.pathname, basePath);
  url = new URL(basePath);
  currentPath = "/" + currentPath.slice(url.pathname.length)
  currentPath = "/" + get_base_url(currentPath)

  document.querySelectorAll("a.nav-link").forEach(link => {
    const linkUrl = new URL(link.getAttribute("href"), window.location.origin);
    linkPath = stripBase(linkUrl.pathname, basePath);
    linkPath = "/" + linkPath.slice(url.pathname.length)

      if (currentPath == linkPath) {
        link.classList.add("active");
      }
    
  });
}
