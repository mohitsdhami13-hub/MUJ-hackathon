/**
 * scene.js — Three.js Memory Constellation Background
 * Team Maze · MUJ Hackathon 2026
 *
 * ES Module — imported via <script type="module">
 * Renders an animated 3-D scene: glowing core, orbital session
 * nodes, neural-network clusters, and post-processing bloom.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }     from 'three/addons/postprocessing/OutputPass.js';

/* ── Renderer ───────────────────────────────────────────── */
const canvas = document.getElementById('c3d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping         = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace    = THREE.SRGBColorSpace;

/* ── Scene & Camera ─────────────────────────────────────── */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0b08);
scene.fog        = new THREE.FogExp2(0x0c0a07, 0.013);

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 500);
camera.position.set(0, 6, 72);

/* ── Post Processing — Bloom ────────────────────────────── */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  0.6,   // strength
  0.4,   // radius
  0.25   // threshold
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ── Lights ─────────────────────────────────────────────── */
scene.add(new THREE.AmbientLight(0x0d0904, 1.5));

const kLight = new THREE.PointLight(0xe09040, 25, 130);
kLight.position.set(22, 38, 18);
scene.add(kLight);

const fLight = new THREE.PointLight(0x3d8068, 12, 110);
fLight.position.set(-40, -12, 8);
scene.add(fLight);

const rLight = new THREE.PointLight(0x8b3a10, 7, 85);
rLight.position.set(0, -35, -28);
scene.add(rLight);

/* ── Core Shaders ───────────────────────────────────────── */
const coreVert = `
  varying vec3 vNormal;
  varying vec3 vViewPos;
  void main() {
    vNormal  = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewPos   = -mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const coreFrag = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  void main() {
    vec3  viewDir = normalize(vViewPos);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.8);
    float pulse   = 0.85 + 0.15 * sin(uTime * 1.6);
    vec3  innerCol = vec3(0.75, 0.38, 0.08);
    vec3  rimCol   = vec3(1.0,  0.72, 0.28);
    vec3  col = mix(innerCol, rimCol, fresnel) * (1.8 + 0.6 * fresnel) * pulse;
    float alpha = 0.12 + fresnel * 0.88;
    gl_FragColor  = vec4(col, alpha);
  }
`;

const coreUniforms = { uTime: { value: 0 } };
const coreMat = new THREE.ShaderMaterial({
  uniforms:       coreUniforms,
  vertexShader:   coreVert,
  fragmentShader: coreFrag,
  transparent:    true,
  side:           THREE.FrontSide,
  blending:       THREE.AdditiveBlending,
  depthWrite:     false,
});

const core = new THREE.Mesh(new THREE.SphereGeometry(4.8, 64, 64), coreMat);
scene.add(core);

/* ── Inner Metallic Core ────────────────────────────────── */
const innerMat = new THREE.MeshStandardMaterial({
  color:             0x8a3a10,
  roughness:         0.05,
  metalness:         0.95,
  emissive:          new THREE.Color(0x4a1c04),
  emissiveIntensity: 2.0,
});
const innerCore = new THREE.Mesh(new THREE.SphereGeometry(3.2, 48, 48), innerMat);
scene.add(innerCore);

