/**
 * Inner pages: About Mono, News Room, Projects.
 * A click on a card expands it into a full-screen layer; the logo, "Contact",
 * "Back To Main Page" and the end of the Projects page collapse it back.
 * URLs use the hash (#about, #news, #projects): Back/Forward and direct links work.
 */
(() => {
  const PAGES = {
    about: {
      title: "About Mono",
      layer: ".inner--page",
      card: ".card--about",
      ghost: ".about__head",
      crop: { l: -18.8, t: -6.37, w: 132.81, h: 110.87 }, // Figma crop inside the card
      shade: 0.3,
      pos: "50% 50%",
      zoom: 1.13, // card hover scale, so the expansion starts without a jump
    },
    news: {
      title: "News Room",
      layer: ".inner--page",
      card: ".card--news",
      ghost: ".news",
      crop: { l: 0, t: -64.39, w: 100, h: 178.92 },
      shade: 0.2,
      pos: "50% 70%",
      zoom: 1.134,
    },
    projects: {
      title: "Projects",
      layer: ".inner--projects",
      card: ".card--projects",
      ghost: null, // the whole card is copied
    },
  };

  const OPEN_MS = 1100;
  const HEADER_FADE = 300;
  const DEFAULT_TITLE = "mono — Full-Service Renovation Management";

  const body = document.body;
  const navLinks = document.querySelectorAll(".header__nav [data-go]");
  const pageLayer = document.querySelector(".inner--page");
  const media = pageLayer.querySelector(".inner__media");
  const img = media.querySelector("img");
  const title = pageLayer.querySelector("#inner-title");

  let current = null;
  let busy = false;
  let ghost = null;

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const cardOf = (name) => document.querySelector(PAGES[name].card);
  const layerOf = (name) => document.querySelector(PAGES[name].layer);

  /* ---------- ghost: a copy of the card's own content that fades ---------- */
  function addGhost(name, visible) {
    removeGhost();
    const page = PAGES[name];
    const card = cardOf(name);
    ghost = document.createElement("div");
    ghost.className = "inner__ghost" + (visible ? "" : " is-gone");
    ghost.setAttribute("aria-hidden", "true");
    let copy;
    if (page.ghost) {
      copy = card.querySelector(page.ghost).cloneNode(true);
    } else {
      copy = card.cloneNode(true);
      copy.classList.remove("is-hidden");
      copy.removeAttribute("href");
      copy.removeAttribute("data-go");
      Object.assign(copy.style, {
        position: "absolute", inset: "0", width: "100%", height: "100%",
        opacity: "1", transform: "none", transition: "none",
      });
      const t = copy.querySelector(".h2");
      if (t) t.style.visibility = "hidden";
    }
    copy.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    ghost.appendChild(copy);
    layerOf(name).appendChild(ghost);
  }
  function removeGhost() { ghost?.remove(); ghost = null; }

  /* ---------- geometry ---------- */
  function placeOnCard(name) {
    const { crop, shade } = PAGES[name];
    const layer = layerOf(name);
    const r = cardOf(name).getBoundingClientRect();
    const st = layer.style;
    st.setProperty("--x", `${r.left}px`);
    st.setProperty("--y", `${r.top}px`);
    st.setProperty("--w", `${r.width}px`);
    st.setProperty("--h", `${r.height}px`);
    if (crop) {
      st.setProperty("--ix", `${crop.l}%`);
      st.setProperty("--iy", `${crop.t}%`);
      st.setProperty("--iw", `${crop.w}%`);
      st.setProperty("--ih", `${crop.h}%`);
      st.setProperty("--shade", shade);
    }
  }

  function fill(name) {
    const page = PAGES[name];
    if (page.layer === ".inner--page") {
      img.src = cardOf(name).querySelector(".card__media img").src;
      pageLayer.style.setProperty("--pos", page.pos);
      title.textContent = page.title;
    }
    document.title = `${page.title} — mono`;
    navLinks.forEach((a) => {
      if (a.dataset.go === name) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  /* Header switches to "difference" on the Projects page; fade around the switch */
  async function setProjectsHeader(on) {
    if (body.classList.contains("is-projects") === on) return;
    body.classList.add("is-header-out");
    await wait(HEADER_FADE);
    body.classList.toggle("is-projects", on);
    body.classList.remove("is-header-out");
  }

  /* ---------- Projects title: the card's H2 flies into the page H1 ---------- */
  const projectsLayer = document.querySelector(".inner--projects");
  const pageH1 = projectsLayer.querySelector(".pp .h1");
  const cardH2 = () => cardOf("projects").querySelector(".h2");

  function makeFlyer(x, y, k) {
    const el = document.createElement("p");
    el.className = "h1 title-flyer";
    el.textContent = "Projects";
    el.setAttribute("aria-hidden", "true");
    el.style.transition = "none";
    el.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
    document.body.appendChild(el);
    void el.offsetWidth;
    el.style.transition = "";
    return el;
  }
  const sizeRatio = () =>
    parseFloat(getComputedStyle(cardH2()).fontSize) / parseFloat(getComputedStyle(pageH1).fontSize);

  async function flyTitleIn() {
    const from = cardH2().getBoundingClientRect();
    const flyer = makeFlyer(from.left, from.top, sizeRatio());
    // final place of the page title: the layer ends at 0,0 with no scroll
    await nextFrame();
    flyer.style.transform = `translate(${pageH1.offsetLeft}px, ${pageH1.offsetTop}px) scale(1)`;
    await wait(OPEN_MS);
    projectsLayer.classList.add("is-title");
    flyer.remove();
  }

  async function flyTitleOut() {
    const from = pageH1.getBoundingClientRect();
    projectsLayer.classList.remove("is-title");
    const flyer = makeFlyer(from.left, from.top, 1);
    await nextFrame();
    const to = cardH2().getBoundingClientRect();
    flyer.style.transform = `translate(${to.left}px, ${to.top}px) scale(${sizeRatio()})`;
    await wait(OPEN_MS);
    flyer.remove();
  }

  function resetLayer(layer) {
    layer.classList.remove("is-visible", "is-open", "is-content", "is-fading", "is-title");
    layer.setAttribute("aria-hidden", "true");
    layer.scrollTop = 0;
  }

  /* ---------- open / swap / close ---------- */
  async function open(name, instant = false) {
    const card = cardOf(name);
    const layer = layerOf(name);
    fill(name);
    // jump onto the card without animating, then expand from there
    layer.classList.add("no-anim");
    placeOnCard(name);
    layer.style.setProperty("--s", PAGES[name].zoom && card.matches(":hover") ? PAGES[name].zoom : 1);
    void layer.offsetWidth;
    if (!instant) layer.classList.remove("no-anim");
    layer.setAttribute("aria-hidden", "false");
    body.classList.add("is-inner");
    current = name;

    if (instant) {
      layer.classList.add("is-visible", "is-open", "is-content");
      card.classList.add("is-hidden");
      if (name === "projects") body.classList.add("is-projects");
      layer.classList.add("is-title");
      await nextFrame();
      layer.classList.remove("no-anim");
      return;
    }

    addGhost(name, true);
    layer.classList.add("is-visible");
    card.classList.add("is-hidden");
    await nextFrame();
    layer.classList.add("is-open");
    ghost.classList.add("is-gone");
    if (name === "projects") { setProjectsHeader(true); flyTitleIn(); }
    await wait(OPEN_MS - 350);
    layer.classList.add("is-content");
    removeGhost();
    await wait(350);
  }

  // About ↔ News share one layer: cross-fade the photo and the text
  async function swapSameLayer(name) {
    const prev = current;
    pageLayer.classList.remove("is-content");
    media.classList.add("is-swapping");
    await wait(400);
    cardOf(prev).classList.remove("is-hidden");
    cardOf(name).classList.add("is-hidden");
    fill(name);
    current = name;
    await nextFrame();
    media.classList.remove("is-swapping");
    pageLayer.classList.add("is-content");
    await wait(400);
  }

  // Projects ↔ About/News: fade the new full-screen layer in over the old one
  async function swapLayers(name) {
    const prev = current;
    const from = layerOf(prev);
    const to = layerOf(name);
    fill(name);
    to.classList.add("no-anim", "is-fading", "is-visible", "is-open", "is-title");
    to.style.setProperty("--s", 1);
    to.setAttribute("aria-hidden", "false");
    to.style.zIndex = "3";
    from.style.zIndex = "2";
    void to.offsetWidth;
    to.classList.remove("no-anim");
    await nextFrame();
    to.classList.remove("is-fading");
    setProjectsHeader(name === "projects");
    await wait(300);
    to.classList.add("is-content");
    await wait(300);
    cardOf(prev).classList.remove("is-hidden");
    cardOf(name).classList.add("is-hidden");
    from.classList.add("no-anim");
    resetLayer(from);
    void from.offsetWidth;
    from.classList.remove("no-anim");
    to.style.zIndex = "";
    from.style.zIndex = "";
    current = name;
  }

  async function close() {
    const name = current;
    const card = cardOf(name);
    const layer = layerOf(name);
    if (name === "projects") setProjectsHeader(false);
    navLinks.forEach((a) => a.removeAttribute("aria-current"));
    document.title = DEFAULT_TITLE;
    layer.classList.remove("is-content");
    await wait(name === "projects" ? HEADER_FADE : 250);
    body.classList.remove("is-inner");
    let flight = null;
    if (name === "projects") {
      // keep the title where the reader sees it, then reset the scroll
      flight = flyTitleOut();
      await nextFrame();
    }
    layer.scrollTop = 0;
    placeOnCard(name);
    layer.style.setProperty("--s", 1);
    addGhost(name, false);
    layer.classList.remove("is-open");
    await wait(OPEN_MS - 500);
    ghost.classList.remove("is-gone");
    await wait(500);
    card.classList.remove("is-hidden");
    resetLayer(layer);
    removeGhost();
    await flight;
    current = null;
    card.focus({ preventScroll: true });
  }

  /* ---------- routing ---------- */
  async function route() {
    if (busy) { setTimeout(route, 120); return; }
    const hash = location.hash.slice(1);
    const target = PAGES[hash] ? hash : null;
    if (target === current) return;
    busy = true;
    try {
      if (!target) await close();
      else if (!current) await open(target);
      else if (PAGES[target].layer === PAGES[current].layer) await swapSameLayer(target);
      else await swapLayers(target);
    } finally {
      busy = false;
    }
  }

  function go(name) {
    if ((location.hash.slice(1) || "") === name) return;
    history.pushState(null, "", name ? `#${name}` : location.pathname + location.search);
    route();
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-go]");
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const name = link.dataset.go;
    // The logo on the main page keeps its normal behaviour
    if (!name && !current && link.classList.contains("header__logo")) return;
    e.preventDefault();
    go(name);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && current) go("");
  });

  window.addEventListener("popstate", route);

  /* ---------- Projects page ---------- */
  const projects = document.querySelector(".inner--projects");

  // "See More" has no project page yet
  projects.querySelectorAll(".pcard__more").forEach((a) =>
    a.addEventListener("click", (e) => e.preventDefault()));

  // Filter tabs
  const tabs = projects.querySelectorAll(".pp__tab");
  const pcards = projects.querySelectorAll(".pcard");
  tabs.forEach((tab) => tab.addEventListener("click", async () => {
    const f = tab.dataset.filter;
    tabs.forEach((t) => t.setAttribute("aria-pressed", String(t === tab)));
    pcards.forEach((c) => c.classList.add("is-out"));
    await wait(400);
    pcards.forEach((c) => c.classList.toggle("is-gone", f !== "all" && c.dataset.type !== f));
    await nextFrame();
    pcards.forEach((c) => { if (!c.classList.contains("is-gone")) c.classList.remove("is-out"); });
  }));

  /* End of the page: the main page rises from under the Projects block.
     The layer is transparent below the page, so scrolling on simply uncovers it. */
  const mainEl = document.querySelector(".main");
  let revealOn = false;

  function setReveal(p) {
    const card = cardOf("projects");
    if (p > 0) {
      card.classList.remove("is-hidden");
      mainEl.style.transform = `translate3d(0, ${((1 - p) * 15).toFixed(3)}vh, 0)`;
    } else {
      card.classList.add("is-hidden");
      mainEl.style.transform = "";
    }
    const headerMain = p > 0.5;
    if (headerMain !== revealOn) {
      revealOn = headerMain;
      setProjectsHeader(!headerMain);
      body.classList.toggle("is-inner", !headerMain);
    }
  }

  function finishReveal() {
    busy = true;
    history.pushState(null, "", location.pathname + location.search);
    projectsLayer.classList.add("no-anim");
    resetLayer(projectsLayer);
    void projectsLayer.offsetWidth;
    projectsLayer.classList.remove("no-anim");
    mainEl.style.transform = "";
    cardOf("projects").classList.remove("is-hidden");
    body.classList.remove("is-inner", "is-projects", "is-header-out");
    navLinks.forEach((a) => a.removeAttribute("aria-current"));
    document.title = DEFAULT_TITLE;
    revealOn = false;
    current = null;
    busy = false;
  }

  /* Labels follow the cursor vertically inside the card, with a soft lag —
     also while the page scrolls under a still cursor */
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const state = new Map(); // card → { bar, y, target }
  pcards.forEach((card) => state.set(card, { bar: card.querySelector(".pcard__bar"), y: 0, target: 0 }));
  let pointer = null;   // last known cursor position
  let hovered = null;   // card under the cursor
  let raf = 0;

  const clampY = (card, clientY) => {
    const { bar } = state.get(card);
    const r = card.getBoundingClientRect();
    const pad = bar.offsetLeft; // same inset as on the sides
    return Math.min(Math.max(clientY - r.top - bar.offsetHeight / 2, pad), r.height - bar.offsetHeight - pad);
  };

  function loop() {
    raf = 0;
    let moving = false;
    state.forEach((st, card) => {
      if (card === hovered && pointer) st.target = clampY(card, pointer.y);
      const d = st.target - st.y;
      if (Math.abs(d) > 0.3) { st.y += d * 0.12; moving = true; } else st.y = st.target;
      st.bar.style.setProperty("--bar-y", `${st.y.toFixed(2)}px`);
    });
    if (moving || hovered) raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  function setHovered(card) {
    if (card === hovered) return;
    hovered?.classList.remove("is-hover");
    hovered = card;
    if (card) {
      const st = state.get(card);
      st.target = st.y = clampY(card, pointer.y); // appear right at the cursor
      st.bar.style.setProperty("--bar-y", `${st.y}px`);
      card.classList.add("is-hover");
    }
    kick();
  }

  function hitTest() {
    if (!pointer || current !== "projects") return setHovered(null);
    const el = document.elementFromPoint(pointer.x, pointer.y);
    const card = el?.closest(".pcard");
    setHovered(card && !card.classList.contains("is-gone") ? card : null);
  }

  projectsLayer.addEventListener("pointermove", (e) => {
    if (!fine.matches || e.pointerType !== "mouse") return;
    pointer = { x: e.clientX, y: e.clientY };
    hitTest();
  });
  projectsLayer.addEventListener("pointerleave", () => { pointer = null; setHovered(null); });

  projectsLayer.addEventListener("scroll", () => {
    if (pointer) hitTest();
    if (current !== "projects" || busy) return;
    const { scrollTop, scrollHeight, clientHeight } = projectsLayer;
    const start = scrollHeight - clientHeight * 2; // where the empty space begins to show
    const p = Math.min(Math.max((scrollTop - start) / clientHeight, 0), 1);
    setReveal(p);
    if (p >= 0.995) finishReveal();
  }, { passive: true });

  /* ---------- direct link: open without the animation ---------- */
  const initial = location.hash.slice(1);
  if (PAGES[initial]) open(initial, true);
})();
