import { continueRender, delayRender, staticFile } from "remotion";

// Fonts are vendored in public/fonts (Poppins + Playfair Display, OFL) so renders work offline.
export const SANS = "Poppins, sans-serif";
export const SERIF = "'Playfair Display', serif";
export const SERIF_ITALIC = SERIF;

const faces: [string, string, string, string][] = [
  ["Poppins", "normal", "400", "Poppins-normal-400.woff2"],
  ["Poppins", "normal", "500", "Poppins-normal-500.woff2"],
  ["Poppins", "normal", "600", "Poppins-normal-600.woff2"],
  ["Poppins", "normal", "700", "Poppins-normal-700.woff2"],
  ["Poppins", "normal", "800", "Poppins-normal-800.woff2"],
  ["Playfair Display", "normal", "500 700", "PlayfairDisplay-normal-500.woff2"],
  ["Playfair Display", "italic", "500", "PlayfairDisplay-italic-500.woff2"],
];

const handle = delayRender("Loading fonts");
Promise.all(
  faces.map(([family, style, weight, file]) => {
    const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format('woff2')`, { style, weight });
    document.fonts.add(face);
    return face.load();
  }),
).then(() => continueRender(handle));