/* ── Orbital Rings ──────────────────────────────────────── */
[6.5, 8.0, 10.5].forEach((r, i) => {
  const rg = new THREE.RingGeometry(r, r + 0.18 - i * 0.04, 80);
  const rm = new THREE.MeshBasicMaterial({
    color:      new THREE.Color().setHSL(0.08, 0.9, 0.55 - i * 0.1),
    transparent: true,
    opacity:    0.08 - i * 0.02,
    side:       THREE.DoubleSide,
    blending:   THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(rg, rm);
  ring.rotation.x        = Math.PI * (0.12 + i * 0.07);
  ring.userData.rotSpeed = 0.008 - i * 0.002;
  ring.userData.tilt     = Math.PI * (0.12 + i * 0.07);
  scene.add(ring);
  core.userData['ring' + i] = ring;
});

/* ── Wireframe Shell ────────────────────────────────────── */
const shell = new THREE.Mesh(
  new THREE.IcosahedronGeometry(55, 2),
  new THREE.MeshBasicMaterial({
    color:      0x3a2810,
    wireframe:  true,
    transparent: true,
    opacity:    0.04,
    blending:   THREE.AdditiveBlending,
    depthWrite: false,
  })
);
scene.add(shell);

/* ── Neural Network Cluster Nodes ───────────────────────── */
const nnGroup = new THREE.Group();
scene.add(nnGroup);

const nnNodes      = [];
const nnPos        = [];
const clusterCenters = [
  new THREE.Vector3(-65, 0, -10),
  new THREE.Vector3( 65, 0, -10),
];

clusterCenters.forEach(center => {
  for (let i = 0; i < 45; i++) {
    const x = center.x + (Math.random() - 0.5) * 45;
    const y = center.y + (Math.random() - 0.5) * 45;
    const z = center.z + (Math.random() - 0.5) * 35;
    nnNodes.push(new THREE.Vector3(x, y, z));
    nnPos.push(x, y, z);
  }
});

const nnGeo = new THREE.BufferGeometry();
nnGeo.setAttribute('position', new THREE.Float32BufferAttribute(nnPos, 3));
nnGroup.add(new THREE.Points(nnGeo, new THREE.PointsMaterial({
  color: 0x80b090, size: 0.5, transparent: true, opacity: 0.6,
  blending: THREE.AdditiveBlending, depthWrite: false,
})));

// Cluster connection lines
const nnLinePos = [];
for (let i = 0; i < nnNodes.length; i++) {
  for (let j = i + 1; j < nnNodes.length; j++) {
    if (nnNodes[i].distanceTo(nnNodes[j]) < 16) {
      nnLinePos.push(
        nnNodes[i].x, nnNodes[i].y, nnNodes[i].z,
        nnNodes[j].x, nnNodes[j].y, nnNodes[j].z
      );
    }
  }
}
const nnLineGeo = new THREE.BufferGeometry();
nnLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(nnLinePos, 3));
nnGroup.add(new THREE.LineSegments(nnLineGeo, new THREE.LineBasicMaterial({
  color: 0x508068, transparent: true, opacity: 0.12,
  blending: THREE.AdditiveBlending, depthWrite: false,
})));

/* ── Session Orbit Nodes ────────────────────────────────── */
const sessions = [
  { distress: .88 }, { distress: .80 }, { distress: .74 }, { distress: .68 },
  { distress: .61 }, { distress: .54 }, { distress: .49 }, { distress: .46 },
  { distress: .43 }, { distress: .39 }, { distress: .36 },
  { distress: .33 }, { distress: .30 }, { distress: .27 },
];

const sessionNodes  = [];
const linesGroup    = new THREE.Group();
scene.add(linesGroup);

sessions.forEach((s, i) => {
  const t   = 1 - s.distress;
  const col = new THREE.Color().lerpColors(
    new THREE.Color(0xd04820),
    new THREE.Color(0x30a878),
    t
  );
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.6 + t * 0.7, 28, 28),
    new THREE.MeshStandardMaterial({
      color:             col,
      roughness:         0.08,
      metalness:         0.92,
      emissive:          col.clone(),
      emissiveIntensity: 1.8 + t * 0.8,
    })
  );
  const angle  = (i / 14) * Math.PI * 2.8;
  const elev   = (i / 13 - 0.5) * 32;
  const radius = 19 + Math.sin(i * 0.9) * 7;
  mesh.position.set(Math.cos(angle) * radius, elev, Math.sin(angle) * radius);
  mesh.userData = {
    orbitAngle: angle,
    orbitRadius: radius,
    orbitSpeed:  0.0007 + t * 0.0012,
    orbitY:      elev,
    phase:       i * 0.44,
  };
  scene.add(mesh);
  sessionNodes.push(mesh);
});

/* ── Ambient Dust Particles ─────────────────────────────── */
const pPos = new Float32Array(800 * 3);
for (let i = 0; i < 800 * 3; i++) pPos[i] = (Math.random() - 0.5) * 180;
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
  color: 0xd08040, size: 0.1, transparent: true, opacity: 0.18,
  sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
})));

/* ── Animation Loop ─────────────────────────────────────── */
let camAngle = 0, mox = 0, moy = 0, frame = 0;

