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

test('motion requires real linear acceleration; missing values are not zero', () => {
    const sandbox = context();
    assert.equal(vm.runInContext('motionMagnitude({acceleration: null})', sandbox), null);
    assert.equal(vm.runInContext('motionMagnitude({acceleration: {x: null, y: 0, z: 0}})', sandbox), null);
    assert.equal(vm.runInContext('motionMagnitude({acceleration: {x: 0, y: 0, z: 0}})', sandbox), 0);
    assert.equal(vm.runInContext('motionMagnitude({acceleration: {x: 3, y: 4, z: 0}})', sandbox), 5);
});

test('sensor gaps are excluded and motion never creates sleep records', () => {
    const result = vm.runInContext(`(() => {
        const run = { startedAt: 0, lastSampleAt: null, sampleCount: 0, observedMs: 0, peakAcceleration: 0 };
        addMotionSample(run, 0, 0);
        addMotionSample(run, 2, 200);
        addMotionSample(run, 8, 250);
        addMotionSample(run, 3, 10000);
        addMotionSample(run, 1, 10200);
        return { run, records: appState.sleepRecords.length, active: appState.activeSession };
    })()`, context());
    assert.equal(result.run.sampleCount, 4);
    assert.equal(result.run.observedMs, 400);
    assert.equal(result.run.peakAcceleration, 3);
    assert.equal(result.records, 0);
    assert.equal(result.active, null);
});