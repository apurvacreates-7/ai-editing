import {add, dirDown, dirUp, ik2, scale, Vec} from '../../lib/geometry';
import {frac, lerp as lerpN} from '../../lib/motion';

/**
 * A minimal 2D skeleton for flat-vector figures in profile, facing +x.
 * Local origin is on the ground under the hips; SVG y points down.
 * Proportions follow a realistic ~7.5-heads adult.
 */
export type Build = {
  H: number;
  hip: number;
  thigh: number;
  shin: number;
  ankle: number;
  foot: number;
  torso: number;
  neck: number;
  head: number;
  upperArm: number;
  forearm: number;
  hand: number;
  thighR: [number, number];
  shinR: [number, number];
  upperArmR: [number, number];
  forearmR: [number, number];
};

export const makeBuild = (H: number, o: Partial<Build> = {}): Build => ({
  H,
  hip: 0.535 * H,
  thigh: 0.245 * H,
  shin: 0.245 * H,
  ankle: 0.045 * H,
  foot: 0.13 * H,
  torso: 0.295 * H,
  neck: 0.045 * H,
  head: 0.13 * H,
  upperArm: 0.18 * H,
  forearm: 0.15 * H,
  hand: 0.07 * H,
  thighR: [0.05 * H, 0.037 * H],
  shinR: [0.035 * H, 0.026 * H],
  upperArmR: [0.033 * H, 0.027 * H],
  forearmR: [0.027 * H, 0.021 * H],
  ...o,
});

export type Foot = {x: number; y: number; angle: number};
export type Arm = {shoulder: number; elbow: number};

export type Pose = {
  hip: Vec;
  /** torso lean in degrees, + forward */
  lean: number;
  /** head tilt relative to torso, + forward/down */
  headTilt: number;
  nearFoot: Foot;
  farFoot: Foot;
  /** global arm angles: 0 hangs straight down, + swings forward; elbow flex rotates the forearm forward */
  nearArm: Arm;
  farArm: Arm;
  /** optional IK targets for the hands (override the angles) */
  nearHand?: Vec | null;
  farHand?: Vec | null;
  shrug: number;
};

export type Gait = {
  stride: number;
  lift: number;
  armSwing: number;
  elbow: number;
  lean: number;
  stance?: number;
};

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Foot-planted walk cycle. During stance the ankle slides back at constant
 * speed (so a ground scrolling at `walkSpeed` keeps the foot locked);
 * during swing it arcs forward. Hip height is solved from the stance legs.
 */
export const walkPose = (B: Build, phase: number, amount: number, g: Gait): Pose => {
  const a = Math.max(0, Math.min(1, amount));
  const S = g.stride * a;
  const stance = g.stance ?? 0.62;
  const H = B.H;
  const standX = {near: 0.018 * H, far: -0.022 * H};

  const leg = (offset: number, standOffset: number): Foot & {planted: boolean} => {
    const p = frac(phase + offset);
    let x: number;
    let lift = 0;
    let angle = 0;
    let planted = true;
    if (p < stance) {
      const q = p / stance;
      x = S * (0.5 - q);
      if (q < 0.12) angle = -9 * (1 - q / 0.12);
      else if (q > 0.78) angle = 24 * ((q - 0.78) / 0.22);
    } else {
      planted = false;
      const q = (p - stance) / (1 - stance);
      x = S * (-0.5 + smooth(q));
      lift = g.lift * a * Math.sin(Math.PI * q);
      angle = 24 * (1 - q) * (1 - q) - 9 * q * q;
    }
    x += standOffset * (1 - a);
    return {x, y: -B.ankle - lift, angle: angle * a, planted};
  };

  const near = leg(0, standX.near);
  const far = leg(0.5, standX.far);
  const reach = (B.thigh + B.shin) * 0.992;
  let hipH = B.hip;
  for (const f of [near, far]) {
    if (!f.planted) continue;
    const dx = f.x;
    const h = Math.sqrt(Math.max(0, reach * reach - dx * dx)) + B.ankle;
    hipH = Math.min(hipH, h);
  }
  const half = Math.max(1, S / 2);
  const armN = -g.armSwing * Math.max(-1, Math.min(1, near.x / half)) * a;
  const armF = -g.armSwing * Math.max(-1, Math.min(1, far.x / half)) * a;
  return {
    hip: {x: 0, y: -hipH},
    lean: g.lean + 1.2 * a * Math.sin(phase * Math.PI * 4),
    headTilt: 0,
    nearFoot: {x: near.x, y: near.y, angle: near.angle},
    farFoot: {x: far.x, y: far.y, angle: far.angle},
    nearArm: {shoulder: armN, elbow: g.elbow + 12 * Math.max(0, armN / Math.max(1, g.armSwing))},
    farArm: {shoulder: armF, elbow: g.elbow + 12 * Math.max(0, armF / Math.max(1, g.armSwing))},
    nearHand: null,
    farHand: null,
    shrug: 0,
  };
};

