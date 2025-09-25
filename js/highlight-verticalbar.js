// Section Indicator Scroll Effect
    const sections = ["home", "projects", "videos"];
    const indicatorLinks = document.querySelectorAll(".section-indicator a");

    function activateSection(currentId) {
      indicatorLinks.forEach(link => {
        if (link.dataset.section === currentId) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
    }

    function onScroll() {
      let scrollPosition = window.scrollY + window.innerHeight / 2;
      for (let id of sections) {
        let section = document.getElementById(id);
        if (section) {
          let offsetTop = section.offsetTop;
          let offsetHeight = section.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            activateSection(id);
            break;
          }
        }
      }
    }

    document.addEventListener("scroll", onScroll);
    onScroll(); // initial state



  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault(); // prevents default scrolling
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        const elementRect = targetElement.getBoundingClientRect();
        const elementTop = elementRect.top + window.scrollY;
        const elementHeight = targetElement.offsetHeight;
        const offset = (window.innerHeight / 2) - (elementHeight / 2);

        window.scrollTo({
          top: elementTop - offset,
          behavior: 'smooth'
        });
      }
    });
  });
