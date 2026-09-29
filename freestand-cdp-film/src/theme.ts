import {continueRender, delayRender, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';

export const W = 1920;
export const H = 1080;

export const C = {
  // stage
  void: '#050608',
  // keynote type
  ink: '#F5F5F7',
  mute: '#9B9CA6',
  faint: '#6A6C78',
  // paper + app UI (colours taken from the FS_CDP workspace)
  paper: '#FBFAF6',
  paperEdge: '#E6E2D8',
  navy: '#0D2A69',
  navyInk: '#0F1B3D',
  uiText: '#1B2437',
  uiMute: '#5E6678',
  uiLine: '#E3E6EC',
  green: '#1F9D57',
  greenBg: '#E6F6EC',
  amber: '#B7791F',
  amberBg: '#FFF4DB',
  purple: '#4B1F7A',
  purpleDeep: '#34115C',
  gold: '#F6C44F',
  sticky: '#FFE58A',
  wa: '#0B8A73',
  waBubble: '#DCF6C8',
  waBg: '#EFE8DE',
};

// Keynote accent: Freestand blue into Mondelēz purple into a warm pink.
export const GRADIENT = 'linear-gradient(96deg, #86A8FF 0%, #A993FF 38%, #D38CF2 68%, #FF9FB8 100%)';
export const GRADIENT_WARM = 'linear-gradient(96deg, #FFC98B 0%, #FF9FB8 45%, #C99BFF 100%)';

export const FONT = "'Inter', system-ui, sans-serif";
export const MONO = "'JetBrains Mono', ui-monospace, monospace";
export const HAND = "'Caveat', 'Comic Sans MS', cursive";

let loaded = false;
export const ensureFonts = () => {
  if (loaded) return;
  loaded = true;
  const handle = delayRender('fonts');
  const inter = (file: string, range: string) =>
    loadFont({
      family: 'Inter',
      url: staticFile(`fonts/${file}`),
      weight: '100 900',
      unicodeRange: range,
      format: 'woff2',
    });
  Promise.all([
    inter(
      'inter-latin-standard-normal.woff2',
      'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
    ),
    inter(
      'inter-latin-ext-standard-normal.woff2',
      'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
    ),
    loadFont({family: 'JetBrains Mono', url: staticFile('fonts/jetbrains-mono-latin-400-normal.woff2'), weight: '400'}),
    loadFont({family: 'JetBrains Mono', url: staticFile('fonts/jetbrains-mono-latin-500-normal.woff2'), weight: '500'}),
    loadFont({family: 'JetBrains Mono', url: staticFile('fonts/jetbrains-mono-latin-700-normal.woff2'), weight: '700'}),
    loadFont({family: 'Caveat', url: staticFile('fonts/caveat-latin-600-normal.woff2'), weight: '600'}),
  ])
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
};