/** Ground speed (px per frame) that keeps the stance foot planted. */
export const walkSpeed = (g: Gait, cycleFrames: number) => g.stride / ((g.stance ?? 0.62) * cycleFrames);

const lerpFoot = (a: Foot, b: Foot, t: number): Foot => ({
  x: lerpN(a.x, b.x, t),
  y: lerpN(a.y, b.y, t),
  angle: lerpN(a.angle, b.angle, t),
});
const lerpArm = (a: Arm, b: Arm, t: number): Arm => ({
  shoulder: lerpN(a.shoulder, b.shoulder, t),
  elbow: lerpN(a.elbow, b.elbow, t),
});

/** Blend two poses (t = 0 gives a). IK hand targets are blended if both exist. */
export const blendPose = (a: Pose, b: Pose, t: number): Pose => {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const hand = (x?: Vec | null, y?: Vec | null) => (x && y ? {x: lerpN(x.x, y.x, t), y: lerpN(x.y, y.y, t)} : t < 0.5 ? x ?? null : y ?? null);
  return {
    hip: {x: lerpN(a.hip.x, b.hip.x, t), y: lerpN(a.hip.y, b.hip.y, t)},
    lean: lerpN(a.lean, b.lean, t),
    headTilt: lerpN(a.headTilt, b.headTilt, t),
    nearFoot: lerpFoot(a.nearFoot, b.nearFoot, t),
    farFoot: lerpFoot(a.farFoot, b.farFoot, t),
    nearArm: lerpArm(a.nearArm, b.nearArm, t),
    farArm: lerpArm(a.farArm, b.farArm, t),
    nearHand: hand(a.nearHand, b.nearHand),
    farHand: hand(a.farHand, b.farHand),
    shrug: lerpN(a.shrug, b.shrug, t),
  };
};

export type Limb = {root: Vec; mid: Vec; end: Vec; endAngle: number};

export type Joints = {
  hip: Vec;
  shoulder: Vec;
  neckBase: Vec;
  headC: Vec;
  headAngle: number;
  lean: number;
  nearLeg: Limb;
  farLeg: Limb;
  nearArm: Limb;
  farArm: Limb;
};

const armLimb = (B: Build, shoulder: Vec, arm: Arm, target?: Vec | null): Limb => {
  if (target) {
    const elbow = ik2(shoulder, target, B.upperArm, B.forearm, -1);
    const dx = target.x - elbow.x;
    const dy = target.y - elbow.y;
    return {root: shoulder, mid: elbow, end: target, endAngle: (Math.atan2(dx, dy) * 180) / Math.PI};
  }
  const elbow = add(shoulder, scale(dirDown(arm.shoulder), B.upperArm));
  const fa = arm.shoulder + arm.elbow;
  const wrist = add(elbow, scale(dirDown(fa), B.forearm));
  return {root: shoulder, mid: elbow, end: wrist, endAngle: fa};
};

export const solve = (B: Build, pose: Pose): Joints => {
  const hip = pose.hip;
  const shoulder = add(add(hip, scale(dirUp(pose.lean), B.torso)), {x: 0, y: -pose.shrug});
  const neckBase = add(shoulder, scale(dirUp(pose.lean + pose.headTilt * 0.3), B.neck * 0.35));
  const headAngle = pose.lean + pose.headTilt;
  const headC = add(shoulder, scale(dirUp(pose.lean + pose.headTilt * 0.5), B.neck + B.head * 0.5));
  const legLimb = (f: Foot): Limb => {
    const ankle = {x: f.x, y: f.y};
    const knee = ik2(hip, ankle, B.thigh, B.shin, 1);
    return {root: hip, mid: knee, end: ankle, endAngle: f.angle};
  };
  return {
    hip,
    shoulder,
    neckBase,
    headC,
    headAngle,
    lean: pose.lean,
    nearLeg: legLimb(pose.nearFoot),
    farLeg: legLimb(pose.farFoot),
    nearArm: armLimb(B, shoulder, pose.nearArm, pose.nearHand),
    farArm: armLimb(B, shoulder, pose.farArm, pose.farHand),
  };
};

/** Point in torso space (x forward, y up from the hip, in units of H) to local figure space. */
export const torsoPoint = (B: Build, j: Joints, x: number, y: number): Vec => {
  const up = dirUp(j.lean);
  const fwd = {x: -up.y, y: up.x};
  return {x: j.hip.x + (fwd.x * x + up.x * y) * B.H, y: j.hip.y + (fwd.y * x + up.y * y) * B.H};
};

/** Point in head space (x forward, y down, units of head height) to local figure space. */
export const headPoint = (B: Build, j: Joints, x: number, y: number): Vec => {
  const r = (j.headAngle * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const hx = x * B.head;
  const hy = y * B.head;
  return {x: j.headC.x + hx * cos - hy * sin, y: j.headC.y + hx * sin + hy * cos};
};
