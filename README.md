# Sleep & Habit Log

A private sleep diary that runs on GitHub Pages and can be installed on Android as a progressive web app (PWA). No account, subscription, paid API, ads, analytics, or application backend.

**This is not a 100%-accurate automatic sleep tracker or a medical device.** It logs user-reported times and optionally records real foreground phone motion. It never turns inactivity, missing readings, or a locked screen into a sleep claim.

## Cost and Availability

The app has no payment mechanism or usage-based service dependency. After the initial download and successful offline setup, the diary works without a network connection. Dependencies and fonts are bundled locally with their license notices.

GitHub currently offers Pages for public repositories on its free plan, subject to its terms and limits. Nobody can guarantee a third-party hosting service will remain free or available for a lifetime. Keep the source, generated assets, and regular data backups so you can host the app elsewhere. Normal mobile data charges may apply.

## Publish on GitHub Pages

1. Push **all** project changes, not just the original HTML file, to the `main` branch of `jigar99799/sleep-tracker`.
2. In GitHub, open **Settings > Pages > Build and deployment** and set **Source** to **GitHub Actions**.
3. Open **Actions > Test and Deploy Pages**. Run it manually if your push happened before Pages was enabled.
4. Wait for the tests, build, and deployment to succeed. The workflow's deployment output contains the live URL.
5. For the repository above, the expected default address is **https://jigar99799.github.io/sleep-tracker/**. A custom domain or repository rename changes that address.

The root entry page opens `sleep-tracker.html`. All URLs are relative, including the worker scope, so project subpaths work. The workflow publishes only `dist/`, not dependencies, tests, or local data. This update prepares deployment; it does not itself push commits or change your GitHub settings.

Alternatively, build locally and publish the contents of `dist/` to any HTTPS static host. The generated `assets/` directory is also included locally so the HTML can be opened directly for basic diary use; installation and reliable offline caching require HTTPS or localhost, not a `file:` URL.

## Install on Android

1. Open the deployed HTTPS URL in a current Android Chrome browser, directly rather than inside another app's embedded browser.
2. Wait for **Offline ready**. The first visit requires network access to download the app and its local assets.
3. Use the install icon when available, or Chrome's **Install app / Add to Home screen** menu.
4. Open the installed app. Installation does not give it native Android permissions or reliable background sensor access.

This project is a web app, not an APK or a Play Store release. Browser install prompts vary by browser, policy, and device. Offline caches can still be evicted by the browser or operating system.

## What the Data Means

| Value | Source and limitation |
| --- | --- |
| Bedtime and wake-up | Your button taps or manually entered local-device timestamps; not detected sleep onset or awakening. |
| Reported duration | Wake-up minus bedtime minus awake intervals you marked or entered. Unmarked wakefulness and sleep latency remain unknown. |
| Reported efficiency | Reported duration divided by time in bed. It is not a clinically measured sleep-efficiency result. |
| Target attainment | Compared against the current target using unrounded durations. Changing the target updates existing results. |
| Seven-day summary | Today and six previous local calendar days, grouped by wake-up date. Multiple sessions on one date are summed. Missing days are excluded, not assigned zero sleep. |
| Logged-day shortfall | Sum of positive deficits for logged days only. It is not total physiological sleep debt. |
| Bedtime spread | Earliest-to-latest range after shifting pre-noon times to the next day, not standard deviation or a sleep diagnosis. Unusual daytime schedules can make this less meaningful. |
| Habit streaks | Consecutive calendar dates with actual check-offs, or reported daily duration meeting the target. A missing date breaks a streak. |

An active timer persists its timestamps, not a background process. Closing the app does not stop the elapsed-time calculation, but you still need to mark awakening. Forgotten sessions can be discarded and replaced with manual entries. Records over 24 hours, future times, overlaps, and awake time exceeding time in bed are rejected.

Calculations depend on the device clock. Manual fields have minute resolution; live button stamps use device milliseconds. Displayed durations are rounded to minutes. Clock changes, timezone changes, DST ambiguity in manual entries, incorrect taps, and sensor calibration can affect results. Records are displayed in the device's current timezone. These limitations rule out a 100% accuracy guarantee.

## Phone Sensors: Actual Scope

Motion observations are optional and separate from sleep records:

