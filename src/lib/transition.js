





import { easeInOutQuart, hexToVec3 } from './motion.js';

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform float uFront;   // wipe front position 0..~1.2
uniform float uMode;    // 0 = cover (grow in), 1 = reveal (sweep out)
uniform vec3  uColor;   // accent
uniform vec3  uColor2;  // deep tint

float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  float a = hash(i), b = hash(i+vec2(1,0)), c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.0; a*=0.5; } return v; }

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  // wavy liquid leading edge — slow large wobble + finer ripple
  float n  = fbm(vec2(uv.y*3.0, uv.y*6.0) + uTime*0.15);
  float n2 = fbm(uv*vec2(4.0,8.0) + uTime*0.40);
  float d  = uv.x + (n-0.5)*0.18 + (n2-0.5)*0.05;
  float edge = 0.14;

  float a;
  if (uMode < 0.5) a = smoothstep(uFront, uFront-edge, d);        // covered where d < front
  else             a = smoothstep(uFront-edge, uFront, d);        // uncovered where d < front

  // bright droplet band riding the moving edge → liquid sheen
  float band = 1.0 - smoothstep(0.0, edge*1.6, abs(d - uFront));
  vec3 col = mix(uColor2, uColor, n2*0.55 + band*0.6);
  col += band * uColor * 0.5;                                     // hot edge highlight
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.03;            // fine grain
  gl_FragColor = vec4(col, a);
}`;


class Transition {
  constructor() {
    this.active = false;
    this.color = [0.17, 0.72, 1];
    this.color2 = [0.02, 0.05, 0.09];
    this._raf = 0;
    this._build();
  }

  _build() {
    const c = document.createElement('canvas');
    c.className = 'transition-gl';
    c.setAttribute('aria-hidden', 'true');
    Object.assign(c.style, {
      position: 'fixed', inset: '0', width: '100%', height: '100%',
      zIndex: '99999', pointerEvents: 'none', opacity: '0', display: 'none',
    });
    document.body.appendChild(c);
    this.canvas = c;
    const gl = c.getContext('webgl', { premultipliedAlpha: false, antialias: false, alpha: true });
    this.gl = gl;
    if (!gl) return; 

    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    this.prog = prog;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this.u = {
      res: gl.getUniformLocation(prog, 'uRes'),
      time: gl.getUniformLocation(prog, 'uTime'),
      front: gl.getUniformLocation(prog, 'uFront'),
      mode: gl.getUniformLocation(prog, 'uMode'),
      color: gl.getUniformLocation(prog, 'uColor'),
      color2: gl.getUniformLocation(prog, 'uColor2'),
    };
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this._resize();
  }

  setColors(accent) {
    this.color = hexToVec3(accent);
    
    this.color2 = this.color.map((v) => v * 0.10 + 0.015);
  }

  _resize() {
    const gl = this.gl; if (!gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w; this.canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(this.u.res, w, h);
  }

  _draw(front, mode, t) {
    const gl = this.gl; if (!gl) return;
    gl.uniform1f(this.u.time, t);
    gl.uniform1f(this.u.front, front);
    gl.uniform1f(this.u.mode, mode);
    gl.uniform3fv(this.u.color, this.color);
    gl.uniform3fv(this.u.color2, this.color2);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  _phase(mode, ms) {
    return new Promise((resolve) => {
      const gl = this.gl;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / ms);
        const front = easeInOutQuart(p) * 1.2;
        
        
        if (gl) this._draw(front, mode, now * 0.001);
        if (p < 1) { this._raf = requestAnimationFrame(tick); }
        else resolve();
      };
      this._raf = requestAnimationFrame(tick);
    });
  }

  
  async run(onMid) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!this.gl || reduce) { try { onMid && onMid(); } finally { return; } }
    if (this.active) return;
    this.active = true;
    cancelAnimationFrame(this._raf);
    this._resize();
    this.canvas.style.display = 'block';
    this.canvas.style.opacity = '1';
    await this._phase(0, 640);                  
    try { onMid && onMid(); } catch (e) { console.error(e); }
    await new Promise((r) => setTimeout(r, 70)); 
    await this._phase(1, 700);                   
    this.canvas.style.opacity = '0';
    this.canvas.style.display = 'none';
    cancelAnimationFrame(this._raf);
    this.active = false;
  }
}

export const transition = new Transition();
addEventListener('resize', () => transition._resize());