document.addEventListener('mousemove', e => {
  mox = (e.clientX / innerWidth  - 0.5);
  moy = (e.clientY / innerHeight - 0.5);
});

(function animate() {
  requestAnimationFrame(animate);
  frame++;
  const t = frame * 0.006;

  // Camera slow orbit + parallax
  camAngle += 0.001;
  const tx = Math.sin(camAngle) * 70 + mox * 10;
  const tz = Math.cos(camAngle) * 70;
  const ty = 6 + moy * 7 + Math.sin(t * 0.3) * 3;
  camera.position.x += (tx - camera.position.x) * 0.022;
  camera.position.y += (ty - camera.position.y) * 0.022;
  camera.position.z += (tz - camera.position.z) * 0.022;
  camera.lookAt(0, 0, 0);

  // Core pulse
  coreUniforms.uTime.value = t;
  const cp = 1 + 0.05 * Math.sin(t * 1.5);
  innerCore.scale.setScalar(cp);
  innerMat.emissiveIntensity = 1.8 + 0.9 * Math.sin(t * 1.2);

  // Ring rotations
  ['ring0', 'ring1', 'ring2'].forEach((k, i) => {
    const ring = core.userData[k];
    if (ring) {
      ring.rotation.z = t * (0.12 - i * 0.03);
      ring.rotation.x = ring.userData.tilt + Math.sin(t * 0.25 + i) * 0.04;
    }
  });

  // Shell drift
  shell.rotation.y = t * 0.015;
  shell.rotation.x = t * 0.008;

  // Neural cluster drift
  nnGroup.rotation.y = Math.sin(t * 0.2) * 0.03;
  nnGroup.rotation.z = Math.cos(t * 0.15) * 0.02;

  // Light movement
  kLight.position.x = 22 + Math.sin(t * 0.38) * 18;
  kLight.position.y = 38 + Math.cos(t * 0.28) * 12;
  fLight.position.x = -40 + Math.cos(t * 0.33) * 14;
  fLight.position.y = -12 + Math.sin(t * 0.48) * 9;
  kLight.color.setHSL(0.08 + 0.02 * Math.sin(t * 0.15), 0.85, 0.55);

  // Session node orbits + connection lines (every 2nd frame for perf)
  if (frame % 2 === 0) {
    linesGroup.clear();
    sessionNodes.forEach((n, i) => {
      n.userData.orbitAngle += n.userData.orbitSpeed;
      const a = n.userData.orbitAngle;
      const r = n.userData.orbitRadius;
      n.position.x = Math.cos(a) * r;
      n.position.z = Math.sin(a) * r;
      n.position.y = n.userData.orbitY + Math.sin(t + n.userData.phase) * 1.4;
      const br = 1 + 0.12 * Math.sin(t * 1.4 + n.userData.phase);
      n.scale.setScalar(br);
      n.material.emissiveIntensity = 1.6 + 0.8 * Math.sin(t + n.userData.phase);

      // Core → node beam (only for close nodes)
      const dist = n.position.length();
      if (dist < 30) {
        const geo   = new THREE.BufferGeometry().setFromPoints([core.position.clone(), n.position.clone()]);
        const alpha = (1 - dist / 30) * 0.4;
        linesGroup.add(new THREE.Line(geo,
          new THREE.LineBasicMaterial({ color: 0xb06030, transparent: true, opacity: alpha, blending: THREE.AdditiveBlending, depthWrite: false })
        ));
      }

      // Node → next node arc
      if (i < sessionNodes.length - 1) {
        const next = sessionNodes[i + 1];
        const d2   = n.position.distanceTo(next.position);
        if (d2 < 22) {
          const geo2 = new THREE.BufferGeometry().setFromPoints([n.position.clone(), next.position.clone()]);
          linesGroup.add(new THREE.Line(geo2,
            new THREE.LineBasicMaterial({ color: 0x609878, transparent: true, opacity: (1 - d2 / 22) * 0.22, blending: THREE.AdditiveBlending, depthWrite: false })
          ));
        }
      }
    });
  }

  composer.render();
})();

/* ── Resize Handler ─────────────────────────────────────── */
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  bloom.setSize(innerWidth, innerHeight);
});
