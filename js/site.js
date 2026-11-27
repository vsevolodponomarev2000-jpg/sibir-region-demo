// Поведение сайта: меню, фильтр вакансий, «Трудоустроиться», просмотр фото, cookie, появление блоков, анкета с документами.
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

/* ---------- «Трудоустроиться»: окно с контактами менеджера специальности ---------- */
const modal = $("#applyModal");
let release = null;
const tgNick = (u) => String(u).replace(/^https?:\/\/t\.me\//i, "");
function managerFor(slug) {
  const m = (C.managers || {})[slug];
  if (m && (isUrl(m.max) || m.maxPhone || isUrl(m.telegram))) return m;
  return C.fallbackManager || {};
}
function el(tag, attrs, ...kids) {
  const n = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v));
  n.append(...kids);
  return n;
}
/** Пункт окна: MAX-ссылка, номер MAX с копированием или Telegram (та же разметка, что managerContacts в lib/ui.mjs). */
function netItem(kind, m) {
  const ico = kind === "tg" ? $("#icoTg").content.cloneNode(true) : el("span", { class: "ico ico-max", "aria-hidden": "true" }, "MAX");
  if (kind === "max") return el("a", { class: "mgr-i mgr-max", href: m.max, target: "_blank", rel: "noopener" }, ico, el("span", {}, el("b", {}, "Написать в MAX")));
  if (kind === "maxPhone") return el("button", { class: "mgr-i mgr-max", type: "button", "data-copy": m.maxPhone, "data-copied": "Номер скопирован — найдите в MAX: «Найти по номеру»" },
    ico, el("span", {}, el("b", {}, m.maxPhone), el("small", {}, "MAX · нажмите, чтобы скопировать номер")));
  return el("a", { class: "mgr-i mgr-tg", href: m.telegram, target: "_blank", rel: "noopener" }, ico, el("span", {}, el("b", {}, "Написать в Telegram"), el("small", {}, "@" + tgNick(m.telegram))));
}
function closeModal() { if (!modal || modal.hidden) return; modal.hidden = true; if (release) { release(); release = null; } }
function openModal(title, m, page) {
  const txt = $("#applyText", modal), nets = $(".modal-nets", modal), form = $(".modal-form", modal);
  txt.textContent = "";
  if (title) txt.append("Специальность ", el("b", {}, "«" + title + "»"), ". ");
  if (m.name) txt.append("Ваш менеджер — ", el("b", {}, m.name), ". ");
  const items = [isUrl(m.max) ? "max" : (m.maxPhone ? "maxPhone" : ""), isUrl(m.telegram) ? "tg" : ""].filter(Boolean);
  txt.append(items.length ? "Напишите в удобный мессенджер — подберём объект и расскажем об условиях." : "Позвоните нам — менеджер подберёт вакансию.");
  nets.textContent = "";
  items.forEach((k) => nets.append(netItem(k, m)));
  nets.hidden = !items.length;
  const anketa = $("#anketa") ? "#anketa" : (page ? page + "#anketa" : "");
  form.hidden = !anketa;
  if (anketa) form.setAttribute("href", anketa);
  modal.hidden = false;
  release = trap(modal, closeModal);
  $(".modal-card", modal).focus();
}
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-apply]");
  if (btn && modal) {
    e.preventDefault();
    const m = managerFor(btn.dataset.apply || "");
    if (isUrl(m.max)) { window.open(m.max, "_blank", "noopener"); return; }   // ссылка на профиль MAX — сразу в чат
    openModal(btn.dataset.title || "", m, btn.dataset.page || "");
    return;
  }
  if (e.target.closest("[data-close]") || e.target.closest(".modal-form[href^='#']")) closeModal();
});

/* ---------- копирование номера (окно «Позвоните нам», номер MAX менеджера) ---------- */
document.addEventListener("click", (e) => {
  const cp = e.target.closest("[data-copy]");
  if (!cp) return;
  const target = $("small", cp) || cp;
  if (!target.dataset.orig) target.dataset.orig = target.textContent;
  const done = () => {
    target.textContent = cp.dataset.copied || "Скопировано ✓";
    clearTimeout(Number(cp.dataset.timer));
    cp.dataset.timer = String(setTimeout(() => { target.textContent = target.dataset.orig; }, 3000));
  };
  if (navigator.clipboard) navigator.clipboard.writeText(cp.dataset.copy).then(done, done); else done();
});

