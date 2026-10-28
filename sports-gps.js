// Run tracking logic for Sports Performance Training: GPS distance, treadmill conversion and timers.
// Pure functions only (no DOM, no geolocation calls), so they can be tested in Node. UI is in sports-run.js.
//
// GPS in a phone browser is an ESTIMATE. Typical error is several meters per reading, more near buildings and
// trees, and the browser may stop reporting when the screen locks. Only a running total is kept: raw routes
// and coordinates are never stored.

const GPS_MAX_ACCURACY = 25;   // readings less precise than this (meters) are ignored
const GPS_READY_ACCURACY = 20; // a lock this good is needed before the run can start
const GPS_MIN_STEP = 3;        // movement smaller than this is treated as jitter
const GPS_MAX_SPEED = 12.5;    // m/s; faster readings are treated as glitches
const GPS_GAP_SECONDS = 15;    // no good reading for this long counts as a signal gap
const GPS_SMOOTHING = 0.55;   // weight of each new reading when smoothing
const SPORTS_MILES = 1609.344;

const sportsDistanceChoices = [100, 200, 400, 600, 800];

function sportsHaversine(a, b) {
  const R = 6371008.8;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Where to notify during a run: 800 m gives 200/400/600 (then the finish at 800).
function sportsMilestones(target) {
  if (!(target > 150)) return [];
  const step = target <= 450 ? 100 : target <= 1000 ? 200 : target <= 3000 ? 400 : 1000;
  const marks = [];
  for (let m = step; m < target - 1; m += step) marks.push(m);
  return marks;
}

function sportsMetersFrom(value, unit) {
  const factor = unit === "mi" ? SPORTS_MILES : unit === "km" ? 1000 : 1;
  return Math.round(Number(value) * factor);
}

function sportsUnitFromMeters(meters, unit) {
  const factor = unit === "mi" ? SPORTS_MILES : unit === "km" ? 1000 : 1;
  return meters / factor;
}

// ---------- Timer (timestamp based, so it stays correct if the page is throttled in the background) ----------

function sportsClockNew() {
  return { startedAt: null, accMs: 0, running: false };
}
function sportsClockStart(clock, now) {
  if (!clock.running) { clock.startedAt = now; clock.running = true; }
}
function sportsClockPause(clock, now) {
  if (clock.running) { clock.accMs += now - clock.startedAt; clock.running = false; clock.startedAt = null; }
}
function sportsClockElapsed(clock, now) {
  return clock.accMs + (clock.running ? now - clock.startedAt : 0);
}

// ---------- GPS tracker ----------

function sportsGpsTracker(targetMeters) {
  const marks = sportsMilestones(targetMeters);
  const tr = {
    target: targetMeters > 0 ? targetMeters : 0,
    distance: 0, anchor: null, anchorEl: 0, anchorDist: 0,
    lastGoodAt: null, lockAccuracy: null, accSum: 0, accepted: 0, ignored: 0, jumps: 0, gaps: 0,
    fired: [], reached: false, reachedMs: null, splitMs: {}, recent: [], marks
  };

  // f: { lat, lon, accuracy, t (ms) }; elapsedMs: the run clock now. Returns { events: [...] }.
  tr.fix = function (f, elapsedMs) {
    const events = [];
    if (![f.lat, f.lon, f.accuracy, f.t].every(Number.isFinite)) { tr.ignored += 1; return { events }; }
    if (f.accuracy > GPS_MAX_ACCURACY) { tr.ignored += 1; return { events }; }
    if (tr.lastGoodAt !== null && f.t - tr.lastGoodAt > GPS_GAP_SECONDS * 1000) tr.gaps += 1;
    tr.lastGoodAt = f.t;
    // Light smoothing: raw readings wander, and summing wandering points over-counts distance.
    if (tr.smooth && f.t - tr.smooth.t < GPS_GAP_SECONDS * 1000) {
      const a = GPS_SMOOTHING;
      f = { lat: tr.smooth.lat + a * (f.lat - tr.smooth.lat), lon: tr.smooth.lon + a * (f.lon - tr.smooth.lon), accuracy: f.accuracy, t: f.t };
    }
    tr.smooth = f;
    if (!tr.anchor) {
      tr.anchor = f; tr.anchorEl = elapsedMs; tr.anchorDist = tr.distance;
      if (tr.lockAccuracy === null) tr.lockAccuracy = f.accuracy;
      return { events };
    }
    const d = sportsHaversine(tr.anchor, f);
    const dt = (f.t - tr.anchor.t) / 1000;
    if (dt <= 0) return { events };
    if (d / dt > GPS_MAX_SPEED) {
      tr.ignored += 1; tr.jumps += 1;
      if (tr.jumps >= 3) { tr.anchor = f; tr.smooth = f; tr.anchorEl = elapsedMs; tr.jumps = 0; } // a lasting jump: start over from here
      return { events };
    }
    tr.jumps = 0;
    if (d < Math.max(GPS_MIN_STEP, f.accuracy * 0.8)) return { events };
    const before = tr.distance;
    tr.distance += d;
    tr.accSum += f.accuracy; tr.accepted += 1;
    // Interpolate the clock time when a mark was crossed between the previous point and this one.
    const timeAt = (m) => tr.anchorEl + ((m - before) / d) * (elapsedMs - tr.anchorEl);
    marks.forEach((m) => {
      if (!tr.fired.includes(m) && tr.distance >= m) { tr.fired.push(m); tr.splitMs[m] = timeAt(m); events.push({ type: "milestone", meters: m }); }
    });
    if (tr.target && !tr.reached && tr.distance >= tr.target) {
      tr.reached = true; tr.reachedMs = timeAt(tr.target); events.push({ type: "target", meters: tr.target, ms: tr.reachedMs });
    }
    tr.anchor = f; tr.anchorEl = elapsedMs;
    tr.recent.push({ el: elapsedMs, dist: tr.distance });
    while (tr.recent.length > 2 && elapsedMs - tr.recent[0].el > 20000) tr.recent.shift();
    return { events };
  };

  // After a pause the runner may have walked somewhere else: restart from the next good reading.
  tr.resetAnchor = function () { tr.anchor = null; tr.smooth = null; tr.recent = []; };

  tr.signal = function (nowMs) {
    if (tr.lastGoodAt === null) return "searching";
    return nowMs - tr.lastGoodAt > 10000 ? "lost" : "good";
  };
  tr.avgAccuracy = function () { return tr.accepted ? tr.accSum / tr.accepted : tr.lockAccuracy || null; };
  tr.quality = function () {
    const avg = tr.avgAccuracy();
    const total = tr.ignored + tr.accepted;
    const ratio = total ? tr.ignored / total : 0;
    if (avg === null) return "poor";
    if (avg > 20 || tr.gaps >= 2 || ratio > 0.6) return "poor";
    if (avg <= 10 && tr.gaps === 0 && ratio < 0.3) return "good";
    return "fair";
  };
  tr.recentPaceSecPerKm = function () {
    if (tr.recent.length < 2) return null;
    const a = tr.recent[0], b = tr.recent[tr.recent.length - 1];
    const meters = b.dist - a.dist, ms = b.el - a.el;
    return meters > 5 && ms > 3000 ? (ms / 1000) / (meters / 1000) : null;
  };
  return tr;
}

// A rough error band for display. It is deliberately wide and is not a guarantee.
function sportsGpsMargin(distance, quality, avgAccuracy) {
  const pct = quality === "good" ? 0.03 : quality === "fair" ? 0.06 : 0.12;
  return Math.round(Math.max(8, (avgAccuracy || 10) * 1.2) + distance * pct);
}

function sportsGpsQualityLabel(quality) {
  return quality === "good" ? "GPS signal was good" : quality === "fair" ? "GPS signal was fair" : "GPS signal was poor";
}

// ---------- Run feedback (uses the recorded distance, time, pace and effort only) ----------

const sportsSourceLabels = { gps: "GPS estimate", treadmill: "Treadmill", timed: "Timed run", track: "Track (measured)", manual: "Entered by hand" };
function sportsSourceGroup(source) { return source === "gps" ? "gps" : source === "treadmill" ? "treadmill" : source === "timed" ? "timed" : "entered"; }

function sportsParseEffort(text) {
  const m = /RPE\s*(\d+)(?:\s*-\s*(\d+))?/i.exec(text || "");
  return m ? { low: Number(m[1]), high: Number(m[2] || m[1]) } : null;
}

// run: saved run; planned: { runType, meters, minutes, effort } or null; previous: earlier run or null.
function sportsRunFeedback(run, planned, previous) {
  const lines = [];
  const paceOf = (r) => r.seconds / r.meters;
  if (run.source === "gps") {
    const margin = sportsGpsMargin(run.meters, run.quality || "fair", run.accuracy || 10);
    lines.push("This is a GPS estimate (" + sportsGpsQualityLabel(run.quality || "fair") + ", roughly ±" + margin + " m). Treat it as a guide, not a measured result.");
    if (run.meters <= 400) lines.push("On short distances the same GPS error is a bigger share of the run, so compare trends across several runs rather than one time.");
  } else if (run.source === "treadmill") {
    lines.push("Treadmill distance comes from the belt display and can differ from outdoor running. Use it to compare treadmill runs with each other.");
  } else if (run.source === "timed") {
    lines.push("Timed run: judge it by duration and effort, not distance or pace.");
  } else if (run.source === "track") {
    lines.push("Measured on a track: the most reliable distance, so this is a good result to compare against.");
  }
  if (planned && planned.effort && run.rpe) {
    const e = sportsParseEffort(planned.effort);
    if (e && run.rpe > e.high + 1) lines.push("He rated it " + run.rpe + "/10, above the planned " + planned.effort + ". Next time start a little slower so effort matches the plan.");
    else if (e && run.rpe < e.low - 1) lines.push("He rated it " + run.rpe + "/10, easier than the planned " + planned.effort + ". That is fine for now; keep to the plan rather than chasing speed.");
    else if (e) lines.push("Effort of " + run.rpe + "/10 matched the plan (" + planned.effort + ").");
  }
  if (planned && planned.minutes && run.source === "timed") {
    const mins = Math.round(run.seconds / 60);
    lines.push("Ran " + mins + " of " + planned.minutes + " planned minutes" + (mins >= planned.minutes ? "." : ". A shorter session still counts; build up gradually."));
  }
  if (planned && planned.meters && run.meters > 0 && run.source !== "timed") {
    const diff = ((run.meters - planned.meters) / planned.meters) * 100;
    if (Math.abs(diff) > 10) lines.push("Distance was " + Math.round(Math.abs(diff)) + "% " + (diff > 0 ? "over" : "short of") + " the " + planned.meters + " m target.");
  }
  if (previous && previous.meters > 0 && run.meters > 0 && run.seconds > 0) {
    const change = ((paceOf(run) - paceOf(previous)) / paceOf(previous)) * 100;
    const effortUp = run.rpe && previous.rpe && run.rpe - previous.rpe >= 1.5;
    if (change <= -2 && !effortUp) lines.push("Pace is about " + Math.abs(Math.round(change)) + "% faster than the last similar run at a similar effort.");
    else if (change >= 5) lines.push("Pace is about " + Math.round(change) + "% slower than the last similar run" + (effortUp ? " and felt harder" : "") + ". One run is not a trend; check sleep and recovery if it repeats.");
    else lines.push("Pace is similar to the last comparable run.");
  } else if (!previous && run.meters > 0 && run.source !== "timed") {
    lines.push("This is the first comparable run, so there is no earlier pace to compare yet.");
  }
  if (planned && planned.runType === "easy" && run.rpe >= 6) lines.push("Easy runs should feel like 3-4 out of 10 with full sentences possible. Slow down next time.");
  return lines;
}

if (typeof module !== "undefined" && module.exports) {
  Object.assign(module.exports, {
    sportsHaversine, sportsMilestones, sportsMetersFrom, sportsUnitFromMeters, sportsClockNew, sportsClockStart,
    sportsClockPause, sportsClockElapsed, sportsGpsTracker, sportsGpsMargin, sportsRunFeedback, sportsParseEffort, sportsSourceLabels
  });
}
