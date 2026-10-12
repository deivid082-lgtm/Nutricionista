(() => {
  // Marcador cuando falta una foto
  const markMissing = (img) => img.closest(".photo")?.classList.add("is-missing");
  document.querySelectorAll(".photo img").forEach((img) => {
    if (img.complete && img.naturalWidth === 0) markMissing(img);
    img.addEventListener("error", () => markMissing(img));
  });

  // Menú móvil
  const toggle = document.querySelector(".nav__toggle");
  const menu = document.getElementById("menu");
  const setMenu = (open) => {
    menu.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  };
  toggle.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  // Filtro de recetas
  const chips = document.querySelectorAll(".chip");
  const list = document.getElementById("recipes");
  const items = list.querySelectorAll(".recipe");
  const empty = document.getElementById("empty");
  chips.forEach((chip) => chip.addEventListener("click", () => {
    const f = chip.dataset.filter;
    chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
    let shown = 0;
    items.forEach((it) => {
      const ok = f === "all" || it.dataset.cat.split(" ").includes(f);
      it.hidden = !ok;
      if (ok) {
        shown++; it.classList.add("in");
        it.classList.remove("is-entering");
        void it.offsetWidth; // reinicia la animación si se pulsa otro filtro enseguida
        it.classList.add("is-entering");
        it.addEventListener("animationend", () => it.classList.remove("is-entering"), { once: true });
      }
    });
    list.classList.toggle("is-filtered", f !== "all");
    empty.hidden = shown > 0;
  }));

  // Cítricos de la portada: desplazamiento suave con el puntero (solo ratón) y pausa fuera de pantalla
  const hero = document.querySelector(".hero");
  const art = document.querySelector(".hero__art");
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (hero && art && !calm) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => hero.classList.toggle("is-offscreen", !e.isIntersecting)).observe(hero);
    }
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
      let raf = 0;
      hero.addEventListener("pointermove", (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const r = hero.getBoundingClientRect();
          art.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
          art.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
        });
      });
      hero.addEventListener("pointerleave", () => { art.style.setProperty("--px", 0); art.style.setProperty("--py", 0); });
    }
  }

  // Copiar el correo cuando el enlace mailto no abre ninguna app
  const copyBtn = document.querySelector(".copy");
  if (copyBtn) {
    const status = document.querySelector(".copy__status");
    const say = (msg) => { status.textContent = msg; setTimeout(() => { status.textContent = ""; }, 3000); };
    copyBtn.addEventListener("click", async () => {
      const text = copyBtn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        say("Correo copiado");
      } catch {
        const addr = document.querySelector(".cta__addr");
        const range = document.createRange();
        range.selectNodeContents(addr);
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        say("Selecciónalo y cópialo a mano");
      }
    });
  }

  // Revelado al hacer scroll (IntersectionObserver, sin listeners de scroll)
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      io.unobserve(en.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  els.forEach((el, i) => { el.style.setProperty("--d", `${(i % 3) * 70}ms`); io.observe(el); });
})();
