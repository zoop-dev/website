import './styles/main.css';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import HeroManager from './webgl/HeroManager.js';
import Fluid from './webgl/Fluid.js';
import { defaultConfig, normalizeConfig } from './config.default.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasHover = window.matchMedia('(hover: hover)').matches;


if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);


const heroStyleOverride = new URLSearchParams(location.search).get('hero'); 
const hero = new HeroManager(document.getElementById('hero-gl'), heroStyleOverride || 'glass');
const play = new Fluid(document.getElementById('play-gl'));


const lenis = new Lenis({
  duration: 1.15, smoothWheel: true, lerp: 0.1,
  
  prevent: (node) => !!(node && node.closest && node.closest('.projects-page')),
});
lenis.on('scroll', onScroll);
lenis.scrollTo(0, { immediate: true });

const heroEl = document.getElementById('hero');
const playEl = document.getElementById('play');
function onScroll() {
  const hRect = heroEl.getBoundingClientRect();
  hero.setScroll(Math.min(1, Math.max(0, -hRect.top / (window.innerHeight * 0.9))));
  
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const p = Math.min(1, Math.max(0, window.scrollY / max));
  hero.setProgress(p);
  hero.setOffset(Math.sin(p * Math.PI * 2) * 0.42, Math.cos(p * Math.PI * 1.6) * 0.12);

  
  if (!reduced) {
    const hp = Math.min(1, Math.max(0, -hRect.top / window.innerHeight));
    metaL && (metaL.style.transform = `translateY(${hp * -60}px)`);
    metaR && (metaR.style.transform = `translateY(${hp * -110}px)`);
  }
}
const metaL = document.querySelector('.hero__meta--l');
const metaR = document.querySelector('.hero__meta--r');


document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  e.preventDefault();
  if (pageOpen) closeProjects();
  if (id === '#' || id === '#top') { lenis.scrollTo(0, { duration: 1.2 }); return; }
  const el = document.querySelector(id);
  if (el) lenis.scrollTo(el, { duration: 1.2 });
});


const marqueeTrack = document.querySelector('.marquee__track');
let marqueeX = 0, marqueeHalf = 0;
function measureMarquee() { marqueeHalf = marqueeTrack.scrollWidth / 2; }
function updateVelocityFX() {
  const v = lenis.velocity || 0;                 
  
  const dir = v < -0.05 ? -1 : 1;
  const speed = 0.7 + Math.min(Math.abs(v) * 0.35, 14);
  marqueeX -= speed * dir;
  if (marqueeHalf) {
    if (marqueeX <= -marqueeHalf) marqueeX += marqueeHalf;
    if (marqueeX >= 0) marqueeX -= marqueeHalf;
  }
  marqueeTrack.style.transform = `translate3d(${marqueeX}px,0,0)`;
}


const workEl = document.getElementById('work');
const workTrack = document.getElementById('work-track');
const workFill = document.getElementById('work-progress-fill');
let workMaxX = 0, workTargetX = 0, workCurrentX = 0;
const WORK_HOLD_VH = 55;   
function measureWork() {
  if (window.innerWidth <= 760) { workEl.style.height = ''; workMaxX = 0; return; }
  
  
  const prev = workTrack.style.transform;
  workTrack.style.transform = 'translate3d(0,0,0)';
  const trackLeft = workTrack.getBoundingClientRect().left;
  const last = workTrack.lastElementChild;
  const lastRight = last ? last.getBoundingClientRect().right - trackLeft : 0;
  workTrack.style.transform = prev;
  const endMargin = Math.min(window.innerWidth * 0.06, 80);
  workMaxX = Math.max(0, lastRight - window.innerWidth + endMargin);
  const travelVh = (workMaxX / window.innerHeight) * 100;
  workEl.style.height = `${100 + Math.max(35, travelVh) + WORK_HOLD_VH}vh`;
}
function updateWork() {
  if (window.innerWidth <= 760) { workTrack.style.transform = ''; return; }
  const rect = workEl.getBoundingClientRect();
  const holdPx = (WORK_HOLD_VH / 100) * window.innerHeight;
  
  const travelRange = Math.max(1, workEl.offsetHeight - window.innerHeight - holdPx);
  const p = Math.min(1, Math.max(0, -rect.top / travelRange));
  workTargetX = p * workMaxX;
  workFill.style.transform = `scaleX(${p})`;
}


const pointer = { x: 0, y: 0, nx: 0, ny: 0 };
const prevPlay = { x: 0, y: 0, set: false };
let overPlay = false;
let dragging = false;

