// Sports Performance Training: catalog, exercise notes, program generator and progress rules.
// Pure data and functions only (no DOM), so the logic can be checked in Node. UI lives in sports.js.
// To add a sport or event: add it to sportsCatalog, add a builder to sportsBuilders, and add any new
// exercises to sportsExerciseInfo (with the sets they need in the two lists below).

const SPORTS_PROGRAM_WEEKS = 12;

const sportsCategories = {
  endurance: "Endurance",
  speed: "Speed development",
  speedEndurance: "Speed endurance",
  legStrength: "Leg strength",
  coreStrength: "Core strength",
  mechanics: "Running mechanics",
  mobility: "Mobility and recovery"
};

const sportsPhases = [
  { id: "foundation", name: "Foundation", weeks: [1, 4], goal: "Build a base of easy running, learn good movement and get used to training." },
  { id: "development", name: "Development", weeks: [5, 8], goal: "Add controlled speed and strength while the base keeps growing." },
  { id: "event", name: "Event-specific preparation", weeks: [9, 12], goal: "Practise the pace and feel of the 800 m, then ease off before racing." }
];

const sportsCatalog = {
  track: {
    name: "Track & Field",
    events: {
      "800m": { name: "800 meters", blurb: "Two laps. Needs an aerobic base, speed and the ability to hold pace when tired." }
    }
  }
};

// Exercise names that are not in the main exercise library. They are added to the Log's timed or
// reps-only lists so the Log shows the right set form for them.
const sportsTimedExercises = ["Side plank", "Hip flexor stretch", "Hamstring stretch", "Calf stretch"];
const sportsRepsOnlyExercises = [
  "Bodyweight squat", "A-skip", "B-skip", "Butt kicks", "Straight-leg skips", "Arm swing drill", "Calf pogo hops",
  "Leg swings", "90/90 hip switch", "Walking lunge", "Step-up", "Hip hinge", "Wall drive march"
];

