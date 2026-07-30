# AptiBloom Gamified Experience — The Lost Atlas

**Status:** Product and experience source of truth
**Version:** 1.0
**Last updated:** 2026-07-30
**Audience:** Product, design, engineering, content, and pilot partners

This document replaces all previous AptiBloom Markdown documentation. It defines the product purpose, learning model, Treasure Hunter-inspired experience, curriculum, progression, interface direction, technical boundaries, delivery plan, and success criteria.

---

## 1. Executive decision

AptiBloom will evolve from a skill-garden metaphor into **The Lost Atlas**, a mature knowledge-expedition experience inspired by Treasure Hunter.

The learner is not a pirate collecting random loot. The learner is an explorer restoring a faded atlas of placement skills. Every topic is a route, every misconception is a false trail, every spaced review is a waypoint revisit, and every verified skill restores a landmark.

The game layer must always cause a useful learning behaviour:

- attempt a meaningful problem;
- understand the method;
- repair a misconception;
- retry with changed values or wording;
- revisit knowledge after a delay;
- apply skills in mixed conditions; or
- prove accuracy under placement pressure.

The real treasure is durable understanding.

### Product name

**AptiBloom** remains the product name.

### Experience name

**AptiBloom: The Lost Atlas**

### Tagline

> Chart every skill. Recover the method. Prove you are ready.

### Product promise

> Open AptiBloom for seven minutes and leave knowing one thing better than before.

---

## 2. Current product snapshot

The current local-first responsive web application includes:

- 1,090 original aptitude questions;
- 90 reviewer-published questions;
- 1,000 automatically validated pilot questions pending human review;
- 12 learning paths across quantitative, logical, and verbal aptitude;
- 390 Easy, 400 Medium, and 300 Tough questions;
- concept lessons for every path;
- adaptive daily, diagnostic, topic, review, and recovery missions;
- progressive hints and worked solutions;
- misconception-specific feedback;
- near-neighbour retries;
- mastery and placement-readiness tracking;
- a 12-path mixed Placement Sprint;
- versioned question delivery and server-side answer evaluation;
- a content studio, progress export, accessibility settings, and account deletion; and
- permanent content and adaptive-flow validation through `npm run check`.

Pilot questions are visible to learners and provide practice feedback, but they do not increase placement-readiness scores until human publication.

### Local development

Requirements:

- Node.js 20 or newer

Commands:

```bash
npm start
npm run check
```

The local application runs at `http://localhost:3000`.

---

## 3. Learner and problem

### Primary learner

Indian college students preparing for campus-placement aptitude filters, especially learners who:

- find aptitude classes boring, dense, or difficult to follow;
- practise questions without understanding why an answer was wrong;
- do not know what to study next;
- feel discouraged by public ranks and speed-first experiences;
- need short sessions around classes and other commitments; and
- must eventually perform accurately under timed placement conditions.

### Emotional contract

AptiBloom should feel:

- calm enough to think;
- alive enough to revisit;
- serious enough to trust;
- private by default;
- clear about why an activity is recommended; and
- honest about the difference between practice, mastery, and readiness.

The experience must never imply that one diagnostic, one wrong answer, or one slow solution measures intelligence.

---

## 4. Narrative

> The Lost Atlas once mapped the skills needed to navigate placements with confidence. Over time, its routes faded and its landmarks were forgotten. Learners restore the atlas by understanding methods, repairing wrong turns, and revisiting knowledge until it holds. When a route remains accurate under placement conditions, its readiness beacon lights.

The narrative is a light framing layer, not a required story campaign. Learners can understand every screen without knowing lore, and Quiet Mode can reduce nonessential narrative copy.

### Narrative rules

- Knowledge—not wealth—is the treasure.
- The learner is an explorer, not a chosen hero.
- Mistakes reveal false trails; they do not damage the character.
- Restoring the atlas requires learning evidence, not page views or taps.
- Formal assessments pause the game presentation.
- Academic topic names remain visible and primary.
- Story copy must remain concise and mature for college students.

---

## 5. World structure

The atlas contains three core regions and one assessment destination.

### 5.1 Quantitative Coast

Six routes:

1. Percentages
2. Ratio and proportion
3. Averages and mixtures
4. Problems on ages
5. Profit, loss, and discount
6. Time and work

