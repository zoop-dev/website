import * as THREE from 'three';
import { quality } from '../lib/quality.js';



export default class GlassHero {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x07070a, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0;            

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.set(0, 0, 6.4);   

    this.group = new THREE.Group();
    this.scene.add(this.group);

    
    this.uniforms = { uPress: { value: 0 }, uReveal: { value: 0 } };
    this.u = { uTime: { value: 0 }, uProgress: { value: 0 } };

    this.accent = '#2bb8ff';
    this.dim = 1;
    this.energy = 1;
    this.mouse = new THREE.Vector2(0, 0);
    this.target = new THREE.Vector2(0, 0);
    this.offset = new THREE.Vector2(0, 0);
    this.offsetTarget = new THREE.Vector2(0, 0);

    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.pmrem.compileEquirectangularShader();
    this._buildEnv();

    const dl = new THREE.DirectionalLight(0xffffff, 2.2);
    dl.position.set(2.5, 3, 2);
    this.scene.add(dl);

    this._buildMesh();

    this.qScale = 1;
    this.dpr = Math.min(window.devicePixelRatio, quality.glass.dprCap);
    this.resize();
  }

  setQualityScale(s) { this.qScale = s; this.resize(); }

  _envCanvas() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, this.accent);
    grad.addColorStop(0.5, '#0b0b14');
    grad.addColorStop(1, '#050509');
    g.fillStyle = grad; g.fillRect(0, 0, 512, 256);
    const pool = (x, y, r, col, a) => {
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = a; g.fillStyle = rg; g.fillRect(0, 0, 512, 256); g.globalAlpha = 1;
    };
    pool(150, 70, 150, this.accent, 0.8);          
    pool(380, 90, 140, '#ff3da6', 0.5);            
    pool(440, 60, 120, '#2bd8ff', 0.45);           
    pool(120, 60, 70, '#ffffff', 0.9);             
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  _buildEnv() {
    if (this.envRT) this.envRT.dispose();
    const eq = this._envCanvas();
    this.envRT = this.pmrem.fromEquirectangular(eq);
    this.scene.environment = this.envRT.texture;
    eq.dispose();
  }

  _buildMesh() {
    const geo = new THREE.IcosahedronGeometry(1.15, 32);
    const mat = new THREE.MeshPhysicalMaterial({
      transmission: 1.0, thickness: 0.8, ior: 1.42, roughness: 0.04, metalness: 0.0,
      dispersion: 5.0, iridescence: 1.0, iridescenceIOR: 1.3, iridescenceThicknessRange: [120, 420],
      envMapIntensity: 2.4, clearcoat: 0.6, clearcoatRoughness: 0.2,
      attenuationColor: new THREE.Color(this.accent), attenuationDistance: 3.0, transparent: true,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.u.uTime;
      shader.uniforms.uProgress = this.u.uProgress;
      shader.uniforms.uPress = this.uniforms.uPress;
      shader.vertexShader = `
        uniform float uTime; uniform float uProgress; uniform float uPress;
        float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
        float vn(vec3 p){ vec3 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(mix(h3(i+vec3(0,0,0)),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
                     mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
        float fbm(vec3 p){ return 0.65*vn(p)+0.35*vn(p*2.03+9.2); }
        void computeBlob(vec3 pos, vec3 nor, out vec3 dPos, out vec3 dNor){
          float amp = 0.2 * (1.0 + uPress*0.7);
          float fr = 1.3 + uProgress*1.4;
          float t = uTime*0.25;
          float d  = fbm(pos*fr + t) - 0.5;
          vec3 t1 = normalize(cross(nor, vec3(0.0,1.0,0.0)) + 1e-4);
          vec3 t2 = cross(nor, t1);
          float e = 0.08;
          float da = fbm((pos+t1*e)*fr + t) - 0.5;
          float db = fbm((pos+t2*e)*fr + t) - 0.5;
          vec3 p0 = pos + nor*d*amp;
          vec3 pa = (pos+t1*e) + nor*da*amp;
          vec3 pb = (pos+t2*e) + nor*db*amp;
          dPos = p0;
          dNor = normalize(cross(pa-p0, pb-p0));
        }
      ` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader
        .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
          vec3 _dPos; vec3 _dNor; computeBlob(position, normal, _dPos, _dNor); objectNormal = _dNor;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          transformed = _dPos;`);
    };
    this.mat = mat;
    this.mesh = new THREE.Mesh(geo, mat);
    this.group.add(this.mesh);
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setPixelRatio(this.dpr * this.qScale);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setMouse(x, y) { this.target.set(x, y); }
  setScroll() {}
  setProgress(p) { this.u.uProgress.value += (p - this.u.uProgress.value) * 1.0; this._progress = p; }
  setOffset(x, y) { this.offsetTarget.set(x, y); }
  setDim(d) { this.dimTarget = d; }
  setEnergy(e) { this.energy = e; }
  setAccent(hex) {
    this.accent = hex;
    if (this.mat) this.mat.attenuationColor.set(hex);
    if (this.pmrem) this._buildEnv();
  }

  render(time) {
    this.u.uTime.value = time;
    if (this.dimTarget != null) this.dim += (this.dimTarget - this.dim) * 0.06;
    this.u.uProgress.value += ((this._progress || 0) - this.u.uProgress.value) * 0.05;
    this.mouse.lerp(this.target, 0.07);
    this.offset.lerp(this.offsetTarget, 0.05);

    
    const en = this.energy;
    this.group.rotation.y += 0.0025 * (0.3 + 0.7 * en);
    this.group.rotation.x = this.mouse.y * 0.4;
    this.group.rotation.z = this.u.uProgress.value * 0.8;
    const droop = (1 - Math.min(1, Math.max(0, en))) * 0.55;   
    this.group.position.set(this.offset.x * 2.2 + this.mouse.x * 0.25, this.offset.y * 2.2 + this.mouse.y * 0.25 - droop, 0);
    const s = (1 + this.uniforms.uPress.value * 0.12) * (0.96 + 0.04 * Math.min(1, en));
    this.group.scale.setScalar(s);

    this.renderer.toneMappingExposure = Math.max(0, this.uniforms.uReveal.value) * this.dim * 1.5 * (0.55 + 0.45 * Math.min(1.4, en));
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mat.dispose();
    if (this.envRT) this.envRT.dispose();
    if (this.pmrem) this.pmrem.dispose();
    this.renderer.dispose();
  }
}