window.addEventListener('pointermove', (e) => {
  pointer.x = e.clientX; pointer.y = e.clientY;
  pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.ny = -((e.clientY / window.innerHeight) * 2 - 1);
  hero.setMouse(pointer.nx, pointer.ny);

  if (overPlay) {
    const r = play.canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = 1 - (e.clientY - r.top) / r.height;   
    const boost = dragging ? 2.4 : 1;
    const dx = ((e.movementX || 0) / r.width) * boost;
    const dy = (-(e.movementY || 0) / r.height) * boost;
    
    if (prevPlay.set) {
      const dist = Math.hypot(x - prevPlay.x, y - prevPlay.y);
      const steps = Math.min(32, Math.max(1, Math.ceil(dist / 0.012)));
      for (let i = 1; i <= steps; i++) {
        const tt = i / steps;
        play.splat(prevPlay.x + (x - prevPlay.x) * tt, prevPlay.y + (y - prevPlay.y) * tt, dx, dy);
      }
    } else {
      play.splat(x, y, dx, dy);
    }
    prevPlay.x = x; prevPlay.y = y; prevPlay.set = true;
  }
});
window.addEventListener('pointerdown', () => {
  dragging = true;
  gsap.to(hero.uniforms.uPress, { value: 1, duration: 0.4, ease: 'power2.out' });
});
window.addEventListener('pointerup', () => {
  dragging = false;
  gsap.to(hero.uniforms.uPress, { value: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
});
playEl.addEventListener('pointerenter', () => { overPlay = true; prevPlay.set = false; });
playEl.addEventListener('pointerleave', () => { overPlay = false; prevPlay.set = false; });


const cursorEl = document.querySelector('.cursor');
const cursorLabel = document.createElement('span');
cursorLabel.className = 'cursor__label';
cursorEl.querySelector('.cursor__ring').after(cursorLabel);



function bindCursor(root = document) {
  root.querySelectorAll('[data-cursor]').forEach((el) => {
    if (el.dataset.cursorBound) return;
    el.dataset.cursorBound = '1';
    const type = el.getAttribute('data-cursor');
    el.addEventListener('pointerenter', () => {
      cursorEl.classList.add(`is-${type}`);
      if (type === 'view') cursorLabel.textContent = 'View';
    });
    el.addEventListener('pointerleave', () => { cursorEl.classList.remove(`is-${type}`); cursorLabel.textContent = ''; });
  });
}

if (hasHover) {
  const ring = cursorEl.querySelector('.cursor__ring');
  const dotEl = cursorEl.querySelector('.cursor__dot');
  const cur = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { x: cur.x, y: cur.y };
  window.addEventListener('pointermove', () => { cur.x = pointer.x; cur.y = pointer.y; });
  gsap.ticker.add(() => {
    ringPos.x += (cur.x - ringPos.x) * 0.18;
    ringPos.y += (cur.y - ringPos.y) * 0.18;
    ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%,-50%)`;
    cursorLabel.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%,-50%)`;
    dotEl.style.transform = `translate(${cur.x}px, ${cur.y}px) translate(-50%,-50%)`;
  });
}


let siteConfig = normalizeConfig(defaultConfig);

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [43, 184, 255];
}
const hexToRgba = (hex, a) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };

function setLineText(sel, texts) {
  const lines = document.querySelectorAll(`${sel} .line [data-reveal-y]`);
  texts.forEach((t, i) => { if (lines[i]) lines[i].textContent = t; });
}
const setText = (sel, v) => { const el = document.querySelector(sel); if (el != null && v != null) el.textContent = v; };
const emphasize = (s) => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>');
const fmtStat = (n, compact) => {
  if (compact) {
    if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
    if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
  }
  return Math.round(n).toLocaleString('en-US');
};
function renderMarquee(words) {
  const track = document.querySelector('.marquee__track');
  if (!track) return;
  const seq = words.map((w) => `<span>${esc(w)}</span><i>✺</i>`).join('');
  track.innerHTML = seq + seq;
  measureMarquee();
}
function makePanel(pr, n) {
  const a = document.createElement('article');
  a.className = 'panel';
  a.dataset.cursor = 'view';
  a.style.setProperty('--panel-glow', hexToRgba(pr.accent || siteConfig.accent, 0.16));
  a.innerHTML = `<span class="panel__idx">${String(n).padStart(2, '0')}</span>`
    + `<div class="panel__body"><h3 class="panel__name">${esc(pr.name)}</h3>`
    + `<p class="panel__tag">${esc(pr.tag)}</p>`
    + `<div class="panel__meta"><span>${esc(pr.year)}</span><span>${esc(pr.stack)}</span></div></div>`
    + `<span class="panel__view">View case</span>`;
  if (pr.url && pr.url !== '#') a.addEventListener('click', () => window.open(pr.url, '_blank', 'noopener'));
  return a;
}
function makeAllTile(total) {
  const a = document.createElement('article');
  a.className = 'panel panel--more-btn';
  a.dataset.cursor = 'zoom';
  a.innerHTML = `<div class="panel__body"><span class="panel__idx">↗</span>`
    + `<h3 class="panel__name">All projects</h3>`
    + `<p class="panel__tag">See all ${total} →</p></div>`
    + `<span class="panel__view">Open page</span>`;
  return a;
}
function renderProjects(projects) {
  const track = document.getElementById('work-track');
  if (!track) return;
  track.innerHTML = '';
  const pinned = projects.filter((p) => p.pinned);
  (pinned.length ? pinned : projects).forEach((p, i) => track.appendChild(makePanel(p, i + 1)));
  const all = makeAllTile(projects.length);
  all.addEventListener('click', () => openProjects());
  track.appendChild(all);
  bindCursor(track);
  measureWork();
}