// category: one of sportsCategories. why: how the exercise helps the athlete. steps: shown in the
// guide when the exercise has no photo guide. Library exercises only need category and why.
const sportsExerciseInfo = {
  "Goblet squat": { category: "legStrength", why: "Builds the quads and glutes that drive every stride and the final push to the line." },
  "Bodyweight squat": { category: "legStrength", why: "Teaches a strong, balanced squat pattern and builds leg strength without equipment.", steps: ["Stand with feet shoulder-width apart.", "Sit your hips back and down while keeping your chest up and heels on the floor.", "Stand up by pushing the floor away."] },
  "Bulgarian split squat": { category: "legStrength", why: "Strengthens one leg at a time, like running does, and fixes left-right differences." },
  "Dumbbell lunge": { category: "legStrength", why: "Builds single-leg strength and hip control so your stride stays strong when you tire." },
  "Walking lunge": { category: "legStrength", why: "Single-leg strength with no equipment. It trains the hips and legs to stay steady with each stride.", steps: ["Step forward and lower until both knees bend about 90 degrees.", "Keep your torso tall and front knee over your middle toes.", "Push through the front foot and step into the next lunge."] },
  "Step-up with knee raise": { category: "legStrength", why: "Copies the drive-and-lift of running while building one-leg strength and balance." },
  "Step-up": { category: "legStrength", why: "Builds the single-leg power that drives you forward. Use a sturdy bench, step or stair.", steps: ["Place one whole foot on a step about knee height.", "Push through that foot to stand tall, then lower slowly.", "Finish all reps on one leg, then switch."] },
  "Romanian deadlift": { category: "legStrength", why: "Strengthens the hamstrings and glutes, which pull the leg through and protect against pulls. Use light weight and a flat back." },
  "Hip hinge": { category: "legStrength", why: "Teaches the hip-hinge pattern that powers the hamstrings and glutes, with no weight needed.", steps: ["Stand tall with soft knees and hands on your thighs.", "Push your hips straight back while your back stays flat.", "Feel the stretch behind your legs, then squeeze your glutes to stand."] },
  "Glute bridge": { category: "legStrength", why: "Wakes up the glutes so the hips extend fully and you push off the ground with power." },
  "Single-leg glute bridge": { category: "legStrength", why: "Builds one-leg hip strength and stability for a steady, powerful stride." },
  "Standing calf raise": { category: "legStrength", why: "Strengthens the calves and Achilles tendons that absorb and return force every step." },
  "Plank": { category: "coreStrength", why: "Builds a strong trunk so your hips and shoulders stay stable while you run." },
  "Side plank": { category: "coreStrength", why: "Strengthens the side of the trunk and hips so your pelvis stays level with each stride.", steps: ["Lie on your side and prop up on your forearm.", "Lift your hips so your body is a straight line from head to feet.", "Hold, breathe, then switch sides."] },
  "Dead bug": { category: "coreStrength", why: "Trains the core to hold the spine still while the arms and legs move, just as in running." },
  "Bird dog": { category: "coreStrength", why: "Builds back and hip stability with opposite arm and leg movement, like the running gait." },
  "Superman": { category: "coreStrength", why: "Strengthens the lower back and glutes that hold you tall late in a race." },
  "Hanging leg raise": { category: "coreStrength", why: "Strengthens the hip flexors and abs that lift the knees for a strong stride." },
  "Reverse crunch": { category: "coreStrength", why: "Builds the lower abs that help control your pelvis while you run." },
  "Pallof press": { category: "coreStrength", why: "Teaches the trunk to resist twisting, which keeps your running form tidy." },
  "High knees": { category: "mechanics", why: "Practises a high knee drive and quick, light foot contacts." },
  "A-skip": { category: "mechanics", why: "Trains a tall posture, knee lift and quick foot strike under the hips.", steps: ["Skip forward, lifting one knee to hip height.", "Snap that foot down under your hips while your arms swing opposite.", "Stay tall and relaxed. Cover about 20 meters, then walk back."] },
  "B-skip": { category: "mechanics", why: "Adds the reach-and-paw-back action that makes the foot land under the body instead of out front.", steps: ["Start like an A-skip, lifting the knee.", "Extend the lower leg forward, then sweep the foot back down under your hips.", "Keep your posture tall. Cover about 20 meters."] },
  "Butt kicks": { category: "mechanics", why: "Teaches a quick heel recovery so the leg swings through with less effort.", steps: ["Jog or skip forward in place or over 20 meters.", "Flick each heel up toward your glute without leaning back.", "Keep knees low and cadence quick."] },
  "Straight-leg skips": { category: "mechanics", why: "Trains a quick, springy ground contact and pulling the foot down under the hips.", steps: ["Keep legs mostly straight with toes pulled up.", "Skip forward, swinging each leg and pawing the ground back.", "Stay tall. Cover about 20 meters."] },
  "Arm swing drill": { category: "mechanics", why: "Strong, relaxed arm swing drives the legs and keeps your stride balanced.", steps: ["Stand or march with elbows bent about 90 degrees.", "Swing your arms front to back (hand from hip to cheek), not across your body.", "Keep shoulders and hands relaxed."] },
  "Calf pogo hops": { category: "mechanics", why: "Builds springy, stiff ankles so you get more return from each ground contact. Keep it low and quick.", steps: ["Stand tall and hop using mostly your ankles.", "Keep knees nearly straight and hops small and quick.", "Land softly on the balls of your feet."] },
  "Wall drive march": { category: "mechanics", why: "Practises the strong forward lean and knee drive of a sprint start and acceleration.", steps: ["Lean into a wall with straight body line, hands on the wall.", "March one knee up at a time, keeping the body line.", "Switch legs quickly with control."] },
  "Leg swings": { category: "mobility", why: "Warms up the hips and hamstrings so you can run with a full stride range.", steps: ["Hold a wall or fence for balance.", "Swing one leg forward and back in a relaxed arc, then switch.", "Do a second set side to side. Increase range gradually."] },
  "90/90 hip switch": { category: "mobility", why: "Improves hip rotation so your stride stays smooth and you avoid tight hips.", steps: ["Sit with both knees bent at 90 degrees, one leg in front and one to the side.", "Rotate your knees over to the other side, keeping your chest tall.", "Move slowly and switch back and forth."] },
  "Hip flexor stretch": { category: "mobility", why: "Keeps the front of the hips loose so you can extend the stride fully.", steps: ["Kneel on one knee with the other foot in front.", "Tuck your pelvis and gently shift forward until you feel the front of the back hip stretch.", "Hold, breathe, then switch sides."] },
  "Hamstring stretch": { category: "mobility", why: "Helps keep the back of the legs flexible for a smooth, long stride and recovery.", steps: ["Sit or lie down and extend one leg.", "Hinge forward from the hips or loop a band around the foot.", "Hold gently until you feel a stretch, not pain. Switch legs."] },
  "Calf stretch": { category: "mobility", why: "Keeps the calves and Achilles flexible after running to help recovery.", steps: ["Place hands on a wall with one foot back and heel down.", "Lean forward until you feel the calf stretch.", "Hold, then switch legs."] }
};

