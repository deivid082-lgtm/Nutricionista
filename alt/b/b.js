(() => {
  const root = document.documentElement;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const ioOk = "IntersectionObserver" in window;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // Titulares: cada palabra sube desde su propia máscara
  document.querySelectorAll("h2.split").forEach((h) => {
    h.setAttribute("aria-label", h.textContent.trim());
    let k = 0;
    const wrap = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(" "); return; }
            const outer = document.createElement("span"); outer.className = "ww"; outer.setAttribute("aria-hidden", "true");
            const inner = document.createElement("span"); inner.textContent = part; inner.style.setProperty("--k", k++);
            outer.append(inner); frag.append(outer);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) wrap(n);
      });
    };
    wrap(h);
  });

  // Píldora deslizante (navegación flotante y pestañas)
  const movePill = (pill, target) => {
    if (!target) { pill.style.setProperty("--o", 0); return; }
    pill.style.setProperty("--x", `${target.offsetLeft}px`);
    pill.style.setProperty("--w", `${target.offsetWidth}px`);
    pill.style.setProperty("--o", 1);
  };

  // Navegación flotante: marca la sección que cruza el centro de la pantalla
  const dockPill = document.querySelector(".dock__pill");
  const dockLinks = [...document.querySelectorAll(".dock__links a")];
  let current = null;
  const setCurrent = (id) => {
    current = id;
    dockLinks.forEach((a) => { const on = a.dataset.spy === id; a.classList.toggle("is-on", on); if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
    movePill(dockPill, dockLinks.find((a) => a.dataset.spy === id));
  };
  if (ioOk) {
    const spy = new IntersectionObserver((entries) => entries.forEach((en) => {
      const id = en.target.dataset.section;
      if (en.isIntersecting) setCurrent(id);
      else if (current === id) setCurrent(null);
    }), { rootMargin: "-45% 0px -45% 0px" });
    document.querySelectorAll("[data-section]").forEach((s) => spy.observe(s));
  }

  // Recetas: carrusel con profundidad, puntos, flechas y pestañas
  const flow = document.querySelector(".flow");
  const plates = [...flow.querySelectorAll(".plate")];
  const dots = document.querySelector(".dots");
  const [prev, next] = document.querySelectorAll(".flow__btns .round");
  const tabs = [...document.querySelectorAll(".tab")];
  const tabsPill = document.querySelector(".tabs__pill");
  const visible = () => plates.filter((p) => !p.hidden);
  let flowRaf = 0, flowOn = true;
  // En pantallas anchas se empieza por la receta central, para que haya tarjetas a ambos lados
  const centerFlow = () => {
    const list = visible();
    const mid = flow.clientWidth >= 900 ? list[Math.floor((list.length - 1) / 2)] : list[0];
    flow.style.scrollBehavior = "auto";
    flow.scrollLeft = mid ? mid.offsetLeft - flow.offsetLeft - (flow.clientWidth - mid.offsetWidth) / 2 : 0;
    flow.style.scrollBehavior = "";
  };
  const buildDots = () => { dots.innerHTML = visible().map(() => "<i></i>").join(""); };
  const updateFlow = () => {
    flowRaf = 0;
    const list = visible();
    const fr = flow.getBoundingClientRect();
    const mid = fr.left + fr.width / 2;
    let best = 0, bestD = Infinity;
    list.forEach((p, i) => {
      const r = p.getBoundingClientRect();
      const d = (r.left + r.width / 2 - mid) / r.width;
      if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = i; }
      if (calm) return;
      const a = clamp(d, -1.6, 1.6);
      p.style.transform = `perspective(1100px) rotateY(${(-a * 13).toFixed(2)}deg) scale(${(1 - Math.abs(a) * 0.09).toFixed(3)})`;
      p.style.opacity = (1 - Math.min(Math.abs(a), 1.6) * 0.3).toFixed(3);
    });
    [...dots.children].forEach((d, i) => d.classList.toggle("is-on", i === best));
    const max = flow.scrollWidth - flow.clientWidth;
    prev.disabled = flow.scrollLeft <= 1;
    next.disabled = flow.scrollLeft >= max - 1;
  };
  const queueFlow = () => { if (flowOn && !flowRaf) flowRaf = requestAnimationFrame(updateFlow); };
  flow.addEventListener("scroll", queueFlow, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(queueFlow).observe(flow);
  [prev, next].forEach((btn) => btn.addEventListener("click", () => {
    const step = visible()[0].getBoundingClientRect().width + 16;
    flow.scrollBy({ left: Number(btn.dataset.dir) * step, behavior: calm ? "auto" : "smooth" });
  }));
  const applyFilter = (cat) => {
    tabs.forEach((t) => { const on = t.dataset.filter === cat; t.classList.toggle("is-on", on); t.setAttribute("aria-pressed", String(on)); });
    movePill(tabsPill, tabs.find((t) => t.dataset.filter === cat));
    plates.forEach((p) => { p.hidden = cat !== "todas" && p.dataset.cat !== cat; });
    buildDots();
    centerFlow();
    updateFlow();
  };
  tabs.forEach((t) => t.addEventListener("click", () => {
    if (!calm && document.startViewTransition) {
      plates.forEach((p, i) => { p.style.viewTransitionName = `plate-${i}`; });
      document.startViewTransition(() => applyFilter(t.dataset.filter)).finished.finally(() => plates.forEach((p) => { p.style.viewTransitionName = ""; }));
    } else applyFilter(t.dataset.filter);
  }));
  buildDots();
  centerFlow();
  movePill(tabsPill, tabs[0]);
  updateFlow();
  addEventListener("resize", () => { movePill(tabsPill, tabs.find((t) => t.classList.contains("is-on"))); movePill(dockPill, dockLinks.find((a) => a.classList.contains("is-on"))); });
  if (document.fonts?.ready) document.fonts.ready.then(() => { movePill(tabsPill, tabs.find((t) => t.classList.contains("is-on"))); movePill(dockPill, dockLinks.find((a) => a.classList.contains("is-on"))); });

  if (fine) {
    // Arrastrar el carrusel con el ratón y brillo que sigue al puntero
    let down = false, startX = 0, startLeft = 0, moved = false;
    flow.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; down = true; moved = false; startX = e.clientX; startLeft = flow.scrollLeft; });
    addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) { moved = true; flow.style.scrollSnapType = "none"; flow.style.cursor = "grabbing"; }
      if (moved) flow.scrollLeft = startLeft - dx;
    });
    addEventListener("pointerup", () => { if (!down) return; down = false; flow.style.scrollSnapType = ""; flow.style.cursor = ""; });
    flow.addEventListener("click", (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);
    flow.addEventListener("dragstart", (e) => e.preventDefault());
    plates.forEach((p) => {
      const a = p.querySelector("a");
      a.addEventListener("pointermove", (e) => {
        const r = a.getBoundingClientRect();
        a.style.setProperty("--mx", `${e.clientX - r.left}px`);
        a.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
    // Botón principal que se acerca al puntero
    const magnet = document.querySelector(".magnet");
    if (magnet && !calm) {
      const zone = magnet.closest(".cta");
      zone.addEventListener("pointermove", (e) => {
        const r = magnet.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        const near = Math.hypot(dx, dy) < 180;
        magnet.style.transform = near ? `translate(${(dx * 0.22).toFixed(1)}px, ${(dy * 0.22).toFixed(1)}px)` : "";
      });
      zone.addEventListener("pointerleave", () => { magnet.style.transform = ""; });
    }
  }

  // Un solo bucle de scroll: portada, línea del método y foto
  const hero = document.querySelector(".hero");
  const heroInner = document.querySelector(".hero__inner");
  const heroImg = document.querySelector(".hero__bg img");
  const line = document.querySelector(".line");
  const steps = [...line.querySelectorAll("li")];
  const aboutImg = document.querySelector(".about__photo img");
  if (calm) steps.forEach((s) => s.classList.add("is-on"));
  let raf = 0;
  const onScroll = () => {
    raf = 0;
    const y = scrollY, vh = innerHeight;
    hero.classList.toggle("is-off", y > vh * 1.05);
    if (calm) return;
    if (y <= vh * 1.05) {
      const t = clamp(y / vh, 0, 1);
      heroInner.style.transform = `translate3d(0, ${(-y * 0.22).toFixed(1)}px, 0)`;
      heroInner.style.opacity = (1 - clamp(t / 0.7, 0, 1)).toFixed(3);
      heroImg.style.transform = `scale(${(1 + t * 0.1).toFixed(4)})`;
    }
    const lr = line.getBoundingClientRect();
    if (lr.bottom > -200 && lr.top < vh + 200) {
      line.style.setProperty("--p", clamp((vh * 0.62 - lr.top - 24) / (lr.height - 48), 0, 1).toFixed(4));
      steps.forEach((s) => s.classList.toggle("is-on", s.getBoundingClientRect().top < vh * 0.62));
    }
    const ar = aboutImg.parentElement.getBoundingClientRect();
    if (ar.bottom > 0 && ar.top < vh) aboutImg.style.transform = `translate3d(0, ${(-((vh - ar.top) / (vh + ar.height)) * 11).toFixed(2)}%, 0)`;
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(onScroll); };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  onScroll();

  // Contador de años
  const count = document.querySelector(".count");
  const runCount = () => {
    const to = Number(count.dataset.to), t0 = performance.now(), dur = 1200;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      count.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // Entradas al pasar por pantalla
  const once = [...document.querySelectorAll("h2.split, .head, .about__photo")];
  const cta = document.querySelector(".cta");
  if (!ioOk || calm) { once.forEach((el) => el.classList.add("in")); cta.classList.add("in"); }
  else {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      if (en.target === count.closest("li")) runCount();
      io.unobserve(en.target);
    }), { threshold: 0.25 });
    once.forEach((el) => io.observe(el));
    io.observe(count.closest("li"));
    new IntersectionObserver(([en]) => cta.classList.toggle("in", en.isIntersecting)).observe(cta);
    new IntersectionObserver(([en]) => { flowOn = en.isIntersecting; if (flowOn) queueFlow(); }).observe(flow);
  }

  root.classList.add("alt-ready");
})();
