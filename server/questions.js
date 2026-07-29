import { createHash } from 'node:crypto';
import { TOPIC_CATALOG, difficultyLabel } from './catalog.js';
import { GENERATED_QUESTIONS } from './question-generators.js';

const CONTENT_VERSION = '2026.08.1';
const MCQ_OPTION_ORDER_VERSION = 'aptibloom-mcq-options-v2-4263';
const optionIds = ['a', 'b', 'c', 'd', 'e'];

const misconceptionLibrary = {
  'percent-of': {
    title: 'The whole and the rate were mixed up',
    copy: 'Treat the original amount as 100%. Convert the rate to a decimal, then multiply by the whole.'
  },
  'reverse-percent': {
    title: 'The final value was treated as the whole',
    copy: 'When a value is after a change, divide by the remaining or increased rate to recover the original 100%.'
  },
  'percent-change': {
    title: 'The change needs the original as its base',
    copy: 'Find new minus original, then divide that change by the original value—not the new value.'
  },
  'successive-change': {
    title: 'Successive rates cannot simply be added',
    copy: 'Each change acts on a new base. Apply the multipliers one after another.'
  },
  'percentage-comparison': {
    title: 'The comparison base changed',
    copy: '“More than” and “less than” use different reference values. Write both quantities before choosing the denominator.'
  },
  concentration: {
    title: 'Only one part of the mixture changed',
    copy: 'Track the amount of the pure ingredient separately from the new total mixture.'
  },
  simplifying: {
    title: 'A ratio must scale both terms equally',
    copy: 'Divide both terms by their greatest common factor. Adding or subtracting the same number changes the ratio.'
  },
  proportion: {
    title: 'The corresponding terms were crossed',
    copy: 'Keep like quantities in matching positions, then use equal products to solve the missing value.'
  },
  sharing: {
    title: 'The total number of parts was missed',
    copy: 'Add the ratio terms first, find the value of one part, then multiply by the required share.'
  },
  'combined-ratios': {
    title: 'The shared middle term must match',
    copy: 'Scale both ratios until the common quantity has the same value, then combine all three terms.'
  },
  'inverse-proportion': {
    title: 'This relationship moves in the opposite direction',
    copy: 'For fixed work or distance, increasing one quantity decreases the other. Keep their product constant.'
  },
  mixtures: {
    title: 'The component amounts need to stay visible',
    copy: 'Convert the ratio into actual component amounts before adding or removing anything.'
  },
  agreement: {
    title: 'The true subject controls the verb',
    copy: 'Ignore phrases between the subject and verb. Match the verb with the head subject, not the nearest noun.'
  },
  tense: {
    title: 'The time signal and verb form disagree',
    copy: 'Use the time marker to choose the tense, then check whether an auxiliary requires the base or past-participle form.'
  },
  articles: {
    title: 'Articles follow sound and usage',
    copy: 'Choose a or an from the opening sound, and use the when the noun is specific or conventionally unique.'
  },
  prepositions: {
    title: 'This expression uses a fixed preposition',
    copy: 'Some verbs and comparisons take a conventional preposition—or no preposition at all.'
  },
  nouns: {
    title: 'This noun is uncountable in standard English',
    copy: 'Words such as information, furniture, advice, and scenery normally take singular verbs and no plural s.'
  },
  conjunctions: {
    title: 'The paired connector is incomplete',
    copy: 'Fixed pairs such as hardly…when and no sooner…than must be used together without an extra negative.'
  }
};