let pageOpen = false;
const projPageEl = document.getElementById('projects-page');
const isProjectsPath = () => /^\/projects(\.html)?\/?$/.test(location.pathname);
function buildProjectsGrid(projects) {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '';
  projects.forEach((pr, i) => {
    const c = document.createElement('article');
    c.className = 'pcard';
    c.dataset.cursor = 'view';
    c.style.setProperty('--panel-glow', hexToRgba(pr.accent || siteConfig.accent, 0.16));
    c.innerHTML = `<div class="pcard__top"><span>${String(i + 1).padStart(2, '0')}</span>`
      + `<span>${esc(pr.year)}${pr.pinned ? ' · <span class="pcard__pin">pinned</span>' : ''}</span></div>`
      + `<div><h3 class="pcard__name">${esc(pr.name)}</h3><p class="pcard__tag">${esc(pr.tag)}</p>`
      + `<div class="pcard__stack">${esc(pr.stack)}</div></div>`;
    if (pr.url && pr.url !== '#') c.addEventListener('click', () => window.open(pr.url, '_blank', 'noopener'));
    grid.appendChild(c);
  });
  bindCursor(grid);
}
function openProjects(push = true) {
  if (pageOpen) return;
  pageOpen = true;
  if (push && location.pathname !== '/projects') history.pushState({ projects: true }, '', '/projects');
  const page = document.getElementById('projects-page');
  buildProjectsGrid(siteConfig.projects);
  lenis.stop();
  closeCtx();
  page.classList.add('is-open');
  page.setAttribute('aria-hidden', 'false');
  page.scrollTop = 0;
  
  gsap.killTweensOf([page, '.projects-page__title', '.pcard']);
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .set(page, { yPercent: 100, y: 0 })
    .to(page, { yPercent: 0, y: 0, duration: 0.9, ease: 'expo.inOut' })
    .from('.projects-page__bar', { yPercent: -40, opacity: 0, duration: 0.6 }, 0.3)
    .from('.projects-page__title', { yPercent: 40, opacity: 0, duration: 0.8 }, 0.35)
    .from('.pcard', { yPercent: 24, opacity: 0, duration: 0.7, stagger: 0.045 }, 0.45);
}
function closeProjects(push = true) {
  if (!pageOpen) return;
  pageOpen = false;
  if (push && location.pathname === '/projects') history.pushState({}, '', '/');
  const page = document.getElementById('projects-page');
  gsap.killTweensOf(page);
  gsap.to(page, {
    yPercent: 100, y: 0, duration: 0.75, ease: 'expo.inOut',
    onComplete: () => { page.classList.remove('is-open'); page.setAttribute('aria-hidden', 'true'); lenis.start(); },
  });
}
document.getElementById('projects-close').addEventListener('click', () => closeProjects());
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && pageOpen) closeProjects(); });

window.addEventListener('popstate', () => {
  if (isProjectsPath()) openProjects(false);
  else closeProjects(false);
});


