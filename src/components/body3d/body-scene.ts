import * as THREE from "three";

/**
 * The app's Studio body in three.js, driven by a scroll "pose".
 *
 * The meshes and heatmap colors in `public/body3d/` are exported from the app's
 * own `body_mapping` package (same mesh, same DEXA mapping, same palette) for
 * the sample timeline, so the site shows exactly what the app draws.
 */

/** Mask slots per vertex, in the app's order. */
export const Slot = {
  leftArm: 0,
  rightArm: 1,
  leftLeg: 2,
  rightLeg: 3,
  trunk: 4,
  head: 5,
  android: 6,
  gynoid: 7,
} as const;
const SLOTS = 8;

/** Base color plus the three heatmaps, as blend weights that sum to 1. */
export type Colors = { base: number; fat: number; fatChange: number; leanChange: number };

export type Pose = {
  /** Point the camera looks at, in body space (metres, y up, body faces +z). */
  target: [number, number, number];
  /** Camera distance from the target. */
  distance: number;
  /** Body turn in radians (0 faces the camera). */
  yaw: number;
  /** 0..1: how much the body slowly turns on its own instead of holding `yaw`. */
  spin: number;
  colors: Colors;
  /** Highlight per mask slot, 0..1; the rest of the body dims. */
  focus: number[];
  /** 0 = first sample scan's shape, 1 = latest. */
  morph: number;
  /** Fraction of the canvas width the body is shifted right (desktop text column). */
  shift: number;
  /** Fraction of the canvas height the body is raised (phones: cards sit below). */
  lift: number;
  /** Camera height angle in radians, used when the camera flies (positive looks down). */
  pitch: number;
};

/**
 * How the view moves between stops: the camera flies around a still body, or
 * the camera stays in front and the body turns and slides to it.
 */
export type Motion = "fly" | "turn";

type Data = {
  from: Float32Array;
  to: Float32Array;
  index: Uint16Array;
  masks: Uint8Array;
  fat: Uint8Array;
  fatChange: Uint8Array;
  leanChange: Uint8Array;
};

async function load(base: string): Promise<Data> {
  const get = (name: string) =>
    fetch(`${base}/${name}`).then((r) => {
      if (!r.ok) throw new Error(`${name}: ${r.status}`);
      return r.arrayBuffer();
    });
  const [from, to, index, masks, fat, fatChange, leanChange] = await Promise.all(
    [
      "pos_from.bin",
      "pos_to.bin",
      "index.bin",
      "masks.bin",
      "col_fat.bin",
      "col_fatchange.bin",
      "col_leanchange.bin",
    ].map(get),
  );
  return {
    from: new Float32Array(from),
    to: new Float32Array(to),
    index: new Uint16Array(index),
    masks: new Uint8Array(masks),
    fat: new Uint8Array(fat),
    fatChange: new Uint8Array(fatChange),
    leanChange: new Uint8Array(leanChange),
  };
}

const srgbToLinear = (c: number) => Math.pow(c, 2.2);

