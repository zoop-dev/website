


class Sound {
  constructor() {
    this.enabled = false;
    this.ctx = null;
    this.master = null;
    this.lastSwish = 0;
    try { this.enabled = localStorage.getItem('zoop-sound') === 'on'; } catch {}
  }

  _ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.6;
    const comp = this.ctx.createDynamicsCompressor(); 
    this.master.connect(comp);
    comp.connect(this.ctx.destination);
  }

  setEnabled(on) {
    this.enabled = on;
    try { localStorage.setItem('zoop-sound', on ? 'on' : 'off'); } catch {}
    if (on) { this._ensure(); this.ctx && this.ctx.resume && this.ctx.resume(); }
    else if (this._waterGain) { this._waterGain.gain.cancelScheduledValues(this.ctx.currentTime); this._waterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05); }
  }

  
  _gain(t, attack, dur, peak) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    return g;
  }

  
  boop() {
    if (!this.enabled) return; this._ensure(); if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    const f = 340 + Math.random() * 160;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.12);
    const g = this._gain(t, 0.006, 0.17, 0.3);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.18);
  }

  
  
  water(intensity = 0.5) {
    if (!this.enabled) return; this._ensure(); if (!this.ctx || !this.master) return;
    if (!this._waterGain) {
      try {
        const sr = this.ctx.sampleRate, len = Math.floor(sr * 2);
        const buf = this.ctx.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        let last = 0;                               
        for (let i = 0; i < len; i++) { const n = Math.random() * 2 - 1; last = (last + 0.02 * n) / 1.02; d[i] = last * 3.2; }
        const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 1.4;
        const g = this.ctx.createGain(); g.gain.value = 0.0001;
        src.connect(lp); lp.connect(g); g.connect(this.master);
        src.start();
        this._waterLp = lp; this._waterGain = g;
      } catch (e) { console.warn('water init failed', e); return; }
    }
    const g = this._waterGain, lp = this._waterLp, t = this.ctx.currentTime;
    const vol = Math.min(0.16, 0.025 + intensity * 0.14);
    g.gain.cancelScheduledValues(t);
    g.gain.setTargetAtTime(vol, t, 0.06);                       
    g.gain.setTargetAtTime(0.0001, t + 0.14, 0.22);            
    lp.frequency.setTargetAtTime(360 + intensity * 700, t, 0.1);
  }

  
  tick() {
    if (!this.enabled) return; this._ensure(); if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(1400 + Math.random() * 300, t);
    const g = this._gain(t, 0.003, 0.05, 0.05);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.06);
  }

  
  whoosh() {
    if (!this.enabled) return; this._ensure(); if (!this.ctx) return;
    const t = this.ctx.currentTime, dur = 0.45;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(2200, t + dur * 0.6);
    bp.frequency.exponentialRampToValueAtTime(500, t + dur);
    const g = this._gain(t, 0.08, dur, 0.14);
    src.connect(bp); bp.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + dur);
  }

  
  reveal() {
    if (!this.enabled) return; this._ensure(); if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [392, 523.25, 659.25].forEach((f, i) => {
      const o = this.ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = f;
      const tt = t + i * 0.09;
      const g = this._gain(tt, 0.04, 0.6, 0.12);
      o.connect(g); g.connect(this.master);
      o.start(tt); o.stop(tt + 0.65);
    });
  }
}

export const sound = new Sound();
