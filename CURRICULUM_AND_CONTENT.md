# Curriculum and content plan

## Curriculum structure

The content hierarchy is:

**Domain → Topic → Concept → Skill → Question form → Item/variant**

Example:

**Quantitative → Percentages → Percentage change → Reverse percentage → Word problem → Reviewed item**

This prevents a single broad topic score from hiding specific weaknesses.

## Recommended scope by release

| Release | Topics | Reviewed questions | Purpose |
| --- | ---: | ---: | --- |
| Clickable/technical prototype | 3 | 90 | Prove the full learning loop |
| Student MVP | 12 | About 600 | Run a meaningful cohort pilot |
| Public beta | 24 | About 1,440 | Cover common placement aptitude |
| Mature core | 35+ | 2,600+ | Add breadth, company patterns, and robust mocks |

Quality is more important than reaching these totals quickly.

## Three-topic prototype

1. Percentages.
2. Ratio and proportion.
3. Grammar/error spotting.

These demonstrate numerical explanation, word-problem reasoning, and verbal feedback with manageable content.

## Twelve-topic MVP

### Quantitative aptitude

1. Percentages.
2. Ratio and proportion.
3. Averages and mixtures.
4. Problems on ages.
5. Profit, loss, and discount.
6. Time and work.

### Logical reasoning

7. Number and letter series.
8. Coding and decoding.
9. Syllogisms.

### Verbal ability

10. Grammar fundamentals and error spotting.
11. Sentence correction and contextual fill-in-the-blank.
12. Para jumbles and short reading comprehension.

The final twelve should be adjusted after reviewing the placement patterns relevant to the pilot college.

## Beta expansion

### Quantitative

- Number system, divisibility, LCM/HCF.
- Simple and compound interest.
- Time, speed, and distance.
- Pipes and cisterns.
- Permutation and combination.
- Probability.
- Data interpretation.
- Mensuration and basic geometry.

### Logical

- Directions.
- Blood relations.
- Clocks and calendars.
- Ordering and ranking.
- Seating arrangements.
- Data sufficiency.
- Statement/conclusion and assumptions.
- Visual/non-verbal reasoning.

### Verbal

- Vocabulary in context.
- Synonyms, antonyms, analogies, and one-word substitutions.
- Active/passive voice and reported speech.
- Cloze tests.
- Critical reasoning.
- Longer reading comprehension.

## Difficulty model

| Level | Description | Expected behavior |
| --- | --- | --- |
| D1 Foundation | Direct concept with clean numbers or obvious language signal | Learn method accurately without time pressure |
| D2 Application | Normal word problem or contextual language use | Select and apply the correct method |
| D3 Placement | Distractors, multi-step reasoning, realistic time | Maintain accuracy under test conditions |
| D4 Stretch | Transfer, unusual wording, combined concepts | Demonstrate flexible understanding |

D4 is optional enrichment and must not distort readiness for actual employers.

## Question-bank target per MVP topic

Target approximately 50 reviewed questions:

- 15 Foundation.
- 25 Application.
- 10 Placement/Stretch.

This is a bank size, not a single-session count. Students should not receive more than 15 questions in one topic checkpoint.

Where parameterized variants are used, each template must have:

- a mathematically/linguistically validated generator;
- valid bounds and distractor rules;
- equivalent difficulty checks;
- a complete dynamic solution; and
- collision testing to avoid duplicate answer options or impossible cases.

## Activity and test sizes

| Activity | Typical length | Timer |
| --- | ---: | --- |
| Diagnostic attempt | 1–3 questions per sampled skill | No |
| Concept lesson | 4–6 interactions | No |
| Daily Bloom | 6–10 interactions | No |
| Focus Run | 8–12 questions | Optional |
| Recovery Mission | 3–4 questions plus explanation | No |
| Topic Trial | 10–15 questions | Soft target only |
| Placement Sprint | 8–12 questions | Yes |
| Sectional test | 20–25 questions | Yes |
| Full simulation | Configurable, initially about 60 questions | Yes |

Company simulations must copy the structure and skill distribution only when legally and factually supportable; never claim leaked or exact questions.

## Question record

Every question stores:

- domain, topic, concept, and prerequisite tags;
- prompt and structured media;
- interaction type;
- options/accepted answers;
- correct answer;
- progressive hints;
- step-by-step solution;
- common misconception tags and responses;
- difficulty and expected time;
- source/provenance;
- company/exam relevance tags;
- reviewer and review status;
- version history;
- accessibility text; and
- performance statistics after launch.

## Content-quality workflow

1. Author creates the question and solution.
2. A second person independently solves it.
3. Reviewer checks wording, answer uniqueness, difficulty, misconception tags, and accessibility.
4. Automated tests validate numerical variants and math formatting.
5. Question enters pilot status with limited exposure.
6. Analytics flag unusual error rates, time, skips, or disputes.
7. A human approves, revises, or retires the item.

AI may help draft variants or explanations later, but no generated item is published without human solution and review.

## Content success criteria

- No known ambiguous answer.
- Every wrong option has a plausible reason or is intentionally neutral.
- Every item has an explanation that teaches method, not only arithmetic.
- Difficulty statistics broadly match labels after sufficient attempts.
- At least 80% of pilot users rate explanations helpful.
- Disputed questions are reviewable from inside the product.
