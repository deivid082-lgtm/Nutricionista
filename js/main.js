(() => {
  // Marcador cuando falta una foto
  const markMissing = (img) => img.closest(".photo")?.classList.add("is-missing");
  document.querySelectorAll(".photo img").forEach((img) => {
    if (img.complete && img.naturalWidth === 0) markMissing(img);
    img.addEventListener("error", () => markMissing(img));
  });

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

  // "crisis" tiembla una vez por sesión y se calma (detalle de humor, solo sin movimiento reducido)
  try {
    const crisis = document.querySelector(".brand span");
    if (crisis && !matchMedia("(prefers-reduced-motion: reduce)").matches && !sessionStorage.getItem("crisis")) {
      sessionStorage.setItem("crisis", "1");
      setTimeout(() => {
        crisis.classList.add("is-shaking");
        crisis.addEventListener("animationend", () => crisis.classList.remove("is-shaking"), { once: true });
      }, 900);
    }
  } catch (e) { /* sin sessionStorage: no pasa nada */ }

  // Reserva: ventana flotante con formulario guiado en 3 pasos, enviado a Formspree
  const booking = document.getElementById("booking");
  if (booking && typeof booking.showModal === "function") {
    const form = booking.querySelector("#booking-form");
    const steps = booking.querySelectorAll(".fstep");
    const label = booking.querySelector("#booking-step-label");
    const bar = booking.querySelector("#booking-bar");
    const prev = booking.querySelector("#booking-prev");
    const next = booking.querySelector("#booking-next");
    const send = booking.querySelector("#booking-send");
    const status = booking.querySelector("#booking-status");
    const progress = booking.querySelector(".progress");
    let step = 1;
    const go = (n) => {
      step = n;
      steps.forEach((s) => { s.hidden = Number(s.dataset.step) !== n; });
      label.textContent = `Paso ${n} de 3`;
      bar.style.width = `${(n / 3) * 100}%`;
      prev.hidden = n === 1; next.hidden = n === 3; send.hidden = n !== 3;
      const first = booking.querySelector(`.fstep[data-step="${n}"] input`);
      if (first) first.focus();
    };
    const reset = () => {
      status.hidden = true; status.innerHTML = "";
      progress.hidden = false; send.disabled = false; send.textContent = "Enviar solicitud";
      go(1);
    };
    const open = () => { reset(); booking.showModal(); };
    const close = () => booking.close();
    document.querySelectorAll("[data-booking]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); open(); }));
    booking.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
    booking.addEventListener("click", (e) => { if (e.target === booking) close(); });
    booking.addEventListener("close", () => { if (location.hash === "#reservar") history.replaceState(null, "", location.pathname + location.search); });
    next.addEventListener("click", () => go(step + 1));
    prev.addEventListener("click", () => go(step - 1));
    if (location.hash === "#reservar") open();
    window.addEventListener("hashchange", () => { if (location.hash === "#reservar" && !booking.open) open(); });

    const setError = (input, errEl, bad) => {
      input.setAttribute("aria-invalid", String(bad));
      if (bad) input.setAttribute("aria-describedby", errEl.id); else input.removeAttribute("aria-describedby");
      errEl.hidden = !bad;
    };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.elements.nombre, email = form.elements.email, priv = form.elements.privacidad;
      const badName = !name.value.trim(), badEmail = !email.value.trim() || !email.validity.valid, badPriv = !priv.checked;
      setError(name, booking.querySelector("#b-name-err"), badName);
      setError(email, booking.querySelector("#b-email-err"), badEmail);
      setError(priv, booking.querySelector("#b-priv-err"), badPriv);
      const firstBad = [badName && name, badEmail && email, badPriv && priv].find(Boolean);
      if (firstBad) { firstBad.focus(); return; }

      const mail = document.querySelector(".cta__addr")?.textContent.trim() || "";
      const show = (html) => { status.innerHTML = html; status.hidden = false; };
      if (form.action.includes("TU_ID_FORMSPREE")) {
        show(`<p>El formulario todavía no está conectado. Mientras tanto, escríbeme a <a href="mailto:${mail}">${mail}</a>.</p>`);
        return;
      }
      send.disabled = true; send.textContent = "Enviando…";
      try {
        const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        steps.forEach((s) => { s.hidden = true; });
        progress.hidden = true; prev.hidden = true; send.hidden = true; next.hidden = true;
        show(`<h3>¡Recibido!</h3><p>Te escribiré pronto para buscar día y hora.</p>`);
        status.focus?.();
      } catch (err) {
        send.disabled = false; send.textContent = "Enviar solicitud";
        show(`<p>No se ha podido enviar. Revisa tu conexión y vuelve a intentarlo, o escríbeme a <a href="mailto:${mail}">${mail}</a>.</p>`);
      }
    });
  }

  // Todo lo anterior se ejecutó sin errores: ahora sí se ocultan los elementos que dependen del script
  // (menú móvil, flechas, revelado). Si el script fallara, la página se queda visible y usable.
  document.documentElement.classList.add("js-ready");

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

// Navegación, baraja de recetas y movimiento ligado al scroll
(() => {
  const root = document.documentElement;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Menú a pantalla completa
  const burger = document.querySelector(".burger");
  const menu = document.getElementById("menu");
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
  if (deck) {
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
  }

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
    if (heroImg && y < vh * 1.3) heroImg.style.transform = `translate3d(0, ${(y * 0.08).toFixed(1)}px, 0)`;
    const ar = aboutImg ? aboutImg.parentElement.getBoundingClientRect() : null;
    if (ar && ar.bottom > 0 && ar.top < vh) {
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
  const once = [deck, document.querySelector(".about__photo"), document.querySelector(".cta")].filter(Boolean);
  if (!ioOk || calm) once.forEach((el) => el.classList.add("in"));
  else {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      if (count && en.target === count.closest(".reveal")) runCount();
      io.unobserve(en.target);
    }), { threshold: 0.2 });
    // La foto empieza recortada del todo, así que se observa su columna y no la propia foto
    const photo = document.querySelector(".about__photo");
    once.filter((el) => el !== photo).forEach((el) => io.observe(el));
    if (photo) new IntersectionObserver(([en], o) => { if (en.isIntersecting) { photo.classList.add("in"); o.disconnect(); } }, { threshold: 0.08 }).observe(document.querySelector(".about"));
    if (count) io.observe(count.closest(".reveal"));
    const pause = new IntersectionObserver((entries) => entries.forEach((en) => en.target.classList.toggle("is-off", !en.isIntersecting)));
    document.querySelectorAll(".marquee, .hero").forEach((el) => pause.observe(el));
  }

  root.classList.add("alt-ready");
})();
