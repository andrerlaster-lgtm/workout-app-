// Coaching knowledge and training decisions for Sports Performance Training.
// Pure data and functions (no DOM). The app only knows what is entered: distances, times, effort ratings,
// check-ins and logged sets. It cannot see running form or measure heart rate, so form guidance is
// written as things for the parent to look for, never as something the app measured.

const sportsSources = [
  { id: "nsca", org: "NSCA", title: "Youth Resistance Training: Updated Position Statement Paper (Faigenbaum et al., J Strength Cond Res 2009)", url: "https://www.nsca.com/globalassets/about/position-statements/position_stand_youth_resistance_training---2009.pdf", used: "Strength work for youth is relatively safe when it is well designed and supervised; most injuries trace to poor technique, excess load or no supervision; extra supervision while learning technique; maximal testing only after a habituation period with professionals." },
  { id: "consensus2014", org: "International consensus", title: "Position statement on youth resistance training: the 2014 International Consensus (Lloyd et al., Br J Sports Med)", url: "https://www.researchgate.net/publication/256929167_Position_statement_on_youth_resistance_training_The_2014_International_Consensus", used: "Reaffirms youth resistance training when qualified adults design and supervise it to suit the young person." },
  { id: "ioc2015", org: "IOC", title: "IOC consensus statement on youth athletic development (2015)", url: "https://stillmed.olympics.com/media/Documents/Athletes/Medical-Scientific/Consensus-Statements/2015_youth-athletic-development.pdf", used: "Varied athletic exposure, technique-driven strength and conditioning, enough rest and recovery; overuse injury is linked to disproportionate loads and too little recovery, especially during rapid growth." },
  { id: "ioc2016", org: "IOC", title: "IOC consensus statement: How much is too much? Training load, sport injury and illness (2016)", url: "https://stillmed.olympics.com/media/Documents/Athletes/Medical-Scientific/Consensus-Statements/2016_How-much-is-too-much-load-sport-risk-illness-part-2.pdf", used: "Make small load changes; the app keeps weekly steps small (about 10%, a common rule of thumb rather than a proven youth threshold)." },
  { id: "nfhs", org: "NFHS", title: "Heat Acclimatization and Heat Illness Prevention Position Statement (2022)", url: "https://www.nfhs.org/media/5919613/nfhs-heat-acclimatization-april-2022-final.pdf", used: "Ramp up gradually (conditioning takes weeks), start well hydrated, cut intensity and add rest breaks as heat and humidity rise, watch closely for heat illness." },
  { id: "pmc800", org: "Peer-reviewed", title: "Aerobic and Anaerobic Speed Predicts 800-m Running Performance in Young Recreational Runners (PMC8176219)", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8176219/", used: "800 m performance in young runners depends on both aerobic and anaerobic speed; the aerobic share is larger for slower finishing times (about 60/40 under 120 s to about 70/30 over 150 s)." },
  { id: "usatf", org: "USATF", title: "Coaching Youth Track & Field (ASEP with USATF), for coaches of athletes 14 and under", url: "http://oldserver.usatf.org/Resources-for---/Coaches/Coaching-Education/Coaching-Youth.aspx", used: "Listed as the USATF-endorsed youth resource; I could only confirm its description, not read its 800 m content. SafeSport training is recommended for adults coaching minors." },
  { id: "wa", org: "World Athletics", title: "Athletics for Children and Adolescents (World Athletics development document)", url: "https://worldathletics.org/download/downloadnsa?filename=90c02972-529c-49dc-bd57-6d340d8c3c08.pdf&urlslug=athletics-for-children-and-adolescents", used: "General youth development background only; I could not retrieve 800 m specific guidance from World Athletics." },
  { id: "bone", org: "Peer-reviewed", title: "Effects of Low Energy Availability on Bone Health in Endurance Athletes (PMC7900047)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7900047", used: "Under-eating and sudden jumps in training are risk factors for bone stress injuries in endurance runners; persistent, localised bone pain needs a doctor." },
  { id: "coachingPacing", org: "Coaching literature (secondary)", title: "800 m pacing and training articles (SportCoaching, Cartwright Fitness, Topend Sports)", url: "https://sportcoaching.com.au/how-to-master-the-800m-run/", used: "Common coaching view that a slight positive split works best (first lap about 2-3 seconds faster than the second) and that very hard starts cost time. Secondary sources, so used as guidance only." }
];

const sportsKnowledge = [
  {
    id: "demands", title: "What the 800 m asks of him", src: ["pmc800", "coachingPacing"],
    points: [
      "The 800 m is two laps, about two to three minutes of hard running for a new runner. Most of the energy still comes from the aerobic system (roughly 60-70% in young runners; sources differ), with the rest from fast, short-lived energy.",
      "So he needs two things: a strong aerobic base, and the ability to run fast and stay relaxed while tired. Easy running builds the first; strides, hills and repeats build the second.",
      "At his stage the base comes first. Racing sharp is a later step, and being healthy and enjoying it keeps him in the sport."
    ]
  },
  {
    id: "aerobic", title: "Aerobic endurance", src: ["pmc800", "ioc2016"],
    points: [
      "Easy running should feel comfortable enough to talk in full sentences. If he cannot, it is too fast.",
      "Most running time stays easy. Build run time slowly (about 10% a week at most, with lighter weeks) rather than adding mileage quickly."
    ]
  },
  {
    id: "speed", title: "Speed and acceleration", src: ["ioc2015"],
    points: [
      "Short, fast, relaxed running (strides, 20-30 m accelerations, short hill sprints) trains speed without much fatigue. Always rest fully so every rep is quick and clean.",
      "Quality beats quantity: stop the set when he slows down or gets tight."
    ]
  },
  {
    id: "speedEndurance", title: "Speed endurance", src: ["pmc800"],
    points: [
      "This is the ability to hold a strong pace as it starts to hurt, the key skill in the second lap. It comes from controlled repeats with rest, not from all-out running.",
      "For a 14-year-old beginner these stay at a hard-but-controlled effort (about 7 out of 10, never all-out)."
    ]
  },
  {
    id: "mechanics", title: "Running mechanics", src: ["ioc2015"],
    points: [
      "Drills teach posture, a quick foot strike under the hips, knee lift and arm swing. Do them tall and relaxed at a controlled pace; they are practice, not exercise to exhaustion.",
      "You are looking for relaxed shoulders and hands, a tall chest, arms swinging front-to-back, and feet landing under the body rather than far in front."
    ]
  },
  {
    id: "strength", title: "Leg strength, power and core", src: ["nsca", "consensus2014", "ioc2015"],
    points: [
      "Strength training is appropriate and helpful for 14-year-olds when technique comes first and an adult supervises, especially in the first weeks. Light loads, good form, no maximum-weight lifting or max testing.",
      "Finish each set with a few good reps still in reserve. If form slips, stop the set. Add weight only after all sets look clean for two sessions in a row.",
      "A strong core and hips keep the stride tidy when he is tired late in the race."
    ]
  },
  {
    id: "pacing", title: "Pacing and race strategy", src: ["coachingPacing"],
    points: [
      "A common, sensible plan is a smooth first lap and a strong, steady second lap: the first lap only slightly faster than the second (about 2-3 seconds), not a sprint start.",
      "Practise by running repeats evenly. If the last rep is much slower than the first, he started too hard. For a first race, even effort and passing runners in the last 200 m is a good goal.",
      "Racing is not required to progress. Time trials stay optional and never all-out in beginner training."
    ]
  },
  {
    id: "recovery", title: "Recovery and injury prevention", src: ["ioc2015", "ioc2016", "bone", "nfhs"],
    points: [
      "Hard days are separated by rest days. Sleep, regular meals and water are part of training; do not let him under-eat.",
      "Growth spurts and quick jumps in training raise overuse risk. Keep load steady, and ease back when tired, sore or growing quickly.",
      "In heat or humidity, shorten the session, slow down, take water breaks, and move indoors or to a cooler time of day.",
      "Pain that is sharp, localised to one spot on a bone, getting worse, or causing a limp needs a rest and a doctor, not another workout."
    ]
  }
];

// ---------- Exercise coaching (cues, mistakes) ----------
// "cues" are what to say and look for. The app cannot see form: these are for the parent's eyes.
const sportsExerciseCoach = {
  "Leg swings": { cues: ["Stand tall and hold a wall or fence.", "Swing from the hip, not by leaning.", "Start small and let the range grow."], mistakes: ["Swinging wildly or leaning forward and back."] },
  "90/90 hip switch": { cues: ["Sit tall.", "Rotate slowly from the hips."], mistakes: ["Rushing, or forcing the knees down."] },
  "A-skip": { cues: ["Tall posture, eyes ahead.", "Knee up, foot snaps down under the hips.", "Opposite arm swings with each knee."], mistakes: ["Leaning back, landing heels first, stomping."] },
  "B-skip": { cues: ["Same as A-skip, then reach the foot forward and sweep it back down under the hips."], mistakes: ["Over-reaching the leg far in front, losing posture."] },
  "High knees": { cues: ["Quick, light feet.", "Knee to hip height, stay tall."], mistakes: ["Leaning back, slow heavy steps."] },
  "Butt kicks": { cues: ["Heels flick toward the glutes.", "Knees stay low, quick rhythm."], mistakes: ["Leaning forward or letting the knees drift out front."] },
  "Straight-leg skips": { cues: ["Toes up, legs mostly straight.", "Paw the ground back under the hips.", "Quick, bouncy contacts."], mistakes: ["Heavy heel strikes, bending the knee a lot."] },
  "Arm swing drill": { cues: ["Elbows about 90 degrees.", "Hands from hip to cheek, not across the body.", "Shoulders and hands relaxed."], mistakes: ["Fists clenched, arms crossing the chest, shoulders up by the ears."] },
  "Calf pogo hops": { cues: ["Stay tall, knees nearly straight.", "Hop from the ankles, quick and quiet."], mistakes: ["Big squatting jumps, landing loudly on heels. Keep it small and stop if the calves or shins hurt."] },
  "Goblet squat": { cues: ["Light dumbbell held at the chest.", "Feet shoulder-width, heels down.", "Sit down between the hips, knees track over the toes, chest up."], mistakes: ["Knees caving in, heels lifting, rounding the back, using too much weight."] },
  "Bodyweight squat": { cues: ["Sit hips back and down, chest up.", "Heels stay on the floor.", "Knees track over the middle toes."], mistakes: ["Knees caving in, heels coming up."] },
  "Step-up with knee raise": { cues: ["Whole foot on the step.", "Drive through that heel to stand tall, lift the other knee.", "Lower slowly."], mistakes: ["Pushing off the back foot, leaning way forward, using a step that is too high."] },
  "Step-up": { cues: ["Whole foot on a knee-high step.", "Stand tall, then lower with control."], mistakes: ["Pushing off the back foot, rushing."] },
  "Glute bridge": { cues: ["Feet flat, press through heels.", "Squeeze the glutes at the top; ribs down."], mistakes: ["Arching the lower back, pushing through the toes."] },
  "Single-leg glute bridge": { cues: ["One foot flat, other leg held up.", "Hips stay level as you lift."], mistakes: ["Hips twisting or dropping to one side."] },
  "Standing calf raise": { cues: ["Rise slowly onto the balls of the feet.", "Pause at the top, lower slowly."], mistakes: ["Bouncing, rolling to the outside of the feet."] },
  "Romanian deadlift": { cues: ["Very light dumbbells.", "Soft knees, push the hips back.", "Back flat, weights slide down the thighs."], mistakes: ["Rounding the back, bending the knees like a squat, too much weight."] },
  "Hip hinge": { cues: ["Hands on thighs, hips go back.", "Flat back, then squeeze the glutes to stand."], mistakes: ["Rounding the back, squatting instead of hinging."] },
  "Dumbbell lunge": { cues: ["Long step, torso tall.", "Front knee over the middle toes.", "Light weights only."], mistakes: ["Front knee collapsing in, short wobbly steps, leaning forward."] },
  "Walking lunge": { cues: ["Long step, torso tall.", "Both knees about 90 degrees."], mistakes: ["Knee caving in, rushing the steps."] },
  "Bulgarian split squat": { cues: ["Back foot on a low bench, front foot far enough forward.", "Lower straight down, chest up.", "Start with no weight."], mistakes: ["Front foot too close, wobbling knee, going heavy too soon. Skip it if balance is poor."] },
  "Plank": { cues: ["Forearms down, body one straight line.", "Squeeze glutes, ribs down, breathe."], mistakes: ["Sagging hips, hips up high, holding the breath. Stop when form breaks."] },
  "Side plank": { cues: ["Elbow under the shoulder.", "Hips up, body in a straight line, breathe."], mistakes: ["Hips dropping, rolling forward or back."] },
  "Dead bug": { cues: ["Lower back stays flat to the floor.", "Move the opposite arm and leg slowly."], mistakes: ["Back arching off the floor, moving too fast."] },
  "Bird dog": { cues: ["Hips and shoulders stay level.", "Reach long, do not lift high."], mistakes: ["Twisting the hips, arching the back."] },
  "Reverse crunch": { cues: ["Curl the hips up using the lower abs.", "Slow and controlled."], mistakes: ["Swinging the legs for momentum."] },
  "Hip flexor stretch": { cues: ["Tuck the pelvis, gentle shift forward.", "Mild stretch only, breathe."], mistakes: ["Arching the lower back or stretching into pain."] },
  "Hamstring stretch": { cues: ["Hinge from the hips, back long.", "Stop at a mild pull."], mistakes: ["Bouncing, rounding the back, stretching into pain."] },
  "Calf stretch": { cues: ["Heel stays down, leg straight.", "Hold a mild stretch."], mistakes: ["Lifting the heel, bouncing."] }
};

// ---------- Session coaching ----------

const sportsSessionCoach = {
  1: {
    developing: "Aerobic endurance and leg strength.",
    why: "The 800 m is mostly an aerobic race. A bigger aerobic base lets him run the second lap strongly instead of fading, and stronger legs hold his stride together when he is tired.",
    focus: ["Keep the run truly easy (talk in full sentences).", "Run tall and relaxed.", "Good strength technique over heavy weight."],
    evaluate: ["Could he have kept talking the whole run?", "Did he finish feeling like he could have done more?", "Were all strength reps clean, with the last ones still controlled?", "Any soreness that is more than mild?"],
    stop: ["Sharp or worsening pain, or a limp.", "Dizziness, chest pain, or trouble breathing that does not settle.", "Feeling faint, nauseated or overheated."],
    byPhase: {
      foundation: "Just build the habit. The only job today is easy, steady running and learning the strength moves with light weight.",
      development: "The steady pickups are small bursts, still controlled (RPE 5-6). He should be able to say a short phrase, not a sentence, during them.",
      event: "The steady section should feel comfortably hard (RPE 6) but even. This lifts the pace he can hold. If it feels like a race, slow down."
    }
  },
  2: {
    developing: "Speed, acceleration and running mechanics.",
    why: "A strong first 100 m and relaxed fast running let him cover the early part of the 800 m without wasting energy. Good mechanics make every stride cheaper.",
    focus: ["Run fast but relaxed (shoulders, hands, jaw).", "Full rest between reps so every rep is quick.", "Tall posture and feet landing under the body."],
    evaluate: ["Did every rep look as quick and smooth as the first?", "Did he stay relaxed when running fast?", "Which drill looked best, which needs more practice?", "Any tightness in calves, hamstrings or shins?"],
    stop: ["A pull, sharp pain or tightness in a hamstring or calf.", "Pain in the shin or foot that gets worse with each rep.", "Form clearly falling apart: stop the speed work and finish with an easy jog."],
    byPhase: {
      foundation: "Strides are about 85-90% of top speed, smooth and easy to control. If it feels like all-out sprinting, back off.",
      development: "Accelerations and short hill sprints add sharpness. Keep hill sprints to 8-10 seconds and walk back down.",
      event: "Sharp and relaxed. Fewer, crisper reps. Stop while he is still fast."
    }
  },
  3: {
    developing: "Speed endurance and conditioning.",
    why: "The second lap of the 800 m hurts. This session teaches him to keep a strong, even pace when tired, and to stay relaxed while doing it.",
    focus: ["Even effort across every rep, not a fast first rep.", "Hold form as he gets tired.", "Rest fully; do not add reps or speed."],
    evaluate: ["Compare the first and last rep. Was the last one close to the first?", "Did form hold in the last rep?", "How hard was it (1-10)? Aim for a 7, never all-out.", "How did he feel an hour later and the next morning?"],
    stop: ["Dizziness, feeling faint, or unusual breathlessness.", "Sharp pain or a limp.", "Reps getting more than about 10% slower than the first, or form falling apart: end the hard part and cool down."],
    byPhase: {
      foundation: "Fartlek is playful. The quick parts are about 30 seconds, strong but not all-out, with easy running between.",
      development: "Controlled repeats at about 7 out of 10 effort. If the rest of the session suffers, he started too hard.",
      event: "Practise the feel of 800 m pace with full recovery. The first rep should feel almost too easy; keep every rep close to the same time."
    }
  }
};

// ---------- Run coaching ----------

const sportsRunCoach = {
  easy: {
    howTo: ["Start with a few minutes of walking and leg swings.", "Run at a pace where he can talk in full sentences.", "Finish with 5 minutes easy walking and stretching."],
    watch: ["Tall posture, relaxed shoulders and hands.", "Arms swinging front-to-back, not across the body.", "Light, quiet steps."],
    intensity: "RPE 3-4. Talk test: full sentences with no gasping. He should be able to finish and say he could keep going.",
    tooFast: ["He is breathing hard and answering in short words.", "He starts fast, then walks.", "He looks stressed or tight in the face."],
    tooSlow: ["It is hard to be too slow. If he feels bored, let him stay relaxed and just add a few minutes over time, never speed."],
    mistakes: ["Turning easy runs into races.", "Adding minutes and speed in the same week.", "Skipping water on hot days."],
    ifStruggling: "Walk 1 minute, jog again, or shorten the run by a third. A short, easy run still counts."
  },
  strides: {
    howTo: ["Warm up first with a few minutes of jogging and drills.", "Accelerate smoothly for the first 20-30 m, hold fast and relaxed, then ease off.", "Walk back for complete rest."],
    watch: ["Relaxed face, shoulders, hands.", "Tall posture and quick, light feet.", "Smooth speed, no straining."],
    intensity: "RPE 6-7, about 85-90% of top speed. Fast but easy to control.",
    tooFast: ["Tight face and shoulders, head bobbing.", "Overstriding, feet landing far in front.", "He needs a long time to recover afterward."],
    tooSlow: ["It looks like normal jogging. A little more speed is fine as long as he stays relaxed."],
    mistakes: ["Making strides into all-out sprints.", "Cutting the rest short.", "Doing them on a slippery or uneven surface."],
    ifStruggling: "Drop 1-2 reps, add rest, and keep the speed easy."
  },
  accel: {
    howTo: ["Start from a standing or staggered stance with a slight forward lean.", "Push hard for the first few steps, then gradually stand taller.", "Finish smooth, do not sprint through the end."],
    watch: ["Forward lean at the start, tall posture by 20 m.", "Driving arms, strong pushes off the ground.", "No tripping or stumbling."],
    intensity: "RPE 6-7 building up. Smooth, powerful, not all-out.",
    tooFast: ["Stumbling, collapsing form, tight shoulders."],
    tooSlow: ["No lean and no push at the start. Cue 'push the ground away'."],
    mistakes: ["Standing straight up on the first step.", "Short rest between reps."],
    ifStruggling: "Do fewer reps and keep it smooth."
  },
  hills: {
    howTo: ["Pick a gentle, safe hill with good footing.", "Run uphill hard for 8-10 seconds with a short, quick stride.", "Walk back down; rest at least 1 minute before the next one."],
    watch: ["Slight forward lean, driving knees and arms.", "Staying on the balls of the feet, quick steps.", "Nothing slipping or twisting."],
    intensity: "RPE 7-8 for about 8-10 seconds. Strong, not an all-out grind.",
    tooFast: ["Form falls apart, he slows a lot by the last rep, or calves or hamstrings feel tight."],
    tooSlow: ["It feels like a jog. Cue powerful arms and quick feet."],
    mistakes: ["Steep hills, long hill reps, running downhill fast."],
    ifStruggling: "Stop the set early and jog easy."
  },
  fartlek: {
    howTo: ["Easy running as the base.", "Add the quick parts as told (about 30 seconds each), using trees or lamp-posts as markers.", "Easy running between until breathing settles."],
    watch: ["Quick parts are strong but smooth.", "He relaxes again quickly in the easy parts."],
    intensity: "Quick parts RPE 6-7, easy parts RPE 3-4.",
    tooFast: ["He cannot recover during the easy parts.", "The last quick part is much slower than the first."],
    tooSlow: ["Quick parts look the same as the easy running. Ask for a little more pop."],
    mistakes: ["Turning every surge into a sprint.", "Not easing back down between surges."],
    ifStruggling: "Shorten the surges to 20 seconds and add easy time between."
  },
  tempo: {
    howTo: ["Warm up with easy running first.", "Hold an even, comfortably hard pace for the steady section.", "Cool down with easy jogging."],
    watch: ["Even rhythm.", "Posture and arm swing stay relaxed as it gets harder."],
    intensity: "RPE 6. Short phrases only, not full sentences. It should feel controlled, not a race.",
    tooFast: ["He can barely speak.", "Pace slows markedly in the last part of the steady section."],
    tooSlow: ["He can still talk in full sentences. Pick it up slightly next time."],
    mistakes: ["Starting too fast and fading.", "Doing it on a tired day."],
    ifStruggling: "Shorten the steady section or run it easier."
  },
  repeatsTrack: {
    howTo: ["Warm up well and do a few strides first.", "Run each rep at the planned effort and aim for each to be about the same time.", "Walk or jog the full recovery. Do not start the next rep early."],
    watch: ["Even pace on every rep.", "Relaxed shoulders and arms in the last rep.", "Same form in rep 4 as in rep 1."],
    intensity: "RPE 7 (never all-out). He should feel it, but still be in control.",
    tooFast: ["The last rep is more than about 8-10% slower than the first.", "Form falls apart, or he needs more than the full recovery."],
    tooSlow: ["All reps are within 2-3% of each other and he still says it felt easy (RPE 5-6). A very small step faster next time is fine."],
    mistakes: ["Going out too fast on rep 1.", "Adding reps because he feels good.", "Cutting recovery."],
    ifStruggling: "Stop after the last rep he can do with good form. Do not chase the full set."
  },
  repeatsField: {
    howTo: ["Warm up well and do a few strides first.", "Run each rep for the stated time at a strong, smooth effort.", "Walk back and rest fully. Note the distance each rep covers if you can (phone GPS or landmarks)."],
    watch: ["Each rep covers about the same distance.", "Relaxed shoulders and posture throughout.", "Same form in the last rep as the first."],
    intensity: "RPE 7 (never all-out).",
    tooFast: ["Later reps cover clearly less distance.", "Form falls apart or he cannot recover in the rest."],
    tooSlow: ["Every rep covers the same distance and he says it felt easy. Keep the effort the same and let fitness improve first."],
    mistakes: ["Starting rep 1 too hard.", "Adding reps.", "Running on uneven ground."],
    ifStruggling: "Stop at the last good rep."
  },
  check: {
    howTo: ["Warm up well.", "Run the distance at a steady, strong effort, not all-out.", "Record distance, time and effort."],
    watch: ["Even pace and relaxed form."],
    intensity: "RPE 7, not all-out.",
    tooFast: ["He is gasping or slowing a lot in the second half."],
    tooSlow: ["He finishes fresh and says it felt easy."],
    mistakes: ["Treating it like a race, or doing it when tired or sore."],
    ifStruggling: "Skip it. It is optional and not needed to progress."
  },
  trial: {
    howTo: ["Warm up fully, then run an honest effort only if he wants to and feels fresh."],
    watch: ["Smooth, even first lap."],
    intensity: "Hard but controlled. Beginner training does not require a full-effort test.",
    tooFast: ["A sprint start followed by a big fade."],
    tooSlow: ["N/A"],
    mistakes: ["Testing when tired, sore, ill or in the heat."],
    ifStruggling: "Do not test. Use the pace check or repeat data instead."
  }
};

const sportsStruggleGuide = [
  { q: "He is tired or flat today", a: "Use the easier version: replace the hard running with an easy 10-15 minute jog, keep the drills and mobility, and do one fewer strength set. A lighter day protects the whole week." },
  { q: "He cannot hold the pace", a: "The pace was too fast for today. Add rest, slow the next rep, or stop after the last good rep. Never push through form breakdown." },
  { q: "He has a stitch", a: "Slow to a walk, breathe out slowly and press on the sore spot. Resume jogging only when it passes. Frequent stitches can mean he ate too close to training." },
  { q: "He feels discouraged", a: "Switch the goal from time to effort or form (for example, 'relaxed shoulders') and point out what improved. Keep the session short and finish on something he did well." },
  { q: "It is hot or humid", a: "Shorten the session, run easier, take water breaks and train in shade or at a cooler time. Stop if he is dizzy, nauseated, has a headache, or stops sweating (NFHS heat guidance)." },
  { q: "Something hurts", a: "Dull muscle soreness is normal. Sharp pain, pain in one spot on a bone or shin that gets worse with each run, pain that makes him limp, or pain at night are reasons to stop and see a doctor before running again." }
];

const sportsStopRules = [
  "Stop the session for sharp or worsening pain, a limp, dizziness, fainting, chest pain, unusual shortness of breath, nausea, confusion, or signs of heat illness.",
  "Stop the hard part if form clearly breaks down (hunched, flailing arms, stumbling) or reps slow by more than about 10%.",
  "Do not train hard when he is ill, has a fever, or slept very little. Rest is part of the plan.",
  "Warm up before every session. Lifting is light and supervised by an adult.",
  "Fuel and hydrate: eat regular meals and drink water. Under-eating raises injury risk in young runners.",
  "A doctor visit is the right next step for pain that lasts more than a few days or keeps coming back."
];

// ---------- Rep check (from times the parent enters) ----------

// splits: seconds for each rep. Returns what the numbers show and what to do next. rpe optional (1-10).
function sportsRepCheck(splits, rpe) {
  const times = (splits || []).filter((n) => Number.isFinite(n) && n > 0);
  if (times.length < 2) return { status: "need-more", text: "Enter at least two rep times to compare them." };
  const first = times[0];
  const last = times[times.length - 1];
  const fade = ((last - first) / first) * 100;
  const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
  const spread = ((Math.max(...times) - Math.min(...times)) / avg) * 100;
  const base = { fade: Math.round(fade * 10) / 10, spread: Math.round(spread * 10) / 10 };
  if (fade > 8) return { ...base, status: "too-fast", text: "The last rep was " + base.fade + "% slower than the first. He started too hard. Next time start a little slower so all reps match, or add a rep of rest." };
  if (fade > 4) return { ...base, status: "slightly-fast", text: "The last rep was " + base.fade + "% slower. Close, but aim for more even reps by starting a touch easier." };
  if (fade < -3) return { ...base, status: "cautious", text: "He got faster by " + Math.abs(base.fade) + "%. A cautious start is fine for a beginner. He has room to start slightly stronger as long as the last rep stays smooth." };
  if (spread <= 3 && rpe && rpe <= 6) return { ...base, status: "room", text: "Reps were within " + base.spread + "% of each other and effort was " + rpe + "/10. There is a little room. Next time try about 1 second quicker per 200 m, only if form stays relaxed." };
  return { ...base, status: "right", text: "Reps stayed within " + base.spread + "% and the last rep was close to the first. That is the target. Keep the same pace and let fitness catch up." };
}

// ---------- Readiness check before a workout ----------

// answers: { energy: 1-5, soreness: "none"|"mild"|"sharp", sleep: "good"|"ok"|"poor", illness: boolean }
function sportsReadiness(answers) {
  if (answers.soreness === "sharp" || answers.illness) {
    return { level: "rest", text: "Skip the workout today. Rest, and see a doctor if pain or illness continues. Missing one session does not hurt the plan." };
  }
  const low = (answers.energy <= 2 ? 1 : 0) + (answers.sleep === "poor" ? 1 : 0) + (answers.soreness === "mild" ? 0.5 : 0);
  if (low >= 2) return { level: "easy", text: "Use the easier version today: easy jog, drills and mobility, with one fewer set. The hard work can wait." };
  if (low >= 1) return { level: "careful", text: "Go ahead, but watch the first hard rep. If he looks flat or sluggish, switch to the easier version." };
  return { level: "go", text: "Good to go. Warm up well and keep to the planned effort." };
}

// Easier version of a workout: hard runs become an easy jog, strength drops one set.
function sportsEasyWorkout(workout) {
  const hard = ["strides", "accel", "hills", "fartlek", "repeats", "tempo", "check", "trial"];
  const blocks = [];
  let jogAdded = false;
  workout.blocks.forEach((block) => {
    if (block.kind === "run" && hard.includes(block.runType)) {
      if (!jogAdded) {
        jogAdded = true;
        blocks.push({ ...block, runType: "easy", coachKey: "easy", name: "Easy jog", detail: "10-15 minutes very easy, conversation pace", effort: "RPE 3", minutes: 12, why: sportsWhyEasy });
      }
      return;
    }
    if (block.kind === "exercise" && block.sets > 1 && ["legStrength", "coreStrength"].includes(block.category)) {
      blocks.push({ ...block, sets: block.sets - 1 });
      return;
    }
    blocks.push(block);
  });
  return { ...workout, title: workout.title + " (easier)", focus: "Easier version: protect recovery and keep the habit.", blocks };
}
const sportsWhyEasy = "A gentle jog keeps blood flowing and the routine going without adding stress on a tired day.";

// ---------- Performance signals (only from runs the parent enters) ----------

function sportsPaceOf(run) {
  return run.seconds / run.meters;
}

// Compares the newest runs with earlier similar runs (same type, distance within 20%). Never guesses without data.
function sportsPerformanceSignal(runs) {
  const groups = new Map();
  runs.filter((run) => ["easy", "tempo", "repeats", "check", "trial", "fartlek"].includes(run.type) && run.meters >= 200)
    .sort((a, b) => a.day.localeCompare(b.day))
    .forEach((run) => {
      const key = run.type + ":" + Math.round(Math.log(run.meters) / Math.log(1.2));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(run);
    });
  const notes = [];
  let improving = 0;
  let slipping = 0;
  let steady = 0;
  groups.forEach((list) => {
    if (list.length < 2) return;
    const recent = list.slice(-2);
    const earlier = list.slice(0, -2);
    const prior = earlier.length ? earlier.slice(-2) : list.slice(0, 1);
    const recentPace = recent.reduce((sum, run) => sum + sportsPaceOf(run), 0) / recent.length;
    const priorPace = prior.reduce((sum, run) => sum + sportsPaceOf(run), 0) / prior.length;
    const change = ((recentPace - priorPace) / priorPace) * 100;
    const recentRpe = sportsAverage(recent.map((run) => run.rpe));
    const priorRpe = sportsAverage(prior.map((run) => run.rpe));
    const effortUp = recentRpe !== null && priorRpe !== null && recentRpe - priorRpe >= 1.5;
    const label = sportsRunTypes[list[0].type];
    if (change <= -2 && !effortUp) { improving += 1; notes.push(label + " pace is about " + Math.abs(Math.round(change)) + "% faster at similar effort."); }
    else if (change >= 5 || (change >= 2 && effortUp)) { slipping += 1; notes.push(label + " pace is slower" + (effortUp ? " and feels harder" : "") + ". Check recovery and sleep."); }
    else steady += 1;
  });
  const status = slipping ? "slipping" : improving ? "improving" : steady ? "steady" : "none";
  return { status, notes, groups: groups.size };
}

// ---------- Weekly decision ----------

const sportsOutcomeLabels = { progress: "Progress", continue: "Continue on plan", repeat: "Repeat this week", ease: "Ease back" };

function sportsRecentCheckins(checkins, count) {
  return [...checkins].sort((a, b) => a.day.localeCompare(b.day)).slice(-count);
}

// input: { week, cycle, planned, checkins (this program), runs (this athlete), planPhaseSlotsDone, phaseSlots, atGate }
// Progression needs consistency, healthy fatigue and recovery, comfortable effort AND a performance signal.
// Positive check-ins alone give "continue", never "progress".
function sportsWeekDecision(input) {
  const { week, cycle, planned, checkins, runs } = input;
  const thisWeek = checkins.filter((entry) => entry.week === week && entry.cycle === cycle);
  const done = new Set(thisWeek.map((entry) => entry.slot)).size;
  const recent = sportsRecentCheckins(checkins, 3);
  const fatigue = sportsAverage(recent.map((entry) => entry.fatigue));
  const recovery = sportsAverage(recent.map((entry) => entry.recovery));
  const effort = sportsAverage(recent.map((entry) => entry.rpe));
  const pain = recent.some((entry) => entry.pain) || thisWeek.some((entry) => entry.pain);
  const performance = sportsPerformanceSignal(runs);
  const factors = [];
  const add = (name, status, text) => factors.push({ name, status, text });

  const ratio = planned ? done / planned : 0;
  add("Consistency", ratio >= 1 ? "good" : ratio >= 0.66 ? "ok" : "bad", done + " of " + planned + " workouts checked in this week.");
  if (pain) add("Pain", "bad", "Pain was reported recently.");
  if (fatigue === null) add("Fatigue", "unknown", "No fatigue ratings yet.");
  else add("Fatigue", fatigue >= 4 ? "bad" : fatigue >= 3.2 ? "warn" : fatigue <= 2.5 ? "good" : "ok", "Average fatigue " + (Math.round(fatigue * 10) / 10) + " out of 5 over the last " + recent.length + " check-ins.");
  if (recovery === null) add("Recovery", "unknown", "No recovery ratings yet.");
  else add("Recovery", recovery <= 2 ? "bad" : recovery < 3 ? "warn" : recovery >= 3.5 ? "good" : "ok", "Average recovery " + (Math.round(recovery * 10) / 10) + " out of 5.");
  if (effort === null) add("Effort", "unknown", "No effort ratings yet.");
  else add("Effort", effort >= 8.5 ? "bad" : effort >= 7.6 ? "warn" : effort <= 7 ? "good" : "ok", "Workouts averaged " + (Math.round(effort * 10) / 10) + " out of 10.");
  if (performance.status === "none") add("Performance", "unknown", "No repeat or run data yet to compare. Log distance and time on runs.");
  else add("Performance", performance.status === "slipping" ? "warn" : performance.status === "improving" ? "good" : "ok", performance.notes.length ? performance.notes.join(" ") : "Run paces are steady at similar effort.");

  const bad = factors.filter((factor) => factor.status === "bad" && factor.name !== "Consistency");
  const warn = factors.filter((factor) => factor.status === "warn");
  const reasons = [];
  let outcome;
  if (done === 0) {
    outcome = "repeat";
    reasons.push("No workouts are checked in yet this week. Complete them to get a recommendation.");
  } else if (bad.length) {
    outcome = "ease";
    bad.forEach((factor) => reasons.push(factor.text));
    reasons.push("Repeat the week at about 20% less so he can recover. Pain that continues needs a doctor.");
  } else if (warn.length) {
    outcome = "repeat";
    warn.forEach((factor) => reasons.push(factor.text));
    reasons.push("Repeat this week at the same load so his body can catch up before moving on.");
  } else if (ratio < 0.66) {
    outcome = "repeat";
    reasons.push("Fewer than two workouts were completed. Training only builds with steady repetition, so repeat the week.");
  } else {
    const allGood = ["Consistency", "Fatigue", "Recovery", "Effort"].every((name) => factors.find((factor) => factor.name === name).status === "good")
      && recent.length >= 3;
    if (allGood && performance.status === "improving") {
      outcome = "progress";
      reasons.push("All workouts done, fatigue and recovery are healthy, effort is comfortable and run paces improved at similar effort.");
      reasons.push("Next week can add a small optional step, up to about 10% and within age limits. It is never required; staying at the same load is always fine.");
    } else if (allGood && performance.status === "none") {
      outcome = "continue";
      reasons.push("Everything looks healthy, but there is no run data to show he is getting fitter. Log distance and time so progress can use performance, not just how he feels.");
    } else if (allGood) {
      outcome = "continue";
      reasons.push("Healthy week and steady performance. Staying on plan lets the training sink in before adding more.");
    } else {
      outcome = "continue";
      reasons.push("Training is going fine, but not every signal is strong yet. Keep to the plan without adding load.");
    }
  }

  // Phase gate: stay in the current phase until the last weeks were consistent and healthy.
  let gate = null;
  if (input.atGate && (outcome === "progress" || outcome === "continue")) {
    const need = Math.ceil(input.phaseSlots * 0.75);
    if (input.phaseSlotsDone < need) {
      outcome = "repeat";
      gate = "Phase check: " + input.phaseSlotsDone + " of " + input.phaseSlots + " workouts done in this phase. Aim for at least " + need + " before moving to the next phase.";
      reasons.unshift(gate);
    }
  }
  return {
    outcome, label: sportsOutcomeLabels[outcome], advance: outcome === "progress" || outcome === "continue",
    adjust: outcome === "progress" ? 1 : outcome === "ease" ? -1 : 0, factors, reasons, done, gate
  };
}

// ---------- Insights for the coaching assistant ----------

// data: { runs, checkins, program, planned, strengthLogged (count of workouts with logged strength sets) }
function sportsInsights(data) {
  const { runs, checkins, planned } = data;
  const tells = [];
  const next = [];
  const performance = sportsPerformanceSignal(runs);
  const recent = sportsRecentCheckins(checkins, 4);
  const fatigue = sportsAverage(recent.map((entry) => entry.fatigue));
  const recovery = sportsAverage(recent.map((entry) => entry.recovery));
  const easyRuns = runs.filter((run) => run.type === "easy" && run.meters >= 400);

  if (!checkins.length && !runs.length) {
    tells.push("No data yet. After the first workout, enter how it went and the app can say more.");
    next.push("Do the first workout and check in. Log runs with distance and time.");
    return { tells, next };
  }
  if (performance.status === "none") tells.push("Not enough run data to say whether his running is improving. Compare similar runs by logging distance and time.");
  else tells.push(performance.notes.length ? performance.notes.join(" ") : "His run paces are steady at similar effort so far.");
  if (easyRuns.length >= 2) {
    const first = easyRuns[0];
    const last = easyRuns[easyRuns.length - 1];
    tells.push("Easy runs: " + sportsClock(first.seconds) + " for " + first.meters + " m, then " + sportsClock(last.seconds) + " for " + last.meters + " m. The app only compares times and distances; it cannot see how the run felt beyond the ratings entered.");
  }
  const withSplits = runs.filter((run) => (run.splits || []).length >= 2).slice(-3);
  if (withSplits.length) {
    const fades = withSplits.map((run) => sportsRepCheck(run.splits, run.rpe));
    const avgFade = sportsAverage(fades.map((entry) => entry.fade));
    tells.push("Recent rep sessions: the last rep averaged " + (Math.round(avgFade * 10) / 10) + "% " + (avgFade >= 0 ? "slower" : "faster") + " than the first.");
    if (avgFade > 6) next.push("Pacing: start the first rep a little slower so the last rep matches it.");
  }
  if (fatigue !== null && recovery !== null) tells.push("Recent fatigue " + (Math.round(fatigue * 10) / 10) + "/5 and recovery " + (Math.round(recovery * 10) / 10) + "/5.");
  if (data.strengthLogged !== undefined && planned) {
    tells.push("Strength sets logged in the Log for " + data.strengthLogged + " workouts so far.");
  }

  if (recent.some((entry) => entry.pain)) next.push("Rest and let any pain settle; see a doctor if it continues.");
  if (fatigue !== null && fatigue >= 3.2) next.push("Recovery first: earlier bedtime, regular meals, water, and keep hard days easy.");
  if (recovery !== null && recovery < 3) next.push("He is arriving to workouts not fully recovered. Add an extra rest day or use the easier version.");
  if (performance.status === "slipping") next.push("Pace is slipping at similar effort. Hold the load steady and check sleep, food and growth-spurt soreness.");
  if (!runs.length || easyRuns.length < 2) next.push("Log easy runs with distance and time so aerobic progress can be tracked.");
  if (data.strengthLogged !== undefined && data.strengthLogged < Math.ceil(checkins.length / 2)) next.push("Load strength exercises into the Log so improvements can be tracked.");
  if (!next.length) next.push("Keep building: steady easy running, relaxed speed and clean strength technique.");
  return { tells, next: next.slice(0, 4) };
}

if (typeof module !== "undefined" && module.exports) {
  Object.assign(module.exports, {
    sportsSources, sportsKnowledge, sportsExerciseCoach, sportsSessionCoach, sportsRunCoach, sportsStruggleGuide,
    sportsStopRules, sportsRepCheck, sportsReadiness, sportsEasyWorkout, sportsPerformanceSignal, sportsWeekDecision,
    sportsInsights, sportsOutcomeLabels
  });
}
