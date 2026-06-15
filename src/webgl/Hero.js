import * as THREE from 'three';



const vert =  `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const frag =  `
  precision highp float;
  varying vec2 vUv;
  uniform vec2  uRes;
  uniform float uTime;
  uniform vec2  uMouse;     // -1..1
  uniform float uScroll;    // 0..1 across hero
  uniform float uProgress;  // 0..1 across whole page (drives morph)
  uniform vec2  uOffset;    // screen drift as it travels down the page
  uniform float uDim;       // brightness (dimmed behind text)
  uniform float uReveal;    // 0..1 intro
  uniform float uPress;     // 0..1 pointer held
  uniform vec3  uAccent;    // themeable accent colour
  uniform float uReduced;

  // ---- noise / sdf helpers ----
  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

  float smin(float a, float b, float k){
    float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
    return mix(b, a, h) - k*h*(1.0-h);
  }

  mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

  // primitive SDFs to morph between
  float sdBox(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
  float sdOctahedron(vec3 p, float s){ p = abs(p); return (p.x + p.y + p.z - s) * 0.57735027; }
  float sdTorus(vec3 p, vec2 t){ vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }

  // cheap flowing 3d value noise → organic, gooey surface motion
  float hash3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float vnoise(vec3 p){
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash3(i+vec3(0,0,0)), hash3(i+vec3(1,0,0)), f.x),
                   mix(hash3(i+vec3(0,1,0)), hash3(i+vec3(1,1,0)), f.x), f.y),
               mix(mix(hash3(i+vec3(0,0,1)), hash3(i+vec3(1,0,1)), f.x),
                   mix(hash3(i+vec3(0,1,1)), hash3(i+vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p){ return 0.65 * vnoise(p) + 0.35 * vnoise(p * 2.03 + 9.2); }

  float map(vec3 p){
    float t = uTime * 0.22;                      // slower, smoother
    p.xy -= uMouse * 0.5;                         // lean toward the cursor
    p *= 1.3;
    p.xz *= rot(t * 0.5 + uMouse.x * 1.1);
    p.yz *= rot(t * 0.35 + uMouse.y * 0.8);
    p.xy *= rot(uProgress * 1.4 + uScroll * 0.5);

    float infl = uPress * 0.16;

    // flowing noise field that drifts through the form (the gooey motion)
    float warp = fbm(p * 1.15 + vec3(0.0, t * 0.9, t * 0.4)) - 0.5;

    // organic noise-displaced sphere + morph targets, all warped by the same field
    float blob = length(p) - (0.62 + infl) - warp * 0.42;
    float oct = sdOctahedron(p, 0.96 + infl) - warp * 0.26;
    float box = sdBox(p, vec3(0.52 + infl)) - warp * 0.24;
    float tor = sdTorus(p, vec2(0.5, 0.27 + infl)) - warp * 0.2;

    // continuously cycle shapes (time + scroll); loops blob→pointy→cube→torus→blob
    float phase = uTime * 0.13 + uProgress * 2.0;
    int seg = int(mod(phase, 4.0));
    float w = smoothstep(0.0, 1.0, fract(phase));
    float ca, cb;
    if (seg == 0) { ca = blob; cb = oct; }
    else if (seg == 1) { ca = oct; cb = box; }
    else if (seg == 2) { ca = box; cb = tor; }
    else { ca = tor; cb = blob; }
    float d = mix(ca, cb, w);

    // a tendril that reaches toward the cursor
    vec3 reach = vec3(uMouse * 1.1, 0.3);
    d = smin(d, length(p - reach) - 0.2, 0.5);
    return d * 0.7;                              // bound the warped field for stable marching
  }

  // tetrahedron normal (4 map calls instead of 6)
  vec3 calcNormal(vec3 p){
    const vec2 k = vec2(1.0, -1.0);
    const float h = 0.0016;
    return normalize(k.xyy*map(p+k.xyy*h) + k.yyx*map(p+k.yyx*h) + k.yxy*map(p+k.yxy*h) + k.xxx*map(p+k.xxx*h));
  }

  // thin-film-ish iridescence ramp
  vec3 iridescence(float t){
    vec3 a = vec3(0.5), b = vec3(0.5);
    vec3 c = vec3(1.0), d = vec3(0.0, 0.33, 0.67);
    return a + b * cos(6.28318 * (c*t + d));
  }

  // vibrant procedural studio environment that the glass reflects + refracts
  vec3 env(vec3 d){
    float y = d.y * 0.5 + 0.5;
    vec3 col = mix(vec3(0.015, 0.02, 0.05), uAccent * 0.85, smoothstep(0.0, 1.0, y));
    // complementary colour pools for that oil-slick glass dispersion
    col = mix(col, vec3(0.95, 0.25, 0.65), smoothstep(0.35, 1.0, d.x * 0.5 + 0.5) * 0.45);
    col = mix(col, vec3(0.20, 0.95, 0.85), smoothstep(0.35, 1.0, -d.x * 0.5 + 0.5) * 0.35);
    col = mix(col, vec3(1.0, 0.85, 0.45), smoothstep(0.5, 1.0, -d.y) * 0.4);
    // soft key + accent rim lights
    col += vec3(1.0) * pow(max(dot(d, normalize(vec3(0.5, 0.75, 0.45))), 0.0), 10.0) * 0.9;
    col += uAccent * pow(max(dot(d, normalize(vec3(-0.6, 0.3, -0.5))), 0.0), 20.0) * 0.7;
    return col;
  }

  void main(){
    vec2 uv = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;
    uv -= uOffset;                                       // blob drifts as it travels

    // dark atmospheric background with a soft lime-tinted glow
    float vig = smoothstep(1.1, 0.1, length(uv));
    vec3 bg = mix(vec3(0.027,0.027,0.039), vec3(0.05,0.06,0.07), vig);
    bg += uAccent * 0.18 * pow(vig, 3.0) * 0.45;          // accent halo

    // camera
    vec3 ro = vec3(0.0, 0.0, 3.0);
    vec3 rd = normalize(vec3(uv, -1.6));

    float t = 0.0; float d; bool hit = false;
    for (int i = 0; i < 60; i++){
      vec3 p = ro + rd * t;
      d = map(p);
      if (d < 0.0025){ hit = true; break; }
      if (t > 6.0) break;
      t += d * 0.8;
    }

    vec3 col = bg;
    if (hit){
      vec3 p = ro + rd * t;
      vec3 n = calcNormal(p);
      vec3 v = -rd;
      float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);

      // glossy reflection of the environment
      vec3 refl = env(reflect(rd, n));

      // refraction through the glass with chromatic dispersion (split RGB by IOR)
      float ior = 1.18;
      vec3 rR = refract(rd, n, 1.0 / (ior + 0.045));
      vec3 rG = refract(rd, n, 1.0 / ior);
      vec3 rB = refract(rd, n, 1.0 / (ior - 0.045));
      vec3 refr = vec3(env(rR).r, env(rG).g, env(rB).b);
      refr *= mix(vec3(1.0), uAccent * 1.6 + 0.25, 0.22);  // faint glass tint

      // thin-film iridescence on the grazing rim
      vec3 irid = iridescence(fres * 0.9 + n.y * 0.2 + uTime * 0.02);

      // sharp glossy hotspot
      vec3 lDir = normalize(vec3(0.6, 0.85, 0.5));
      float spec = pow(max(dot(reflect(-lDir, n), v), 0.0), 90.0);

      col = mix(refr, refl, clamp(fres + 0.08, 0.0, 1.0));  // fresnel: refract core, reflect rim
      col += uAccent * 0.12 * (1.0 - fres);                // soft inner glow so the core isn't dead
      col += irid * fres * 0.6;                             // oil-slick edge
      col += vec3(1.0) * spec * 1.1;                        // bright highlight
      col = mix(col, bg, smoothstep(3.2, 4.6, t));          // depth fade
    }

    // grain + dim (kept visible as a connective backdrop, dimmed behind text)
    float g = (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.04;
    col += g;
    col *= uDim;                                         // per-section brightness
    col *= smoothstep(0.0, 1.0, uReveal);                // intro fade-in

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default class Hero {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x07070a, 1);
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.uniforms = {
      uRes: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      uProgress: { value: 0 },
      uOffset: { value: new THREE.Vector2(0, 0) },
      uDim: { value: 1 },
      uReveal: { value: 0 },
      uPress: { value: 0 },
      uAccent: { value: new THREE.Vector3(0.17, 0.72, 1.0) },
      uReduced: { value: 0 },
    };
    this.offsetTarget = new THREE.Vector2(0, 0);
    this.dimTarget = 1;
    this.progressTarget = 0;

    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: this.uniforms });
    this.scene.add(new THREE.Mesh(geo, mat));

    this.mouse = new THREE.Vector2(0, 0);
    this.target = new THREE.Vector2(0, 0);
    const lite = new URLSearchParams(location.search).has('lite');
    const lowEnd = (navigator.hardwareConcurrency || 4) <= 4 || window.innerWidth < 700;
    
    this.dpr = lite ? 0.4 : Math.min(window.devicePixelRatio, lowEnd ? 1.0 : 1.25);
    this.resize();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, false);
    this.uniforms.uRes.value.set(w * this.dpr, h * this.dpr);
  }

  setMouse(x, y) { this.target.set(x, y); }
  setScroll(v) { this.uniforms.uScroll.value = v; }
  setReveal(v) { this.uniforms.uReveal.value = v; }
  setProgress(p) { this.progressTarget = p; }
  setOffset(x, y) { this.offsetTarget.set(x, y); }
  setDim(d) { this.dimTarget = d; }
  setAccent(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    if (m) this.uniforms.uAccent.value.set(parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255);
  }

  render(time) {
    this.mouse.lerp(this.target, 0.06);
    this.uniforms.uMouse.value.copy(this.mouse);
    
    this.uniforms.uOffset.value.lerp(this.offsetTarget, 0.05);
    this.uniforms.uDim.value += (this.dimTarget - this.uniforms.uDim.value) * 0.06;
    this.uniforms.uProgress.value += (this.progressTarget - this.uniforms.uProgress.value) * 0.05;
    this.uniforms.uTime.value = time;
    this.renderer.render(this.scene, this.camera);
  }
}
