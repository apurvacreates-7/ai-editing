import {Easing} from 'remotion';
import {TIMING} from '../../config';
import {Vec} from '../../lib/geometry';
import {EASE, impulse, keys, tween} from '../../lib/motion';
import {C} from '../../theme';
import {Outfit} from './Person';
import {blendPose, Build, Gait, headPoint, Joints, makeBuild, Pose, solve, walkPose} from './rig';

/** Ground speed of the tracking shot at full walk (px per frame). */
export const WALK_SPEED = 10;
const STANCE = 0.62;

export type Actor = {
  id: string;
  B: Build;
  gait: Gait;
  outfit: Outfit;
  /** screen position of the ground point under the hips */
  x: number;
  y: number;
  /** -1 faces left (mirrored) */
  facing: 1 | -1;
  phaseOffset: number;
};

const mk = (H: number, stride: number, rest: Omit<Gait, 'stride'>) => ({B: makeBuild(H), gait: {stride: stride * H, ...rest}});

const youngManB = mk(612, 0.34, {lift: 0.05 * 612, armSwing: 20, elbow: 16, lean: 3, stance: STANCE});
const olderManB = mk(586, 0.29, {lift: 0.034 * 586, armSwing: 12, elbow: 14, lean: 7, stance: STANCE});
const motherB = mk(568, 0.31, {lift: 0.04 * 568, armSwing: 13, elbow: 14, lean: 2, stance: STANCE});
const childB = mk(392, 0.37, {lift: 0.05 * 392, armSwing: 18, elbow: 20, lean: 2, stance: STANCE});
const womanB = mk(628, 0.34, {lift: 0.045 * 628, armSwing: 16, elbow: 16, lean: 2, stance: STANCE});

export const ACTORS = {
  youngMan: {
    id: 'youngMan',
    ...youngManB,
    x: 462,
    y: 1598,
    facing: -1,
    phaseOffset: 0.1,
    outfit: {
      skin: C.skin[0],
      hair: C.hair,
      hairStyle: 'short',
      top: '#56606F',
      topStyle: 'hoodie',
      sleeve: '#56606F',
      cuff: '#4A5361',
      bottoms: '#343B48',
      shoes: '#E9E3D6',
    },
  },
  olderMan: {
    id: 'olderMan',
    ...olderManB,
    x: 686,
    y: 1588,
    facing: -1,
    phaseOffset: 0.55,
    outfit: {
      skin: C.skin[1],
      hair: C.greyHair,
      hairStyle: 'receding',
      top: '#E6DDCB',
      topStyle: 'kurta',
      hem: 0.3,
      sleeve: '#E6DDCB',
      bottoms: '#EFEBE2',
      loose: 1.28,
      shoes: '#5A4636',
      jacket: '#454B56',
      muffler: {color: '#8E9299', stripe: '#CDBE9F'},
      glasses: '#2E3440',
    },
  },
  mother: {
    id: 'mother',
    ...motherB,
    x: 890,
    y: 1592,
    facing: -1,
    phaseOffset: 0.3,
    outfit: {
      skin: C.skin[2],
      hair: C.hair,
      hairStyle: 'bun',
      top: '#A48E78',
      topStyle: 'kameez',
      hem: 0.33,
      sleeve: '#A48E78',
      bottoms: '#EDE7DB',
      loose: 1.32,
      shoes: '#4B4039',
      dupatta: '#C9C6BF',
    },
  },
  child: {
    id: 'child',
    ...childB,
    x: 986,
    y: 1604,
    facing: -1,
    phaseOffset: 0.75,
    outfit: {
      skin: C.skin[3],
      hair: C.hair,
      hairStyle: 'child',
      top: '#6C7486',
      topStyle: 'sweater',
      sleeve: '#6C7486',
      cuff: '#5E6677',
      bottoms: '#3B4150',
      shoes: '#2E3440',
      bag: '#C4AE88',
    },
  },
  woman: {
    id: 'woman',
    ...womanB,
    x: 138,
    y: 1648,
    facing: 1,
    phaseOffset: 0,
    outfit: {
      skin: C.skin[4],
      hair: C.hair,
      hairStyle: 'ponytail',
      top: '#F1ECE2',
      topStyle: 'shortKurta',
      hem: 0.43,
      sleeve: '#F1ECE2',
      bottoms: '#4C566A',
      shoes: '#2E3440',
      tote: C.orange,
    },
  },
} satisfies Record<string, Actor>;