function rotate(values, amount) {
  const offset = amount % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function hashId(value) {
  return [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0);
}

function optionOrderKey(questionId, label) {
  return createHash('sha256')
    .update(`${MCQ_OPTION_ORDER_VERSION}\u0000${questionId}\u0000${label}`)
    .digest('hex');
}

function orderOptionLabels(questionId, labels) {
  return labels
    .map((label) => ({ label, key: optionOrderKey(questionId, label) }))
    .sort((first, second) => {
      if (first.key !== second.key) return first.key < second.key ? -1 : 1;
      if (first.label === second.label) return 0;
      return first.label < second.label ? -1 : 1;
    })
    .map(({ label }) => label);
}

function baseQuestion({ id, domain, topicId, topicName, concept, difficulty, prompt, expectedSeconds, hints, solution, misconception, accessibility }) {
  return {
    id,
    version: 2,
    contentVersion: CONTENT_VERSION,
    domain,
    topicId,
    topicName,
    concept,
    difficulty,
    difficultyLabel: difficultyLabel(difficulty),
    prompt,
    expectedSeconds,
    hints,
    solution,
    misconception: misconceptionLibrary[misconception] || misconceptionLibrary[concept],
    misconceptionTag: misconception,
    accessibility: accessibility || prompt,
    status: 'published',
    provenance: 'Original AptiBloom prototype item',
    reviewer: 'AptiBloom content review'
  };
}

function makeMcq(meta, correctLabel, distractors) {
  const labels = [String(correctLabel), ...distractors.map(String)].filter((value, index, all) => all.indexOf(value) === index).slice(0, 4);
  const neutralDistractors = ['Cannot be determined', 'No change', 'None of these'];
  for (const candidate of neutralDistractors) {
    if (labels.length >= 4) break;
    if (!labels.includes(candidate)) labels.push(candidate);
  }
  const legacyOrdered = rotate(labels, hashId(meta.id));
  const ordered = orderOptionLabels(meta.id, labels);
  const options = ordered.map((label, index) => ({ id: optionIds[index], label }));
  return {
    ...baseQuestion(meta),
    type: 'mcq',
    options,
    legacyOptions: legacyOrdered.map((label, index) => ({ id: optionIds[index], label })),
    answer: options.find((option) => option.label === String(correctLabel)).id
  };
}

function makeNumeric(meta, answer, inputSuffix = '') {
  return {
    ...baseQuestion(meta),
    type: 'numeric',
    answer,
    tolerance: Number.isInteger(answer) ? 0 : 0.02,
    inputSuffix
  };
}

function makeOrdering(meta, items, answer) {
  return {
    ...baseQuestion(meta),
    type: 'ordering',
    options: items.map((label, index) => ({ id: optionIds[index], label })),
    answer
  };
}

function makeMatching(meta, rows, choices, answer) {
  return {
    ...baseQuestion(meta),
    type: 'matching',
    matchRows: rows.map((label, index) => ({ id: `r${index + 1}`, label })),
    matchOptions: choices.map((label, index) => ({ id: `m${index + 1}`, label })),
    answer
  };
}

function makeShortText(meta, accepted) {
  return {
    ...baseQuestion(meta),
    type: 'short-text',
    answer: accepted
  };
}

function numberLabel(value, prefix = '', suffix = '') {
  return `${prefix}${Number.isInteger(value) ? value : Number(value.toFixed(2))}${suffix}`;
}

function numericDistractors(answer) {
  const spread = Math.max(1, Math.round(Math.abs(answer) * 0.1));
  return [answer + spread, Math.max(0, answer - spread), answer + spread * 2];
}

function quantQuestion(topic, spec, index) {
  const id = `${topic.prefix}-${String(index + 1).padStart(3, '0')}`;
  const difficulty = index < 10 ? 'D1' : index < 20 ? 'D2' : 'D3';
  const meta = {
    id,
    domain: topic.domain,
    topicId: topic.id,
    topicName: topic.name,
    concept: spec.concept,
    difficulty,
    prompt: spec.prompt,
    expectedSeconds: spec.expectedSeconds || (difficulty === 'D1' ? 45 : difficulty === 'D2' ? 70 : 95),
    hints: spec.hints,
    solution: spec.solution,
    misconception: spec.misconception || spec.concept,
    accessibility: spec.accessibility
  };

  if (spec.type === 'ordering') return makeOrdering(meta, spec.items, spec.order);
  if (spec.type === 'matching') return makeMatching(meta, spec.rows, spec.matches, spec.answerMap);
  if (spec.type === 'short-text') return makeShortText(meta, spec.accepted);

  const isNumericAnswer = typeof spec.answer === 'number';
  const label = spec.label || (isNumericAnswer ? numberLabel(spec.answer, spec.prefix, spec.suffix) : String(spec.answer));
  const distractors = spec.distractors || (isNumericAnswer
    ? numericDistractors(spec.answer).map((value) => numberLabel(value, spec.prefix, spec.suffix))
    : ['Cannot be determined', '1:1', 'None of these']);
  if (!isNumericAnswer || index % 2 === 0 || spec.forceMcq) return makeMcq(meta, label, distractors);
  return makeNumeric(meta, spec.answer, spec.suffix || '');
}

const percentageSpecs = [
  {
    concept: 'percent-of', prompt: 'What is 20% of 250?', answer: 50, distractors: ['40', '45', '60'],
    hints: ['20% means 20 out of every 100.', 'Write 20% as 0.20, then multiply by 250.'],
    solution: ['Convert 20% to 0.20.', '0.20 × 250 = 50.', 'So 20% of 250 is 50.']
  },
  {
    concept: 'percent-of', prompt: 'Find 15% of 320.', answer: 48,
    hints: ['Find 10% and 5% separately.', '10% of 320 is 32 and 5% is 16.'],
    solution: ['15% = 10% + 5%.', '32 + 16 = 48.', 'The required value is 48.']
  },
  {
    concept: 'percent-of', prompt: 'A class has 180 students. If 35% joined the workshop, how many joined?', answer: 63, distractors: ['54', '60', '72'],
    hints: ['Turn 35% into 0.35.', 'Multiply the whole class size by the rate.'],
    solution: ['35% of 180 = 0.35 × 180.', '0.35 × 180 = 63.', '63 students joined.']
  },
  {
    concept: 'percent-of', prompt: 'What is 12.5% of 240?', answer: 30,
    hints: ['12.5% is one eighth.', 'Divide 240 by 8.'],
    solution: ['12.5% = 1/8.', '240 ÷ 8 = 30.', 'The answer is 30.']
  },
  {
    concept: 'percent-of', prompt: 'A learner completed 72% of a 250-question plan. How many questions is that?', answer: 180, distractors: ['175', '182', '200'],
    hints: ['Use completed = rate × total.', '0.72 × 250 gives the count.'],
    solution: ['72% = 0.72.', '0.72 × 250 = 180.', 'The learner completed 180 questions.']
  },
  {
    concept: 'percent-of', prompt: '45 is what percentage of 180?', answer: 25, suffix: '%',
    hints: ['Use part ÷ whole × 100.', '45 is one fourth of 180.'],
    solution: ['45 ÷ 180 = 0.25.', '0.25 × 100 = 25%.', '45 is 25% of 180.']
  },
  {
    concept: 'percent-of', prompt: '84 is what percentage of 240?', answer: 35, suffix: '%', distractors: ['30%', '32%', '40%'],
    hints: ['Divide 84 by 240.', 'Convert the decimal result to a percentage.'],
    solution: ['84 ÷ 240 = 0.35.', '0.35 × 100 = 35%.', 'The required percentage is 35%.']
  },
  {
    concept: 'percent-of', prompt: 'A candidate answered 54 of 120 questions correctly. What was the accuracy?', answer: 45, suffix: '%',
    hints: ['Accuracy = correct ÷ total × 100.', 'Simplify 54/120 before converting.'],
    solution: ['54 ÷ 120 = 0.45.', '0.45 × 100 = 45%.', 'The accuracy was 45%.']
  },
  {
    concept: 'percent-of', prompt: '18 out of 80 students chose verbal practice. What percentage chose it?', answer: 22.5, suffix: '%', distractors: ['20%', '24%', '25%'],
    hints: ['Use 18 ÷ 80 × 100.', '18/80 equals 0.225.'],
    solution: ['18 ÷ 80 = 0.225.', '0.225 × 100 = 22.5%.', 'So 22.5% chose verbal practice.']
  },
  {
    concept: 'percent-of', type: 'ordering', prompt: 'Arrange the method for finding 15% of 240.',
    items: ['Multiply 0.15 by 240', 'Convert 15% to 0.15', 'State the result: 36'], order: ['b', 'a', 'c'],
    hints: ['Convert the percentage before multiplying.', 'The numerical result belongs last.'],
    solution: ['15% becomes 0.15.', '0.15 × 240 = 36.', 'The steps now move from rate to calculation to result.']
  },
  {
    concept: 'percent-of', prompt: 'A ₹800 course receives a 15% discount. What is the sale price?', answer: 680, prefix: '₹', distractors: ['₹660', '₹700', '₹720'],
    hints: ['First find the discount amount.', 'Keep 85% of the original price.'],
    solution: ['Discount = 15% of ₹800 = ₹120.', '₹800 − ₹120 = ₹680.', 'The sale price is ₹680.']
  },
  {
    concept: 'percent-change', prompt: 'A stipend of ₹24,000 rises by 12%. What is the new stipend?', answer: 26880, prefix: '₹',
    hints: ['A 12% rise means keep 112%.', 'Multiply ₹24,000 by 1.12.'],
    solution: ['Increase = 0.12 × 24,000 = ₹2,880.', '₹24,000 + ₹2,880 = ₹26,880.', 'The new stipend is ₹26,880.']
  },
  {
    concept: 'percent-change', prompt: 'A town of 50,000 people decreases by 8%. What is the new population?', answer: 46000, distractors: ['42,000', '45,000', '48,000'],
    hints: ['An 8% decrease leaves 92%.', 'Multiply 50,000 by 0.92.'],
    solution: ['Decrease = 0.08 × 50,000 = 4,000.', '50,000 − 4,000 = 46,000.', 'The new population is 46,000.']
  },
  {
    concept: 'reverse-percent', prompt: 'A bag costs ₹360 after a 20% discount. What was its original price?', answer: 450, prefix: '₹',
    hints: ['₹360 represents 80% of the original.', 'Divide 360 by 0.80.'],
    solution: ['After 20% off, 80% remains.', 'Original = 360 ÷ 0.80 = 450.', 'The original price was ₹450.']
  },
  {
    concept: 'reverse-percent', prompt: 'A bill is ₹690 after adding 15% tax. What was the pre-tax amount?', answer: 600, prefix: '₹', distractors: ['₹575', '₹610', '₹625'],
    hints: ['₹690 is 115% of the base.', 'Divide by 1.15 rather than subtracting 15% of 690.'],
    solution: ['Taxed total = 1.15 × base.', 'Base = 690 ÷ 1.15 = 600.', 'The pre-tax amount was ₹600.']
  },
  {
    concept: 'percent-change', prompt: 'A score improves from 64 to 80. What is the percentage increase?', answer: 25, suffix: '%',
    hints: ['The increase is 16.', 'Divide the increase by the original score, 64.'],
    solution: ['Change = 80 − 64 = 16.', '16 ÷ 64 × 100 = 25%.', 'The percentage increase is 25%.']
  },
  {
    concept: 'percent-change', prompt: 'A price drops from ₹250 to ₹225. What is the percentage decrease?', answer: 10, suffix: '%', distractors: ['8%', '11.1%', '12.5%'],
    hints: ['The decrease is ₹25.', 'Use the original ₹250 as the base.'],
    solution: ['Change = 250 − 225 = 25.', '25 ÷ 250 × 100 = 10%.', 'The percentage decrease is 10%.']
  },
  {
    concept: 'reverse-percent', prompt: 'The pass mark is 40%. A learner scores 144 and misses it by 16 marks. What are the total marks?', answer: 400,
    hints: ['The pass mark is 144 + 16.', '160 is 40% of the total.'],
    solution: ['Pass mark = 144 + 16 = 160.', 'Total = 160 ÷ 0.40 = 400.', 'The test carries 400 marks.']
  },
  {
    concept: 'percent-of', prompt: 'Thirty percent of a group is 90 students. How many students are in the group?', answer: 300, distractors: ['270', '320', '360'],
    hints: ['90 represents 30% of the whole.', 'Divide 90 by 0.30.'],
    solution: ['0.30 × total = 90.', 'Total = 90 ÷ 0.30 = 300.', 'There are 300 students.']
  },
  {
    concept: 'percent-of', type: 'matching', prompt: 'Match each percentage to its value of 200.',
    rows: ['10%', '25%', '40%'], matches: ['20', '50', '80'], answerMap: { r1: 'm1', r2: 'm2', r3: 'm3' },
    hints: ['Find 10% first, then scale.', 'One quarter of 200 is 50.'],
    solution: ['10% of 200 is 20.', '25% of 200 is 50.', '40% of 200 is 80.']
  },
  {
    concept: 'successive-change', prompt: 'A ₹1,000 fee rises by 20% and then falls by 10%. What is the final fee?', answer: 1080, prefix: '₹', distractors: ['₹1,080', '₹1,100', '₹1,120'],
    hints: ['Apply each change to its current base.', 'Use 1,000 × 1.20 × 0.90.'],
    solution: ['After the rise: ₹1,000 × 1.20 = ₹1,200.', 'After the fall: ₹1,200 × 0.90 = ₹1,080.', 'The final fee is ₹1,080.']
  },
  {
    concept: 'successive-change', prompt: 'A ₹1,500 jacket has successive discounts of 10% and 20%. What is the final price?', answer: 1080, prefix: '₹',
    hints: ['Keep 90%, then 80%.', 'Multiply 1,500 × 0.90 × 0.80.'],
    solution: ['After 10% off: ₹1,350.', 'After another 20% off: ₹1,350 × 0.80 = ₹1,080.', 'The final price is ₹1,080.']
  },
  {
    concept: 'percentage-comparison', prompt: 'A is 25% more than B. By what percent is B less than A?', answer: 20, suffix: '%', distractors: ['20%', '25%', '30%'],
    hints: ['Let B be 100, so A is 125.', 'Compare the difference with A when finding how much B is less.'],
    solution: ['Let B = 100 and A = 125.', 'Difference = 25.', '25 ÷ 125 × 100 = 20%.']
  },
  {
    concept: 'percentage-comparison', prompt: 'A price rises by 25%. By what percent must consumption fall to keep spending unchanged?', answer: 20, suffix: '%',
    hints: ['Use a price of 100 becoming 125.', 'New quantity must be 100/125 of the old quantity.'],
    solution: ['New price factor = 1.25.', 'Affordable quantity factor = 1 ÷ 1.25 = 0.80.', 'Consumption must fall by 20%.']
  },
  {
    concept: 'percent-of', prompt: 'A winner receives 54% of valid votes and wins by 1,600 votes. How many valid votes were cast?', answer: 20000, distractors: ['16,000', '18,000', '22,000'],
    hints: ['The other candidate has 46%, so the margin is 8%.', '1,600 represents 8% of all valid votes.'],
    solution: ['Vote-share difference = 54% − 46% = 8%.', 'Total = 1,600 ÷ 0.08.', '20,000 valid votes were cast.']
  },
  {
    concept: 'concentration', prompt: 'A 30 L solution is 20% sugar. After adding 10 L water, what percentage is sugar?', answer: 15, suffix: '%',
    hints: ['The sugar amount stays unchanged.', 'Find sugar litres, then divide by the new 40 L total.'],
    solution: ['Sugar = 20% of 30 L = 6 L.', 'New total = 30 + 10 = 40 L.', '6 ÷ 40 × 100 = 15%.']
  },
  {
    concept: 'reverse-percent', prompt: 'A learner at 30% is 12 marks below passing; at 40% the learner is 8 marks above. What are the total marks?', answer: 200, distractors: ['180', '200', '240'],
    hints: ['The 10 percentage-point gap equals 20 marks.', 'If 10% is 20, find 100%.'],
    solution: ['Score difference = 12 + 8 = 20 marks.', 'This equals 40% − 30% = 10% of total.', 'Total = 20 ÷ 0.10 = 200.']
  },
  {
    concept: 'successive-change', prompt: 'A number is increased by 20% and then by 25% to become 450. What was the number?', answer: 300,
    hints: ['Work backward through both multipliers.', 'The combined multiplier is 1.20 × 1.25 = 1.50.'],
    solution: ['Combined factor = 1.20 × 1.25 = 1.50.', 'Original = 450 ÷ 1.50.', 'The original number was 300.']
  },
  {
    concept: 'successive-change', prompt: 'A population rises 10%, rises another 10%, then falls 20%. What is the net percentage change?', answer: -3.2, suffix: '%', distractors: ['3.2% decrease', '0%', '4% increase'], label: '3.2% decrease',
    hints: ['Use a starting population of 100.', 'Calculate 100 × 1.10 × 1.10 × 0.80.'],
    solution: ['Starting from 100: 100 × 1.10 × 1.10 = 121.', '121 × 0.80 = 96.8.', 'The net result is a 3.2% decrease.']
  },
  {
    concept: 'percent-of', prompt: 'A person spends 75% of a ₹20,000 income. How much is saved?', answer: 5000, prefix: '₹',
    hints: ['The saving rate is the part not spent.', '100% − 75% = 25%.'],
    solution: ['Savings rate = 25%.', '0.25 × ₹20,000 = ₹5,000.', 'The person saves ₹5,000.']
  }
];

const ratioSpecs = [
  {
    concept: 'simplifying', prompt: 'Simplify the ratio 18:24.', answer: '3:4', distractors: ['2:3', '4:5', '6:7'],
    hints: ['Find the greatest common factor of 18 and 24.', 'Divide both terms by 6.'],
    solution: ['GCF(18, 24) = 6.', '18 ÷ 6 : 24 ÷ 6 = 3:4.', 'The simplest ratio is 3:4.']
  },
  {
    concept: 'proportion', prompt: 'Complete the proportion x:35 = 4:5.', answer: 28, distractors: ['21', '28', '30'],
    hints: ['x/35 = 4/5.', 'Multiply 35 by 4/5.'],
    solution: ['x/35 = 4/5.', 'x = 35 × 4 ÷ 5.', 'x = 28.']
  },
  {
    concept: 'proportion', prompt: 'If 12:18 = x:27, find x.', answer: 18,
    hints: ['12/18 simplifies to 2/3.', 'Find two thirds of 27.'],
    solution: ['12:18 = 2:3.', 'x/27 = 2/3.', 'x = 18.']
  },
  {
    concept: 'sharing', prompt: 'The ratio of boys to girls is 3:2 in a class of 40. How many boys are there?', answer: 24, distractors: ['16', '20', '24'],
    hints: ['There are 3 + 2 = 5 equal parts.', 'One part is 40 ÷ 5.'],
    solution: ['Total parts = 5.', 'One part = 40 ÷ 5 = 8.', 'Boys = 3 × 8 = 24.']
  },
  {
    concept: 'sharing', prompt: 'Red and blue beads are in the ratio 5:3. If there are 64 beads, how many are red?', answer: 40,
    hints: ['The total is split into 8 parts.', 'Red takes 5 of those parts.'],
    solution: ['Total parts = 5 + 3 = 8.', 'One part = 64 ÷ 8 = 8.', 'Red beads = 5 × 8 = 40.']
  },
  {
    concept: 'sharing', prompt: 'Divide ₹720 in the ratio 5:4. What is the larger share?', answer: 400, prefix: '₹', distractors: ['₹320', '₹360', '₹400'],
    hints: ['There are 9 total parts.', 'The larger share uses 5 parts.'],
    solution: ['One part = ₹720 ÷ 9 = ₹80.', 'Larger share = 5 × ₹80.', 'The larger share is ₹400.']
  },
  {
    concept: 'sharing', prompt: 'Two amounts are in the ratio 7:5 and differ by ₹120. What is their total?', answer: 720, prefix: '₹',
    hints: ['The difference is 2 ratio parts.', 'If 2 parts are ₹120, one part is ₹60.'],
    solution: ['2 parts = ₹120, so 1 part = ₹60.', 'Total parts = 7 + 5 = 12.', 'Total = 12 × ₹60 = ₹720.']
  },
  {
    concept: 'combined-ratios', prompt: 'If A:B = 2:3 and B:C = 4:5, find A:B:C.', answer: '8:12:15', distractors: ['2:4:5', '8:6:15', '4:12:5'],
    hints: ['Make the two values of B equal.', 'Scale 2:3 by 4 and 4:5 by 3.'],
    solution: ['A:B = 2:3 becomes 8:12.', 'B:C = 4:5 becomes 12:15.', 'A:B:C = 8:12:15.']
  },
  {
    concept: 'proportion', type: 'ordering', prompt: 'Arrange the steps to solve x:35 = 4:5.',
    items: ['Calculate x = 28', 'Write x/35 = 4/5', 'Multiply both sides by 35'], order: ['b', 'c', 'a'],
    hints: ['Begin by writing the ratios as equal fractions.', 'Isolate x before calculating.'],
    solution: ['Write x/35 = 4/5.', 'Multiply both sides by 35.', 'x = 35 × 4/5 = 28.']
  },
  {
    concept: 'proportion', prompt: 'A recipe uses flour and sugar in the ratio 5:2. If sugar is 280 g, how much flour is needed?', answer: 700, suffix: ' g', distractors: ['560 g', '650 g', '700 g'],
    hints: ['Two parts equal 280 g.', 'Find one part, then take five.'],
    solution: ['One part = 280 ÷ 2 = 140 g.', 'Flour = 5 × 140 g.', 'Flour needed = 700 g.']
  },
  {
    concept: 'proportion', prompt: 'On a 1:50,000 map, two points are 6 cm apart. What is the real distance in kilometres?', answer: 3, suffix: ' km',
    hints: ['6 cm on the map is 6 × 50,000 cm.', '100,000 cm equals 1 km.'],
    solution: ['Real distance = 300,000 cm.', '300,000 cm ÷ 100,000 = 3 km.', 'The real distance is 3 km.']
  },
  {
    concept: 'inverse-proportion', prompt: 'Two speeds are in the ratio 4:5. For the same distance, what is the ratio of their times?', answer: '5:4', distractors: ['4:5', '1:1', '16:25'],
    hints: ['For a fixed distance, faster speed means less time.', 'Invert the speed ratio.'],
    solution: ['Time is inversely proportional to speed.', 'Invert 4:5.', 'The time ratio is 5:4.']
  },
  {
    concept: 'sharing', prompt: 'Two ages are in the ratio 3:5 and sum to 48. What is the younger age?', answer: 18,
    hints: ['The sum contains 8 parts.', 'Find one part from 48 ÷ 8.'],
    solution: ['One part = 48 ÷ 8 = 6.', 'Younger age = 3 × 6.', 'The younger person is 18.']
  },
  {
    concept: 'combined-ratios', prompt: 'If A:B = 3:4 and B:C = 2:5, find A:B:C.', answer: '3:4:10', distractors: ['3:2:5', '6:4:5', '3:8:10'],
    hints: ['Turn B:C = 2:5 into 4:10.', 'Now B has the same value in both ratios.'],
    solution: ['A:B is already 3:4.', 'Scale B:C by 2 to get 4:10.', 'A:B:C = 3:4:10.']
  },
  {
    concept: 'inverse-proportion', prompt: 'Eight workers finish a task in 12 days. At the same rate, how many days would 6 workers need?', answer: 16,
    hints: ['Workers × days stays constant.', '8 × 12 = 6 × d.'],
    solution: ['Total work = 8 × 12 = 96 worker-days.', 'Days = 96 ÷ 6.', 'Six workers need 16 days.']
  },
  {
    concept: 'proportion', prompt: 'Twelve machines make 600 parts in 5 hours. How many parts do 8 machines make in 5 hours?', answer: 400, distractors: ['360', '400', '450'],
    hints: ['Time is unchanged, so output follows the machine count.', 'Use 600 × 8/12.'],
    solution: ['Output per machine in 5 hours = 600 ÷ 12 = 50.', 'Eight machines make 8 × 50.', 'They make 400 parts.']
  },
  {
    concept: 'mixtures', prompt: 'Milk and water are in the ratio 7:3 in a 20 L mixture. How many litres are water?', answer: 6, suffix: ' L',
    hints: ['The mixture has 10 total parts.', 'Water occupies 3 parts.'],
    solution: ['One part = 20 ÷ 10 = 2 L.', 'Water = 3 × 2 L.', 'There are 6 L of water.']
  },
  {
    concept: 'mixtures', prompt: 'A 30 L milk-water mixture is 4:1. How much water must be added to make it 3:1?', answer: 2, suffix: ' L', distractors: ['1 L', '2 L', '4 L'],
    hints: ['Initially milk is 24 L and water is 6 L.', 'For a 3:1 ratio, 24 L milk needs 8 L water.'],
    solution: ['Initial amounts: milk 24 L, water 6 L.', 'Required water for 3:1 = 24 ÷ 3 = 8 L.', 'Add 8 − 6 = 2 L water.']
  },
  {
    concept: 'sharing', type: 'matching', prompt: 'Match each total with the first share in a 3:2 split.',
    rows: ['Total 25', 'Total 40', 'Total 60'], matches: ['15', '24', '36'], answerMap: { r1: 'm1', r2: 'm2', r3: 'm3' },
    hints: ['The first share is 3/5 of each total.', 'Find one fifth, then multiply by three.'],
    solution: ['3/5 of 25 is 15.', '3/5 of 40 is 24.', '3/5 of 60 is 36.']
  },
  {
    concept: 'sharing', prompt: 'A:B:C share ₹2,000 in the ratio 2:3:5. What is B’s share?', answer: 600, prefix: '₹', distractors: ['₹400', '₹600', '₹800'],
    hints: ['There are 10 total parts.', 'B receives 3 parts.'],
    solution: ['One part = ₹2,000 ÷ 10 = ₹200.', 'B receives 3 × ₹200.', 'B’s share is ₹600.']
  },
  {
    concept: 'proportion', prompt: 'A invests ₹40,000 for 12 months and B invests ₹60,000 for 8 months. What is their profit ratio?', answer: '1:1', distractors: ['2:3', '3:2', '4:3'],
    hints: ['Compare capital × time.', 'Both products equal ₹4,80,000-months.'],
    solution: ['A: 40,000 × 12 = 4,80,000.', 'B: 60,000 × 8 = 4,80,000.', 'The profit ratio is 1:1.']
  },
  {
    concept: 'sharing', prompt: 'Boys:girls is 7:5. After 8 girls join, it becomes 7:6. What was the original class size?', answer: 96, distractors: ['84', '96', '104'],
    hints: ['Let original counts be 7x and 5x.', '7x/(5x+8) = 7/6.'],
    solution: ['6 × 7x = 7(5x + 8).', '42x = 35x + 56, so x = 8.', 'Original total = 12x = 96.']
  },
  {
    concept: 'proportion', prompt: 'Two numbers are in the ratio 4:7. Adding 6 to each changes the ratio to 5:8. What is the smaller number?', answer: 24,
    hints: ['Let the numbers be 4x and 7x.', 'Solve (4x + 6)/(7x + 6) = 5/8.'],
    solution: ['8(4x + 6) = 5(7x + 6).', '32x + 48 = 35x + 30, so x = 6.', 'The smaller number is 4x = 24.']
  },
  {
    concept: 'percentage-comparison', prompt: 'Salaries A:B are 6:5. A gets a 10% rise and B a 20% rise. What is the new ratio?', answer: '11:10', distractors: ['6:5', '33:25', '12:11'], misconception: 'proportion',
    hints: ['Apply each rise to its own ratio term.', '6 × 1.10 : 5 × 1.20 = 6.6:6.'],
    solution: ['New values are 6.6 and 6.', '6.6:6 = 66:60.', 'Simplify to 11:10.']
  },
  {
    concept: 'mixtures', prompt: 'Acid and water are 3:7 in 20 L. How much acid must be added to make the ratio 1:2?', answer: 1, suffix: ' L',
    hints: ['Initially there are 6 L acid and 14 L water.', 'Water stays 14 L; acid must become 7 L.'],
    solution: ['Initial acid = 6 L and water = 14 L.', 'For 1:2, acid should be 14 ÷ 2 = 7 L.', 'Add 1 L acid.']
  },
  {
    concept: 'mixtures', prompt: 'Copper:zinc is 5:3 in a 16 kg alloy. How much zinc must be added to make it 1:1?', answer: 4, suffix: ' kg', distractors: ['2 kg', '4 kg', '6 kg'],
    hints: ['Initially copper is 10 kg and zinc is 6 kg.', 'For 1:1, zinc must also be 10 kg.'],
    solution: ['Copper = 10 kg; zinc = 6 kg.', 'Required zinc = 10 kg.', 'Add 10 − 6 = 4 kg.']
  },
  {
    concept: 'combined-ratios', prompt: 'If A:B = 4:5 and B:C = 10:7, find A:B:C.', answer: '8:10:7', distractors: ['4:10:7', '8:5:7', '4:5:7'],
    hints: ['Make B equal to 10 in the first ratio.', 'Scale 4:5 by 2.'],
    solution: ['A:B = 4:5 becomes 8:10.', 'B:C is 10:7.', 'A:B:C = 8:10:7.']
  },
  {
    concept: 'sharing', prompt: 'Three numbers are in the ratio 2:3:4 and total 108. What is the largest?', answer: 48,
    hints: ['There are 9 total parts.', 'The largest number takes 4 parts.'],
    solution: ['One part = 108 ÷ 9 = 12.', 'Largest = 4 × 12.', 'The largest number is 48.']
  },
  {
    concept: 'combined-ratios', prompt: 'A:B = 3:2 and B:C = 4:5. If A+B+C = 90, what is C?', answer: 30, distractors: ['24', '30', '36'],
    hints: ['Make B equal: 3:2 becomes 6:4.', 'The combined ratio is 6:4:5.'],
    solution: ['A:B:C = 6:4:5.', 'Total parts = 15, so one part = 90 ÷ 15 = 6.', 'C = 5 × 6 = 30.']
  },
  {
    concept: 'proportion', prompt: 'Fifteen pens cost ₹180. At the same rate, what do 22 pens cost?', answer: 264, prefix: '₹',
    hints: ['Find the cost of one pen.', '₹180 ÷ 15 = ₹12.'],
    solution: ['One pen costs ₹12.', '22 × ₹12 = ₹264.', 'The total cost is ₹264.']
  }
];

const grammarSpecs = [
  ['agreement', ['Neither of the players', 'were ready', 'for the final round.', 'No error'], 1, 'was ready', 'Neither is singular here, so it takes “was”.'],
  ['agreement', ['Each of the reports', 'have been checked', 'by the team.', 'No error'], 1, 'has been checked', 'The subject “each” is singular.'],
  ['agreement', ['The quality of these products', 'are improving', 'every month.', 'No error'], 1, 'is improving', 'The head subject is the singular noun “quality”.'],
  ['agreement', ['One of my friends', 'are applying', 'for the role.', 'No error'], 1, 'is applying', '“One” controls the singular verb.'],
  ['agreement', ['The list of shortlisted candidates', 'were posted', 'yesterday.', 'No error'], 1, 'was posted', 'The singular head noun “list” takes “was”.'],
  ['prepositions', ['She has been working', 'here since', 'three years.', 'No error'], 2, 'for three years', 'Use “for” with a duration and “since” with a starting point.'],
  ['prepositions', ['We discussed', 'about the schedule', 'after class.', 'No error'], 1, 'the schedule', '“Discuss” takes a direct object; “about” is unnecessary.'],
  ['prepositions', ['He is senior', 'than me', 'in the team.', 'No error'], 1, 'to me', 'The adjective “senior” conventionally takes “to”.'],
  ['prepositions', ['The manager insisted', 'to review', 'the report again.', 'No error'], 1, 'on reviewing', 'Use “insist on” followed by a gerund.'],
  ['prepositions', ['I prefer tea', 'than coffee', 'during late sessions.', 'No error'], 1, 'to coffee', 'The standard comparison is “prefer X to Y”.'],
  ['tense', ['If I would know', 'the answer,', 'I would tell you.', 'No error'], 0, 'If I knew', 'Use simple past in the if-clause of this unreal condition.'],
  ['tense', ['By the time we arrived,', 'the interview', 'already started.', 'No error'], 2, 'had already started', 'Past perfect marks the earlier of two past events.'],
  ['tense', ['She did not', 'completed', 'the assignment.', 'No error'], 1, 'complete', 'After “did not”, use the base verb.'],
  ['tense', ['I have seen him', 'yesterday', 'near the library.', 'No error'], 0, 'I saw him', 'A definite finished past time takes the simple past.'],
  ['tense', ['When he will arrive,', 'we will begin', 'the discussion.', 'No error'], 0, 'When he arrives,', 'Use simple present in a future time clause after “when”.'],
  ['articles', ['She bought', 'an university guide', 'for placements.', 'No error'], 1, 'a university guide', '“University” begins with a consonant /y/ sound.'],
  ['articles', ['He is', 'a honest candidate', 'with clear answers.', 'No error'], 1, 'an honest candidate', 'The h in “honest” is silent, so the word begins with a vowel sound.'],
  ['articles', ['The sun rises', 'in east', 'every morning.', 'No error'], 1, 'in the east', 'Use “the” with a specific compass direction.'],
  ['articles', ['She plays', 'the badminton', 'every evening.', 'No error'], 1, 'badminton', 'Names of sports normally take no article.'],
  ['articles', ['We need', 'an one-hour break', 'before the test.', 'No error'], 1, 'a one-hour break', '“One” begins with a /w/ consonant sound.'],
  ['nouns', ['The information', 'are useful', 'for all applicants.', 'No error'], 1, 'is useful', '“Information” is an uncountable singular noun.'],
  ['nouns', ['The furniture', 'were delivered', 'this morning.', 'No error'], 1, 'was delivered', '“Furniture” is uncountable and takes a singular verb.'],
  ['nouns', ['He gave me', 'many advices', 'before the interview.', 'No error'], 1, 'much advice', '“Advice” is uncountable; use “much advice” or “pieces of advice”.'],
  ['nouns', ['The sceneries', 'of the valley', 'were beautiful.', 'No error'], 0, 'The scenery', '“Scenery” is normally uncountable.'],
  ['agreement', ['She is one of the students', 'who works', 'every weekend.', 'No error'], 1, 'who work', 'The relative pronoun refers to plural “students”.'],
  ['conjunctions', ['Hardly had I entered', 'than the test', 'began.', 'No error'], 1, 'when the test', 'The fixed pair is “hardly…when”.'],
  ['conjunctions', ['No sooner did the bell ring', 'when the candidates', 'opened the paper.', 'No error'], 1, 'than the candidates', 'The fixed pair is “no sooner…than”.'],
  ['conjunctions', ['Despite of the rain,', 'the drive', 'continued.', 'No error'], 0, 'Despite the rain,', 'Use “despite” without “of”, or use “in spite of”.'],
  ['conjunctions', ['Unless you do not practise,', 'accuracy', 'will not improve.', 'No error'], 0, 'Unless you practise,', '“Unless” already means “if not”; another negative reverses the meaning.'],
  ['prepositions', ['The interviewer asked', 'that why I chose', 'the role.', 'No error'], 1, 'why I chose', 'An indirect question after “asked” does not need “that”.']
];

function grammarQuestion(spec, index) {
  const [concept, segments, correctIndex, correction, reason] = spec;
  const id = `grm-${String(index + 1).padStart(3, '0')}`;
  const difficulty = index < 10 ? 'D1' : index < 20 ? 'D2' : 'D3';
  const meta = {
    id,
    domain: 'Verbal ability',
    topicId: 'grammar',
    topicName: 'Grammar & error spotting',
    concept,
    difficulty,
    prompt: index % 7 === 5 ? `Type the corrected form of: “${segments[correctIndex]}”` : 'Choose the part that contains the error.',
    expectedSeconds: difficulty === 'D1' ? 40 : difficulty === 'D2' ? 55 : 70,
    hints: [
      concept === 'agreement' ? 'Find the head subject before looking at the verb.' : `Check the ${concept} rule rather than what merely sounds familiar.`,
      `Focus on: “${segments[correctIndex]}”`
    ],
    solution: [`The issue is in “${segments[correctIndex]}”.`, `Replace it with “${correction}”.`, reason],
    misconception: concept,
    accessibility: `${segments.slice(0, 3).join(' ')} Choose the segment containing the grammar error.`
  };

  if (index % 7 === 5) return makeShortText(meta, [correction.replace(/[.,]$/, ''), correction]);
  const options = segments.map((label, optionIndex) => ({ id: optionIds[optionIndex], label }));
  return {
    ...baseQuestion(meta),
    type: 'error-spot',
    options,
    answer: optionIds[correctIndex]
  };
}

const percentageTopic = { id: 'percentages', prefix: 'pct', name: 'Percentages', domain: 'Quantitative aptitude' };
const ratioTopic = { id: 'ratios', prefix: 'rat', name: 'Ratio & proportion', domain: 'Quantitative aptitude' };

export const QUESTIONS = [
  ...percentageSpecs.map((spec, index) => quantQuestion(percentageTopic, spec, index)),
  ...ratioSpecs.map((spec, index) => quantQuestion(ratioTopic, spec, index)),
  ...grammarSpecs.map(grammarQuestion),
  ...GENERATED_QUESTIONS
];

const questionIndex = new Map(QUESTIONS.map((question) => [question.id, question]));

export function getQuestion(id) {
  return questionIndex.get(id) || null;
}

export function getQuestions(filters = {}) {
  return QUESTIONS.filter((question) => {
    if (filters.topicId && question.topicId !== filters.topicId) return false;
    if (filters.difficulty && question.difficulty !== filters.difficulty) return false;
    if (filters.concept && question.concept !== filters.concept) return false;
    return ['published', 'pilot'].includes(question.status);
  });
}

export function supportsQuestionVersion(question, version) {
  const requestedVersion = Number(version);
  return requestedVersion === question.version || (requestedVersion === 1 && question.version === 2);
}

function optionsForVersion(question, version) {
  if (!question.options || question.type !== 'mcq' || Number(version) === question.version) return question.options;
  return question.legacyOptions || question.options;
}

export function publicQuestion(question, { hideLabels = false, version = question.version } = {}) {
  const requestedVersion = Number(version);
  if (!supportsQuestionVersion(question, requestedVersion)) throw new Error(`Unsupported question version ${version} for ${question.id}`);
  const publicData = {
    id: question.id,
    version: requestedVersion,
    domain: hideLabels ? undefined : question.domain,
    topicId: hideLabels ? undefined : question.topicId,
    topicName: hideLabels ? undefined : question.topicName,
    concept: hideLabels ? undefined : question.concept,
    difficulty: question.difficulty,
    difficultyLabel: question.difficultyLabel || difficultyLabel(question.difficulty),
    status: question.status,
    type: question.type,
    prompt: question.prompt,
    expectedSeconds: question.expectedSeconds,
    accessibility: question.accessibility,
    hintCount: question.hints.length
  };
  if (question.options) publicData.options = optionsForVersion(question, requestedVersion);
  if (question.matchRows) publicData.matchRows = question.matchRows;
  if (question.matchOptions) publicData.matchOptions = question.matchOptions;
  if (question.inputSuffix) publicData.inputSuffix = question.inputSuffix;
  return publicData;
}

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[“”‘’]/g, '')
    .replace(/[.,!?]+$/g, '')
    .replace(/\s+/g, ' ');
}

