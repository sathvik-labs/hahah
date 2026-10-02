# FitCalc

Fitness tools made simple: 13 calculators plus a small tracking app (profile, targets, food log, planner, workouts, history). Desktop app built with Electron; the pages also work in a browser.

Inspired by Arch Linux / Hyprland. Built around food technology and biotechnology.

## Run

```bash
npm install
npm start        # launch the desktop app
npm test         # run unit tests
npm run build    # package with electron-builder
```

## Architecture

- `constants.js` storage keys and daily goals
- `store.js` the only localStorage access layer; domain modules use its read/write helpers
- `target.js` target engine: profile → BMR → TDEE → goal → targets
- `nutrition.js`, `planner.js`, `workout.js` own food/water, steps/workouts/tasks, templates
- `dashboard.js`, `adaptive.js` read the store and render today + priorities
- `progress.js`, `history.js` daily records and charts
- `calculators.js` standalone calculators (separate from app data)
- `script.js` + `main.css` global UI (nav is defined once in `script.js`; all media queries are in the last CSS section)

## Data ownership

- Profile owns profile values. `target.js` derives and stores targets from the profile.
- Nutrition owns food entries, nutrition totals, and water under a date key.
- Planner owns steps, weight, workouts, and tasks under a date key. Workout templates use their own key.
- Dashboard reads current nutrition, targets, and planner data. It does not persist a second copy.
- Progress records are snapshots refreshed when nutrition or planner data changes. Opening History does not create an empty record for today.
- Standalone calculators do not write to app data.

## Food and exercise lookups

- Packaged food search and barcode lookup use the public Open Food Facts read API. No API key is needed. Nutrition values are community submitted, so verify labels for important decisions.
- Camera barcode scanning uses `getUserMedia` and the browser's built-in `BarcodeDetector` when supported. Camera use requires a secure context and permission; manual barcode lookup remains available when camera or detection support is missing.
- Exercise discovery uses wger's public read-only exercise information API. Results can be added to a planner workout; actual sets/reps/weight or duration are entered separately and remain FitCalc-owned.
- These integrations need internet access. The local food list, manually entered exercise names, and tracking features continue to work without them.

## Web install and offline use

On an HTTPS web deployment, FitCalc can be installed as a Progressive Web App. The service worker caches the application shell and pages; user records remain in that browser's local storage. The Electron build does not use the service worker.

## Integration boundaries

- Cloud sync is not enabled: this repository has no backend, authentication provider, or sync credentials. Do not put provider secrets in the browser. A production sync provider needs an authenticated backend endpoint before sync can be enabled.
- HealthKit requires a native iOS target, Apple entitlements, and permission flows; this web/Electron package does not contain those. Health data is not simulated.
- Native Android health integration likewise needs an Android app target and user-granted Health Connect access.

Results are estimates, not medical advice.

Found a bug? Open an issue.
