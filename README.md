# Sleep & Habit Log

A private sleep diary that runs on GitHub Pages and can be installed on Android as a progressive web app (PWA). No account, subscription, paid API, ads, analytics, or application backend.

**This is not a 100%-accurate automatic sleep tracker or a medical device.** It logs user-reported times, daily habits, a daily priority, and a focus countdown. It does not use phone sensors or infer sleep stages.

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

## Publish a Downloadable Release

The release workflow is `.github/workflows/release.yml`. It runs only when you push a stable version tag such as `v1.0.0`. It tests, audits, and builds the app, then publishes these assets on a GitHub Release:

- **sleep-habit-log-web.zip**: the built web app, local assets and license notices, README, and contribution guide. No personal records, credentials, or dependencies are bundled.
- **SHA256SUMS.txt**: an integrity checksum for the ZIP. It detects a mismatched download; it is not an independent security audit or publisher signature.

Only `@jigar99799` may trigger or rerun the release jobs. A tag must point to a commit already contained in `origin/main`; merge a contributor's PR first, then tag your local `main` commit. Tagging an unmerged feature branch is rejected. All tag creation, updates, and deletion are protected by a separate active repository ruleset with administrator bypass; the owner is currently the only administrator.

Keep other people without Write, Maintain, or Admin access if release publishing must remain owner-only. GitHub users with write-level access can create manual releases through GitHub independently of this workflow; tag protection is not a separate permission setting for every release API operation. Public contributors should use forks and PRs instead. The workflow publishes as `github-actions[bot]` using its short-lived repository token, but only after your permitted version-tag push.

To publish the first release, first commit and push the implementation changes, then tag that commit:

```sh
git add .
git commit -m "Simplify diary, add reminders, SEO, and downloadable releases"
git push origin main
git tag v1.0.0
git push origin v1.0.0
```

Wait for **Actions > Publish Downloadable Release** to succeed. Later versions need a new tag such as `v1.0.1`; do not move or overwrite an existing release tag. If a release already exists, a rerun will not silently replace its assets.

After the first successful release, anyone can download without signing in:

- Latest release page: **https://github.com/jigar99799/sleep-tracker/releases/latest**
- Direct web ZIP: **https://github.com/jigar99799/sleep-tracker/releases/latest/download/sleep-habit-log-web.zip**
- Checksum: **https://github.com/jigar99799/sleep-tracker/releases/latest/download/SHA256SUMS.txt**

These URLs do not work until a release has actually been published. This update creates the workflow and local package; it does not create a Git tag or publish a release automatically.

The ZIP is a web distribution, **not an Android APK**. Extract all files together; do not move just the HTML away from its assets. Basic desktop diary use works by opening `index.html`. For Android installation and notification/offline setup, use the HTTPS website instead. Developers should clone the repository or download GitHub's source archive; the web ZIP is not the full development project.

For a local release preview, install Node 22+ and the `zip` utility, then run:

```sh
npm ci
npm test
npm run build
node scripts/release.cjs
cd release
sha256sum -c SHA256SUMS.txt
```

The generated `release/` folder is ignored by Git; the workflow builds release assets from the tagged commit. A later GitHub Release does not automatically update Pages; the Pages website is deployed by pushes to `main`.

## Install on Android

1. Open the deployed HTTPS URL in a current Android Chrome browser, directly rather than inside another app's embedded browser.
2. Wait for **Offline ready**. The first visit requires network access to download the app and its local assets.
3. Use the install icon when available, or Chrome's **Install app / Add to Home screen** menu.
4. Open the installed app. Under **Morning reminders**, choose whether to enable check-ins, set a local time, and optionally enable system notifications.

This project is a web app, not an APK or a Play Store release. Browser install prompts vary by browser, policy, and device. Offline caches can still be evicted by the browser or operating system.

### Which Files Make Installation Work?

- `sleep-tracker.html`: diary, habits, daily priority, timer, reminder eligibility, and validated local storage.
- `manifest.webmanifest`: app name, icon, start URL, and standalone display on Android.
- `pwa.js`: install prompt, offline status, opt-in notification permission, and local notification display.
- `sw.js`: offline cache and notification-click handling. It does not schedule background alarms or receive push messages.
- `assets/`: bundled CSS, fonts, icons, and Chart.js, so no CDN is needed at runtime.