/* ------------------------------------------------------------------ */
/* Walking: the group walks, then slows to a stop as the smog arrives  */
/* ------------------------------------------------------------------ */

export const walkAmount = (f: number) => tween(f, TIMING.walkStop.start, TIMING.walkStop.end, [1, 0], EASE.inOut);

const cache = new Map<number, {scroll: number; clock: number}>();
/** Integrated camera scroll (px) and cadence clock (frames of full-speed walking). */
export const travel = (f: number) => {
  const key = Math.floor(f);
  const hit = cache.get(key);
  if (hit) return hit;
  let scroll = 0;
  let clock = 0;
  for (let t = TIMING.street.start - 30; t < key; t++) {
    const a = walkAmount(t);
    scroll += WALK_SPEED * a;
    clock += Math.sqrt(a);
  }
  const res = {scroll, clock};
  cache.set(key, res);
  return res;
};

export const cycleFrames = (g: Gait) => g.stride / (STANCE * WALK_SPEED);

const groupWalk = (actor: Actor, f: number): Pose => {
  const a = walkAmount(f);
  const {clock} = travel(f);
  const phase = clock / cycleFrames(actor.gait) + actor.phaseOffset;
  return walkPose(actor.B, phase, Math.sqrt(a), actor.gait);
};

/* ------------------------------------------------------------------ */
/* The wipe and who it has reached                                     */
/* ------------------------------------------------------------------ */

export const WIPE_EASE = EASE.cinematic;
const LTR = TIMING.wipe.direction === 'ltr';
export const wipeX = (f: number) => {
  const p = tween(f, TIMING.wipe.start, TIMING.wipe.end, [0, 1], WIPE_EASE);
  return LTR ? -60 + 1200 * p : 1140 - 1200 * p;
};

/** CSS mask that shows the smog layer on the side the wipe has already crossed. */
export const wipeMask = (x: number, feather: number) =>
  LTR
    ? `linear-gradient(90deg, #000 0px, #000 ${x - feather}px, transparent ${x + feather}px)`
    : `linear-gradient(90deg, transparent 0px, transparent ${x - feather}px, #000 ${x + feather}px)`;

/** First frame at which the wipe line has passed screen x. */
export const reachedAt = (x: number) => {
  for (let f = TIMING.wipe.start; f <= TIMING.wipe.end; f++) if (LTR ? wipeX(f) >= x : wipeX(f) <= x) return f;
  return TIMING.wipe.end;
};

export const contactFrame = (i: number) => TIMING.tabletContact[i];
/** 0 -> 1 relief after a tablet reaches a figure. */
const relief = (f: number, i: number) => tween(f, contactFrame(i), contactFrame(i) + 20, [0, 1], EASE.inOut);

/* ------------------------------------------------------------------ */
/* Performances                                                        */
/* ------------------------------------------------------------------ */

export type Performance = {pose: Pose; mufflerUp?: number; fist?: number; sway: number; x: number; y: number};

const lerpVec = (a: Vec, b: Vec, t: number): Vec => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});

/** Wrist position the pose would have without any IK target. */
const naturalWrist = (B: Build, pose: Pose, side: 'near' | 'far'): Vec => {
  const j = solve(B, {...pose, nearHand: null, farHand: null});
  return side === 'near' ? j.nearArm.end : j.farArm.end;
};

const standBreath = (f: number, amp = 1) => Math.sin(f / 26) * 1.2 * amp;

