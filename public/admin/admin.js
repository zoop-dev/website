


const DEFAULTS = {
  accent: '#2bb8ff',
  email: 'hi@zachy.cc',
  heroStyle: 'glass',
  meta: { title: 'zoop — interactive developer & designer', description: 'zoop makes interactive, real-time websites. Sometimes weird, always fast.' },
  nav: { cta: "Let's talk", links: [{ label: 'Work', href: '#work' }, { label: 'About', href: '#about' }, { label: 'Play', href: '#play' }] },
  title: { enabled: true, interludes: true, phrases: ['zoop', 'I make weird websites', 'go on, poke the blob', 'caffeine & shaders', 'real-time everything', 'still here, btw', '{email}'] },
  hero: { metaL: ['Independent', 'Professional tinkerer'], metaR: ['Est. whenever', 'Mostly caffeine'], line1: 'I make', em: 'weird', line3: 'websites.', sub: 'The kind that go *woosh*, *bloop*, and occasionally *whoa*. Real-time, interactive, and running on way too many shaders.' },
  marquee: ['WebGL', 'Shaders', 'Three.js', 'Motion', 'Creative Dev'],
  work: { title: 'Selected Work', hint: 'Scroll →' },
  github: { barText: "Peek at what I'm building", barCta: 'Open source →' },
  about: {
    lead: "I'm zoop. I got way too into making pixels move, so now I build fast, interactive websites with way too many shaders.",
    columns: [
      { title: 'Things I do', items: ['WebGL / GLSL', 'Three.js / R3F', 'Creative direction', 'Motion design', 'Aggressive console.logging'] },
      { title: 'Bragging rights', items: ['Awwwards · SOTD', 'FWA of the Day', 'CSS Design Awards', 'Mom-approved ✓'] },
      { title: 'The vibe', text: 'Every pixel intentional, every frame at 60fps, every animation slightly unnecessary. I treat the browser as a playground and performance as a personality trait.' },
    ],
  },
  stats: [
    { value: 12, label: 'Shipped experiences', format: 'plain' },
    { value: 60, label: 'Frames per second, always', format: 'plain' },
    { value: 4200000, label: 'Pixels pushed (give or take)', format: 'compact' },
    { value: '∞', label: 'Cups of coffee', format: 'none' },
  ],
  play: { heading: 'Move\nyour cursor.', copy: 'A real-time ink simulation that reacts to your every move. Drag to shove the fluid around and watch it swirl, curl and dissolve. Weirdly satisfying.' },
  contact: { line1: "Let's make", em: 'something', line3: 'together.' },
  footer: { left: '© 2026 zoop · made with caffeine & shaders', mid: 'No designers were harmed' },
  onboarding: { hi: 'welcome to', title: 'zoop', em: '.', sub: 'a couple optional extras. you can change em anytime up top.', soundLabel: 'sound', soundDesc: 'blips, bloops & flowing water', notifLabel: 'notifs', notifDesc: 'the occasional friendly nudge', enter: 'enter →' },
  projectsPage: { title: "Everything\nI've made." },
  changelogPage: { title: "Changelog.", buttonText: "Changelog →" },
  scriptsPage: { title: "scripts &\nlil tools." },
  scripts: [
    { id: 'backly', name: 'backly', tag: 'code backup CLI', lang: 'JavaScript', description: 'A tiny zero-dependency code backup CLI.', install: 'npx backly add .', url: '#', src: '/scripts/backly.js', pinned: true },
  ],
  cards: {
    github: { title: 'Open source', sub: 'my repos, pulled live.', pill: 'open source', word: 'GITHUB', color: '#2bb8ff' },
    scripts: { title: 'Scripts & tools', sub: 'little CLIs i made, free to grab.', pill: 'cli & tools', word: 'SCRIPTS', color: '#7a5cff' },
  },
  socials: [
    { label: 'Twitter / X', url: '#' }, { label: 'GitHub', url: '#' }, { label: 'Dribbble', url: '#' }, { label: 'LinkedIn', url: '#' },
  ],
  projects: [
    { id: 'aurora', name: 'Aurora Engine', tag: 'Real-time GPU fluid', year: '2026', stack: 'WebGL · GLSL', accent: '#2bb8ff', url: '#', pinned: true },
    { id: 'monolith', name: 'Monolith', tag: 'Immersive brand site', year: '2025', stack: 'Three.js · GSAP', accent: '#7a5cff', url: '#', pinned: true },
    { id: 'drift', name: 'Drift / OS', tag: '3D product configurator', year: '2025', stack: 'R3F · Blender', accent: '#2bd8ff', url: '#', pinned: true },
  ],
  changelog: [
    { date: '2026-06-24', version: 'v1.2.0', title: 'WebMCP & llms.txt Support', isRelease: true, text: 'Added browser-native WebMCP agent tool registrations (boop_blob, trigger_chaos, barrel_roll, splash_fluid, get_portfolio_info) and launched the /llms.txt discovery endpoint.' },
    { date: '2026-06-24', version: 'v1.1.0', title: 'Skeleton Screens Loader', isRelease: false, text: 'Implemented animated, glowing skeleton card elements during the initial boot and configuration warming phase.' },
    { date: '2026-06-16', version: 'v1.0.0', title: 'Creative WebGL Refresh', isRelease: true, text: 'Complete redesign featuring a Three.js Glass centerpiece with procedural dispersion, pointer-responsive liquid ink simulation, customizable theme accents, and a cookie-authenticated administration panel.' }
  ],
};

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const attr = (s) => esc(s).replace(/"/g, '&quot;');
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'project';
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

function deepMerge(base, over) {
  if (!isObj(base)) return over;
  if (!isObj(over)) return base;
  const out = { ...base };
  for (const k of Object.keys(over)) out[k] = isObj(base[k]) && isObj(over[k]) ? deepMerge(base[k], over[k]) : over[k];
  return out;
}
function pathSet(obj, path, val) {
  const ks = path.split('.'); let o = obj;
  for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = {}; o = o[ks[i]]; }
  o[ks[ks.length - 1]] = val;
}

