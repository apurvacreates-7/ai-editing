import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo } from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { clamp, clearness, T } from "./timeline";

const SMOG_SKY = new THREE.Color("#8a7c6a");
const CLEAR_SKY = new THREE.Color("#f3d3a4");

/* ------------------------------------------------------------------ */
/* Camera choreography                                                 */
/* ------------------------------------------------------------------ */
type Key = { f: number; pos: [number, number, number]; look: [number, number, number] };
const KEYS: Key[] = [
  { f: 0, pos: [0, 10, 40], look: [0, 5, -18] },
  { f: T.swoopStart, pos: [0, 6.5, 22], look: [0, 5, -18] },
  { f: T.swoopEnd, pos: [2.6, 1.9, 9], look: [0, 1.3, 1] },
  { f: 245, pos: [1.6, 1.55, 7.6], look: [0, 1.2, 2] },
  { f: 292, pos: [0.6, 1.3, 8.6], look: [0, 2.9, 2.4] },
  { f: 330, pos: [0, 2.2, 10.5], look: [0, 2.6, 0] },
  { f: T.endCard + 10, pos: [0, 4.2, 15], look: [0, 4, -12] },
];

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  useLayoutEffect(() => {
    const fs = KEYS.map((k) => k.f);
    const axis = (sel: (k: Key) => number) => clamp(frame, fs, KEYS.map(sel));
    camera.position.set(axis((k) => k.pos[0]), axis((k) => k.pos[1]), axis((k) => k.pos[2]));
    // Gentle handheld breathing
    camera.position.x += Math.sin(frame / 37) * 0.05;
    camera.position.y += Math.sin(frame / 29) * 0.03;
    camera.lookAt(axis((k) => k.look[0]), axis((k) => k.look[1]), axis((k) => k.look[2]));
    camera.updateProjectionMatrix();
  }, [frame, camera]);
  return null;
};

/* ------------------------------------------------------------------ */
/* Atmosphere: background + exponential fog that clears                 */
/* ------------------------------------------------------------------ */
const Atmosphere: React.FC = () => {
  const frame = useCurrentFrame();
  const { scene } = useThree();
  const fog = useMemo(() => new THREE.FogExp2(SMOG_SKY.clone(), 0.02), []);
  useLayoutEffect(() => {
    const c = clearness(frame);
    const col = SMOG_SKY.clone().lerp(CLEAR_SKY, c);
    scene.background = col;
    fog.color.copy(col);
    // Smog slowly thickens during the first act, then the Celine burst clears it
    const thick = interpolate(frame, [0, T.swoopStart, T.swoopEnd, T.burst], [0.016, 0.022, 0.045, 0.06], { extrapolateRight: "clamp" });
    fog.density = thick * (1 - c) + 0.012 * c;
    scene.fog = fog;
  }, [frame, scene, fog]);
  return null;
};

/* ------------------------------------------------------------------ */
/* City                                                                */
/* ------------------------------------------------------------------ */
const useWindowTexture = () =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 128;
    const g = c.getContext("2d")!;
    g.fillStyle = "#000";
    g.fillRect(0, 0, 64, 128);
    for (let y = 4; y < 128; y += 10) {
      for (let x = 4; x < 64; x += 10) {
        const lit = random(`w${x}-${y}`) > 0.55;
        g.fillStyle = lit ? "#ffcf8a" : "#1a1a1a";
        g.fillRect(x, y, 6, 6);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

const Buildings: React.FC = () => {
  const windows = useWindowTexture();
  const blocks = useMemo(() => {
    const out: { x: number; z: number; w: number; d: number; h: number; col: string }[] = [];
    const palette = ["#a39a8e", "#b8ab98", "#8f877c", "#c2b49e", "#9c9184"];
    let i = 0;
    for (let z = -70; z < 14; z += 5.5) {
      for (const side of [-1, 1]) {
        for (let k = 0; k < 5; k++) {
          const seed = `b${i++}`;
          const x = side * (8 + k * 6 + random(seed + "x") * 2.5);
          const h = 3 + random(seed + "h") * (k === 0 ? 5 : 11);
          out.push({
            x,
            z: z + random(seed + "z") * 2,
            w: 3 + random(seed + "w") * 2.4,
            d: 3 + random(seed + "d") * 2.4,
            h,
            col: palette[Math.floor(random(seed + "c") * palette.length)],
          });
        }
      }
    }
    // Skyline behind India Gate
    for (let x = -40; x < 40; x += 5) {
      const seed = `bb${x}`;
      out.push({ x, z: -52 - random(seed) * 10, w: 4, d: 4, h: 6 + random(seed + "h") * 14, col: "#9c9184" });
    }
    return out;
  }, []);

  return (
    <group>
      {blocks.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial
            color={b.col}
            roughness={0.9}
            emissive="#ffb866"
            emissiveMap={windows}
            emissiveIntensity={0.35}
          />
        </mesh>
      ))}
    </group>
  );
};

