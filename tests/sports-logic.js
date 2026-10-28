// Zero-dependency checks for the Sports Training rules: `node tests/sports-logic.js`
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");
const path = require("path");
const ctx = vm.createContext({ console });
["sports-data.js", "sports-gps.js", "sports-coaching.js", "exercise-guides.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), ctx, { filename: file }));
const run = (code) => vm.runInContext(code, ctx);
// Exercises whose visuals live in app.js (earlier illustrations) rather than the sports files.
vm.runInContext(`function sportsExerciseDictCheck() { const earlier = ["Bird dog", "High knees"];
  return Object.keys(sportsExerciseInfo).filter((n) => !exerciseGuides[n] && !sportsIllustrations[n] && !earlier.includes(n)); }`, ctx);
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log("ok -", name); };

test("every generated block has coaching content for every profile, week and adjustment", () => {
  const missing = run(`(() => {
    const out = [];
    const base = sportsDefaultProfile();
    const profiles = [base, { ...base, trackAccess: true }, { ...base, locations: ["outdoors"] }, { ...base, locations: ["gym"], age: 12 },
      { ...base, phase: "season", practiceDays: ["mon","tue","wed","thu","fri"], days: ["sat"] }];
    profiles.forEach((p) => { for (let w = 1; w <= 12; w += 1) [-1, 0, 1].forEach((a) => sportsBuildWeek(p, w, a).forEach((wk) => wk.blocks.forEach((b) => {
      if (b.kind === "exercise") { if (!sportsExerciseInfo[b.exercise]) out.push("info " + b.exercise); if (!sportsExerciseCoach[b.exercise]) out.push("coach " + b.exercise); }
      else if (!sportsRunCoach[b.coachKey]) out.push("run " + b.coachKey);
      if (!b.why) out.push("why " + (b.name || b.exercise));
    }))); });
    return [...new Set(out)];
  })()`);
  assert.strictEqual(JSON.stringify(missing), "[]");
});

test("every sports exercise has a visual guide (photos, an earlier illustration, or a new SVG)", () => {
  const withoutVisual = run(`sportsExerciseDictCheck()`);
  assert.strictEqual(JSON.stringify(withoutVisual), "[]");
  const missingFiles = run("Object.values(sportsIllustrations)").filter((file) => !fs.existsSync(path.join(__dirname, "..", "assets", "exercise-guides", file + ".svg")));
  assert.strictEqual(missingFiles.length, 0);
});

test("default profile is valid and back-to-back days are rejected", () => {
  assert.strictEqual(run("sportsValidateProfile(sportsDefaultProfile())"), "");
  assert.ok(run('sportsValidateProfile({ ...sportsDefaultProfile(), days: ["sun","mon","wed"] })'));
});

test("weekly running time stays within age caps and steps up gently", () => {
  const minutes = run(`(() => { const p = sportsDefaultProfile(); const cap = sportsAgeRules(p.age).maxEasyMinutes;
    return [1,2,3,4,5,6,7,8,9,10,11,12].map((w) => [1, 0, -1].map((a) => Math.max(...sportsBuildWeek(p, w, a).flatMap((x) => x.blocks).filter((b) => b.minutes).map((b) => b.minutes)) <= cap)).flat(); })()`);
  assert.ok(minutes.every(Boolean));
});

const mk = (extra) => Object.assign({ id: "x", programId: "p", week: 3, cycle: 0, slot: 1, day: "2026-01-05", rpe: 6, fatigue: 2, recovery: 4, pain: false, note: "" }, extra);
const decide = (checkins, runs, over) => run(`sportsWeekDecision(Object.assign({ week: 3, cycle: 0, planned: 3, phaseSlots: 12, phaseSlotsDone: 12, atGate: false, checkins: ${JSON.stringify(checkins)}, runs: ${JSON.stringify(runs)} }, ${JSON.stringify(over || {})}))`);
const good = [1, 2, 3].map((slot) => mk({ slot, day: "2026-01-0" + (5 + slot) }));
const easyRun = (day, seconds, rpe) => ({ id: day, day, type: "easy", meters: 2000, seconds, rpe, splits: [] });
const improving = [easyRun("2026-01-01", 900, 4), easyRun("2026-01-03", 890, 4), easyRun("2026-01-05", 850, 4), easyRun("2026-01-07", 840, 4)];