let cfg = structuredClone(DEFAULTS);


async function checkAuth() {
  try { const r = await fetch('/api/me'); const j = await r.json(); return !!j.authed; } catch { return false; }
}
$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#login-err'); err.textContent = '';
  try {
    const r = await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: $('#pw').value }) });
    if (r.ok) { showEditor(); }
    else { err.textContent = r.status === 500 ? 'Server not configured (set ADMIN_PASSWORD).' : 'Wrong password.'; }
  } catch { err.textContent = 'Network error.'; }
});
$('#logout').addEventListener('click', async () => { await fetch('/api/logout', { method: 'POST' }); location.reload(); });


async function showEditor() {
  $('#login').classList.add('hidden');
  $('#editor').classList.remove('hidden');
  $('#savebar').classList.remove('hidden');
  try {
    const r = await fetch('/api/config');
    const stored = r.ok ? await r.json() : {};
    cfg = deepMerge(structuredClone(DEFAULTS), stored && typeof stored === 'object' ? stored : {});
  } catch { cfg = structuredClone(DEFAULTS); }
  buildForm();
}

function buildForm() {
  const c = cfg;
  $('#cfg').innerHTML = `
    <h2>Brand</h2>
    <div class="row two">
      <div class="field"><label>Accent colour</label><div class="accentrow"><input type="color" id="accent-color" value="${attr(c.accent)}"><input type="text" data-path="accent" id="accent-text" value="${attr(c.accent)}"></div></div>
      <div class="field"><label>Contact email</label><input type="text" data-path="email" value="${attr(c.email)}"></div>
    </div>
    <div class="row two">
      <div class="field"><label>Browser tab title</label><input type="text" data-path="meta.title" value="${attr(c.meta.title)}"></div>
      <div class="field"><label>Nav button label</label><input type="text" data-path="nav.cta" value="${attr(c.nav.cta)}"></div>
    </div>
    <div class="field"><label>Hero centerpiece</label><select data-path="heroStyle">
      <option value="glass" ${c.heroStyle !== 'blob' ? 'selected' : ''}>Glass mesh (refractive)</option>
      <option value="blob" ${c.heroStyle === 'blob' ? 'selected' : ''}>Blob (raymarched)</option>
    </select></div>
    <label>Nav links</label>
    <div class="hint">Target is a section id like <code>#work</code>. The "Let's talk" button uses the label above.</div>
    <div id="list-nav"></div><button class="add" type="button" data-add="nav">+ link</button>
    <div class="field"><label>Meta description (SEO)</label><textarea data-path="meta.description">${esc(c.meta.description)}</textarea></div>

    <h2>Hero</h2>
    <div class="row two">
      <div class="field"><label>Top-left · line 1</label><input type="text" data-path="hero.metaL.0" value="${attr(c.hero.metaL[0])}"></div>
      <div class="field"><label>Top-left · line 2</label><input type="text" data-path="hero.metaL.1" value="${attr(c.hero.metaL[1])}"></div>
    </div>
    <div class="row two">
      <div class="field"><label>Top-right · line 1</label><input type="text" data-path="hero.metaR.0" value="${attr(c.hero.metaR[0])}"></div>
      <div class="field"><label>Top-right · line 2</label><input type="text" data-path="hero.metaR.1" value="${attr(c.hero.metaR[1])}"></div>
    </div>
    <div class="row three">
      <div class="field"><label>Headline · line 1</label><input type="text" data-path="hero.line1" value="${attr(c.hero.line1)}"></div>
      <div class="field"><label>Line 2 (accented)</label><input type="text" data-path="hero.em" value="${attr(c.hero.em)}"></div>
      <div class="field"><label>Headline · line 3</label><input type="text" data-path="hero.line3" value="${attr(c.hero.line3)}"></div>
    </div>
    <div class="field"><label>Sub-headline</label><textarea data-path="hero.sub">${esc(c.hero.sub)}</textarea><div class="hint">Wrap words in *asterisks* to colour them with the accent.</div></div>

    <h2>Tab title</h2>
    <div class="hint">Cycles these in the browser tab with a random animation each time. Use <code>{email}</code> for your live email.</div>
    <div class="row two">
      <label class="pinrow"><input type="checkbox" data-path="title.enabled" ${c.title.enabled ? 'checked' : ''}> Animate the tab title</label>
      <label class="pinrow"><input type="checkbox" data-path="title.interludes" ${c.title.interludes ? 'checked' : ''}> Include winks (counter / pong / etc.)</label>
    </div>
    <div id="list-titlephrases"></div><button class="add" type="button" data-add="titlephrases">+ phrase</button>

    <h2>Marquee</h2>
    <div id="list-marquee"></div><button class="add" type="button" data-add="marquee">+ word</button>

    <h2>Work section</h2>
    <div class="row two">
      <div class="field"><label>Section title</label><input type="text" data-path="work.title" value="${attr(c.work.title)}"></div>
      <div class="field"><label>Scroll hint</label><input type="text" data-path="work.hint" value="${attr(c.work.hint)}"></div>
    </div>
    <div class="row two">
      <div class="field"><label>GitHub bar · text</label><input type="text" data-path="github.barText" value="${attr(c.github.barText)}"></div>
      <div class="field"><label>GitHub bar · button label</label><input type="text" data-path="github.barCta" value="${attr(c.github.barCta)}"></div>
    </div>
    <div class="hint">Full-width bar under Work that opens your /github page.</div>

    <h2>Projects</h2>
    <div class="hint">Pinned projects show on the home gallery. Everything appears on /projects.</div>
    <div id="list-projects"></div><button class="add" type="button" data-add="projects">+ project</button>

    <h2>About</h2>
    <div class="field"><label>Lead paragraph</label><textarea data-path="about.lead">${esc(c.about.lead)}</textarea></div>
    <label>Columns</label>
    <div id="list-columns"></div><button class="add" type="button" data-add="columns">+ column</button>

    <h2>Stats</h2>
    <div id="list-stats"></div><button class="add" type="button" data-add="stats">+ stat</button>

    <h2>Playground</h2>
    <div class="field"><label>Heading (use a new line for a line break)</label><textarea data-path="play.heading">${esc(c.play.heading)}</textarea></div>
    <div class="field"><label>Copy</label><textarea data-path="play.copy">${esc(c.play.copy)}</textarea></div>

    <h2>Contact</h2>
    <div class="row three">
      <div class="field"><label>Line 1</label><input type="text" data-path="contact.line1" value="${attr(c.contact.line1)}"></div>
      <div class="field"><label>Line 2 (accented)</label><input type="text" data-path="contact.em" value="${attr(c.contact.em)}"></div>
      <div class="field"><label>Line 3</label><input type="text" data-path="contact.line3" value="${attr(c.contact.line3)}"></div>
    </div>
    <label>Socials</label>
    <div id="list-socials"></div><button class="add" type="button" data-add="socials">+ social</button>

    <h2>Footer</h2>
    <div class="row two">
      <div class="field"><label>Left text</label><input type="text" data-path="footer.left" value="${attr(c.footer.left)}"></div>
      <div class="field"><label>Middle text</label><input type="text" data-path="footer.mid" value="${attr(c.footer.mid)}"></div>
    </div>

    <h2>Projects page</h2>
    <div class="field"><label>Title (new line = line break)</label><textarea data-path="projectsPage.title">${esc(c.projectsPage.title)}</textarea></div>

    <h2>Changelog page</h2>
    <div class="row two">
      <div class="field"><label>Title (new line = line break)</label><textarea data-path="changelogPage.title">${esc(c.changelogPage.title || 'Changelog.')}</textarea></div>
      <div class="field"><label>Button label (below email)</label><input type="text" data-path="changelogPage.buttonText" value="${attr(c.changelogPage.buttonText || 'Changelog →')}"></div>
    </div>

    <h2>Changelog entries</h2>
    <div class="hint">Changelog entries displayed on the /changelog page.</div>
    <div id="list-changelog"></div><button class="add" type="button" data-add="changelog">+ changelog entry</button>

    <h2>Scripts page</h2>
    <div class="field"><label>Title (new line = line break)</label><textarea data-path="scriptsPage.title">${esc(c.scriptsPage?.title || 'scripts &\nlil tools.')}</textarea></div>

    <h2>Scripts &amp; tools</h2>
    <div class="hint">Shown on /scripts. Put the source file in <code>public/scripts/</code> and point "Source path" at it (e.g. <code>/scripts/backly.js</code>).</div>
    <div id="list-scripts"></div><button class="add" type="button" data-add="scripts">+ script</button>

    <h2>Home cards (under Work)</h2>
    <div class="hint">The two expanding panels → /github and /scripts.</div>
    <div class="card">
      <div class="row two">
        <div class="field"><label>GitHub · title</label><input type="text" data-path="cards.github.title" value="${attr(c.cards?.github?.title || 'Open source')}"></div>
        <div class="field"><label>GitHub · subtitle</label><input type="text" data-path="cards.github.sub" value="${attr(c.cards?.github?.sub || '')}"></div>
      </div>
      <div class="row three">
        <div class="field"><label>Pill</label><input type="text" data-path="cards.github.pill" value="${attr(c.cards?.github?.pill || '')}"></div>
        <div class="field"><label>Watermark word</label><input type="text" data-path="cards.github.word" value="${attr(c.cards?.github?.word || 'GITHUB')}"></div>
        <div class="field"><label>Color</label><input type="color" data-path="cards.github.color" value="${attr(c.cards?.github?.color || '#2bb8ff')}"></div>
      </div>
    </div>
    <div class="card">
      <div class="row two">
        <div class="field"><label>Scripts · title</label><input type="text" data-path="cards.scripts.title" value="${attr(c.cards?.scripts?.title || 'Scripts & tools')}"></div>
        <div class="field"><label>Scripts · subtitle</label><input type="text" data-path="cards.scripts.sub" value="${attr(c.cards?.scripts?.sub || '')}"></div>
      </div>
      <div class="row three">
        <div class="field"><label>Pill</label><input type="text" data-path="cards.scripts.pill" value="${attr(c.cards?.scripts?.pill || '')}"></div>
        <div class="field"><label>Watermark word</label><input type="text" data-path="cards.scripts.word" value="${attr(c.cards?.scripts?.word || 'SCRIPTS')}"></div>
        <div class="field"><label>Color</label><input type="color" data-path="cards.scripts.color" value="${attr(c.cards?.scripts?.color || '#7a5cff')}"></div>
      </div>
    </div>

    <h2>Onboarding (first visit)</h2>
    <div class="row three">
      <div class="field"><label>Greeting</label><input type="text" data-path="onboarding.hi" value="${attr(c.onboarding.hi)}"></div>
      <div class="field"><label>Title</label><input type="text" data-path="onboarding.title" value="${attr(c.onboarding.title)}"></div>
      <div class="field"><label>Accent bit</label><input type="text" data-path="onboarding.em" value="${attr(c.onboarding.em)}"></div>
    </div>
    <div class="field"><label>Sub-text</label><input type="text" data-path="onboarding.sub" value="${attr(c.onboarding.sub)}"></div>
    <div class="row two">
      <div class="field"><label>Sound label</label><input type="text" data-path="onboarding.soundLabel" value="${attr(c.onboarding.soundLabel)}"></div>
      <div class="field"><label>Sound description</label><input type="text" data-path="onboarding.soundDesc" value="${attr(c.onboarding.soundDesc)}"></div>
    </div>
    <div class="row two">
      <div class="field"><label>Notifs label</label><input type="text" data-path="onboarding.notifLabel" value="${attr(c.onboarding.notifLabel)}"></div>
      <div class="field"><label>Notifs description</label><input type="text" data-path="onboarding.notifDesc" value="${attr(c.onboarding.notifDesc)}"></div>
    </div>
    <div class="field"><label>Enter button</label><input type="text" data-path="onboarding.enter" value="${attr(c.onboarding.enter)}"></div>
  `;
  renderNav(); renderTitlePhrases(); renderMarquee(); renderProjects(); renderColumns(); renderStats(); renderSocials(); renderChangelog(); renderScripts();
  
  const col = $('#accent-color'), txt = $('#accent-text');
  col.addEventListener('input', () => { txt.value = col.value; });
  txt.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(txt.value)) col.value = txt.value; });
  
  $('#cfg').querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => addRow(b.dataset.add)));
}