export const youngMan = (f: number): Performance => {
  const A = ACTORS.youngMan;
  const base = groupWalk(A, f);
  const tA = reachedAt(A.x);
  const r = tween(f, tA, tA + 14, [0, 1], EASE.inOut);
  const rel = relief(f, 0);
  // three short coughs, then a breath, on a loop
  const u = Math.max(0, f - tA - 6);
  const loopU = u % 34;
  const cough = (impulse(loopU, 1.6) + 0.85 * impulse(loopU - 7, 1.6) + 0.7 * impulse(loopU - 14, 1.6)) * (u > 0 ? 1 : 0);
  const c = cough * (1 - rel);
  const coughPose: Pose = {
    ...base,
    lean: 11 + 8 * c,
    headTilt: 9 + 9 * c,
    nearArm: {shoulder: 40 + 4 * c, elbow: 120},
    farArm: {shoulder: 6, elbow: 22},
    shrug: 5 * c,
  };
  const reliefPose: Pose = {
    ...base,
    lean: 2,
    headTilt: -7,
    nearArm: {shoulder: 3, elbow: 14},
    farArm: {shoulder: -2, elbow: 12},
    shrug: 0,
  };
  const pose = blendPose(blendPose(base, coughPose, r), reliefPose, rel);
  pose.shrug += standBreath(f, 1 - walkAmount(f));
  const lift = r * (1 - rel);
  if (lift > 0.001) {
    const jHead = solve(A.B, pose);
    const mouth = headPoint(A.B, jHead, 0.36, 0.62);
    pose.nearHand = lerpVec(naturalWrist(A.B, pose, 'near'), {x: mouth.x + A.B.H * 0.01, y: mouth.y}, lift);
  }
  return {pose, fist: lift, sway: travel(f).clock / cycleFrames(A.gait), x: A.x, y: A.y};
};

export const olderMan = (f: number): Performance => {
  const A = ACTORS.olderMan;
  const base = groupWalk(A, f);
  const tA = reachedAt(A.x);
  const r = tween(f, tA, tA + 14, [0, 1], EASE.inOut);
  const rel = relief(f, 1);
  const armUp = keys(f, [tA, tA + 9, tA + 22, tA + 34], [0, 1, 1, 0], EASE.inOut) * (1 - rel);
  const muffler = tween(f, tA + 5, tA + 20, [0, 1], EASE.inOut) * (1 - 0.6 * rel);
  const smogPose: Pose = {
    ...base,
    lean: 11,
    headTilt: 7,
    nearArm: {shoulder: 8, elbow: 18},
    farArm: {shoulder: 4, elbow: 18},
    shrug: 3,
  };
  const reliefPose: Pose = {...base, lean: 6, headTilt: -5, nearArm: {shoulder: 2, elbow: 14}, farArm: {shoulder: -2, elbow: 12}, shrug: 0};
  const pose = blendPose(blendPose(base, smogPose, r), reliefPose, rel);
  pose.shrug += standBreath(f + 9, 1 - walkAmount(f));
  if (armUp > 0.001) {
    const jHead = solve(A.B, pose);
    const chin = headPoint(A.B, jHead, 0.3, 0.7);
    pose.nearHand = lerpVec(naturalWrist(A.B, pose, 'near'), chin, armUp);
  }
  return {pose, mufflerUp: muffler, fist: armUp, sway: travel(f).clock / cycleFrames(A.gait), x: A.x, y: A.y};
};

/** Converts a screen point into an actor's local (mirrored) space. */
export const toLocal = (A: {x: number; y: number; facing: 1 | -1}, p: Vec): Vec => ({x: (p.x - A.x) * A.facing, y: p.y - A.y});
export const toScreen = (A: {x: number; y: number; facing: 1 | -1}, p: Vec): Vec => ({x: A.x + p.x * A.facing, y: A.y + p.y});

export const child = (f: number): Performance & {joints: Joints} => {
  const A = ACTORS.child;
  const M = ACTORS.mother;
  const tA = reachedAt(M.x);
  const pull = tween(f, tA + 2, tA + 20, [0, 1], EASE.inOut);
  const rel = relief(f, 2);
  const x = A.x + (M.x + 20 - A.x) * pull;
  const y = A.y + 6 * pull;
  const base = groupWalk(A, f);
  // holding mother's hand while walking
  const hold = handhold(f);
  const local = toLocal({x, y, facing: -1}, hold);
  const inPose: Pose = {...base, lean: 9, headTilt: 12, nearArm: {shoulder: -18, elbow: 40}, farArm: {shoulder: 8, elbow: 30}};
  const upPose: Pose = {...inPose, lean: 3, headTilt: -14};
  let pose = blendPose(base, inPose, pull);
  pose = blendPose(pose, upPose, rel);
  pose.nearHand = lerpVec(local, naturalWrist(A.B, pose, 'near'), pull);
  const joints = solve(A.B, pose);
  return {pose, joints, sway: travel(f).clock / cycleFrames(A.gait), x, y};
};

