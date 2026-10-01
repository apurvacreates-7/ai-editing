# FreeStand × Whiskas — UGC AI demo (v3)

Remotion source for the Whiskas `#MyFussyCatAd` UGC AI demo video (1920×1080, 30 fps, ~94 s).

## What changed from v2

v2 got two pieces of feedback: it never showed how people find the offer, and it showed only the WhatsApp sign-up. v3 adds:

| # | Scene | What it shows |
|---|-------|---------------|
| 1 | Hook | Same opening, plus a line that sets up the story |
| 2 | **Discovery** (new) | How people are targeted: FreeStand CDP audience builder → matched cat-parent cohort → invite from Whiskas' verified WhatsApp |
| 3 | **Two ways in** (new) | WhatsApp-native for existing customers, and a web page with OTP sign-up for new cat parents (ads, influencer links, QR on pack) |
| 4 | WhatsApp journey | Invite → handle → brief → AI check → match → reward (tightened from v2) |
| 5 | **Web journey** (new) | The same six steps in a browser |
| 6 | **Brand dashboard** (new) | A copy of the Fussy Cat UGC review dashboard: qualified chat↔post pairs with AI badges and verdicts |
| 7 | **Rejections + summary** (new) | The Disqualified tab (stock image, no cat, graphic), the campaign funnel and one-click next actions |
| 8 | Results | 1 in 7 / 10 in 10 / 1 in 10 / ~1 in 4, with where each number comes from |
| 9 | Same engine, any brand | Bebeautiful, Vaseline and F&B examples |
| 10 | End card | "Target. Invite. Verify. Reward." |

Campaign numbers (5,866 engaged · 865 UGC · 196 IG posts · 619 no link · 70 invalid links · 20 disqualified) come from the case study and the brand dashboard. On the dashboard, participant names are cut to a first name and handles are masked. The CDP filters, the web flow screens and the `@ananya.and.ginger` / Meera personas are illustrative.

## Render

```bash
npm install
npx remotion studio                       # preview
npx remotion render WhiskasUGC out/Whiskas_UGC_AI_demo_v3.mp4
```

In the cloud sandbox, add `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`.

The music bed is the v2 audio track (`public/music.mp3`), looped and faded out at the end.
