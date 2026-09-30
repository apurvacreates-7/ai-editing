import React from 'react';
import {HORIZON_Y} from '../../config';
import {rgba} from '../../lib/color';
import {C} from '../../theme';

/** Wall split by a ledge that sits exactly on the 62% horizon line. */
export const Room: React.FC = () => (
  <>
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 1080,
        height: HORIZON_Y,
        background: `linear-gradient(180deg, ${C.wallUpper} 0%, ${C.offWhite} 100%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: HORIZON_Y,
        width: 1080,
        height: 1920 - HORIZON_Y,
        background: `linear-gradient(180deg, ${C.wallLower} 0%, ${C.sandMid} 100%)`,
      }}
    />
    {/* ledge: top face, front face, cast shadow */}
    <div style={{position: 'absolute', left: 0, top: HORIZON_Y, width: 1080, height: 7, background: C.ledgeTop}} />
    <div style={{position: 'absolute', left: 0, top: HORIZON_Y + 7, width: 1080, height: 12, background: C.ledgeFace}} />
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: HORIZON_Y + 19,
        width: 1080,
        height: 36,
        background: `linear-gradient(180deg, ${rgba(C.slate, 0.16)} 0%, ${rgba(C.slate, 0)} 100%)`,
      }}
    />
  </>
);
