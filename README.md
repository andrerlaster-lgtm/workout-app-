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
- Save the active workout and workout history in this browser's local storage.

Workout data stays on the device and browser where it was entered. It does not sync between devices or browsers.

## Movement guide images

The 218 movement photos and their exercise instructions come from [Free Exercise DB](https://github.com/yuhonas/free-exercise-db), which publishes its dataset under the Unlicense. The Bird dog, Punches, High knees, and Turning kicks diagrams are original SVG assets for this app. The Super Saiyan routine links to its [DAREBEE source](https://darebee.com/workouts/super-saiyan-workout.html).

## Run locally

This dependency-free static app can be served with `python3 -m http.server 4173` in this folder, then open <http://localhost:4173>.

## Deploy preview

Run `npm run deploy` to create a Vercel Preview deployment. The script explicitly targets Preview; do not use a production deployment for this prototype. After each deployment, point `workout-log-preview-andrerlaster-lgtms-projects.vercel.app` at its new Preview URL with `vercel alias set <preview-url> workout-log-preview-andrerlaster-lgtms-projects.vercel.app`. Keep using that stable alias on your phone so browser-saved workout history stays on the same origin.
