import * as THREE from 'three';
import { quality } from '../lib/quality.js';



const baseVert =  `
  varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
  uniform vec2 texelSize;
  void main(){
    vUv = uv;
    vL = uv - vec2(texelSize.x, 0.0);
    vR = uv + vec2(texelSize.x, 0.0);
    vT = uv + vec2(0.0, texelSize.y);
    vB = uv - vec2(0.0, texelSize.y);
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const advectionFrag =  `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity, uSource;
  uniform vec2 texelSize;
  uniform float dt, dissipation;
  void main(){
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    gl_FragColor = texture2D(uSource, coord) / (1.0 + dissipation * dt);
  }
`;

const divergenceFrag =  `
  precision highp float;
  varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
  uniform sampler2D uVelocity;
  void main(){
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
  }
`;

const pressureFrag =  `
  precision highp float;
  varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
  uniform sampler2D uPressure, uDivergence;
  void main(){
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float div = texture2D(uDivergence, vUv).x;
    gl_FragColor = vec4((L + R + T + B - div) * 0.25, 0.0, 0.0, 1.0);
  }
`;

const gradientFrag =  `
  precision highp float;
  varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
  uniform sampler2D uPressure, uVelocity;
  void main(){
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 v = texture2D(uVelocity, vUv).xy;
    v -= vec2(R - L, T - B) * 0.5;
    gl_FragColor = vec4(v, 0.0, 1.0);
  }
`;

const curlFrag =  `
  precision highp float;
  varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
  uniform sampler2D uVelocity;
  void main(){
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
  }
`;

const vorticityFrag =  `
  precision highp float;
  varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
  uniform sampler2D uVelocity, uCurl;
  uniform float curl, dt;
  void main(){
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 vel = texture2D(uVelocity, vUv).xy + force * dt;
    gl_FragColor = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);
  }
`;

const prefilterFrag =  `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float threshold, knee;
  void main(){
    vec3 c = texture2D(uTexture, vUv).rgb;
    float br = max(c.r, max(c.g, c.b));
    float soft = clamp(br - threshold + knee, 0.0, 2.0 * knee);
    soft = soft * soft / (4.0 * knee + 0.0001);
    float m = max(soft, br - threshold) / max(br, 0.0001);
    gl_FragColor = vec4(c * m, 1.0);
  }
`;

const blurFrag =  `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec2 direction;
  void main(){
    vec3 sum = texture2D(uTexture, vUv).rgb * 0.294;
    sum += texture2D(uTexture, vUv + direction * 1.407).rgb * 0.353;
    sum += texture2D(uTexture, vUv - direction * 1.407).rgb * 0.353;
    gl_FragColor = vec4(sum, 1.0);
  }
`;

const splatFrag =  `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float aspectRatio, radius;
  uniform vec3 color;
  uniform vec2 point;
  void main(){
    vec2 p = vUv - point;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + splat, 1.0);
  }
`;

const displayFrag =  `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture, uBloom;
  uniform vec3 uBg;
  uniform float uBloomIntensity;
  void main(){
    vec3 c = texture2D(uTexture, vUv).rgb;
    vec3 bloom = texture2D(uBloom, vUv).rgb * uBloomIntensity;
    // subtle vignette to seat the ink in the dark
    float vig = smoothstep(1.25, 0.25, length(vUv - 0.5));
    vec3 col = uBg * vig + c + bloom;
    col = pow(col, vec3(0.92));   // gentle filmic lift
    gl_FragColor = vec4(col, 1.0);
  }
