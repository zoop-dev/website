import './styles/main.css';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import HeroManager from './webgl/HeroManager.js';
import Fluid from './webgl/Fluid.js';
import { defaultConfig, normalizeConfig } from './config.default.js';
import { sound } from './sound.js';
import { notify } from './notify.js';
import { transition } from './lib/transition.js';
import { magnetic, tilt } from './lib/interactions.js';
import { liquidType } from './lib/liquid.js';
import { mountScene, mountBehind } from './lib/anima-scene.js';
import { quality } from './lib/quality.js';
import { hexToRgba } from './lib/motion.js';

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

const cueEl = document.getElementById('scroll-cue');
const sbWrap = document.getElementById('scrollbar');
let sbIdle = 0;

const spineEl = document.getElementById('spine');
const spineFill = document.getElementById('spine-fill');
const spineComet = document.getElementById('spine-comet');
const spinePct = document.getElementById('spine-pct');
const SPINE_SECTIONS = [
  { id: 'work', n: '01', label: 'Work' },
  { id: 'about', n: '02', label: 'About' },
  { id: 'play', n: '03', label: 'Play' },
  { id: 'contact', n: '04', label: "Let's talk" },
];
let spineNodes = [];
function buildSpine() {
  if (!spineEl) return;
  spineNodes = SPINE_SECTIONS.map((s) => {
    const el = document.getElementById(s.id);
    const btn = document.createElement('button');
    btn.className = 'spine__node';
    btn.innerHTML = `<span class="spine__label"><i>${s.n}</i> ${s.label}</span><span class="spine__dot"></span>`;
    btn.addEventListener('click', () => { if (el) lenis.scrollTo(el, { duration: 1.2 }); });
    spineEl.appendChild(btn);
    return { el, btn, dot: btn.querySelector('.spine__dot'), frac: 0 };
  });
  measureSpine();
}
function measureSpine() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  spineNodes.forEach((nd) => {
    if (!nd.el) return;
    const top = nd.el.getBoundingClientRect().top + window.scrollY;
    nd.frac = Math.min(1, Math.max(0, top / maxScroll));
    nd.btn.style.top = `${nd.frac * 100}%`;
  });
}
const ABSORB = 0.03;   
function updateScrollCue(p) {
  if (cueEl) cueEl.classList.toggle('is-scrolling', p > 0.005);
  if (sbWrap) { sbWrap.classList.add('is-active'); clearTimeout(sbIdle); sbIdle = setTimeout(() => sbWrap.classList.remove('is-active'), 900); }
  if (!spineEl) return;

  
  let nearest = -1, nd = 1;
  spineNodes.forEach((n, i) => { const d = Math.abs(p - n.frac); if (d < nd) { nd = d; nearest = i; } });
  const absorb = nearest >= 0 ? Math.max(0, 1 - nd / ABSORB) : 0;

  
  spineFill.style.transform = `scaleY(${p.toFixed(3)})`;
  spineComet.style.top = `${(p * 100).toFixed(2)}%`;
  spineComet.style.transform = `translate(50%,-50%) scale(${(1 - absorb * 0.92).toFixed(3)})`;
  spineComet.style.opacity = (1 - absorb).toFixed(3);

  
  spinePct.textContent = `${Math.round(p * 100)}%`;
  spinePct.style.top = `${(p * 100).toFixed(2)}%`;
  spinePct.style.opacity = (p > 0.005 ? (1 - absorb) : 0).toFixed(3);

  
  let active = -1;
  spineNodes.forEach((n, i) => { if (p >= n.frac - 0.01) active = i; });
  spineNodes.forEach((n, i) => {
    n.btn.classList.toggle('is-active', i === active);
    const a = i === nearest ? absorb : 0;                  
    n.dot.style.transform = `translate(50%,-50%) scale(${(1 + a * 1.8).toFixed(3)})`;
    n.dot.style.boxShadow = a > 0.02 ? `0 0 ${(6 + a * 24).toFixed(0)}px var(--accent)` : '';
  });
}


const scenes = [];
const registerScene = (inst) => { if (inst) scenes.push(inst); return inst; };


