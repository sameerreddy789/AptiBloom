# Product requirements

## User roles

- **Learner:** studies, practises, reviews, and attempts simulations.
- **Content author/reviewer:** creates and validates lessons and questions.
- **Administrator:** manages access, content releases, reports, and moderation.
- **Campus facilitator (later):** assigns cohorts and views aggregated progress with appropriate consent.

## Learner onboarding

- Ask placement timeline, target companies/patterns, confidence, and weekly availability.
- Run a short diagnostic across quant, logical, and verbal areas.
- Explain that the result is a starting estimate, not an intelligence label.
- Create the first seven-day plan with sessions under ten minutes.
- Allow skipping the diagnostic and starting with a chosen topic.

## Learning functions

- Browse a prerequisite-aware topic map.
- Launch the recommended Daily Bloom.
- Learn through interactive steps and short visual explanations.
- Answer MCQ, numeric input, ordering, matching, selection, and short-text interactions.
- Request progressive hints.
- View step-by-step solutions.
- Retry a near-neighbour problem after an error.
- Bookmark or report a question.
- Review scheduled skills.
- Practise a selected topic without a timer.
- See mastery, readiness, accuracy, hint use, and improvement separately.

## Assessment functions

- Topic Trials.
- Timed Placement Sprints.
- Sectional tests.
- Mixed full simulations.
- Mark-for-review and question navigation.
- Realistic timer and section behavior where configured.
- Detailed report by skill, misconception, accuracy, time, and recommended next action.
- Test review that hides answers until submission.

## Game functions

- Skill garden/map with meaningful mastery states.
- Journey levels and one cosmetic currency.
- Earnable themes/avatar/garden items.
- Flexible weekly rhythm.
- Optional small friend squads.
- Cooperative goals and private challenges.
- Ability to disable animation, sound, reminders, and social comparison.

## Content functions

- Versioned question and lesson authoring.
- Structured math, images, diagrams, and accessibility descriptions.
- Preview in every interaction type and screen size.
- Two-person review workflow.
- Item status: draft, review, pilot, published, retired.
- Provenance and copyright fields.
- Dispute queue and analytics flags.

## Admin and analytics

- View cohort funnels without exposing unnecessary personal content.
- Track attempts, first-answer correctness, hints, retries, completion, review success, and test performance.
- Compare learning gains across releases and experiments.
- Monitor question quality and possible answer leakage.
- Export privacy-respecting aggregate reports.
- Support account/data deletion.

## MVP requirements

- Responsive PWA.
- Email or supported social sign-in plus guest preview.
- Three prototype topics with 90 reviewed questions.
- BLOOM lesson/practice loop.
- Rules-based adaptation and spaced review.
- Skill garden and mastery dashboard.
- One mixed assessment.
- Basic content studio or safe seed-data workflow.
- Instrumented learning events.
- Mobile and keyboard accessibility.

## Later requirements

- Twelve-topic student MVP and full content studio.
- Squads, cooperative goals, and private challenges.
- Company-pattern test configurations.
- Campus facilitator dashboard.
- Native app packaging if PWA usage justifies it.
- Multilingual explanations.
- Optional AI tutor or content-assistance tools after the authored system is trustworthy.

## Non-functional requirements

- **Performance:** interaction response feels immediate; core practice works acceptably on normal mobile data.
- **Reliability:** answers and progress are not lost on refresh or brief disconnection.
- **Accessibility:** WCAG-oriented contrast, keyboard use, screen-reader semantics, reduced motion, scalable text, and non-colour status cues.
- **Privacy:** collect only necessary student data; progress is private by default.
- **Security:** server-authoritative scoring, protected admin routes, rate limits, audit logs, and safe content rendering.
- **Content integrity:** version every published question; historical attempts retain the version presented.
- **Explainability:** students can see why a topic is recommended and what affects mastery.
- **Portability:** learners can export progress and delete accounts.

## Acceptance criteria for the first pilot

- A new learner can start a mission in under two minutes.
- At least 80% of pilot sessions finish without usability help.
- Every wrong response in prototype content leads to a valid explanation and retry.
- The app schedules and delivers due reviews correctly.
- Mastery never increases solely from opening pages or earning cosmetic rewards.
- The mixed assessment produces a skill-level report and next action.
- No critical accessibility or answer-correctness issue remains unresolved at launch.
