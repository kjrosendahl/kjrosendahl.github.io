function isIndexPage() {
  const path = window.location.pathname;
  return path === "/" || (path.endsWith("/index.html") && !path.includes("/pages/"));
}

function isGalleryPage() {
  return window.location.pathname.includes("/pages/gallery/");
}

function renderHeader(data) {
  const galleryActive = isGalleryPage() || (isIndexPage() && window.location.hash === "#gallery");
  const homeActive = isIndexPage() && window.location.hash !== "#gallery";

  return `
    <header class="site-header">
      <nav class="tabs" aria-label="Primary">
        <a href="/" data-tab="home"${homeActive ? ' class="is-active"' : ""}>Home</a>
        <a href="/#gallery" data-tab="gallery"${galleryActive ? ' class="is-active"' : ""}>Gallery</a>
      </nav>
      <a class="resume-button" href="${data.resumeUrl}" target="_blank" rel="noopener">Resume</a>
    </header>
  `;
}

function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderList(items, withDates) {
  return items
    .map((item) => {
      const date = withDates && item.date ? `<span class="date">${formatDate(item.date)}</span>` : "";
      return `<li><a href="${item.url}">${item.title}</a>${date}</li>`;
    })
    .join("");
}

function galleryIndex(albums) {
  return [...albums]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .map((album) => ({
      title: album.title,
      url: `/pages/gallery/${album.slug}/`,
    }));
}

function renderSocials(socials) {
  return `
    <div class="socials">
      <a href="https://letterboxd.com/${socials.letterboxd}" target="_blank" rel="noopener" aria-label="Letterboxd"><i class="fa-solid fa-film"></i></a>
      <a href="https://open.spotify.com/user/${socials.spotify}" target="_blank" rel="noopener" aria-label="Spotify"><i class="fa-brands fa-spotify"></i></a>
      <a href="https://github.com/${socials.github}" target="_blank" rel="noopener" aria-label="GitHub"><i class="fa-brands fa-github"></i></a>
      <a href="https://www.linkedin.com/in/${socials.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fa-brands fa-linkedin"></i></a>
      <a href="mailto:${socials.email}" aria-label="Email"><i class="fa-regular fa-envelope"></i></a>
    </div>
  `;
}

function showTab(name) {
  const home = document.getElementById("panel-home");
  const gallery = document.getElementById("panel-gallery");
  if (!home || !gallery) {
    return;
  }
  const isGallery = name === "gallery";
  home.hidden = isGallery;
  gallery.hidden = !isGallery;
  document.querySelectorAll(".tabs a").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.tab === (isGallery ? "gallery" : "home"));
  });
}

function fillPostMeta() {
  const meta = document.getElementById("post-meta");
  if (!meta) {
    return;
  }
  const title = meta.dataset.title;
  const date = meta.dataset.date;
  const playlist = meta.dataset.playlist;
  const showDate = Boolean(date) && !isGalleryPage();

  const titleRow = document.createElement("div");
  titleRow.className = "post-title-row";

  const titleEl = document.createElement("h1");
  titleEl.className = "post-title";
  titleEl.textContent = title;
  titleRow.appendChild(titleEl);

  if (playlist) {
    const wrap = document.createElement("span");
    wrap.className = "playlist";
    wrap.innerHTML = `<a href="https://open.spotify.com/playlist/${playlist}" target="_blank" rel="noopener" aria-label="Playlist"><i class="fa-brands fa-spotify"></i></a>`;
    titleRow.appendChild(wrap);
  }

  meta.appendChild(titleRow);

  if (showDate) {
    const dateEl = document.createElement("time");
    dateEl.className = "post-date";
    dateEl.dateTime = date;
    dateEl.textContent = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    meta.appendChild(dateEl);
  }
}