function buildScrollArrow() {
  const host = document.querySelector('.hero__scroll i');
  if (!host) return;
  const c = document.createElement('canvas');
  Object.assign(c.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
  host.appendChild(c);
  registerScene(mountScene(c, {
    spring: { stiff: 80, damp: 18 },
    nodes: [
      { type: 'line', color: 'rgba(236,235,230,0.22)', x: 'w*0.5', y: 'h*0.08', x2: 'w*0.5', y2: 'h*0.92', width: 1 },
      { type: 'dot', color: '@accent', x: 'w*0.5', y: 'h*0.08 + ((t*0.55)%1)*h*0.84', r: 2.4, glow: 9, alpha: '(1-((t*0.55)%1))*0.85 + 0.12' },
    ],
  }));
}


const IGNITE_SCENE = {
  spring: { stiff: 120, damp: 18 },
  nodes: [
    { type: 'dot', color: '@accent', alpha: 'hover*0.26', r: 'min(w,h)*0.55', glow: 'hover*28' },
    { type: 'ring', color: '@accent', r: 'min(w,h)*0.46*(0.82+hover*0.22)', width: '1+hover', alpha: 'hover*0.7', glow: 'hover*10' },
    { type: 'dot', repeat: 10, color: '@accent', r: 'hover*1.5', alpha: 'hover*0.9', glow: 'hover*8',
      x: 'w*0.5 + cos(i/10*TAU + t*1.2)*(min(w,h)*0.55)*(0.7+hover*0.35)',
      y: 'h*0.5 + sin(i/10*TAU + t*1.2)*(min(w,h)*0.42)*(0.7+hover*0.35)' },
  ],
};
let ignitesMounted = false;
function mountIgnites() {
  if (ignitesMounted) return;
  ignitesMounted = true;
  document.querySelectorAll('.contact__mail, .nav__cta, .menu__cta, .contact__socials a').forEach((el) => {
    registerScene(mountBehind(el, IGNITE_SCENE));
  });
}

function onScroll() {
  const hRect = heroEl.getBoundingClientRect();
  hero.setScroll(Math.min(1, Math.max(0, -hRect.top / (window.innerHeight * 0.9))));
  
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const p = Math.min(1, Math.max(0, window.scrollY / max));
  hero.setProgress(p);
  hero.setOffset(Math.sin(p * Math.PI * 2) * 0.42, Math.cos(p * Math.PI * 1.6) * 0.12);
  updateScrollCue(p);

  
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
  document.body.classList.remove('menu-open');
  if (pageOpen) closeProjects();
  if (id === '#' || id === '#top') { lenis.scrollTo(0, { duration: 1.2 }); return; }
  const el = document.querySelector(id);
  if (el) lenis.scrollTo(el, { duration: 1.2 });
});


const burgerEl = document.getElementById('burger');
const menuOverlay = document.getElementById('menu');
function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  burgerEl?.setAttribute('aria-expanded', String(open));
  menuOverlay?.setAttribute('aria-hidden', String(!open));
  if (open) sound.whoosh();
}
burgerEl?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
document.getElementById('menu-close')?.addEventListener('click', () => setMenu(false));
window.addEventListener('resize', () => { if (window.innerWidth > 640) document.body.classList.remove('menu-open'); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.body.classList.remove('menu-open'); });


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


let lastActivity = performance.now();
let energy = 1, excitement = 0, titleAsleep = false, moodPrev = performance.now();

