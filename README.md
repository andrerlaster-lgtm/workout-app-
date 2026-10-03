# Repday — Workout Log

A phone-first workout app for finding exercises by muscle group and recording gym sessions.

## Features

- Original gym background with an interactive anatomy figure; visual direction informed by the supplied Nike design reference.
- Special Workouts tab with DAREBEE's [Super Saiyan workout](https://darebee.com/workouts/super-saiyan-workout.html), four round levels, exercise targets, and one-tap loading into the workout log.
- Tap **See movement** beside any exercise in Build, Special, or Log to view a two-pose visual guide and movement steps. All 113 exercise names have a guide.

- Load one of 13 body-part workout presets, preview its exercises, and add it to the current session without duplicate exercises or losing logged sets.

- Switch between front and back views of the interactive muscle map.
- Select a muscle group on the map or from the accessible button list.
- Browse eight exercises for each of the 13 muscle groups and add them to a workout.
- Record weighted sets in pounds or kilograms, bodyweight sets by reps only, and holds by duration. Push-ups, pull-ups, chin-ups, dips, and other bodyweight moves have no weight field; each saved set shows its rep count. Planks, farmer carries, plate pinches, Pallof presses, and Superman use a start/pause/reset timer or manually entered seconds.
- Finish a workout and review completed sessions in History.
- Use the training calendar to see workout days, choose the day for a workout, mark gym visits without a session, and save short day notes.
- Save the active workout and workout history in this browser's local storage.

Workout data stays on the device and browser where it was entered. It does not sync between devices or browsers.

## Movement guide images

The 218 movement photos and their exercise instructions come from [Free Exercise DB](https://github.com/yuhonas/free-exercise-db), which publishes its dataset under the Unlicense. The Bird dog, Punches, High knees, and Turning kicks diagrams are original SVG assets for this app. The Super Saiyan routine links to its [DAREBEE source](https://darebee.com/workouts/super-saiyan-workout.html).

## Run locally

This dependency-free static app can be served with `python3 -m http.server 4173` in this folder, then open <http://localhost:4173>.

## Deploy preview

Run `npm run deploy` to create a Vercel Preview deployment. The script explicitly targets Preview; do not use a production deployment for this prototype.