Visual language: coastlines, measured routes, market landmarks, workshops, bridges, and calculation instruments.

### 5.2 Logic Wilds

Three routes:

7. Number and letter series
8. Coding and decoding
9. Syllogisms

Visual language: branching trails, patterned stones, cipher markers, observation towers, and deduction gates.

### 5.3 Verbal Archives

Three routes:

10. Grammar fundamentals and error spotting
11. Sentence correction and contextual fill-in-the-blank
12. Para jumbles and short reading comprehension

Visual language: libraries, restored inscriptions, ordered manuscripts, language halls, and archive shelves.

### 5.4 Summit Vault

The Summit Vault frames mixed Placement Sprints and future simulations. The themed entrance explains the purpose, but the assessment itself uses a neutral exam interface.

### Naming rule

Do not replace academic names with obscure fantasy labels. Use the official topic as the title and the atlas location as supporting context.

Example:

> **Percentages**
> Route 01 · Quantitative Coast

---

## 6. Learning model: the BLOOM expedition

The existing BLOOM loop remains the instructional foundation.

### B — Begin with a low-stakes attempt

Start with one approachable problem before explanation. This reveals prior knowledge and creates curiosity. No speed reward is awarded.

**Atlas framing:** Survey the route.

### L — Learn through a short visual model

Use a diagram, table, highlighted sentence, number line, or compact step animation to build one idea.

**Atlas framing:** Open the Field Guide.

### O — Own the method

The learner completes steps, selects an operation, estimates, orders information, or manipulates the method instead of tapping through passive content.

**Atlas framing:** Chart the route.

### O — Overcome the misconception

A wrong answer identifies the exact false trail, reveals progressive guidance, and provides a near-neighbour retry.

**Atlas framing:** Repair the route.

### M — Mix and revisit

Previously learned skills return after increasing intervals and appear without obvious method labels.

**Atlas framing:** Revisit the waypoint.

### Prove under placement conditions

Timed mixed practice begins after sufficient untimed accuracy. Mastery and readiness remain separate.

**Atlas framing:** Light the readiness beacon.

---

## 7. Core session loop

1. **Arrive at the Expedition Board.** See one recommended action and why it matters.
2. **Review the route briefing.** See the target, expected duration, and session composition.
3. **Open the Field Guide.** Learn one method without a timer.
4. **Solve trail encounters.** Work through accessible question interactions.
5. **Use Compass Hints when needed.** Reveal only the smallest productive next step.
6. **Repair false trails.** Receive precise misconception feedback and a changed retry.
7. **Revisit a waypoint.** Retrieve an older skill selected by spacing rules.
8. **Close the Expedition Log.** See evidence, route restoration, and one next recommendation.
9. **Stop deliberately.** Continuing is optional; endless autoplay is excluded.

A standard session lasts 5–8 minutes and contains 6–10 meaningful interactions. The current Daily Expedition contains eight questions.

---

## 8. Experience terminology

| Existing product concept | Lost Atlas experience | Required plain-language safeguard |
| --- | --- | --- |
| Today | Expedition Board | Show why the recommendation was selected |
| Skill garden | Explorer Atlas | Keep mastery and readiness values visible |
| Daily Bloom | Daily Expedition | Keep the 5–8 minute promise |
| Concept Lab | Field Guide | No timer while learning |
| Focus Run | Focus Trail | Identify the academic topic clearly |
| Recovery Mission | Route Repair | Explain the exact misconception |
| Due review | Waypoint Revisit | Explain why the review is due |
| Hint | Compass Hint | Progressive guidance only |
| Misconception | False Trail | Always include the academic explanation |
| Near-neighbour retry | Alternate Route | Change values or context |
| Worked solution | Route Walkthrough | Reveal step by step |
| Mission summary | Expedition Log | Show evidence, not only rewards |
| Journey level | Explorer Rank | Never present it as skill mastery |
| Petals | Petals | One cosmetic currency only |
| Topic mastery | Mastery | Keep the label explicit |
| Placement readiness | Placement Readiness | Keep the label explicit |
| Placement Sprint | Summit Vault entrance / Placement Sprint | Keep the test UI neutral |
| Pilot question | Pilot question · review pending | Never hide content status |
| Published question | Reviewer-published | Preserve trust and provenance |