window.addEventListener('pointermove', (e) => {
  pointer.x = e.clientX; pointer.y = e.clientY;
  pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.ny = -((e.clientY / window.innerHeight) * 2 - 1);
  lastActivity = performance.now();
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
    sound.water(Math.min(1, Math.hypot(dx, dy) * 18));   
    prevPlay.x = x; prevPlay.y = y; prevPlay.set = true;
  }
});
window.addEventListener('pointerdown', (e) => {
  dragging = true;
  lastActivity = performance.now();
  excitement = Math.min(0.5, excitement + 0.22);
  gsap.to(hero.uniforms.uPress, { value: 1, duration: 0.4, ease: 'power2.out' });
  
  const tgt = e.target;
  if (!(tgt instanceof Element && tgt.closest('a, button, input, textarea, select, .ctx, .menu__close, .scrollbar__thumb'))) boop();
});
window.addEventListener('pointerup', () => {
  dragging = false;
  gsap.to(hero.uniforms.uPress, { value: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
});
playEl.addEventListener('pointerenter', () => { overPlay = true; prevPlay.set = false; });
playEl.addEventListener('pointerleave', () => { overPlay = false; prevPlay.set = false; });


const boopsEl = document.getElementById('boops');
const boopsNum = document.getElementById('boops-n');
const boopsPill = boopsEl && boopsEl.querySelector('.boops__pill');
let boopCount = 0, pendingBoops = 0, lastBoopAt = 0, sessionBoops = 0;
function showBoops() { if (boopsNum) boopsNum.textContent = boopCount.toLocaleString('en-US'); boopsEl && boopsEl.classList.add('is-on'); }
function boop() {
  const now = performance.now();
  if (now - lastBoopAt < 70) return;     
  lastBoopAt = now;
  if (pendingBoops >= 40) return;        
  boopCount += 1; pendingBoops += 1; sessionBoops += 1;
  showBoops();
  sound.boop();
  if ([10, 25, 50, 100].includes(sessionBoops)) notify.push(`${sessionBoops} boops this visit — the blob is delighted`, { title: 'boop!', once: `boop${sessionBoops}` });
  if (boopsPill) gsap.fromTo(boopsPill, { scale: 1.2 }, { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.5)' });
}
async function flushBoops() {
  if (pendingBoops <= 0) return;
  const n = pendingBoops; pendingBoops = 0;
  try {
    const r = await fetch('/api/boop', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ n }) });
    if (r.ok) { boopCount = (await r.json()).count; showBoops(); }
  } catch { pendingBoops += n; }   
}
setInterval(flushBoops, 4000);     
window.addEventListener('pagehide', () => {
  if (pendingBoops > 0) navigator.sendBeacon?.('/api/boop', JSON.stringify({ n: pendingBoops }));
});
fetch('/api/boop').then((r) => (r.ok ? r.json() : null)).then((j) => { if (j) { boopCount = j.count; showBoops(); } }).catch(() => {});


function syncSoundUI() { document.querySelectorAll('.js-sound-toggle').forEach((el) => el.setAttribute('aria-pressed', String(sound.enabled))); }
function syncNotifyUI() {
  const on = notify.on, state = on ? 'on' : (notify.permission === 'default' ? 'mid' : 'off');
  document.querySelectorAll('.js-notify-toggle').forEach((el) => { el.setAttribute('aria-pressed', String(on)); el.dataset.state = state; });
}
function toggleSound() { sound.setEnabled(!sound.enabled); if (sound.enabled) sound.boop(); syncSoundUI(); }
async function toggleNotify() {
  if (notify.permission === 'denied') { toast("notifs are blocked — turn em back on in browser settings"); syncNotifyUI(); return; }
  if (notify.on) notify.disable();
  else {
    const perm = await notify.enable();
    if (perm === 'denied') toast("you said no to notifs — change it in browser settings");
    else if (perm === 'unsupported') toast("your browser cant do notifs smh");
    else if (perm === 'granted') notify.push('cool, the blob will nudge you now and then', { title: 'notifs on', once: 'welcome' });
  }
  syncNotifyUI();
}
document.addEventListener('click', (e) => {
  if (e.target.closest('.js-sound-toggle')) toggleSound();
  else if (e.target.closest('.js-notify-toggle')) toggleNotify();
});
syncSoundUI(); syncNotifyUI();


const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
settingsBtn && settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = settingsPanel.classList.toggle('is-open');
  settingsBtn.setAttribute('aria-expanded', String(open));
  sound.tick();
});
document.addEventListener('click', (e) => {
  if (settingsPanel && settingsPanel.classList.contains('is-open') && !settingsPanel.contains(e.target) && !(settingsBtn && settingsBtn.contains(e.target))) {
    settingsPanel.classList.remove('is-open'); settingsBtn && settingsBtn.setAttribute('aria-expanded', 'false');
  }
});


