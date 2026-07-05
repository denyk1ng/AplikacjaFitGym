# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

FORMA — a personal gym-training PWA (React + Vite) built around one real, hard-coded A/B/C
lifting plan (with actual exercises, sets/reps, and starting weights) rather than a generic
workout builder. Polish-language UI throughout (`pl-PL`); comments and identifiers in the
codebase are also in Polish.

## Commands

```bash
npm install
npm run dev       # dev server (Vite)
npm run build     # production build to dist/
npm run preview   # serve the dist/ build locally, e.g. for PWA/offline testing
```

There is no test suite, linter, or type checker configured — verification is manual (run the
dev/preview server and click through the flow) or via ad-hoc Playwright scripts written to a
scratch directory, not committed to the repo.

To smoke-test a change end-to-end after `npm run build`, serve `dist/` with `npm run preview`
(binds `http://localhost:4173/AplikacjaFitGym/` — note the `base` path from `vite.config.js`)
and drive it with a headless browser rather than assuming the build succeeding is sufficient.

## Deployment

Push to `main` or `claude/cycling-training-project-43qg6i` triggers `.github/workflows/deploy.yml`,
which builds and publishes `dist/` to GitHub Pages via `actions/deploy-pages`. The Pages site must
have "Source: GitHub Actions" configured in repo settings (Settings → Pages) and the repo must be
public for Pages to serve on the free plan — the workflow builds successfully either way, only the
publish step fails without these. Live URL: `https://denyk1ng.github.io/AplikacjaFitGym/`.

## Architecture

**No router.** `App.jsx` holds a single `tab` string in state (`"dom" | "trening" | "cwiczenie" |
"sesja" | "stats" | "rozgrzewka" | "profil" | "kalendarz"`) and renders one top-level component
per tab. Navigation is just `setTab(...)` calls passed down as props (`goTo`, `goTraining`,
`onBack`, etc.) — there is no URL state, no history stack, no deep linking.

**Persistence is `localStorage`, wrapped to look async.** `src/lib/storage.js` exposes
`storage.get(key) -> Promise<{value: string} | null>` and `storage.set(key, value)`, purely so
component code reads like it could later swap in a real backend. Raw `localStorage.getItem` is
used directly in a few newer spots (`workout_log`, `progress_snapshots`, `live_session`) — both
patterns coexist, don't assume one is authoritative. Key keys: `plan_custom` (per-exercise
weight/sets/reps/rest overrides, keyed by exercise id), `progress_snapshots` (array of `{ts, date,
dateShort, weights}` — one entry per "Zapisz ciężary" tap, drives all progress charts),
`workout_log` (array of `{ts, date, type: "A"|"B"|"C"|"cardio", ...stats}` — one entry per
completed session, drives the weekly-completion calendar logic; `stats` from `LiveSession.jsx`
also includes `perExercise: [{id, weight, unit, setsDone, sets}]`, the per-exercise actual-weight/
completed-sets record — currently unconsumed since the feature that read it was removed, see
Known dead code), `body_weight_log`, `profile`, `fav_exercises`, `forma_onboarded`, `settings`
(see `src/lib/settings.js`, includes an unused `aiApiKey` field left over from the same removed
feature).

**Week-based completion logic lives in `src/lib/workoutLog.js`.** Trainings A/B/C don't need to
happen on their nominal weekday (`PLAN_DOW = {A:1, B:3, C:5}`) — they need to happen once each
within the ISO week (Monday–Sunday, via `isoWeekStart`). `weekStatus()`, `suggestToday()`,
`weekHistory()`, `logStreak()`, and `weekVolumes()` all derive from `workout_log` and are the
source of truth for the Dashboard hero card, the overdue-alert bell, and the Calendar tab —
don't recompute this logic ad hoc elsewhere.

**Live session state survives reload/backgrounding.** `LiveSession.jsx` persists
`{dayKey, idx, setsDone, stage, startTs}` to `localStorage["live_session"]` on every change (see
`loadLiveState`/`clearLiveState`, exported from that file). On boot, `App.jsx` checks for this and
jumps straight back into the session tab if one is in progress and not stale (6h max age) — this
is what makes the installed PWA resilient to the OS killing the tab mid-workout. Clear it on both
save and abandon paths.

**Exercise "next" navigation is queue-based, not sequential.** Inside a live session, tapping a
different exercise number, or hitting "next", advances to the nearest *unfinished* exercise
(wrapping around the list) rather than `idx + 1` — this is intentional, so a lifter who skips a
busy machine and comes back to it later isn't forced through a fixed order. Don't reintroduce
strict sequential advancement here.