---

## 9. Adaptive expedition design

### 9.1 Daily Expedition

The recommendation engine selects a useful route using:

- current weakest mastery;
- recent misconception frequency;
- due spaced reviews;
- prior item exposure;
- target difficulty; and
- domain balance.

The intended composition remains approximately:

- 50% current growth;
- 20% misconception repair;
- 20% spaced review; and
- 10% transfer or mixed practice.

Current safeguards:

- eight questions per Daily Expedition;
- all three domains represented;
- no more than four questions from one topic; and
- pilot content may support practice but not readiness.

### 9.2 Review Expedition

A review mission contains six questions, spans all three domains, and includes no more than two questions from one topic, even when only one topic is overdue.

### 9.3 Difficulty

| Internal level | Learner label | Intended experience |
| --- | --- | --- |
| D1 | Easy | Direct method with clean signals |
| D2 | Medium | Normal application or contextual use |
| D3 | Tough | Multi-step or placement-style distractors |
| D4 | Stretch, future | Transfer and combined concepts |

Difficulty adapts gradually. Repeated errors trigger prerequisite explanation and route repair, not unrelated easy questions.

### 9.4 Recommendation transparency

Every recommendation must include a human-readable reason, such as:

- “Percentages is recommended because it has the most room to grow.”
- “A Ratio waypoint is due; a short revisit now will strengthen recall.”
- “This Focus Trail targets a recurring base-value misconception.”

---

## 10. Progression

### 10.1 Explorer Rank

Explorer Rank represents broad product progression and meaningful participation. It is not evidence of skill.

Suggested rank sequence:

1. New Explorer
2. Pathfinder
3. Trail Scholar
4. Knowledge Cartographer
5. Master Navigator
6. Grand Wayfinder

Ranks may unlock cosmetics, titles, and presentation options only.

### 10.2 Atlas route states

| Academic state | Atlas state | Visual response |
| --- | --- | --- |
| Unseen | Uncharted | Landmark remains softly obscured |
| Exploring | Route discovered | Fog clears and route appears |
| Practising | Charting | Trail details fill progressively |
| Stable | Mapped | Landmark becomes complete |
| Mastered | Restored | Landmark gains its full illustration and seal |
| Review due | Waypoint revisit due | Calm waypoint marker appears |
| Placement ready | Readiness beacon lit | Distinct beacon appears after valid timed evidence |

The interface should show both layers, for example:

> **Route mapped**
> Stable · 68% mastery

### 10.3 Mastery

Mastery reflects untimed understanding and is influenced by:

- correct first attempts;
- varied question forms;
- successful misconception repair;
- performance across more than one session;
- spaced retrieval;
- mixed and transfer questions; and
- adequate evidence volume.

Opening pages, earning cosmetics, or tapping quickly cannot create mastery.

### 10.4 Placement readiness

Readiness reflects accurate performance under realistic placement conditions. It is separate from mastery and requires reviewer-published timed evidence.

Pilot questions never increase readiness.

Low readiness means “not enough valid timed evidence,” not “low ability.”

---

## 11. Economy and rewards

### 11.1 One spendable currency

**Petals remain the only spendable cosmetic currency.**

The atlas regains life as knowledge is restored, preserving the AptiBloom identity inside the exploration theme.

Petals may be earned for:

- independent correct work;
- completing a retry after an error;
- returning for a scheduled review;
- improving a personal best;
- completing a balanced weekly plan; and
- contributing to a future cooperative goal.

Petals may unlock:

- compass designs;
- atlas borders;
- trail-marker styles;
- base-camp banners;
- avatar clothing;
- profile titles; and
- colour themes.

Petals can never purchase answers, easier questions, mastery, readiness, or access to explanations.

### 11.2 Atlas Seals

Atlas Seals are non-spendable achievement evidence. They are not a second currency.

Examples:

- First Route Restored
- False-Trail Repairer
- Recall Keeper
- Three-Region Explorer
- Twelve-Path Cartographer
- Placement Pathfinder

### 11.3 Expedition caches

A deterministic expedition cache may acknowledge a route or weekly milestone. Its contents must be visible before completion.

Example:

> Complete three Waypoint Revisits this week to earn the Sage Compass frame.