- Collection starts only after you choose **Observe motion**, with a browser permission prompt where the platform requires it.
- Only finite `DeviceMotionEvent.acceleration` values for all three axes are accepted. Missing linear-acceleration readings remain unknown; gravity-inclusive values are not substituted.
- Samples are accepted at most five times per second. The app stores accepted sample count, peak linear-acceleration magnitude in m/s², last reading time, and observed coverage, not a sleep classification or a raw motion recording.
- Coverage adds time between consecutive accepted readings only when their gap is at most two seconds. Larger gaps are excluded. Coverage is a sampling diagnostic, not proof of continuous monitoring or human activity.
- Collection stops when the page becomes hidden or closes, including a lock event when the browser reports it. It does not automatically restart. If Android terminates the browser without a lifecycle event, the unfinished observation may be lost.
- The latest 30 completed observation summaries are retained locally and included in backups. The screen shows the current run or most recent completed run. Clear them with the motion-section trash button.
- Permission denial, unavailable APIs, null readings, and stale readings are shown explicitly. Sleep logging remains usable without sensors.

**A GitHub Pages website cannot read other apps' usage, system screen time, Android Activity Recognition, Health Connect, or a watch's heart rate through arbitrary HTML.** A service worker cannot keep accelerometer collection running overnight with the screen locked. Installation as a PWA does not remove those restrictions.

Automatic overnight detection would be a separate native Android project with supported sensors, explicit user permissions, lifecycle/battery handling, and a validated inference method. Health Connect can supply records written by compatible apps or wearables when authorized; it is not itself a sleep sensor. Such integrations would still not justify a 100% biological-sleep accuracy claim. No such native integration is implemented here.

## Storage, Backup, and Privacy

- Records, settings, habits, and completed motion summaries live in this browser's `localStorage`, under `pulse_unified_tracker_v3`. They are not sent to GitHub or another server by the app.
- Hosting providers still receive normal requests for site assets. App data has no cloud sync and is not encrypted by this application.
- Storage belongs to the browser origin and profile, not your GitHub account. Moving domains, using another browser/device, clearing site data, private browsing, storage limits, or browser eviction can lose access to it. Use one tab at a time; concurrent edits in separate tabs are not merged.
- Open **Backup**, copy the JSON, and keep it in a private file outside the browser. Opening Backup stops a motion run so its summary is included. Clipboard success confirms a copy operation, not that you saved a file permanently.
- To restore, paste the JSON and choose **Restore State**. Valid data replaces the current state only after confirmation. Imported derived values are recalculated from timestamps. Invalid structures, overlaps, and unsafe habit icons are rejected.
- Valid original backups can be imported. If old data is malformed or violates the validation rules, the app preserves the original stored text for export and blocks overwriting it until a valid backup is restored.
- Reset Log deletes only completed sleep records. It does not delete habits, active sessions, or motion observations. Those have separate controls.

Do not publish personal backup JSON in your GitHub repository. Export before switching domains or installing through a different browser. This is a diary, not advice or diagnosis for a sleep disorder.

## Development and Checks

Use **Node.js 22+** and npm:

```sh
npm ci
npm test
npm run build
npm audit
python3 -m http.server 4173 --bind 127.0.0.1
```

Open **http://127.0.0.1:4173/**. The build generates CSS, copies pinned third-party libraries/fonts and their licenses, renders PNG install icons, and assembles `dist/`. No Node server is required in production.

After changing application assets, change `CACHE_NAME` in `sw.js`, build again, and publish. The old offline version stays consistent until its tabs are closed and the new worker activates. A service worker cannot acquire an update while offline. For local development, unregister the worker and clear the app's Cache Storage in browser DevTools if an old build is still appearing; this is distinct from clearing localStorage.

Automated tests cover awake deductions, target-boundary precision, impossible input rejection, restore validation, calendar grouping, safe habit text, real-valued motion input, and gap exclusion. Browser smoke checks also exercise persistence, target changes, permission denial, visibility interruption, mobile overflow, chart rendering, and cached reload. Synthetic motion events test the code path, not a physical sensor.

**Not yet validated on physical Android hardware or in an overnight study.** Before relying on this diary on your own phone, test motion permission, no-reading states, lock/unlock, force-close recovery, offline launch, backup/restore, and timezone/DST behavior. Do not interpret passing software tests as clinical validation.