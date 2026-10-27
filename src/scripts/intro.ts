import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gsap } from 'gsap';

import logoUrl from '../assets/logo/logo.png?url';

const NAVY = '#121e58';
const YELLOW = '#f6c512';

const paintVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Full-screen paint layer. uSpread grows the splash out of the can mouth until it
// floods the screen; uReveal then slides the paint down the screen, leaving drips.
const paintFragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uSpread;
  uniform float uReveal;
  uniform vec2 uRes;
  uniform vec2 uOrigin;
  uniform vec3 uYellow;
  uniform vec3 uOrange;
  uniform vec3 uPink;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; }
    return v;
  }

  // signed field: > 0 inside the paint
  float splash(vec2 uv) {
    vec2 asp = vec2(uRes.x / uRes.y, 1.0);
    vec2 p = (uv - uOrigin) * asp;
    float d = length(p);
    float ang = atan(p.y, p.x);
    float lobes = fbm(vec2(cos(ang), sin(ang)) * 2.2 + uTime * 0.15);
    float r = uSpread * 3.2 * (0.55 + 0.75 * lobes);
    float f = r - d;

    // droplets thrown ahead of the splash front
    for (int k = 0; k < 14; k++) {
      float fk = float(k);
      float a = hash(vec2(fk, 3.1)) * 6.2831;
      float dist = r * (1.08 + 0.45 * hash(vec2(fk, 7.7)));
      vec2 c = vec2(cos(a), sin(a)) * dist;
      float rad = (0.015 + 0.045 * hash(vec2(fk, 1.3))) * smoothstep(0.0, 0.25, uSpread);
      f = max(f, rad - length(p - c));
    }

    // the paint sliding off: its top edge drops, with columns lagging behind as drips
    float drip = pow(noise(vec2(uv.x * 9.0, 0.5)), 3.0) * 0.55 + noise(vec2(uv.x * 31.0, 2.0)) * 0.05;
    float top = 1.02 - uReveal * 1.75 + drip * uReveal;
    f = min(f, (top - uv.y) * 0.6);
    return f;
  }

  void main() {
    float f = splash(vUv);
    float aa = fwidth(f) * 1.2 + 0.0005;
    float m = smoothstep(-aa, aa, f);
    if (m <= 0.001) discard;

    vec2 asp = vec2(uRes.x / uRes.y, 1.0);
    vec2 p = vUv * asp;

    // marbled brand colors (domain-warped noise, like paint being stirred), mostly yellow
    vec2 q = vec2(fbm(p * 1.3 + uTime * 0.03), fbm(p * 1.3 + vec2(5.2, 1.3) - uTime * 0.02));
    float t = fbm(p * 1.6 + q * 2.4);
    vec3 col = uYellow;
    col = mix(col, uOrange, smoothstep(0.52, 0.6, t));
    col = mix(col, uPink, smoothstep(0.69, 0.74, t));
    col = mix(col, uYellow, smoothstep(0.8, 0.86, t));

    // fake liquid shading: thickness rim at the edges plus a glossy highlight
    float rim = 1.0 - smoothstep(0.0, 0.035, f);
    float h = fbm(p * 5.0 + uTime * 0.1) * 0.06 + smoothstep(0.0, 0.05, f) * 0.04;
    vec3 n = normalize(vec3(-dFdx(h) * 120.0, -dFdy(h) * 120.0, 1.0));
    float spec = pow(max(dot(n, normalize(vec3(-0.4, 0.6, 1.0))), 0.0), 40.0);
    col *= 1.0 - rim * 0.22;
    col += spec * 0.6;

    gl_FragColor = vec4(col, m);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function makeLabel(): Promise<THREE.CanvasTexture> {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 768;
  const g = c.getContext('2d')!;
  g.fillStyle = NAVY;
  g.fillRect(0, 0, c.width, c.height);
  // yellow and orange bands that wrap around the can
  g.fillStyle = YELLOW;
  g.fillRect(0, 40, c.width, 70);
  g.fillRect(0, c.height - 110, c.width, 70);
  g.fillStyle = '#ff7e19';
  g.fillRect(0, 118, c.width, 14);
  g.fillRect(0, c.height - 132, c.width, 14);
  // the logo on a white plate, centred on u = 0.5 (rotated to face the camera)
  g.fillStyle = '#fffdf9';
  g.beginPath();
  g.roundRect(c.width / 2 - 320, 200, 640, 370, 60);
  g.fill();
  try {
    const logo = await loadImage(logoUrl);
    const w = 540;
    const h = (logo.height / logo.width) * w;
    g.drawImage(logo, c.width / 2 - w / 2, 385 - h / 2, w, h);
  } catch {
    g.fillStyle = NAVY;
    g.font = '700 110px sans-serif';
    g.textAlign = 'center';
    g.fillText('Guanabara', c.width / 2, 400);
  }
  g.fillStyle = '#fffdf9';
  g.textAlign = 'center';
  g.font = '600 40px sans-serif';
  g.fillText('TINTAS · VALENÇA - BA', c.width / 2, 622);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function buildCan(label: THREE.Texture) {
  const R = 0.9;
  const H = 2.1;
  const metal = new THREE.MeshStandardMaterial({ color: 0xd9dde6, metalness: 1, roughness: 0.28 });
  const can = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, H, 96, 1, true),
    new THREE.MeshStandardMaterial({ map: label, metalness: 0.15, roughness: 0.42 }),
  );
  body.rotation.y = Math.PI; // u = 0.5 (logo) faces +z
  can.add(body);

  const ringGeo = new THREE.TorusGeometry(R, 0.045, 12, 96);
  for (const y of [H / 2, -H / 2, H / 2 - 0.22, -H / 2 + 0.22]) {
    const ring = new THREE.Mesh(ringGeo, metal);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    ring.scale.setScalar(y === H / 2 || y === -H / 2 ? 1 : 1.004);
    can.add(ring);
  }

  const bottom = new THREE.Mesh(new THREE.CircleGeometry(R, 64), metal);
  bottom.rotation.x = Math.PI / 2;
  bottom.position.y = -H / 2;
  can.add(bottom);

  // inner rim and the paint surface, visible once the lid is gone
  const lip = new THREE.Mesh(new THREE.RingGeometry(R * 0.82, R, 64), metal);
  lip.rotation.x = -Math.PI / 2;
  lip.position.y = H / 2 - 0.01;
  can.add(lip);
  const paint = new THREE.Mesh(
    new THREE.CircleGeometry(R * 0.82, 64),
    new THREE.MeshStandardMaterial({ color: YELLOW, roughness: 0.12, metalness: 0, toneMapped: false }),
  );
  paint.rotation.x = -Math.PI / 2;
  paint.position.y = H / 2 - 0.06;
  can.add(paint);

  const lid = new THREE.Group();
  const lidDisc = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.03, R * 1.03, 0.07, 64), metal);
  const lidRim = new THREE.Mesh(new THREE.TorusGeometry(R * 1.02, 0.05, 12, 96), metal);
  lidRim.rotation.x = Math.PI / 2;
  const lidRing = new THREE.Mesh(new THREE.TorusGeometry(R * 0.7, 0.025, 8, 64), metal);
  lidRing.rotation.x = Math.PI / 2;
  lidRing.position.y = 0.04;
  lid.add(lidDisc, lidRim, lidRing);
  lid.position.y = H / 2 + 0.035;
  can.add(lid);

  const handle = new THREE.Mesh(new THREE.TorusGeometry(R * 1.06, 0.022, 8, 64, Math.PI), metal);
  handle.position.y = H / 2 - 0.25;
  // the arc lies in the XY plane between the two ears; lean it back, away from the label
  handle.rotation.x = -0.55;
  can.add(handle);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 16), metal);
    ear.rotation.z = Math.PI / 2;
    ear.position.set(side * (R + 0.02), H / 2 - 0.25, 0);
    can.add(ear);
  }

  return { can, lid, topY: H / 2 };
}