/** Where the mother and child hold hands (screen space), swaying with the walk. */
export const handhold = (f: number): Vec => {
  const {clock} = travel(f);
  const s = Math.sin((clock / cycleFrames(ACTORS.mother.gait)) * Math.PI * 2);
  return {x: (ACTORS.mother.x + ACTORS.child.x) / 2 + 10 + 6 * s * walkAmount(f), y: 1302 + 3 * Math.abs(s)};
};

export const mother = (f: number, childJ: Joints, childPos: {x: number; y: number}): Performance => {
  const A = ACTORS.mother;
  const base = groupWalk(A, f);
  const tA = reachedAt(A.x);
  const pull = tween(f, tA + 2, tA + 20, [0, 1], EASE.inOut);
  const rel = relief(f, 2);
  // hand target: the handhold while walking, then around the child's far shoulder
  const childShoulder = toScreen({...childPos, facing: -1}, {x: childJ.shoulder.x - 16, y: childJ.shoulder.y + 10});
  const holdT = toLocal(A, handhold(f));
  const hugT = toLocal(A, childShoulder);
  const target = {x: holdT.x + (hugT.x - holdT.x) * pull, y: holdT.y + (hugT.y - holdT.y) * pull};
  const smogPose: Pose = {...base, lean: 7, headTilt: 14, farArm: {shoulder: 6, elbow: 22}, shrug: 2};
  const reliefPose: Pose = {...smogPose, lean: 3, headTilt: -4};
  let pose = blendPose(base, smogPose, pull);
  pose = blendPose(pose, reliefPose, rel);
  pose.nearHand = target;
  pose.shrug += standBreath(f + 17, 1 - walkAmount(f));
  return {pose, sway: travel(f).clock / cycleFrames(A.gait), x: A.x, y: A.y};
};

/* ------------------------------------------------------------------ */
/* Scene 3: the young woman walks in and offers the strip              */
/* ------------------------------------------------------------------ */

const WOMAN_EASE = Easing.bezier(0.3, 0.34, 0.55, 1);
const WOMAN_FROM = -190;
export const womanX = (f: number) => tween(f, TIMING.womanWalk.start, TIMING.womanWalk.end, [WOMAN_FROM, ACTORS.woman.x], WOMAN_EASE);

export const woman = (f: number): Performance => {
  const A = ACTORS.woman;
  const x = womanX(f);
  const v = Math.max(0, womanX(f + 0.5) - womanX(f - 0.5));
  const cycle = cycleFrames(A.gait);
  const a = Math.min(1, v / WALK_SPEED);
  // phase: constant cadence while moving, frozen once stopped
  let phase = A.phaseOffset;
  for (let t = TIMING.womanWalk.start; t < f; t++) {
    const vt = Math.max(0, womanX(t + 0.5) - womanX(t - 0.5));
    phase += Math.min(1, vt / WALK_SPEED) > 0.02 ? 1 / cycle : 0;
  }
  const base = walkPose(A.B, phase, a, A.gait);
  const raise = tween(f, TIMING.stripRaise.start, TIMING.stripRaise.end, [0, 1], EASE.inOut);
  const lower = tween(f, contactFrame(2) + 6, contactFrame(2) + 26, [0, 1], EASE.inOut);
  const offer: Pose = {...base, lean: -1, headTilt: 2, nearArm: {shoulder: 74, elbow: 6}, farArm: {shoulder: -4, elbow: 14}};
  const after: Pose = {...base, lean: 0, headTilt: -3, nearArm: {shoulder: 26, elbow: 40}, farArm: {shoulder: -3, elbow: 12}};
  let pose = blendPose(base, offer, raise);
  pose = blendPose(pose, after, lower * 0.8);
  pose.shrug += standBreath(f + 5, 1 - a);
  return {pose, sway: phase, x, y: A.y};
};