const sbEl = document.getElementById('scrollbar');
const sbThumb = document.getElementById('scrollbar-thumb');
let sbDrag = false, sbDownY = 0, sbDownScroll = 0, sbTrack = 0, sbThumbH = 40;
function scrollCtx() {
  if (pageOpen) {
    const pg = document.getElementById('projects-page');
    return { scroll: pg.scrollTop, limit: pg.scrollHeight - pg.clientHeight, view: pg.clientHeight, set: (v) => { pg.scrollTop = v; } };
  }
  const limit = lenis.limit || (document.documentElement.scrollHeight - window.innerHeight);
  return { scroll: lenis.scroll || window.scrollY, limit, view: window.innerHeight, set: (v) => lenis.scrollTo(v, { immediate: true }) };
}
function updateScrollbar() {
  const { scroll, limit, view } = scrollCtx();
  sbTrack = window.innerHeight;
  if (limit <= 4) { sbThumb.style.opacity = '0'; return; }
  sbThumb.style.opacity = '';
  sbThumbH = Math.max(40, (view / (limit + view)) * sbTrack);
  const prog = Math.min(1, Math.max(0, scroll / limit));
  sbThumb.style.height = `${sbThumbH}px`;
  sbThumb.style.transform = `translateY(${prog * (sbTrack - sbThumbH)}px)`;
}
sbThumb.addEventListener('pointerdown', (e) => {
  sbDrag = true; sbEl.classList.add('is-drag');
  sbDownY = e.clientY; sbDownScroll = scrollCtx().scroll;
  e.preventDefault(); e.stopPropagation();
});
window.addEventListener('pointermove', (e) => {
  if (!sbDrag) return;
  const ctx = scrollCtx();
  const ratio = ctx.limit / Math.max(1, sbTrack - sbThumbH);
  ctx.set(Math.min(ctx.limit, Math.max(0, sbDownScroll + (e.clientY - sbDownY) * ratio)));
});
window.addEventListener('pointerup', () => { sbDrag = false; sbEl.classList.remove('is-drag'); });

function renderAboutLead(text) {
  const lead = document.querySelector('.about__lead');
  if (!lead) return;
  lead.innerHTML = String(text).split(/\s+/).map((w) => `<span data-reveal-word>${esc(w)}</span>`).join(' ');
}