function del(btn) { btn.closest('.card, .field').remove(); }
function mountDel(card) { card.querySelector('.del').addEventListener('click', () => del(card.querySelector('.del'))); }
function mountOrd(card, cls) {
  card.querySelector('.up').addEventListener('click', () => {
    const prev = card.previousElementSibling;
    if (prev && prev.classList.contains(cls)) card.parentNode.insertBefore(card, prev);
  });
  card.querySelector('.down').addEventListener('click', () => {
    const next = card.nextElementSibling;
    if (next && next.classList.contains(cls)) card.parentNode.insertBefore(next, card);
  });
}

function renderMarquee() {
  const m = $('#list-marquee'); m.innerHTML = '';
  cfg.marquee.forEach((w) => m.appendChild(rowMarquee(w)));
}
function rowMarquee(w = '', cls = 'marquee-row') {
  const d = document.createElement('div'); d.className = `field ${cls}`; d.style.display = 'flex'; d.style.gap = '.5rem';
  d.innerHTML = `<input type="text" data-field="word" value="${attr(w)}" style="flex:1"><button class="del" type="button">✕</button>`;
  d.querySelector('.del').addEventListener('click', () => d.remove());
  return d;
}
function renderNav() {
  const m = $('#list-nav'); m.innerHTML = '';
  (cfg.nav.links || []).forEach((l) => m.appendChild(rowNav(l)));
}
function rowNav(l = {}) {
  const c = document.createElement('div'); c.className = 'card nav-row';
  c.innerHTML = `<button class="del" type="button">✕</button>
    <div class="row two">
      <div class="field"><label>Label</label><input type="text" data-field="label" value="${attr(l.label)}"></div>
      <div class="field"><label>Target (#id)</label><input type="text" data-field="href" value="${attr(l.href || '#')}"></div>
    </div>`;
  mountDel(c); return c;
}
function renderTitlePhrases() {
  const m = $('#list-titlephrases'); m.innerHTML = '';
  (cfg.title.phrases || []).forEach((w) => m.appendChild(rowMarquee(w, 'titlephrase-row')));
}
function renderProjects() {
  const m = $('#list-projects'); m.innerHTML = '';
  cfg.projects.forEach((p) => m.appendChild(rowProject(p)));
}
function rowProject(p = {}) {
  const c = document.createElement('div'); c.className = 'card project-row';
  c.innerHTML = `<button class="del" type="button">✕</button>
    <div class="ord">
      <button class="up" type="button">▲</button>
      <button class="down" type="button">▼</button>
    </div>
    <div class="row two">
      <div class="field"><label>Name</label><input type="text" data-field="name" value="${attr(p.name)}"></div>
      <div class="field"><label>Tag (short)</label><input type="text" data-field="tag" value="${attr(p.tag)}"></div>
    </div>
    <div class="field"><label>Description</label><textarea data-field="description">${esc(p.description)}</textarea></div>
    <div class="row three">
      <div class="field"><label>Year</label><input type="text" data-field="year" value="${attr(p.year)}"></div>
      <div class="field"><label>Stack (comma-separated)</label><input type="text" data-field="stack" value="${attr(p.stack)}" placeholder="WebGL, GLSL, TypeScript"></div>
      <div class="field"><label>Accent</label><input type="color" data-field="accent" value="${attr(p.accent || '#2bb8ff')}"></div>
    </div>
    <div class="row two" style="align-items:end">
      <div class="field" style="margin:0"><label>URL</label><input type="text" data-field="url" value="${attr(p.url || '#')}"></div>
      <label class="pinrow"><input type="checkbox" data-field="pinned" ${p.pinned ? 'checked' : ''}> Pinned (show on home)</label>
    </div>`;
  c.dataset.id = p.id || '';
  mountDel(c);
  mountOrd(c, 'project-row');
  return c;
}
function renderScripts() {
  const m = $('#list-scripts'); if (!m) return; m.innerHTML = '';
  (cfg.scripts || []).forEach((s) => m.appendChild(rowScript(s)));
}
function rowScript(s = {}) {
  const c = document.createElement('div'); c.className = 'card script-row';
  c.innerHTML = `<button class="del" type="button">✕</button>
    <div class="ord">
      <button class="up" type="button">▲</button>
      <button class="down" type="button">▼</button>
    </div>
    <div class="row three">
      <div class="field"><label>Name</label><input type="text" data-field="name" value="${attr(s.name)}"></div>
      <div class="field"><label>Tag (short)</label><input type="text" data-field="tag" value="${attr(s.tag)}"></div>
      <div class="field"><label>Language</label><input type="text" data-field="lang" value="${attr(s.lang)}" placeholder="JavaScript"></div>
    </div>
    <div class="field"><label>Description</label><textarea data-field="description">${esc(s.description)}</textarea></div>
    <div class="row two">
      <div class="field"><label>Install / run command</label><input type="text" data-field="install" value="${attr(s.install)}" placeholder="npx backly add ."></div>
      <div class="field"><label>Source path (in /public)</label><input type="text" data-field="src" value="${attr(s.src)}" placeholder="/scripts/backly.js"></div>
    </div>
    <div class="row two" style="align-items:end">
      <div class="field" style="margin:0"><label>Repo URL</label><input type="text" data-field="url" value="${attr(s.url || '#')}"></div>
      <label class="pinrow"><input type="checkbox" data-field="pinned" ${s.pinned ? 'checked' : ''}> Pinned</label>
    </div>`;
  c.dataset.id = s.id || '';
  mountDel(c);
  mountOrd(c, 'script-row');
  return c;
}
function renderColumns() {
  const m = $('#list-columns'); m.innerHTML = '';
  cfg.about.columns.forEach((col) => m.appendChild(rowColumn(col)));
}
function rowColumn(col = {}) {
  const isText = !Array.isArray(col.items);
  const c = document.createElement('div'); c.className = 'card column-row';
  c.innerHTML = `<button class="del" type="button">✕</button>
    <div class="field"><label>Column title</label><input type="text" data-field="title" value="${attr(col.title)}"></div>
    <div class="field"><label>Type</label><select data-field="type"><option value="list" ${isText ? '' : 'selected'}>List of items</option><option value="text" ${isText ? 'selected' : ''}>Paragraph</option></select></div>
    <div class="field"><label>Content (list = one item per line)</label><textarea data-field="body">${esc(isText ? (col.text || '') : (col.items || []).join('\n'))}</textarea></div>`;
  mountDel(c);
  return c;
}
function renderStats() {
  const m = $('#list-stats'); m.innerHTML = '';
  cfg.stats.forEach((s) => m.appendChild(rowStat(s)));
}
function rowStat(s = {}) {
  const c = document.createElement('div'); c.className = 'card stat-row';
  c.innerHTML = `<button class="del" type="button">✕</button>
    <div class="row three">
      <div class="field"><label>Value</label><input type="text" data-field="value" value="${attr(s.value)}"></div>
      <div class="field"><label>Label</label><input type="text" data-field="label" value="${attr(s.label)}"></div>
      <div class="field"><label>Format</label><select data-field="format">
        <option value="plain" ${s.format === 'plain' ? 'selected' : ''}>1,234 (count up)</option>
        <option value="compact" ${s.format === 'compact' ? 'selected' : ''}>1.2M (count up)</option>
        <option value="none" ${s.format === 'none' ? 'selected' : ''}>As typed (∞, etc.)</option>
      </select></div>
    </div>`;
  mountDel(c);
  return c;
}
function renderSocials() {
  const m = $('#list-socials'); m.innerHTML = '';
  cfg.socials.forEach((s) => m.appendChild(rowSocial(s)));
}
function rowSocial(s = {}) {
  const c = document.createElement('div'); c.className = 'card social-row';
  c.innerHTML = `<button class="del" type="button">✕</button>
    <div class="row two">
      <div class="field"><label>Label</label><input type="text" data-field="label" value="${attr(s.label)}"></div>
      <div class="field"><label>URL</label><input type="text" data-field="url" value="${attr(s.url || '#')}"></div>
    </div>`;
  mountDel(c);
  return c;
}
function renderChangelog() {
  const m = $('#list-changelog'); m.innerHTML = '';
  (cfg.changelog || []).forEach((ch) => m.appendChild(rowChangelog(ch)));
}
function rowChangelog(ch = {}) {
  const c = document.createElement('div'); c.className = 'card changelog-row';
  c.innerHTML = `<button class="del" type="button">✕</button>
    <div class="ord">
      <button class="up" type="button">▲</button>
      <button class="down" type="button">▼</button>
    </div>
    <div class="row three">
      <div class="field"><label>Version</label><input type="text" data-field="version" value="${attr(ch.version)}" placeholder="v1.0.0"></div>
      <div class="field"><label>Date</label><input type="text" data-field="date" value="${attr(ch.date)}" placeholder="YYYY-MM-DD"></div>
      <label class="pinrow" style="margin-top:1.5rem"><input type="checkbox" data-field="isRelease" ${ch.isRelease ? 'checked' : ''}> Release (prominent indicator)</label>
    </div>
    <div class="field"><label>Title</label><input type="text" data-field="title" value="${attr(ch.title)}" placeholder="Feature Title"></div>
    <div class="field"><label>Description / Text</label><textarea data-field="text" placeholder="Details about this change...">${esc(ch.text)}</textarea></div>`;
  mountDel(c);
  mountOrd(c, 'changelog-row');
  return c;
}
function addRow(kind) {
  if (kind === 'nav') $('#list-nav').appendChild(rowNav({ href: '#' }));
  if (kind === 'titlephrases') $('#list-titlephrases').appendChild(rowMarquee('', 'titlephrase-row'));
  if (kind === 'marquee') $('#list-marquee').appendChild(rowMarquee());
  if (kind === 'projects') $('#list-projects').appendChild(rowProject({ accent: '#2bb8ff', url: '#', pinned: false }));
  if (kind === 'columns') $('#list-columns').appendChild(rowColumn({ title: 'New column', items: [] }));
  if (kind === 'stats') $('#list-stats').appendChild(rowStat({ format: 'plain' }));
  if (kind === 'socials') $('#list-socials').appendChild(rowSocial({ url: '#' }));
  if (kind === 'changelog') $('#list-changelog').appendChild(rowChangelog({ version: 'v1.0.0', date: new Date().toISOString().split('T')[0], title: '', isRelease: false, text: '' }));
  if (kind === 'scripts') $('#list-scripts').appendChild(rowScript({ url: '#', pinned: false }));
}


