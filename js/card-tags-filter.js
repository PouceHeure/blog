function updateYearVisibility () {
  const projectLists = document.querySelectorAll('.projectList')

  projectLists.forEach(projectList => {
    const visibleCards = Array.from(
      projectList.querySelectorAll('.card')
    ).filter(card => card.parentElement.style.display !== 'none')

    const yearTitle = projectList.previousElementSibling // h2

    if (visibleCards.length === 0) {
      projectList.style.display = 'none'
      if (yearTitle && yearTitle.tagName === 'H2') {
        yearTitle.style.display = 'none'
      }
    } else {
      projectList.style.display = ''
      if (yearTitle && yearTitle.tagName === 'H2') {
        yearTitle.style.display = ''
      }
    }
  })
}

document.addEventListener('DOMContentLoaded', function () {
  const tagLinks = document.querySelectorAll('.tag-link')
  const cards = document.querySelectorAll('.card')
  let activeTag = 'All'

  const selectedTagDisplay = document.getElementById('selectedTagDisplay')
  const selectedTagName = document.getElementById('selectedTagName')

  tagLinks.forEach(link => {
    link.addEventListener('click', function (event) {
      event.preventDefault()
      const selectedTag = this.textContent.replace('#', '').trim()

      if (activeTag === selectedTag) {
        this.classList.remove('btn-secondary', 'text-light')
        this.classList.add('btn-outline-secondary', 'text-secondary')
        activeTag = 'All'
        showAllCards()

        selectedTagDisplay.classList.add('d-none')
        selectedTagName.textContent = ''
      } else {
        tagLinks.forEach(a => {
          a.classList.remove('btn-secondary', 'text-light')
          a.classList.add('btn-outline-secondary', 'text-secondary')
        })
        this.classList.remove('btn-outline-secondary', 'text-secondary')
        this.classList.add('btn-secondary', 'text-light')
        activeTag = selectedTag
        filterCards(selectedTag)

        selectedTagDisplay.classList.remove('d-none')
        selectedTagName.textContent = selectedTag
      }
    })
  })

  function showAllCards () {
    cards.forEach(card => {
      card.parentElement.style.display = 'block'
    })
    updateYearVisibility()
  }

  function filterCards (tag) {
    cards.forEach(card => {
      const cardTags = Array.from(card.querySelectorAll('.badge')).map(el =>
        el.textContent.trim().toLowerCase()
      )

      if (cardTags.includes(tag.toLowerCase())) {
        card.parentElement.style.display = 'block'
      } else {
        card.parentElement.style.display = 'none'
      }
    })
    updateYearVisibility()
  }

  const clearSelectedTagBtn = document.getElementById('clearSelectedTag')

  clearSelectedTagBtn.addEventListener('click', function () {
    // Reset tag buttons to unselected state
    tagLinks.forEach(a => {
      a.classList.remove('btn-secondary', 'text-light')
      a.classList.add('btn-outline-secondary', 'text-secondary')
    })
    // Reset filter
    activeTag = 'All'
    showAllCards()
    // Hide selected tag display
    selectedTagDisplay.classList.add('d-none')
    selectedTagName.textContent = ''
  })
})