`;

function makeRT(w, h, type, filter) {
  return new THREE.WebGLRenderTarget(w, h, {
    type, minFilter: filter, magFilter: filter,
    wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false, stencilBuffer: false,
  });
}

function makeFBO(w, h, type, filter) {
  let read = makeRT(w, h, type, filter);
  let write = makeRT(w, h, type, filter);
  return {
    get read() { return read; },
    get write() { return write; },
    swap() { const t = read; read = write; write = t; },
    texelSize: new THREE.Vector2(1 / w, 1 / h),
  };
}

export default class Fluid {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.autoClear = false;
    this.renderer.setClearColor(0x07070a, 1);

    
    const gl = this.renderer.getContext();
    const halfLinear = !!gl.getExtension('OES_texture_half_float_linear') || this.renderer.capabilities.isWebGL2;
    this.type = THREE.HalfFloatType;
    this.filter = halfLinear ? THREE.LinearFilter : THREE.NearestFilter;

    this.simRes = quality.fluid.simRes;
    this.dyeRes = quality.fluid.dyeRes;
    this.iterations = quality.fluid.iterations;
    this.config = {
      velDissipation: 0.4,
      dyeDissipation: 1.0,
      radius: 0.0006,          
      curlForce: 30.0,         
      bloomIntensity: 0.8,
      bloomThreshold: 0.5,
      bloomKnee: 0.7,
    };

    this._initTargets();
    this._initMaterials();

    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.displayMat);
    this.scene.add(this.quad);

    this.accent = [0.12, 0.6, 1.0];    
    this.splats = [];
    this.lastTime = performance.now();
    this.dpr = Math.min(window.devicePixelRatio, quality.fluid.dprCap);
    this.resize();
    this._seed();
  }

  _initTargets() {
    const s = this.simRes, d = this.dyeRes;
    const aspect = window.innerWidth / window.innerHeight;
    const sw = Math.round(s * aspect), dw = Math.round(d * aspect);
    this.velocity = makeFBO(sw, s, this.type, this.filter);
    this.dye = makeFBO(dw, d, this.type, this.filter);
    this.divergence = makeRT(sw, s, this.type, THREE.NearestFilter);
    this.curl = makeRT(sw, s, this.type, THREE.NearestFilter);
    this.pressure = makeFBO(sw, s, this.type, THREE.NearestFilter);
    this.simTexel = new THREE.Vector2(1 / sw, 1 / s);
    this.dyeTexel = new THREE.Vector2(1 / dw, 1 / d);

    
    const bw = Math.round(dw / 2), bh = Math.round(d / 2);
    this.bloom = makeFBO(bw, bh, this.type, this.filter);
    this.bloomTexel = new THREE.Vector2(1 / bw, 1 / bh);
  }

  _mat(frag, uniforms) {
    return new THREE.ShaderMaterial({ vertexShader: baseVert, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
  }

  _initMaterials() {
    this.advectionMat = this._mat(advectionFrag, {
      texelSize: { value: this.simTexel }, uVelocity: { value: null }, uSource: { value: null },
      dt: { value: 0.016 }, dissipation: { value: 0 },
    });
    this.curlMat = this._mat(curlFrag, { texelSize: { value: this.simTexel }, uVelocity: { value: null } });
    this.vorticityMat = this._mat(vorticityFrag, {
      texelSize: { value: this.simTexel }, uVelocity: { value: null }, uCurl: { value: null },
      curl: { value: this.config.curlForce }, dt: { value: 0.016 },
    });
    this.divergenceMat = this._mat(divergenceFrag, { texelSize: { value: this.simTexel }, uVelocity: { value: null } });
    this.pressureMat = this._mat(pressureFrag, { texelSize: { value: this.simTexel }, uPressure: { value: null }, uDivergence: { value: null } });
    this.gradientMat = this._mat(gradientFrag, { texelSize: { value: this.simTexel }, uPressure: { value: null }, uVelocity: { value: null } });
    this.splatMat = this._mat(splatFrag, {
      texelSize: { value: this.simTexel }, uTarget: { value: null }, aspectRatio: { value: 1 },
      color: { value: new THREE.Vector3() }, point: { value: new THREE.Vector2() }, radius: { value: this.config.radius },
    });
    this.prefilterMat = this._mat(prefilterFrag, {
      texelSize: { value: this.dyeTexel }, uTexture: { value: null },
      threshold: { value: this.config.bloomThreshold }, knee: { value: this.config.bloomKnee },
    });
    this.blurMat = this._mat(blurFrag, {
      texelSize: { value: this.bloomTexel }, uTexture: { value: null }, direction: { value: new THREE.Vector2() },
    });
    this.displayMat = this._mat(displayFrag, {
      texelSize: { value: this.dyeTexel }, uTexture: { value: null }, uBloom: { value: null },
      uBg: { value: new THREE.Vector3(0.027, 0.027, 0.039) }, uBloomIntensity: { value: this.config.bloomIntensity },
    });
  }

  _blit(material, target) {
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, false);
    this.aspect = w / h;
  }

  
  splat(x, y, dx, dy) {
    const c = 12.0;
    this.splats.push({ x, y, dx: dx * c, dy: dy * c });
  }

  setAccent(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    if (m) this.accent = [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
  }

  _seed() {
    
    for (let i = 0; i < 6; i++) {
      this.splats.push({ x: 0.3 + Math.random() * 0.4, y: 0.3 + Math.random() * 0.4,
        dx: (Math.random() - 0.5) * 6, dy: (Math.random() - 0.5) * 6, seed: this.accent.slice() });
    }
  }

  _applySplat(s) {
    const color = s.seed || this._inkColor();
    
    this.splatMat.uniforms.uTarget.value = this.velocity.read.texture;
    this.splatMat.uniforms.aspectRatio.value = this.aspect;
    this.splatMat.uniforms.point.value.set(s.x, s.y);
    this.splatMat.uniforms.radius.value = this.config.radius;
    this.splatMat.uniforms.color.value.set(s.dx, s.dy, 0);
    this._blit(this.splatMat, this.velocity.write); this.velocity.swap();
    
    this.splatMat.uniforms.uTarget.value = this.dye.read.texture;
    this.splatMat.uniforms.color.value.set(color[0], color[1], color[2]);
    this._blit(this.splatMat, this.dye.write); this.dye.swap();
  }

  _inkColor() {
    
    const t = 0.7 + Math.random() * 0.5;
    return [this.accent[0] * t, this.accent[1] * t, this.accent[2] * t];
  }

  step(dt) {
    const gl = this.renderer;
    gl.setRenderTarget(null);

    
    for (const s of this.splats) this._applySplat(s);
    this.splats.length = 0;

    
    this.advectionMat.uniforms.texelSize.value = this.simTexel;
    this.advectionMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.advectionMat.uniforms.uSource.value = this.velocity.read.texture;
    this.advectionMat.uniforms.dt.value = dt;
    this.advectionMat.uniforms.dissipation.value = this.config.velDissipation;
    this._blit(this.advectionMat, this.velocity.write); this.velocity.swap();

    
    this.curlMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this._blit(this.curlMat, this.curl);
    this.vorticityMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.vorticityMat.uniforms.uCurl.value = this.curl.texture;
    this.vorticityMat.uniforms.dt.value = dt;
    this._blit(this.vorticityMat, this.velocity.write); this.velocity.swap();

    
    this.divergenceMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this._blit(this.divergenceMat, this.divergence);

    
    this.pressureMat.uniforms.uDivergence.value = this.divergence.texture;
    for (let i = 0; i < this.iterations; i++) {
      this.pressureMat.uniforms.uPressure.value = this.pressure.read.texture;
      this._blit(this.pressureMat, this.pressure.write); this.pressure.swap();
    }

    
    this.gradientMat.uniforms.uPressure.value = this.pressure.read.texture;
    this.gradientMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this._blit(this.gradientMat, this.velocity.write); this.velocity.swap();

    
    this.advectionMat.uniforms.texelSize.value = this.simTexel;
    this.advectionMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.advectionMat.uniforms.uSource.value = this.dye.read.texture;
    this.advectionMat.uniforms.dissipation.value = this.config.dyeDissipation;
    this._blit(this.advectionMat, this.dye.write); this.dye.swap();

    
    this.prefilterMat.uniforms.uTexture.value = this.dye.read.texture;
    this._blit(this.prefilterMat, this.bloom.write); this.bloom.swap();
    for (let i = 0; i < 2; i++) {
      this.blurMat.uniforms.uTexture.value = this.bloom.read.texture;
      this.blurMat.uniforms.direction.value.set(this.bloomTexel.x, 0);
      this._blit(this.blurMat, this.bloom.write); this.bloom.swap();
      this.blurMat.uniforms.uTexture.value = this.bloom.read.texture;
      this.blurMat.uniforms.direction.value.set(0, this.bloomTexel.y);
      this._blit(this.blurMat, this.bloom.write); this.bloom.swap();
    }

    
    this.displayMat.uniforms.uTexture.value = this.dye.read.texture;
    this.displayMat.uniforms.uBloom.value = this.bloom.read.texture;
    this.quad.material = this.displayMat;
    gl.setRenderTarget(null);
    gl.render(this.scene, this.camera);
  }

  render() {
    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    dt = Math.min(dt, 0.0166);
    this.step(dt);
  }
}