// Running blocks (not exercises in the Log): logged in the Sports view with distance, time and effort.
const sportsRunTypes = {
  easy: "Easy run",
  strides: "Strides",
  hills: "Hill sprints",
  fartlek: "Fartlek",
  tempo: "Steady run",
  accel: "Acceleration runs",
  repeats: "Interval repeats",
  check: "Pace check (not all-out)",
  trial: "Time trial (optional)",
  other: "Other run"
};

const sportsWhy = {
  easy: "Easy running builds the aerobic engine the 800 m relies on. It should feel comfortable enough to talk.",
  strides: "Short, relaxed fast runs teach good form and top-end speed without heavy fatigue.",
  hills: "Short hill sprints build leg power and sprint mechanics with less impact than flat sprinting.",
  fartlek: "Playful surges in an easy run build speed endurance and teach the body to change pace.",
  tempo: "Steady, controlled running lifts the pace you can hold for a long time.",
  accel: "Learning to build speed smoothly over 20-30 m is the start of every 800 m: a strong but controlled first 100 m.",
  repeats: "Repeating race-pace efforts with rest trains the body to run the pace the 800 m needs.",
  check: "A controlled, not all-out effort shows fitness with little risk, so progress never depends on a hard test.",
  trial: "A single honest effort shows where fitness is today so training and pace targets can be set."
};

function sportsAgeRules(age) {
  const a = Number(age);
  if (a <= 13) return { maxEasyMinutes: 30, maxRpeHard: 7, maxRepeats: 4, hardDays: 1, strengthReps: [10, 15], note: "Keep running fun and mostly easy; speed sessions stay short." };
  if (a <= 15) return { maxEasyMinutes: 35, maxRpeHard: 8, maxRepeats: 5, hardDays: 2, strengthReps: [8, 15], note: "Technique first. No max-weight lifting. One hard session at a time, with full rest." };
  if (a <= 17) return { maxEasyMinutes: 45, maxRpeHard: 8, maxRepeats: 6, hardDays: 2, strengthReps: [6, 12], note: "Moderate loads with good form. Keep hard days apart." };
  return { maxEasyMinutes: 60, maxRpeHard: 9, maxRepeats: 8, hardDays: 2, strengthReps: [5, 12], note: "Keep hard sessions apart and add load gradually." };
}

function sportsPhaseForWeek(week) {
  return sportsPhases.find((phase) => week >= phase.weeks[0] && week <= phase.weeks[1]) || sportsPhases[sportsPhases.length - 1];
}

function sportsLightWeek(week) {
  return week === 4 || week === 8 || week === 12;
}

function sportsDefaultProfile() {
  return {
    sport: "track",
    event: "800m",
    age: 14,
    experience: "beginner",
    phase: "preseason",
    days: ["mon", "wed", "fri"],
    locations: ["gym", "outdoors"],
    trackAccess: false,
    current800Seconds: null,
    practiceDays: []
  };
}

