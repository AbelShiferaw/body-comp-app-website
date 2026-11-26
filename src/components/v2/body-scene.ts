// Three.js scene for the interactive tour: the app's body mesh (the same
// body.glb the app ships, CC0 MakeHuman base), colored per vertex from its
// region masks, with two ways to move between stops:
// - "fly":  the camera arcs around a still body (light follows the camera).
// - "turn": the camera never moves; the body turns and slides on its stage.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

import type { AnchorName, Frame, Mood, Motion } from "@/lib/tour";
import { SLOT_COUNT } from "@/lib/tour";

type Look = {
  background: number;
  body: [number, number, number];
  accent: [number, number, number];
  roughness: number;
  glow: number;
  rim: number;
  bloom: number;
  floor: string;
};

// Colors mirror the app's Studio look (light) and its dark mode; the
// cinematic look adds a rim light and bloom so the heatmap glows.
const LOOKS: Record<Mood, Look> = {
  bright: {
    background: 0xf4f5f7,
    body: [0.93, 0.9, 0.86],
    accent: [0.12, 0.44, 0.77],
    roughness: 0.62,
    glow: 0,
    rim: 0,
    bloom: 0,
    floor: "rgba(17,19,23,0.16)",
  },
  cinematic: {
    background: 0x000000,
    body: [0.56, 0.6, 0.66],
    accent: [0.49, 0.77, 1],
    roughness: 0.5,
    glow: 0.14,
    rim: 0.55,
    bloom: 0.42,
    floor: "rgba(124,196,255,0.28)",
  },
};

const FOV = 30;
/** Camera distance of the "turn" mode's fixed camera. */
const TURN_DIST = 38;

export type Projected = { x: number; y: number; front: boolean; onScreen: boolean };