**Data-vs-presentation split for the plan.** `src/data/plan.js` holds `EXERCISES_DATA` (the actual
A/B/C plan — real exercise names, working weights, rep ranges, rest seconds, technique notes),
`WARMUP_DATA` (base warmup + one activation block per day), and `BADGES`. Photo/thumbnail lookups
are separate maps keyed by exercise id or category: `src/data/photos.js` (day hero photos),
`src/data/exerciseThumbs.js` (small aesthetic thumbnails, via `import.meta.glob`),
`src/data/exerciseImages.js` (two-frame start/end technique images per exercise, also via
`import.meta.glob`, consumed by `ExerciseDetail.jsx`'s crossfade). When adding an exercise, wiring
a thumbnail/image is a separate step from adding the plan entry.

**Theming is a single flat token object**, not Tailwind/CSS-in-JS: `src/theme.js` exports `T`
(colors) and `FONT_NUM` (the `Doto` display-number font, used for anything numeric/statistical —
reps, weights, timers, streaks — via `fontFamily: FONT_NUM`; body/UI text uses `Urbanist`, loaded
in `index.html`). Locked brand colors are exactly four: white `#FFFFFF`, black/bg `#171717`, gray
`#94978F`, lime `#BCFF31` (`T.accent`). This replaced an earlier orange (`#FF4D00`) accent on a
bluer black (`#060910`) — if you find hardcoded hex values from that older palette outside
`theme.js` (components sometimes bypass `T` with literal hex/rgba, e.g. for box-shadows), that's
drift from the rebrand, not an intentional second palette; bring them in line with `T`.
`T.blue`/`T.purple`/`T.danger`/`T.ok`/`T.yellow` are supporting functional colors already in use
(day-color-coding, success/error states) but are *not* part of the locked brand palette — when
asked to stay "on-brand," the four above are what that means; treat introducing a new hue as a
deliberate, called-out decision, not a default.

**PWA/installability.** `public/manifest.webmanifest` + `public/sw.js` (network-first for
navigations, cache-first for static assets) + icons in `public/icons/` (generated from the logo
geometry, not hand-drawn — see the logo note below) make this installable on iOS/Android home
screens. `src/lib/install.js` wraps the `beforeinstallprompt` flow for Android/Chrome and exposes
`isIOS()`/`isStandalone()` so the UI can show manual "Add to Home Screen" instructions where no
native prompt exists (iOS Safari). Any new fixed/absolutely-positioned full-bleed screen (hero
headers, bottom sheets, the bottom nav) needs `env(safe-area-inset-*)` in its padding — this repo
targets an installed standalone PWA on notched iPhones, where content otherwise sits under the
status bar/home-indicator. Existing components already do this via `calc(Npx + env(safe-area-inset-top/bottom))`; match that pattern rather than hardcoding pixel offsets on new screens.

**Logo is procedural SVG, not an image asset.** `src/components/Logo.jsx` defines the FORMA "F"
mark as clip-path polygons (`LogoMark`, `AnimatedLogo` with the "filling" loop animation used on
the splash screen and plan-building screen, `LogoLockup`). `public/favicon.svg` and the PWA PNG
icons in `public/icons/` are all derived from this same polygon geometry (regenerated via a
one-off Python/PIL script, not committed) — if the mark's geometry ever changes, favicon and PWA
icons need regenerating to match, they won't update automatically.

**Bottom-sheet and full-screen-overlay components are portaled to `document.body`**
(`ConfirmSheet.jsx`, `QuickAddSheet.jsx`, the notification panel in `DashboardTab.jsx`, the
exit-confirm sheet in `LiveSession.jsx`) specifically to escape the `.fu` fade-up animation's
stacking context on ancestor elements — a plain `position: fixed` nested inside an animated
parent gets clipped/mispositioned without the portal.

## Known dead code

`src/components/DayExCard.jsx`, `RestDisplay.jsx` (only ever imported by `DayExCard.jsx`, so
transitively dead too), `Onboarding.jsx`, `DietTab.jsx`, and `SetCounter.jsx` are not imported from
`App.jsx` or any reachable component — they're leftovers from earlier iterations (an older
onboarding flow, an old per-set card UI, a diet-tracking tab that was explicitly dropped from
scope). Don't assume they're wired up; check reachability from `App.jsx` before modifying a
component.

`src/components/CoachTab.jsx`, `src/components/BotMascot.jsx`, `src/lib/coach.js`, and
`src/lib/aiClient.js` implement a "Trener AI" feature (heuristic weight-progression insights +
an optional Anthropic-API chat, gated behind a user-supplied API key) that was built, then its
Dashboard entry point was removed. `App.jsx` still renders `{tab === "coach" && <CoachTab .../>}`
and has a `coach: "Trener AI"` title, but nothing calls `goTo("coach")` anymore, so the tab is
unreachable — the files aren't wired up for real use, they're parked for a possible return.

## Git / PR conventions specific to this repo

Commits in this repo's history end with a co-author trailer:

```
Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_...
```

Do not include a model identifier (e.g. "Sonnet", "Opus") anywhere in commit messages, PR text,
or code comments — only in the co-author line above, and only using whatever name the session
was already using in prior commits on this branch.