export async function runIntro(overlay: HTMLElement, onReveal: () => void): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.className = 'intro__canvas';
  overlay.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.autoClear = false;
  const bg = new THREE.Color(NAVY);
  const state = { bgAlpha: 1 };

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envTarget.texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 4, 5);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(0, 0.4, 9);
  camera.lookAt(0, 0, 0);

  const label = await makeLabel();
  const { can, lid, topY } = buildCan(label);
  const holder = new THREE.Group();
  holder.add(can);
  scene.add(holder);
  // keep the can a similar size on narrow screens
  const fit = () => holder.scale.setScalar(Math.min(1, (window.innerWidth / window.innerHeight) * 1.15));
  fit();

  const paintMat = new THREE.ShaderMaterial({
    vertexShader: paintVertex,
    fragmentShader: paintFragment,
    transparent: true,
    toneMapped: false,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSpread: { value: 0 },
      uReveal: { value: 0 },
      uRes: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uOrigin: { value: new THREE.Vector2(0.5, 0.6) },
      uYellow: { value: new THREE.Color(YELLOW) },
      uOrange: { value: new THREE.Color('#ff7e19') },
      uPink: { value: new THREE.Color('#ec008c') },
    },
  });
  const paintScene = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), paintMat);
  quad.frustumCulled = false;
  paintScene.add(quad);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    paintMat.uniforms.uRes.value.set(window.innerWidth, window.innerHeight);
    fit();
  };
  window.addEventListener('resize', onResize);

  const mouth = new THREE.Vector3();
  const timer = new THREE.Timer();
  timer.connect(document);

  const render = () => {
    timer.update();
    paintMat.uniforms.uTime.value = timer.getElapsed();
    // the splash always starts where the can mouth is on screen
    mouth.set(0, topY, 0);
    can.localToWorld(mouth);
    mouth.project(camera);
    paintMat.uniforms.uOrigin.value.set(mouth.x * 0.5 + 0.5, mouth.y * 0.5 + 0.5);

    renderer.setClearColor(bg, state.bgAlpha);
    renderer.clear();
    if (can.visible) renderer.render(scene, camera);
    renderer.render(paintScene, quadCam);
  };
  // Compile shaders and draw one frame before the timeline starts; otherwise the
  // compile stall on slow devices eats the first second of the animation.
  renderer.compile(scene, camera);
  renderer.compile(paintScene, quadCam);
  holder.position.y = 5;
  render();
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  renderer.setAnimationLoop(render);
  // main.ts disables lag smoothing for Lenis; during the intro a long frame should
  // pause the animation instead of skipping ahead
  gsap.ticker.lagSmoothing(250, 33);

  await new Promise<void>((resolve) => {
    const tl = gsap.timeline({ onComplete: resolve });
    tl.fromTo(holder.position, { y: 5 }, { y: 0, duration: 1.1, ease: 'bounce.out' })
      .fromTo(can.rotation, { y: -0.9, z: 0.2 }, { y: 0.25, z: 0, duration: 1.1, ease: 'power2.out' }, 0)
      // the can shakes before the lid pops
      .to(can.rotation, { z: 0.07, duration: 0.06, repeat: 7, yoyo: true, ease: 'sine.inOut' }, 1.15)
      .to(lid.position, { y: '+=3.2', z: '+=2.4', duration: 0.8, ease: 'power2.out' }, 1.65)
      .to(lid.rotation, { x: 5.5, z: 1.2, duration: 0.8, ease: 'power1.out' }, 1.65)
      // it tips toward the viewer and pours
      .to(can.rotation, { x: 1.05, y: 0, z: 0, duration: 0.55, ease: 'back.in(1.6)' }, 1.8)
      .to(holder.position, { y: -0.35, z: 1.2, duration: 0.55, ease: 'power2.in' }, 1.8)
      .to(paintMat.uniforms.uSpread, { value: 1, duration: 1.35, ease: 'power2.in' }, 2.2)
      .set(state, { bgAlpha: 0 }, 3.55)
      .set(can, { visible: false }, 3.55)
      .add(onReveal, 3.6)
      .to(paintMat.uniforms.uReveal, { value: 1, duration: 1.5, ease: 'power2.inOut' }, 3.6);
    overlay.addEventListener('intro:skip', () => tl.progress(1), { once: true });
    // ?intro-debug starts paused and exposes the timeline so it can be scrubbed from the console
    if (new URLSearchParams(location.search).has('intro-debug')) {
      tl.pause();
      (window as any).__introTl = tl;
    }
  });

  gsap.ticker.lagSmoothing(0);
  renderer.setAnimationLoop(null);
  window.removeEventListener('resize', onResize);
  timer.dispose();
  label.dispose();
  envTarget.dispose();
  pmrem.dispose();
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    }
  });
  quad.geometry.dispose();
  paintMat.dispose();
  renderer.dispose();
  canvas.remove();
}
