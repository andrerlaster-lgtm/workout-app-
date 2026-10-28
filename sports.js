// Sports Performance Training screen. Data and rules live in sports-data.js.
// Strength, core, drill and mobility work is loaded into the normal Log; runs and check-ins are recorded here.

const sportsRoot = document.getElementById("sports-root");
const SPORTS_DAY_NAMES = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };
const SPORTS_DRILL_PASSES = ["A-skip", "B-skip", "Butt kicks", "Straight-leg skips", "High knees"];
let sportsStep = 1; // 1 sport, 2 event, 3 profile (only used while setting up)
let sportsDraft = null;
let sportsEditing = false;
let sportsError = "";
let sportsCoachSlot = null; // slot number of the workout open in coaching mode
let sportsEasyMode = false;
let sportsReady = { energy: 4, soreness: "none", sleep: "good", illness: false };

function sp(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function sportsButton(label, className, onClick) {
  const button = sp("button", className, label);
  button.type = "button";
  button.addEventListener("click", onClick);
  return button;
}

function sportsProgram() {
  return state.sports.program;
}

function sportsProgramCheckins() {
  const program = sportsProgram();
  return program ? state.sports.checkins.filter((entry) => entry.programId === program.id) : [];
}

function sportsSlotDone(week, cycle, slot) {
  return sportsProgramCheckins().find((entry) => entry.week === week && entry.cycle === cycle && entry.slot === slot) || null;
}

function sportsDayLabel(profile, slot) {
  const sorted = [...profile.days].sort((a, b) => SPORTS_DAYS.indexOf(a) - SPORTS_DAYS.indexOf(b));
  return sorted[slot - 1] ? SPORTS_DAY_NAMES[sorted[slot - 1]] : "";
}

function sportsSessionKey(program, slot) {
  return [program.id, program.week, program.cycle, slot].join(":");
}

function sportsDistanceText(meters) {
  if (!meters) return "no distance";
  if (meters < 1000) return meters + " m";
  return state.weightUnit === "kg" ? cleanNumber(meters / 1000) + " km" : cleanNumber(meters / 1609.344) + " mi";
}

function sportsPaceText(run) {
  if (!run.meters) return "-";
  const pace = sportsPace(run.meters, run.seconds);
  return state.weightUnit === "kg" ? sportsClock(pace.perKm) + "/km" : sportsClock(pace.perMile) + "/mi";
}

// ---------- Setup: sport, event, profile ----------

function sportsStartSetup(fromProfile, editing) {
  sportsDraft = JSON.parse(JSON.stringify(fromProfile));
  sportsEditing = editing;
  sportsStep = editing ? 3 : 1;
  sportsError = "";
  renderSports();
}

function sportsStepper(step) {
  const list = sp("ol", "sp-steps");
  ["Sport", "Event", "Athlete", "Program"].forEach((label, index) => {
    const item = sp("li", index + 1 === step ? "is-current" : index + 1 < step ? "is-done" : "", label);
    list.append(item);
  });
  return list;
}

function renderSportsSport() {
  const card = sp("div", "sp-card");
  card.append(sportsStepper(1), sp("h2", "", "Choose a sport"));
  const grid = sp("div", "sp-grid");
  Object.entries(sportsCatalog).forEach(([id, sport]) => {
    const button = sp("button", "sp-choice" + (sportsDraft.sport === id ? " is-selected" : ""));
    button.type = "button";
    button.append(sp("strong", "", sport.name), sp("span", "", Object.keys(sport.events).length + (Object.keys(sport.events).length === 1 ? " event" : " events")));
    button.addEventListener("click", () => {
      if (sportsDraft.sport !== id) sportsDraft.event = Object.keys(sport.events)[0];
      sportsDraft.sport = id;
      sportsStep = 2;
      renderSports();
    });
    grid.append(button);
  });
  card.append(grid, sp("p", "special-note", "More sports and events can be added here later."));
  sportsRoot.append(card);
}

function renderSportsEvent() {
  const sport = sportsCatalog[sportsDraft.sport];
  const card = sp("div", "sp-card");
  card.append(sportsStepper(2), sp("h2", "", sport.name + ": choose an event"));
  const grid = sp("div", "sp-grid");
  Object.entries(sport.events).forEach(([id, event]) => {
    const button = sp("button", "sp-choice" + (sportsDraft.event === id ? " is-selected" : ""));
    button.type = "button";
    button.append(sp("strong", "", event.name), sp("span", "", event.blurb));
    button.addEventListener("click", () => {
      sportsDraft.event = id;
      sportsStep = 3;
      renderSports();
    });
    grid.append(button);
  });
  card.append(grid, sportsButton("Back", "ghost-button small", () => { sportsStep = 1; renderSports(); }));
  sportsRoot.append(card);
}

function sportsDayChips(label, key, hint) {
  const wrap = sp("fieldset", "sp-field");
  wrap.append(sp("legend", "", label));
  const row = sp("div", "sp-chips");
  SPORTS_DAYS.forEach((day) => {
    const on = sportsDraft[key].includes(day);
    const chip = sp("button", "sp-chip" + (on ? " is-on" : ""), SPORTS_DAY_NAMES[day]);
    chip.type = "button";
    chip.setAttribute("aria-pressed", String(on));
    chip.addEventListener("click", () => {
      sportsDraft[key] = on ? sportsDraft[key].filter((entry) => entry !== day) : [...sportsDraft[key], day];
      if (key === "practiceDays") sportsDraft.days = sportsDraft.days.filter((entry) => !sportsDraft.practiceDays.includes(entry));
      renderSports();
    });
    row.append(chip);
  });
  wrap.append(row);
  if (hint) wrap.append(sp("small", "", hint));
  return wrap;
}

function sportsSelect(id, label, options, value, onChange) {
  const wrap = sp("div", "sp-field");
  const lab = sp("label", "", label);
  lab.setAttribute("for", id);
  const select = sp("select", "unit-select");
  select.id = id;
  options.forEach(([val, text]) => {
    const option = sp("option", "", text);
    option.value = val;
    select.append(option);
  });
  select.value = String(value);
  select.addEventListener("change", () => onChange(select.value));
  wrap.append(lab, select);
  return wrap;
}

function renderSportsProfile() {
  const sport = sportsCatalog[sportsDraft.sport];
  const event = sport.events[sportsDraft.event];
  const card = sp("form", "sp-card");
  card.noValidate = true;
  card.append(sportsStepper(3), sp("h2", "", sportsEditing ? "Edit athlete profile" : "Athlete profile"));
  card.append(sp("p", "special-note", sport.name + " · " + event.name + ". Changes apply to the weeks you have not started yet."));

  const age = sp("div", "sp-field");
  const ageLabel = sp("label", "", "Age");
  ageLabel.setAttribute("for", "sp-age");
  const ageInput = sp("input", "set-input");
  ageInput.id = "sp-age";
  ageInput.type = "number";
  ageInput.inputMode = "numeric";
  ageInput.min = "10";
  ageInput.max = "19";
  ageInput.value = String(sportsDraft.age);
  ageInput.addEventListener("input", () => { sportsDraft.age = Number(ageInput.value); });
  age.append(ageLabel, ageInput);
  card.append(age);

  card.append(sportsSelect("sp-exp", "Experience", [["beginner", "Beginner"], ["intermediate", "Intermediate"]], sportsDraft.experience, (v) => { sportsDraft.experience = v; }));
  card.append(sportsSelect("sp-phase", "Training phase", [["preseason", "Preseason"], ["season", "Track season (school practices)"]], sportsDraft.phase, (v) => { sportsDraft.phase = v; renderSports(); }));

  const season = sportsDraft.phase === "season";
  if (season) {
    card.append(sportsDayChips("School practice and meet days", "practiceDays", "Hard running is covered by practice, so the plan only adds light support work on other days."));
    card.append(sportsDayChips("Extra training days (pick 1 or 2, not back to back)", "days"));
  } else {
    card.append(sportsDayChips("Training days (pick 3, not back to back)", "days"));
  }

  const places = sp("fieldset", "sp-field");
  places.append(sp("legend", "", "Where can you train?"));
  [["gym", "Gym"], ["outdoors", "Outdoors"]].forEach(([id, text]) => {
    const row = sp("label", "check-row");
    const box = sp("input");
    box.type = "checkbox";
    box.checked = sportsDraft.locations.includes(id);
    box.addEventListener("change", () => {
      sportsDraft.locations = box.checked ? [...new Set([...sportsDraft.locations, id])] : sportsDraft.locations.filter((entry) => entry !== id);
    });
    row.append(box, sp("span", "", text));
    places.append(row);
  });
  const track = sp("label", "check-row");
  const trackBox = sp("input");
  trackBox.type = "checkbox";
  trackBox.checked = sportsDraft.trackAccess;
  trackBox.addEventListener("change", () => { sportsDraft.trackAccess = trackBox.checked; });
  track.append(trackBox, sp("span", "", "I can use a track"));
  places.append(track);
  card.append(places);

  const time = sp("fieldset", "sp-field");
  time.append(sp("legend", "", "Current " + event.name + " time (leave blank if unknown)"));
  const row = sp("div", "sp-row");
  const mins = sp("input", "set-input");
  const secs = sp("input", "set-input");
  [mins, secs].forEach((input, index) => {
    input.type = "number";
    input.inputMode = "numeric";
    input.min = "0";
    input.max = index ? "59" : "9";
    input.placeholder = index ? "sec" : "min";
    input.setAttribute("aria-label", index ? "Seconds" : "Minutes");
  });
  if (sportsDraft.current800Seconds) {
    mins.value = String(Math.floor(sportsDraft.current800Seconds / 60));
    secs.value = String(sportsDraft.current800Seconds % 60);
  }
  const syncTime = () => {
    const total = Number(mins.value || 0) * 60 + Number(secs.value || 0);
    sportsDraft.current800Seconds = mins.value === "" && secs.value === "" ? null : (total >= 90 && total <= 600 ? total : -1);
  };
  mins.addEventListener("input", syncTime);
  secs.addEventListener("input", syncTime);
  row.append(mins, secs);
  time.append(row, sp("small", "", "Without a time, pace targets stay effort-based. Record an 800 m time trial later and they update."));
  card.append(time);

  const error = sp("p", "field-error", sportsError);
  error.setAttribute("role", "alert");
  card.append(error);

  const actions = sp("div", "sp-actions");
  actions.append(sportsButton(sportsEditing ? "Cancel" : "Back", "ghost-button", () => {
    if (sportsEditing) { sportsEditing = false; sportsDraft = null; } else sportsStep = 2;
    sportsError = "";
    renderSports();
  }));
  const submit = sp("button", "finish-button", sportsEditing ? "Save profile" : "Generate training program");
  submit.type = "submit";
  actions.append(submit);
  card.append(actions);
  card.addEventListener("submit", (event2) => {
    event2.preventDefault();
    if (sportsDraft.current800Seconds === -1) { sportsError = "Enter an 800 m time between 1:30 and 10:00, or leave it blank."; renderSports(); return; }
    const problem = sportsValidateProfile(sportsDraft);
    if (problem) { sportsError = problem; renderSports(); return; }
    sportsError = "";
    state.sports.profile = JSON.parse(JSON.stringify(sportsDraft));
    if (sportsEditing && sportsProgram()) {
      sportsProgram().profile = JSON.parse(JSON.stringify(sportsDraft));
      showToast("Profile updated.");
    } else {
      state.sports.program = {
        id: makeId(), startedAt: new Date().toISOString(), profile: JSON.parse(JSON.stringify(sportsDraft)),
        week: 1, cycle: 0, weekAdjust: {}, finished: false, log: []
      };
      showToast("Your 12-week program is ready.");
    }
    sportsEditing = false;
    sportsDraft = null;
    saveState();
    renderSports();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  sportsRoot.append(card);
}

// ---------- Program ----------

function sportsBlockLine(block) {
  if (block.kind === "run") return block.detail;
  if (block.seconds) return block.sets + " × " + block.seconds + " s hold" + (block.category === "mobility" ? " each side" : "");
  if (block.category === "mechanics" && SPORTS_DRILL_PASSES.includes(block.exercise)) return block.sets + " rounds × " + block.reps + " passes of about 20 m";
  return block.sets + " × " + block.reps + " reps";
}

function loadSportsWorkout(workout) {
  const program = sportsProgram();
  if (!state.session) {
    state.session = { id: makeId(), startedAt: new Date().toISOString(), workoutDate: state.workoutDate, weightUnit: state.weightUnit, exercises: [] };
  }
  if (!state.session.sportsKey) state.session.sportsKey = sportsSessionKey(program, workout.slot);
  let added = 0;
  workout.blocks.filter((block) => block.kind === "exercise").forEach((block) => {
    const existing = state.session.exercises.find((item) => item.exercise === block.exercise);
    const target = block.reps ? { targetReps: block.reps, targetSets: block.sets } : {};
    if (existing) { Object.assign(existing, target); return; }
    state.session.exercises.push({ id: makeId(), muscle: sportsCategories[block.category], exercise: block.exercise, sets: [], ...target });
    added += 1;
  });
  state.appView = "log";
  saveState();
  renderApp();
  document.getElementById("log-heading").focus();
  showToast(added ? "Loaded " + plural(added, "exercise") + " from " + workout.title + "." : "Those exercises are already in your Log.");
}

function renderSportsBlock(block, workout) {
  const item = sp("li", "sp-block");
  const head = sp("div", "sp-block-head");
  head.append(sp("span", "sp-tag", sportsCategories[block.category]));
  const title = sp("strong", "", block.exercise || block.name);
  head.append(title);
  if (block.kind === "exercise") head.append(guideButton(block.exercise));
  item.append(head, sp("p", "sp-block-line", sportsBlockLine(block) + (block.effort ? " · " + block.effort : "")));
  item.append(sp("p", "sp-why", "How it helps: " + block.why));
  if (block.kind === "run") {
    head.append(guideButton(sportsRunGuideName(block)));
    const row = sp("div", "sp-actions");
    row.append(sportsButton("Track this run", "finish-button", () => openSportsRunTracker(block)), sportsButton("Enter by hand", "ghost-button small", () => openRunDialog(block)));
    item.append(row);
  }
  return item;
}

function renderSportsWorkout(workout, program, today) {
  const done = sportsSlotDone(program.week, program.cycle, workout.slot);
  const dayLabel = sportsDayLabel(program.profile, workout.slot);
  const details = sp("details", "sp-workout" + (done ? " is-done" : ""));
  if (!done && dayLabel === today) details.open = true;
  const summary = sp("summary");
  summary.append(sp("span", "sp-day", dayLabel || "Day " + workout.slot), sp("strong", "", workout.title));
  summary.append(sp("span", "sp-status" + (done ? " is-done" : ""), done ? "Done" : dayLabel === today ? "Today" : "To do"));
  const coach = sp("button", "coach-chip", "Coach me");
  coach.type = "button";
  coach.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    sportsCoachSlot = workout.slot;
    sportsEasyMode = false;
    renderSports();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  summary.append(coach);
  details.append(summary);
  details.append(sp("p", "sp-focus", workout.focus));
  const list = sp("ol", "sp-blocks");
  workout.blocks.forEach((block) => list.append(renderSportsBlock(block, workout)));
  details.append(list);

  const hasExercises = workout.blocks.some((block) => block.kind === "exercise");
  const hasRuns = workout.blocks.some((block) => block.kind === "run");
  const key = sportsSessionKey(program, workout.slot);
  const logged = state.history.some((entry) => entry.sportsKey === key);
  const actions = sp("div", "sp-actions");
  if (hasExercises) actions.append(sportsButton(logged ? "Strength logged ✓ (add more)" : "Load exercises in Log", "ghost-button", () => loadSportsWorkout(workout)));
  if (hasRuns) actions.append(sportsButton("Log a run", "ghost-button", () => openRunDialog(null)));
  actions.append(sportsButton(done ? "Update check-in" : "Complete workout", "finish-button", () => openCheckinDialog(workout)));
  details.append(actions);
  if (done) {
    details.append(sp("p", "special-note", "Checked in " + shortDay(done.day) + ": effort " + (done.rpe ?? "-") + "/10 · fatigue " + (done.fatigue ?? "-") + "/5 · recovery " + (done.recovery ?? "-") + "/5" + (done.pain ? " · pain reported" : "")));
  }
  return details;
}

function sportsWeekWorkouts(program) {
  const adjust = program.weekAdjust[String(program.week)] || 0;
  return sportsBuildWeek(program.profile, program.week, adjust);
}

function renderSportsProgram() {
  const program = sportsProgram();
  const profile = program.profile;
  const sport = sportsCatalog[profile.sport];
  const phase = sportsPhaseForWeek(program.week);
  const rules = sportsAgeRules(profile.age);
  const workouts = sportsWeekWorkouts(program);
  const today = SPORTS_DAYS[(new Date().getDay() + 6) % 7];
  const todayLabel = SPORTS_DAY_NAMES[today];
  const adjust = program.weekAdjust[String(program.week)] || 0;
  if (sportsCoachSlot) {
    const target = workouts.find((entry) => entry.slot === sportsCoachSlot);
    if (target) { renderSportsCoach(target, program); return; }
    sportsCoachSlot = null;
  }

  const pending = sportsPendingCard();
  if (pending) sportsRoot.append(pending);
  const head = sp("div", "sp-card");
  head.append(sp("p", "sp-kicker", (sport.name + " · " + sport.events[profile.event].name).toUpperCase()));
  head.append(sp("h2", "", program.finished ? "Program complete" : "Week " + program.week + " of " + SPORTS_PROGRAM_WEEKS + " · " + phase.name));
  head.append(sp("p", "special-note", program.finished ? "Great work. Start a new program to keep building. Your runs, check-ins and records stay saved." : phase.goal));
  const bar = sp("div", "sp-progress");
  const fill = sp("span");
  fill.style.width = Math.round(((program.finished ? SPORTS_PROGRAM_WEEKS : program.week - 1) / SPORTS_PROGRAM_WEEKS) * 100) + "%";
  bar.append(fill);
  head.append(bar);
  const facts = [
    "Age " + profile.age, profile.experience === "beginner" ? "Beginner" : "Intermediate", profile.phase === "season" ? "Track season" : "Preseason",
    profile.days.length + " days: " + [...profile.days].sort((a, b) => SPORTS_DAYS.indexOf(a) - SPORTS_DAYS.indexOf(b)).map((day) => SPORTS_DAY_NAMES[day]).join(" · "),
    profile.locations.join(" + "), profile.trackAccess ? "Track access" : "No track access",
    profile.current800Seconds ? "800 m: " + sportsClock(profile.current800Seconds) : "800 m time unknown"
  ];
  head.append(sp("p", "sp-facts", facts.join(" · ")));

  const trackRow = sp("label", "check-row");
  const trackBox = sp("input");
  trackBox.type = "checkbox";
  trackBox.checked = profile.trackAccess;
  trackBox.addEventListener("change", () => {
    program.profile.trackAccess = trackBox.checked;
    state.sports.profile.trackAccess = trackBox.checked;
    saveState();
    renderSports();
    showToast(trackBox.checked ? "Track workouts are on for upcoming sessions." : "Track workouts are off. Outdoor options are used instead.");
  });
  trackRow.append(trackBox, sp("span", "", "I have track access now"));
  head.append(trackRow);
  sportsRoot.append(head);

  const note = sp("div", "sp-banner");
  note.append(sp("strong", "", "Safe training"), sp("p", "", rules.note + " Warm up first, stop if something hurts, and follow your coach and doctor. Lift with an adult or coach nearby."));
  if (profile.phase === "season" && profile.practiceDays.length) {
    note.append(sp("p", "", "Season mode: school practice sets your hard running. These sessions are light support work; skip them if you are sore or have a meet within 24 hours."));
  }
  sportsRoot.append(note);

  if (!program.finished) {
    const week = sp("div", "sp-card");
    week.append(sp("h2", "", "This week"));
    if (adjust !== 0) week.append(sp("p", "special-note", adjust < 0 ? "This week is eased back about 20% based on recent check-ins." : "This week has a small optional step up (up to about 10%) because recent check-ins looked good. Do less if he feels tired."));
    if (sportsLightWeek(program.week)) week.append(sp("p", "special-note", "Light week: less volume so the body can absorb the training."));
    week.append(sportsButton("Track a run (GPS, treadmill or timed)", "ghost-button rt-launch", () => openSportsRunTracker(null)));
    const holder = sp("div", "sp-workouts");
    workouts.forEach((workout) => holder.append(renderSportsWorkout(workout, program, todayLabel)));
    week.append(holder);

    const decision = sportsCurrentDecision(program, workouts);
    week.append(renderSportsDecision(decision));
    const nav = sp("div", "sp-actions");
    const recommendedAdvance = decision.advance;
    const advanceLabel = program.week === SPORTS_PROGRAM_WEEKS ? "Finish program" : "Next week →";
    const repeatLabel = decision.outcome === "ease" ? "Repeat easier" : "Repeat this week";
    if (recommendedAdvance) {
      nav.append(sportsButton(repeatLabel, "ghost-button", () => sportsMoveOn(decision, false)));
      nav.append(sportsButton(advanceLabel + " (recommended)", "finish-button", () => sportsMoveOn(decision, true)));
    } else {
      nav.append(sportsButton((program.week === SPORTS_PROGRAM_WEEKS ? "Finish anyway" : "Move on anyway"), "ghost-button", () => sportsMoveOn(decision, true)));
      nav.append(sportsButton(repeatLabel + " (recommended)", "finish-button", () => sportsMoveOn(decision, false)));
    }
    week.append(nav);
    sportsRoot.append(week);
  }

  renderSportsProgress(program);

  const foot = sp("div", "sp-actions");
  foot.append(sportsButton("Edit athlete profile", "ghost-button", () => sportsStartSetup(program.profile, true)));
  foot.append(sportsButton("Start a new program", "ghost-button danger", async () => {
    const ok = await confirmAction("Start a new program?", "This replaces the current plan. Your runs, check-ins, records and History stay saved.", "Start new");
    if (!ok) return;
    state.sports.program = null;
    sportsStartSetup({ ...program.profile, current800Seconds: state.sports.profile.current800Seconds }, false);
    saveState();
  }));
  sportsRoot.append(renderSportsKnowledge());
  sportsRoot.append(foot);
}

// ---------- Progress ----------

function sportsStat(label, value) {
  const box = sp("div", "sp-stat");
  box.append(sp("strong", "", String(value)), sp("span", "", label));
  return box;
}

function renderSportsProgress(program) {
  const card = sp("div", "sp-card");
  card.append(sp("h2", "", "Progress"));
  const checkins = sportsProgramCheckins();
  const unique = new Set(checkins.map((entry) => entry.week + ":" + entry.cycle + ":" + entry.slot));
  const runs = state.sports.runs;
  const totalMeters = runs.reduce((sum, run) => sum + run.meters, 0);
  const stats = sp("div", "sp-stats");
  stats.append(sportsStat("workouts completed", unique.size), sportsStat("runs logged", runs.length), sportsStat("total distance", runs.length ? sportsDistanceText(totalMeters) : "-"));
  card.append(stats);

  card.append(sp("h3", "", "Personal records"));
  const records = sportsRunRecords(runs);
  if (!records.length) card.append(sp("p", "special-note", "Log runs of 200 m or more to see your fastest time for each distance."));
  else {
    const list = sp("ul", "sp-list");
    records.forEach(({ key, run }) => {
      list.append(sp("li", "", sportsDistanceText(key) + ": " + sportsClock(run.seconds) + " · " + sportsPaceText(run) + " · " + shortDay(run.day) + (run.source === "gps" ? " (GPS estimate)" : run.source === "treadmill" ? " (treadmill)" : "")));
    });
    card.append(list);
  }

  card.append(sp("h3", "", "800 m time trials"));
  const trials = runs.filter((run) => run.type === "trial" && run.meters >= 780 && run.meters <= 820).sort((a, b) => a.day.localeCompare(b.day));
  if (!trials.length) card.append(sp("p", "special-note", "Log a time trial of about 800 m to chart your time."));
  else {
    const chart = sp("div", "chart-host");
    card.append(chart);
    let best = Infinity;
    renderLineChart(chart, trials.map((run) => {
      const record = run.seconds < best;
      best = Math.min(best, run.seconds);
      return { day: run.day, value: run.seconds, record };
    }), { label: "800 m time trial times", format: (value) => sportsClock(value) });
  }

  card.append(sp("h3", "", "Recent runs"));
  if (!runs.length) card.append(sp("p", "special-note", "No runs yet. Use Log a run on a workout card."));
  else {
    const list = sp("ul", "sp-list");
    [...runs].reverse().slice(0, 6).forEach((run) => {
      const item = sp("li", "sp-run");
      const text = sp("span", "", shortDay(run.day) + " · " + sportsRunTypes[run.type] + " · " + sportsDistanceText(run.meters) + " · " + sportsClock(run.seconds) + (run.meters ? " · " + sportsPaceText(run) : "") + " · " + (run.source === "gps" ? "GPS est." : run.source === "treadmill" ? "treadmill" : run.source === "timed" ? "timed" : run.source === "track" ? "track" : "entered") + (run.rpe ? " · effort " + run.rpe : "") + (run.splits && run.splits.length >= 2 ? " · reps " + run.splits.join(", ") + " s" : ""));
      if (sportsIsRunRecord(run, runs)) text.append(sp("em", "sp-pr", " PR"));
      const remove = sp("button", "icon-button danger");
      remove.type = "button";
      remove.setAttribute("aria-label", "Delete run on " + shortDay(run.day));
      remove.innerHTML = trashIcon;
      remove.addEventListener("click", async () => {
        const ok = await confirmAction("Delete this run?", "It is removed from your records.", "Delete");
        if (!ok) return;
        state.sports.runs = state.sports.runs.filter((entry) => entry.id !== run.id);
        saveState();
        renderSports();
      });
      item.append(text, remove);
      list.append(item);
    });
    card.append(list);
  }

  card.append(sp("h3", "", "Fatigue and recovery"));
  const ordered = [...checkins].sort((a, b) => a.day.localeCompare(b.day));
  if (ordered.length < 2) card.append(sp("p", "special-note", ordered.length ? "One check-in so far. Charts appear after two." : "Complete a workout and check in to track fatigue and recovery."));
  else {
    [["fatigue", "Fatigue after workouts (1 fresh, 5 exhausted)"], ["recovery", "Recovery before workouts (1 poor, 5 great)"]].forEach(([field, label]) => {
      const points = ordered.filter((entry) => entry[field]).map((entry) => ({ day: entry.day, value: entry[field], record: false }));
      if (points.length < 2) return;
      card.append(sp("p", "special-note", label));
      const chart = sp("div", "chart-host");
      card.append(chart);
      renderLineChart(chart, points, { label, format: (value) => String(cleanNumber(value)) });
    });
  }

  card.append(sp("h3", "", "Strength improvements"));
  const names = [...new Set(sportsWeekAllExercises(program))];
  const lines = names.map((name) => ({ name, record: exerciseRecord(name) })).filter((entry) => entry.record && entry.record.points.length >= 1);
  if (!lines.length) card.append(sp("p", "special-note", "Log sets from a workout's exercises in the Log to see strength gains here."));
  else {
    const list = sp("ul", "sp-list");
    lines.forEach(({ name, record }) => {
      const first = record.points[0].value;
      const last = record.points[record.points.length - 1].value;
      const unit = record.kind === "weight" ? " " + record.unit : record.kind === "time" ? " s" : " reps";
      const change = record.points.length > 1 ? " · change " + (last - first >= 0 ? "+" : "") + cleanNumber(last - first) + unit + " since first log" : " · first log";
      list.append(sp("li", "", name + ": best " + recordText(record) + change));
    });
    card.append(list);
  }
  sportsRoot.append(card);
  renderSportsInsights(program);
}

// Strength and core exercises used anywhere in the program, for the improvements list.
function sportsWeekAllExercises(program) {
  const names = [];
  for (let week = 1; week <= SPORTS_PROGRAM_WEEKS; week += 1) {
    sportsBuildWeek(program.profile, week, 0).forEach((workout) => workout.blocks.forEach((block) => {
      if (block.kind === "exercise" && (block.category === "legStrength" || block.category === "coreStrength")) names.push(block.exercise);
    }));
  }
  return names;
}

// ---------- Dialogs ----------

const runDialog = document.getElementById("run-dialog");
const checkinDialog = document.getElementById("checkin-dialog");
let checkinWorkout = null;

function fillOptions(select, options, selected) {
  select.replaceChildren();
  options.forEach(([value, text]) => {
    const option = sp("option", "", text);
    option.value = String(value);
    select.append(option);
  });
  if (selected !== undefined) select.value = String(selected);
}

function openRunDialog(block) {
  fillOptions(document.getElementById("run-type"), Object.entries(sportsRunTypes), block && block.runType ? block.runType : "easy");
  const rpeOptions = [["", "Skip"]];
  for (let i = 1; i <= 10; i += 1) rpeOptions.push([i, String(i)]);
  fillOptions(document.getElementById("run-rpe"), rpeOptions, "");
  document.getElementById("run-date").value = localDateKey(new Date());
  const distance = document.getElementById("run-distance");
  const unit = document.getElementById("run-distance-unit");
  distance.value = block && block.meters ? String(block.meters) : "";
  unit.value = "m";
  document.getElementById("run-min").value = "";
  document.getElementById("run-sec").value = "";
  document.getElementById("run-note").value = "";
  document.getElementById("run-splits").value = "";
  document.getElementById("run-source").value = state.sports.program && state.sports.program.profile.trackAccess ? "track" : "manual";
  document.getElementById("run-error").textContent = "";
  runDialog.showModal();
}

document.getElementById("run-cancel").addEventListener("click", () => runDialog.close());
document.getElementById("run-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const error = document.getElementById("run-error");
  const day = document.getElementById("run-date").value;
  const factor = { m: 1, km: 1000, mi: 1609.344 }[document.getElementById("run-distance-unit").value] || 1;
  const meters = Math.round(Number(document.getElementById("run-distance").value) * factor);
  const seconds = Number(document.getElementById("run-min").value || 0) * 60 + Number(document.getElementById("run-sec").value || 0);
  if (!isDateKey(day)) { error.textContent = "Pick a date."; return; }
  if (!(meters >= 50 && meters <= 50000)) { error.textContent = "Enter a distance between 50 m and 50 km."; return; }
  if (!(seconds >= 10 && seconds <= 36000)) { error.textContent = "Enter the time it took."; return; }
  const speed = seconds / meters;
  if (speed < 0.1 || speed > 1.5) { error.textContent = "That time does not look right for this distance. Check the distance and time."; return; }
  const rpe = Number(document.getElementById("run-rpe").value);
  const splits = document.getElementById("run-splits").value.split(/[ ,]+/).filter(Boolean).map(Number);
  if (splits.some((n) => !Number.isFinite(n) || n < 5 || n > 900)) { error.textContent = "Rep times should be numbers of seconds, separated by commas."; return; }
  const program = sportsProgram();
  const run = {
    id: makeId(), day, type: document.getElementById("run-type").value, source: document.getElementById("run-source").value === "track" ? "track" : "manual", quality: "", accuracy: null, meters, seconds,
    rpe: rpe >= 1 && rpe <= 10 ? rpe : null, splits: splits.slice(0, 12), note: document.getElementById("run-note").value.trim().slice(0, 200),
    programId: program ? program.id : ""
  };
  state.sports.runs.push(run);
  let message = "Run saved: " + sportsDistanceText(meters) + " in " + sportsClock(seconds) + ".";
  if (sportsIsRunRecord(run, state.sports.runs)) message = "New personal record! " + message;
  if (run.splits.length >= 2) message += " " + sportsRepCheck(run.splits, run.rpe).text;
  if (run.type === "trial" && meters >= 780 && meters <= 820) {
    state.sports.profile.current800Seconds = seconds;
    if (program) program.profile.current800Seconds = seconds;
    message += " Your 800 m time is updated.";
  }
  saveState();
  runDialog.close();
  renderSports();
  showToast(message);
});

function openCheckinDialog(workout) {
  checkinWorkout = workout;
  const scale = (max) => Array.from({ length: max }, (_, index) => [index + 1, String(index + 1)]);
  const existing = sportsSlotDone(sportsProgram().week, sportsProgram().cycle, workout.slot);
  fillOptions(document.getElementById("checkin-rpe"), scale(10), existing && existing.rpe ? existing.rpe : 5);
  fillOptions(document.getElementById("checkin-fatigue"), scale(5), existing && existing.fatigue ? existing.fatigue : 2);
  fillOptions(document.getElementById("checkin-recovery"), scale(5), existing && existing.recovery ? existing.recovery : Math.min(5, Math.max(1, sportsReady.energy)));
  document.getElementById("checkin-pain").checked = Boolean(existing && existing.pain);
  document.getElementById("checkin-note").value = existing ? existing.note : "";
  document.getElementById("checkin-sub").textContent = workout.title;
  checkinDialog.showModal();
}

document.getElementById("checkin-cancel").addEventListener("click", () => checkinDialog.close());
document.getElementById("checkin-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const program = sportsProgram();
  if (!program || !checkinWorkout) return;
  const today = localDateKey(new Date());
  const entry = {
    id: makeId(), programId: program.id, week: program.week, cycle: program.cycle, slot: checkinWorkout.slot, day: today,
    rpe: Number(document.getElementById("checkin-rpe").value), fatigue: Number(document.getElementById("checkin-fatigue").value),
    recovery: Number(document.getElementById("checkin-recovery").value), pain: document.getElementById("checkin-pain").checked,
    note: document.getElementById("checkin-note").value.trim().slice(0, 200)
  };
  state.sports.checkins = state.sports.checkins.filter((other) => !(other.programId === entry.programId && other.week === entry.week && other.cycle === entry.cycle && other.slot === entry.slot));
  state.sports.checkins.push(entry);
  if (!state.manualDays.includes(today) && workoutsForDay(today).length === 0) state.manualDays.push(today);
  saveState();
  checkinDialog.close();
  renderSports();
  showToast(entry.pain ? "Saved. Please rest and tell a coach, parent or doctor about the pain." : "Workout checked in.");
});

// ---------- Recommendation (performance, consistency, fatigue, recovery) ----------

function sportsCurrentDecision(program, workouts) {
  const phase = sportsPhaseForWeek(program.week);
  const checkins = sportsProgramCheckins();
  const slots = new Set(checkins.filter((entry) => entry.week >= phase.weeks[0] && entry.week <= phase.weeks[1]).map((entry) => entry.week + ":" + entry.slot));
  return sportsWeekDecision({
    week: program.week, cycle: program.cycle, planned: workouts.length, checkins, runs: state.sports.runs,
    phaseSlots: (phase.weeks[1] - phase.weeks[0] + 1) * workouts.length, phaseSlotsDone: slots.size,
    atGate: program.week === phase.weeks[1] && program.week < SPORTS_PROGRAM_WEEKS
  });
}

function renderSportsDecision(decision) {
  const box = sp("div", "sp-banner sp-decision is-" + decision.outcome + (decision.outcome === "ease" ? " is-warn" : ""));
  box.append(sp("strong", "", "Recommendation: " + decision.label));
  decision.reasons.forEach((reason) => box.append(sp("p", "", reason)));
  const list = sp("ul", "sp-factors");
  decision.factors.forEach((factor) => {
    const item = sp("li", "is-" + factor.status);
    item.append(sp("b", "", factor.name), sp("span", "", factor.text));
    list.append(item);
  });
  box.append(list);
  box.append(sp("p", "sp-fine", "Progress needs all workouts done, healthy fatigue and recovery, comfortable effort and run paces that improved at similar effort. Good check-ins alone give Continue. He can move on or repeat whenever you decide; repeating is always safe."));
  return box;
}

async function sportsMoveOn(decision, advance) {
  const program = sportsProgram();
  const followed = advance === decision.advance;
  if (!followed) {
    const message = advance ? "The app recommends repeating this week. " + (decision.reasons[0] || "") : "The app recommends moving on. You can still repeat; it is always safe.";
    const ok = await confirmAction(advance ? "Move on anyway?" : "Repeat instead?", message, advance ? "Move on" : "Repeat");
    if (!ok) return;
  }
  program.log.push({ week: program.week, outcome: decision.outcome, day: localDateKey(new Date()), followed });
  program.log = program.log.slice(-60);
  if (advance) {
    if (program.week >= SPORTS_PROGRAM_WEEKS) {
      program.finished = true;
    } else {
      program.week += 1;
      program.cycle = 0;
      program.weekAdjust[String(program.week)] = decision.outcome === "progress" ? 1 : decision.outcome === "ease" ? -1 : 0;
    }
  } else {
    program.cycle += 1;
    if (decision.outcome === "ease") program.weekAdjust[String(program.week)] = -1;
  }
  saveState();
  renderSports();
  window.scrollTo({ top: 0, behavior: "instant" });
  showToast(program.finished ? "Program complete." : advance ? "Week " + program.week + " is ready." : "Repeating week " + program.week + ".");
}

function renderSportsInsights(program) {
  const card = sp("div", "sp-card");
  card.append(sp("h2", "", "What his data says"));
  const strengthLogged = state.history.filter((entry) => typeof entry.sportsKey === "string" && entry.sportsKey.startsWith(program.id + ":")).length;
  const insights = sportsInsights({
    runs: state.sports.runs, checkins: sportsProgramCheckins(), planned: sportsWeekWorkouts(program).length, strengthLogged
  });
  const tells = sp("ul", "sp-list");
  insights.tells.forEach((line) => tells.append(sp("li", "", line)));
  card.append(tells, sp("h3", "", "Improve next"));
  const next = sp("ul", "sp-list");
  insights.next.forEach((line) => next.append(sp("li", "", line)));
  card.append(next, sp("p", "sp-fine", "These notes come only from the times, distances, ratings and sets entered. The app cannot see his form, heart rate or how he felt beyond what is recorded."));
  sportsRoot.append(card);
}

function sportsList(items, className) {
  const list = sp("ul", className || "sp-bullets");
  items.forEach((item) => list.append(sp("li", "", item)));
  return list;
}

function sportsSourceLinks(ids) {
  const wrap = sp("p", "sp-fine");
  wrap.append("Sources: ");
  ids.forEach((id, index) => {
    const source = sportsSources.find((entry) => entry.id === id);
    if (!source) return;
    const link = sp("a", "", source.org);
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = source.title;
    wrap.append(link, index < ids.length - 1 ? ", " : "");
  });
  return wrap;
}

function renderSportsKnowledge() {
  const card = sp("div", "sp-card");
  card.append(sp("h2", "", "Parent coaching guide"));
  card.append(sp("p", "special-note", "How the 800 m works and how to coach it. Tap a topic."));
  sportsKnowledge.forEach((topic) => {
    const details = sp("details", "sp-topic");
    details.append(sp("summary", "", topic.title), sportsList(topic.points), sportsSourceLinks(topic.src));
    card.append(details);
  });
  const stop = sp("details", "sp-topic");
  stop.append(sp("summary", "", "Safety: when to stop a workout"), sportsList(sportsStopRules));
  card.append(stop);
  const struggle = sp("details", "sp-topic");
  struggle.append(sp("summary", "", "If he is struggling"));
  sportsStruggleGuide.forEach((entry) => { struggle.append(sp("strong", "sp-q", entry.q), sp("p", "", entry.a)); });
  card.append(struggle);
  const how = sp("details", "sp-topic");
  how.append(sp("summary", "", "How this plan was built, and its sources"));
  how.append(sp("p", "", "The plan puts easy aerobic running first, adds short relaxed speed work, then controlled repeats, with light supervised strength work, full rest between hard days and small weekly steps. That structure follows the sources below plus common coaching practice for beginning middle-distance runners. The weekly session details are a coaching synthesis, not a prescription from any one source, and the app is not medical advice."));
  how.append(sp("p", "", "Limits: I could read search summaries but not every full document, and I could not find a USATF or World Athletics document that sets out a youth 800 m program. Sources marked as secondary are coaching articles."));
  const list = sp("ul", "sp-bullets");
  sportsSources.forEach((source) => {
    const item = sp("li");
    const link = sp("a", "", source.org + ": " + source.title);
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    item.append(link, sp("span", "sp-fine", " " + source.used));
    list.append(item);
  });
  how.append(list);
  card.append(how);
  return card;
}

// ---------- Coaching mode for one workout ----------

const SPORTS_SUPPORT_COACH = {
  developing: "Strength, mobility and light movement that support school practice.",
  why: "During the season practice supplies the hard running. These sessions keep legs strong and mobile and help him recover between practices and meets.",
  focus: ["Keep everything easy and controlled.", "Skip it if he is sore or has a meet within 24 hours.", "Clean technique over heavy weight."],
  evaluate: ["Did he feel better or more tired afterward?", "Was he fresh enough for practice the next day?", "Any new soreness?"],
  stop: ["Sharp pain, limp, dizziness or illness."],
  byPhase: { foundation: "", development: "", event: "" }
};

function sportsRpeGuide() {
  const rows = [
    ["RPE 3-4", "Easy", "Talk in full sentences. Could do it for a long time."],
    ["RPE 5-6", "Steady", "Short phrases. Breathing is deeper but controlled."],
    ["RPE 7", "Strong", "A few words at a time. He feels it, but form stays smooth."],
    ["RPE 8+", "Very hard", "Rarely used in beginner training. If he is here, stop the set."]
  ];
  const table = sp("ul", "sp-scale");
  rows.forEach(([rpe, name, text]) => {
    const item = sp("li");
    item.append(sp("b", "", rpe + " · " + name), sp("span", "", text));
    table.append(item);
  });
  return table;
}

function renderCoachStep(block, index) {
  const details = sp("details", "sp-step");
  const summary = sp("summary");
  summary.append(sp("span", "sp-day", String(index + 1)), sp("strong", "", block.exercise || block.name), sp("span", "sp-tag", sportsCategories[block.category]));
  details.append(summary);
  details.append(sp("p", "sp-block-line", sportsBlockLine(block) + (block.effort ? " · " + block.effort : "")));
  details.append(sp("p", "sp-why", "Why: " + block.why));
  if (block.kind === "exercise") {
    const info = sportsExerciseInfo[block.exercise];
    const coach = sportsExerciseCoach[block.exercise] || { cues: [], mistakes: [] };
    details.append(sp("h4", "", "How to do it"));
    details.append(info && info.steps ? sportsList(info.steps) : sp("p", "sp-fine", "Open the guide for photos and steps."));
    details.append(guideButton(block.exercise));
    if (coach.cues.length) details.append(sp("h4", "", "Watch for"), sportsList(coach.cues));
    if (coach.mistakes.length) details.append(sp("h4", "", "Avoid"), sportsList(coach.mistakes));
    if (block.category === "legStrength" || block.category === "coreStrength") {
      details.append(sp("p", "sp-fine", "Light load, with 3-4 good reps still in reserve. Stop the set if form slips. An adult should watch the first sets and no max lifts."));
    }
  } else {
    const rc = sportsRunCoach[block.coachKey] || sportsRunCoach[block.runType] || sportsRunCoach.easy;
    details.append(sp("h4", "", "How to do it"), sportsList(rc.howTo));
    details.append(sp("h4", "", "What to watch"), sportsList(rc.watch));
    details.append(sp("h4", "", "Right intensity"), sp("p", "", rc.intensity));
    details.append(sp("h4", "", "Too fast if"), sportsList(rc.tooFast));
    details.append(sp("h4", "", "Too slow if"), sportsList(rc.tooSlow));
    details.append(sp("h4", "", "Mistakes to avoid"), sportsList(rc.mistakes));
    details.append(sp("h4", "", "If he is struggling"), sp("p", "", rc.ifStruggling));
    const last = [...state.sports.runs].reverse().find((run) => run.type === block.runType || (block.runType === "repeats" && run.type === "repeats"));
    if (last) details.append(sp("p", "sp-fine", "Last similar run: " + sportsDistanceText(last.meters) + " in " + sportsClock(last.seconds) + " (" + sportsPaceText(last) + (last.rpe ? ", effort " + last.rpe + "/10" : "") + ")."));
    details.append(guideButton(sportsRunGuideName(block)), sportsButton("Track this run", "finish-button", () => openSportsRunTracker(block)), sportsButton("Enter by hand", "ghost-button small", () => openRunDialog(block)));
  }
  return details;
}

function renderRepChecker() {
  const card = sp("div", "sp-coach-tool");
  card.append(sp("h3", "", "Is he running too fast or too slow?"));
  card.append(sp("p", "special-note", "For repeats, strides or hills: enter each rep time in seconds. The app compares the last rep to the first."));
  const input = sp("input", "set-input");
  input.placeholder = "e.g. 48, 49, 50, 53";
  input.setAttribute("aria-label", "Rep times in seconds, separated by commas");
  const rpe = sp("select", "unit-select");
  rpe.setAttribute("aria-label", "How hard did it feel, 1 to 10");
  fillOptions(rpe, [["", "Effort (optional)"], ...Array.from({ length: 10 }, (_, i) => [i + 1, String(i + 1)])], "");
  const result = sp("p", "sp-fine");
  result.setAttribute("role", "status");
  const row = sp("div", "sp-row");
  row.append(input, rpe);
  const button = sportsButton("Check my reps", "ghost-button small", () => {
    const times = input.value.split(/[ ,]+/).filter(Boolean).map(Number);
    if (times.some((t) => !Number.isFinite(t))) { result.textContent = "Use numbers only, separated by commas."; return; }
    result.textContent = sportsRepCheck(times, Number(rpe.value) || null).text;
  });
  card.append(row, button, result);
  return card;
}

function renderSportsCoach(workout, program) {
  const phase = sportsPhaseForWeek(program.week);
  const season = program.profile.phase === "season" && program.profile.practiceDays.length > 0;
  const guide = season ? SPORTS_SUPPORT_COACH : sportsSessionCoach[workout.slot] || sportsSessionCoach[1];
  const active = sportsEasyMode ? sportsEasyWorkout(workout) : workout;
  const dayLabel = sportsDayLabel(program.profile, workout.slot);

  const head = sp("div", "sp-card");
  head.append(sportsButton("← Back to program", "ghost-button small", () => { sportsCoachSlot = null; renderSports(); }));
  head.append(sp("p", "sp-kicker", ((dayLabel ? dayLabel + " · " : "") + "WEEK " + program.week + " · " + phase.name).toUpperCase()));
  head.append(sp("h2", "", active.title));
  head.append(sp("h3", "", "What we are developing"), sp("p", "", guide.developing));
  head.append(sp("h3", "", "Why it matters for the 800 m"), sp("p", "", guide.why));
  if (!season && guide.byPhase[phase.id]) head.append(sp("p", "", guide.byPhase[phase.id]));
  head.append(sp("h3", "", "What to focus on today"), sportsList(guide.focus));
  sportsRoot.append(head);

  const ready = sp("div", "sp-card");
  ready.append(sp("h2", "", "Readiness check"));
  ready.append(sp("p", "special-note", "Ask him before warming up. This decides if today goes as planned."));
  ready.append(sportsSelect("rd-energy", "Energy", [["5", "5 · Great"], ["4", "4 · Good"], ["3", "3 · OK"], ["2", "2 · Low"], ["1", "1 · Very low"]], sportsReady.energy, (v) => { sportsReady.energy = Number(v); renderSports(); }));
  ready.append(sportsSelect("rd-sleep", "Sleep last night", [["good", "Good"], ["ok", "OK"], ["poor", "Poor"]], sportsReady.sleep, (v) => { sportsReady.sleep = v; renderSports(); }));
  ready.append(sportsSelect("rd-sore", "Soreness", [["none", "None"], ["mild", "Mild muscle soreness"], ["sharp", "Sharp or one-spot pain"]], sportsReady.soreness, (v) => { sportsReady.soreness = v; renderSports(); }));
  const ill = sp("label", "check-row");
  const illBox = sp("input");
  illBox.type = "checkbox";
  illBox.checked = sportsReady.illness;
  illBox.addEventListener("change", () => { sportsReady.illness = illBox.checked; renderSports(); });
  ill.append(illBox, sp("span", "", "Sick, fever, or hurt"));
  ready.append(ill);
  const verdict = sportsReadiness(sportsReady);
  const verdictBox = sp("div", "sp-banner" + (verdict.level === "rest" ? " is-warn" : ""));
  verdictBox.append(sp("strong", "", verdict.level === "rest" ? "Rest today" : verdict.level === "easy" ? "Go easier today" : verdict.level === "careful" ? "Go, but watch" : "Good to go"), sp("p", "", verdict.text));
  ready.append(verdictBox);
  if (verdict.level === "easy" || sportsEasyMode) {
    ready.append(sportsButton(sportsEasyMode ? "Switch back to the full workout" : "Use the easier version", "ghost-button", () => { sportsEasyMode = !sportsEasyMode; renderSports(); }));
  }
  sportsRoot.append(ready);

  if (verdict.level !== "rest") {
    const steps = sp("div", "sp-card");
    steps.append(sp("h2", "", "Step by step"));
    steps.append(sp("p", "special-note", "Tap a step for how to do it, what to watch and the mistakes to avoid. The app cannot see his form, so these are things for you to look for."));
    const list = sp("div", "sp-steps-list");
    active.blocks.forEach((block, index) => list.append(renderCoachStep(block, index)));
    steps.append(list);
    const hasExercises = active.blocks.some((block) => block.kind === "exercise");
    if (hasExercises) steps.append(sportsButton("Load exercises in Log", "ghost-button", () => loadSportsWorkout(active)));
    sportsRoot.append(steps);

    const intensity = sp("div", "sp-card");
    intensity.append(sp("h2", "", "Recognising the right intensity"));
    intensity.append(sportsRpeGuide());
    if (active.blocks.some((block) => block.kind === "run" && ["repeats", "strides", "hills", "accel", "check", "fartlek"].includes(block.runType))) intensity.append(renderRepChecker());
    sportsRoot.append(intensity);
  }

  const form = sp("div", "sp-card");
  form.append(sp("h2", "", "What good running form looks like"));
  form.append(sportsList(["Tall chest and a slight lean from the ankles, not the waist.", "Relaxed face, shoulders and hands (loose, not fists).", "Arms bent about 90 degrees, swinging front-to-back.", "Feet land under the body with quick, light steps, not far out in front.", "Eyes ahead, head still."]));
  form.append(guideButton("Running form"));
  form.append(sp("p", "sp-fine", "Film a short clip from the side if you want to compare weeks. The app does not analyse video or form."));
  sportsRoot.append(form);

  const after = sp("div", "sp-card");
  after.append(sp("h2", "", "After the session"));
  after.append(sportsList(guide.evaluate));
  after.append(sp("h3", "", "Stop and rest if"), sportsList(guide.stop));
  const done = sportsSlotDone(program.week, program.cycle, workout.slot);
  after.append(sportsButton(done ? "Update check-in" : "Complete workout and check in", "finish-button", () => openCheckinDialog(workout)));
  sportsRoot.append(after);
  renderSportsInsights(program);
  sportsRoot.append(sportsStruggleCard());
}

function sportsStruggleCard() {
  const card = sp("div", "sp-card");
  card.append(sp("h2", "", "If he is struggling"));
  sportsStruggleGuide.forEach((entry) => {
    const details = sp("details", "sp-topic");
    details.append(sp("summary", "", entry.q), sp("p", "", entry.a));
    card.append(details);
  });
  card.append(sportsList(sportsStopRules));
  return card;
}

// ---------- Entry point ----------

function renderSports() {
  sportsRoot.replaceChildren();
  document.getElementById("sports-view").classList.toggle("is-tracking", Boolean(sportsRunSession && sportsRunSession.stage === "track"));
  if (sportsRunSession) {
    renderSportsRun();
    return;
  }
  if (sportsProgram() && !sportsEditing) {
    renderSportsProgram();
    return;
  }
  if (!sportsDraft) sportsDraft = JSON.parse(JSON.stringify(state.sports.profile));
  if (sportsStep === 1) renderSportsSport();
  else if (sportsStep === 2) renderSportsEvent();
  else renderSportsProfile();
}

if (state.appView === "sports") renderSports();