export class BodyScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(28, 1, 0.05, 50);
  private group = new THREE.Group();
  private mesh?: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  private data?: Data;
  private colorAttr?: THREE.BufferAttribute;
  private lastColorKey = "";
  private baseRgb: [number, number, number] = [0.86, 0.84, 0.8];
  private hemi = new THREE.HemisphereLight(0xffffff, 0x8a8f99, 1.6);
  private key = new THREE.DirectionalLight(0xffffff, 2.2);
  private rim = new THREE.DirectionalLight(0x9fd4ff, 0);
  private cam = { target: new THREE.Vector3(0, 0, 0), distance: 3.2, shift: 0, pitch: 0, lift: 0 };
  motion: Motion = "fly";
  private autoYaw = 0;
  private yaw = 0;
  /** Extra turn from dragging, eased back to 0 when the user lets go. */
  dragYaw = 0;
  dragging = false;
  private width = 1;
  private height = 1;
  ready: Promise<void>;

  constructor(
    private canvas: HTMLCanvasElement,
    dataBase: string,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.key.position.set(1.5, 2.5, 3);
    this.rim.position.set(-2, 1.5, -2.5);
    const fill = new THREE.DirectionalLight(0xffffff, 0.6);
    fill.position.set(-2, 0.5, 2);
    this.scene.add(this.hemi, this.key, this.rim, fill, this.group);
    this.ready = load(dataBase).then((d) => this.build(d));
  }

  private build(d: Data) {
    this.data = d;
    const n = d.from.length / 3;
    // The app's mesh is in a left-handed space facing -z; flipping z makes it
    // face +z in three.js with left and right where they belong, and the
    // winding flips with it.
    const flip = (src: Float32Array) => {
      const out = new Float32Array(src.length);
      for (let i = 0; i < src.length; i += 3) {
        out[i] = src[i];
        out[i + 1] = src[i + 1];
        out[i + 2] = -src[i + 2];
      }
      return out;
    };
    const from = flip(d.from);
    const to = flip(d.to);
    const index = new Uint16Array(d.index.length);
    for (let i = 0; i < index.length; i += 3) {
      index[i] = d.index[i];
      index[i + 1] = d.index[i + 2];
      index[i + 2] = d.index[i + 1];
    }

    const geo = new THREE.BufferGeometry();
    geo.setIndex(new THREE.BufferAttribute(index, 1));
    geo.setAttribute("position", new THREE.BufferAttribute(from, 3));
    geo.computeVertexNormals();
    const fromNormals = geo.getAttribute("normal").array as Float32Array;

    const toGeo = new THREE.BufferGeometry();
    toGeo.setIndex(new THREE.BufferAttribute(index, 1));
    toGeo.setAttribute("position", new THREE.BufferAttribute(to, 3));
    toGeo.computeVertexNormals();
    const toNormals = toGeo.getAttribute("normal").array as Float32Array;

    const dp = new Float32Array(from.length);
    const dn = new Float32Array(from.length);
    for (let i = 0; i < from.length; i++) {
      dp[i] = to[i] - from[i];
      dn[i] = toNormals[i] - fromNormals[i];
    }
    geo.morphAttributes.position = [new THREE.BufferAttribute(dp, 3)];
    geo.morphAttributes.normal = [new THREE.BufferAttribute(dn, 3)];
    geo.morphTargetsRelative = true;

    this.colorAttr = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
    geo.setAttribute("color", this.colorAttr);
    geo.computeBoundingSphere();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.72,
      metalness: 0,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.morphTargetInfluences = [1];
    this.group.add(this.mesh);
  }

  /** Light or dark page: body tone and lights follow the theme. */
  setTheme(dark: boolean, cinematic = false) {
    const hex = dark ? 0xc9cdd4 : 0xe9e4dc;
    const c = new THREE.Color(hex);
    this.baseRgb = [srgbToLinear(c.r), srgbToLinear(c.g), srgbToLinear(c.b)];
    this.hemi.intensity = dark ? 1.1 : 1.6;
    this.hemi.groundColor.set(dark ? 0x30343c : 0x8a8f99);
    this.key.intensity = dark ? 2.4 : 2.2;
    this.rim.intensity = cinematic ? 4.5 : dark ? 2.2 : 0.4;
    this.hemi.intensity = cinematic ? 0.6 : this.hemi.intensity;
    this.renderer.toneMappingExposure = cinematic ? 1.25 : 1.05;
    this.lastColorKey = "";
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /** Where a body-space point lands on the canvas, in CSS pixels. */
  project(p: [number, number, number]): { x: number; y: number } {
    const v = new THREE.Vector3(...p);
    this.group.updateMatrixWorld();
    v.applyMatrix4(this.group.matrixWorld).project(this.camera);
    return { x: ((v.x + 1) / 2) * this.width, y: ((1 - v.y) / 2) * this.height };
  }

  /** Mean position of a mask slot, in body space (after the z flip). */
  centroid(slot: number): [number, number, number] {
    const d = this.data;
    if (!d) return [0, 0, 0];
    let x = 0;
    let y = 0;
    let z = 0;
    let w = 0;
    for (let v = 0; v < d.to.length / 3; v++) {
      const k = d.masks[v * SLOTS + slot];
      if (!k) continue;
      x += d.to[v * 3] * k;
      y += d.to[v * 3 + 1] * k;
      z -= d.to[v * 3 + 2] * k;
      w += k;
    }
    return w ? [x / w, y / w, z / w] : [0, 0, 0];
  }

  private paint(colors: Colors, focus: number[]) {
    const d = this.data;
    const attr = this.colorAttr;
    if (!d || !attr) return;
    const key = [colors.base, colors.fat, colors.fatChange, colors.leanChange, ...focus]
      .map((x) => x.toFixed(3))
      .join();
    if (key === this.lastColorKey) return;
    this.lastColorKey = key;
    const out = attr.array as Float32Array;
    const [br, bg, bb] = this.baseRgb;
    const anyFocus = focus.some((f) => f > 0.001);
    const focusMax = Math.max(...focus);
    const n = out.length / 3;
    for (let v = 0; v < n; v++) {
      const i = v * 3;
      let lit = 1;
      if (anyFocus) {
        let f = 0;
        for (let s = 0; s < SLOTS; s++) {
          if (focus[s]) f = Math.max(f, (focus[s] * d.masks[v * SLOTS + s]) / 255);
        }
        lit = 1 - 0.55 * focusMax * (1 - Math.min(1, f));
      }
      for (let j = 0; j < 3; j++) {
        const base = j === 0 ? br : j === 1 ? bg : bb;
        const c =
          colors.base * base +
          (colors.fat * d.fat[i + j] +
            colors.fatChange * d.fatChange[i + j] +
            colors.leanChange * d.leanChange[i + j]) /
            255;
        out[i + j] = c * lit;
      }
    }
    attr.needsUpdate = true;
  }

  /** Eases the camera and body toward `pose` and draws a frame. */
  frame(pose: Pose, dt: number, reducedMotion: boolean) {
    const ease = 1 - Math.exp(-dt * 5);
    this.cam.target.lerp(new THREE.Vector3(...pose.target), ease);
    this.cam.distance += (pose.distance - this.cam.distance) * ease;
    this.cam.shift += (pose.shift - this.cam.shift) * ease;
    this.cam.pitch += (pose.pitch - this.cam.pitch) * ease;
    this.cam.lift += (pose.lift - this.cam.lift) * ease;

    if (!reducedMotion) this.autoYaw += dt * 0.35 * pose.spin;
    // Hold yaw: steer the turning angle to the nearest copy of the pose's yaw.
    const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
    const held = this.autoYaw + wrap(pose.yaw - this.autoYaw) * (1 - pose.spin);
    this.autoYaw += (held - this.autoYaw) * ease;
    if (!this.dragging) this.dragYaw *= 1 - Math.min(1, dt * 1.5);
    this.yaw = this.autoYaw + this.dragYaw;

    const t = this.cam.target;
    const d = this.cam.distance;
    if (this.motion === "fly") {
      // The body stands still (drag still turns it); the camera orbits to the
      // stop's angle and swoops up or down to its height.
      this.group.rotation.y = this.dragYaw;
      this.group.position.set(0, 0, 0);
      const a = -this.autoYaw;
      const pitch = this.cam.pitch;
      this.camera.position.set(
        t.x + d * Math.cos(pitch) * Math.sin(a),
        t.y + d * Math.sin(pitch),
        t.z + d * Math.cos(pitch) * Math.cos(a),
      );
      this.camera.lookAt(t);
    } else {
      // The camera stays in front; the body turns and slides so the stop's
      // point comes to the middle of the view.
      this.group.rotation.y = this.yaw;
      const p = t.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      this.group.position.set(-p.x, -p.y, -p.z);
      this.camera.position.set(0, d * 0.06, d);
      this.camera.lookAt(0, 0, 0);
    }
    this.camera.setViewOffset(
      this.width,
      this.height,
      -this.cam.shift * this.width,
      this.cam.lift * this.height,
      this.width,
      this.height,
    );

    if (this.mesh?.morphTargetInfluences) this.mesh.morphTargetInfluences[0] = pose.morph;
    this.paint(pose.colors, pose.focus);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.mesh?.geometry.dispose();
    this.mesh?.material.dispose();
    this.renderer.dispose();
  }
}