const SANDSTONE = "#c79a72";
const IndiaGate: React.FC = () => (
  <group position={[0, 0, -18]}>
    {/* plinth */}
    <mesh position={[0, 0.25, 0]}>
      <boxGeometry args={[9, 0.5, 3.6]} />
      <meshStandardMaterial color="#b58c68" roughness={0.85} />
    </mesh>
    {/* piers */}
    {[-2.45, 2.45].map((x) => (
      <mesh key={x} position={[x, 3.6, 0]}>
        <boxGeometry args={[2.3, 6.2, 2.8]} />
        <meshStandardMaterial color={SANDSTONE} roughness={0.8} />
      </mesh>
    ))}
    {/* arch */}
    <mesh position={[0, 5.2, 0]}>
      <torusGeometry args={[1.3, 0.45, 12, 32, Math.PI]} />
      <meshStandardMaterial color={SANDSTONE} roughness={0.8} />
    </mesh>
    <mesh position={[0, 6.35, 0]}>
      <boxGeometry args={[2.8, 0.9, 2.8]} />
      <meshStandardMaterial color={SANDSTONE} roughness={0.8} />
    </mesh>
    {/* cornice + attic */}
    <mesh position={[0, 7.2, 0]}>
      <boxGeometry args={[7.6, 0.6, 3.1]} />
      <meshStandardMaterial color="#b98d67" roughness={0.8} />
    </mesh>
    <mesh position={[0, 8.2, 0]}>
      <boxGeometry args={[5.6, 1.4, 2.6]} />
      <meshStandardMaterial color={SANDSTONE} roughness={0.8} />
    </mesh>
    <mesh position={[0, 9.2, 0]}>
      <boxGeometry args={[3.6, 0.6, 2.0]} />
      <meshStandardMaterial color="#b98d67" roughness={0.8} />
    </mesh>
    <mesh position={[0, 9.75, 0]}>
      <cylinderGeometry args={[0.9, 1.1, 0.5, 24]} />
      <meshStandardMaterial color={SANDSTONE} roughness={0.8} />
    </mesh>
  </group>
);

const Street: React.FC = () => {
  const frame = useCurrentFrame();
  const c = clearness(frame);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#7d7466" roughness={1} />
      </mesh>
      {/* Rajpath avenue */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -20]}>
        <planeGeometry args={[7, 90]} />
        <meshStandardMaterial color="#4a4640" roughness={0.95} />
      </mesh>
      {/* Lawns that turn greener as the air clears */}
      {[-5.5, 5.5].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, -20]}>
          <planeGeometry args={[4, 90]} />
          <meshStandardMaterial color={new THREE.Color("#6e7457").lerp(new THREE.Color("#5f9a45"), c)} roughness={1} />
        </mesh>
      ))}
      {/* Street lamps */}
      {Array.from({ length: 12 }).map((_, i) => {
        const z = 8 - i * 6;
        return [-3.8, 3.8].map((x) => (
          <group key={`${i}${x}`} position={[x, 0, z]}>
            <mesh position={[0, 1.6, 0]}>
              <cylinderGeometry args={[0.05, 0.07, 3.2, 8]} />
              <meshStandardMaterial color="#2f2f33" />
            </mesh>
            <mesh position={[0, 3.25, 0]}>
              <sphereGeometry args={[0.16, 12, 12]} />
              <meshStandardMaterial color="#ffd9a0" emissive="#ffb35c" emissiveIntensity={2.2 * (1 - c) + 0.3} />
            </mesh>
          </group>
        ));
      })}
    </group>
  );
};

const Sun: React.FC = () => {
  const frame = useCurrentFrame();
  const c = clearness(frame);
  return (
    <mesh position={[-14, 16 + c * 4, -75]}>
      <sphereGeometry args={[4.5, 32, 32]} />
      <meshBasicMaterial color={new THREE.Color("#d9a878").lerp(new THREE.Color("#fff1c8"), c)} />
    </mesh>
  );
};