There are no random drops, paid keys, duplicate-item rolls, or slot-machine reveals.

---

## 12. Weekly rhythm

AptiBloom uses a flexible weekly rhythm rather than a fragile daily streak.

A typical week may include:

- three or four Daily Expeditions;
- one optional Focus Trail;
- due Waypoint Revisits;
- one optional Placement Sprint; and
- one deterministic cosmetic milestone.

Missing a day never damages the atlas or removes progress.

Preferred message:

> Your expedition is still here. Two useful routes remain this week.

Forbidden message:

> You lost your streak.

---

## 13. Learning and assessment modes

### Starting Check

A calm six-topic diagnostic spanning all three domains. It estimates a useful first route and is never described as an intelligence score.

### Daily Expedition

The default short adaptive session combining growth, repair, review, and transfer.

### Field Guide

A visual, untimed explanation of one method.

### Focus Trail

Untimed topic practice with adaptive difficulty and optional hints.

### Route Repair

A misconception-specific micro-lesson, near-neighbour practice, and transfer item.

### Region Checkpoint, future

A 10–15 item untimed mixed topic check. It can support durable mastery but does not certify speed.

### Placement Sprint

A short timed mixed assessment. The current blueprint samples one Medium or Tough item from every one of the 12 paths.

### Placement Simulation, future

A longer company-pattern or sectional test using only legally and factually supportable structures.

---

## 14. Placement Sprint experience

The theme stops at the assessment entrance.

### Before the sprint

The Summit Vault framing may explain:

- 12 questions;
- 12 minutes;
- one sample from every path;
- three represented domains;
- hidden topic labels; and
- pilot-readiness policy.

### During the sprint

Use a serious, neutral test interface with:

- persistent timer;
- normal numbering;
- question palette;
- mark for review;
- previous/next controls;
- hidden answers and explanations; and
- no game rewards or narrative interruptions.

### After the sprint

Return to the atlas and show:

- total accuracy;
- domain signals;
- explicitly labelled single-item topic samples;
- worked solutions;
- mastery and readiness separately;
- pilot versus published evidence; and
- one recommended next action.

A single sampled item must never be presented as a stable topic score.

---

## 15. Screen specifications

### 15.1 Welcome

Purpose: communicate the placement-learning difference before the game layer.

Recommended hero:

> **Chart skills that hold up under pressure.**
> Seven-minute expeditions teach the method, repair wrong turns, and build placement pace only when you are ready.

Proof points:

- 5–8 minute expeditions;
- private progress;
- misconception repair;
- reviewer and pilot transparency; and
- no lives, loot boxes, or streak guilt.

### 15.2 Expedition Board

The authenticated home should contain:

- greeting and one recommended route;
- expected duration;
- route composition;
- Explorer Rank;
- petal balance;
- mastery, readiness, recent accuracy, and due reviews;
- compact Explorer Atlas preview;
- weekly expedition rhythm; and
- next waypoint revisit.

### 15.3 Explorer Atlas

Desktop: a connected three-region atlas with 12 interactive landmarks.
Mobile: an ordered region-and-route card experience that preserves all information without horizontal scrolling.

Every route must show:

- academic topic name;
- domain;
- question count;
- Easy/Medium/Tough coverage;
- route state;
- mastery;
- readiness;
- review status;
- pilot status where applicable; and
- one clear action.

### 15.4 Active Trail

The mission player includes:

- route goal;
- Field Guide;
- question prompt and accessible answer control;
- difficulty and content status;
- Compass Hints;
- false-trail feedback;
- progressive Route Walkthrough;
- Alternate Route retry;
- progress that communicates position, not urgency; and
- save-and-leave support.

### 15.5 Expedition Log

The session summary includes:

- first-answer accuracy;
- repairs completed;
- petals earned;
- strongest learning signal;
- changed route state;
- next recommendation; and
- an explicit message that stopping is valid.

Recommended copy:

> **Route restored.**
> You recovered one useful method. Stopping here is a complete session.

### 15.6 Explorer Journal

The progress screen preserves evidence clarity:

- overall mastery and its evidence denominator;
- placement readiness from published timed evidence;
- recent first-attempt accuracy;
- topic detail;
- due waypoints;
- misconception repair queue;
- Explorer Rank;
- Atlas Seals; and
- exportable learning data.

