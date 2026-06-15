import Hero from './Hero.js';
import GlassHero from './GlassHero.js';



const MAKERS = { blob: Hero, glass: GlassHero };

export default class HeroManager {
  constructor(container, initialStyle = 'glass') {
    this.container = container;
    this.uniforms = { uPress: { value: 0 }, uReveal: { value: 0 } };
    this.state = { mouse: [0, 0], scroll: 0, progress: 0, offset: [0, 0], dim: 1, accent: '#2bb8ff', energy: 1 };
    this.style = null;
    this.active = null;
    this.setStyle(MAKERS[initialStyle] ? initialStyle : 'glass');
  }

  setStyle(style) {
    if (!MAKERS[style] || style === this.style) return;
    
    if (this.active) { try { this.active.dispose?.(); } catch {} }
    if (this.canvas) this.canvas.remove();
    
    this.canvas = document.createElement('canvas');
    this.container.appendChild(this.canvas);
    this.active = new MAKERS[style](this.canvas);
    this.style = style;
    
    const s = this.state;
    this.active.setAccent(s.accent);
    this.active.setMouse(s.mouse[0], s.mouse[1]);
    this.active.setScroll(s.scroll);
    this.active.setProgress(s.progress);
    this.active.setOffset(s.offset[0], s.offset[1]);
    this.active.setDim(s.dim);
    this.active.setEnergy(s.energy);
    if (s.qScale && s.qScale !== 1) this.active.setQualityScale?.(s.qScale);
    this.active.uniforms.uReveal.value = this.uniforms.uReveal.value;
  }

  setMouse(x, y) { this.state.mouse = [x, y]; this.active.setMouse(x, y); }
  setScroll(v) { this.state.scroll = v; this.active.setScroll(v); }
  setProgress(v) { this.state.progress = v; this.active.setProgress(v); }
  setOffset(x, y) { this.state.offset = [x, y]; this.active.setOffset(x, y); }
  setDim(v) { this.state.dim = v; this.active.setDim(v); }
  setEnergy(v) { this.state.energy = v; this.active.setEnergy(v); }
  setAccent(hex) { this.state.accent = hex; this.active.setAccent(hex); }
  setQualityScale(s) { this.state.qScale = s; this.active.setQualityScale?.(s); }
  resize() { this.active.resize(); }

  render(t) {
    
    this.active.uniforms.uPress.value = this.uniforms.uPress.value;
    this.active.uniforms.uReveal.value = this.uniforms.uReveal.value;
    this.active.render(t);
  }
}
