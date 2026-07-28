# Technical architecture

## Recommended implementation

Build a mobile-first progressive web app with one TypeScript codebase.

### Suggested stack

- **Frontend/application:** Next.js with TypeScript.
- **Styling:** Tailwind CSS plus a small accessible component system.
- **Database/auth/storage:** Supabase/PostgreSQL with row-level security.
- **Math rendering:** KaTeX.
- **Client data:** TanStack Query; lightweight local state only where needed.
- **Offline/resume support:** service worker plus IndexedDB for the current session.
- **Testing:** Vitest, Testing Library, and Playwright.
- **Deployment:** Vercel or equivalent for the app; managed Supabase for the first pilot.
- **Observability:** first-party learning events and error reporting; optional privacy-configured product analytics.

This stack is popular enough for tutorials and résumés while remaining realistic for two student developers.

## Major components

### Learner app

- Authentication and onboarding.
- Skill garden/topic map.
- Lesson and question player.
- Feedback/solution/retry system.
- Daily Bloom and review queue.
- Assessments and reports.
- Profile, accessibility, and social controls.

### Content system

- Topic/prerequisite editor.
- Lesson block editor.
- Question authoring for each interaction type.
- Formula/variant preview.
- Review and publication workflow.
- Dispute queue and version history.

### Learning engine

- Learner-skill state.
- Question selector.
- Mastery updater.
- Spaced scheduler.
- Misconception repair planner.
- Readiness calculator.
- Human-readable recommendation reason.

### Assessment engine

- Versioned test blueprint.
- Server-issued item sequence.
- Timer and navigation state.
- Submission and scoring.
- Skill/time analysis.
- Review access rules.

### Game/social layer

- Journey level and cosmetic inventory.
- Garden state derived from mastery.
- Weekly rhythm.
- Squad membership and cooperative challenges.
- Notifications and privacy settings.

## Core data model

- User
- LearnerProfile
- Domain
- Topic
- Skill
- Prerequisite
- Lesson
- LessonBlock
- Question
- QuestionVersion
- QuestionOption
- Hint
- SolutionStep
- Misconception
- QuestionMisconception
- Attempt
- LearnerSkillState
- ReviewSchedule
- TestBlueprint
- TestSession
- RewardTransaction
- CosmeticItem
- Squad
- SquadChallenge
- ContentReview
- QuestionReport

QuestionVersion is essential: an old attempt must remain tied to the exact wording and answer shown at that time.

## Attempt event flow

1. Client requests the next activity.
2. Server selects an eligible question and returns the public content.
3. Client records start, hint, answer, and interaction events.
4. Server validates the submitted answer against the question version.
5. Server writes the attempt transactionally.
6. Learning engine updates misconception, mastery, and review state.
7. Client receives feedback, explanation path, reward, and next recommendation reason.

Correct answers and scoring rules must not be exposed in the initial public payload.

## Content representation

Store question bodies as structured safe blocks rather than arbitrary HTML:

- paragraph;
- inline/block math;
- table;
- image/diagram;
- ordered interaction;
- highlighted passage; and
- accessible description.

Sanitize all author content and restrict embeds. This makes responsive rendering and accessibility more reliable.

## Offline behavior

The PWA may cache a signed short practice set and store pending attempt events locally. When connectivity returns, the server validates and reconciles them. Competitive tests and official readiness evidence may require connection to reduce tampering.

## Security baseline

- Row-level policies on learner data.
- Role-based admin/content access.
- Server-side answer evaluation.
- Rate limits and bot protection on auth/attempt routes.
- CSRF/XSS-safe framework defaults and sanitized content.
- Audit logs for question publication and score-affecting changes.
- Encrypted transport and managed secrets.
- Data deletion and export workflow.
- Minimal personal data and private progress by default.

## Testing priorities

- Unit tests for every scoring rule and parameterized generator.
- Golden tests for rendered solutions and math.
- Property tests for generated question validity.
- Integration tests for attempt → feedback → mastery → review.
- End-to-end learner and author workflows.
- Accessibility checks plus manual keyboard/screen-reader testing.
- Load test the next-question and submit-answer paths before a campus event.

## Suggested repository shape

- apps/web — learner and admin UI
- packages/content — schemas and rendering
- packages/learning-engine — selection/mastery/review rules
- packages/ui — design system
- packages/config — shared TypeScript/lint/test settings
- supabase/migrations — schema and policies
- tests/e2e — full workflows
- docs — architecture decisions and content guide

## Avoid in the first version

- Microservices.
- A native mobile rewrite.
- Generative-AI question delivery.
- Real-time global leaderboards.
- Complex machine-learning infrastructure.
- Building twelve topics before the three-topic loop works.
