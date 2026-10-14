const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');

const html = fs.readFileSync(`${__dirname}/../sleep-tracker.html`, 'utf8');
const engine = html.split('<!-- SCRIPT ENGINE -->')[1].match(/<script>([\s\S]*?)<\/script>/)[1];

function context() {
    const sandbox = vm.createContext({ window: {}, console, setInterval, clearInterval, setTimeout });
    vm.runInContext(engine, sandbox);
    return sandbox;
}

test('live timing subtracts completed and ongoing awake intervals', () => {
    const sandbox = context();
    const timing = vm.runInContext(`getSessionTiming({
        bedtimeTimestamp: 0,
        awakeIntervals: [{ start: 60000, end: 120000 }],
        currentAwakeStart: 180000
    }, 240000)`, sandbox);
    assert.equal(timing.inBedMs, 240000);
    assert.equal(timing.awakeMs, 120000);
    assert.equal(timing.netMs, 120000);
});

test('live timing never produces negative durations', () => {
    const timing = vm.runInContext(`getSessionTiming({
        bedtimeTimestamp: 1000, awakeIntervals: [], currentAwakeStart: null
    }, 500)`, context());
    assert.equal(timing.netMs, 0);
});

test('target attainment is not rounded up and 0% efficiency is retained', () => {
    const sandbox = context();
    const nearTarget = vm.runInContext('createSleepRecord(0, 26999000, 0)', sandbox);
    assert.equal(nearTarget.goalMet, false);
    const allAwake = vm.runInContext('createSleepRecord(0, 3600000, 60)', sandbox);
    assert.equal(allAwake.efficiency, 0);
    assert.equal(allAwake.durationHours, 0);
});

test('invalid dates, future dates, and impossible awake time are rejected', () => {
    const sandbox = context();
    for (const expression of [
        'createSleepRecord(NaN, 3600000, 0)',
        'createSleepRecord(0, 3600000, -1)',
        'createSleepRecord(0, 3600000, 61)',
        'createSleepRecord(0, 3600000, NaN)',
        'createSleepRecord(0, Date.now() + 10000, 0)',
        'createSleepRecord(0, 86400001, 0)'
    ]) assert.throws(() => vm.runInContext(expression, sandbox));
});

test('restore rebuilds derived values instead of trusting backup claims', () => {
    const restored = vm.runInContext(`validateState({
        settings: { sleepTargetHours: 8 }, activeSession: null,
        sleepRecords: [{ id: 1, bedTimestamp: 0, wakeTimestamp: 3600000, awakeMinutes: 60,
            durationHours: 99, efficiency: 100, goalMet: true, displayDate: '<script>' }],
        habits: [], habitHistory: {}
    })`, context());
    assert.equal(restored.sleepRecords[0].durationHours, 0);
    assert.equal(restored.sleepRecords[0].goalMet, false);
    assert.equal(restored.sleepRecords[0].efficiency, 0);
    assert.ok(!restored.sleepRecords[0].displayDate.includes('<script>'));
});

test('restore rejects malformed collections, overlapping records, and unsafe habit icons', () => {
    const sandbox = context();
    vm.runInContext(`globalThis.backup = {
        settings: { sleepTargetHours: 7.5 }, activeSession: null,
        sleepRecords: [], habits: [], habitHistory: {}
    }`, sandbox);
    assert.throws(() => vm.runInContext('validateState({...backup, sleepRecords: {}})', sandbox));
    assert.throws(() => vm.runInContext(`validateState({...backup, sleepRecords: [
        { id: 1, bedTimestamp: 0, wakeTimestamp: 7200000, awakeMinutes: 0 },
        { id: 2, bedTimestamp: 3600000, wakeTimestamp: 10800000, awakeMinutes: 0 }
    ]})`, sandbox));
    assert.throws(() => vm.runInContext(`validateState({...backup, habits: [
        { id: 1, name: 'Water', icon: '" onclick="alert(1)' }
    ]})`, sandbox));
});

