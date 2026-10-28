# Repday — Workout Log

A phone-first workout app for finding exercises by muscle group and recording gym sessions.

## Features

- Original gym background with an interactive anatomy figure; visual direction informed by the supplied Nike design reference.
- Special Workouts tab with DAREBEE's [Super Saiyan workout](https://darebee.com/workouts/super-saiyan-workout.html), four round levels, exercise targets, and one-tap loading into the workout log.
- Tap the **Guide** (play) button beside any exercise in Build, Special, or Log to view a two-pose visual guide and movement steps. All 113 exercise names have a guide.

- Load one of 13 body-part workout presets, preview its exercises, and add it to the current session without duplicate exercises or losing logged sets.

- Switch between front and back views of the interactive muscle map.
- Select a muscle group on the map or from the accessible button list.
- Browse eight exercises for each of the 13 muscle groups and tap one to add it to your workout (tap again to remove it). A bar at the bottom shows how many exercises are queued and opens the log.
- Record weighted sets in pounds or kilograms, bodyweight sets by reps only, and holds by duration. Push-ups, pull-ups, chin-ups, dips, and other bodyweight moves have no weight field; each saved set shows its rep count. Planks, farmer carries, plate pinches, Pallof presses, and Superman use a start/pause/reset timer or manually entered seconds.
- A rest timer starts after every saved set (default 1 min 30; choose Off, 30 sec, 1, 1:30, 2, or 3 min in the Log toolbar). Adjust it by ±15 seconds or skip it; it beeps and vibrates where the browser allows when rest is over, and keeps counting through a page reload.
- The home screen shows today's date, quick stats (this week, training days, saved workouts), a **Continue** card for a workout in progress, and your saved workouts.
- **Save for later:** in the Log, save the current exercise list under a name (optionally clearing today's log). Start a saved workout from Home in one tap; History workouts can also be saved with **Save as workout**.
- **Quick delete:** discard today's workout (Log or the Home card), delete a finished workout from History, or delete a saved workout. Each asks to confirm and offers **Undo** for a few seconds.
- The body map highlights the selected muscle in lime and muscles already in today's workout in orange.
- Finish a workout and review completed sessions in History. Exercises with no logged sets are left out of the saved session.
- Use the training calendar to see workout days, choose the day for a workout, mark gym visits without a session, and save short day notes.
- See training days, progress toward the next milestone, a configurable weekly goal, the largest same-unit lift gain and bodyweight rep gain against each exercise's first logged workout, and recent average sets per workout. The gym lighting and body-map glow change after 5, 15, and 30 training days as visual milestones.
- **Last time:** each exercise in the Log shows what you did in your previous workout, and pre-fills the weight and reps from it.
- **Next target:** weighted lifts get a suggested next step with the reason: work up through 8–12 reps, then add 5 lb (2.5 kg). Bodyweight exercises suggest one more rep; holds suggest 5 more seconds. Tap **Use** to fill the form.
- **Personal records:** a set that beats your previous best (by estimated one-rep max, reps or hold time) is marked **PR** in the Log and in History.
- **Exercise progress** (History): pick an exercise to see a chart of your top weight per workout, your best set, estimated 1RM, and a list of every personal record.
- **Weekly plan** (Home): choose a saved workout for each weekday. Today's plan appears as a card with a one-tap Start.
- **Body weight** (Home): log your weight and see a chart and the change since last time. Undo is available.
- **Activity heatmap** (History): a year of training days as a grid, darker for more sets. Tap a day to open it in the calendar. Also shows days trained and your streak of weeks hitting the weekly goal.
- **Less scrolling:** Weekly plan, Body weight, the body-part presets, Your workout, workout options and the History panels are tap-to-open boxes that remember whether you left them open. The Log shows one exercise open at a time; the others are one-line rows you tap to open. Saved workouts show the first three with a Show all button.
- Save the active workout and workout history in this browser's local storage.

Workout data stays on the device and browser where it was entered. It does not sync between devices or browsers.

## Movement guide images

The 218 movement photos and their exercise instructions come from [Free Exercise DB](https://github.com/yuhonas/free-exercise-db), which publishes its dataset under the Unlicense. The Bird dog, Punches, High knees, and Turning kicks diagrams are original SVG assets for this app. The Super Saiyan routine links to its [DAREBEE source](https://darebee.com/workouts/super-saiyan-workout.html).

## Run locally

This dependency-free static app can be served with `python3 -m http.server 4173` in this folder, then open <http://localhost:4173>.

## Deploy preview

Run `npm run deploy` to create a Vercel Preview deployment. The script explicitly targets Preview; do not use a production deployment for this prototype. After each deployment, point `workout-log-preview-andrerlaster-lgtms-projects.vercel.app` at its new Preview URL with `vercel alias set <preview-url> workout-log-preview-andrerlaster-lgtms-projects.vercel.app`. Keep using that stable alias on your phone so browser-saved workout history stays on the same origin.

## Sports Performance Training

The **Sports** tab builds a 12-week program (Foundation, Development, Event-specific preparation) for an athlete. It starts with Track & Field → 800 m.

- Flow: choose sport → event → athlete profile (age, experience, phase, 3 non-consecutive days, gym/outdoors, track access, current time) → generate program.
- Each workout lists endurance, speed, speed-endurance, leg strength, core, running-mechanics and mobility work, with a "how it helps" line for every item.
- Strength, core, drills and mobility load into the normal **Log** (so sets, rest timer, PRs and History work as usual). Runs (distance, time, pace, effort) are logged in the Sports tab, with personal records and an 800 m time-trial chart.
- Each workout ends with a check-in (effort, fatigue, recovery, pain). Easing is quick and stepping up is slow, with age caps; the plan adapts the following week. Track workouts switch on when "I have track access" is ticked.
- Track season: enter school practice days and the plan becomes light support work only.
- Data is stored in the same browser save under `sports`; older saves load unchanged.
- To add a sport or event, add it to `sportsCatalog`, add a builder to `sportsBuilders`, and add new exercises to `sportsExerciseInfo` in `sports-data.js`. Logic can be checked in Node: `node -e 'require("./sports-data.js")'`.

This is a planning aid, not medical advice. Athletes should follow their coach and doctor.

### Visual guides

Every sports exercise now opens a guide with a two-pose picture (photos where available, otherwise stick-figure illustrations), the steps, "How this helps", what to watch for and what to avoid. Running steps have a Guide button for running form, acceleration starts and hill sprints.

### Coaching assistant (parent mode)

- **Coach me** on each workout opens a guided view: what is being developed and why it matters for the 800 m, a readiness check (energy, sleep, soreness, illness) that can switch to an easier version or rest, step-by-step cues (how to do it, what to watch, mistakes to avoid), intensity guidance (RPE and talk test), a rep checker ("too fast or too slow?" from rep times you enter), what to do if he is struggling, stop rules, and an after-session review.
- **Weekly recommendation** (Progress, Continue, Repeat, Ease back) weighs consistency, fatigue, recovery, effort, pain and run-pace trends, and explains why. Good check-ins alone never trigger Progress; it needs a performance signal too. Phase changes require enough completed workouts. The 12 weeks follow his development: he can repeat or ease weeks, and the app recommends but never forces.
- Time trials are optional; the optional "pace check" is a controlled effort, not all-out.
- The app only uses what is entered (times, distances, ratings, sets). It does not analyse form or heart rate.
- Sources and their limits are listed in the in-app Parent coaching guide. Run `node tests/sports-logic.js` to check the rules (no dependencies).
