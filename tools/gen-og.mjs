// Generates OG images (1200x630) from one shared template — the home card plus
// one per route. Add a route to ROUTES and re-run:  node tools/gen-og.mjs
// (renders with headless Chrome -> public/og*.png)
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ACCENT = '#2bb8ff';

const ROUTES = [
  { out: 'og.png',           lines: ['i make', 'cool stuff'],   sub: '(sometimes)',  url: 'zachy.cc' },
  { out: 'og-projects.png',  lines: ['everything', "i've made"], sub: '(the work)',  url: 'zachy.cc/projects' },
  { out: 'og-changelog.png', lines: ['what i', 'shipped'],       sub: '(changelog)', url: 'zachy.cc/changelog' },
  { out: 'og-github.png',    lines: ['open', 'source'],          sub: '(on github)', url: 'zachy.cc/github' },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const template = ({ lines, sub, url }) => `<!doctype html><html lang="en"><head><meta charset="UTF-8" />
<link href="https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&f[]=satoshi@400,500&display=swap" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>
  :root { --accent:${ACCENT}; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1200px; height:630px; background:#07070a; overflow:hidden; position:relative;
    font-family:'Satoshi',sans-serif; color:#ecebe6; }
  .bg { position:absolute; inset:0;
    background:
      radial-gradient(820px 600px at 78% 42%, rgba(43,184,255,.22), transparent 60%),
      radial-gradient(520px 420px at 92% 88%, rgba(255,61,166,.08), transparent 60%),
      radial-gradient(120% 120% at 50% 40%, transparent 50%, rgba(0,0,0,.66) 100%); }

  .orbwrap { position:absolute; right:128px; top:50%; transform:translateY(-50%); width:452px; height:452px; }
  .glow { position:absolute; inset:-16%; border-radius:50%;
    background:radial-gradient(circle at 50% 50%, rgba(43,184,255,.32), rgba(43,184,255,.06) 52%, transparent 70%);
    filter:blur(8px); }
  .shadow { position:absolute; left:9%; bottom:-30px; width:82%; height:56px; border-radius:50%;
    background:radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,.7), transparent 70%); filter:blur(7px); }
  /* glass marble body */
  .orb { position:absolute; inset:0; border-radius:50%;
    background:
      radial-gradient(circle at 70% 80%, rgba(140,225,255,.95) 0%, rgba(140,225,255,0) 26%),
      radial-gradient(circle at 50% 46%, rgba(43,184,255,.20) 0%, rgba(43,184,255,0) 66%),
      radial-gradient(circle at 40% 36%, #356a8c 0%, #143a52 34%, #0a2233 60%, #050f1a 82%, #02070e 100%);
    box-shadow:
      inset -26px -30px 70px rgba(0,0,0,.74),
      inset 30px 34px 80px rgba(150,225,255,.10),
      inset 0 0 0 2px rgba(255,255,255,.06),
      0 60px 140px rgba(43,184,255,.26);
    filter:saturate(1.1); }
  /* soft fresnel rim */
  .orb::before { content:''; position:absolute; inset:0; border-radius:50%;
    background:radial-gradient(circle at 50% 50%, transparent 62%, rgba(150,225,255,.32) 85%, rgba(255,255,255,.85) 95%, transparent 100%);
    mix-blend-mode:screen; }
  /* chromatic dispersion ring */
  .orb::after { content:''; position:absolute; inset:-2px; border-radius:50%;
    background:conic-gradient(from 120deg, rgba(43,216,255,0), rgba(43,216,255,.42), rgba(122,92,255,.3), rgba(255,61,166,.36), rgba(43,216,255,0));
    mix-blend-mode:screen;
    -webkit-mask:radial-gradient(circle at 50% 50%, transparent 80%, #000 92%); mask:radial-gradient(circle at 50% 50%, transparent 80%, #000 92%); }
  /* glossy top-left reflection */
  .gloss { position:absolute; left:18%; top:12%; width:46%; height:34%; border-radius:50%;
    background:radial-gradient(circle at 38% 32%, rgba(255,255,255,.95), rgba(255,255,255,.18) 42%, transparent 68%);
    transform:rotate(-18deg); filter:blur(2px); mix-blend-mode:screen; }
  .spec { position:absolute; left:30%; top:24%; width:60px; height:60px; border-radius:50%;
    background:radial-gradient(circle, #fff 0%, rgba(255,255,255,0) 70%); filter:blur(1px); }
  /* inner refraction caustic */
  .caustic { position:absolute; left:32%; top:56%; width:128px; height:84px; border-radius:50%;
    background:radial-gradient(circle, rgba(120,210,255,.55), transparent 70%); filter:blur(9px); mix-blend-mode:screen; }
  /* concentric ripples */
  .ripples { position:absolute; inset:0; border-radius:50%; mix-blend-mode:screen; opacity:.55;
    background:
      repeating-radial-gradient(circle at 38% 32%, rgba(190,235,255,.10) 0 4px, transparent 4px 18px),
      repeating-radial-gradient(circle at 72% 76%, rgba(120,200,255,.08) 0 6px, transparent 6px 22px);
    -webkit-mask:radial-gradient(circle at 50% 50%, #000 74%, transparent 93%); mask:radial-gradient(circle at 50% 50%, #000 74%, transparent 93%); }
  /* organic glass texture */
  .tex { position:absolute; inset:0; border-radius:50%; mix-blend-mode:overlay; opacity:.45; background-size:cover;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='452' height='452'%3E%3Cfilter id='t'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.015' numOctaves='3' seed='7'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23t)'/%3E%3C/svg%3E");
    -webkit-mask:radial-gradient(circle at 50% 50%, #000 72%, transparent 92%); mask:radial-gradient(circle at 50% 50%, #000 72%, transparent 92%); }

  .grain { position:absolute; inset:0; opacity:.05; mix-blend-mode:overlay;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }

  .content { position:absolute; left:92px; top:50%; transform:translateY(-50%); }
  .brand { font-family:'Clash Display',sans-serif; font-weight:600; font-size:30px; letter-spacing:-.01em; margin-bottom:30px; }
  .brand span { font-size:.55em; vertical-align:super; color:#8a8a93; }
  h1 { font-family:'Clash Display',sans-serif; font-weight:600; font-size:118px; line-height:.84; letter-spacing:-.03em; }
  .sub { font-family:'Clash Display',sans-serif; font-style:italic; font-weight:500; font-size:40px; color:var(--accent); margin-top:22px; letter-spacing:-.01em; }
  .url { position:absolute; left:92px; bottom:54px; font-family:'JetBrains Mono',monospace; font-size:20px; letter-spacing:.1em; color:#8a8a93; }
  .url b { color:#ecebe6; }
</style></head>
<body>
  <div class="bg"></div>
  <div class="orbwrap">
    <div class="glow"></div>
    <div class="shadow"></div>
    <div class="orb"></div>
    <div class="tex"></div>
    <div class="ripples"></div>
    <div class="caustic"></div>
    <div class="gloss"></div>
    <div class="spec"></div>
  </div>
  <div class="grain"></div>
  <div class="content">
    <div class="brand">zoop<span>©</span></div>
    <h1>${lines.map(esc).join('<br>')}</h1>
    ${sub ? `<div class="sub">${esc(sub)}</div>` : ''}
  </div>
  <div class="url">→ <b>${esc(url)}</b></div>
</body></html>`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'og-'));
for (const r of ROUTES) {
  const f = path.join(tmp, r.out.replace('.png', '.html'));
  fs.writeFileSync(f, template(r));
  execSync(
    `google-chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars ` +
    `--force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=3000 ` +
    `--screenshot="${path.resolve('public', r.out)}" "file://${f}"`,
    { stdio: 'ignore' }
  );
  console.log('rendered public/' + r.out);
}
fs.rmSync(tmp, { recursive: true, force: true });
