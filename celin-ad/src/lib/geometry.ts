export type Vec = {x: number; y: number};

export const v = (x: number, y: number): Vec => ({x, y});
export const add = (a: Vec, b: Vec): Vec => ({x: a.x + b.x, y: a.y + b.y});
export const sub = (a: Vec, b: Vec): Vec => ({x: a.x - b.x, y: a.y - b.y});
export const scale = (a: Vec, s: number): Vec => ({x: a.x * s, y: a.y * s});
export const len = (a: Vec) => Math.hypot(a.x, a.y);
export const lerpV = (a: Vec, b: Vec, t: number): Vec => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
export const rad = (deg: number) => (deg * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;

/**
 * Unit vector for a limb angle in degrees: 0 points straight down,
 * positive angles swing forward (+x). SVG y points down.
 */
export const dirDown = (angleDeg: number): Vec => ({x: Math.sin(rad(angleDeg)), y: Math.cos(rad(angleDeg))});
/** Unit vector for a torso angle: 0 points straight up, positive leans forward. */
export const dirUp = (angleDeg: number): Vec => ({x: Math.sin(rad(angleDeg)), y: -Math.cos(rad(angleDeg))});

/** Angle (deg) of a vector measured like dirDown (0 = down, + = forward). */
export const angleDown = (a: Vec) => deg(Math.atan2(a.x, a.y));

export const rotateAround = (p: Vec, c: Vec, angleDeg: number): Vec => {
  const r = rad(angleDeg);
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return {x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos};
};

const f = (n: number) => (Math.round(n * 100) / 100).toString();

/**
 * Closed outline of two circles joined by their outer tangents
 * (a tapered limb segment with round ends).
 */
export const capsule = (a: Vec, ra: number, b: Vec, rb: number): string => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  if (d <= Math.abs(ra - rb) + 0.01) {
    const c = ra >= rb ? a : b;
    const r = Math.max(ra, rb);
    return `M${f(c.x - r)},${f(c.y)}a${f(r)},${f(r)} 0 1,0 ${f(2 * r)},0a${f(r)},${f(r)} 0 1,0 ${f(-2 * r)},0Z`;
  }
  const th = Math.atan2(dy, dx);
  const phi = Math.acos((ra - rb) / d);
  const p = (c: Vec, r: number, ang: number) => ({x: c.x + r * Math.cos(ang), y: c.y + r * Math.sin(ang)});
  const a1 = p(a, ra, th + phi);
  const b1 = p(b, rb, th + phi);
  const b2 = p(b, rb, th - phi);
  const a2 = p(a, ra, th - phi);
  const largeB = 2 * phi > Math.PI ? 1 : 0;
  const largeA = 2 * Math.PI - 2 * phi > Math.PI ? 1 : 0;
  return (
    `M${f(a1.x)},${f(a1.y)}L${f(b1.x)},${f(b1.y)}` +
    `A${f(rb)},${f(rb)} 0 ${largeB},0 ${f(b2.x)},${f(b2.y)}` +
    `L${f(a2.x)},${f(a2.y)}` +
    `A${f(ra)},${f(ra)} 0 ${largeA},0 ${f(a1.x)},${f(a1.y)}Z`
  );
};

/**
 * Two-bone inverse kinematics. Returns the middle joint.
 * `bend` = +1 puts the joint on the +x side of the root->target line (knees
 * for a figure facing +x), -1 on the other side (elbows).
 */
export const ik2 = (root: Vec, target: Vec, l1: number, l2: number, bend: 1 | -1): Vec => {
  const dx = target.x - root.x;
  const dy = target.y - root.y;
  let d = Math.hypot(dx, dy);
  const maxD = l1 + l2 - 0.001;
  const minD = Math.abs(l1 - l2) + 0.001;
  d = Math.max(minD, Math.min(maxD, d));
  const base = Math.atan2(dy, dx);
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const a = Math.acos(Math.max(-1, Math.min(1, cosA)));
  // candidate angles
  const c1 = base + a;
  const c2 = base - a;
  const j1 = {x: root.x + l1 * Math.cos(c1), y: root.y + l1 * Math.sin(c1)};
  const j2 = {x: root.x + l1 * Math.cos(c2), y: root.y + l1 * Math.sin(c2)};
  // signed side relative to the root->target direction
  const side = (j: Vec) => (dx * (j.y - root.y) - dy * (j.x - root.x));
  // For a limb pointing down (dy > 0), a joint on the +x side has side < 0.
  const wantPlusX = bend === 1;
  const s1 = side(j1);
  const pick = (s1 < 0) === wantPlusX ? j1 : j2;
  return pick;
};

/** Smooth closed/open path through points (Catmull-Rom converted to cubic Beziers). */
export const smoothPath = (pts: Vec[], closed = true, tension = 1): string => {
  const n = pts.length;
  if (n < 2) return '';
  const get = (i: number) => {
    if (closed) return pts[(i + n) % n];
    return pts[Math.max(0, Math.min(n - 1, i))];
  };
  let d = `M${f(pts[0].x)},${f(pts[0].y)}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const t = tension / 6;
    const c1 = {x: p1.x + (p2.x - p0.x) * t, y: p1.y + (p2.y - p0.y) * t};
    const c2 = {x: p2.x - (p3.x - p1.x) * t, y: p2.y - (p3.y - p1.y) * t};
    d += `C${f(c1.x)},${f(c1.y)} ${f(c2.x)},${f(c2.y)} ${f(p2.x)},${f(p2.y)}`;
  }
  return closed ? d + 'Z' : d;
};

/** Polygon path (straight segments). */
export const polyPath = (pts: Vec[], closed = true): string =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${f(p.x)},${f(p.y)}`).join('') + (closed ? 'Z' : '');

export const fmt = f;
