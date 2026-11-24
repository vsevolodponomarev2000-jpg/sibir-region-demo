// Поведение сайта: меню, фильтр вакансий, «Трудоустроиться», просмотр ленты, cookie, появление блоков.
(() => {
"use strict";
const C = window.SR_CONFIG || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const isUrl = (u) => /^https?:\/\//i.test(String(u || ""));
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* ---------- меню ---------- */
const burger = $(".burger"), nav = $("#nav");
if (burger && nav) {
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); } });
}

/* ---------- фильтр вакансий ---------- */
const chips = $$("[data-filter]");
function applyFilter(key, push) {
  const valid = chips.some((c) => c.dataset.filter === key) ? key : "all";
  chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.filter === valid)));
  let shown = 0;
  $$(".jobs-group .job").forEach((j) => { const ok = valid === "all" || j.dataset.group === valid || j.dataset.cat === valid; j.hidden = !ok; if (ok) shown++; });
  $$("[data-group-box]").forEach((g) => { g.hidden = !$$(".job", g).some((j) => !j.hidden); });
  const empty = $(".filter-empty"); if (empty) empty.hidden = shown > 0;
  if (push) history.replaceState(null, "", valid === "all" ? location.pathname : "#" + valid);
}
if (chips.length) {
  chips.forEach((c) => c.addEventListener("click", () => applyFilter(c.dataset.filter, true)));
  applyFilter(decodeURIComponent(location.hash.slice(1)) || "all", false);
  addEventListener("hashchange", () => applyFilter(decodeURIComponent(location.hash.slice(1)) || "all", false));
}

/* ---------- окно-ловушка фокуса ---------- */
function trap(root, onClose) {
  const last = document.activeElement;
  const key = (e) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
    if (e.key !== "Tab") return;
    const f = $$(FOCUSABLE, root).filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], end = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end.focus(); }
    else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener("keydown", key);
  document.documentElement.style.overflow = "hidden";
  return () => { document.removeEventListener("keydown", key); document.documentElement.style.overflow = ""; if (last && last.focus) last.focus(); };
}

/* ---------- «Трудоустроиться» ---------- */
const modal = $("#applyModal");
let release = null;
function managerFor(slug) {
  const m = (C.managers || {})[slug];
  if (m && (isUrl(m.max) || isUrl(m.telegram) || isUrl(m.vk))) return m;
  return C.fallbackManager || {};
}
function closeModal() { if (!modal || modal.hidden) return; modal.hidden = true; if (release) { release(); release = null; } }
function openModal(slug, title, m) {
  const txt = $("#applyText", modal);
  txt.textContent = "";
  if (slug) {
    txt.append("Здесь соискатель перейдёт в чат с менеджером по специальности ");
    const b = document.createElement("b"); b.textContent = `«${title}»`; txt.append(b, " в MAX. ");
  } else {
    txt.append("Здесь соискатель перейдёт в чат с менеджером в MAX — он подберёт подходящую вакансию. ");
  }
  const any = isUrl(m.max) || isUrl(m.telegram) || isUrl(m.vk);
  txt.append(any ? "Выберите удобный мессенджер." : "Ссылки менеджеров подключим, когда пришлёте контакты.");
  $$("[data-net]", modal).forEach((a) => {
    const url = m[a.dataset.net];
    const small = $("small", a);
    if (isUrl(url)) {
      a.href = url; a.target = "_blank"; a.rel = "noopener"; a.classList.remove("is-off"); a.removeAttribute("aria-disabled");
      small.textContent = m.name ? `менеджер: ${m.name}` : "откроется чат";
    } else {
      a.removeAttribute("href"); a.removeAttribute("target"); a.classList.add("is-off"); a.setAttribute("aria-disabled", "true");
      small.textContent = "подключим";
    }
  });
  modal.hidden = false;
  release = trap(modal, closeModal);
  $(".modal-card", modal).focus();
}
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-apply]");
  if (btn && modal) {
    e.preventDefault();
    const slug = btn.dataset.apply || "", title = btn.dataset.title || "";
    const m = managerFor(slug);
    if (isUrl(m.max)) { window.open(m.max, "_blank", "noopener"); return; }   // ссылка есть — сразу в MAX
    openModal(slug, title, m);
    return;
  }
  if (e.target.closest("[data-close]")) closeModal();
  const off = e.target.closest(".net.is-off");
  if (off) e.preventDefault();
});

