# Idea 2: AptiBloom

> Working title only; no trademark or domain check has been completed.

**Concept:** A calm, game-like learning app that helps college students master the quantitative, logical, and verbal aptitude skills used in campus placement rounds.

**Idea recorded:** 2026-07-28

## Current local build

The working site now exposes **1,090 original questions across 12 paths**: 90 reviewer-published seed questions and 1,000 automatically validated pilot questions pending human review. The combined difficulty mix is 390 Easy, 400 Medium, and 300 Tough. Pilot questions are labelled in learner flows and do not increase placement-readiness scores until publication.

Run `npm run check` to validate syntax plus question counts, topic coverage, unique IDs and prompts, option quality, canonical answers, learner-safe payloads, lesson coverage, balanced mission selection, and pilot-readiness policy.

## The problem

Aptitude is often the first filter in campus placements, but classes and existing preparation sites can feel like long lectures, crowded question banks, or stressful mock tests. Students may practise without understanding why an answer is wrong, whether they are improving, or what they should study next.

The opportunity is not simply to add points to multiple-choice questions. It is to turn placement preparation into short, understandable, repeatable learning sessions that feel visually calm and personally achievable.

## Product promise

Open AptiBloom for seven minutes and leave knowing one thing better than before.

The app should:

- teach the concept before demanding speed;
- provide real placement-style questions rather than trivia;
- explain each mistake step by step;
- adapt topic and difficulty to the learner;
- revisit weak skills through spaced and mixed practice;
- make progress visible without shaming slower learners; and
- introduce timed placement pressure only after basic mastery.

## Core learning loop

1. Choose a recommended daily mission or a specific topic.
2. Try one low-stakes diagnostic problem.
3. Receive a short visual explanation or worked example.
4. Solve several nearby problems with progressively less help.
5. Correct a misconception immediately and retry a similar problem.
6. Review one or two older skills selected by the spaced-review system.
7. Finish with a mastery update, not merely XP.

A typical mission lasts 5–8 minutes and contains 6–10 meaningful interactions.

## Game identity

Each aptitude topic is represented as part of a growing “skill garden.” Understanding and durable recall grow the garden; merely opening the app or tapping quickly does not.

Game elements include:

- a visual topic map;
- mastery levels and gentle milestones;
- cosmetic garden/avatar rewards;
- short missions and topic challenges;
- optional friend squads and cooperative weekly goals;
- boss-style topic checkpoints; and
- placement simulations that unlock after preparation.

There are no loot boxes, forced public rankings, punitive lives, or streak loss designed to create guilt. Speed leaderboards are optional and separated from learning mode.

## Initial curriculum

- **Quantitative aptitude:** percentages, ratio and proportion, averages, ages, profit/loss, time and work, time/speed/distance, number systems, interest, mixtures, probability, and data interpretation.
- **Logical reasoning:** series, coding-decoding, directions, blood relations, syllogisms, arrangements, ranking, and data sufficiency.
- **Verbal ability:** grammar, error spotting, sentence correction, vocabulary in context, fill-in-the-blanks, para jumbles, reading comprehension, and verbal reasoning.

The original prototype scope covered three topics deeply. The current local build expands that foundation to twelve paths and 1,090 questions while keeping the 1,000 generated additions clearly marked as pilot content pending human review.

## Honest assessment

The category already exists. IndiaBIX, GeeksforGeeks, PrepInsta, Aptitude-Test.com, and LearnTheta provide aptitude practice, explanations, mocks, or company-specific preparation. LearnTheta is especially close because it advertises adaptive difficulty and topic progress.

The opportunity remains good if AptiBloom differentiates through the learning experience: interactive explanations, misconception-driven retries, calm habit design, placement-specific mastery, and meaningful cooperative play. A large question bank or generic gamification alone will not be defensible.

## MVP form

Build a mobile-first responsive web app/PWA. It works on laptops and phones, is easy to share with classmates, avoids app-store delays, and gives both student developers a practical full-stack portfolio project.

The first release includes:

- student sign-in and onboarding diagnostic;
- twelve learning paths across quantitative, logical, and verbal aptitude;
- short concept lessons;
- adaptive practice;
- detailed solutions and near-neighbour retry;
- mastery dashboard and skill garden;
- one mixed test;
- basic content-admin tools; and
- learning analytics.

## Project documents

- [CONVERSATION_REQUIREMENTS.md](./CONVERSATION_REQUIREMENTS.md) — requirements extracted from the original discussion.
- [COMPETITOR_RESEARCH.md](./COMPETITOR_RESEARCH.md) — existing platforms, lessons, and market gap.
- [LEARNING_DESIGN.md](./LEARNING_DESIGN.md) — evidence-based method behind the experience.
- [GAME_DESIGN.md](./GAME_DESIGN.md) — progression, modes, rewards, and social play.
- [CURRICULUM_AND_CONTENT.md](./CURRICULUM_AND_CONTENT.md) — topics, difficulty, question counts, and test structure.
- [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md) — functional and non-functional requirements.
- [UX_DIRECTION.md](./UX_DIRECTION.md) — calm Gen-Z visual and interaction direction.
- [ADAPTIVE_ENGINE.md](./ADAPTIVE_ENGINE.md) — learner model, scheduling, and mastery rules.
- [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) — recommended implementation.
- [ROADMAP.md](./ROADMAP.md) — staged delivery plan.
- [BUSINESS_AND_METRICS.md](./BUSINESS_AND_METRICS.md) — validation, pricing hypothesis, and success metrics.
- [OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md) — choices still needed from the creators.