### 15.7 Base Camp, future

The profile and cosmetics area may contain:

- avatar;
- explorer title;
- compass and atlas cosmetics;
- collected seals;
- weekly history;
- accessibility controls; and
- privacy settings.

---

## 16. Visual system

### Style

A premium illustrated atlas with subtle botanical restoration. It must not resemble a cartoon pirate game.

### Colour direction

- warm parchment or soft cream surfaces;
- deep ink navy for primary text;
- atlas teal for exploration and active routes;
- muted gold for verified milestones;
- coral for repair and attention;
- sage for restored knowledge; and
- accessible high-contrast neutrals.

Exact tokens should be calibrated against the current light and dark themes.

### Visual motifs

Use:

- contour lines;
- route paths;
- landmarks;
- compass geometry;
- map folds;
- waypoint markers;
- archive illustrations;
- coast and forest silhouettes; and
- subtle blooming restoration.

Avoid:

- pirate skulls;
- weapon imagery;
- piles of coins;
- cartoon treasure hunters;
- excessive parchment texture;
- decorative maps that reduce readability; and
- emojis as interface icons.

Use one consistent SVG icon set with fixed sizing.

### Motion

Reserve motion for:

- revealing a route;
- restoring a landmark;
- completing an expedition;
- earning a visible seal; and
- lighting a readiness beacon.

Do not animate every answer. Respect `prefers-reduced-motion` and the in-product Reduce Motion setting.

### Interaction quality

- All interactive controls require visible hover and focus states.
- Clickable cards use pointer cursors.
- Hover effects must not shift layout.
- Transitions should generally remain between 150 and 300 ms.
- Light and dark themes must meet contrast requirements.
- Layouts must work at 375, 768, 1024, and 1440 px without horizontal scrolling.

---

## 17. Feedback and failure

A wrong answer is a useful route signal.

Feedback order:

1. outcome;
2. location of the mistake;
3. reason;
4. smallest useful hint;
5. progressive worked method;
6. changed near-neighbour retry; and
7. later spaced retrieval.

Recommended copy:

> **This route needs one repair.**
> Let’s check the step where the method changed direction.

Retry success:

> **Alternate route secured.**
> You rebuilt the method instead of memorising the answer.

The learner never loses lives, access, currency, or visible progress because of a wrong answer.

---

## 18. Social experience, future

Social play is optional, private, and cooperative by default.

### Explorer Crews

Three to six friends may form a Base Camp and contribute to goals such as:

- complete 30 due Waypoint Revisits;
- repair five recurring misconceptions;
- restore one route in each region; or
- complete a balanced learning week.

### Social safeguards

- No lowest-performer display.
- No forced contact invitations.
- No public global leaderboard in the MVP.
- Learners can hide all social comparison without losing product access.
- Ability-banded challenges rank accuracy before speed.
- Raw question volume is not a primary competition measure.

---

## 19. Content and trust

### Content hierarchy

**Domain → Topic → Concept → Skill → Question form → Versioned item**

### Required question data

Every item should include:

- domain and topic;
- concept and prerequisite tags;
- prompt and interaction type;
- options or accepted answers;
- correct answer;
- progressive hints;
- worked solution;
- misconception tag and response;
- difficulty and expected time;
- provenance;
- reviewer and status;
- version;
- accessibility text; and
- performance statistics when available.

### Publication workflow

1. Author creates the item and solution.
2. A second person independently solves it.
3. Reviewer checks wording, uniqueness, difficulty, accessibility, and misconception logic.
4. Automated checks validate structure and answer behaviour.
5. Item enters limited pilot status.
6. Analytics and learner reports identify anomalies.
7. A human approves, revises, or retires the item.

Generated content is never presented as human-reviewed until it has completed human review.

### Copyright boundary

Use public syllabus patterns to understand topic coverage, but do not copy proprietary question wording, explanations, visual designs, or question-bank content.

---

## 20. Accessibility, privacy, and safety

- Keyboard navigation must cover every learner flow.
- Focus indicators must remain visible.
- Form inputs require labels.
- Images and meaningful illustrations require alternative text.
- Colour cannot be the only state indicator.
- All answer controls require accessible names and states.
- Reduced Motion and Quiet Mode must preserve every feature.
- Progress is private by default.
- Personal data is minimal, exportable, and removable.
- Correct answers remain server-side until feedback is allowed.
- Saved attempts remain tied to the exact delivered question version.
- Formal readiness evidence may require a connected session.
- Content reports must enter a review queue with item version information.

