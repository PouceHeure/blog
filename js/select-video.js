const HEADER_SELECTOR = 'header'
const EXTRA_OFFSET = 100

function getHeaderOffset () {
  const header = document.querySelector(HEADER_SELECTOR)
  return (header ? header.offsetHeight : 0) + EXTRA_OFFSET
}

function isYouTubeSection (el) {
  return (
    el &&
    el.querySelector('iframe[src*="youtube.com"], iframe[src*="youtu.be"]')
  )
}

function scrollToTarget (target) {
  const y =
    target.getBoundingClientRect().top + window.scrollY - getHeaderOffset()
  window.scrollTo({ top: y, behavior: 'smooth' })
}

function handleAnchor (hash, preventDefault, event) {
  if (!hash || hash === '#') return
  const id = hash.startsWith('#') ? hash : '#' + hash
  const target = document.querySelector(id)
  if (!isYouTubeSection(target)) return

  if (preventDefault && event) event.preventDefault()
  setTimeout(() => scrollToTarget(target), 0)
  if (preventDefault) history.pushState(null, '', id)
}

document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]')
  if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
    return
  handleAnchor(a.getAttribute('href'), true, e)
})

window.addEventListener('load', () => {
  if (location.hash) handleAnchor(decodeURIComponent(location.hash), false)
})

window.addEventListener('hashchange', () => {
  handleAnchor(decodeURIComponent(location.hash), false)
})
