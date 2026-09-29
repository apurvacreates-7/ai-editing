import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";
import { useTabletGeometry } from "./CityScene";
import { SANS, SERIF } from "./fonts";
import { clamp, T } from "./timeline";

const ORANGE = "#f47b20";
const DEEP = "#b8420b";

const makeFront = () => {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 960;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fffaf3";
  g.fillRect(0, 0, 640, 960);
  // Citrus sun graphic
  const grd = g.createRadialGradient(470, 250, 20, 470, 250, 230);
  grd.addColorStop(0, "#ffd27a");
  grd.addColorStop(0.55, "#ffa23a");
  grd.addColorStop(1, "rgba(255,162,58,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 640, 600);
  g.strokeStyle = "rgba(255,255,255,0.8)";
  g.lineWidth = 6;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.beginPath();
    g.moveTo(470, 250);
    g.lineTo(470 + Math.cos(a) * 110, 250 + Math.sin(a) * 110);
    g.stroke();
  }
  g.beginPath();
  g.arc(470, 250, 110, 0, Math.PI * 2);
  g.stroke();
  // Brand block
  g.fillStyle = ORANGE;
  g.fillRect(0, 520, 640, 300);
  g.fillStyle = "#ffffff";
  g.font = `700 150px ${SERIF}`;
  g.fillText("Celine", 44, 690);
  g.font = `600 44px ${SANS}`;
  g.fillText("VITAMIN C TABLETS", 50, 770);
  g.fillStyle = DEEP;
  g.font = `600 34px ${SANS}`;
  g.fillText("Daily Immunity Support", 50, 480);
  g.fillStyle = "#6b4a33";
  g.font = `500 30px ${SANS}`;
  g.fillText("RV LIFE SCIENCES", 50, 900);
  g.fillStyle = ORANGE;
  g.beginPath();
  g.arc(58, 120, 26, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#fff";
  g.font = `800 34px ${SANS}`;
  g.fillText("C", 46, 132);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

const makeSide = () => {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 960;
  const g = c.getContext("2d")!;
  g.fillStyle = ORANGE;
  g.fillRect(0, 0, 256, 960);
  g.save();
  g.translate(160, 820);
  g.rotate(-Math.PI / 2);
  g.fillStyle = "#fff";
  g.font = `700 110px ${SERIF}`;
  g.fillText("Celine", 0, 0);
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

const Pack: React.FC = () => {
  const frame = useCurrentFrame();
  const mats = useMemo(() => {
    const front = new THREE.MeshStandardMaterial({ map: makeFront(), roughness: 0.45 });
    const side = new THREE.MeshStandardMaterial({ map: makeSide(), roughness: 0.45 });
    const plain = new THREE.MeshStandardMaterial({ color: ORANGE, roughness: 0.45 });
    // +x, -x, +y, -y, +z, -z
    return [side, side, plain, plain, front, front];
  }, []);
  const local = frame - T.endCard;
  const rise = clamp(local, [0, 40], [-1.2, 0]);
  const yaw = clamp(local, [0, 60], [-0.9, -0.28]) + Math.sin(local / 30) * 0.04;
  return (
    <mesh material={mats} position={[0, 0.35 + rise, 0]} rotation={[0.04, yaw, 0]}>
      <boxGeometry args={[2.0, 3.0, 0.8]} />
    </mesh>
  );
};

const FloatingTablets: React.FC = () => {
  const frame = useCurrentFrame();
  const geo = useTabletGeometry();
  const local = frame - T.endCard;
  const items: [number, number, number, number][] = [
    [1.65, 1.5, 0.6, 0],
    [-1.6, -0.6, 0.7, 1.7],
    [1.4, -1.25, 1.0, 3.1],
  ];
  return (
    <>
      {items.map(([x, y, z, p], i) => {
        const inT = clamp(local, [10 + i * 6, 45 + i * 6], [0, 1]);
        return (
          <mesh
            key={i}
            geometry={geo}
            position={[x, y + Math.sin(local / 20 + p) * 0.1, z]}
            rotation={[1.1 + Math.sin(local / 25 + p) * 0.3, local / 40 + p, 0.3]}
            scale={0.55 * inT}
          >
            <meshStandardMaterial color="#f7931e" emissive="#ff7a00" emissiveIntensity={0.25} roughness={0.35} />
          </mesh>
        );
      })}
    </>
  );
};

export const ProductScene: React.FC = () => {
  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight position={[2, 3, 8]} intensity={2.6} color="#fff6ea" />
      <directionalLight position={[-5, 2, -3]} intensity={1.4} color="#ffb060" />
      <group position={[0, -0.2, 0]}>
        <Pack />
        <FloatingTablets />
      </group>
    </>
  );
};
