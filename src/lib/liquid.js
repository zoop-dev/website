



import { clamp } from './motion.js';

let turb, disp, built = false;
function ensureFilter() {
  if (built) return;
  built = true;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
  const f = document.createElementNS(ns, 'filter');
  f.setAttribute('id', 'liquid-filter');
  
  f.setAttribute('x', '-30%'); f.setAttribute('y', '-30%');
  f.setAttribute('width', '160%'); f.setAttribute('height', '160%');
  f.setAttribute('color-interpolation-filters', 'sRGB');
  turb = document.createElementNS(ns, 'feTurbulence');
  turb.setAttribute('type', 'fractalNoise');
  turb.setAttribute('baseFrequency', '0.008 0.014');
  turb.setAttribute('numOctaves', '2');
  turb.setAttribute('seed', '7');
  turb.setAttribute('result', 'noise');
  disp = document.createElementNS(ns, 'feDisplacementMap');
  disp.setAttribute('in', 'SourceGraphic');
  disp.setAttribute('in2', 'noise');
  disp.setAttribute('scale', '0');
  disp.setAttribute('xChannelSelector', 'R');
  disp.setAttribute('yChannelSelector', 'G');
  f.appendChild(turb); f.appendChild(disp); svg.appendChild(f);
  document.body.appendChild(svg);
}



export function liquidType(selector, getVelocity, { max = 24, gain = 1.4 } = {}) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  ensureFilter();
  const els = [...document.querySelectorAll(selector)];
  if (!els.length) return;

  
  let boost = 0;
  els.forEach((el) => {
    let lx = 0, ly = 0, lt = 0;
    el.addEventListener('pointermove', (e) => {
      const now = performance.now(), dt = Math.max(16, now - lt); lt = now;
      const sp = Math.hypot(e.clientX - lx, e.clientY - ly) / dt;
      lx = e.clientX; ly = e.clientY;
      boost = Math.min(1, boost + sp * 0.16);
    });
  });

  let scale = 0, on = false;
  const tick = (now) => {
    const v = Math.abs((getVelocity && getVelocity()) || 0);
    boost *= 0.9;
    const target = clamp(v * gain + boost * max, 0, max);
    scale += (target - scale) * 0.2;
    if (scale > 0.4) {
      if (!on) { on = true; els.forEach((e) => e.classList.add('is-liquid')); }
      const b = 0.006 + 0.003 * Math.sin(now * 0.0012); 
      turb.setAttribute('baseFrequency', `${b.toFixed(4)} ${(b * 1.7).toFixed(4)}`);
      disp.setAttribute('scale', scale.toFixed(1));
    } else if (on) {
      on = false; disp.setAttribute('scale', '0');
      els.forEach((e) => e.classList.remove('is-liquid'));
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