export class BodyScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 400);
  private stage = new THREE.Group();
  private key = new THREE.DirectionalLight(0xffffff, 2.2);
  private rimLight = new THREE.DirectionalLight(0x9fd4ff, 0);
  private hemi = new THREE.HemisphereLight(0xffffff, 0x8a8f98, 1.1);
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private floor: THREE.Mesh;
  private mesh?: THREE.Mesh;
  private material = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0 });
  // Region colors are blended on the GPU from each vertex's region masks,
  // so stop-to-stop color changes cost nothing on the main thread.
  private uniforms = {
    uGlow: { value: 0 },
    uRim: { value: 0 },
    uHeat: { value: 0 },
    uHMax: { value: 0 },
    uBase: { value: new THREE.Vector3() },
    uAccent: { value: new THREE.Vector3() },
    uColors: { value: Array.from({ length: SLOT_COUNT }, () => new THREE.Vector3()) },
    uHighlight: { value: new Array<number>(SLOT_COUNT).fill(0) },
  };
  private masks?: Float32Array;
  private width = 1;
  private height = 1;
  private look: Look = LOOKS.bright;
  private mood: Mood = "bright";
  private motion: Motion = "fly";
  private morphIndex: Record<string, number> = {};
  private tmp = new THREE.Vector3();

  /** Points on the body surface that cards pin to, in body coordinates. */
  anchors: Partial<Record<AnchorName, THREE.Vector3>> = {};
  /** Region centers the camera frames, in body coordinates. */
  centers: Record<"whole" | "belly" | "arms" | "legs", THREE.Vector3> = {
    whole: new THREE.Vector3(0, 0.2, 0),
    belly: new THREE.Vector3(0, 1.9, 0),
    arms: new THREE.Vector3(0, 2.6, 0),
    legs: new THREE.Vector3(0, -4.5, 0),
  };

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "void main() {",
          `attribute vec4 regionsA;
          attribute vec4 regionsB;
          uniform vec3 uColors[8];
          uniform float uHighlight[8];
          uniform float uHeat;
          uniform float uHMax;
          uniform vec3 uBase;
          uniform vec3 uAccent;
          void main() {`,
        )
        .replace(
          "#include <color_vertex>",
          `float m[8];
          m[0] = regionsA.x; m[1] = regionsA.y; m[2] = regionsA.z; m[3] = regionsA.w;
          m[4] = regionsB.x; m[5] = regionsB.y; m[6] = regionsB.z; m[7] = regionsB.w;
          // Six body regions blended by mask, then the belly (android) and
          // hips (gynoid) bands laid on top, as in the app's heatmap.
          vec3 c = vec3(0.0);
          float sum = 0.0;
          for (int k = 0; k < 6; k++) { c += m[k] * uColors[k]; sum += m[k]; }
          if (sum > 0.0) c /= sum;
          c = mix(c, uColors[6], m[6]);
          c = mix(c, uColors[7], m[7]);
          c = mix(uBase, c, uHeat);
          // Highlight the focus region in the accent color, dim the rest.
          float h = 0.0;
          for (int k = 0; k < 8; k++) h = max(h, uHighlight[k] * m[k]);
          c = mix(c, uAccent, h * 0.6 * (1.0 - uHeat * 0.7));
          vColor = pow(c, vec3(2.2)) * (1.0 - 0.35 * uHMax * (1.0 - h));`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("void main() {", "uniform float uGlow;\nuniform float uRim;\nvoid main() {")
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          float rimF = pow(1.0 - saturate(dot(normalize(normal), normalize(vViewPosition))), 2.4);
          totalEmissiveRadiance += vColor.rgb * (uGlow + uRim * rimF);`,
        );
    };

    this.camera.add(this.key);
    this.key.position.set(-0.45, 0.55, 1);
    this.camera.add(this.rimLight);
    this.rimLight.position.set(0.6, 0.4, -1);
    this.scene.add(this.camera, this.hemi, this.stage);

    this.floor = new THREE.Mesh(
      new THREE.CircleGeometry(9, 64),
      new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }),
    );
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -8.2;
    this.stage.add(this.floor);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.5, 0.72);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());

    this.setMood("bright");
  }

  async load(url: string) {
    const gltf = await new GLTFLoader().loadAsync(url);
    let mesh: THREE.Mesh | undefined;
    gltf.scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) mesh = o as THREE.Mesh;
    });
    if (!mesh) throw new Error("body.glb has no mesh");
    const geo = mesh.geometry as THREE.BufferGeometry;
    // body.glb is stored mirrored in z for the app's renderer (it faces -z
    // with the left arm on +x). Mirror it back so it faces +z, the camera's
    // side, with its left arm on its left; flip the triangle winding to match.
    const mirror = (attr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => {
      for (let i = 0; i < attr.count; i++) attr.setZ(i, -attr.getZ(i));
    };
    mirror(geo.getAttribute("position"));
    for (const t of geo.morphAttributes.position ?? []) mirror(t);
    const index = geo.getIndex();
    if (index) {
      for (let i = 0; i < index.count; i += 3) {
        const b = index.getX(i + 1);
        index.setX(i + 1, index.getX(i + 2));
        index.setX(i + 2, b);
      }
    }
    geo.computeVertexNormals();
    const n = geo.getAttribute("position").count;

    const a = geo.getAttribute("_regions_a");
    const b = geo.getAttribute("_regions_b");
    const masks = new Float32Array(n * SLOT_COUNT);
    for (let v = 0; v < n; v++) {
      masks[v * 8] = a.getX(v);
      masks[v * 8 + 1] = a.getY(v);
      masks[v * 8 + 2] = a.getZ(v);
      masks[v * 8 + 3] = a.getW(v);
      masks[v * 8 + 4] = b.getX(v);
      masks[v * 8 + 5] = b.getY(v);
      masks[v * 8 + 6] = b.getZ(v);
      masks[v * 8 + 7] = b.getW(v);
    }
    this.masks = masks;
    geo.setAttribute("regionsA", a);
    geo.setAttribute("regionsB", b);
    geo.deleteAttribute("_regions_a");
    geo.deleteAttribute("_regions_b");
    // Unused (colors come from the shader) but keeps three's USE_COLOR path.
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3), 3));

    this.morphIndex = mesh.morphTargetDictionary ?? {};
    mesh.material = this.material;
    mesh.frustumCulled = false;
    this.mesh = mesh;
    this.setMorph("male", 1);
    this.stage.add(mesh);

    const extras = (gltf.parser.json as { extras?: { joints?: Record<string, number[]> } }).extras;
    this.computeAnchors(geo, extras?.joints ?? {});
  }

  private setMorph(name: string, w: number) {
    const i = this.morphIndex[name];
    if (this.mesh?.morphTargetInfluences && i !== undefined) this.mesh.morphTargetInfluences[i] = w;
  }

  private computeAnchors(geo: THREE.BufferGeometry, joints: Record<string, number[]>) {
    const pos = geo.getAttribute("position");
    const masks = this.masks!;
    const n = pos.count;
    const jointCenter = (name: string) => {
      const ids = joints[name] ?? [];
      const c = new THREE.Vector3();
      for (const i of ids) c.add(this.tmp.fromBufferAttribute(pos, i));
      return ids.length ? c.divideScalar(ids.length) : null;
    };
    // Front surface point of a slot's region near height y (front is +z).
    const frontAt = (slot: number, y: number, x?: number) => {
      let best: THREE.Vector3 | null = null;
      for (let v = 0; v < n; v++) {
        if (masks[v * 8 + slot] < 0.6) continue;
        const py = pos.getY(v);
        if (Math.abs(py - y) > 0.35) continue;
        const px = pos.getX(v);
        if (x !== undefined && Math.abs(px - x) > 0.8) continue;
        const pz = pos.getZ(v);
        if (!best || pz > best.z) best = new THREE.Vector3(px, py, pz);
      }
      return best;
    };
    const mid = (a: THREE.Vector3 | null, b: THREE.Vector3 | null, t = 0.5) =>
      a && b ? a.clone().lerp(b, t) : null;

    const upperArmL = mid(jointCenter("shoulder_l"), jointCenter("elbow_l"), 0.62);
    const upperArmR = mid(jointCenter("shoulder_r"), jointCenter("elbow_r"), 0.62);
    const thighL = mid(jointCenter("hip_l"), jointCenter("knee_l"));
    const thighR = mid(jointCenter("hip_r"), jointCenter("knee_r"));

    const set = (name: AnchorName, p: THREE.Vector3 | null) => {
      if (p) this.anchors[name] = p;
    };
    set("chest", frontAt(4, 4.3, 0.9));
    set("belly", frontAt(6, 1.7, 0));
    // Hip: the front-outer point of the hips band on the body's right side,
    // just below the hip joint (not the groin or the thigh).
    const hipY = (jointCenter("hip_r")?.y ?? 0.3) - 0.25;
    let hip: THREE.Vector3 | null = null;
    let hipScore = -Infinity;
    for (let v = 0; v < n; v++) {
      if (masks[v * 8 + 7] < 0.6) continue;
      const px = pos.getX(v);
      const py = pos.getY(v);
      if (px >= 0 || Math.abs(py - hipY) > 0.25) continue;
      const score = -px + 0.6 * pos.getZ(v);
      if (score > hipScore) {
        hipScore = score;
        hip = new THREE.Vector3(px, py, pos.getZ(v));
      }
    }
    set("hips", hip);
    const belly = this.anchors.belly;
    if (belly) set("abdomen", frontAt(4, belly.y + 1.4, -0.7));
    if (upperArmL) set("armL", frontAt(0, upperArmL.y, upperArmL.x) ?? upperArmL);
    if (upperArmR) set("armR", frontAt(1, upperArmR.y, upperArmR.x) ?? upperArmR);
    if (thighL) set("legL", frontAt(2, thighL.y, thighL.x) ?? thighL);
    if (thighR) set("legR", frontAt(3, thighR.y, thighR.x) ?? thighR);

    if (this.anchors.belly)
      this.centers.belly = new THREE.Vector3(0, this.anchors.belly.y + 0.6, 0);
    if (upperArmL) this.centers.arms = new THREE.Vector3(0, upperArmL.y - 0.4, 0);
    if (thighL) this.centers.legs = new THREE.Vector3(0, thighL.y - 1.2, 0);
  }

  get loaded() {
    return !!this.mesh;
  }

  setMood(mood: Mood) {
    this.mood = mood;
    this.look = LOOKS[mood];
    this.scene.background = new THREE.Color(this.look.background);
    this.material.roughness = this.look.roughness;
    this.uniforms.uRim.value = this.look.rim;
    this.rimLight.intensity = mood === "cinematic" ? 1.6 : 0.5;
    this.hemi.intensity = mood === "cinematic" ? 0.55 : 1.1;
    this.key.intensity = mood === "cinematic" ? 1.8 : 2.2;
    this.bloomPass.strength = this.look.bloom;
    (this.floor.material as THREE.MeshBasicMaterial).map = floorTexture(this.look.floor);
    (this.floor.material as THREE.MeshBasicMaterial).needsUpdate = true;
    this.uniforms.uBase.value.set(...this.look.body);
    this.uniforms.uAccent.value.set(...this.look.accent);
  }

  setMotion(motion: Motion) {
    this.motion = motion;
  }

  resize(w: number, h: number) {
    this.width = Math.max(1, w);
    this.height = Math.max(1, h);
    this.renderer.setSize(this.width, this.height, false);
    this.composer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  /** Applies one interpolated tour frame. `spin` is the visitor's drag. */
  apply(f: Frame, spin: number) {
    const c = new THREE.Vector3(f.focus.x, f.focus.y, f.focus.z);
    // Narrow (phone) screens: pull back so the frame keeps its width.
    const narrow = Math.min(1.9, Math.max(1, 0.75 / this.camera.aspect));
    const dist = f.focus.dist * narrow;

    if (this.motion === "fly") {
      // Swoop: pull back mid-transition so the camera arcs between stops.
      const d = dist + f.swoop * 2.5;
      const yaw = f.focus.yaw + spin;
      const pitch = f.focus.pitch;
      this.stage.position.set(0, 0, 0);
      this.stage.rotation.set(0, 0, 0);
      this.stage.scale.setScalar(1);
      this.camera.position.set(
        c.x + d * Math.sin(yaw) * Math.cos(pitch),
        c.y + d * Math.sin(pitch),
        c.z + d * Math.cos(yaw) * Math.cos(pitch),
      );
      this.camera.lookAt(c);
    } else {
      // The camera stays put at eye level; the body turns on its stage, and
      // the stage slides and scales so the focus region sits in frame.
      const s = TURN_DIST / dist;
      this.camera.position.set(0, 0, TURN_DIST);
      this.camera.lookAt(0, 0, 0);
      this.stage.rotation.set(0, -(f.focus.yaw + spin), 0);
      this.stage.scale.setScalar(s);
      const rc = c.clone().applyEuler(this.stage.rotation).multiplyScalar(s);
      this.stage.position.set(-rc.x, -rc.y, -rc.z);
    }

    // Shift the body sideways or up to make room for a side panel.
    if (f.offsetX || f.offsetY) {
      this.camera.setViewOffset(
        this.width,
        this.height,
        -f.offsetX * this.width,
        f.offsetY * this.height,
        this.width,
        this.height,
      );
    } else if (this.camera.view) {
      this.camera.clearViewOffset();
    }
    this.camera.updateMatrixWorld();

    this.setMorph("male_fat_up", f.fatUp);
    this.setMorph("male_muscle_up", f.muscleUp);
    this.uniforms.uGlow.value = this.look.glow * f.heat;
    this.updateColors(f);
  }

  private updateColors(f: Frame) {
    const u = this.uniforms;
    u.uHeat.value = f.heat;
    f.colors.forEach((c, i) => u.uColors.value[i].set(c[0], c[1], c[2]));
    f.highlight.forEach((h, i) => (u.uHighlight.value[i] = h));
    u.uHMax.value = Math.max(...f.highlight);
  }

  render() {
    if (this.mood === "cinematic") this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  /** Screen position (CSS px) of an anchor, and whether it faces the camera. */
  project(name: AnchorName): Projected | null {
    const p = this.anchors[name];
    if (!p) return null;
    const world = this.stage.localToWorld(this.tmp.copy(p));
    const toCam = this.camera.position.clone().sub(world).normalize();
    const normal = new THREE.Vector3(Math.sign(p.x) * 0.3, 0, 1)
      .normalize()
      .applyQuaternion(this.stage.quaternion);
    const front = normal.dot(toCam) > -0.1;
    world.project(this.camera);
    const onScreen = Math.abs(world.x) < 0.92 && Math.abs(world.y) < 0.9 && world.z < 1;
    return {
      onScreen,
      x: (world.x * 0.5 + 0.5) * this.width,
      y: (-world.y * 0.5 + 0.5) * this.height,
      front,
    };
  }

  dispose() {
    this.renderer.dispose();
    this.composer.dispose();
  }
}

function floorTexture(color: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