test('weekly summary groups sessions by local day and excludes older records', () => {
    const nights = vm.runInContext(`(() => {
        appState.sleepRecords = [
            { dateKey: '2026-10-14', durationHours: 4, bedTimestamp: 1 },
            { dateKey: '2026-10-14', durationHours: 4, bedTimestamp: 2 },
            { dateKey: '2026-10-07', durationHours: 20, bedTimestamp: 3 }
        ];
        return getRecentNights(new Date(2026, 9, 14, 12));
    })()`, context());
    assert.equal(nights.length, 1);
    assert.equal(nights[0].durationHours, 8);
    assert.equal(nights[0].goalMet, true);
});

test('habit names are escaped before HTML rendering', () => {
    assert.equal(vm.runInContext(`escapeHTML('<img src=x onerror="alert(1)">')`, context()), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});

test('older backups remain usable after removing motion observations', () => {
    const restored = vm.runInContext(`validateState({
        settings: { sleepTargetHours: 7.5 }, activeSession: null,
        sleepRecords: [], habits: [], habitHistory: {}, motionObservations: []
    })`, context());
    assert.equal(restored.sleepRecords.length, 0);
    assert.equal('motionObservations' in restored, false);
    assert.equal(html.includes('devicemotion'), false);
    assert.equal(html.includes('motionHeading'), false);
});

test('morning check-in is opt-in, local-time based, and conditional on the diary', () => {
    const sandbox = context();
    vm.runInContext(`appState.settings.reminders = defaultReminderSettings()`, sandbox);
    assert.equal(vm.runInContext('getMorningReminder(appState, new Date(2026, 9, 14, 9))', sandbox), null);
    vm.runInContext('appState.settings.reminders.enabled = true', sandbox);
    assert.equal(vm.runInContext('getMorningReminder(appState, new Date(2026, 9, 14, 7, 59))', sandbox), null);
    assert.match(vm.runInContext('getMorningReminder(appState, new Date(2026, 9, 14, 8)).message', sandbox), /No sleep record/);
    vm.runInContext(`appState.sleepRecords = [{dateKey: '2026-10-14'}]`, sandbox);
    assert.equal(vm.runInContext('getMorningReminder(appState, new Date(2026, 9, 14, 9))', sandbox), null);
    vm.runInContext('appState.activeSession = {bedtimeTimestamp: 1}', sandbox);
    assert.match(vm.runInContext('getMorningReminder(appState, new Date(2026, 9, 14, 9)).message', sandbox), /still open/);
});

test('morning check-in respects snooze, dismissal, day rollover, and stop', () => {
    const sandbox = context();
    vm.runInContext(`appState.settings.reminders = {...defaultReminderSettings(), enabled: true, dismissedDate: '2026-10-14'}`, sandbox);
    assert.equal(vm.runInContext('getMorningReminder(appState, new Date(2026, 9, 14, 9))', sandbox), null);
    assert.ok(vm.runInContext('getMorningReminder(appState, new Date(2026, 9, 15, 9))', sandbox));
    vm.runInContext(`appState.settings.reminders.dismissedDate = null;
        appState.settings.reminders.snoozedUntil = new Date(2026, 9, 14, 9, 10).getTime()`, sandbox);
    assert.equal(vm.runInContext('getMorningReminder(appState, new Date(2026, 9, 14, 9, 5))', sandbox), null);
    assert.ok(vm.runInContext('getMorningReminder(appState, new Date(2026, 9, 14, 9, 10))', sandbox));
    vm.runInContext('appState.settings.reminders.enabled = false', sandbox);
    assert.equal(vm.runInContext('getMorningReminder(appState, new Date(2026, 9, 14, 10))', sandbox), null);
});

test('reminder defaults migrate safely and invalid settings are rejected', () => {
    const sandbox = context();
    assert.equal(vm.runInContext('validateReminderSettings(undefined).enabled', sandbox), false);
    for (const time of ['25:00', '08:99', '', '<script>']) {
        sandbox.invalidTime = time;
        assert.throws(() => vm.runInContext('validateReminderSettings({...defaultReminderSettings(), time: invalidTime})', sandbox));
    }
    assert.throws(() => vm.runInContext('validateReminderSettings({...defaultReminderSettings(), snoozedUntil: -1})', sandbox));
});

test('focus countdown uses a saved deadline and paused time remains stable', () => {
    const sandbox = context();
    assert.equal(vm.runInContext('getFocusRemaining({endsAt: 10000, remainingMs: 1500000}, 4000)', sandbox), 6000);
    assert.equal(vm.runInContext('getFocusRemaining({endsAt: 10000, remainingMs: 1500000}, 11000)', sandbox), 0);
    assert.equal(vm.runInContext('getFocusRemaining({endsAt: null, remainingMs: 9000}, 999999)', sandbox), 9000);
});

test('focus completion counts once and day rollover clears yesterday priority', () => {
    const result = vm.runInContext(`(() => {
        const productivity = defaultProductivity(new Date(2026, 9, 14));
        productivity.priority = 'Read';
        productivity.priorityDone = true;
        productivity.focus.endsAt = new Date(2026, 9, 14, 10).getTime();
        settleProductivity(productivity, new Date(2026, 9, 14, 10, 1).getTime());
        settleProductivity(productivity, new Date(2026, 9, 14, 10, 2).getTime());
        const count = productivity.focusCount;
        settleProductivity(productivity, new Date(2026, 9, 15, 9).getTime());
        return { count, productivity };
    })()`, context());
    assert.equal(result.count, 1);
    assert.equal(result.productivity.focusCount, 0);
    assert.equal(result.productivity.priority, '');
    assert.equal(result.productivity.priorityDone, false);
});

test('a timer that finished yesterday is not credited as work today', () => {
    const result = vm.runInContext(`(() => {
        const productivity = defaultProductivity(new Date(2026, 9, 14));
        productivity.focus.endsAt = new Date(2026, 9, 14, 23).getTime();
        settleProductivity(productivity, new Date(2026, 9, 15, 9).getTime());
        return productivity;
    })()`, context());
    assert.equal(result.focusCount, 0);
    assert.equal(result.focus.remainingMs, 0);
    assert.equal(result.focus.endsAt, null);
});

test('daily focus restore validates lengths, counters, and timer values', () => {
    const sandbox = context();
    assert.equal(vm.runInContext('validateProductivity(undefined).focus.remainingMs', sandbox), 1500000);
    assert.throws(() => vm.runInContext(`validateProductivity({...defaultProductivity(), priority: 'x'.repeat(161)})`, sandbox));
    assert.throws(() => vm.runInContext('validateProductivity({...defaultProductivity(), focusCount: -1})', sandbox));
    assert.throws(() => vm.runInContext('validateProductivity({...defaultProductivity(), focus: {remainingMs: 1500001, endsAt: null}})', sandbox));
});

test('system reminder is delivered once per day and disabling closes notifications', async () => {
    const sandbox = context();
    sandbox.document = { hidden: false };
    vm.runInContext(`
        globalThis.deliveries = 0;
        globalThis.closed = 0;
        appState.settings.reminders = {...defaultReminderSettings(), enabled: true, time: '00:00', systemNotifications: true};
        renderReminderUI = () => getMorningReminder(appState);
        showMorningNotification = async () => { deliveries++; return true; };
        closeMorningNotifications = async () => { closed++; };
        saveState = () => {};
    `, sandbox);
    await vm.runInContext('checkMorningReminder()', sandbox);
    await vm.runInContext('checkMorningReminder()', sandbox);
    assert.equal(sandbox.deliveries, 1);
    vm.runInContext('setRemindersEnabled(false)', sandbox);
    await vm.runInContext('checkMorningReminder()', sandbox);
    assert.equal(sandbox.deliveries, 1);
    assert.equal(sandbox.closed, 1);
});

test('SEO describes the real free diary without invented ratings or sleep detection', () => {
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(schema['@type'], 'WebApplication');
    assert.equal(schema.url, 'https://jigar99799.github.io/sleep-tracker/sleep-tracker.html');
    assert.equal(schema.offers.price, '0');
    assert.equal(schema.isAccessibleForFree, true);
    assert.equal('aggregateRating' in schema, false);
    assert.match(schema.description, /Not a medical device or automatic sleep detector/);
    assert.ok(html.includes(`<link rel="canonical" href="${schema.url}">`));
    assert.ok(fs.readFileSync(`${__dirname}/../sitemap.xml`, 'utf8').includes(`<loc>${schema.url}</loc>`));
    const image = fs.readFileSync(`${__dirname}/../assets/social-preview.png`);
    assert.equal(image.readUInt32BE(16), 1200);
    assert.equal(image.readUInt32BE(20), 630);
});

test('sharing includes only the public link, supports copy, and respects cancellation', async () => {
    const sandbox = context();
    const url = 'https://jigar99799.github.io/sleep-tracker/sleep-tracker.html';
    const status = { innerText: '', classList: { add() {}, remove() {} } };
    const shares = [];
    const copies = [];
    sandbox.window.addEventListener = () => {};
    sandbox.navigator = {
        share: async data => shares.push(data),
        clipboard: { writeText: async value => copies.push(value) }
    };
    sandbox.document = { getElementById: () => status, querySelector: () => ({ href: url }) };
    vm.runInContext(`appState.productivity.priority = 'PRIVATE PRIORITY'; appState.sleepRecords = [{note: 'PRIVATE RECORD'}]`, sandbox);
    vm.runInContext(fs.readFileSync(`${__dirname}/../pwa.js`, 'utf8'), sandbox);
    await vm.runInContext('shareApp()', sandbox);
    assert.equal(shares.length, 1);
    assert.equal(shares[0].url, url);
    assert.deepEqual(Object.keys(shares[0]).sort(), ['text', 'title', 'url']);
    assert.equal(JSON.stringify(shares[0]).includes('PRIVATE'), false);
    sandbox.navigator.share = async () => { throw { name: 'AbortError' }; };
    await vm.runInContext('shareApp()', sandbox);
    assert.equal(copies.length, 0);
    delete sandbox.navigator.share;
    await vm.runInContext('shareApp()', sandbox);
    assert.deepEqual(copies, [url]);
    assert.match(status.innerText, /diary data is not shared/);
    sandbox.navigator.clipboard.writeText = async () => { throw new Error('Blocked'); };
    await vm.runInContext('shareApp()', sandbox);
    assert.equal(status.innerText, `Share this app link: ${url}`);
});

test('Google ownership verification file is present with the exact expected payload', () => {
    const name = 'googlebee80f11dfcb6077.html';
    const filePath = `${__dirname}/../${name}`;
    assert.ok(fs.existsSync(filePath), `Keep ${name} in the repository root and commit it before deploying.`);
    assert.equal(fs.readFileSync(filePath, 'utf8').trim(), `google-site-verification: ${name}`);
});

test('Rest and Rise branding and visual guide preserve the real app scope', () => {
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const manifest = JSON.parse(fs.readFileSync(`${__dirname}/../manifest.webmanifest`, 'utf8'));
    assert.equal(schema.name, 'Rest & Rise');
    assert.equal(manifest.short_name, 'Rest & Rise');
    assert.equal(manifest.start_url, './sleep-tracker.html');
    assert.ok(html.includes('id="infoModal"'));
    assert.ok(html.includes('aria-label="About Rest and Rise and how to use it"'));
    for (const text of ['Your night, in three steps', 'Example only:', 'Install on Android', 'Privacy, backups', 'Honest feedback, positive or critical', 'No phone sensors']) assert.ok(html.includes(text), text);
    assert.ok(html.includes('issues/new?template=feedback.yml'));
    assert.ok(fs.existsSync(`${__dirname}/../.github/ISSUE_TEMPLATE/feedback.yml`));
    assert.equal(schema.url, 'https://jigar99799.github.io/sleep-tracker/sleep-tracker.html');
});