## SEO and Sharing

The app includes an accurate page title and description, a canonical URL pointing to the actual HTML app, Open Graph/X card metadata, a real interface preview at `assets/social-preview.png`, and `WebApplication` JSON-LD with a zero app price. No fabricated ratings, testimonials, medical claims, or automatic-sleep claims are included. The root redirect uses the same canonical URL.

The **Share app link** icon uses the device share sheet when available, with a copy-link fallback. It shares only the public app URL and fixed app description, never sleep records, habits, priority text, or backup data. Permission or platform restrictions can still prevent copying; the app then displays the URL for manual sharing.

### Help Search Engines Find It

1. Deploy the changes on GitHub Pages and confirm the actual page is accessible: **https://jigar99799.github.io/sleep-tracker/sleep-tracker.html**.
2. In **Google Search Console**, add a URL-prefix property for **https://jigar99799.github.io/sleep-tracker/**. You cannot verify ownership of the whole shared `github.io` domain.
3. Use Google's HTML-file verification method. Put its exact downloaded `google...html` file in the repository root, commit and deploy it, then click Verify. The build copies matching Google verification HTML files into the deployed site; do not put them inside `assets/`.
4. Submit **https://jigar99799.github.io/sleep-tracker/sitemap.xml** in Search Console's Sitemaps section, then inspect the canonical HTML URL and request indexing where available.
5. Check indexing reports and real user feedback. Keep descriptions truthful, fix usability issues, and earn relevant links by sharing useful work.

A `robots.txt` applies only at a domain's origin root, not at `/sleep-tracker/robots.txt`. This project does not create a misleading project-scoped robots file. The app's page-level robots directive allows indexing; hosting configuration and search-engine decisions still control actual crawling/indexing.

Metadata and a sitemap do **not** guarantee indexing, ranking, traffic, or virality. Structured data is not a promise of a Google rich result. No search-engine account has been verified, no sitemap has been submitted on your behalf, and no tracking or marketing service has been added.

### Short Launch Message

> I built a free, private sleep diary you can install on Android and use offline after setup. It includes daily habits and a focus timer. Records stay in your browser, and sleep times come from your entries, not guessed sensor readings. Try it: https://jigar99799.github.io/sleep-tracker/ . Feedback is welcome.

Pair that message with a short real screen recording showing installation, one manual entry, and the focus timer. Share it with people who want a simple diary, use relevant communities only where promotion is allowed, and ask for specific feedback. Do not buy reviews, fabricate users/results, send unsolicited bulk messages, or claim guaranteed accuracy. Update the preview screenshot if the interface changes materially; it must not include personal records.

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

Calculations depend on the device clock. Manual fields have minute resolution; live button stamps use device milliseconds. Displayed durations are rounded to minutes. Clock changes, timezone changes, DST ambiguity in manual entries, and incorrect taps can affect results. Records are displayed in the device's current timezone. These limitations rule out a 100% accuracy guarantee.

## Morning Reminders

Reminders are **off by default**. Expand **Morning reminders**, enable the check-in, and choose a local time. After that time, a check-in appears only if no record is logged for today's wake-up date or an active session is still open. A check-in never starts or stops a sleep session automatically.

- **Enable morning check-in** starts or stops reminder checks. Turning it off hides the check-in and closes notifications already displayed by the app.
- **System notifications while app is open** requests browser permission only after you enable it. Denied or unsupported permission falls back to in-app check-ins. Device Do Not Disturb and browser/Android policies can suppress notifications even with permission granted.
- A system notification is normally delivered at most once per local day on this device. The clock button snoozes it for 10 minutes and permits another delivery after the snooze. The X button dismisses it for today. Logging a completed session also clears a missing-record check-in.
- Reminder settings, snooze, dismissal, and delivery state persist locally and are included in backups. The app does not access your Android alarm list or change browser notification permissions when you turn its reminders off.

