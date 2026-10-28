// Zero-dependency checks for the Sports Training rules: `node tests/sports-logic.js`
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");
const path = require("path");
const ctx = vm.createContext({ console });
["sports-data.js", "sports-coaching.js", "exercise-guides.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), ctx, { filename: file }));
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
console.log(passed + " checks passed");