const SPORTS_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// Training days must not be next to each other (Sunday and Monday count as neighbours).
function sportsValidateProfile(profile) {
  const age = Number(profile.age);
  if (!Number.isInteger(age) || age < 10 || age > 19) return "Enter an age between 10 and 19.";
  const days = profile.days;
  const season = profile.phase === "season" && profile.practiceDays.length > 0;
  if (profile.phase === "season" && profile.practiceDays.length === 0) return "Pick your school practice days, or choose Preseason.";
  if (season) {
    if (days.length < 1 || days.length > 2) return "During the season pick 1 or 2 extra training days.";
    if (days.some((day) => profile.practiceDays.includes(day))) return "Pick extra days that are not school practice days.";
  } else if (days.length !== 3) {
    return "Pick exactly 3 training days.";
  }
  const index = days.map((day) => SPORTS_DAYS.indexOf(day));
  for (let i = 0; i < index.length; i += 1) {
    for (let j = i + 1; j < index.length; j += 1) {
      const gap = Math.abs(index[i] - index[j]);
      if (gap === 1 || gap === 6) return "Training days cannot be back to back. Leave a rest day between them.";
    }
  }
  if (!profile.locations.length) return "Pick at least one place you can train.";
  return "";
}

// Fills in missing or malformed saved data so old or hand-edited saves can never break the app.
function normalizeSports(raw) {
  const base = sportsDefaultProfile();
  const saved = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const p = saved.profile && typeof saved.profile === "object" ? saved.profile : {};
  const sport = sportsCatalog[p.sport] ? p.sport : base.sport;
  const event = sportsCatalog[sport].events[p.event] ? p.event : Object.keys(sportsCatalog[sport].events)[0];
  const pickDays = (list) => (Array.isArray(list) ? [...new Set(list.filter((day) => SPORTS_DAYS.includes(day)))] : []);
  const t800 = Number(p.current800Seconds);
  const profile = {
    sport,
    event,
    age: Number.isInteger(Number(p.age)) && Number(p.age) >= 10 && Number(p.age) <= 19 ? Number(p.age) : base.age,
    experience: ["beginner", "intermediate"].includes(p.experience) ? p.experience : base.experience,
    phase: p.phase === "season" ? "season" : "preseason",
    days: Array.isArray(p.days) ? pickDays(p.days) : base.days,
    locations: Array.isArray(p.locations) ? [...new Set(p.locations.filter((place) => place === "gym" || place === "outdoors"))] : base.locations,
    trackAccess: p.trackAccess === true,
    current800Seconds: Number.isFinite(t800) && t800 >= 90 && t800 <= 600 ? Math.round(t800) : null,
    practiceDays: pickDays(p.practiceDays)
  };
  const isDay = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const g = saved.program && typeof saved.program === "object" ? saved.program : null;
  const program = g && typeof g.id === "string" && g.id
    ? {
      id: g.id,
      startedAt: typeof g.startedAt === "string" ? g.startedAt : "",
      profile: normalizeSports({ profile: g.profile }).profile,
      week: Number.isInteger(g.week) && g.week >= 1 && g.week <= SPORTS_PROGRAM_WEEKS ? g.week : 1,
      cycle: Number.isInteger(g.cycle) && g.cycle >= 0 ? g.cycle : 0,
      weekAdjust: g.weekAdjust && typeof g.weekAdjust === "object" && !Array.isArray(g.weekAdjust)
        ? Object.fromEntries(Object.entries(g.weekAdjust).filter(([week, value]) => /^\d+$/.test(week) && [-1, 0, 1].includes(value)))
        : {},
      finished: g.finished === true,
      log: Array.isArray(g.log)
        ? g.log.filter((entry) => entry && Number.isInteger(entry.week) && ["progress", "continue", "repeat", "ease", "override"].includes(entry.outcome) && isDay(entry.day))
          .map((entry) => ({ week: entry.week, outcome: entry.outcome, day: entry.day, followed: entry.followed !== false })).slice(-60)
        : []
    }
    : null;
  const runs = Array.isArray(saved.runs)
    ? saved.runs.filter((run) => run && typeof run.id === "string" && isDay(run.day) && Number(run.meters) > 0 && Number(run.seconds) > 0)
      .map((run) => ({
        id: run.id,
        day: run.day,
        type: sportsRunTypes[run.type] ? run.type : "other",
        meters: Math.round(Number(run.meters)),
        seconds: Math.round(Number(run.seconds)),
        rpe: Number.isInteger(run.rpe) && run.rpe >= 1 && run.rpe <= 10 ? run.rpe : null,
        splits: Array.isArray(run.splits) ? run.splits.map(Number).filter((n) => Number.isFinite(n) && n >= 5 && n <= 900).slice(0, 12) : [],
        note: typeof run.note === "string" ? run.note.slice(0, 200) : "",
        programId: typeof run.programId === "string" ? run.programId : ""
      }))
    : [];
  const rating = (value, low, high) => (Number.isInteger(value) && value >= low && value <= high ? value : null);
  const checkins = Array.isArray(saved.checkins)
    ? saved.checkins.filter((entry) => entry && typeof entry.id === "string" && isDay(entry.day) && typeof entry.programId === "string"
      && Number.isInteger(entry.week) && Number.isInteger(entry.slot))
      .map((entry) => ({
        id: entry.id,
        programId: entry.programId,
        week: entry.week,
        cycle: Number.isInteger(entry.cycle) && entry.cycle >= 0 ? entry.cycle : 0,
        slot: entry.slot,
        day: entry.day,
        rpe: rating(entry.rpe, 1, 10),
        fatigue: rating(entry.fatigue, 1, 5),
        recovery: rating(entry.recovery, 1, 5),
        pain: entry.pain === true,
        note: typeof entry.note === "string" ? entry.note.slice(0, 200) : ""
      }))
    : [];
  return { profile, program, runs, checkins };
}

