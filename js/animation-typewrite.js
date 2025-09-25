document.addEventListener("DOMContentLoaded", function () {
  function smartTitleCase(s) {
    return s.replace(/\b[\p{L}\p{N}][\p{L}\p{N}-]*\b/gu, (w) => {
      if (/^[A-Z0-9]+$/.test(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    });
  }

  function formatTag(name) {
    const raw = String(name || "");
    if (window.tagReprMap && Object.prototype.hasOwnProperty.call(tagReprMap, raw)) {
      return tagReprMap[raw];
    }
    const parts = raw.split("_").filter(Boolean);
    if (parts.length === 2) return smartTitleCase(parts[0]) + " & " + smartTitleCase(parts[1]);
    return smartTitleCase(parts.join(" "));
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Build words from injected data, else fallback to tagReprMap keys, else bail
  let wordsSource = Array.isArray(window.wordsHugo) ? window.wordsHugo : [];
  if (wordsSource.length === 0 && window.tagReprMap) {
    wordsSource = Object.keys(window.tagReprMap);
  }
  const words = shuffleArray(wordsSource.map(formatTag));

  let i = 0;
  const changingWord = document.getElementById("changing-word");

  function typeWriterEffect(word, index) {
    if (!changingWord) return;
    if (index <= word.length) {
      changingWord.textContent = word.substring(0, index);
      setTimeout(() => typeWriterEffect(word, index + 1), 100);
    } else {
      setTimeout(() => deleteEffect(word.length), 2000);
    }
  }

  function deleteEffect(length) {
    if (!changingWord) return;
    if (length >= 0) {
      changingWord.textContent = changingWord.textContent.substring(0, length);
      setTimeout(() => deleteEffect(length - 1), 50);
    } else {
      i = (i + 1) % words.length;
      setTimeout(() => typeWriterEffect(words[i], 0), 500);
    }
  }

  if (words.length > 0) {
    typeWriterEffect(words[i], 0);
  } else {
    // Optional: log to debug
    console.warn("No words to display: window.wordsHugo and tagReprMap are empty/missing.");
  }
});