/* ---------- лента: просмотр на весь экран ---------- */
const lb = $("#lb");
if (lb) {
  const items = $$("[data-lb]");
  const img = $("#lbImg"), cap = $("#lbCap"), cnt = $("#lbCount");
  let i = 0, lbRelease = null;
  const show = (n) => { i = (n + items.length) % items.length; img.src = items[i].dataset.lb; img.alt = items[i].dataset.cap || ""; cap.textContent = items[i].dataset.cap || ""; cnt.textContent = `${i + 1} / ${items.length}`; };
  const close = () => { lb.hidden = true; if (lbRelease) { lbRelease(); lbRelease = null; } };
  items.forEach((el, n) => el.addEventListener("click", () => { show(n); lb.hidden = false; lbRelease = trap(lb, close); $(".lb-fig", lb).focus(); }));
  $(".lb-prev", lb).addEventListener("click", () => show(i - 1));
  $(".lb-next", lb).addEventListener("click", () => show(i + 1));
  $$("[data-lb-close]", lb).forEach((b) => b.addEventListener("click", close));
  document.addEventListener("keydown", (e) => { if (lb.hidden) return; if (e.key === "ArrowLeft") show(i - 1); if (e.key === "ArrowRight") show(i + 1); });
  let sx = null;
  lb.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1)); sx = null; });
}

/* ---------- cookie ---------- */
const ck = $("#cookie");
try {
  if (ck && !localStorage.getItem("sr-cookie")) ck.hidden = false;
  if (ck) $("[data-cookie-ok]", ck).addEventListener("click", () => { ck.hidden = true; localStorage.setItem("sr-cookie", "1"); });
} catch (_) { /* localStorage недоступен — просто не показываем */ }

/* ---------- появление блоков ---------- */
const rv = $$(".rv");
if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  rv.forEach((el) => io.observe(el));
} else rv.forEach((el) => el.classList.add("in"));

/* ---------- форма записи на обучение (демо: никуда не отправляет, файлы остаются в браузере) ---------- */
const tf = $("#trainForm");
if (tf) {
  const list = $(".tf-files", tf), msg = $(".tf-msg", tf), inp = tf.querySelector('input[name="docs"]');
  const MAX_FILES = 5, MAX_BYTES = 10 * 1024 * 1024;
  const show = (text, isErr) => { msg.hidden = false; msg.classList.toggle("is-err", isErr); msg.textContent = text; };
  inp.addEventListener("change", () => {
    list.textContent = "";
    [...inp.files].forEach((f) => {
      const li = document.createElement("li");
      li.textContent = `${f.name} · ${(f.size / 1048576).toFixed(1)} МБ${f.size > MAX_BYTES ? " — больше 10 МБ" : ""}`;
      if (f.size > MAX_BYTES) li.className = "is-err";
      list.appendChild(li);
    });
  });
  tf.addEventListener("submit", (e) => {
    e.preventDefault();
    const files = [...inp.files];
    const fio = tf.elements.fio.value.trim(), digits = tf.elements.phone.value.replace(/\D/g, "");
    let err = "";
    if (fio.length < 3) err = "Укажите ФИО.";
    else if (digits.length < 10) err = "Укажите контактный телефон.";
    else if (files.length > MAX_FILES) err = "Можно приложить не больше 5 файлов.";
    else if (files.some((f) => f.size > MAX_BYTES)) err = "Каждый файл — не больше 10 МБ.";
    else if (!tf.elements.agree.checked) err = "Нужно согласие на обработку персональных данных.";
    if (err) return show(err, true);
    const phone = (window.SR_CONFIG && window.SR_CONFIG.phone) || "";
    show(`Демо-версия: здесь заявка${files.length ? ` и ${files.length} файл(а)` : ""} уйдут менеджеру учебного центра — подключим на этапе 2. Пока можно позвонить: ${phone}.`, false);
  });
}
})();
