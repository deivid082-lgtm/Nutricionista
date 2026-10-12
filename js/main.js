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
      if (ok) { shown++; it.classList.add("in"); }
    });
    list.classList.toggle("is-filtered", f !== "all");
    empty.hidden = shown > 0;
  }));

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
