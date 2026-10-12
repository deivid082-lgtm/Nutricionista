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
  if (toggle && menu) {
    const setMenu = (open) => {
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    };
    toggle.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  }

  // Carriles de recetas: flechas que deslizan de derecha a izquierda; sin listener de scroll
  const calmMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".rail").forEach((rail) => {
    const track = rail.querySelector(".rail__track");
    const [prev, next] = rail.querySelectorAll(".rail__btn");
    const items = track.querySelectorAll(".recipe");
    const first = items[0];
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft <= 1;
      next.disabled = track.scrollLeft >= max - 1;
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
    track.addEventListener("scroll", queue, { passive: true });
    if ("ResizeObserver" in window) new ResizeObserver(queue).observe(track);
    update();
    [prev, next].forEach((btn) => btn.addEventListener("click", () => {
      const dir = Number(btn.dataset.dir);
      const step = first.getBoundingClientRect().width + 16;
      const n = Math.max(1, Math.floor(track.clientWidth / step));
      track.scrollBy({ left: dir * step * n, behavior: calmMotion ? "auto" : "smooth" });
    }));
  });

  // Cítricos de la portada: desplazamiento suave con el puntero (solo ratón) y pausa fuera de pantalla
  const hero = document.querySelector(".hero");
  const art = document.querySelector(".hero__art");
  const calm = calmMotion;
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