function field(card, name) { const el = card.querySelector(`[data-field="${name}"]`); return el ? (el.type === 'checkbox' ? el.checked : el.value) : ''; }
function collect() {
  const out = structuredClone(cfg);
  document.querySelectorAll('#cfg [data-path]').forEach((el) => pathSet(out, el.dataset.path, el.type === 'checkbox' ? el.checked : el.value));
  if (!out.nav) out.nav = {};
  out.nav.links = [...document.querySelectorAll('.nav-row')].map((r) => ({ label: field(r, 'label'), href: field(r, 'href') || '#' })).filter((l) => l.label.trim());
  if (!out.title) out.title = {};
  out.title.phrases = [...document.querySelectorAll('.titlephrase-row')].map((r) => field(r, 'word')).filter((w) => w.trim());
  out.marquee = [...document.querySelectorAll('.marquee-row')].map((r) => field(r, 'word')).filter((w) => w.trim());
  out.projects = [...document.querySelectorAll('.project-row')].map((r) => {
    const name = field(r, 'name');
    return { id: r.dataset.id || slug(name), name, tag: field(r, 'tag'), description: field(r, 'description'), year: field(r, 'year'), stack: field(r, 'stack'), accent: field(r, 'accent'), url: field(r, 'url'), pinned: field(r, 'pinned') };
  }).filter((p) => p.name.trim());
  out.about.columns = [...document.querySelectorAll('.column-row')].map((r) => {
    const title = field(r, 'title'); const body = field(r, 'body');
    return field(r, 'type') === 'text' ? { title, text: body } : { title, items: body.split('\n').map((s) => s.trim()).filter(Boolean) };
  });
  out.stats = [...document.querySelectorAll('.stat-row')].map((r) => {
    const raw = field(r, 'value').trim(); const num = Number(raw);
    return { value: raw !== '' && !Number.isNaN(num) ? num : raw, label: field(r, 'label'), format: field(r, 'format') };
  });
  out.socials = [...document.querySelectorAll('.social-row')].map((r) => ({ label: field(r, 'label'), url: field(r, 'url') })).filter((s) => s.label.trim());
  out.scripts = [...document.querySelectorAll('.script-row')].map((r) => {
    const name = field(r, 'name');
    return { id: r.dataset.id || slug(name), name, tag: field(r, 'tag'), lang: field(r, 'lang'), description: field(r, 'description'), install: field(r, 'install'), src: field(r, 'src'), url: field(r, 'url'), pinned: field(r, 'pinned') };
  }).filter((s) => s.name.trim());
  out.changelog = [...document.querySelectorAll('.changelog-row')].map((r) => ({
    version: field(r, 'version'),
    date: field(r, 'date'),
    title: field(r, 'title'),
    isRelease: field(r, 'isRelease'),
    text: field(r, 'text')
  })).filter((ch) => ch.version.trim() || ch.title.trim());
  return out;
}

const msg = $('#msg');
function flash(text, ok) { msg.textContent = text; msg.className = `msg ${ok ? 'ok' : 'err'}`; }
$('#save').addEventListener('click', async () => {
  const btn = $('#save'); btn.disabled = true; flash('Saving…', true);
  try {
    const r = await fetch('/api/config', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(collect()) });
    if (r.ok) { cfg = collect(); flash('Saved ✓ — live in a few seconds.', true); }
    else if (r.status === 401) { flash('Session expired — reload to log in.', false); }
    else { flash(`Save failed (${r.status}).`, false); }
  } catch { flash('Network error.', false); }
  btn.disabled = false;
});
$('#reset').addEventListener('click', () => { buildForm(); flash('Reverted to last saved.', true); });


(async () => { if (await checkAuth()) showEditor(); })();