/* ------------------------------------------------------------------ */
/* Smog particles                                                      */
/* ------------------------------------------------------------------ */
const useSoftDot = () =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);

const Smog: React.FC = () => {
  const frame = useCurrentFrame();
  const dot = useSoftDot();
  const geo = useMemo(() => {
    const n = 2200;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      p[i * 3] = (random(`sx${i}`) - 0.5) * 50;
      p[i * 3 + 1] = random(`sy${i}`) * 12;
      p[i * 3 + 2] = -45 + random(`sz${i}`) * 62;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  const c = clearness(frame);
  // Blast outward from the tablet
  const push = clamp(frame, [T.burst, T.clearEnd], [1, 4]);
  return (
    <group position={[0, 2.5, 2.4]} scale={push}>
      <points geometry={geo} position={[Math.sin(frame / 60) * 0.8 + frame * 0.01, -2.5, -2.4]}>
        <pointsMaterial
          map={dot}
          size={0.9}
          color="#b3a48c"
          transparent
          opacity={0.5 * (1 - c)}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Family: mother + child, masks on, walking through the haze          */
/* ------------------------------------------------------------------ */
const SKIN = "#b87a55";
const Person: React.FC<{
  scale: number;
  body: string;
  hair: string;
  phase: number;
  walk: number;
  slump: number;
  lookUp: number;
  cough?: number;
}> = ({ scale, body, hair, phase, walk, slump, lookUp, cough = 0 }) => {
  const frame = useCurrentFrame();
  const t = frame / 7 + phase;
  const swing = Math.sin(t) * 0.5 * walk;
  const bob = Math.abs(Math.sin(t)) * 0.04 * walk;
  const headPitch = slump * 0.35 - lookUp * 0.45 + cough * 0.3;
  return (
    <group scale={scale} position={[0, bob, 0]} rotation={[slump * 0.12 + cough * 0.15, 0, 0]}>
      {/* legs */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.11, 0.45, 0]} rotation={[s * swing, 0, 0]}>
          <capsuleGeometry args={[0.08, 0.6, 4, 8]} />
          <meshStandardMaterial color="#3b3b44" roughness={0.8} />
        </mesh>
      ))}
      {/* torso */}
      <mesh position={[0, 1.15, 0]}>
        <capsuleGeometry args={[0.24, 0.55, 6, 14]} />
        <meshStandardMaterial color={body} roughness={0.7} />
      </mesh>
      {/* arms */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.3, 1.1, 0]} rotation={[-s * swing * 0.8, 0, s * 0.12]}>
          <capsuleGeometry args={[0.065, 0.5, 4, 8]} />
          <meshStandardMaterial color={body} roughness={0.7} />
        </mesh>
      ))}
      {/* head */}
      <group position={[0, 1.72, 0]} rotation={[headPitch, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.2, 24, 24]} />
          <meshStandardMaterial color={SKIN} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.05, -0.03]} scale={[1.05, 1, 1.05]}>
          <sphereGeometry args={[0.2, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={hair} roughness={0.9} />
        </mesh>
        {/* eyes */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.07, 0.03, 0.18]}>
            <sphereGeometry args={[0.025, 10, 10]} />
            <meshStandardMaterial color="#1a120d" roughness={0.3} />
          </mesh>
        ))}
        {/* pollution mask */}
        <mesh position={[0, -0.06, 0.15]} scale={[1, 0.7, 0.5]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color="#e9eef2" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
};