**These are not scheduled background push notifications.** Checks run when the app is open and visible, approximately every 30 seconds and when you return to it. A service worker is not a continuously running alarm clock. Installing the app does not let it reliably wake itself while closed, locked, suspended, or offline. For a dependable daily morning alert, set a recurring alarm in Android Clock. That alarm is independent and cannot check whether you logged a record.

Reliable conditional alerts while closed would need a native Android implementation or a push subscription plus a server-side scheduler. Neither is included, and no external notification service or paid infrastructure has been added.

## Daily Productivity

- **One priority** saves up to 160 characters immediately on this device. Mark it complete with the checkbox. Editing it clears its completion mark.
- The **25-minute focus timer** has start/resume, pause, and reset controls. A running timer stores a deadline; after reopening, it calculates remaining time from the device clock rather than assuming background timers ran.
- **Timers finished today** counts elapsed countdowns once, not measured concentration or proof of work. A countdown that finished yesterday is not credited today. No alarm is guaranteed while the app is closed.
- Priority, completion, and the daily counter reset on the next local date when the app updates. A running countdown survives that rollover. Only today's priority/counter are retained, not a productivity history.

## Why Phone Motion Was Removed

The previous motion panel measured movement of the phone, not whether its owner was sleeping. A still phone, a moving mattress, or missing sensor readings cannot establish sleep. It added complexity without reliable sleep information, so both the panel and sensor collection have been removed. Older diary backups still import, but their obsolete motion summaries are not retained in the updated app. Keep an original exported backup if those summaries matter to you.

## Storage, Backup, and Privacy

- Records, settings, habits, today's priority, and the timer live in this browser's `localStorage`, under `pulse_unified_tracker_v3`. They are not sent to GitHub or another server by the app.
- Hosting providers still receive normal requests for site assets. App data has no cloud sync and is not encrypted by this application.
- Storage belongs to the browser origin and profile, not your GitHub account. Moving domains, using another browser/device, clearing site data, private browsing, storage limits, or browser eviction can lose access to it. Use one tab at a time; concurrent edits in separate tabs are not merged.
- Open **Backup**, copy the JSON, and keep it in a private file outside the browser. Clipboard success confirms a copy operation, not that you saved a file permanently.
- To restore, paste the JSON and choose **Restore State**. Valid data replaces the current state only after confirmation. Imported derived values are recalculated from timestamps. Invalid structures, overlaps, and unsafe habit icons are rejected.
- Valid original backups can be imported. If old data is malformed or violates the validation rules, the app preserves the original stored text for export and blocks overwriting it until a valid backup is restored.
- Reset Log deletes only completed sleep records. It does not delete habits, active sessions, reminder preferences, or today's focus.

Do not publish personal backup JSON in your GitHub repository. Export before switching domains or installing through a different browser. This is a diary, not advice or diagnosis for a sleep disorder.

## Repository Safety

The repository is public; that does not grant write access. The active `main` ruleset restricts updates, deletion, and force pushes, and requires pull requests for non-bypass users. The owner is currently the only administrator and retains administrator bypass. Granting anyone else Admin access would give them that bypass too. See `CONTRIBUTING.md` for the fork/branch/PR workflow.

Pull requests use a separate read-only check workflow with no deployment permissions and no repository secrets. The Pages workflow deploys changes only after an authorized push to `main`. Imported text is escaped, backup structure and timestamps are validated, dependencies are audited, and third-party license notices are bundled. These precautions are not a guarantee against all security issues or a certification of legal, medical, privacy, or hosting-policy compliance. Review changes and applicable service terms before deploying.

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

Automated tests cover awake deductions, target-boundary precision, impossible input rejection, restore validation, calendar grouping, safe habit text, reminder eligibility and controls, focus deadlines, and daily rollover. Browser smoke checks cover persistence, mobile overflow, chart rendering, notification fallback, and cached reload.

**Not yet validated on physical Android hardware or in an overnight study.** Before relying on this diary on your own phone, test notification permission, start/stop controls, lock/unlock, force-close recovery, offline launch, backup/restore, and timezone/DST behavior. Do not interpret passing software tests as clinical validation.