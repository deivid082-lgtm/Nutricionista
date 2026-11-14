(() => {
  const root = document.documentElement;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Menú a pantalla completa
  const burger = document.querySelector(".burger");
  const menu = document.getElementById("menu-a");
  const setMenu = (open) => {
    menu.classList.toggle("is-open", open);
    menu.inert = !open;
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  };
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); burger.focus(); } });

  // Baraja de recetas: flechas, contador, barra, filtros y arrastre con ratón
  const deck = document.querySelector(".deck");
  const cards = [...deck.querySelectorAll(".card")];
  const [prev, next] = document.querySelectorAll(".deck__btns .round");
  const countNow = document.querySelector(".deck__count b");
  const countAll = document.querySelector(".deck__count span");
  const bar = document.querySelector(".deck__bar i");
  const pad = (n) => String(n).padStart(2, "0");
  const visible = () => cards.filter((c) => !c.hidden);
  let deckRaf = 0;
  const updateDeck = () => {
    deckRaf = 0;
    const list = visible();
    const max = deck.scrollWidth - deck.clientWidth;
    const step = list[0] ? list[0].getBoundingClientRect().width + 16 : 1;
    const perView = Math.max(1, Math.round(deck.clientWidth / step));
    const idx = max <= 1 ? list.length : Math.min(list.length, Math.round(deck.scrollLeft / step) + perView);
    countNow.textContent = pad(deck.scrollLeft >= max - 2 ? list.length : idx);
    countAll.textContent = pad(list.length);
    bar.style.transform = `scaleX(${max <= 1 ? 1 : Math.max(0.12, deck.scrollLeft / max)})`;
    prev.disabled = deck.scrollLeft <= 1;
    next.disabled = deck.scrollLeft >= max - 1;
  };
  const queueDeck = () => { if (!deckRaf) deckRaf = requestAnimationFrame(updateDeck); };
  deck.addEventListener("scroll", queueDeck, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(queueDeck).observe(deck);
  [prev, next].forEach((btn) => btn.addEventListener("click", () => {
    const step = visible()[0].getBoundingClientRect().width + 16;
    const n = Math.max(1, Math.floor(deck.clientWidth / step));
    deck.scrollBy({ left: Number(btn.dataset.dir) * step * n, behavior: calm ? "auto" : "smooth" });
  }));
  cards.forEach((c, i) => c.style.setProperty("--n", i));

  const chips = [...document.querySelectorAll(".chip")];
  const applyFilter = (cat) => {
    chips.forEach((ch) => { const on = ch.dataset.filter === cat; ch.classList.toggle("is-on", on); ch.setAttribute("aria-pressed", String(on)); });
    cards.forEach((c) => { c.hidden = cat !== "todas" && c.dataset.cat !== cat; });
    visible().forEach((c, i) => c.style.setProperty("--n", i));
    deck.scrollLeft = 0;
    updateDeck();
  };
  chips.forEach((ch) => ch.addEventListener("click", () => {
    const cat = ch.dataset.filter;
    if (!calm && document.startViewTransition) {
      cards.forEach((c, i) => { c.style.viewTransitionName = `card-${i}`; });
      document.startViewTransition(() => applyFilter(cat)).finished.finally(() => cards.forEach((c) => { c.style.viewTransitionName = ""; }));
    } else applyFilter(cat);
  }));

  if (fine) {
    let down = false, startX = 0, startLeft = 0, moved = false;
    deck.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; down = true; moved = false; startX = e.clientX; startLeft = deck.scrollLeft; });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) { moved = true; deck.classList.add("is-drag"); }
      if (moved) deck.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", () => { if (!down) return; down = false; requestAnimationFrame(() => deck.classList.remove("is-drag")); });
    deck.addEventListener("click", (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);
    deck.addEventListener("dragstart", (e) => e.preventDefault());
  }
  updateDeck();

  // Frase que se va encendiendo palabra a palabra al pasar por pantalla
  const scrub = document.querySelector(".scrub");
  let words = [];
  if (scrub && !calm) {
    const text = scrub.textContent.trim();
    scrub.setAttribute("aria-label", text);
    scrub.innerHTML = text.split(/\s+/).map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(" ");
    words = [...scrub.querySelectorAll(".w")];
  }

  // Un solo bucle de scroll para todo lo que depende de la posición
  const top = document.querySelector(".top");
  const progress = document.querySelector(".scrollbar i");
  const heroImg = document.querySelector(".hero__photo img");
  const aboutImg = document.querySelector(".about__photo img");
  let lastY = scrollY, raf = 0;
  const onScroll = () => {
    raf = 0;
    const y = scrollY, vh = innerHeight;
    const max = root.scrollHeight - vh;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    top.classList.toggle("is-stuck", y > 8);
    if (!document.body.classList.contains("menu-open")) {
      if (y > lastY + 4 && y > 240) top.classList.add("is-hidden");
      else if (y < lastY - 4 || y < 240) top.classList.remove("is-hidden");
    }
    lastY = y;
    if (calm) return;
    if (y < vh * 1.3) heroImg.style.transform = `translate3d(0, ${(y * 0.08).toFixed(1)}px, 0)`;
    const ar = aboutImg.parentElement.getBoundingClientRect();
    if (ar.bottom > 0 && ar.top < vh) {
      const t = (vh - ar.top) / (vh + ar.height);
      aboutImg.style.transform = `translate3d(0, ${(-t * 10).toFixed(2)}%, 0)`;
    }
    if (words.length) {
      const r = scrub.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const t = Math.min(1, Math.max(0, (vh * 0.88 - r.top) / (vh * 0.5 + r.height)));
        const lit = t * (words.length + 1);
        words.forEach((w, i) => { w.style.opacity = i < lit ? 1 : 0.2; });
      }
    }
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(onScroll); };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  onScroll();

  // Contador de años
  const count = document.querySelector(".count");
  const runCount = () => {
    const to = Number(count.dataset.to), t0 = performance.now(), dur = 1100;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      count.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // Entradas al pasar por pantalla y pausas fuera de ella
  const ioOk = "IntersectionObserver" in window;
  const once = [deck, document.querySelector(".about__photo"), document.querySelector(".cta")];
  if (!ioOk || calm) once.forEach((el) => el.classList.add("in"));
  else {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      if (en.target === count.closest(".reveal")) runCount();
      io.unobserve(en.target);
    }), { threshold: 0.2 });
    // La foto empieza recortada del todo, así que se observa su columna y no la propia foto
    const photo = document.querySelector(".about__photo");
    once.filter((el) => el !== photo).forEach((el) => io.observe(el));
    new IntersectionObserver(([en], o) => { if (en.isIntersecting) { photo.classList.add("in"); o.disconnect(); } }, { threshold: 0.08 }).observe(document.querySelector(".about"));
    io.observe(count.closest(".reveal"));
    const pause = new IntersectionObserver((entries) => entries.forEach((en) => en.target.classList.toggle("is-off", !en.isIntersecting)));
    pause.observe(document.querySelector(".marquee"));
    pause.observe(document.querySelector(".hero"));
  }

  root.classList.add("alt-ready");
})();