const Family: React.FC = () => {
  const frame = useCurrentFrame();
  const z = clamp(frame, [T.walkStart, T.burst + 10], [-3.5, 2.1]);
  const walk = clamp(frame, [T.walkStart, T.walkStart + 10, T.burst - 5, T.burst + 12], [0, 1, 1, 0]);
  const slump = 1 - clamp(frame, [T.burst, T.burst + 45], [0, 1]);
  const lookUp = clamp(frame, [T.tabletAppear + 15, T.burst], [0, 1]) * (1 - clamp(frame, [340, 380], [0, 0.6]));
  // Child coughs twice around 6.3s
  const cough =
    Math.max(0, Math.sin(((frame - 188) / 8) * Math.PI)) * (frame > 188 && frame < 204 ? 1 : 0);
  return (
    <group position={[0, 0, z]}>
      <group position={[-0.35, 0, 0]}>
        <Person scale={1} body="#8e2b3a" hair="#1b1411" phase={0} walk={walk} slump={slump} lookUp={lookUp} />
      </group>
      <group position={[0.35, 0, 0.05]}>
        <Person scale={0.66} body="#e2a93b" hair="#231a14" phase={Math.PI} walk={walk} slump={slump} lookUp={lookUp} cough={cough} />
      </group>
      {/* joined hands */}
      <mesh position={[0.02, 0.82, 0.05]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.05, 0.28, 4, 8]} />
        <meshStandardMaterial color={SKIN} />
      </mesh>
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Celine tablet + immunity burst                                      */
/* ------------------------------------------------------------------ */
export const useTabletGeometry = () =>
  useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const r = 0.5;
    const h = 0.11;
    const bev = 0.08;
    pts.push(new THREE.Vector2(0, -h - 0.03));
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI;
      pts.push(new THREE.Vector2(r - bev + Math.cos(a) * bev, Math.sin(a) * (h + bev * 0.4) * 0.9));
    }
    pts.push(new THREE.Vector2(0, h + 0.03));
    return new THREE.LatheGeometry(pts, 48);
  }, []);

const Tablet: React.FC = () => {
  const frame = useCurrentFrame();
  const geo = useTabletGeometry();
  if (frame < T.tabletAppear) return null;
  const y = clamp(frame, [T.tabletAppear, T.burst], [7.5, 3.1]);
  const spin = frame / 14;
  const glow = clamp(frame, [T.tabletAppear, T.burst, T.burst + 20, T.clearEnd], [0.6, 2.5, 4, 1.2]);
  const shrink = clamp(frame, [T.clearEnd, T.endCard], [1, 0.001]);
  return (
    <group position={[0, y + Math.sin(frame / 12) * 0.05, 2.4]} scale={0.8 * shrink}>
      <mesh geometry={geo} rotation={[Math.PI / 2.4, spin, 0.2]}>
        <meshStandardMaterial color="#f7931e" emissive="#ff7a00" emissiveIntensity={glow * 0.35} roughness={0.35} metalness={0.05} />
      </mesh>
      <pointLight color="#ffa24a" intensity={glow * 12} distance={14} decay={1.6} />
      {/* halo */}
      <mesh>
        <sphereGeometry args={[0.65 + glow * 0.06, 32, 32]} />
        <meshBasicMaterial color="#ffb347" transparent opacity={0.08 + glow * 0.03} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
};

const Burst: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.burst - 2 || frame > T.burst + 60) return null;
  const s = clamp(frame, [T.burst - 2, T.burst + 55], [0.3, 38]);
  const o = clamp(frame, [T.burst - 2, T.burst + 8, T.burst + 55], [0.0, 0.55, 0]);
  return (
    <mesh position={[0, 3.1, 2.4]} scale={s}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshBasicMaterial color="#ffb54d" transparent opacity={o} side={THREE.DoubleSide} depthWrite={false} fog={false} />
    </mesh>
  );
};

const Shield: React.FC = () => {
  const frame = useCurrentFrame();
  const grow = clamp(frame, [T.burst + 4, T.burst + 30], [0, 1]);
  if (grow <= 0) return null;
  const fade = 1 - clamp(frame, [T.clearEnd + 5, T.endCard + 5], [0, 1]);
  const pulse = 1 + Math.sin(frame / 8) * 0.015;
  const z = 2.1;
  return (
    <group position={[0, 0, z]} scale={grow * pulse * 1.9}>
      <mesh>
        <sphereGeometry args={[1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#ffb14a"
          emissive="#ff8a1e"
          emissiveIntensity={0.6}
          transparent
          opacity={0.16 * fade}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.005, 3]} />
        <meshBasicMaterial color="#ffd08a" wireframe transparent opacity={0.22 * fade} depthWrite={false} />
      </mesh>
    </group>
  );
};

/* ------------------------------------------------------------------ */
export const CityScene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = clearness(frame);
  return (
    <>
      <CameraRig />
      <Atmosphere />
      <hemisphereLight args={["#e9d6bb", "#4d4438", 0.9 + c * 0.6]} />
      <directionalLight position={[-12, 18, -20]} intensity={0.5 + c * 2.2} color={new THREE.Color("#c9b49a").lerp(new THREE.Color("#ffe2b0"), c)} />
      <ambientLight intensity={0.25} />
      <Sun />
      <Street />
      <Buildings />
      <IndiaGate />
      <Family />
      <Smog />
      <Shield />
      <Tablet />
      <Burst />
    </>
  );
};
