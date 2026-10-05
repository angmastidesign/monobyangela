(() => {
  const root = document.documentElement;
  const body = document.body;
  const bar = document.querySelector(".progress__bar");
  const progressEl = document.querySelector(".progress");

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MIN_DURATION = reduced ? 1200 : 3600; // ms, so the three screens are readable
  const HOLD_AFTER_FULL = reduced ? 100 : 450;
  const EXPAND = reduced ? 500 : 1400;

  // Return visit within the session: skip the intro
  if (root.classList.contains("skip-intro")) {
    body.dataset.stage = "3";
    body.classList.add("is-ready");
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("skip-intro")));
    return;
  }

  // Preload every image on the page (+ the font) and track real progress
  const urls = [...new Set([...document.images].map((img) => img.currentSrc || img.src))];
  const total = urls.length + 1;
  let loaded = 0;
  const done = () => { loaded = Math.min(loaded + 1, total); };

  urls.forEach((src) => {
    const img = new Image();
    img.onload = img.onerror = done;
    img.src = src;
  });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(done, done);

  const start = performance.now();
  let shown = 0;

  function tick(now) {
    const timeP = Math.min((now - start) / MIN_DURATION, 1);
    const loadP = loaded / total;
    const target = Math.min(timeP, loadP);
    shown += (target - shown) * 0.12;
    if (target === 1 && 1 - shown < 0.002) shown = 1;

    bar.style.transform = `scaleX(${shown})`;
    progressEl.setAttribute("aria-valuenow", Math.round(shown * 100));

    const stage = shown >= 0.66 ? "3" : shown >= 0.33 ? "2" : "1";
    if (body.dataset.stage !== stage) body.dataset.stage = stage;

    if (shown < 1) {
      requestAnimationFrame(tick);
    } else {
      setTimeout(finish, HOLD_AFTER_FULL);
    }
  }

  function finish() {
    body.classList.add("is-expanding");
    setTimeout(() => {
      body.classList.add("is-ready");
      body.classList.remove("is-expanding");
      try { sessionStorage.setItem("mono-intro", "1"); } catch (e) {}
    }, EXPAND);
  }

  requestAnimationFrame(tick);
})();
