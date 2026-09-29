import React from 'react';

// Hand-drawn line icons in the spirit of the workspace's UI set (24px grid).
const I: React.FC<{size?: number; color?: string; stroke?: number; children: React.ReactNode}> = ({
  size = 28,
  color = 'currentColor',
  stroke = 2,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{display: 'block', flex: 'none'}}
  >
    {children}
  </svg>
);

type P = {size?: number; color?: string; stroke?: number};

export const IconLaunch: React.FC<P> = (p) => (
  <I {...p}>
    <path d="M3 10.5v3a1 1 0 0 0 1 1h2.5L12 18.5v-13L6.5 9.5H4a1 1 0 0 0-1 1z" />
    <path d="M15.5 9a4 4 0 0 1 0 6" />
    <path d="M18.5 6.5a8 8 0 0 1 0 11" />
  </I>
);
export const IconBox: React.FC<P> = (p) => (
  <I {...p}>
    <path d="M21 7.5 12 3 3 7.5l9 4.5 9-4.5z" />
    <path d="M3 7.5v9L12 21l9-4.5v-9" />
    <path d="M12 12v9" />
  </I>
);
export const IconUsers: React.FC<P> = (p) => (
  <I {...p}>
    <circle cx="9" cy="8" r="3.4" />
    <path d="M2.5 20c.4-3.6 3.1-5.8 6.5-5.8s6.1 2.2 6.5 5.8" />
    <path d="M16 4.8a3.2 3.2 0 0 1 0 6.3" />
    <path d="M18 14.6c2 .7 3.3 2.6 3.5 5.4" />
  </I>
);
export const IconData: React.FC<P> = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="1.8" />
    <path d="M8.2 8.2a5.4 5.4 0 0 0 0 7.6" />
    <path d="M15.8 8.2a5.4 5.4 0 0 1 0 7.6" />
    <path d="M5.3 5.3a9.5 9.5 0 0 0 0 13.4" />
    <path d="M18.7 5.3a9.5 9.5 0 0 1 0 13.4" />
  </I>
);
export const IconChart: React.FC<P> = (p) => (
  <I {...p}>
    <path d="M3 20.5h18" />
    <path d="M6 20.5v-6" />
    <path d="M11 20.5V6" />
    <path d="M16 20.5v-9.5" />
  </I>
);
export const IconCheck: React.FC<P> = (p) => (
  <I {...p}>
    <path d="M4.5 12.5 9.5 17.5 19.5 7" />
  </I>
);
export const IconArrow: React.FC<P> = (p) => (
  <I {...p}>
    <path d="M4 12h15" />
    <path d="M13 6l6 6-6 6" />
  </I>
);
export const IconShield: React.FC<P> = (p) => (
  <I {...p}>
    <path d="M12 3 19 6v5.5c0 4.6-3 8-7 9.5-4-1.5-7-4.9-7-9.5V6l7-3z" />
    <path d="m8.8 12.2 2.3 2.3 4.2-4.6" />
  </I>
);
export const IconSpark: React.FC<P> = (p) => (
  <I {...p}>
    <path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5l-1.9-5.7L4.5 10.9 10.1 9z" />
  </I>
);
export const IconLoop: React.FC<P> = (p) => (
  <I {...p}>
    <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
    <path d="M4 3.5V8h4.5" />
    <path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />
    <path d="M20 20.5V16h-4.5" />
  </I>
);
export const IconPlay: React.FC<P> = (p) => (
  <I {...p}>
    <path d="M7 4.5v15l12.5-7.5z" />
  </I>
);
export const IconQr: React.FC<P> = (p) => (
  <I {...p}>
    <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" />
    <rect x="14" y="3.5" width="6.5" height="6.5" rx="1" />
    <rect x="3.5" y="14" width="6.5" height="6.5" rx="1" />
    <path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM14 19v1.5M20.5 14v1.5" />
  </I>
);
