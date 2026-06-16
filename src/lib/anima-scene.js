












import { anima } from './anima.js';

const HELPERS =
  'const{sin,cos,tan,abs,min,max,floor,ceil,round,sqrt,pow,exp,sign,hypot,atan2,PI}=Math;' +
  'const TAU=PI*2;const clamp=(v,a,b)=>v<a?a:v>b?b:v;const lerp=(a,b,t)=>a+(b-a)*t;' +
  'const smooth=(e0,e1,x)=>{x=clamp((x-e0)/(e1-e0),0,1);return x*x*(3-2*x)};' +
  'const hash=(n)=>{const x=sin(n*12.9898)*43758.5453;return x-floor(x)};';


function compile(value, keys) {
  if (typeof value !== 'string') return () => value;
  try {
    return new Function('s', 't', 'c', `${HELPERS}const{${keys.join(',')}}=s;const{i,f,w,h}=c;return(${value});`);
  } catch (e) { console.error('[anima-scene] bad expr:', value, e); return () => 0; }
}

function compileNode(n, keys) {
  const type = n.type;
  const count = Math.max(1, (n.repeat | 0) || 1);
  const color = n.color || '#ffffff';
  const g = {
    x: compile(n.x ?? 'w*0.5', keys), y: compile(n.y ?? 'h*0.5', keys),
    alpha: compile(n.alpha ?? 1, keys), glow: compile(n.glow ?? 0, keys), width: compile(n.width ?? 2, keys),
    r: compile(n.r ?? 4, keys), len: compile(n.len ?? 10, keys),
    x2: compile(n.x2 ?? 'w*0.5', keys), y2: compile(n.y2 ?? 'h*0.5', keys),
    a0: compile(n.a0 ?? 0, keys), a1: compile(n.a1 ?? 'TAU', keys),
    rw: compile(n.rw ?? 10, keys), rh: compile(n.rh ?? 10, keys), size: compile(n.size ?? 14, keys),
  };
  const text = n.text ?? '', font = n.font || 'var(--font-mono), monospace';

  return (ctx, s, t, w, h, pal) => {
    const col = color === '@accent' ? pal.accent : color;
    for (let i = 0; i < count; i++) {
      const c = { i, f: count > 1 ? i / (count - 1) : 0, w, h };
      const a = g.alpha(s, t, c); if (a <= 0.002) continue;
      ctx.globalAlpha = a < 1 ? a : 1;
      const gl = g.glow(s, t, c); ctx.shadowBlur = gl > 0 ? gl : 0; ctx.shadowColor = col;
      ctx.lineWidth = g.width(s, t, c); ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.fillStyle = col;
      const x = g.x(s, t, c), y = g.y(s, t, c);
      if (type === 'dot') { ctx.beginPath(); ctx.arc(x, y, Math.max(0, g.r(s, t, c)), 0, 6.2832); ctx.fill(); }
      else if (type === 'ring') { ctx.beginPath(); ctx.arc(x, y, Math.max(0, g.r(s, t, c)), 0, 6.2832); ctx.stroke(); }
      else if (type === 'arc') { ctx.beginPath(); ctx.arc(x, y, Math.max(0, g.r(s, t, c)), g.a0(s, t, c), g.a1(s, t, c)); ctx.stroke(); }
      else if (type === 'bar') { const L = Math.max(0, g.len(s, t, c)); ctx.beginPath(); ctx.moveTo(x, y - L); ctx.lineTo(x, y + L); ctx.stroke(); }
      else if (type === 'line') { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(g.x2(s, t, c), g.y2(s, t, c)); ctx.stroke(); }
      else if (type === 'rect') { const rw = g.rw(s, t, c), rh = g.rh(s, t, c); ctx.fillRect(x - rw / 2, y - rh / 2, rw, rh); }
      else if (type === 'text') { ctx.font = `${g.size(s, t, c)}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y); }
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  };
}


export function mountScene(canvas, spec) {
  const keys = Object.keys(spec.inputs || {});
  const renderers = (spec.nodes || []).map((n) => compileNode(n, keys));
  const pal = { accent: spec.accent || '#2bb8ff' };
  const draw = (ctx, s, t, w, h) => { for (const r of renderers) r(ctx, s, t, w, h, pal); };
  const inst = anima(canvas, { inputs: spec.inputs || {}, spring: spec.spring, draw });
  inst.setAccent = (hex) => { pal.accent = hex; };
  return inst;
}


export function mountBehind(el, spec, { pad = 22 } = {}) {
  if (!el) return null;
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  const c = document.createElement('canvas');
  Object.assign(c.style, {
    position: 'absolute', left: `-${pad}px`, top: `-${pad}px`,
    width: `calc(100% + ${pad * 2}px)`, height: `calc(100% + ${pad * 2}px)`,
    pointerEvents: 'none', zIndex: '-1',
  });
  el.appendChild(c);
  const inst = mountScene(c, { ...spec, inputs: { hover: 0, ...(spec.inputs || {}) } });
  el.addEventListener('pointerenter', () => inst.set({ hover: 1 }));
  el.addEventListener('pointerleave', () => inst.set({ hover: 0 }));
  return inst;
}
