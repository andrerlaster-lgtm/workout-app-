// Run tracker screens for Sports Performance Training: Outdoor GPS, Treadmill and Timed run.
// Logic (distance maths, timers, feedback) lives in sports-gps.js. Only totals are saved: no GPS route or
// coordinates are ever stored. Location permission is requested only when the user taps "Find GPS signal".

const PENDING_SAVE_MS = 5000;
let sportsRunSession = null; // null when the tracker is closed
let sportsRunTimerId = null;
let sportsRunPendingTimerId = null;
let sportsWatchId = null;
let sportsAudio = null;
let sportsWakeLockHandle = null;
let sportsRunRefs = {};

function sportsRunUnit() {
  return state.weightUnit === "kg" ? "km" : "mi";
}

function sportsPaceFromSeconds(seconds, meters) {
  if (!(meters >= 20) || !(seconds > 0)) return "-";
  const perUnit = sportsRunUnit() === "km" ? (seconds / meters) * 1000 : (seconds / meters) * SPORTS_MILES;
  return sportsClock(perUnit) + "/" + sportsRunUnit();
}

function sportsPaceFromSecPerKm(secPerKm) {
  if (!secPerKm) return "-";
  return sportsClock(sportsRunUnit() === "km" ? secPerKm : secPerKm * 1.609344) + "/" + sportsRunUnit();
}

// ---------- Alerts: visual always, sound and vibration where supported ----------

function sportsPrepareAudio() {
  try {
    if (!sportsAudio) sportsAudio = new (window.AudioContext || window.webkitAudioContext)();
    if (sportsAudio.state === "suspended") sportsAudio.resume();
  } catch {
    sportsAudio = null;
  }
}

function sportsAlert(kind) {
  const s = sportsRunSession;
  if (!s || s.alerts === false) return;
  if (navigator.vibrate) navigator.vibrate(kind === "target" ? [300, 120, 300, 120, 500] : [180]);
  if (!sportsAudio) return;
  try {
    const beeps = kind === "target" ? [0, 0.25, 0.5] : [0];
    beeps.forEach((offset) => {
      const tone = sportsAudio.createOscillator();
      const gain = sportsAudio.createGain();
      const start = sportsAudio.currentTime + offset;
      tone.frequency.value = kind === "target" ? 1040 : 760;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
      tone.connect(gain).connect(sportsAudio.destination);
      tone.start(start);
      tone.stop(start + 0.22);
    });
  } catch {
    // The on-screen message still shows the alert.
  }
}

async function sportsWakeLock(on) {
  try {
    if (on && navigator.wakeLock && !sportsWakeLockHandle) {
      sportsWakeLockHandle = await navigator.wakeLock.request("screen");
      sportsWakeLockHandle.addEventListener("release", () => { sportsWakeLockHandle = null; });
    } else if (!on && sportsWakeLockHandle) {
      await sportsWakeLockHandle.release();
      sportsWakeLockHandle = null;
    }
  } catch {
    sportsWakeLockHandle = null;
  }
}

// ---------- Opening and closing ----------

function sportsRunDefaults(block) {
  const outdoors = state.sports.program ? state.sports.program.profile.locations.includes("outdoors") : true;
  const meters = block && block.meters ? block.meters : 0;
  const mode = meters || !block ? (outdoors ? "gps" : "treadmill") : "timed";
  const planned = block ? { runType: block.runType, meters, minutes: block.minutes || 0, effort: block.effort || "" } : null;
  return {
    stage: "pick", mode, type: block && block.runType && sportsRunTypes[block.runType] ? block.runType : "easy",
    target: meters, targetMinutes: block && block.minutes ? block.minutes : 0, customOpen: false,
    planned, repsTotal: block && block.reps && meters ? block.reps : 0, repsDone: 0, alerts: true,
    unit: sportsRunUnit(), phase: "idle", message: "", flash: "", splits: [], formError: ""
  };
}