function sportsPace(meters, seconds) {
  // Seconds per kilometer and per mile.
  return { perKm: (seconds / meters) * 1000, perMile: (seconds / meters) * 1609.344 };
}

function sportsClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

// "Time to beat" text for repeats, only when the athlete has an 800 m time.
function sportsAverage(values) {
  const list = values.filter((value) => Number.isFinite(value));
  return list.length ? list.reduce((sum, value) => sum + value, 0) / list.length : null;
}

function sportsPaceHint(profile, meters) {
  if (!profile.current800Seconds) return "";
  return " (about " + sportsClock((profile.current800Seconds / 800) * meters) + " per " + meters + " m at current 800 m pace)";
}

// ---------- Program generator ----------

function sportsTrackBuilder(profile, week, adjust) {
  const rules = sportsAgeRules(profile.age);
  const phase = sportsPhaseForWeek(week);
  const light = sportsLightWeek(week);
  const season = profile.phase === "season" && profile.practiceDays.length > 0;
  const bodyweightOnly = !profile.locations.includes("gym");
  const track = profile.trackAccess;
  const scale = adjust < 0 ? 0.8 : adjust > 0 ? 1.1 : 1;
  const sets = Math.max(2, Math.min(3, (phase.id === "foundation" ? 2 : 3) - (adjust < 0 ? 1 : 0) + (light ? -1 : 0)));
  const [repLow, repHigh] = rules.strengthReps;
  const reps = phase.id === "foundation" ? repHigh - 2 : phase.id === "development" ? Math.round((repLow + repHigh) / 2) + 1 : Math.round((repLow + repHigh) / 2);
  const baseEasy = [15, 18, 20, 15, 22, 25, 28, 20, 25, 28, 30, 20][week - 1];
  const easyMinutes = Math.min(rules.maxEasyMinutes, Math.max(10, Math.round((baseEasy * scale) / 1) ));
  const strides = Math.max(3, Math.min(8, (phase.id === "foundation" ? 4 : 6) + (adjust > 0 ? 1 : 0) - (adjust < 0 || light ? 1 : 0)));
  const outdoorsNote = profile.locations.includes("outdoors") ? "on a park path, grass or quiet road" : "on a treadmill";

  const ex = (exercise, setCount, repCount, extra) => {
    const info = sportsExerciseInfo[exercise];
    const timed = sportsTimedExercises.includes(exercise) || ["Plank", "Superman", "Pallof press"].includes(exercise);
    const block = { kind: "exercise", exercise, category: info.category, sets: setCount, why: info.why };
    if (timed) block.seconds = repCount; else block.reps = repCount;
    return Object.assign(block, extra || {});
  };
  const run = (runType, name, detail, effort, extra) => Object.assign({ kind: "run", runType, coachKey: runType, category: "endurance", name, detail, effort, why: sportsWhy[runType] }, extra || {});
  const warm = [ex("Leg swings", 1, 10), ex("90/90 hip switch", 1, 8)];
  const cool = [ex("Hip flexor stretch", 1, 30), ex("Hamstring stretch", 1, 30), ex("Calf stretch", 1, 30)];
  const drills = [ex("A-skip", 2, 4), ex("B-skip", 2, 4), ex("High knees", 2, 4), ex("Butt kicks", 2, 4)];
  if (phase.id !== "foundation") drills.push(ex("Straight-leg skips", 2, 4), ex("Arm swing drill", 2, 10));
  if (phase.id !== "foundation" && !light) drills.push(ex("Calf pogo hops", 2, 8));
  const strengthA = bodyweightOnly
    ? [ex("Bodyweight squat", sets, reps), ex("Step-up", sets, Math.max(6, reps - 2)), ex("Glute bridge", sets, reps), ex("Standing calf raise", sets, reps + 2)]
    : [ex("Goblet squat", sets, reps), ex("Step-up with knee raise", sets, Math.max(6, reps - 2)), ex("Glute bridge", sets, reps), ex("Standing calf raise", sets, reps + 2)];
  const strengthB = bodyweightOnly
    ? [ex("Hip hinge", sets, reps), ex("Walking lunge", sets, Math.max(6, reps - 2)), ex("Single-leg glute bridge", sets, Math.max(6, reps - 2))]
    : [ex("Romanian deadlift", sets, reps), ex("Dumbbell lunge", sets, Math.max(6, reps - 2)), ex("Single-leg glute bridge", sets, Math.max(6, reps - 2))];
  if (phase.id !== "foundation" && !bodyweightOnly) strengthB.splice(2, 0, ex("Bulgarian split squat", sets, Math.max(6, reps - 3)));
  const core = [ex("Plank", sets, 20 + week * 2), ex("Dead bug", sets, 8), ex("Bird dog", sets, 8)];
  if (phase.id !== "foundation") core.push(ex("Side plank", sets, 20));
  if (phase.id === "event") core.push(ex("Reverse crunch", sets, 10));

  if (season) {
    const support = [
      {
        key: "support-strength", title: "Strength and core support", focus: "Leg strength, core and mobility. No hard running: practice covers that.",
        blocks: [...warm, ...strengthA.map((b) => ({ ...b, sets: Math.max(2, b.sets - 1) })), ...core.slice(0, 3), ...cool]
      },
      {
        key: "support-mechanics", title: "Mechanics and recovery", focus: "Easy movement, running form and mobility to keep legs fresh for practice and meets.",
        blocks: [
          ...warm,
          run("easy", "Easy jog", "Optional: 10-15 minutes very easy " + outdoorsNote, "RPE 2-3", { minutes: 12 }),
          ...drills.slice(0, 4),
          ...cool
        ]
      }
    ];
    return support.slice(0, Math.max(1, Math.min(2, profile.days.length)));
  }

  const hardCap = Math.min(rules.maxRpeHard, 8);
  let day1;
  let day2;
  let day3;
  if (phase.id === "foundation") {
    day1 = { key: "d1", title: "Endurance and leg strength", focus: "Easy running plus leg strength.", blocks: [...warm, run("easy", "Easy run", easyMinutes + " minutes " + outdoorsNote + ", conversation pace", "RPE 3-4", { minutes: easyMinutes }), ...strengthA, ...cool] };
    day2 = { key: "d2", title: "Speed and running mechanics", focus: "Form drills and short, relaxed strides.", blocks: [...warm, ...drills, ...(week >= 3 && !light ? [run("accel", "Acceleration runs", "3 x 20 m from a standing start, gradually speeding up to smooth and fast by 20 m, walk back for full recovery", "RPE 6-7", { category: "speed", reps: 3 })] : []), run("strides", "Strides", strides + " x 60-80 m fast but relaxed, walk back for rest", "RPE 6", { category: "speed", reps: strides }), ...core, ...cool] };
    day3 = {
      key: "d3", title: "Speed endurance and conditioning", focus: "Fun surges, then strength and core.",
      blocks: [...warm, run("fartlek", "Fartlek", (light ? 3 : 5) + " x 30 seconds quick (not all-out) inside a " + Math.max(12, easyMinutes) + "-minute easy run, 2 minutes easy between", "RPE 6-7 on surges", { category: "speedEndurance", minutes: Math.max(12, easyMinutes) }), ...strengthB, ...cool]
    };
    if (week === 4) day3.blocks.splice(1, 0, run("check", "Optional pace check", (track ? "One 600 m on the track" : "One 600 m on a measured flat route (phone GPS is fine)") + " at a steady, strong effort, not all-out. Fully optional: skip it if he is tired, sore or not interested. Progress never depends on it.", "RPE 7", { category: "speedEndurance", meters: 600 }));
  } else if (phase.id === "development") {
    day1 = { key: "d1", title: "Endurance and leg strength", focus: "Longer easy run, with steady pickups, plus leg strength.", blocks: [...warm, run("easy", "Easy run with pickups", easyMinutes + " minutes " + outdoorsNote + ", with " + (light ? 2 : 4) + " x 1 minute at a steady pace in the middle, easy 2 minutes between", "RPE 3-4, pickups RPE 5-6", { minutes: easyMinutes }), ...strengthA, ...cool] };
    day2 = {
      key: "d2", title: "Speed and running mechanics", focus: "Drills, strides and short sprints.",
      blocks: [...warm, ...drills, run("accel", "Acceleration runs", (light ? 3 : 4) + " x 25-30 m from a standing start, building to fast and smooth, walk back for full recovery", "RPE 7", { category: "speed", reps: 4 }), run("strides", "Strides", strides + " x 80 m smooth and fast, walk back for rest", "RPE 6-7", { category: "speed", reps: strides }),
        ...(light ? [] : [run("hills", "Hill sprints", Math.min(rules.maxRepeats, 4 + (adjust > 0 ? 1 : 0)) + " x 8-10 seconds up a gentle hill, walk down for full recovery (about 1 minute or more)", "RPE 7-8", { category: "speed", reps: 4 })]),
        ...core, ...cool]
    };
    const repeats = Math.min(rules.maxRepeats, (light ? 2 : 3) + (adjust > 0 ? 1 : 0));
    day3 = {
      key: "d3", title: "Speed endurance and conditioning", focus: "Controlled repeats, then leg strength.",
      blocks: [...warm, track
        ? run("repeats", "200 m repeats", repeats + " x 200 m at about 800 m effort" + sportsPaceHint(profile, 200) + ", walk or jog 200 m between", "RPE " + (hardCap - 1) + "-" + hardCap, { category: "speedEndurance", meters: 200, reps: repeats, coachKey: "repeatsTrack" })
        : run("repeats", "Hill or field repeats", repeats + " x 40-45 seconds strong (not all-out) up a gentle hill or across a field, walk back for full recovery", "RPE " + (hardCap - 1) + "-" + hardCap, { category: "speedEndurance", reps: repeats, coachKey: "repeatsField" }), ...strengthB, ...cool]
    };
  } else {
    day1 = { key: "d1", title: "Endurance and leg strength", focus: "Steady running that raises the pace you can hold, plus lighter leg strength.", blocks: [...warm, run("tempo", "Steady run", Math.max(10, Math.round(easyMinutes * 0.6)) + " minutes " + outdoorsNote + " at a comfortably hard, steady pace inside a " + easyMinutes + "-minute run", "RPE 6", { category: "endurance", minutes: easyMinutes }), ...strengthA.map((b) => ({ ...b, sets: Math.max(2, b.sets - 1) })), ...cool] };
    day2 = { key: "d2", title: "Speed and running mechanics", focus: "Sharp, relaxed speed.", blocks: [...warm, ...drills, run("strides", "Fast strides", strides + " x 100 m quick and relaxed with full recovery", "RPE 7", { category: "speed", reps: strides }), ...core, ...cool] };
    const repeats = Math.min(rules.maxRepeats, (light ? 2 : 3) + (adjust > 0 ? 1 : 0));
    day3 = {
      key: "d3", title: "Event-specific session", focus: "Practise the feel of 800 m pace with full recovery.",
      blocks: [...warm, track
        ? run("repeats", "400 m repeats", repeats + " x 400 m at about 800 m pace" + sportsPaceHint(profile, 400) + ", walk or jog 3-4 minutes between. Aim for each 400 to be within 2-3 seconds of the first", "RPE " + hardCap, { category: "speedEndurance", meters: 400, reps: repeats, coachKey: "repeatsTrack" })
        : run("repeats", "Race-feel repeats", repeats + " x 90 seconds strong and smooth (use phone GPS to note the distance), walk or jog 3-4 minutes between. Aim for each rep to cover about the same distance", "RPE " + hardCap, { category: "speedEndurance", reps: repeats, coachKey: "repeatsField" }),
        ...strengthB.slice(0, 3).map((b) => ({ ...b, sets: Math.max(2, b.sets - 1) })), ...cool]
    };
    if (week === 12) day3.focus = "Taper week: sharpen up and stay fresh. Race or time trial if the coach agrees.";
  }
  return [day1, day2, day3];
}