function initLuckyButton(entries) {
  const button = document.getElementById("lucky-button");
  const track = button?.querySelector(".lucky-track");
  if (!button || !track || !entries || !entries.length) {
    return;
  }

  const defaultWord = "Lucky";
  const viewport = button.querySelector(".lucky-viewport");
  let index = -1;
  let timer = null;
  let animating = false;
  let activeWord = defaultWord;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const SCROLL_MS = 550;

  const sizeToLongestWord = () => {
    if (!viewport) {
      return;
    }
    const probe = document.createElement("span");
    probe.className = "lucky-word";
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    probe.style.whiteSpace = "nowrap";
    button.appendChild(probe);

    let widest = 0;
    const words = [defaultWord, ...entries.map((entry) => entry.word)];
    for (const word of words) {
      probe.textContent = word;
      widest = Math.max(widest, probe.offsetWidth);
    }
    probe.remove();
    viewport.style.width = `${Math.ceil(widest)}px`;
  };

  const current = () => {
    if (index < 0) {
      return null;
    }
    return entries[index % entries.length];
  };

  const pickRandomIndex = () => {
    if (entries.length === 1) {
      return 0;
    }
    let nextIndex = Math.floor(Math.random() * entries.length);
    // Avoid repeating the same word back-to-back when possible.
    while (nextIndex === index) {
      nextIndex = Math.floor(Math.random() * entries.length);
    }
    return nextIndex;
  };

  const setHref = () => {
    const item = current();
    button.href = item?.url || "#";
    button.setAttribute("aria-label", `I'm Feeling ${activeWord}`);
  };

  const setWordImmediate = (word) => {
    track.innerHTML = `<span class="lucky-word is-current">${word}</span>`;
    activeWord = word;
    setHref();
  };

  sizeToLongestWord();

  const scrollToWord = (word) =>
    new Promise((resolve) => {
      if (animating || word === activeWord) {
        resolve();
        return;
      }
      animating = true;
      const currentEl = track.querySelector(".lucky-word.is-current");
      if (!currentEl) {
        setWordImmediate(word);
        animating = false;
        resolve();
        return;
      }

      const incoming = document.createElement("span");
      incoming.className = "lucky-word is-incoming";
      incoming.textContent = word;
      track.appendChild(incoming);

      // Ensure layout before transitioning (down -> up).
      void track.offsetWidth;
      track.classList.add("is-scrolling");

      window.setTimeout(() => {
        track.classList.remove("is-scrolling");
        currentEl.remove();
        incoming.classList.remove("is-incoming");
        incoming.classList.add("is-current");
        incoming.style.transform = "";
        activeWord = word;
        setHref();
        animating = false;
        resolve();
      }, SCROLL_MS);
    });

  const showDefault = async () => {
    index = -1;
    button.classList.remove("is-cycling");
    await scrollToWord(defaultWord);
    setHref();
  };

  const next = async () => {
    if (animating) {
      return;
    }
    index = pickRandomIndex();
    button.classList.add("is-cycling");
    await scrollToWord(current().word);
  };

  const start = (intervalMs) => {
    if (timer) {
      return;
    }
    button.classList.add("is-cycling");
    next();
    timer = window.setInterval(() => {
      next();
    }, intervalMs);
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
    showDefault();
  };

  const syncMode = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
    button.removeEventListener("mouseenter", onEnter);
    button.removeEventListener("mouseleave", onLeave);
    if (finePointer.matches) {
      index = -1;
      button.classList.remove("is-cycling");
      setWordImmediate(defaultWord);
      setHref();
      button.addEventListener("mouseenter", onEnter);
      button.addEventListener("mouseleave", onLeave);
    } else {
      start(1800);
    }
  };

  function onEnter() {
    start(1400);
  }

  function onLeave() {
    stop();
  }

  button.addEventListener("click", (event) => {
    // Idle "Lucky" click: jump somewhere random.
    // While cycling: use the word currently on screen.
    const item = current() || entries[pickRandomIndex()];
    if (!item?.url) {
      event.preventDefault();
      return;
    }
    button.href = item.url;
  });

  if (typeof finePointer.addEventListener === "function") {
    finePointer.addEventListener("change", syncMode);
  } else if (typeof finePointer.addListener === "function") {
    finePointer.addListener(syncMode);
  }

  syncMode();
}

async function init() {
  const [siteRes, galleryRes] = await Promise.all([
    fetch("/data/site.json"),
    document.getElementById("gallery-list") ? fetch("/data/galleries.json") : Promise.resolve(null),
  ]);
  const data = await siteRes.json();

  const headerHost = document.getElementById("site-header");
  if (headerHost) {
    headerHost.innerHTML = renderHeader(data);
  }

  const projects = document.getElementById("project-list");
  const blog = document.getElementById("blog-list");
  const gallery = document.getElementById("gallery-list");
  const socials = document.getElementById("socials");

  if (projects) {
    projects.innerHTML = renderList(data.projects, true);
  }
  if (blog) {
    blog.innerHTML = renderList(data.blog, true);
  }
  if (gallery && galleryRes) {
    const albums = await galleryRes.json();
    gallery.innerHTML = renderList(galleryIndex(albums), false);
  }
  if (socials) {
    socials.innerHTML = renderSocials(data.socials);
  }

  initLuckyButton(data.lucky);
  fillPostMeta();

  if (document.getElementById("panel-home")) {
    const setFromHash = () => showTab(window.location.hash === "#gallery" ? "gallery" : "home");
    setFromHash();
    window.addEventListener("hashchange", setFromHash);
    document.querySelectorAll(".tabs a[data-tab]").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (!isIndexPage()) {
          return;
        }
        event.preventDefault();
        if (link.dataset.tab === "gallery") {
          window.location.hash = "gallery";
        } else {
          history.replaceState(null, "", "/");
          showTab("home");
        }
      });
    });
  }
}

init();