let awayTimer;
document.addEventListener('visibilitychange', () => {
  clearTimeout(awayTimer);
  if (document.hidden) awayTimer = setTimeout(() => notify.push('come back — the blob is lonely', { minGap: 90000 }), 35000);
});


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


const MAGNETIC = '.nav__cta, .menu__cta, .contact__mail, .contact__socials a, .panel--more-btn, .projects-page__close, .menu__close, .loader__retry, .hero__scroll';

const bindMagnetic = (root = document) =>
  magnetic(root, { gsap, selector: MAGNETIC, strength: 0.32, onEnter: () => sound.tick() });
const bindTilt = (el) => tilt(el);


let siteConfig = normalizeConfig(defaultConfig);

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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
const stackChips = (stack) => String(stack || '').split(',').map((s) => s.trim()).filter(Boolean)
  .map((s) => `<span class="chip">${esc(s)}</span>`).join('');

function makePanel(pr, n) {
  const a = document.createElement('article');
  a.className = 'panel';
  a.dataset.cursor = 'view';
  a.style.setProperty('--panel-glow', hexToRgba(pr.accent || siteConfig.accent, 0.16));
  a.innerHTML = `<div class="panel__top"><span class="panel__idx">${String(n).padStart(2, '0')}</span><span class="panel__year">${esc(pr.year)}</span></div>`
    + `<div class="panel__body"><h3 class="panel__name">${esc(pr.name)}</h3>`
    + `<p class="panel__tag">${esc(pr.tag)}</p>`
    + (pr.description ? `<p class="panel__desc">${esc(pr.description)}</p>` : '')
    + `<div class="chips">${stackChips(pr.stack)}</div></div>`
    + `<span class="panel__view">View case</span><span class="glare"></span>`;
  if (pr.url && pr.url !== '#') a.addEventListener('click', () => window.open(pr.url, '_blank', 'noopener'));
  bindTilt(a);
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
let routing = false;   
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
      + (pr.description ? `<p class="pcard__desc">${esc(pr.description)}</p>` : '')
      + `<div class="chips">${stackChips(pr.stack)}</div></div><span class="glare"></span>`;
    if (pr.url && pr.url !== '#') c.addEventListener('click', () => window.open(pr.url, '_blank', 'noopener'));
    bindTilt(c);
    grid.appendChild(c);
  });
  bindCursor(grid);
}
function openProjects(push = true) {
  if (pageOpen || transition.active) return;
  pageOpen = true;
  routing = true;
  sound.whoosh();
  transition.setColors(siteConfig.accent);
  
  
  transition.run(() => {
    if (push && location.pathname !== '/projects') history.pushState({ projects: true }, '', '/projects');
    const page = document.getElementById('projects-page');
    buildProjectsGrid(siteConfig.projects);
    lenis.stop();
    closeCtx();
    page.classList.add('is-open');
    page.setAttribute('aria-hidden', 'false');
    page.scrollTop = 0;
    page.getBoundingClientRect(); 
    routing = false;
    gsap.killTweensOf([page, '.projects-page__title', '.pcard']);
    gsap.set(page, { yPercent: 0, y: 0 });
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from('.projects-page__bar', { yPercent: -40, opacity: 0, duration: 0.6 }, 0)
      .from('.projects-page__title', { yPercent: 40, opacity: 0, duration: 0.8 }, 0.05)
      .from('.pcard', { yPercent: 24, opacity: 0, duration: 0.7, stagger: 0.045 }, 0.14);
  });
}
function closeProjects(push = true) {
  if (!pageOpen || transition.active) return;
  pageOpen = false;
  routing = true;
  sound.whoosh();
  transition.setColors(siteConfig.accent);
  transition.run(() => {
    if (push && location.pathname === '/projects') history.pushState({}, '', '/');
    const page = document.getElementById('projects-page');
    gsap.killTweensOf(page);
    page.classList.remove('is-open');
    page.setAttribute('aria-hidden', 'true');
    lenis.start();
    routing = false;   
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
  
  const navLinksHtml = config.nav.links.map((l) => `<a href="${esc(l.href)}" data-cursor="zoom">${esc(l.label)}</a>`).join('');
  const navWrap = document.querySelector('.nav__links');
  if (navWrap) {
    navWrap.innerHTML = navLinksHtml + `<a href="#contact" class="nav__cta" data-cursor="zoom">${esc(config.nav.cta)}</a>`;
    bindCursor(navWrap);
  }
  const menuWrap = document.getElementById('menu-links');
  if (menuWrap) {
    menuWrap.innerHTML = navLinksHtml + `<a href="#contact" class="menu__cta">${esc(config.nav.cta)}</a>`;
  }
  
  mountIgnites();
  scenes.forEach((s) => s.setAccent(config.accent));
  
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
  
  const ob = config.onboarding;
  setText('.onboard__hi', ob.hi);
  const obTitle = document.querySelector('.onboard__title');
  if (obTitle) obTitle.innerHTML = `${esc(ob.title)}<span>${esc(ob.em)}</span>`;
  setText('.onboard__sub', ob.sub);
  setText('.onboard__enter', ob.enter);
  document.querySelectorAll('.js-sound-toggle .opt__txt b').forEach((e) => { e.textContent = ob.soundLabel; });
  document.querySelectorAll('.js-sound-toggle .opt__txt i').forEach((e) => { e.textContent = ob.soundDesc; });
  document.querySelectorAll('.js-notify-toggle .opt__txt b').forEach((e) => { e.textContent = ob.notifLabel; });
  document.querySelectorAll('.js-notify-toggle .opt__txt i').forEach((e) => { e.textContent = ob.notifDesc; });

  renderMarquee(config.marquee);
  renderProjects(config.projects);
  bindMagnetic();
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

  
  const clipIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      clipIO.unobserve(el);
      if (reduced) { el.style.clipPath = 'none'; return; }
      const o = { p: 0 };
      gsap.to(o, { p: 1, duration: 1.1, ease: 'power4.out',
        onUpdate: () => { el.style.clipPath = `polygon(0 0, ${o.p * 120}% 0, ${o.p * 100}% 100%, 0 100%)`; },
        onComplete: () => { el.style.clipPath = 'none'; } });
    });
  }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('.clip-reveal').forEach((el) => clipIO.observe(el));

  
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
window.addEventListener('pointerdown', (e) => { if (e.target instanceof Node && !ctx.contains(e.target)) closeCtx(); });
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
const setTitle = (s) => { if (titleHidden || titleAsleep) return; document.title = s && s.length ? s : ' '; };

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