---

## 21. Technical mapping

The current implementation is a dependency-light Node.js ES module application with a responsive PWA frontend.

### Current modules

| Area | Primary files |
| --- | --- |
| HTTP/API/static server | `server.js` |
| Topic catalogue | `server/catalog.js` |
| Original generated question bank | `server/question-generators.js` |
| Published and pilot question integration | `server/questions.js` |
| Adaptive selection, mastery, readiness, lessons | `server/learning.js` |
| Local persistence and migrations | `server/store.js` |
| Permanent content/adaptive validation | `server/validate-content.js` |
| Learner application | `public/js/app.js` |
| API client | `public/js/api.js` |
| SVG icon system | `public/js/icons.js` |
| Visual system | `public/styles.css` |
| Local data | `data/aptibloom.json` |

### Implementation principles

- Atlas visuals derive from existing mastery and readiness; do not create a second conflicting progress model.
- Explorer Rank derives from journey progression.
- Route state derives from learner topic state.
- Readiness beacons derive only from valid readiness evidence.
- Petals remain the existing cosmetic balance.
- Question delivery and scoring remain versioned and server-authoritative.
- New inventory and achievement state must be additive and migratable.
- The neutral assessment player remains separate from themed learning screens.

### Likely future data

- Achievement definitions and earned achievements
- Cosmetic item catalogue
- Owned cosmetic items
- Equipped atlas, compass, avatar, and banner choices
- Deterministic reward transactions
- Explorer Crew membership and cooperative goal progress

Do not store visual atlas completion separately when it can be derived from mastery state.

---

## 22. Measurement

### North-star learning outcome

**Skills newly mastered and still recalled after a delay.**

### Product measures

- onboarding completion;
- first Expedition completion;
- first-week return rate;
- weekly rhythm completion;
- due-review completion;
- false-trail retry completion;
- Focus Trail completion;
- Placement Sprint completion;
- learner understanding of recommendation reasons; and
- content-report resolution time.

### Learning measures

- first-attempt accuracy change;
- delayed retrieval accuracy;
- mastery stability;
- misconception recurrence;
- transfer-item performance;
- published timed accuracy;
- median response time after accuracy stabilises; and
- pre/post pilot learning gain.

### Guardrail measures

- abandonment immediately after errors;
- anxiety or shame feedback;
- unusually long sessions;
- repeated easy-item farming;
- notification complaints;
- accessibility failures;
- social-comparison opt-outs;
- disputed question rate; and
- pilot items with anomalous error or timing patterns.

Do not use chest opens, taps, time-on-page, or raw question volume as the primary success measure.

---

## 23. Delivery plan

### Phase 1 — Atlas foundation

Goal: create the exploration identity using existing learning data and APIs.

- Replace the garden home with the Expedition Board and Explorer Atlas.
- Introduce three regions and 12 route landmarks.
- Map current topic states to atlas states.
- Add Explorer Rank labels derived from Journey Level.
- Update welcome, mission intro, feedback, retry, and summary copy.
- Preserve the existing question player and Placement Sprint structure.
- Add responsive map/card behaviour and reduced-motion alternatives.

**Gate:** Learners understand what to do next, can identify their academic topic, and describe the experience as motivating without calling it childish.

### Phase 2 — Meaningful rewards

- Add Atlas Seals.
- Add Base Camp profile.
- Add cosmetic inventory and equipped items.
- Add deterministic expedition caches.
- Improve region-completion presentation.
- Add a weekly expedition-plan view.

**Gate:** Rewards correlate with useful learning behaviour, and no learner confuses cosmetics with mastery.

### Phase 3 — Deeper progression

- Add Region Checkpoints.
- Add richer landmark restoration.
- Add expanded curriculum regions.
- Add personal-best Placement Sprint records.
- Add seasonal expeditions using existing academic content.
- Improve content analytics and human review throughput.

**Gate:** Progression improves return and delayed recall without increasing anxiety or easy-item farming.

### Phase 4 — Cooperative exploration