export function evaluateAnswer(question, suppliedAnswer, version = question?.version) {
  if (!question || !supportsQuestionVersion(question, version)) return false;
  if (question.type === 'numeric') {
    const numeric = Number(String(suppliedAnswer ?? '').replace(/[,₹%a-zA-Z\s]/g, ''));
    return Number.isFinite(numeric) && Math.abs(numeric - question.answer) <= (question.tolerance || 0);
  }
  if (question.type === 'short-text') {
    const normalized = normalizeText(suppliedAnswer);
    return question.answer.some((accepted) => normalizeText(accepted) === normalized);
  }
  if (question.type === 'ordering') {
    return Array.isArray(suppliedAnswer) && suppliedAnswer.length === question.answer.length && question.answer.every((value, index) => value === suppliedAnswer[index]);
  }
  if (question.type === 'matching') {
    return suppliedAnswer && Object.entries(question.answer).every(([row, match]) => suppliedAnswer[row] === match);
  }
  if (question.type === 'mcq' && Number(version) !== question.version) {
    const correctLabel = question.options.find((option) => option.id === question.answer)?.label;
    const versionedAnswer = optionsForVersion(question, version)?.find((option) => option.label === correctLabel)?.id;
    return suppliedAnswer === versionedAnswer;
  }
  return suppliedAnswer === question.answer;
}

