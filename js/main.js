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
