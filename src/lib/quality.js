








const params = new URLSearchParams(location.search);
const forced = params.get('quality');                 
const lite = params.has('lite');

function detectRenderer() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (!gl) return { renderer: 'none', software: true };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const r = String((ext && gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) || '');
    const software = /swiftshader|llvmpipe|software|microsoft basic|virtualbox|mesa offscreen/i.test(r);
    return { renderer: r, software };
  } catch { return { renderer: '', software: false }; }
}

function classify() {
  if (forced === 'low' || forced === 'medium' || forced === 'high') return forced;

  const { renderer, software } = detectRenderer();
  if (software || lite) return 'low';

  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;                       
  const coarse = matchMedia('(pointer: coarse)').matches;        
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const weakGPU = /mali-|adreno (3|4|5)\d{2}|powervr|apple a[789]|intel.*(hd|uhd) graphics (5|6)\d{2}/i.test(renderer);

  let score = 0;
  score += cores >= 8 ? 2 : cores >= 6 ? 1 : cores >= 4 ? 0 : -1;
  score += mem >= 8 ? 2 : mem >= 4 ? 1 : -1;
  score += coarse ? -1 : 1;
  if (weakGPU) score -= 2;
  if (saveData) score -= 2;
  if (innerWidth < 700) score -= 1;

  if (score <= 0) return 'low';
  if (score <= 3) return 'medium';
  return 'high';
}

const PRESETS = {
  low:    { hero: 0.75, glass: 1.0,  fluid: 1.25, simRes: 96,  dyeRes: 256, iterations: 14, liquid: false },
  medium: { hero: 1.0,  glass: 1.25, fluid: 1.5,  simRes: 110, dyeRes: 384, iterations: 20, liquid: true },
  high:   { hero: 1.25, glass: 1.75, fluid: 2.0,  simRes: 128, dyeRes: 512, iterations: 24, liquid: true },
};

const tier = classify();
const p = PRESETS[tier];
const det = detectRenderer();

const _downgrade = [];

export const quality = {
  tier,
  renderer: det.renderer,
  hero: { dprCap: lite ? 0.4 : p.hero },
  glass: { dprCap: p.glass },
  fluid: { dprCap: p.fluid, simRes: p.simRes, dyeRes: p.dyeRes, iterations: p.iterations },
  liquid: p.liquid && !lite,

  
  onDowngrade(fn) { if (typeof fn === 'function') _downgrade.push(fn); },

  
  
  
  watchFPS(isBusy) {
    if (this._watching) return;
    this._watching = true;
    let last = performance.now(), acc = 0, frames = 0, bad = 0, done = false;
    const tick = (now) => {
      const dt = now - last; last = now;
      if (!done && isBusy && isBusy()) {
        acc += dt; frames++;
        if (acc >= 1000) {
          const fps = (frames * 1000) / acc;
          bad = fps < 42 ? bad + 1 : 0;        
          acc = 0; frames = 0;
          if (bad >= 3) {
            done = true;
            this.liquid = false;
            _downgrade.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
          }
        }
      } else { acc = 0; frames = 0; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },
};

if (params.has('qdebug')) console.info('[quality]', tier, det.renderer);