let covering = false;
function coverThenReload() {
  if (covering) return;
  covering = true;
  loaderEl.style.display = 'flex';
  loaderEl.dataset.done = '';
  loaderStatus('');
  gsap.killTweensOf(loaderEl);
  gsap.fromTo(loaderEl, { yPercent: -100 }, { yPercent: 0, duration: 0.6, ease: 'expo.inOut', onComplete: () => location.reload() });
}
loaderRetry.addEventListener('click', coverThenReload);

window.addEventListener('keydown', (e) => {
  const reload = e.key === 'F5' || ((e.key === 'r' || e.key === 'R') && (e.metaKey || e.ctrlKey) && !e.shiftKey);
  if (reload && revealed && !covering) { e.preventDefault(); coverThenReload(); }
});

function revealSite() {
  if (revealed || bootFailed) return;
  revealed = true;
  sound.reveal();
  gsap.to(hero.uniforms.uReveal, { value: 1, duration: 1.6, ease: 'power2.out' });
  gsap.to(loaderEl, { yPercent: -100, duration: 1.1, ease: 'expo.inOut', onComplete: () => { loaderEl.style.display = 'none'; } });
  gsap.set('.hero__title [data-reveal-y]', { yPercent: 110, y: 0 });
  gsap.to('.hero__title [data-reveal-y]', { yPercent: 0, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.09, delay: 0.3 });
  gsap.to('.hero__sub, .hero__meta span, .hero__scroll', { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.05, delay: 0.7 });
  if (cueEl) gsap.delayedCall(1.1, () => cueEl.classList.add('is-on'));
  if (spineEl) gsap.delayedCall(1.2, () => { measureSpine(); spineEl.classList.add('is-on'); });
}


