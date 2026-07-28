# Adaptive engine and learner model

## Principle

The first adaptive system should be a transparent rules engine, not an opaque “AI score.” It recommends the next useful activity from observed performance and explains the recommendation to the learner.

## What the engine tracks

For every skill:

- attempts and unique item forms;
- first-attempt accuracy;
- correctness after hints;
- misconception tags;
- response time compared with item expectation;
- skips and abandoned questions;
- successful near-neighbour retries;
- performance in mixed versus labelled practice;
- spaced-review results;
- last practice time; and
- separate mastery and speed/readiness estimates.

## Cold start

The onboarding diagnostic samples high-value prerequisite skills. The result creates a rough starting estimate with wide uncertainty. The engine should become more confident only after varied attempts.

A student may skip the diagnostic; the engine then begins with Foundation items and adapts quickly.

## Item selection policy

A normal Daily Bloom is approximately:

- 50% current growth skill;
- 20% prerequisite or misconception repair;
- 20% spaced review from older skills; and
- 10% transfer/stretch when appropriate.

These are starting proportions. Never select an item the learner has just seen unless it is an intentional retry with changed values/context.

## Difficulty adaptation

- Correct first attempt without a hint adds strong positive evidence.
- Correct after a hint adds learning evidence but less independent-mastery evidence.
- Wrong followed by successful retry identifies a productive learning event.
- Repeated errors with the same misconception trigger a focused explanation or prerequisite.
- Two or more stable successes at the current level allow a harder form.
- A difficult failure does not immediately collapse the estimated level.
- Response time affects readiness only after acceptable accuracy is present.

Avoid fixed “+10/-10” mastery jumps exposed as scientific precision. Weighting must be calibrated with pilot data.

## Spaced review schedule

Initial review intervals can use:

- same-session transfer;
- about 1 day;
- 3 days;
- 7 days;
- 14 days; and
- 30 days.

Successful independent recall expands the interval. Failure shortens it and schedules a misconception-aware repair. Placement dates may compress the plan, but the app should disclose that a crash schedule provides weaker long-term evidence.

## Interleaving

Blocked practice is used first to understand a method. Mixed practice follows so students learn to recognize which method applies.

Examples:

- Mix percentage change, ratios, and averages in word problems.
- Mix error spotting across agreement, tense, articles, and prepositions.
- Mix syllogisms with statement/conclusion items without announcing the rule.

## Mastery state

Suggested internal states:

1. **Unseen**
2. **Exploring**
3. **Practising**
4. **Stable**
5. **Mastered**
6. **Review due**

Mastered requires variety, recent accuracy, more than one session, and spaced success. It can decay to Review due but should not visually punish the student by destroying their garden.

## Placement readiness

Readiness is separate and includes:

- mastery of required skills;
- timed first-attempt accuracy;
- median time by question type;
- mixed-test performance;
- skip/revisit strategy;
- recent sectional/full simulations; and
- coverage of the selected company pattern.

Show a profile such as “Concepts 82%, Accuracy 78%, Pace 64%, Coverage 71%” rather than one unexplained readiness number.

## Recommendation explanations

Examples:

- “Ratio is recommended because two percentage problems depended on it.”
- “This review is due because you mastered ages seven days ago.”
- “Your accuracy is stable; today’s sprint will train pace.”
- “Return to subject–verb agreement before another mixed grammar test.”

## Preventing exploitation

- Cap mastery evidence from repeated equivalent templates.
- Detect extremely fast answer patterns and exclude them from readiness until verified.
- Randomize values/options without generating ambiguous questions.
- Do not award cosmetic currency for replaying already memorized Foundation items indefinitely.
- Preserve practice access even when evidence is excluded.

## Calibration plan

Start with expert-labelled difficulty and expected time. After sufficient responses:

- examine item accuracy and response-time distributions;
- separate strong/weak learner performance;
- detect items with poor discrimination or abnormal skips;
- compare predicted mastery with later mixed-test performance; and
- adjust rules only with versioned experiments.

The goal is not a fancy model; it is choosing the next activity better than a static topic list.