const sportsBuilders = { "track/800m": sportsTrackBuilder };

// Returns the workouts for a week: [{slot, key, title, focus, blocks:[...]}]
function sportsBuildWeek(profile, week, adjust) {
  const builder = sportsBuilders[profile.sport + "/" + profile.event];
  if (!builder) return [];
  return builder(profile, week, adjust || 0).map((workout, index) => ({ ...workout, slot: index + 1 }));
}

// ---------- Records ----------

// Best (fastest) run for each rounded distance; only runs of 200 m or more count.
function sportsRunRecords(runs) {
  const groups = new Map();
  runs.forEach((run) => {
    if (run.meters < 200) return;
    const key = Math.round(run.meters / 100) * 100;
    const best = groups.get(key);
    const pace = run.seconds / run.meters;
    if (!best || pace < best.seconds / best.meters) groups.set(key, run);
  });
  return [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([key, run]) => ({ key, run }));
}

// True when this run is faster than every earlier run at the same rounded distance.
function sportsIsRunRecord(run, runs) {
  if (run.meters < 200) return false;
  const key = Math.round(run.meters / 100) * 100;
  const others = runs.filter((other) => other.id !== run.id && other.meters >= 200 && Math.round(other.meters / 100) * 100 === key
    && (other.day < run.day || (other.day === run.day && runs.indexOf(other) < runs.indexOf(run))));
  if (others.length === 0) return false;
  return run.seconds / run.meters < Math.min(...others.map((other) => other.seconds / other.meters)) - 1e-9;
}

if (typeof module !== "undefined" && module.exports) {
  Object.assign(module.exports, {
    sportsCatalog, sportsCategories, sportsPhases, sportsExerciseInfo, sportsDefaultProfile, sportsValidateProfile,
    normalizeSports, sportsBuildWeek, sportsAverage, sportsRunRecords, sportsIsRunRecord, sportsPace, sportsClock,
    sportsAgeRules, sportsPhaseForWeek, SPORTS_PROGRAM_WEEKS, sportsTimedExercises, sportsRepsOnlyExercises
  });
}