const firstVisit = !lite && (() => { try { return !localStorage.getItem('zoop-onboarded'); } catch { return false; } })();
function showOnboard() {
  const ob = document.getElementById('onboard');
  if (!ob) { revealSite(); return; }
  ob.classList.add('is-open'); ob.setAttribute('aria-hidden', 'false');
  syncSoundUI(); syncNotifyUI();                 
  gsap.to(loaderEl, { yPercent: -100, duration: 1.0, ease: 'expo.inOut', onComplete: () => { loaderEl.style.display = 'none'; } });

  gsap.set('.onboard__card', { transformPerspective: 900 });
  const tl = gsap.timeline({ delay: 0.3 });
  tl.from('.onboard__card', { yPercent: 8, opacity: 0, scale: 0.92, rotateX: -10, duration: 0.95, ease: 'expo.out' })
    .from('.onboard__hi', { y: 16, opacity: 0, duration: 0.5, ease: 'expo.out' }, '-=0.45')
    .from('.onboard__title', { yPercent: 30, opacity: 0, duration: 0.7, ease: 'expo.out' }, '-=0.3')
    .from('.onboard__title span', { scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(2.5)' }, '-=0.25')
    .from('.onboard__sub', { y: 14, opacity: 0, duration: 0.5, ease: 'expo.out' }, '-=0.35')
    .from('.onboard .opt', { x: -28, opacity: 0, duration: 0.6, stagger: 0.13, ease: 'expo.out' }, '-=0.2')
    .from('.onboard__enter', { y: 18, opacity: 0, duration: 0.55, ease: 'expo.out' }, '-=0.15')
    .to('.onboard__enter', { boxShadow: '0 14px 44px rgba(43,184,255,.45)', repeat: -1, yoyo: true, duration: 1.3, ease: 'sine.inOut' }, '-=0.05');

  document.getElementById('onboard-enter').addEventListener('click', () => {
    try { localStorage.setItem('zoop-onboarded', '1'); } catch {}
    sound.whoosh();
    gsap.to('.onboard__card', { yPercent: -6, opacity: 0, scale: 0.96, duration: 0.5, ease: 'power2.in' });
    gsap.to(ob, { opacity: 0, duration: 0.6, ease: 'power2.inOut', delay: 0.1, onComplete: () => { ob.classList.remove('is-open'); ob.style.display = 'none'; } });
    revealSite();
    if (isProjectsPath()) openProjects(false);
  });
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
    onComplete: () => {
      if (firstVisit) { showOnboard(); return; }
      revealSite(); if (isProjectsPath()) openProjects(false);
    } });
}


window.addEventListener('resize', () => { hero.resize(); play.resize(); measureWork(); measureSpine(); });

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
  
  const moodNow = performance.now();
  const moodDt = Math.min(100, moodNow - moodPrev); moodPrev = moodNow;
  const idleS = (moodNow - lastActivity) / 1000;
  energy += ((idleS > 9 ? 0.14 : 1) - energy) * (1 - Math.exp(-moodDt / 350));
  excitement *= Math.exp(-moodDt / 700);
  hero.setEnergy(Math.min(1.5, energy + excitement));
  const sleepy = energy < 0.28;
  if (sleepy !== titleAsleep) { titleAsleep = sleepy; if (sleepy && !document.hidden) document.title = '💤 zzz…'; }

  
  
  if (!hidden && revealed && !routing && !pageOpen) {
    
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


window.addEventListener('load', () => { measureWork(); measureMarquee(); measureSpine(); });
window.addEventListener('resize', measureMarquee);
boot();
buildSpine();
buildScrollArrow();
runTitleLoop();

if (quality.liquid) liquidType('.hero__title, .contact__title, .work__title', () => lenis.velocity);

quality.onDowngrade(() => hero.setQualityScale(0.7));
quality.watchFPS(() => !hidden && revealed && !routing && !pageOpen);
requestAnimationFrame(raf);