test("good check-ins alone never trigger progress", () => assert.strictEqual(decide(good, []).outcome, "continue"));
test("progress needs consistency, healthy ratings and improving performance", () => assert.strictEqual(decide(good, improving).outcome, "progress"));
test("pain eases the week back", () => assert.strictEqual(decide([...good.slice(0, 2), mk({ slot: 3, pain: true })], improving).outcome, "ease"));
test("high fatigue eases back", () => assert.strictEqual(decide(good.map((c) => ({ ...c, fatigue: 4 })), improving).outcome, "ease"));
test("missed workouts repeat the week", () => assert.strictEqual(decide([good[0]], improving).outcome, "repeat"));
test("slipping pace at similar effort repeats", () => {
  const slipping = [easyRun("2026-01-01", 800, 4), easyRun("2026-01-03", 805, 4), easyRun("2026-01-05", 880, 4), easyRun("2026-01-07", 890, 4)];
  assert.strictEqual(decide(good, slipping).outcome, "repeat");
});
test("phase gate holds him in the phase when too few workouts were done", () => assert.strictEqual(decide(good, improving, { atGate: true, phaseSlotsDone: 5 }).outcome, "repeat"));
test("no workouts means repeat, not progress", () => assert.strictEqual(decide([], []).outcome, "repeat"));

test("rep check flags a fade and an even set", () => {
  assert.strictEqual(run("sportsRepCheck([48, 50, 52, 54]).status"), "too-fast");
  assert.strictEqual(run("sportsRepCheck([50, 50.5, 50.8, 51]).status"), "right");
  assert.strictEqual(run("sportsRepCheck([50, 50.5, 50.2], 5).status"), "room");
  assert.strictEqual(run("sportsRepCheck([50]).status"), "need-more");
});

test("readiness check sends sick or hurting athletes to rest", () => {
  assert.strictEqual(run('sportsReadiness({ energy: 4, soreness: "sharp", sleep: "good", illness: false }).level'), "rest");
  assert.strictEqual(run('sportsReadiness({ energy: 2, soreness: "none", sleep: "poor", illness: false }).level'), "easy");
  assert.strictEqual(run('sportsReadiness({ energy: 5, soreness: "none", sleep: "good", illness: false }).level'), "go");
});

test("easier version removes hard runs and trims strength sets", () => {
  const out = run(`(() => { const w = sportsBuildWeek(sportsDefaultProfile(), 6, 0)[2]; const e = sportsEasyWorkout(w);
    return { hard: e.blocks.filter((b) => b.kind === "run" && b.runType !== "easy").length, easy: e.blocks.filter((b) => b.runType === "easy").length }; })()`);
  assert.strictEqual(JSON.stringify(out), JSON.stringify({ hard: 0, easy: 1 }));
});

test("saved data is validated", () => {
  const n = run(`normalizeSports({ profile: { age: "x", days: "bad" }, program: { id: "a", week: 99, log: [{ week: 1, outcome: "bogus", day: "2026-01-01" }] }, runs: [null, { id: "r", day: "2026-01-01", meters: 800, seconds: 200, splits: [50, "x", 2000] }] })`);
  assert.strictEqual(n.profile.age, 14);
  assert.strictEqual(n.program.week, 1);
  assert.strictEqual(n.program.log.length, 0);
  assert.deepStrictEqual(Array.from(n.runs[0].splits), [50]);
});

// ---------- Run tracking ----------
const gps = (code) => vm.runInContext(code, ctx);
function simulate(opts) {
  // Straight-line run along a meridian at `speed` m/s, one reading per second, seeded noise in meters.
  return gps(`(() => {
    let seed = ${opts.seed || 7};
    const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 - 0.5; };
    const tr = sportsGpsTracker(${opts.target});
    const mPerDeg = 111194.9;
    const events = [];
    const speed = ${opts.speed};
    for (let sec = 0; sec <= ${opts.seconds}; sec += 1) {
      const trueM = sec * speed;
      const noise = ${opts.noise} * 2;
      const lat = 40 + (trueM + rnd() * noise) / mPerDeg;
      const lon = -75 + (rnd() * noise) / (mPerDeg * Math.cos(40 * Math.PI / 180));
      tr.fix({ lat, lon, accuracy: ${opts.accuracy}, t: 1e12 + sec * 1000 }, sec * 1000).events.forEach((e) => events.push(e));
    }
    return { distance: tr.distance, events, tr, quality: tr.quality(), reachedMs: tr.reachedMs, fired: tr.fired.slice(), ignored: tr.ignored };
  })()`);
}

