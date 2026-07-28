# Development roadmap

The plan assumes two student developers working part-time. Dates are estimates; each phase ends with evidence before the scope expands.

## Phase 0 — Discovery and content design

**Duration:** 1–2 weeks

- Interview 10–15 students currently attending aptitude training.
- Collect the relevant college/company test patterns.
- Select three prototype topics.
- Write the skill map, misconception map, and first 30 questions per topic.
- Make low-fidelity flows for onboarding, mission, feedback, and progress.
- Test the game concept and calm visual direction with five students.

**Gate:** Students understand the product difference and prefer the explanation/retry flow to a normal quiz.

## Phase 1 — Technical foundation

**Duration:** 1 week

- Create repository, environments, deployment, auth, database migrations, and test setup.
- Implement design tokens and accessible base components.
- Define content schemas and seed workflow.
- Add automated checks for lint, types, tests, and builds.

**Gate:** Both contributors can run, test, deploy, and explain the project.

## Phase 2 — Complete vertical slice

**Duration:** 2 weeks

- Build one Percentage lesson.
- Add several interaction types.
- Implement answer submission, progressive hints, solution steps, and near-neighbour retry.
- Store attempts and show a basic skill update.
- Complete one polished Daily Bloom session end-to-end.

**Gate:** A real student completes the flow on a phone without developer help.

## Phase 3 — Three-topic prototype

**Duration:** 2 weeks

- Finish 90 reviewed questions across percentages, ratios, and grammar/error spotting.
- Add topic map, Focus Run, and mixed review.
- Implement misconception tags and recovery missions.
- Add content review/status tools.
- Instrument product and learning events.

**Gate:** Content has no unresolved correctness issue and explanations are rated useful by at least 80% of a small test group.

## Phase 4 — Adaptation and spaced review

**Duration:** 1–2 weeks

- Implement learner-skill state and transparent selection rules.
- Add due-review scheduling and recommendation reasons.
- Separate mastery from readiness.
- Add calibration dashboard for developers/content reviewers.

**Gate:** Test fixtures prove the scheduler and mastery rules behave as documented; students understand why activities are recommended.

## Phase 5 — Assessment and calm game layer

**Duration:** 2 weeks

- Build Topic Trial and one mixed timed assessment.
- Add test navigation, timer, marking for review, and report.
- Add skill garden, journey level, petals, and cosmetic unlocks.
- Add weekly rhythm and notification preferences.
- Ensure all game effects can be reduced/disabled.

**Gate:** Game rewards follow learning evidence, and the test mode behaves like a serious assessment.

## Phase 6 — Pilot

**Duration:** 2 weeks

- Recruit 25–50 students.
- Run a baseline test, two weeks of usage, and a delayed/post assessment.
- Observe onboarding and five live sessions.
- Track activation, completion, reviews, learning gain, question disputes, and anxiety/clarity feedback.
- Fix correctness, usability, accessibility, and reliability issues before adding topics.

**Gate:** Evidence shows meaningful learning improvement and repeat use; if not, diagnose the learning loop before scaling content.

## Phase 7 — Twelve-topic MVP

**Duration:** 4–8 weeks, content-heavy

- Expand to approximately 600 reviewed questions.
- Add remaining core interaction types.
- Add private squads and cooperative goals.
- Create two sectional tests and a configurable mixed simulation.
- Improve content studio, analytics, moderation, and progress export.
- Publish a transparent methodology/readiness explanation.

**Gate:** The app supports a complete pilot-college placement-prep plan and the team can maintain content quality.

## Suggested ownership

### Contributor A

- Architecture, database, API, deployment, learning engine, and assessment.

### Contributor B

- UX implementation, design system, content tooling, question authoring workflow, and accessibility.

### Shared

- Content review, user interviews, tests, analytics, documentation, and demos.

Rotate one feature per phase so both contributors learn frontend, backend, testing, and product reasoning rather than becoming permanently separated.

## Portfolio deliverables

- Public product case study.
- Architecture diagram and decision records.
- Documented learning method and competitor analysis.
- Accessible design system.
- Automated test suite.
- Content-quality workflow.
- Pilot methodology and anonymized results.
- Short demo showing an error → explanation → retry → spaced review.

These provide stronger résumé evidence than a large unvalidated question bank.