function updateAboutLead() {
  const lead = document.querySelector('.about__lead');
  if (!lead) return;
  const words = lead.querySelectorAll('[data-reveal-word]');
  if (!words.length) return;
  const rect = lead.getBoundingClientRect();
  const vh = window.innerHeight;
  const prog = Math.min(1, Math.max(0, (vh * 0.82 - rect.top) / (vh * 0.55)));
  const lit = prog * words.length;
  words.forEach((w, i) => { w.style.opacity = (0.12 + 0.88 * Math.min(1, Math.max(0, lit - i))).toFixed(3); });
}
function renderAboutColumns(columns) {
  const grid = document.querySelector('.about__grid');
  if (!grid) return;
  grid.innerHTML = columns.map((col) => {
    const body = Array.isArray(col.items)
      ? `<ul>${col.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
      : `<p>${esc(col.text)}</p>`;
    return `<div class="about__col"><h3>${esc(col.title)}</h3>${body}</div>`;
  }).join('');
}
function attachStatCounters() {
  document.querySelectorAll('.stat__num[data-count]').forEach((el) => {
    if (el.dataset.bound) return;
    el.dataset.bound = '1';
    const target = parseFloat(el.dataset.count);
    const compact = el.dataset.format === 'compact';
    const start = () => {
      const obj = { v: 0 };
      gsap.to(obj, { v: target, duration: 1.8, ease: 'power3.out', onUpdate: () => { el.textContent = fmtStat(obj.v, compact); } });
    };
    
    const r = el.getBoundingClientRect();
    if (revealed && r.top < window.innerHeight && r.bottom > 0) { start(); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { start(); io.disconnect(); } });
    }, { threshold: 0.6 });
    io.observe(el);
  });
}
function renderStats(stats) {
  const wrap = document.querySelector('.stats');
  if (!wrap) return;
  wrap.innerHTML = stats.map((s) => {
    const numeric = typeof s.value === 'number' && Number.isFinite(s.value);
    const num = numeric
      ? `<span class="stat__num" data-count="${s.value}"${s.format === 'compact' ? ' data-format="compact"' : ''}>0</span>`
      : `<span class="stat__num">${esc(s.value)}</span>`;
    return `<div class="stat">${num}<span class="stat__label">${esc(s.label)}</span></div>`;
  }).join('');
  attachStatCounters();
}

function applyConfig(config) {
  siteConfig = config;
  if (!heroStyleOverride && config.heroStyle) hero.setStyle(config.heroStyle);
  document.documentElement.style.setProperty('--accent', config.accent);
  hero.setAccent(config.accent);
  play.setAccent(config.accent);

  
  if (config.meta.title) document.title = config.meta.title;
  const desc = document.querySelector('meta[name="description"]');
  if (desc && config.meta.description) desc.setAttribute('content', config.meta.description);
  
  const navWrap = document.querySelector('.nav__links');
  if (navWrap) {
    navWrap.innerHTML = config.nav.links.map((l) => `<a href="${esc(l.href)}" data-cursor="zoom">${esc(l.label)}</a>`).join('')
      + `<a href="#contact" class="nav__cta" data-cursor="zoom">${esc(config.nav.cta)}</a>`;
    bindCursor(navWrap);
  }
  
  const ml = document.querySelectorAll('.hero__meta--l span');
  const mr = document.querySelectorAll('.hero__meta--r span');
  config.hero.metaL.forEach((t, i) => { if (ml[i]) ml[i].textContent = t; });
  config.hero.metaR.forEach((t, i) => { if (mr[i]) mr[i].textContent = t; });
  setLineText('.hero__title', [config.hero.line1, config.hero.em, config.hero.line3]);
  const sub = document.querySelector('.hero__sub');
  if (sub) sub.innerHTML = emphasize(config.hero.sub);
  
  setText('.work__title', config.work.title);
  setText('.work__hint', config.work.hint);
  
  renderAboutLead(config.about.lead);
  renderAboutColumns(config.about.columns);
  
  renderStats(config.stats);
  
  const ph = document.querySelector('.play__copy h2');
  if (ph) ph.innerHTML = esc(config.play.heading).replace(/\n/g, '<br>');
  setText('.play__copy p', config.play.copy);
  
  setLineText('.contact__title', [config.contact.line1, config.contact.em, config.contact.line3]);
  const mail = document.querySelector('.contact__mail');
  if (mail) { mail.textContent = config.email; mail.href = `mailto:${config.email}`; }
  const sw = document.querySelector('.contact__socials');
  if (sw) {
    sw.innerHTML = config.socials.map((s) => `<a href="${esc(s.url)}" data-cursor="zoom"${s.url && s.url !== '#' ? ' target="_blank" rel="noopener"' : ''}>${esc(s.label)}</a>`).join('');
    bindCursor(sw);
  }
  
  const footSpans = document.querySelectorAll('.footer span');
  if (footSpans[0]) footSpans[0].textContent = config.footer.left;
  if (footSpans[1]) footSpans[1].textContent = config.footer.mid;
  
  const pgTitle = document.getElementById('projects-page-title');
  if (pgTitle) pgTitle.innerHTML = esc(config.projectsPage.title).replace(/\n/g, '<br>');

  renderMarquee(config.marquee);
  renderProjects(config.projects);
}

const timeoutP = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));

async function bootRemoteConfig() {
  if (navigator.onLine === false) return 'offline';
  try {
    const r = await Promise.race([fetch('/api/config', { headers: { accept: 'application/json' } }), timeoutP(6000)]);
    if (r.status === 404) return 'default';          
    if (!r.ok) return 'error';
    const remote = await r.json();
    applyConfig(normalizeConfig(remote && remote.config ? remote.config : remote));
    return 'ok';
  } catch {
    return navigator.onLine === false ? 'offline' : 'error';
  }
}


function setupReveals() {
  
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      gsap.to(entry.target, { opacity: 1, y: 0, duration: 1, ease: 'expo.out',
        delay: parseFloat(entry.target.dataset.delay || 0) });
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

  
  
  const lineIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const inner = entry.target.querySelectorAll('[data-reveal-y]');
      gsap.to(inner, { yPercent: 0, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 });
      lineIO.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
  
  document.querySelectorAll('.line').forEach((line) => {
    if (!line.closest('.hero__title')) lineIO.observe(line);
  });

  
}


const ctx = document.getElementById('ctx');
const toastEl = document.getElementById('toast');
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), 2200);
}
function openCtx(x, y) {
  const w = ctx.offsetWidth || 232, h = ctx.offsetHeight || 320;
  ctx.style.left = Math.min(x, window.innerWidth - w - 12) + 'px';
  ctx.style.top = Math.min(y, window.innerHeight - h - 12) + 'px';
  ctx.classList.add('is-open');
  ctx.setAttribute('aria-hidden', 'false');
}
function closeCtx() { ctx.classList.remove('is-open'); ctx.setAttribute('aria-hidden', 'true'); }

window.addEventListener('contextmenu', (e) => { e.preventDefault(); openCtx(e.clientX, e.clientY); });
window.addEventListener('pointerdown', (e) => { if (!ctx.contains(e.target)) closeCtx(); });
window.addEventListener('scroll', closeCtx, true);
lenis.on('scroll', closeCtx);

const ctxActions = {
  boop() {
    gsap.fromTo(hero.uniforms.uPress, { value: 0 }, { value: 1, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.inOut' });
    toast('boop ✦');
  },
  ink() {
    for (let i = 0; i < 24; i++) {
      play.splat(Math.random(), Math.random(), (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);
    }
    toast('splash 🌊');
  },
  roll() {
    
    const ox = window.innerWidth / 2;
    const oy = window.scrollY + window.innerHeight / 2;
    gsap.fromTo(document.body, { rotate: 0 }, { rotate: 360, duration: 1.2, ease: 'power2.inOut',
      transformOrigin: `${ox}px ${oy}px`,
      onComplete: () => gsap.set(document.body, { clearProps: 'transform,transformOrigin' }) });
    toast('wheee 🙃');
  },
  email() {
    navigator.clipboard?.writeText(siteConfig.email).then(() => toast('email copied 📋'), () => toast(siteConfig.email));
  },
  konami() {
    document.body.classList.toggle('chaos');
    toast(document.body.classList.contains('chaos') ? 'chaos engaged 🌀' : 'order restored');
  },
  top() { lenis.scrollTo(0, { duration: 1.4 }); toast('beam me up 🛸'); },
  nothing() { toast('told you. nothing. 🤫'); },
};
ctx.querySelectorAll('.ctx__item').forEach((item) => {
  item.addEventListener('click', () => { ctxActions[item.dataset.action]?.(); closeCtx(); });
});


const C = { blue: 'color:#2bb8ff', dim: 'color:#8a8a93', fg: 'color:#ecebe6' };
console.log('%czoop', `font:700 46px 'Clash Display',monospace;${C.blue};text-shadow:0 0 18px rgba(43,184,255,.55)`);
console.log('%cwell well well… look who opened the console 👀', `${C.fg};font-size:13px`);
console.log('%cthis whole thing is hand-rolled WebGL + GLSL. no page-builders were used (or harmed).', `${C.dim};font-size:12px`);
console.log(
  '%cthings you can type:%c\n  zoop.boop()   %c— poke the blob\n  %czoop.ink()    %c— splash the fluid\n  %czoop.chaos()  %c— you have been warned\n  %czoop.roll()   %c— wheeee\n  %czoop.hire()   %c— the most important one',
  `${C.blue};font-weight:bold`, C.blue, C.dim, C.blue, C.dim, C.blue, C.dim, C.blue, C.dim, C.blue, C.dim,
);
console.log('%c…or just right-click anywhere. there might be a chaos mode. 🌀', `${C.dim};font-style:italic`);

window.zoop = {
  boop: ctxActions.boop,
  ink: ctxActions.ink,
  chaos: ctxActions.chaos,
  roll: ctxActions.roll,
  hire() { console.log('%c❤  i build immersive web things. say hi → hi@zachy.cc', `${C.blue};font-size:15px`); return 'hi@zachy.cc'; },
  hero(style) {
    const s = style === 'blob' || style === 'glass' ? style : (hero.style === 'glass' ? 'blob' : 'glass');
    hero.setStyle(s); hero.resize();
    console.log(`%c🫧 hero → ${s}`, C.blue);
    return s;
  },
};


const clock = document.getElementById('clock');
setInterval(() => {
  const d = new Date();
  clock.textContent = d.toLocaleTimeString('en-US', { hour12: false }) + ' LOCAL';
}, 1000);


const tSleep = (ms) => new Promise((r) => setTimeout(r, ms));
let titleHidden = false;
const setTitle = (s) => { if (titleHidden) return; document.title = s && s.length ? s : ' '; };

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { titleHidden = true; document.title = titlePhrases()[0] || 'zoop'; }
  else { titleHidden = false; }
});
const pick = (a) => a[(Math.random() * a.length) | 0];
const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ·@/.';

async function fxScrambleSet(from, to, glyphs) {
  const n = Math.max(from.length, to.length);
  const q = [];
  for (let i = 0; i < n; i++) { const s = (Math.random() * 14) | 0; q.push({ a: from[i] || ' ', b: to[i] || '', s, e: s + 8 + ((Math.random() * 14) | 0), c: '' }); }
  for (let f = 0; ; f++) {
    let out = '', done = 0;
    for (const o of q) {
      if (f >= o.e) { out += o.b; done++; }
      else if (f >= o.s) { if (!o.c || Math.random() < 0.35) o.c = pick(glyphs); out += o.c; }
      else out += o.a;
    }
    setTitle(out);
    if (done === n) return;
    await tSleep(45);
  }
}
const fxScramble = (f, t) => fxScrambleSet(f, t, '!<>-_\\/[]{}=+*^?#$%&');
const fxBinary = (f, t) => fxScrambleSet(f, t, '01');

async function fxFlap(from, to) {
  const n = Math.max(from.length, to.length);
  const cols = [];
  for (let i = 0; i < n; i++) {
    const b = to[i] || ' ';
    const tgt = Math.max(0, FLAP.indexOf(b));
    const steps = 8 + ((Math.random() * 16) | 0);
    cols.push({ b, tgt, pos: ((tgt - steps) % FLAP.length + FLAP.length) % FLAP.length, start: i + ((Math.random() * 2) | 0), done: FLAP.indexOf(b) < 0 });
  }
  for (let f = 0; ; f++) {
    let out = '', done = 0;
    for (const c of cols) {
      if (c.done) { out += c.b; done++; continue; }
      if (f < c.start) { out += ' '; continue; }
      c.pos = (c.pos + 1) % FLAP.length;
      if (c.pos === c.tgt) { c.done = true; out += c.b; done++; } else out += FLAP[c.pos];
    }
    setTitle(out);
    if (done === n) return;
    await tSleep(45);
  }
}

async function fxDissolve(from, to) {
  const n = Math.max(from.length, to.length);
  const order = [...Array(n).keys()].sort(() => Math.random() - 0.5);
  const shown = new Set();
  for (let k = 0; k <= n; k++) {
    if (k > 0) shown.add(order[k - 1]);
    let out = '';
    for (let i = 0; i < n; i++) out += shown.has(i) ? (to[i] || '') : pick('▓▒░');
    setTitle(out);
    await tSleep(65);
  }
  setTitle(to);
}

async function fxType(from, to) {
  for (let i = from.length; i >= 0; i--) { setTitle(from.slice(0, i) + '▋'); await tSleep(35); }
  for (let i = 0; i <= to.length; i++) { setTitle(to.slice(0, i) + '▋'); await tSleep(70); }
  for (let k = 0; k < 2; k++) { setTitle(`${to} `); await tSleep(320); setTitle(`${to}▋`); await tSleep(320); }
  setTitle(to);
}

async function fxMarquee(from, to) {
  const s = `   ${to}   ·   `;
  const win = Math.min(s.length, Math.max(to.length, 16));
  for (let i = 0; i < s.length - win; i++) { setTitle(s.slice(i, i + win)); await tSleep(85); }
  setTitle(to);
}


async function fxWave(from, to) {
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < to.length; i++) {
      if (to[i] === ' ') continue;
      setTitle(to.slice(0, i) + '[' + to[i] + ']' + to.slice(i + 1));
      await tSleep(55);
    }
  }
  setTitle(to);
}

async function fxGlitch(from, to) {
  setTitle(to); await tSleep(220);
  const GL = '#@$%&!?▓▒░/\\';
  for (let k = 0; k < 6; k++) {
    const out = to.split('');
    const hits = 1 + ((Math.random() * 3) | 0);
    for (let h = 0; h < hits; h++) out[(Math.random() * to.length) | 0] = pick(GL);
    setTitle(out.join('')); await tSleep(55);
    setTitle(to); await tSleep(110 + ((Math.random() * 220) | 0));
  }
  setTitle(to);
}


async function fxCounter() {
  const target = 240 + ((Math.random() * 9000) | 0);
  const label = pick([' fps (lies)', ' lines of glsl', ' blobs rendered', ' ms of your life']);
  const t0 = performance.now(), dur = 1300;
  for (;;) {
    const p = Math.min(1, (performance.now() - t0) / dur);
    setTitle(`${String(Math.floor(p * p * target)).padStart(4, '0')}${label}`);
    if (p >= 1) break;
    await tSleep(50);
  }
  setTitle(`${target}${label}`); await tSleep(900);
}
async function fxProgress() {
  const label = pick(['buffering vibes', 'loading nothing', 'rendering feelings', 'compiling chaos', 'downloading more ram']);
  const W = 10;
  for (let i = 0; i <= W; i++) { setTitle('▰'.repeat(i) + '▱'.repeat(W - i) + ' ' + label); await tSleep(115); }
  setTitle('▰'.repeat(W) + ' done :)'); await tSleep(900);
}
async function fxBounce() {
  const W = 16; let x = 0, dir = 1;
  for (let f = 0; f < 46; f++) {
    setTitle('|' + ' '.repeat(x) + '●' + ' '.repeat(W - x) + '|');
    x += dir; if (x <= 0 || x >= W) dir *= -1;
    await tSleep(60);
  }
}
async function fxPong() {
  const W = 15; let x = 1, dir = 1;
  for (let f = 0; f < 48; f++) {
    const cells = Array(W).fill(' '); cells[x] = '●';
    setTitle('▌' + cells.join('') + '▐');
    x += dir; if (x <= 0 || x >= W - 1) dir *= -1;
    await tSleep(55);
  }
}

const TITLE_TRANSITIONS = [fxScramble, fxFlap, fxDissolve, fxBinary, fxType, fxMarquee, fxWave, fxGlitch];
const TITLE_INTERLUDES = [fxCounter, fxProgress, fxBounce, fxPong];


function titlePhrases() {
  const raw = (siteConfig.title && siteConfig.title.phrases) || [];
  const list = raw.map((s) => (s === '{email}' ? siteConfig.email : s)).filter((s) => s && s.length);
  return list.length ? list : ['zoop'];
}

async function runTitleLoop() {
  if (reduced) return;
  await tSleep(1800);
  let cur = document.title, i = 0;
  for (;;) {
    if (document.hidden) { await tSleep(1200); continue; }
    const cfg = siteConfig.title || {};
    if (cfg.enabled === false) { cur = document.title = siteConfig.meta.title; await tSleep(2000); continue; }
    if (cfg.interludes !== false && Math.random() < 0.16) { await pick(TITLE_INTERLUDES)(); cur = document.title; await tSleep(1600); continue; }
    const list = titlePhrases();
    i = (i + 1) % list.length;
    const to = list[i];
    await pick(TITLE_TRANSITIONS)(cur, to);
    cur = to;
    await tSleep(2200);
  }
}


const lite = new URLSearchParams(location.search).has('lite');
const loaderEl = document.getElementById('loader');
const loaderPct = document.getElementById('loader-pct');
const loaderFill = document.getElementById('loader-fill');
const loaderStatusEl = document.getElementById('loader-status');
const loaderRetry = document.getElementById('loader-retry');
const L = { v: 0 };
let revealed = false, bootFailed = false;

const setLoader = () => { loaderPct.textContent = Math.round(L.v); loaderFill.style.transform = `scaleX(${L.v / 100})`; };
function loaderStatus(msg, isError) {
  loaderStatusEl.textContent = msg || '';
  loaderStatusEl.classList.toggle('is-error', !!isError);
  loaderEl.classList.toggle('is-error', !!isError);
}
function fatal(msg) {
  if (revealed) return;            
  bootFailed = true;
  loaderStatus(msg || 'Something broke while loading.', true);
  loaderRetry.hidden = false;
}

window.addEventListener('error', (e) => fatal(`Something broke. (${(e && e.message) || 'script error'})`));
window.addEventListener('unhandledrejection', () => fatal('Something broke while loading.'));
loaderRetry.addEventListener('click', () => location.reload());

function revealSite() {
  if (revealed || bootFailed) return;
  revealed = true;
  gsap.to(hero.uniforms.uReveal, { value: 1, duration: 1.6, ease: 'power2.out' });
  gsap.to(loaderEl, { yPercent: -100, duration: 1.1, ease: 'expo.inOut', onComplete: () => { loaderEl.style.display = 'none'; } });
  gsap.set('.hero__title [data-reveal-y]', { yPercent: 110, y: 0 });
  gsap.to('.hero__title [data-reveal-y]', { yPercent: 0, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.09, delay: 0.3 });
  gsap.to('.hero__sub, .hero__meta span, .hero__scroll', { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.05, delay: 0.7 });
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function boot() {
  applyConfig(normalizeConfig(defaultConfig));   
  measureWork(); measureMarquee();
  setupReveals();

  if (lite) { L.v = 100; setLoader(); revealSite(); await bootRemoteConfig(); if (isProjectsPath()) openProjects(false); return; }

  const crawl = gsap.to(L, { v: 88, duration: 1.3, ease: 'power1.out', onUpdate: setLoader });
  let status = 'default';
  try { status = await bootRemoteConfig(); } catch { status = 'error'; }
  if (bootFailed) return;                          

  if (status === 'offline') { loaderStatus("You're offline — running on the built-in version."); await wait(1200); }
  else if (status === 'error') { loaderStatus('Config service hiccuped — using defaults.'); await wait(1200); }
  else if (status === 'ok') { loaderStatus('Ready.'); }

  crawl.kill();
  gsap.to(L, { v: 100, duration: 0.5, ease: 'power2.inOut', onUpdate: setLoader,
    onComplete: () => { revealSite(); if (isProjectsPath()) openProjects(false); } });
}


window.addEventListener('resize', () => { hero.resize(); play.resize(); measureWork(); });

let hidden = document.hidden;
document.addEventListener('visibilitychange', () => { hidden = document.hidden; });

function raf(t) {
  const time = t * 0.001;
  lenis.raf(t);
  updateScrollbar();
  updateVelocityFX();
  updateWork();
  updateAboutLead();
  workCurrentX += (workTargetX - workCurrentX) * 0.16;
  if (window.innerWidth > 760) workTrack.style.transform = `translate3d(${-workCurrentX}px,0,0)`;
  if (!hidden && revealed) {
    
    const vh = window.innerHeight;
    const pr = playEl.getBoundingClientRect();
    const playOn = pr.bottom > 0 && pr.top < vh;          
    const hr = heroEl.getBoundingClientRect();
    const inHero = hr.bottom > vh * 0.4;
    
    hero.setDim(inHero ? 0.95 : 0.5);
    if (playOn) play.render();
    else hero.render(time);
  }
  requestAnimationFrame(raf);
}


window.addEventListener('load', () => { measureWork(); measureMarquee(); });
window.addEventListener('resize', measureMarquee);
boot();
runTitleLoop();
requestAnimationFrame(raf);