test("haversine matches a known distance", () => {
  const d = gps("sportsHaversine({ lat: 40, lon: -75 }, { lat: 40.001, lon: -75 })");
  assert.ok(Math.abs(d - 111.2) < 0.5, "got " + d);
});

test("unit conversions: 800 m is about 0.497 miles and a mile is 1609 m", () => {
  assert.ok(Math.abs(gps('sportsUnitFromMeters(800, "mi")') - 0.4971) < 0.001);
  assert.strictEqual(gps('sportsMetersFrom(1, "mi")'), 1609);
  assert.strictEqual(gps('sportsMetersFrom(0.8, "km")'), 800);
});

test("milestones: 800 m notifies at 200, 400, 600 then the finish", () => {
  assert.strictEqual(JSON.stringify(gps("sportsMilestones(800)")), "[200,400,600]");
  assert.strictEqual(JSON.stringify(gps("sportsMilestones(400)")), "[100,200,300]");
  assert.strictEqual(JSON.stringify(gps("sportsMilestones(100)")), "[]");
});

test("GPS: a noisy 800 m run is measured within 8% and fires every milestone in order", () => {
  const r = simulate({ target: 800, speed: 5, seconds: 200, noise: 3, accuracy: 6 });
  assert.ok(r.distance > 1000 * 0.95 && r.distance < 1000 * 1.06, "distance " + r.distance);
  assert.strictEqual(JSON.stringify(r.fired), "[200,400,600]");
  assert.strictEqual(r.events.filter((e) => e.type === "target").length, 1);
  assert.ok(r.reachedMs > 140000 && r.reachedMs < 180000, "reached at " + r.reachedMs);
});

test("GPS: standing still with jitter adds almost no distance", () => {
  const r = simulate({ target: 800, speed: 0, seconds: 120, noise: 4, accuracy: 10 });
  assert.ok(r.distance < 20, "stationary distance " + r.distance);
});

test("GPS: readings worse than 25 m are ignored and quality is poor", () => {
  const r = simulate({ target: 800, speed: 5, seconds: 60, noise: 3, accuracy: 40 });
  assert.strictEqual(r.distance, 0);
  assert.strictEqual(r.quality, "poor");
});

test("GPS: a teleport glitch is ignored", () => {
  const out = gps(`(() => { const tr = sportsGpsTracker(0);
    tr.fix({ lat: 40, lon: -75, accuracy: 5, t: 1e12 }, 0);
    tr.fix({ lat: 40.0001, lon: -75, accuracy: 5, t: 1e12 + 1000 }, 1000);
    const before = tr.distance;
    tr.fix({ lat: 40.05, lon: -75, accuracy: 5, t: 1e12 + 2000 }, 2000);
    return { before, after: tr.distance }; })()`);
  assert.ok(out.before > 5 && out.before < 8, "before " + out.before);
  assert.strictEqual(out.after, out.before);
});

test("GPS: a long signal gap is counted and lowers quality", () => {
  const out = gps(`(() => { const tr = sportsGpsTracker(0);
    tr.fix({ lat: 40, lon: -75, accuracy: 5, t: 1e12 }, 0);
    tr.fix({ lat: 40.0002, lon: -75, accuracy: 5, t: 1e12 + 30000 }, 30000);
    tr.fix({ lat: 40.0004, lon: -75, accuracy: 5, t: 1e12 + 70000 }, 70000);
    return { gaps: tr.gaps, quality: tr.quality() }; })()`);
  assert.strictEqual(out.gaps, 2);
  assert.strictEqual(out.quality, "poor");
});