function openSportsRunTracker(block) {
  sportsRunSession = sportsRunDefaults(block || null);
  renderSports();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function sportsStopHardware() {
  if (sportsWatchId !== null && navigator.geolocation) navigator.geolocation.clearWatch(sportsWatchId);
  sportsWatchId = null;
  clearInterval(sportsRunTimerId); sportsRunTimerId = null;
  clearInterval(sportsRunPendingTimerId); sportsRunPendingTimerId = null;
  sportsWakeLock(false);
}

function sportsCloseRunTracker() {
  sportsStopHardware();
  sportsRunSession = null;
  sportsRunRefs = {};
  renderSports();
}

async function sportsLeaveTracker() {
  const s = sportsRunSession;
  if (s && s.stage === "track" && (s.phase === "running" || s.phase === "paused" || s.clockRunning)) {
    const ok = await confirmAction("Leave the tracker?", "The run in progress stops. What you have so far is kept as an unfinished run that you can save from the Sports tab.", "Leave");
    if (!ok) return;
    sportsSavePending(true);
  }
  sportsCloseRunTracker();
}

// ---------- Saving ----------

function sportsPendingFromSession() {
  const s = sportsRunSession;
  if (!s || !s.clock) return null;
  const seconds = Math.round(sportsClockElapsed(s.clock, Date.now()) / 1000);
  const meters = s.mode === "gps" && s.tracker ? Math.round(s.tracker.distance) : s.mode === "treadmill" ? 0 : 0;
  if (seconds < 5) return null;
  return {
    source: s.mode, type: s.type, day: localDateKey(new Date()), meters, seconds, target: s.target || 0,
    quality: s.tracker ? s.tracker.quality() : "", accuracy: s.tracker && s.tracker.avgAccuracy() ? Math.round(s.tracker.avgAccuracy()) : null
  };
}

function sportsSavePending(force) {
  const pending = sportsPendingFromSession();
  if (pending && (force || pending.seconds > 0)) {
    state.sports.pending = pending;
    saveState();
  }
}

function sportsCommitRun(draft) {
  const program = sportsProgram();
  const run = {
    id: makeId(), day: draft.day || localDateKey(new Date()), type: draft.type, source: draft.source,
    quality: draft.quality || "", accuracy: draft.accuracy || null, meters: Math.max(0, Math.round(draft.meters)),
    seconds: Math.round(draft.seconds), rpe: draft.rpe >= 1 && draft.rpe <= 10 ? draft.rpe : null, splits: [],
    note: (draft.note || "").slice(0, 200), programId: program ? program.id : ""
  };
  const previous = [...state.sports.runs].reverse().find((other) => other.type === run.type
    && sportsSourceGroup(other.source) === sportsSourceGroup(run.source) && run.meters > 0 && other.meters > 0
    && Math.abs(other.meters - run.meters) / run.meters <= 0.2) || null;
  state.sports.runs.push(run);
  state.sports.pending = null;
  const record = sportsIsRunRecord(run, state.sports.runs) && run.source !== "timed";
  if (run.type === "trial" && run.meters >= 780 && run.meters <= 820 && (run.source === "track" || run.source === "manual")) {
    state.sports.profile.current800Seconds = run.seconds;
    if (program) program.profile.current800Seconds = run.seconds;
  }
  saveState();
  return { run, previous, record };
}

// ---------- Views ----------

function sportsRunHeader(title, backLabel) {
  const head = sp("div", "sp-card");
  head.append(sportsButton(backLabel || "← Back to program", "ghost-button small", sportsLeaveTracker));
  head.append(sp("h2", "", title));
  return head;
}

function sportsTargetChips(s) {
  const wrap = sp("div", "sp-chips");
  sportsDistanceChoices.forEach((meters) => {
    const on = s.target === meters && !s.customOpen;
    const chip = sp("button", "sp-chip" + (on ? " is-on" : ""), meters + " m");
    chip.type = "button";
    chip.setAttribute("aria-pressed", String(on));
    chip.addEventListener("click", () => { s.target = meters; s.customOpen = false; renderSports(); });
    wrap.append(chip);
  });
  const custom = sp("button", "sp-chip" + (s.customOpen ? " is-on" : ""), "Custom");
  custom.type = "button";
  custom.setAttribute("aria-pressed", String(s.customOpen));
  custom.addEventListener("click", () => { s.customOpen = true; renderSports(); });
  wrap.append(custom);
  return wrap;
}

function renderSportsRunPick(s) {
  sportsRoot.append(sportsRunHeader("Track a run"));
  const card = sp("div", "sp-card");
  card.append(sp("h3", "", "How are you running?"));
  const modes = sp("div", "sp-grid sp-modes");
  [["gps", "Outdoor GPS", "Phone GPS estimates distance"], ["treadmill", "Treadmill", "No GPS. Enter the belt distance"], ["timed", "Timed run", "Just time it. Distance optional"]].forEach(([id, name, text]) => {
    const button = sp("button", "sp-choice" + (s.mode === id ? " is-selected" : ""));
    button.type = "button";
    button.append(sp("strong", "", name), sp("span", "", text));
    button.addEventListener("click", () => { s.mode = id; renderSports(); });
    modes.append(button);
  });
  card.append(modes);

  if (s.mode !== "timed") {
    card.append(sp("h3", "", "Target distance"), sportsTargetChips(s));
    if (s.customOpen) {
      const row = sp("div", "sp-row");
      const input = sp("input", "set-input");
      input.type = "number"; input.inputMode = "decimal"; input.min = "0.01"; input.step = "any";
      input.placeholder = "Distance"; input.setAttribute("aria-label", "Custom distance");
      if (s.target && !sportsDistanceChoices.includes(s.target)) input.value = String(cleanNumber(sportsUnitFromMeters(s.target, s.unit)));
      const unit = sp("select", "unit-select");
      unit.setAttribute("aria-label", "Distance unit");
      fillOptions(unit, [["m", "m"], ["km", "km"], ["mi", "mi"]], s.unit);
      const apply = () => { s.unit = unit.value; const m = sportsMetersFrom(input.value, unit.value); s.target = m >= 50 && m <= 50000 ? m : 0; };
      input.addEventListener("input", apply);
      unit.addEventListener("change", apply);
      row.append(input, unit);
      card.append(row);
    }
    if (s.target) card.append(sp("p", "sp-fine", "Notifications at " + (sportsMilestones(s.target).concat(s.target)).map((m) => m + " m").join(", ") + "."));
  } else {
    card.append(sp("h3", "", "Target time (optional)"));
    const chips = sp("div", "sp-chips");
    [10, 15, 20, 25, 30].forEach((minutes) => {
      const on = s.targetMinutes === minutes;
      const chip = sp("button", "sp-chip" + (on ? " is-on" : ""), minutes + " min");
      chip.type = "button";
      chip.setAttribute("aria-pressed", String(on));
      chip.addEventListener("click", () => { s.targetMinutes = on ? 0 : minutes; renderSports(); });
      chips.append(chip);
    });
    card.append(chips);
  }

  const type = sp("div", "sp-field");
  const lab = sp("label", "", "Run type");
  lab.setAttribute("for", "rt-type");
  const select = sp("select", "unit-select");
  select.id = "rt-type";
  fillOptions(select, Object.entries(sportsRunTypes), s.type);
  select.addEventListener("change", () => { s.type = select.value; });
  type.append(lab, select);
  card.append(type);

  if (s.mode === "gps") {
    const warn = sp("div", "sp-banner is-warn");
    warn.append(sp("strong", "", "About GPS accuracy"));
    warn.append(sp("p", "", "Phone GPS is an estimate. It is often off by several meters and worse near buildings or trees, so on 100-400 m runs the distance and pace can be noticeably off. For exact repeats use a measured track or a known marked distance."));
    warn.append(sp("p", "", "Keep this page open with the screen on. If the phone locks or you switch apps, the browser may stop GPS and part of the run can be missed."));
    card.append(warn);
  } else if (s.mode === "treadmill") {
    card.append(sp("p", "sp-fine", "Treadmill mode does not use GPS or location."));
  }
  if (s.repsTotal) card.append(sp("p", "sp-fine", "Workout plan: " + s.repsTotal + " reps. Track one rep at a time; the next rep is one tap away after each save."));
  const go = sportsButton("Continue", "finish-button", () => {
    if (s.mode !== "timed" && !(s.target >= 50)) { s.formError = "Pick a target distance."; renderSports(); return; }
    s.formError = "";
    s.stage = "track";
    s.phase = "idle";
    s.clock = sportsClockNew();
    s.tracker = null;
    s.hiddenMs = 0;
    s.lastFix = null;
    renderSports();
  });
  if (s.formError) card.append(sp("p", "field-error", s.formError));
  const actions = sp("div", "sp-actions");
  actions.append(sportsButton("Enter a run by hand", "ghost-button", () => { openRunDialog(s.planned ? { runType: s.type, meters: s.target } : null); }), go);
  card.append(actions);
  sportsRoot.append(card);
}

// ----- shared pieces for the live screens -----

function sportsBigReadout(label, id, initial) {
  const box = sp("div", "rt-stat");
  const value = sp("strong", "", initial);
  value.id = id;
  box.append(value, sp("span", "", label));
  sportsRunRefs[id] = value;
  return box;
}

function sportsAlertToggle(s) {
  const row = sp("label", "check-row");
  const box = sp("input");
  box.type = "checkbox";
  box.checked = s.alerts;
  box.addEventListener("change", () => { s.alerts = box.checked; });
  row.append(box, sp("span", "", "Sound and vibration alerts"));
  return row;
}

function sportsEffortSelect(id, value) {
  const wrap = sp("div", "sp-field");
  const lab = sp("label", "", "How hard did it feel? (1 easy to 10 all-out)");
  lab.setAttribute("for", id);
  const select = sp("select", "unit-select");
  select.id = id;
  fillOptions(select, [["", "Skip"], ...Array.from({ length: 10 }, (_, i) => [i + 1, String(i + 1)])], value || "");
  wrap.append(lab, select);
  return wrap;
}

// ----- GPS -----

function sportsGeoError(s, error) {
  if (s.phase === "running" || s.phase === "paused") {
    // Never throw away a run in progress because of a temporary error.
    s.flash = error.code === 1 ? "Location permission was turned off. Distance is no longer updating." : "GPS signal is weak right now. Keep going; the app keeps timing.";
    if (sportsRunRefs.flash) sportsRunRefs.flash.textContent = s.flash;
    return;
  }
  if (error.code === 1) {
    s.phase = "denied";
    s.message = "Location permission is blocked. Allow location for this site in your browser settings and try again, or use Treadmill or Timed mode, or enter the run by hand.";
  } else if (error.code === 2) {
    if (s.phase !== "running" && s.phase !== "paused") s.phase = "unavailable";
    s.message = "Location services look unavailable. Turn on location on your phone. You can still use Timed mode or enter the run by hand.";
  } else {
    s.message = "Still searching for a GPS signal. Move to an open area away from buildings and trees.";
  }
  if (s.stage === "track") renderSports();
}

function sportsStartWatch(s) {
  if (!navigator.geolocation) {
    s.phase = "unavailable";
    s.message = "This browser has no location support. Use Treadmill or Timed mode, or enter the run by hand.";
    renderSports();
    return;
  }
  s.phase = "find";
  s.message = "Looking for a GPS signal...";
  renderSports();
  sportsWatchId = navigator.geolocation.watchPosition((position) => sportsOnFix(s, position), (error) => sportsGeoError(s, error), {
    enableHighAccuracy: true, maximumAge: 0, timeout: 20000
  });
}

function sportsOnFix(s, position) {
  const fix = { lat: position.coords.latitude, lon: position.coords.longitude, accuracy: position.coords.accuracy, t: position.timestamp || Date.now() };
  s.lastFix = fix;
  s.lastFixAt = Date.now();
  s.accuracyNow = fix.accuracy;
  if (s.phase === "find" || s.phase === "unavailable") {
    if (fix.accuracy <= GPS_READY_ACCURACY) { s.phase = "ready"; s.message = ""; renderSports(); }
    else if (sportsRunRefs.gpsStatus) sportsRunRefs.gpsStatus.textContent = "Signal is weak (±" + Math.round(fix.accuracy) + " m). Move to open sky.";
    return;
  }
  if (s.phase !== "running") return;
  const result = s.tracker.fix(fix, sportsClockElapsed(s.clock, Date.now()));
  result.events.forEach((event) => sportsOnTrackerEvent(s, event));
  sportsRunUpdate();
}

function sportsOnTrackerEvent(s, event) {
  if (event.type === "milestone") {
    const at = s.tracker.splitMs[event.meters];
    s.splits.push({ meters: event.meters, ms: at });
    s.flash = event.meters + " m · " + sportsClock(at / 1000);
    sportsAlert("milestone");
    sportsRunRefreshSplits();
  } else if (event.type === "target") {
    s.flash = "Target reached: " + event.meters + " m in " + sportsClock(event.ms / 1000);
    sportsAlert("target");
    sportsGpsFinish(s, true);
  }
}

function sportsGpsStartRun(s) {
  sportsPrepareAudio();
  sportsWakeLock(true);
  s.tracker = sportsGpsTracker(s.target);
  s.clock = sportsClockNew();
  sportsClockStart(s.clock, Date.now());
  s.phase = "running";
  s.splits = [];
  s.flash = "";
  s.hiddenMs = 0;
  if (s.lastFix) s.tracker.fix(s.lastFix, 0);
  clearInterval(sportsRunTimerId);
  sportsRunTimerId = setInterval(sportsRunUpdate, 250);
  clearInterval(sportsRunPendingTimerId);
  sportsRunPendingTimerId = setInterval(() => sportsSavePending(false), PENDING_SAVE_MS);
  renderSports();
}

function sportsGpsPauseToggle(s) {
  if (s.phase === "running") {
    sportsClockPause(s.clock, Date.now());
    s.phase = "paused";
    sportsSavePending(false);
  } else if (s.phase === "paused") {
    s.tracker.resetAnchor();
    sportsClockStart(s.clock, Date.now());
    s.phase = "running";
  }
  renderSports();
}

function sportsGpsFinish(s, reached) {
  const now = Date.now();
  sportsClockPause(s.clock, now);
  const elapsed = sportsClockElapsed(s.clock, now);
  const tr = s.tracker;
  s.result = {
    reached: Boolean(reached),
    meters: reached ? s.target : Math.round(tr.distance),
    seconds: Math.round((reached ? tr.reachedMs : elapsed) / 1000),
    measuredMeters: Math.round(tr.distance),
    totalSeconds: Math.round(elapsed / 1000),
    quality: tr.quality(), accuracy: tr.avgAccuracy() ? Math.round(tr.avgAccuracy()) : null
  };
  sportsStopHardware();
  sportsSavePending(true);
  s.stage = "result";
  s.phase = "done";
  renderSports();
}

function sportsRunRefreshSplits() {
  const list = sportsRunRefs.splits;
  const s = sportsRunSession;
  if (!list || !s) return;
  list.replaceChildren();
  s.splits.forEach((split) => list.append(sp("li", "", split.meters + " m · " + sportsClock(split.ms / 1000))));
}

function sportsRunUpdate() {
  const s = sportsRunSession;
  if (!s || s.stage !== "track") return;
  const now = Date.now();
  const elapsed = sportsClockElapsed(s.clock, now);
  const r = sportsRunRefs;
  if (s.mode === "gps" && s.tracker && r.distance) {
    const dist = Math.round(s.tracker.distance);
    r.distance.textContent = dist + " m";
    r.time.textContent = sportsClock(elapsed / 1000);
    r.pace.textContent = sportsPaceFromSeconds(elapsed / 1000, s.tracker.distance);
    if (r.recent) r.recent.textContent = sportsPaceFromSecPerKm(s.tracker.recentPaceSecPerKm());
    if (r.bar) r.bar.style.width = Math.min(100, (s.tracker.distance / s.target) * 100) + "%";
    if (r.percent) r.percent.textContent = Math.min(100, Math.round((s.tracker.distance / s.target) * 100)) + "% of " + s.target + " m";
    if (r.flash) r.flash.textContent = s.flash;
    if (r.gpsStatus) {
      const signal = s.phase === "running" ? s.tracker.signal(now) : "paused";
      const acc = s.accuracyNow ? " (±" + Math.round(s.accuracyNow) + " m)" : "";
      r.gpsStatus.textContent = signal === "lost" ? "GPS signal lost. Keep running; distance may be under-counted." : signal === "searching" ? "Waiting for GPS..." : signal === "paused" ? "Paused" : "GPS good" + acc;
      r.gpsStatus.className = "rt-status is-" + signal;
    }
  } else if (s.mode === "timed" && r.time) {
    r.time.textContent = sportsClock(elapsed / 1000);
    if (s.targetMinutes && !s.targetAlerted && elapsed >= s.targetMinutes * 60000) {
      s.targetAlerted = true;
      s.flash = "Target time reached: " + s.targetMinutes + " min";
      sportsAlert("target");
      if (r.flash) r.flash.textContent = s.flash;
    }
  } else if (s.mode === "treadmill" && r.time) {
    r.time.textContent = sportsClock(elapsed / 1000);
  }
}

function renderSportsGps(s) {
  sportsRunRefs = {};
  const head = sportsRunHeader("Outdoor GPS · " + s.target + " m");
  const card = sp("div", "sp-card rt-card");
  if (s.phase === "idle" || s.phase === "denied" || s.phase === "unavailable") {
    card.append(sp("p", "", s.message || "Location permission is only requested when you tap the button below."));
    card.append(sportsButton(s.phase === "denied" || s.phase === "unavailable" ? "Try GPS again" : "Find GPS signal", "finish-button", () => sportsStartWatch(s)));
    if (s.phase !== "idle") {
      const alt = sp("div", "sp-actions");
      alt.append(sportsButton("Use Treadmill mode", "ghost-button", () => { s.mode = "treadmill"; s.stage = "track"; s.phase = "idle"; renderSports(); }));
      alt.append(sportsButton("Use Timed mode", "ghost-button", () => { s.mode = "timed"; s.stage = "track"; s.phase = "idle"; s.clock = sportsClockNew(); renderSports(); }));
      alt.append(sportsButton("Enter by hand", "ghost-button", () => openRunDialog({ runType: s.type, meters: s.target })));
      card.append(alt);
    }
  } else if (s.phase === "find") {
    const status = sp("p", "rt-status is-searching", s.message);
    status.id = "rt-gps-status";
    sportsRunRefs.gpsStatus = status;
    card.append(status, sp("p", "sp-fine", "Wait for a good lock before starting. Stand in the open, away from buildings and trees."));
    card.append(sportsButton("Cancel", "ghost-button", () => { sportsStopHardware(); s.phase = "idle"; renderSports(); }));
  } else if (s.phase === "ready") {
    card.append(sp("p", "rt-status is-good", "GPS ready (±" + Math.round(s.accuracyNow || 0) + " m). Get set, then start."));
    card.append(sportsAlertToggle(s));
    card.append(sportsButton("Start run", "finish-button rt-big", () => sportsGpsStartRun(s)));
  } else {
    const stats = sp("div", "rt-stats");
    stats.append(sportsBigReadout("distance (estimate)", "rt-dist", Math.round(s.tracker.distance) + " m"), sportsBigReadout("time", "rt-time", "0:00"));
    stats.append(sportsBigReadout("avg pace", "rt-pace", "-"), sportsBigReadout("recent pace", "rt-recent", "-"));
    sportsRunRefs.distance = stats.querySelector("#rt-dist");
    sportsRunRefs.time = stats.querySelector("#rt-time");
    sportsRunRefs.pace = stats.querySelector("#rt-pace");
    sportsRunRefs.recent = stats.querySelector("#rt-recent");
    card.append(stats);
    const bar = sp("div", "sp-progress");
    const fill = sp("span");
    bar.append(fill);
    sportsRunRefs.bar = fill;
    const percent = sp("p", "rt-percent", "");
    sportsRunRefs.percent = percent;
    const flash = sp("p", "rt-flash", s.flash);
    flash.setAttribute("role", "status");
    flash.setAttribute("aria-live", "assertive");
    sportsRunRefs.flash = flash;
    const status = sp("p", "rt-status", "");
    sportsRunRefs.gpsStatus = status;
    card.append(bar, percent, flash, status);
    const splits = sp("ul", "sp-list rt-splits");
    sportsRunRefs.splits = splits;
    card.append(splits);
    sportsRunRefreshSplits();
    const controls = sp("div", "sp-actions rt-controls");
    controls.append(sportsButton(s.phase === "paused" ? "Resume" : "Pause", "ghost-button rt-big", () => sportsGpsPauseToggle(s)));
    controls.append(sportsButton("Stop", "finish-button rt-big", () => sportsGpsFinish(s, false)));
    card.append(controls);
    card.append(sp("p", "sp-fine", "GPS is an estimate. Keep the screen on; "
      + (sportsWakeLockHandle ? "the screen is being kept awake." : "this browser may not keep the screen awake, so leave the phone unlocked.")));
    clearInterval(sportsRunTimerId);
    if (s.phase === "running") sportsRunTimerId = setInterval(sportsRunUpdate, 250);
  }
  sportsRoot.append(head, card);
  sportsRunUpdate();
}

// ----- Treadmill -----

function renderSportsTreadmill(s) {
  sportsRunRefs = {};
  sportsRoot.append(sportsRunHeader("Treadmill" + (s.target ? " · " + s.target + " m" : "")));
  const card = sp("form", "sp-card rt-card");
  card.noValidate = true;
  card.append(sp("p", "sp-fine", "No GPS or location is used. Enter what the treadmill shows."));

  const unitSel = sp("select", "unit-select");
  unitSel.setAttribute("aria-label", "Distance unit");
  fillOptions(unitSel, [["km", "kilometers"], ["mi", "miles"]], s.unit === "mi" ? "mi" : "km");
  const dist = sp("input", "set-input");
  dist.type = "number"; dist.inputMode = "decimal"; dist.step = "any"; dist.min = "0"; dist.id = "tm-dist";
  dist.setAttribute("aria-label", "Distance on the treadmill");
  const equiv = sp("p", "sp-fine", "");
  const refresh = () => {
    const m = sportsMetersFrom(dist.value, unitSel.value);
    equiv.textContent = m > 0 ? "= " + m + " m" + (s.target ? " (target " + s.target + " m = " + cleanNumber(sportsUnitFromMeters(s.target, "mi")).toFixed(3) + " mi = " + cleanNumber(sportsUnitFromMeters(s.target, "km")).toFixed(3) + " km)" : "") : "";
  };
  const prefill = () => { if (s.target) dist.value = String(Number(sportsUnitFromMeters(s.target, unitSel.value).toFixed(3))); refresh(); };
  unitSel.addEventListener("change", () => { s.unit = unitSel.value; prefill(); });
  dist.addEventListener("input", refresh);
  const dwrap = sp("div", "sp-field");
  const dl = sp("label", "", "Distance");
  dl.setAttribute("for", "tm-dist");
  const drow = sp("div", "sp-row");
  drow.append(dist, unitSel);
  dwrap.append(dl, drow, equiv);
  card.append(dwrap);

  const time = sp("div", "sp-field");
  time.append(sp("label", "", "Time"));
  const trow = sp("div", "sp-row");
  const min = sp("input", "set-input");
  const sec = sp("input", "set-input");
  [min, sec].forEach((input, i) => { input.type = "number"; input.inputMode = "numeric"; input.min = "0"; input.placeholder = i ? "sec" : "min"; input.setAttribute("aria-label", i ? "Seconds" : "Minutes"); });
  trow.append(min, sec);
  const clockText = sp("strong", "rt-time-inline", "0:00");
  sportsRunRefs.time = clockText;
  const timerBtn = sportsButton("Start timer", "ghost-button small", () => {
    if (s.clock.running) {
      sportsClockPause(s.clock, Date.now());
      const total = Math.round(sportsClockElapsed(s.clock, Date.now()) / 1000);
      min.value = String(Math.floor(total / 60)); sec.value = String(total % 60);
      timerBtn.textContent = "Start timer";
      clearInterval(sportsRunTimerId);
    } else {
      s.clock = sportsClockNew();
      sportsClockStart(s.clock, Date.now());
      timerBtn.textContent = "Stop timer";
      clearInterval(sportsRunTimerId);
      sportsRunTimerId = setInterval(sportsRunUpdate, 250);
    }
  });
  const inline = sp("div", "sp-row rt-inline");
  inline.append(clockText, timerBtn);
  time.append(trow, inline);
  time.append(sp("p", "sp-fine", "Use the timer while you run, or type the time shown on the treadmill."));
  card.append(time);
  card.append(sportsEffortSelect("tm-rpe", ""));
  const noteWrap = sp("div", "sp-field");
  const noteLab = sp("label", "", "Note (incline, speed...)");
  noteLab.setAttribute("for", "tm-note");
  const note = sp("input", "set-input");
  note.id = "tm-note"; note.maxLength = 200; note.autocomplete = "off";
  noteWrap.append(noteLab, note);
  card.append(noteWrap);
  const error = sp("p", "field-error", "");
  error.setAttribute("role", "alert");
  card.append(error);
  card.append(sportsButton("Save run", "finish-button", () => {
    const meters = sportsMetersFrom(dist.value, unitSel.value);
    const seconds = Number(min.value || 0) * 60 + Number(sec.value || 0);
    if (!(meters >= 50 && meters <= 50000)) { error.textContent = "Enter the distance shown on the treadmill."; return; }
    if (!(seconds >= 10 && seconds <= 36000)) { error.textContent = "Enter the time (use the timer or type it)."; return; }
    if (seconds / meters < 0.1 || seconds / meters > 1.5) { error.textContent = "That time does not look right for this distance."; return; }
    sportsFinishSave({ source: "treadmill", type: s.type, meters, seconds, rpe: Number(document.getElementById("tm-rpe").value) || null, note: note.value.trim() });
  }));
  card.addEventListener("submit", (event) => event.preventDefault());
  sportsRoot.append(card);
  prefill();
}

// ----- Timed -----

function renderSportsTimed(s) {
  sportsRunRefs = {};
  sportsRoot.append(sportsRunHeader("Timed run" + (s.targetMinutes ? " · " + s.targetMinutes + " min" : "")));
  const card = sp("div", "sp-card rt-card");
  const stats = sp("div", "rt-stats");
  stats.append(sportsBigReadout("time", "rt-time", sportsClock(sportsClockElapsed(s.clock, Date.now()) / 1000)));
  sportsRunRefs.time = stats.querySelector("#rt-time");
  card.append(stats);
  const flash = sp("p", "rt-flash", s.flash);
  flash.setAttribute("role", "status");
  flash.setAttribute("aria-live", "assertive");
  sportsRunRefs.flash = flash;
  card.append(flash);
  const running = s.clock.running;
  const stopped = !running && s.clock.accMs > 0;
  if (!stopped) {
    card.append(sportsAlertToggle(s));
    card.append(sportsButton(running ? "Stop" : "Start", running ? "finish-button rt-big" : "finish-button rt-big", () => {
      if (running) {
        sportsClockPause(s.clock, Date.now());
        sportsStopHardware();
        sportsSavePending(true);
      } else {
        sportsPrepareAudio();
        sportsWakeLock(true);
        s.targetAlerted = false;
        sportsClockStart(s.clock, Date.now());
        clearInterval(sportsRunTimerId);
        sportsRunTimerId = setInterval(sportsRunUpdate, 250);
        clearInterval(sportsRunPendingTimerId);
        sportsRunPendingTimerId = setInterval(() => sportsSavePending(false), PENDING_SAVE_MS);
      }
      s.clockRunning = !running;
      renderSports();
    }));
    card.append(sp("p", "sp-fine", "Keep the screen on while timing. The timer uses the clock, so it stays correct even if the page is briefly paused."));
  } else {
    const total = Math.round(s.clock.accMs / 1000);
    const form = sp("div", "");
    const time = sp("div", "sp-field");
    time.append(sp("label", "", "Duration (edit if needed)"));
    const trow = sp("div", "sp-row");
    const min = sp("input", "set-input");
    const sec = sp("input", "set-input");
    [min, sec].forEach((input, i) => { input.type = "number"; input.inputMode = "numeric"; input.min = "0"; input.placeholder = i ? "sec" : "min"; input.setAttribute("aria-label", i ? "Seconds" : "Minutes"); });
    min.value = String(Math.floor(total / 60)); sec.value = String(total % 60);
    trow.append(min, sec);
    time.append(trow);
    form.append(time);
    const dwrap = sp("div", "sp-field");
    const dl = sp("label", "", "Distance (optional)");
    dl.setAttribute("for", "tt-dist");
    const drow = sp("div", "sp-row");
    const dist = sp("input", "set-input");
    dist.type = "number"; dist.inputMode = "decimal"; dist.step = "any"; dist.min = "0"; dist.id = "tt-dist";
    const unitSel = sp("select", "unit-select");
    unitSel.setAttribute("aria-label", "Distance unit");
    fillOptions(unitSel, [["m", "m"], ["km", "km"], ["mi", "mi"]], s.unit === "mi" ? "mi" : s.unit === "km" ? "km" : "m");
    drow.append(dist, unitSel);
    dwrap.append(dl, drow);
    form.append(dwrap, sportsEffortSelect("tt-rpe", ""));
    const noteWrap = sp("div", "sp-field");
    const noteLab = sp("label", "", "Note");
    noteLab.setAttribute("for", "tt-note");
    const note = sp("input", "set-input");
    note.id = "tt-note"; note.maxLength = 200; note.autocomplete = "off";
    noteWrap.append(noteLab, note);
    const error = sp("p", "field-error", "");
    error.setAttribute("role", "alert");
    form.append(noteWrap, error);
    form.append(sportsButton("Save run", "finish-button", () => {
      const seconds = Number(min.value || 0) * 60 + Number(sec.value || 0);
      if (!(seconds >= 10 && seconds <= 36000)) { error.textContent = "Enter a duration of at least 10 seconds."; return; }
      const meters = dist.value === "" ? 0 : sportsMetersFrom(dist.value, unitSel.value);
      if (dist.value !== "" && !(meters >= 50 && meters <= 50000)) { error.textContent = "Distance should be between 50 m and 50 km, or leave it blank."; return; }
      if (meters && (seconds / meters < 0.1 || seconds / meters > 1.5)) { error.textContent = "That time does not look right for this distance."; return; }
      sportsFinishSave({ source: "timed", type: s.type, meters, seconds, rpe: Number(document.getElementById("tt-rpe").value) || null, note: note.value.trim() });
    }));
    form.append(sportsButton("Start over", "ghost-button", () => { s.clock = sportsClockNew(); s.clockRunning = false; s.flash = ""; renderSports(); }));
    card.append(form);
  }
  sportsRoot.append(card);
  if (running) { clearInterval(sportsRunTimerId); sportsRunTimerId = setInterval(sportsRunUpdate, 250); }
}

// ----- GPS result -----

function renderSportsGpsResult(s) {
  sportsRoot.append(sportsRunHeader("Run finished"));
  const r = s.result;
  const card = sp("div", "sp-card rt-card");
  card.append(sp("p", "rt-flash", s.flash));
  const stats = sp("div", "rt-stats");
  stats.append(sportsBigReadout("distance (estimate)", "rs-dist", r.meters + " m"), sportsBigReadout("time", "rs-time", sportsClock(r.seconds)));
  stats.append(sportsBigReadout("avg pace", "rs-pace", sportsPaceFromSeconds(r.seconds, r.meters)));
  card.append(stats);
  const margin = sportsGpsMargin(r.meters, r.quality, r.accuracy);
  const warn = sp("div", "sp-banner" + (r.quality === "poor" ? " is-warn" : ""));
  warn.append(sp("strong", "", "GPS estimate"));
  warn.append(sp("p", "", sportsGpsQualityLabel(r.quality) + ". Roughly ±" + margin + " m. This is an estimate, not a measured distance."
    + (r.meters <= 400 ? " On short runs GPS error is a larger share of the distance." : "")));
  if (r.reached) warn.append(sp("p", "", "Time is when GPS estimated he reached " + s.target + " m. GPS measured " + r.measuredMeters + " m by the time you stopped."));
  card.append(warn);
  card.append(sportsEffortSelect("rs-rpe", ""));
  const noteWrap = sp("div", "sp-field");
  const noteLab = sp("label", "", "Note");
  noteLab.setAttribute("for", "rs-note");
  const note = sp("input", "set-input");
  note.id = "rs-note"; note.maxLength = 200; note.autocomplete = "off";
  noteWrap.append(noteLab, note);
  card.append(noteWrap);
  const error = sp("p", "field-error", "");
  card.append(error);
  const actions = sp("div", "sp-actions");
  actions.append(sportsButton("Discard", "ghost-button danger", async () => {
    const ok = await confirmAction("Discard this run?", "It will not be saved.", "Discard");
    if (!ok) return;
    state.sports.pending = null;
    saveState();
    sportsCloseRunTracker();
  }));
  actions.append(sportsButton("Save run", "finish-button", () => {
    if (!(r.meters >= 20)) { error.textContent = "Almost no distance was recorded, so there is nothing useful to save. Try again or enter the run by hand."; return; }
    sportsFinishSave({ source: "gps", type: s.type, meters: r.meters, seconds: r.seconds, quality: r.quality, accuracy: r.accuracy, rpe: Number(document.getElementById("rs-rpe").value) || null, note: note.value.trim() });
  }));
  card.append(actions);
  sportsRoot.append(card);
}

// ----- Save and feedback -----

function sportsFinishSave(draft) {
  const s = sportsRunSession;
  sportsStopHardware();
  const { run, previous, record } = sportsCommitRun(draft);
  s.stage = "feedback";
  s.saved = { run, previous, record, lines: sportsRunFeedback(run, s.planned, previous) };
  s.repsDone += 1;
  renderSports();
  showToast(record ? "New personal record! Run saved." : "Run saved.");
}

function renderSportsFeedback(s) {
  const { run, record, lines } = s.saved;
  sportsRoot.append(sportsRunHeader("Run saved", "← Done"));
  const card = sp("div", "sp-card rt-card");
  const stats = sp("div", "rt-stats");
  stats.append(sportsBigReadout("distance", "fb-dist", run.meters ? run.meters + " m" : "no distance"), sportsBigReadout("time", "fb-time", sportsClock(run.seconds)));
  stats.append(sportsBigReadout("pace", "fb-pace", run.meters ? sportsPaceFromSeconds(run.seconds, run.meters) : "-"));
  card.append(stats);
  card.append(sp("p", "sp-fine", sportsSourceLabels[run.source] + (run.rpe ? " · effort " + run.rpe + "/10" : "")));
  if (record) card.append(sp("p", "rt-flash", "New personal record for this distance" + (run.source === "gps" ? " (GPS estimate)" : "") + "!"));
  card.append(sp("h3", "", "Coach's notes"));
  card.append(sportsList(lines));
  if ((run.source === "gps" || run.source === "treadmill") && run.type === "trial" && run.meters >= 780 && run.meters <= 820) {
    card.append(sportsButton("Use this as his 800 m time (estimate)", "ghost-button", async () => {
      const ok = await confirmAction("Use this estimate?", "GPS or treadmill distance is not exact. Only do this if you are happy with it as a rough 800 m time.", "Use it");
      if (!ok) return;
      state.sports.profile.current800Seconds = run.seconds;
      if (sportsProgram()) sportsProgram().profile.current800Seconds = run.seconds;
      saveState();
      showToast("800 m time updated (estimate).");
    }));
  }
  const actions = sp("div", "sp-actions");
  if (s.repsTotal && s.repsDone < s.repsTotal) {
    actions.append(sportsButton("Next rep (" + (s.repsDone + 1) + " of " + s.repsTotal + ")", "finish-button", () => {
      s.stage = "track"; s.phase = "idle"; s.clock = sportsClockNew(); s.clockRunning = false; s.tracker = null; s.flash = ""; s.splits = []; s.result = null; s.saved = null;
      renderSports();
    }));
  }
  actions.append(sportsButton("Done", s.repsTotal && s.repsDone < s.repsTotal ? "ghost-button" : "finish-button", sportsCloseRunTracker));
  card.append(actions);
  sportsRoot.append(card);
}

// ----- Unfinished run (shown on the Sports tab after a reload or leaving mid-run) -----

function sportsPendingCard() {
  const p = state.sports.pending;
  if (!p) return null;
  const card = sp("div", "sp-card");
  card.append(sp("h2", "", "Unfinished run"));
  card.append(sp("p", "special-note", sportsSourceLabels[p.source] + ": " + (p.meters ? p.meters + " m" : "no distance") + " in " + sportsClock(p.seconds) + ". The run was interrupted. Save what was recorded or discard it."));
  const actions = sp("div", "sp-actions");
  actions.append(sportsButton("Discard", "ghost-button danger", async () => {
    const ok = await confirmAction("Discard the unfinished run?", "It will not be saved.", "Discard");
    if (!ok) return;
    state.sports.pending = null;
    saveState();
    renderSports();
  }));
  actions.append(sportsButton("Save it", "finish-button", () => {
    const { meters, seconds, source, type, quality, accuracy } = p;
    if (source !== "timed" && meters < 20) { state.sports.pending = null; saveState(); renderSports(); showToast("Too little distance to save, so it was cleared."); return; }
    sportsCommitRun({ source, type, meters, seconds, quality, accuracy, rpe: null, note: "Saved after an interruption" });
    renderSports();
    showToast("Unfinished run saved.");
  }));
  card.append(actions);
  return card;
}

// ----- Entry from renderSports -----

function renderSportsRun() {
  const s = sportsRunSession;
  if (s.stage === "pick") return renderSportsRunPick(s);
  if (s.stage === "result") return renderSportsGpsResult(s);
  if (s.stage === "feedback") return renderSportsFeedback(s);
  if (s.mode === "gps") return renderSportsGps(s);
  if (s.mode === "treadmill") return renderSportsTreadmill(s);
  return renderSportsTimed(s);
}

// If the page comes back after being hidden (screen lock, app switch) during a GPS run, say so.
document.addEventListener("visibilitychange", () => {
  const s = sportsRunSession;
  if (!s || s.stage !== "track") return;
  if (document.hidden) {
    s.hiddenAt = Date.now();
    sportsSavePending(false);
  } else if (s.hiddenAt) {
    const away = Date.now() - s.hiddenAt;
    s.hiddenAt = null;
    if (s.mode === "gps" && s.phase === "running" && away > 5000) {
      s.tracker.gaps += away > GPS_GAP_SECONDS * 1000 ? 1 : 0;
      s.tracker.resetAnchor();
      s.flash = "The page was in the background for " + Math.round(away / 1000) + " s. GPS may have missed part of the run.";
      sportsWakeLock(true);
      if (sportsRunRefs.flash) sportsRunRefs.flash.textContent = s.flash;
    } else if (s.phase === "running" || s.clockRunning) sportsWakeLock(true);
  }
});

window.addEventListener("pagehide", () => { if (sportsRunSession) sportsSavePending(false); });
