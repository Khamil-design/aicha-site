(function () {

  const input = document.getElementById("searchInput");
  const results = document.getElementById("searchResults");

  if (!input || !results || typeof searchData === "undefined") return;

  // ---------------------------------------------------------------
  // Normalisation du texte arabe : on enlève les voyelles (tachkil),
  // le tatwil, et on uniformise les lettres qui s'écrivent de
  // plusieurs façons (أ/إ/آ -> ا, ة -> ه, ى -> ي...).
  // Sans ça, une recherche comme "اسلامية" ne trouve pas "إسلامية".
  // ---------------------------------------------------------------
  function normalize(text) {
    return (text || "")
      .toString()
      .toLowerCase()
      .replace(/[\u064B-\u0652\u0670\u0640]/g, "") // tachkil + tatwil
      .replace(/[إأآا]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/[ًٌٍَُِّْـ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Pré-calcule les champs normalisés une seule fois pour aller vite.
  const index = searchData.map((item) => ({
    ...item,
    _title: normalize(item.title),
    _description: normalize(item.description),
    _keywords: normalize(item.keywords)
  }));

  function score(item, words) {
    let total = 0;

    for (const w of words) {
      if (!w) continue;

      let hit = false;

      if (item._title.includes(w)) {
        // Bonus si le mot commence en début de titre ou de mot.
        total += item._title.startsWith(w) ? 12 : 8;
        hit = true;
      }
      if (item._keywords.includes(w)) {
        total += 4;
        hit = true;
      }
      if (item._description.includes(w)) {
        total += 2;
        hit = true;
      }

      // Un mot de la requête absent de tout le contenu = résultat écarté.
      if (!hit) return 0;
    }

    return total;
  }

  function highlight(text, words) {
    if (!text) return "";
    let safe = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const normalizedWords = words.filter(Boolean);
    if (normalizedWords.length === 0) return safe;

    // On surligne en se basant sur le texte normalisé pour retrouver
    // la position correspondante dans le texte original (même longueur
    // pour toutes nos substitutions, donc les index correspondent).
    const normalizedText = normalize(text);
    const ranges = [];

    normalizedWords.forEach((w) => {
      let start = 0;
      let idx;
      while ((idx = normalizedText.indexOf(w, start)) !== -1) {
        ranges.push([idx, idx + w.length]);
        start = idx + w.length;
      }
    });

    if (ranges.length === 0) return safe;

    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [ranges[0]];
    for (const r of ranges.slice(1)) {
      const last = merged[merged.length - 1];
      if (r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else merged.push(r);
    }

    let out = "";
    let cursor = 0;
    for (const [s, e] of merged) {
      out += safe.slice(cursor, s);
      out += "<mark>" + safe.slice(s, e) + "</mark>";
      cursor = e;
    }
    out += safe.slice(cursor);
    return out;
  }

  function render(matches, words) {
    results.innerHTML = "";

    if (matches.length === 0) {
      results.innerHTML = '<div class="no-result">لا توجد نتائج</div>';
      results.style.display = "block";
      return;
    }

    matches.forEach((item, i) => {
      const div = document.createElement("div");
      div.className = "search-item";
      div.setAttribute("role", "option");
      div.dataset.index = i;
      div.innerHTML = `
        <h6>${highlight(item.title, words)}</h6>
        <p>${highlight(item.description, words)}</p>
      `;
      div.addEventListener("click", () => {
        window.location.href = item.url;
      });
      results.appendChild(div);
    });

    results.style.display = "block";
  }

  let activeIndex = -1;

  function setActive(items, i) {
    items.forEach((el) => el.classList.remove("active"));
    if (i >= 0 && i < items.length) {
      items[i].classList.add("active");
      items[i].scrollIntoView({ block: "nearest" });
    }
    activeIndex = i;
  }

  let debounceTimer = null;
  let currentMatches = [];

  function runSearch() {
    const raw = input.value.trim();

    if (raw === "") {
      results.innerHTML = "";
      results.style.display = "none";
      currentMatches = [];
      activeIndex = -1;
      return;
    }

    const normalizedQuery = normalize(raw);
    const words = normalizedQuery.split(" ").filter(Boolean);

    currentMatches = index
      .map((item) => ({ item, s: score(item, words) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((r) => r.item);

    activeIndex = -1;
    render(currentMatches, words);
  }

  input.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runSearch, 120);
  });

  input.addEventListener("keydown", function (e) {
    const items = Array.from(results.querySelectorAll(".search-item"));
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(items, Math.min(activeIndex + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(items, Math.max(activeIndex - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && currentMatches[activeIndex]) {
        window.location.href = currentMatches[activeIndex].url;
      } else if (currentMatches[0]) {
        window.location.href = currentMatches[0].url;
      }
    } else if (e.key === "Escape") {
      results.style.display = "none";
    }
  });

  document.addEventListener("click", function (e) {
    if (!results.contains(e.target) && e.target !== input) {
      results.style.display = "none";
    }
  });

})();