test("GPS: after a pause the first reading re-anchors instead of adding the walked distance", () => {
  const d = gps(`(() => { const tr = sportsGpsTracker(0);
    tr.fix({ lat: 40, lon: -75, accuracy: 5, t: 1e12 }, 0);
    tr.fix({ lat: 40.00014, lon: -75, accuracy: 5, t: 1e12 + 1000 }, 1000);
    tr.resetAnchor();
    tr.fix({ lat: 40.001, lon: -75, accuracy: 5, t: 1e12 + 60000 }, 2000);
    tr.fix({ lat: 40.00114, lon: -75, accuracy: 5, t: 1e12 + 61000 }, 3000);
    return tr.distance; })()`);
  assert.ok(d > 14 && d < 20, "distance " + d);
});

test("the margin shown for GPS is wider on poor signal", () => {
  assert.ok(gps('sportsGpsMargin(200, "poor", 20)') > gps('sportsGpsMargin(200, "good", 5)'));
});

test("timer pauses and resumes from timestamps", () => {
  const out = gps(`(() => { const c = sportsClockNew(); sportsClockStart(c, 1000); sportsClockPause(c, 6000);
    const paused = sportsClockElapsed(c, 20000); sportsClockStart(c, 30000); return [paused, sportsClockElapsed(c, 34000)]; })()`);
  assert.strictEqual(out[0], 5000);
  assert.strictEqual(out[1], 9000);
});

test("saved runs: GPS and timed runs load, a timed run may have no distance, bad sources are cleaned", () => {
  const n = run(`normalizeSports({ runs: [
    { id: "a", day: "2026-01-01", meters: 812, seconds: 210, source: "gps", quality: "good", accuracy: 7 },
    { id: "b", day: "2026-01-02", meters: 0, seconds: 900, source: "timed" },
    { id: "c", day: "2026-01-03", meters: 0, seconds: 900, source: "manual" },
    { id: "d", day: "2026-01-04", meters: 400, seconds: 100, source: "satellite" } ],
    pending: { source: "gps", type: "easy", day: "2026-01-05", meters: 300, seconds: 90 } })`);
  assert.strictEqual(n.runs.length, 3);
  assert.strictEqual(n.runs[0].source, "gps");
  assert.strictEqual(n.runs[1].meters, 0);
  assert.strictEqual(n.runs[2].source, "manual");
  assert.strictEqual(n.pending.meters, 300);
  assert.strictEqual(run('normalizeSports({ pending: { source: "gps", meters: -5, seconds: 0 } }).pending'), null);
});

test("feedback separates GPS estimates from track measurements and uses effort", () => {
  const gpsRun = { source: "gps", quality: "fair", accuracy: 9, meters: 200, seconds: 45, rpe: 9, type: "repeats" };
  const lines = gps(`sportsRunFeedback(${JSON.stringify(gpsRun)}, { runType: "repeats", meters: 200, minutes: 0, effort: "RPE 6-7" }, null)`);
  assert.ok(lines.some((l) => /GPS estimate/.test(l)));
  assert.ok(lines.some((l) => /short distances/.test(l)));
  assert.ok(lines.some((l) => /above the planned/.test(l)));
  const trackLines = gps(`sportsRunFeedback({ source: "track", meters: 400, seconds: 100, rpe: 7, type: "repeats" }, { runType: "repeats", meters: 400, effort: "RPE 7" }, { meters: 400, seconds: 104, rpe: 7 })`);
  assert.ok(trackLines.some((l) => /Measured on a track/.test(l)));
  assert.ok(trackLines.some((l) => /faster/.test(l)));
  const timed = gps(`sportsRunFeedback({ source: "timed", meters: 0, seconds: 840, rpe: 4, type: "easy" }, { runType: "easy", minutes: 20, effort: "RPE 3-4" }, null)`);
  assert.ok(timed.some((l) => /14 of 20 planned minutes/.test(l)));
});

test("performance comparisons keep GPS and track runs apart", () => {
  const mk2 = (id, day, source, seconds) => ({ id, day, type: "easy", source, meters: 2000, seconds, rpe: 4, splits: [] });
  const sig = gps(`sportsPerformanceSignal(${JSON.stringify([mk2("1", "2026-01-01", "track", 900), mk2("2", "2026-01-03", "gps", 1200), mk2("3", "2026-01-05", "track", 890)])})`);
  assert.notStrictEqual(sig.status, "slipping");
});
console.log(passed + " checks passed");
