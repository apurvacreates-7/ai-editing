export type RGB = [number, number, number];

const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

export const hexToRgb = (hex: string): RGB => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const rgbToHex = ([r, g, b]: RGB): string =>
  '#' + [r, g, b].map((v) => clamp255(v).toString(16).padStart(2, '0')).join('');

/** Linear mix of two hex colours, t = 0 gives a, t = 1 gives b. */
export const mix = (a: string, b: string, t: number): string => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
};

export const rgba = (hex: string, alpha: number): string => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
};

/** amount < 0 darkens towards black, amount > 0 lightens towards white. */
export const shade = (hex: string, amount: number): string =>
  amount < 0 ? mix(hex, '#000000', -amount) : mix(hex, '#ffffff', amount);

const luma = ([r, g, b]: RGB) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Pull a colour towards its own luminance grey. */
export const desaturate = (hex: string, amount: number): string => {
  const c = hexToRgb(hex);
  const l = luma(c);
  return rgbToHex([c[0] + (l - c[0]) * amount, c[1] + (l - c[1]) * amount, c[2] + (l - c[2]) * amount]);
};

/** Mix a list of [colour, weight] pairs (weights are normalised). */
export const blend = (stops: ReadonlyArray<readonly [string, number]>): string => {
  let total = 0;
  const acc: RGB = [0, 0, 0];
  for (const [c, w] of stops) {
    if (w <= 0) continue;
    const rgb = hexToRgb(c);
    acc[0] += rgb[0] * w;
    acc[1] += rgb[1] * w;
    acc[2] += rgb[2] * w;
    total += w;
  }
  if (total === 0) return stops[0][0];
  return rgbToHex([acc[0] / total, acc[1] / total, acc[2] / total]);
};
