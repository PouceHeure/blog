function highlightNavbar(basePath) {
  function stripBase(path, basePath) {
    if (basePath.endsWith("/")) basePath = basePath.slice(0, -1);
    if (path.startsWith(basePath)) path = path.substring(basePath.length);
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    return path || "/";
  }

  function get_base_url(url) {
    const parts = url.split("/");
    return parts.length < 2 ? "" : parts[1];
  }

  function normalizePath(path, basePath, base) {
    let stripped = stripBase(path, basePath);
    stripped = "/" + stripped.slice(base.pathname.length);
    return "/" + get_base_url(stripped);
  }

  const base = new URL(basePath);
  const currentPath = normalizePath(window.location.pathname, basePath, base);

  document.querySelectorAll("a.nav-link").forEach(link => {
    const linkUrl = new URL(link.getAttribute("href"), window.location.origin);
    const linkPath = normalizePath(linkUrl.pathname, basePath, base);
    if (currentPath === linkPath) link.classList.add("active");
  });
}
