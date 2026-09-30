import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, Img, staticFile} from 'remotion';
import {PRODUCT} from '../../config';
import {DrawnPack} from './Props';

type Cut = {url: string; w: number; h: number};

let cutPromise: Promise<Cut | null> | null = null;

/** True when public/<PRODUCT.file> exists (Remotion injects the public/ file list into the bundle). */
export const hasProductPhoto = () => {
  if (typeof window === 'undefined') return false;
  const files = (window as unknown as {remotion_staticFiles?: Array<{name: string}>}).remotion_staticFiles ?? [];
  return files.some((f) => f.name === PRODUCT.file);
};

/**
 * Removes a flat photo background: estimates the background colour from the
 * image border, flood-fills everything connected to the border within
 * `tolerance`, feathers the edge, and trims to the product.
 */
const cutOut = async (src: string, tolerance: number): Promise<Cut> => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  await img.decode();
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;

  // background colour = per-channel median of the border
  const border: number[][] = [[], [], []];
  const pushBorder = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    border[0].push(px[i]);
    border[1].push(px[i + 1]);
    border[2].push(px[i + 2]);
  };
  for (let x = 0; x < w; x++) {
    pushBorder(x, 0);
    pushBorder(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushBorder(0, y);
    pushBorder(w - 1, y);
  }
  const median = (a: number[]) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
  const bg = [median(border[0]), median(border[1]), median(border[2])];
  const dist = (i: number) => Math.hypot(px[i] - bg[0], px[i + 1] - bg[1], px[i + 2] - bg[2]);

  const isBg = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop() as number;
    if (isBg[p]) continue;
    if (dist(p * 4) > tolerance) continue;
    isBg[p] = 1;
    const x = p % w;
    const y = (p - x) / w;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const i = p * 4;
      if (isBg[p]) {
        px[i + 3] = 0;
        continue;
      }
      // feather pixels that touch the background
      const nearBg = (x > 0 && isBg[p - 1]) || (x < w - 1 && isBg[p + 1]) || (y > 0 && isBg[p - w]) || (y < h - 1 && isBg[p + w]);
      if (nearBg) px[i + 3] = Math.round(255 * Math.max(0.25, Math.min(1, (dist(i) - tolerance * 0.6) / (tolerance * 0.8))));
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  ctx.putImageData(data, 0, 0);
  if (maxX <= minX || maxY <= minY) return {url: canvas.toDataURL('image/png'), w, h};
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const out = document.createElement('canvas');
  out.width = cw;
  out.height = ch;
  out.getContext('2d')?.drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);
  return {url: out.toDataURL('image/png'), w: cw, h: ch};
};

const loadCut = () => {
  if (!cutPromise) {
    cutPromise = cutOut(staticFile(PRODUCT.file), PRODUCT.cutoutTolerance).catch((err) => {
      console.error('Product cut-out failed, using the drawn pack', err);
      return null;
    });
  }
  return cutPromise;
};

/**
 * The hero product, centred with a soft drop shadow. Uses public/product.jpeg
 * when present (cut out, or on a card), otherwise the drawn placeholder pack.
 */
export const ProductShot: React.FC<{maxW: number; maxH: number}> = ({maxW, maxH}) => {
  const photo = hasProductPhoto();
  const [cut, setCut] = useState<Cut | null>(null);
  const [handle] = useState(() => (photo && PRODUCT.treatment === 'cutout' ? delayRender('Cutting out product photo') : null));

  useEffect(() => {
    if (handle === null) return;
    loadCut().then((c) => {
      setCut(c);
      continueRender(handle);
    });
  }, [handle]);

  const shadow = 'drop-shadow(0 34px 38px rgba(110, 34, 0, 0.36)) drop-shadow(0 8px 10px rgba(110, 34, 0, 0.22))';

  if (photo && PRODUCT.treatment === 'card') {
    return (
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 36,
          padding: 36,
          boxShadow: '0 34px 60px rgba(110, 34, 0, 0.34)',
          display: 'flex',
        }}
      >
        <Img src={staticFile(PRODUCT.file)} style={{maxWidth: maxW - 72, maxHeight: maxH - 72, objectFit: 'contain'}} />
      </div>
    );
  }

  if (photo && cut) {
    const k = Math.min(maxW / cut.w, maxH / cut.h);
    return <Img src={cut.url} style={{width: cut.w * k, height: cut.h * k, filter: shadow}} />;
  }

  return (
    <div style={{filter: shadow}}>
      <DrawnPack width={Math.min(maxW, maxH * 0.72)} />
    </div>
  );
};