- Add private Explorer Crews.
- Add cooperative review and repair goals.
- Add shared region-restoration milestones.
- Add optional ability-banded challenges.

**Gate:** Cooperative play increases useful learning actions without exposing or shaming weaker learners.

### Phase 5 — Campus pilot and scale

- Interview and test with the target college cohort.
- Run baseline, usage, post-test, and delayed-recall measurement.
- Calibrate mastery and readiness thresholds.
- Human-review pilot questions before broader readiness use.
- Add college-relevant company-pattern simulations where legally supportable.
- Publish a transparent methodology and pilot report.

**Gate:** Evidence demonstrates meaningful learning improvement and repeat use before content breadth or social complexity expands.

---

## 24. Acceptance criteria

The Lost Atlas direction is successful only when all of the following hold.

### Learning integrity

- Every game mechanic promotes attempting, understanding, repairing, revisiting, or applying.
- Mastery and readiness remain separate.
- Pilot items do not increase readiness.
- Wrong answers produce specific feedback and a useful retry.
- Formal assessment remains neutral and interruption-free.

### Experience clarity

- Learners can identify the academic topic on every route.
- The next recommended action includes a reason.
- Route state never replaces the numeric evidence view.
- The product remains usable with narrative reduced.
- A complete short session has a deliberate stopping point.

### Reward integrity

- Petals are the only spendable currency.
- Rewards are deterministic and disclosed.
- Cosmetics never affect scoring, difficulty, mastery, or readiness.
- No reward is granted for idle time or random tapping.

### Trust

- Pilot and reviewer-published content remain visibly distinct.
- Correct answers are not leaked before submission.
- Question versions remain compatible with saved sessions.
- Data export and deletion continue to work.

### Accessibility and responsiveness

- Keyboard and visible-focus flows work end to end.
- Contrast meets WCAG expectations.
- Reduced Motion preserves information and controls.
- Mobile layouts work at 375 px without horizontal scrolling.
- Desktop layouts remain coherent at 1440 px.
- SVG iconography is consistent; emojis are not used as interface icons.

### Validation

- `npm run check` passes.
- Changed files have no editor diagnostics.
- Live smoke tests cover onboarding/session creation, missions, hints, retries, completion, assessment, privacy, persistence, and cleanup.

---

## 25. Explicit anti-patterns

Do not build:

- random treasure chests;
- multiple spendable currencies;
- energy or fuel restrictions;
- lives lost after errors;
- punitive streak resets;
- fake urgency;
- public global rankings;
- speed competition during concept learning;
- pay-to-unlock explanations or repairs;
- rewards for repeating memorised easy items;
- confetti after every answer;
- endless autoplay;
- heavy lore inside questions;
- childish pirate visuals;
- mastery based on XP;
- readiness based on pilot content; or
- generative question publication without human review.

---

## 26. Locked decisions and remaining research

### Locked

- Treasure Hunter evolves into a mature atlas-expedition metaphor.
- AptiBloom remains the brand.
- The Lost Atlas is the experience name.
- Three regions represent quantitative, logical, and verbal aptitude.
- Academic names remain primary.
- Petals remain the only spendable cosmetic currency.
- Atlas Seals are achievements, not currency.
- Weekly rhythm replaces daily streak pressure.
- Progress is private by default.
- The Placement Sprint remains neutral during testing.
- Pilot content remains excluded from readiness.

### Validate with learners

- Final names for the three regions
- Preferred avatar style or whether avatars should remain optional
- Desired amount of narrative copy
- Most motivating deterministic cosmetics
- Whether the atlas is clearer than a standard topic list on mobile
- First pilot cohort and college-placement patterns
- Which company-pattern simulation should be prioritised
- Whether private Explorer Crews belong in the first public release

---

## 27. Final experience thesis

> AptiBloom is a living atlas of placement skills. Learners chart routes through quantitative, logical, and verbal aptitude; repair false trails when they make mistakes; revisit waypoints through spaced practice; and light readiness beacons only after knowledge holds under placement conditions.

The first implementation priority is the **Expedition Board, Explorer Atlas, and Expedition Log**. Together they create the Treasure Hunter feeling while preserving the current adaptive engine, calm learning loop, transparent evidence model, and trustworthy Placement Sprint.