/* ---------- окно «Позвоните нам» (кнопка в первом экране главной) ---------- */
const callBox = $("#callModal");
let releaseCall = null;
function closeCall() { if (!callBox || callBox.hidden) return; callBox.hidden = true; if (releaseCall) { releaseCall(); releaseCall = null; } }
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-callpop]") && callBox) {
    e.preventDefault();
    callBox.hidden = false;
    releaseCall = trap(callBox, closeCall);
    $(".modal-card", callBox).focus();
    return;
  }
  if (e.target.closest("[data-close-call]")) closeCall();
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

/* ---------- анкета с фото документов (страница вакансии): отправка через пересыльщик (config.leadsEndpoint) ---------- */
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 12;
const SHRINK_FROM_BYTES = 1.5 * 1024 * 1024;   // фото крупнее — уменьшаем в браузере перед отправкой
const SHRINK_TO_PX = 2000;

/** Уменьшает крупное фото (JPEG/PNG/WebP) до 2000 px по большей стороне; остальное и при ошибке — как есть. */
function shrinkPhoto(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < SHRINK_FROM_BYTES || !window.createImageBitmap) return Promise.resolve(file);
  return createImageBitmap(file).then((bmp) => {
    const k = Math.min(1, SHRINK_TO_PX / Math.max(bmp.width, bmp.height));
    const cv = document.createElement("canvas");
    cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
    cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
    return new Promise((ok) => cv.toBlob((b) => ok(b && b.size < file.size ? new File([b], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file), "image/jpeg", 0.85));
  }).catch(() => file);
}

$$("[data-docs-form]").forEach((form) => {
  const msg = $(".tf-msg", form);
  const inputs = $$('input[type="file"]', form);
  const show = (text, isErr) => { msg.hidden = false; msg.classList.toggle("is-err", isErr); msg.textContent = text; };
  inputs.forEach((inp) => {
    const state = inp.closest(".tf-doc").querySelector(".tf-doc-s");
    const empty = state.textContent;
    inp.addEventListener("change", () => {
      const files = [...inp.files];
      const big = files.some((f) => f.size > MAX_FILE_BYTES);
      state.textContent = !files.length ? empty : (files.length === 1 ? files[0].name : `Выбрано файлов: ${files.length}`) + (big ? " — больше 10 МБ" : " ✓");
      inp.closest(".tf-doc").classList.toggle("is-set", files.length > 0 && !big);
      inp.closest(".tf-doc").classList.toggle("is-err", big);
    });
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const all = inputs.flatMap((inp) => [...inp.files].map((file) => ({ name: inp.name, file })));
    const fio = form.elements.fio.value.trim(), digits = form.elements.phone.value.replace(/\D/g, "");
    let err = "";
    if (fio.length < 3) err = "Укажите ФИО.";
    else if (digits.length < 10) err = "Укажите контактный телефон.";
    else if (all.length > MAX_FILES) err = `Можно приложить не больше ${MAX_FILES} файлов.`;
    else if (all.some((x) => x.file.size > MAX_FILE_BYTES)) err = "Каждый файл — не больше 10 МБ.";
    else if (!form.elements.agree.checked) err = "Нужно согласие на обработку персональных данных.";
    if (err) return show(err, true);
    const phone = C.phone || "";
    if (!C.leadsEndpoint) return show(`Анкеты пока не подключены — позвоните: ${phone}.`, false);
    const btn = form.querySelector('button[type="submit"]'), label = btn.textContent;
    btn.disabled = true; btn.textContent = all.length ? "Готовим фото…" : "Отправляем…"; msg.hidden = true;
    Promise.all(all.map((x) => shrinkPhoto(x.file).then((file) => ({ name: x.name, file }))))
      .then((ready) => {
        btn.textContent = "Отправляем…";
        const fd = new FormData();
        ["vacancy", "website", "fio", "phone"].forEach((k) => fd.append(k, form.elements[k].value));
        fd.append("agree", "on");
        fd.append("page", location.pathname.split("/").slice(-2).join("/"));
        ready.forEach((x) => fd.append(x.name, x.file, x.file.name));
        return fetch(C.leadsEndpoint, { method: "POST", body: fd });
      })
      .then((r) => r.json().catch(() => ({ ok: false })))
      .then((res) => {
        if (!res.ok) throw new Error(res.error || "");
        form.reset();
        inputs.forEach((inp) => inp.dispatchEvent(new Event("change")));
        show("Анкета отправлена ✓ Менеджер свяжется с вами в ближайшее время.", false);
      })
      .catch((er) => show(`${er.message || "Не удалось отправить анкету."} Позвоните нам: ${phone}.`, true))
      .finally(() => { btn.disabled = false; btn.textContent = label; });
  });
});
})();