export function correctAnswerDisplay(question) {
  if (question.type === 'numeric') return numberLabel(question.answer, '', question.inputSuffix || '');
  if (question.type === 'short-text') return question.answer[0];
  if (question.type === 'ordering') {
    return question.answer.map((id) => question.options.find((option) => option.id === id)?.label).join(' → ');
  }
  if (question.type === 'matching') {
    return question.matchRows.map((row) => {
      const matchId = question.answer[row.id];
      return `${row.label}: ${question.matchOptions.find((option) => option.id === matchId)?.label}`;
    }).join('; ');
  }
  return question.options.find((option) => option.id === question.answer)?.label || question.answer;
}

export function findNearNeighbour(question, excludedIds = []) {
  const candidates = QUESTIONS.filter((candidate) =>
    candidate.id !== question.id &&
    candidate.topicId === question.topicId &&
    candidate.concept === question.concept &&
    !excludedIds.includes(candidate.id)
  );
  return candidates[hashId(question.id) % Math.max(1, candidates.length)] ||
    QUESTIONS.find((candidate) => candidate.topicId === question.topicId && candidate.id !== question.id && !excludedIds.includes(candidate.id));
}

export function contentSummary() {
  const published = QUESTIONS.filter((question) => question.status === 'published').length;
  const pilot = QUESTIONS.filter((question) => question.status === 'pilot').length;
  const byDifficulty = {
    easy: QUESTIONS.filter((question) => question.difficulty === 'D1').length,
    medium: QUESTIONS.filter((question) => question.difficulty === 'D2').length,
    tough: QUESTIONS.filter((question) => question.difficulty === 'D3').length
  };

  return {
    version: CONTENT_VERSION,
    total: QUESTIONS.length,
    reviewed: published,
    published,
    pilot,
    byDifficulty,
    byTopic: TOPIC_CATALOG.map((topic) => {
      const topicQuestions = QUESTIONS.filter((question) => question.topicId === topic.id);
      const easy = topicQuestions.filter((question) => question.difficulty === 'D1').length;
      const medium = topicQuestions.filter((question) => question.difficulty === 'D2').length;
      const tough = topicQuestions.filter((question) => question.difficulty === 'D3').length;
      const topicPublished = topicQuestions.filter((question) => question.status === 'published').length;
      const topicPilot = topicQuestions.filter((question) => question.status === 'pilot').length;
      return {
        topicId: topic.id,
        topicName: topic.name,
        domain: topic.domain,
        count: topicQuestions.length,
        published: topicPublished,
        pilot: topicPilot,
        easy,
        medium,
        tough,
        foundation: easy,
        application: medium,
        placement: tough
      };
    }),
    interactionTypes: [...new Set(QUESTIONS.map((question) => question.type))]
  };
}

export function contentCatalogue() {
  return QUESTIONS.map(({ answer, hints, solution, misconception, ...question }) => ({
    id: question.id,
    topicId: question.topicId,
    topicName: question.topicName,
    concept: question.concept,
    difficulty: question.difficulty,
    difficultyLabel: question.difficultyLabel || difficultyLabel(question.difficulty),
    type: question.type,
    status: question.status,
    version: question.version,
    reviewer: question.reviewer,
    prompt: question.prompt
  }));
}

export { CONTENT_VERSION };
