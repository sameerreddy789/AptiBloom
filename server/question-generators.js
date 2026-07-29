import { difficultyLabel, topicById } from './catalog.js';

import { createHash } from 'node:crypto';

const GENERATED_CONTENT_VERSION = '2026.08.1';
const MCQ_OPTION_ORDER_VERSION = 'aptibloom-mcq-options-v2-4263';
const optionIds = ['a', 'b', 'c', 'd'];

const misconceptionLibrary = {
  'average-base': {
    title: 'The total and the number of values were mixed up',
    copy: 'Average is total divided by count. Rebuild the total first whenever a value is added, removed, or replaced.'
  },
  'weighted-average': {
    title: 'The groups were treated as equally large',
    copy: 'Multiply each group average by its group size before combining the totals.'
  },
  'age-ratio': {
    title: 'The ratio changed but the age gap did not',
    copy: 'Everyone gains the same number of years, so the difference in ages stays constant while the ratio changes.'
  },
  'age-time-shift': {
    title: 'Only one age was shifted through time',
    copy: 'Move every person by the same number of years before applying a past or future relationship.'
  },
  'profit-base': {
    title: 'The percentage used the wrong price as its base',
    copy: 'Profit and loss rates use cost price as the base; discount uses marked price.'
  },
  'discount-chain': {
    title: 'Successive percentages were combined directly',
    copy: 'Apply each markup or discount to the current amount using multipliers in sequence.'
  },
  'work-rates': {
    title: 'Completion times were added instead of work rates',
    copy: 'Convert each time into work per day, combine the rates, then invert the result.'
  },
  'worker-days': {
    title: 'The fixed amount of work was not preserved',
    copy: 'For equal efficiency, workers multiplied by days stays constant.'
  },
  'series-rule': {
    title: 'A visible difference was continued too early',
    copy: 'Check several gaps or ratios before choosing the rule; one step alone can fit many patterns.'
  },
  'alternating-series': {
    title: 'Two interleaved patterns were read as one',
    copy: 'Separate odd-position and even-position terms, then inspect each smaller sequence.'
  },
  'code-direction': {
    title: 'The letter shift moved in the wrong direction',
    copy: 'Track whether each letter moves forward or backward and wrap consistently between A and Z.'
  },
  'code-steps': {
    title: 'One coding step was skipped or applied out of order',
    copy: 'Write the transformations in sequence—such as reverse first, then shift—and apply each exactly once.'
  },
  'syllogism-possibility': {
    title: 'A possible conclusion was treated as certain',
    copy: 'Accept only what must follow from the statements. Do not assume existence or overlap that was not stated.'
  },
  'sentence-rule': {
    title: 'Familiar sound replaced a grammar check',
    copy: 'Identify the controlling rule—agreement, tense, pronoun reference, modifier, or parallel form—before choosing.'
  },
  'paragraph-reference': {
    title: 'The reference link between sentences was missed',
    copy: 'A pronoun, contrast word, or result phrase must follow the sentence that introduces what it refers to.'
  },
  'passage-inference': {
    title: 'The answer went beyond the passage',
    copy: 'Choose the conclusion supported by the text, not a claim that is merely plausible in the real world.'
  }
};

function round(value, places = 2) {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function gcd(a, b) {
  let first = Math.abs(Math.round(a));
  let second = Math.abs(Math.round(b));
  while (second) [first, second] = [second, first % second];
  return first || 1;
}

function ratioLabel(first, second) {
  const divisor = gcd(first, second);
  return `${first / divisor}:${second / divisor}`;
}

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

function levelFor(index, easyCount, mediumCount) {
  if (index < easyCount) return 'D1';
  if (index < easyCount + mediumCount) return 'D2';
  return 'D3';
}

function baseMeta(topicId, prefix, index, easyCount, mediumCount, details) {
  const topic = topicById(topicId);
  const difficulty = levelFor(index, easyCount, mediumCount);
  return {
    id: `${prefix}-${String(index + 1).padStart(4, '0')}`,
    sequenceIndex: index,
    version: 2,
    contentVersion: GENERATED_CONTENT_VERSION,
    domain: topic.domain,
    topicId,
    topicName: topic.name,
    difficulty,
    difficultyLabel: difficultyLabel(difficulty),
    expectedSeconds: difficulty === 'D1' ? 50 : difficulty === 'D2' ? 80 : 110,
    status: 'pilot',
    provenance: 'Original AptiBloom item. Topic coverage informed by publicly available placement-test syllabi; no third-party question wording copied.',
    reviewer: 'Automated answer and structure validation; human review pending',
    accessibility: details.prompt,
    ...details,
    misconception: misconceptionLibrary[details.misconceptionTag] || misconceptionLibrary['average-base']
  };
}

function cleanMeta(meta) {
  const { sequenceIndex, ...question } = meta;
  return question;
}

function uniqueLabels(correctLabel, distractors) {
  const labels = [String(correctLabel), ...distractors.map(String)]
    .filter((value, index, all) => all.indexOf(value) === index)
    .slice(0, 4);
  for (const neutral of ['Cannot be determined', 'No change', 'None of these']) {
    if (labels.length >= 4) break;
    if (!labels.includes(neutral)) labels.push(neutral);
  }
  return labels;
}

function makeMcq(meta, correctLabel, distractors) {
  const unorderedLabels = uniqueLabels(correctLabel, distractors);
  const legacyLabels = [...unorderedLabels]
    .sort((first, second) => hashId(`${meta.id}:${first}`) - hashId(`${meta.id}:${second}`) || first.localeCompare(second));
  const labels = orderOptionLabels(meta.id, unorderedLabels);
  const options = labels.map((label, index) => ({ id: optionIds[index], label }));
  return {
    ...cleanMeta(meta),
    type: 'mcq',
    options,
    legacyOptions: legacyLabels.map((label, index) => ({ id: optionIds[index], label })),
    answer: options.find((option) => option.label === String(correctLabel)).id
  };
}

function formatNumber(value, prefix = '', suffix = '') {
  const display = Number.isInteger(value) ? value.toLocaleString('en-IN') : round(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return `${prefix}${display}${suffix}`;
}

function numericDistractors(answer) {
  const spread = Math.max(1, round(Math.abs(answer) * 0.1));
  return [round(answer + spread), round(answer - spread), round(answer + spread * 2)];
}

function makeNumeric(meta, answer, { prefix = '', suffix = '', distractors = null, forceMcq = false } = {}) {
  const rounded = round(answer);
  if (forceMcq || meta.sequenceIndex % 2 === 0) {
    const alternatives = distractors || numericDistractors(rounded);
    return makeMcq(meta, formatNumber(rounded, prefix, suffix), alternatives.map((value) => formatNumber(value, prefix, suffix)));
  }
  return {
    ...cleanMeta(meta),
    type: 'numeric',
    answer: rounded,
    tolerance: Number.isInteger(rounded) ? 0 : 0.02,
    inputPrefix: prefix,
    inputSuffix: suffix
  };
}

function generateAverages() {
  const questions = [];
  const count = 115;
  for (let index = 0; index < count; index += 1) {
    const difficulty = levelFor(index, 40, 45);
    if (difficulty === 'D1') {
      const termCount = 4 + (index % 4);
      const start = 12 + index * 2;
      const step = 2 + (index % 5);
      const values = Array.from({ length: termCount }, (_, position) => start + position * step);
      const answer = round(values.reduce((sum, value) => sum + value, 0) / termCount);
      const meta = baseMeta('averages-mixtures', 'avg', index, 40, 45, {
        concept: 'simple-average',
        prompt: `The ${termCount} aptitude scores are ${values.join(', ')}. What is their average?`,
        hints: ['Add every score before dividing.', `There are ${termCount} scores, so divide the total by ${termCount}.`],
        solution: [`Total = ${values.join(' + ')} = ${values.reduce((sum, value) => sum + value, 0)}.`, `Average = total ÷ ${termCount}.`, `The average is ${answer}.`],
        misconceptionTag: 'average-base'
      });
      questions.push(makeNumeric(meta, answer));
    } else if (difficulty === 'D2') {
      const local = index - 40;
      if (local % 2 === 0) {
        const firstCount = 8 + (local % 7);
        const secondCount = 6 + (local % 5);
        const firstAverage = 42 + (local % 13);
        const secondAverage = 58 + (local % 11);
        const total = firstCount * firstAverage + secondCount * secondAverage;
        const answer = round(total / (firstCount + secondCount));
        const meta = baseMeta('averages-mixtures', 'avg', index, 40, 45, {
          concept: 'weighted-average',
          prompt: `Group A has ${firstCount} learners averaging ${firstAverage}, while Group B has ${secondCount} learners averaging ${secondAverage}. What is the combined average?`,
          hints: ['The groups have different sizes, so do not average the two averages directly.', 'Convert each group average into a group total, then combine.'],
          solution: [`Group totals are ${firstCount} × ${firstAverage} = ${firstCount * firstAverage} and ${secondCount} × ${secondAverage} = ${secondCount * secondAverage}.`, `Combined total = ${total} for ${firstCount + secondCount} learners.`, `Combined average = ${total} ÷ ${firstCount + secondCount} = ${answer}.`],
          misconceptionTag: 'weighted-average'
        });
        questions.push(makeNumeric(meta, answer));
      } else {
        const itemCount = 5 + (local % 4);
        const targetAverage = 48 + (local % 19);
        const missingValue = 35 + ((local * 7) % 41);
        const knownTotal = targetAverage * itemCount - missingValue;
        const meta = baseMeta('averages-mixtures', 'avg', index, 40, 45, {
          concept: 'missing-value',
          prompt: `The average of ${itemCount} aptitude scores is ${targetAverage}. The total of ${itemCount - 1} known scores is ${knownTotal}. Find the missing score.`,
          hints: [`The total of all ${itemCount} scores is average × count.`, 'Subtract the known total from the required total.'],
          solution: [`Required total = ${targetAverage} × ${itemCount} = ${targetAverage * itemCount}.`, `Missing score = ${targetAverage * itemCount} − ${knownTotal}.`, `The missing score is ${missingValue}.`],
          misconceptionTag: 'average-base'
        });
        questions.push(makeNumeric(meta, missingValue));
      }
    } else {
      const local = index - 85;
      if (local % 2 === 0) {
        const countValues = 20 + (local % 9);
        const oldAverage = 52 + (local % 16);
        const removed = 31 + ((local * 3) % 19);
        const added = 72 + ((local * 5) % 22);
        const answer = round(oldAverage + (added - removed) / countValues);
        const meta = baseMeta('averages-mixtures', 'avg', index, 40, 45, {
          concept: 'replacement-average',
          prompt: `A group of ${countValues} candidates has an average score of ${oldAverage}. A score of ${removed} is corrected to ${added}. What is the new average?`,
          hints: ['Only the difference between the corrected and old score changes the total.', `Spread that change across ${countValues} candidates.`],
          solution: [`Score correction increases the total by ${added} − ${removed} = ${added - removed}.`, `Average increase = ${added - removed} ÷ ${countValues} = ${round((added - removed) / countValues)}.`, `New average = ${oldAverage} + ${round((added - removed) / countValues)} = ${answer}.`],
          misconceptionTag: 'average-base'
        });
        questions.push(makeNumeric(meta, answer));
      } else {
        const firstQuantity = 12 + (local % 7);
        const secondQuantity = 8 + (local % 6);
        const firstPrice = 44 + (local % 15);
        const secondPrice = 68 + (local % 17);
        const answer = round((firstQuantity * firstPrice + secondQuantity * secondPrice) / (firstQuantity + secondQuantity));
        const meta = baseMeta('averages-mixtures', 'avg', index, 40, 45, {
          concept: 'mixture-value',
          prompt: `${firstQuantity} kg of material at ₹${firstPrice}/kg is mixed with ${secondQuantity} kg at ₹${secondPrice}/kg. What is the mixture's average cost per kg?`,
          hints: ['Find the cost of each portion before combining.', 'Divide total cost by total kilograms.'],
          solution: [`Total cost = ${firstQuantity} × ₹${firstPrice} + ${secondQuantity} × ₹${secondPrice} = ₹${firstQuantity * firstPrice + secondQuantity * secondPrice}.`, `Total quantity = ${firstQuantity + secondQuantity} kg.`, `Average cost = ₹${firstQuantity * firstPrice + secondQuantity * secondPrice} ÷ ${firstQuantity + secondQuantity} = ₹${answer}/kg.`],
          misconceptionTag: 'weighted-average'
        });
        questions.push(makeNumeric(meta, answer, { prefix: '₹', suffix: '/kg' }));
      }
    }
  }
  return questions;
}

const namePairs = [
  ['Aarav', 'Meera'], ['Kabir', 'Nisha'], ['Rohan', 'Tara'], ['Dev', 'Isha'], ['Arjun', 'Kavya'],
  ['Neel', 'Riya'], ['Vikram', 'Anaya'], ['Rahul', 'Diya'], ['Kiran', 'Maya'], ['Aditya', 'Leela'],
  ['Samar', 'Pooja'], ['Varun', 'Asha'], ['Nikhil', 'Sara'], ['Manav', 'Jaya'], ['Ishan', 'Reema']
];

function generateAges() {
  const questions = [];
  for (let index = 0; index < 110; index += 1) {
    const difficulty = levelFor(index, 40, 40);
    const [olderName, youngerName] = namePairs[index % namePairs.length];
    if (difficulty === 'D1') {
      const youngerParts = 2 + (index % 3);
      const olderParts = youngerParts + 2 + (index % 2);
      const partValue = 5 + (index % 10) + Math.floor(index / 10);
      const younger = youngerParts * partValue;
      const older = olderParts * partValue;
      const sum = younger + older;
      const meta = baseMeta('ages', 'age', index, 40, 40, {
        concept: 'present-age-ratio',
        prompt: `${olderName} and ${youngerName} have ages in the ratio ${olderParts}:${youngerParts}, and their ages total ${sum} years. How old is ${youngerName}?`,
        hints: [`The ratio contains ${olderParts + youngerParts} equal parts.`, 'Find one part from the total, then take the younger share.'],
        solution: [`One part = ${sum} ÷ ${olderParts + youngerParts} = ${partValue}.`, `${youngerName}'s age = ${youngerParts} × ${partValue}.`, `${youngerName} is ${younger} years old.`],
        misconceptionTag: 'age-ratio'
      });
      questions.push(makeNumeric(meta, younger, { suffix: ' years' }));
    } else if (difficulty === 'D2') {
      const local = index - 40;
      const yearsLater = 3 + (local % 6);
      const youngerParts = 3 + (local % 3);
      const olderParts = youngerParts + 2;
      const partValue = 6 + (local % 8);
      const younger = youngerParts * partValue - yearsLater;
      const older = olderParts * partValue - yearsLater;
      const difference = older - younger;
      const meta = baseMeta('ages', 'age', index, 40, 40, {
        concept: 'future-age-ratio',
        prompt: `${olderName} is ${difference} years older than ${youngerName}. After ${yearsLater} years, their ages will be in the ratio ${olderParts}:${youngerParts}. What is ${youngerName}'s present age?`,
        hints: ['The age difference remains unchanged after the same number of years.', `Let their future ages be ${olderParts}x and ${youngerParts}x.`],
        solution: [`Future age difference = (${olderParts} − ${youngerParts})x = ${difference}, so x = ${partValue}.`, `${youngerName}'s future age = ${youngerParts} × ${partValue} = ${younger + yearsLater}.`, `Present age = ${younger + yearsLater} − ${yearsLater} = ${younger}.`],
        misconceptionTag: 'age-time-shift'
      });
      questions.push(makeNumeric(meta, younger, { suffix: ' years' }));
    } else {
      const local = index - 80;
      const younger = 22 + (local % 12);
      const older = younger + 11 + (local % 7);
      const yearsAgo = 2 + (local % 5);
      const yearsLater = 4 + (local % 6);
      const pastRatio = ratioLabel(older - yearsAgo, younger - yearsAgo);
      const futureRatio = ratioLabel(older + yearsLater, younger + yearsLater);
      const answer = older + younger;
      const meta = baseMeta('ages', 'age', index, 40, 40, {
        concept: 'past-future-system',
        prompt: `${yearsAgo} years ago, ${olderName}:${youngerName} was ${pastRatio}. After ${yearsLater} years, it will be ${futureRatio}. What is the sum of their present ages?`,
        hints: ['Represent both present ages, then subtract for the past ratio and add for the future ratio.', 'The same present ages must satisfy both ratio equations.'],
        solution: [`The ratios correspond to present ages ${older} and ${younger}.`, `Check: past ages ${older - yearsAgo}:${younger - yearsAgo} simplify to ${pastRatio}; future ages ${older + yearsLater}:${younger + yearsLater} simplify to ${futureRatio}.`, `Present-age sum = ${older} + ${younger} = ${answer}.`],
        misconceptionTag: 'age-time-shift'
      });
      questions.push(makeNumeric(meta, answer, { suffix: ' years' }));
    }
  }
  return questions;
}

function generateProfitLoss() {
  const questions = [];
  for (let index = 0; index < 115; index += 1) {
    const difficulty = levelFor(index, 40, 45);
    if (difficulty === 'D1') {
      const cost = 400 + index * 25;
      const rate = 5 + (index % 8) * 5;
      const isProfit = index % 3 !== 0;
      const answer = round(cost * (isProfit ? 1 + rate / 100 : 1 - rate / 100));
      const meta = baseMeta('profit-loss', 'pnl', index, 40, 45, {
        concept: isProfit ? 'profit' : 'loss',
        prompt: `An item costs ₹${cost.toLocaleString('en-IN')}. It is sold at a ${rate}% ${isProfit ? 'profit' : 'loss'}. What is the selling price?`,
        hints: [`A ${rate}% ${isProfit ? 'profit adds to' : 'loss subtracts from'} the cost price.`, `Use cost × ${isProfit ? 1 + rate / 100 : 1 - rate / 100}.`],
        solution: [`${isProfit ? 'Profit' : 'Loss'} amount = ${rate}% of ₹${cost.toLocaleString('en-IN')} = ₹${round(cost * rate / 100).toLocaleString('en-IN')}.`, `Selling price = ₹${cost.toLocaleString('en-IN')} ${isProfit ? '+' : '−'} ₹${round(cost * rate / 100).toLocaleString('en-IN')}.`, `Selling price = ₹${answer.toLocaleString('en-IN')}.`],
        misconceptionTag: 'profit-base'
      });
      questions.push(makeNumeric(meta, answer, { prefix: '₹' }));
    } else if (difficulty === 'D2') {
      const local = index - 40;
      if (local % 2 === 0) {
        const marked = 900 + local * 40;
        const discount = 10 + (local % 5) * 5;
        const answer = round(marked * (1 - discount / 100));
        const meta = baseMeta('profit-loss', 'pnl', index, 40, 45, {
          concept: 'discount',
          prompt: `A product marked at ₹${marked.toLocaleString('en-IN')} is offered at a ${discount}% discount. Find the sale price.`,
          hints: ['Discount is calculated on the marked price.', `The customer pays ${100 - discount}% of the marked price.`],
          solution: [`Discount = ${discount}% of ₹${marked.toLocaleString('en-IN')} = ₹${round(marked * discount / 100).toLocaleString('en-IN')}.`, `Sale price = ₹${marked.toLocaleString('en-IN')} − ₹${round(marked * discount / 100).toLocaleString('en-IN')}.`, `Sale price = ₹${answer.toLocaleString('en-IN')}.`],
          misconceptionTag: 'profit-base'
        });
        questions.push(makeNumeric(meta, answer, { prefix: '₹' }));
      } else {
        const selling = 720 + local * 24;
        const profitRate = 10 + (local % 6) * 5;
        const answer = round(selling / (1 + profitRate / 100));
        const meta = baseMeta('profit-loss', 'pnl', index, 40, 45, {
          concept: 'reverse-profit',
          prompt: `An item is sold for ₹${selling.toLocaleString('en-IN')} at a ${profitRate}% profit. What was its cost price?`,
          hints: [`The selling price is ${100 + profitRate}% of cost.`, `Divide the selling price by ${1 + profitRate / 100}.`],
          solution: [`Selling price = ${1 + profitRate / 100} × cost price.`, `Cost price = ₹${selling.toLocaleString('en-IN')} ÷ ${1 + profitRate / 100}.`, `Cost price = ₹${answer.toLocaleString('en-IN')}.`],
          misconceptionTag: 'profit-base'
        });
        questions.push(makeNumeric(meta, answer, { prefix: '₹' }));
      }
    } else {
      const local = index - 85;
      if (local % 2 === 0) {
        const marked = 1600 + local * 55;
        const firstDiscount = 10 + (local % 4) * 5;
        const secondDiscount = 5 + (local % 3) * 5;
        const answer = round(marked * (1 - firstDiscount / 100) * (1 - secondDiscount / 100));
        const meta = baseMeta('profit-loss', 'pnl', index, 40, 45, {
          concept: 'successive-discounts',
          prompt: `A ₹${marked.toLocaleString('en-IN')} item receives successive discounts of ${firstDiscount}% and ${secondDiscount}%. What is the final price?`,
          hints: ['The second discount applies after the first one.', 'Multiply the remaining-price factors rather than adding the rates.'],
          solution: [`After ${firstDiscount}% off: ₹${marked.toLocaleString('en-IN')} × ${1 - firstDiscount / 100} = ₹${round(marked * (1 - firstDiscount / 100)).toLocaleString('en-IN')}.`, `Apply the second factor ${1 - secondDiscount / 100}.`, `Final price = ₹${answer.toLocaleString('en-IN')}.`],
          misconceptionTag: 'discount-chain'
        });
        questions.push(makeNumeric(meta, answer, { prefix: '₹' }));
      } else {
        const markup = 20 + (local % 6) * 5;
        const discount = 8 + (local % 5) * 4;
        const answer = round(((1 + markup / 100) * (1 - discount / 100) - 1) * 100);
        const meta = baseMeta('profit-loss', 'pnl', index, 40, 45, {
          concept: 'markup-and-discount',
          prompt: `A seller marks an item ${markup}% above cost and then gives a ${discount}% discount on the marked price. What is the resulting profit percentage?`,
          hints: ['Use a cost price of ₹100.', 'Apply markup first and discount second.'],
          solution: [`Let cost = ₹100; marked price = ₹${100 + markup}.`, `Selling price = ₹${100 + markup} × ${1 - discount / 100} = ₹${round((100 + markup) * (1 - discount / 100))}.`, `Profit percentage = ${answer}%.`],
          misconceptionTag: 'discount-chain'
        });
        questions.push(makeNumeric(meta, answer, { suffix: '%' }));
      }
    }
  }
  return questions;
}

function generateTimeWork() {
  const questions = [];
  for (let index = 0; index < 110; index += 1) {
    const difficulty = levelFor(index, 40, 40);
    if (difficulty === 'D1') {
      const firstDays = 8 + (index % 13);
      const secondDays = 12 + ((index * 3) % 15);
      const answer = round((firstDays * secondDays) / (firstDays + secondDays));
      const meta = baseMeta('time-work', 'wrk', index, 40, 40, {
        concept: 'combined-work',
        prompt: `Worker A can complete a project in ${firstDays} days and Worker B can complete the same project in ${secondDays} days. How many days will they take together?`,
        hints: [`A's rate is 1/${firstDays} and B's rate is 1/${secondDays} of the task per day.`, 'Add the rates, then take the reciprocal.'],
        solution: [`Combined rate = 1/${firstDays} + 1/${secondDays} = ${firstDays + secondDays}/${firstDays * secondDays}.`, `Time = ${firstDays * secondDays}/${firstDays + secondDays}.`, `Together they need ${answer} days.`],
        misconceptionTag: 'work-rates'
      });
      questions.push(makeNumeric(meta, answer, { suffix: ' days' }));
    } else if (difficulty === 'D2') {
      const local = index - 40;
      const firstWorkers = 8 + (local % 9);
      const firstDays = 12 + (local % 11);
      const secondWorkers = 5 + ((local * 2) % 12);
      const answer = round(firstWorkers * firstDays / secondWorkers);
      const meta = baseMeta('time-work', 'wrk', index, 40, 40, {
        concept: 'workers-and-days',
        prompt: `${firstWorkers} equally efficient workers finish a project in ${firstDays} days. How many days would ${secondWorkers} workers need for the same project?`,
        hints: ['The total work in worker-days stays fixed.', `Set ${firstWorkers} × ${firstDays} = ${secondWorkers} × required days.`],
        solution: [`Total work = ${firstWorkers} × ${firstDays} = ${firstWorkers * firstDays} worker-days.`, `Required days = ${firstWorkers * firstDays} ÷ ${secondWorkers}.`, `The project takes ${answer} days.`],
        misconceptionTag: 'worker-days'
      });
      questions.push(makeNumeric(meta, answer, { suffix: ' days' }));
    } else {
      const local = index - 80;
      const fillA = 10 + (local % 9);
      const fillB = 14 + ((local * 2) % 11);
      const leak = 35 + ((local * 3) % 16);
      const rate = 1 / fillA + 1 / fillB - 1 / leak;
      const answer = round(1 / rate);
      const meta = baseMeta('time-work', 'wrk', index, 40, 40, {
        concept: 'pipes-and-leaks',
        prompt: `Pipe A fills a tank in ${fillA} hours, Pipe B in ${fillB} hours, and a leak empties it in ${leak} hours. If all are open, when will the tank fill?`,
        hints: ['Filling rates are positive; the leak rate is negative.', `Net rate = 1/${fillA} + 1/${fillB} − 1/${leak}.`],
        solution: [`Net hourly rate = 1/${fillA} + 1/${fillB} − 1/${leak}.`, `This equals ${round(rate, 4)} tank per hour.`, `Time = 1 ÷ ${round(rate, 4)} = ${answer} hours.`],
        misconceptionTag: 'work-rates'
      });
      questions.push(makeNumeric(meta, answer, { suffix: ' hours' }));
    }
  }
  return questions;
}

function makeSeriesMcq(meta, sequence, answer, distractors) {
  meta.prompt = `Find the next term in the series: ${sequence.join(', ')}, ?`;
  meta.accessibility = meta.prompt;
  const alternatives = [...new Set([...distractors, answer + 1, answer - 1, answer + 2, answer - 2])]
    .filter((value) => Number.isFinite(value) && value !== answer)
    .slice(0, 3);
  return makeMcq(meta, String(answer), alternatives.map(String));
}

function generateSeries() {
  const questions = [];
  for (let index = 0; index < 110; index += 1) {
    const difficulty = levelFor(index, 40, 40);
    if (difficulty === 'D1') {
      if (index % 2 === 0) {
        const start = 3 + index;
        const difference = 2 + (index % 7);
        const sequence = Array.from({ length: 5 }, (_, position) => start + position * difference);
        const answer = sequence[4] + difference;
        const meta = baseMeta('series', 'ser', index, 40, 40, {
          concept: 'arithmetic-series', prompt: '',
          hints: ['Compare each term with the one before it.', `The constant difference is ${difference}.`],
          solution: [`Each gap is +${difference}.`, `Last visible term ${sequence[4]} + ${difference} = ${answer}.`, `The next term is ${answer}.`],
          misconceptionTag: 'series-rule'
        });
        questions.push(makeSeriesMcq(meta, sequence, answer, [answer - difference, answer + difference, answer + 2]));
      } else {
        const start = 2 + index;
        const factor = 2 + (index % 3);
        const sequence = Array.from({ length: 5 }, (_, position) => start * factor ** position);
        const answer = sequence[4] * factor;
        const meta = baseMeta('series', 'ser', index, 40, 40, {
          concept: 'geometric-series', prompt: '',
          hints: ['Check whether each term is multiplied by the same value.', `The constant multiplier is ${factor}.`],
          solution: [`Each term is the previous term × ${factor}.`, `${sequence[4]} × ${factor} = ${answer}.`, `The next term is ${answer}.`],
          misconceptionTag: 'series-rule'
        });
        questions.push(makeSeriesMcq(meta, sequence, answer, [sequence[4] + factor, answer - factor, answer + factor]));
      }
    } else if (difficulty === 'D2') {
      const local = index - 40;
      const start = 5 + local;
      const baseGap = 2 + (local % 5);
      const sequence = [start];
      for (let gap = 1; gap <= 4; gap += 1) sequence.push(sequence.at(-1) + baseGap * gap);
      const answer = sequence.at(-1) + baseGap * 5;
      const meta = baseMeta('series', 'ser', index, 40, 40, {
        concept: 'growing-differences', prompt: '',
        hints: ['Write the gaps between adjacent terms.', `The gaps are multiples of ${baseGap}.`],
        solution: [`Differences are ${[1, 2, 3, 4].map((value) => value * baseGap).join(', ')}.`, `The next difference is ${baseGap * 5}.`, `${sequence.at(-1)} + ${baseGap * 5} = ${answer}.`],
        misconceptionTag: 'series-rule'
      });
      questions.push(makeSeriesMcq(meta, sequence, answer, [answer - baseGap, answer + baseGap, sequence.at(-1) + baseGap * 4]));
    } else {
      const local = index - 80;
      const oddStart = 4 + local;
      const evenStart = 3 + (local % 9);
      const oddStep = 3 + (local % 5);
      const evenFactor = 2 + (local % 2);
      const sequence = [oddStart, evenStart, oddStart + oddStep, evenStart * evenFactor, oddStart + oddStep * 2, evenStart * evenFactor ** 2];
      const answer = oddStart + oddStep * 3;
      const meta = baseMeta('series', 'ser', index, 40, 40, {
        concept: 'interleaved-series', prompt: '',
        hints: ['Separate terms in odd positions from terms in even positions.', `Odd-position terms increase by ${oddStep}.`],
        solution: [`Odd positions are ${sequence[0]}, ${sequence[2]}, ${sequence[4]}, increasing by ${oddStep}.`, `Even positions follow a separate ×${evenFactor} pattern.`, `The seventh term is the next odd-position term: ${answer}.`],
        misconceptionTag: 'alternating-series'
      });
      questions.push(makeSeriesMcq(meta, sequence, answer, [answer + oddStep, sequence.at(-1) * evenFactor, answer - oddStep]));
    }
  }
  return questions;
}

const codingWords = [
  'APTITUDE', 'CAMPUS', 'LOGIC', 'NUMBER', 'VERBAL', 'REASON', 'SKILLS', 'GROWTH', 'PRACTICE', 'METHOD',
  'CAREER', 'LEARNER', 'FOCUS', 'RESULT', 'INTERVIEW', 'PROJECT', 'ANALYSE', 'PATTERN', 'SOLVE', 'REVIEW',
  'ACCURACY', 'READINESS', 'CONCEPT', 'MISSION', 'PLACEMENT', 'PROGRESS', 'EFFORT', 'INSIGHT', 'STRATEGY', 'BALANCE',
  'QUESTION', 'ANSWER', 'EXPLAIN', 'RECALL', 'ADAPTIVE', 'JOURNEY', 'IMPROVE', 'ATTEMPT', 'SUCCESS', 'CALM'
];

function shiftLetter(letter, amount) {
  const code = letter.charCodeAt(0) - 65;
  return String.fromCharCode(65 + ((code + amount) % 26 + 26) % 26);
}

function shiftWord(word, amount) {
  return [...word].map((letter, index) => shiftLetter(letter, typeof amount === 'function' ? amount(index) : amount)).join('');
}

function generateCoding() {
  const questions = [];
  for (let index = 0; index < 110; index += 1) {
    const difficulty = levelFor(index, 40, 40);
    const word = codingWords[index % codingWords.length];
    if (difficulty === 'D1') {
      const shift = 1 + (index % 5);
      const answer = shiftWord(word, shift);
      const meta = baseMeta('coding', 'cod', index, 40, 40, {
        concept: 'uniform-letter-shift',
        prompt: `Every letter in a code moves ${shift} place${shift === 1 ? '' : 's'} forward. How is ${word} coded?`,
        hints: [`Move each letter forward by ${shift}.`, 'Wrap from Z back to A when needed.'],
        solution: [`Apply a +${shift} shift to every letter.`, `${word} becomes ${answer}.`, `The code is ${answer}.`],
        misconceptionTag: 'code-direction'
      });
      questions.push(makeMcq(meta, answer, [shiftWord(word, -shift), shiftWord(word, shift + 1), [...answer].reverse().join('')]));
    } else if (difficulty === 'D2') {
      const local = index - 40;
      const shift = 1 + (local % 4);
      const reversed = [...word].reverse().join('');
      const answer = shiftWord(reversed, shift);
      const meta = baseMeta('coding', 'cod', index, 40, 40, {
        concept: 'reverse-and-shift',
        prompt: `A code reverses a word and then shifts every letter ${shift} place${shift === 1 ? '' : 's'} forward. What is the code for ${word}?`,
        hints: ['Reverse the original word before changing any letters.', `Then apply a +${shift} shift to the reversed letters.`],
        solution: [`Reverse ${word} to get ${reversed}.`, `Shift each reversed letter by +${shift}.`, `The final code is ${answer}.`],
        misconceptionTag: 'code-steps'
      });
      questions.push(makeMcq(meta, answer, [shiftWord(word, shift), reversed, shiftWord(reversed, -shift)]));
    } else {
      const local = index - 80;
      const baseShift = 1 + (local % 3);
      const answer = shiftWord(word, (position) => baseShift + position % 4);
      const meta = baseMeta('coding', 'cod', index, 40, 40, {
        concept: 'position-dependent-code',
        prompt: `In a coding rule, letters move forward by ${baseShift}, ${baseShift + 1}, ${baseShift + 2}, ${baseShift + 3} places repeatedly. How is ${word} coded?`,
        hints: ['The shift changes with position and repeats after the fourth letter.', `Write the shift row: ${baseShift}, ${baseShift + 1}, ${baseShift + 2}, ${baseShift + 3}, …`],
        solution: [`Apply repeating shifts +${baseShift}, +${baseShift + 1}, +${baseShift + 2}, +${baseShift + 3}.`, `Transform every letter in ${word} position by position.`, `The resulting code is ${answer}.`],
        misconceptionTag: 'code-steps'
      });
      questions.push(makeMcq(meta, answer, [shiftWord(word, baseShift), shiftWord(word, (position) => baseShift + (position + 1) % 4), [...answer].reverse().join('')]));
    }
  }
  return questions;
}

const categoryWords = [
  'analysts', 'coders', 'designers', 'writers', 'mentors', 'interns', 'graduates', 'researchers', 'planners', 'testers',
  'readers', 'speakers', 'artists', 'musicians', 'athletes', 'captains', 'volunteers', 'trainers', 'reviewers', 'editors',
  'builders', 'makers', 'leaders', 'scholars', 'thinkers', 'organisers', 'explorers', 'creators', 'advisers', 'managers',
  'engineers', 'architects', 'teachers', 'learners', 'coaches', 'auditors', 'scientists', 'presenters', 'strategists', 'consultants',
  'navigators', 'observers', 'facilitators', 'specialists', 'operators', 'coordinators', 'developers', 'innovators', 'evaluators', 'assistants',
  'directors', 'members', 'participants', 'fellows', 'experts', 'professionals', 'applicants', 'candidates', 'employees', 'students'
];

function syllogismCategories(index, offset = 0) {
  const starts = [index + offset, index * 2 + offset + 7, index * 3 + offset + 19];
  const used = new Set();
  return starts.map((start) => {
    let position = ((start % categoryWords.length) + categoryWords.length) % categoryWords.length;
    while (used.has(categoryWords[position])) position = (position + 1) % categoryWords.length;
    const category = categoryWords[position];
    used.add(category);
    return category;
  });
}

function generateSyllogisms() {
  const questions = [];
  for (let index = 0; index < 110; index += 1) {
    const difficulty = levelFor(index, 40, 40);
    const [a, b, c] = syllogismCategories(index, difficulty === 'D1' ? 0 : difficulty === 'D2' ? 13 : 29);
    if (difficulty === 'D1') {
      const template = index % 4;
      let statements; let correct; let distractors; let explanation;
      if (template === 0) {
        statements = `All ${a} are ${b}. All ${b} are ${c}.`;
        correct = `All ${a} are ${c}.`;
        distractors = [`All ${c} are ${a}.`, `No ${a} are ${c}.`, `Some ${b} are not ${c}.`];
        explanation = `The ${a} set sits inside ${b}, which sits inside ${c}.`;
      } else if (template === 1) {
        statements = `Some ${a} are ${b}. All ${b} are ${c}.`;
        correct = `Some ${a} are ${c}.`;
        distractors = [`All ${a} are ${c}.`, `No ${a} are ${c}.`, `All ${c} are ${a}.`];
        explanation = `The stated ${a} that are ${b} must also be ${c}.`;
      } else if (template === 2) {
        statements = `No ${a} are ${b}. All ${c} are ${a}.`;
        correct = `No ${c} are ${b}.`;
        distractors = [`All ${b} are ${c}.`, `Some ${c} are ${b}.`, `All ${a} are ${c}.`];
        explanation = `Every ${c} is an ${a}, and the ${a} set is separate from ${b}.`;
      } else {
        statements = `All ${a} are ${b}. No ${b} are ${c}.`;
        correct = `No ${a} are ${c}.`;
        distractors = [`All ${c} are ${a}.`, `Some ${a} are ${c}.`, `All ${b} are ${a}.`];
        explanation = `Anything inside ${a} is inside ${b}, which has no overlap with ${c}.`;
      }
      const meta = baseMeta('syllogisms', 'syl', index, 40, 40, {
        concept: 'direct-conclusion',
        prompt: `Treat these statements as true: ${statements} Which conclusion must follow?`,
        hints: ['Translate each statement into set containment or separation.', 'Choose only a conclusion that is guaranteed, not merely possible.'],
        solution: [`Statements: ${statements}`, explanation, `Therefore, “${correct}” must follow.`],
        misconceptionTag: 'syllogism-possibility'
      });
      questions.push(makeMcq(meta, correct, distractors));
    } else if (difficulty === 'D2') {
      const template = (index - 40) % 4;
      let statements; let first; let second; let correct; let explanation;
      if (template === 0) {
        statements = `All ${a} are ${b}. Some ${b} are ${c}.`;
        first = `Some ${b} are ${c}.`;
        second = `Some ${a} are ${c}.`;
        correct = 'Only conclusion I follows';
        explanation = 'Conclusion I repeats a stated overlap; the overlapping members need not belong to the smaller first class.';
      } else if (template === 1) {
        statements = `No ${a} are ${b}. Some ${c} are ${a}.`;
        first = `Some ${c} are not ${b}.`;
        second = `No ${c} are ${b}.`;
        correct = 'Only conclusion I follows';
        explanation = 'The stated members of the third class that are in the first class cannot be in the second, but other third-class members may be.';
      } else if (template === 2) {
        statements = `All ${a} are ${b}. No ${b} are ${c}.`;
        first = `No ${a} are ${c}.`;
        second = `Some ${c} are not ${a}.`;
        correct = 'Only conclusion I follows';
        explanation = 'Separation proves conclusion I; conclusion II assumes that the third class exists.';
      } else {
        statements = `Some ${a} are ${b}. Some ${b} are ${c}.`;
        first = `Some ${a} are ${c}.`;
        second = `All ${b} are ${a}.`;
        correct = 'Neither conclusion follows';
        explanation = 'The two “some” groups may be different members, and no universal relationship was stated.';
      }
      const meta = baseMeta('syllogisms', 'syl', index, 40, 40, {
        concept: 'two-conclusion-test',
        prompt: `Statements: ${statements} Conclusions: I. ${first} II. ${second} Which option is valid?`,
        hints: ['Test each conclusion separately.', 'Do not infer existence from a universal statement alone.'],
        solution: [`Map the statements without adding unstated overlap.`, explanation, `Answer: ${correct}.`],
        misconceptionTag: 'syllogism-possibility'
      });
      questions.push(makeMcq(meta, correct, ['Only conclusion II follows', 'Both conclusions follow', correct === 'Neither conclusion follows' ? 'Only conclusion I follows' : 'Neither conclusion follows']));
    } else {
      const local = index - 80;
      const template = local % 3;
      let statements; let first; let second; let correct; let explanation;
      if (template === 0) {
        statements = `All ${a} are ${b}. All ${b} are ${c}. Some ${a} exist.`;
        first = `Some ${c} are ${a}.`;
        second = `Some ${b} are ${a}.`;
        correct = 'Both conclusions follow';
        explanation = 'Existence is explicit, and each existing first-class member lies in both larger classes.';
      } else if (template === 1) {
        statements = `No ${a} are ${b}. All ${c} are ${b}. Some ${c} exist.`;
        first = `Some ${c} are not ${a}.`;
        second = `No ${c} are ${a}.`;
        correct = 'Both conclusions follow';
        explanation = 'Every third-class member is in the second class, which is disjoint from the first; existence also supports the particular conclusion.';
      } else {
        statements = `Some ${a} are ${b}. No ${b} are ${c}. All ${c} are ${a}.`;
        first = `Some ${a} are not ${c}.`;
        second = `Some ${b} are not ${c}.`;
        correct = 'Both conclusions follow';
        explanation = 'The stated members shared by the first and second classes cannot be in the third class, so they prove both conclusions.';
      }
      const meta = baseMeta('syllogisms', 'syl', index, 40, 40, {
        concept: 'linked-conclusions',
        prompt: `Statements: ${statements} Conclusions: I. ${first} II. ${second} Which option follows logically?`,
        hints: ['Use all three statements and note whether existence is explicit.', 'Track the particular “some” group through every exclusion.'],
        solution: ['Build the containment and exclusion chain.', explanation, `Answer: ${correct}.`],
        misconceptionTag: 'syllogism-possibility'
      });
      questions.push(makeMcq(meta, correct, ['Only conclusion I follows', 'Only conclusion II follows', 'Neither conclusion follows']));
    }
  }
  return questions;
}

const sentenceNames = [
  'Aarav', 'Meera', 'Kabir', 'Nisha', 'Rohan', 'Tara', 'Dev', 'Isha', 'Arjun', 'Kavya',
  'Neel', 'Riya', 'Samar', 'Pooja', 'Varun', 'Asha', 'Nikhil', 'Sara', 'Manav', 'Jaya',
  'Ishan', 'Reema', 'Aditi', 'Karan', 'Priya', 'Rahul', 'Sneha', 'Vivek', 'Ananya', 'Mohan',
  'Leela', 'Aditya', 'Diya', 'Kiran', 'Maya', 'Vikram', 'Anaya', 'Sameer', 'Naina', 'Harsh'
];
const sentenceObjects = [
  'reports', 'applications', 'projects', 'responses', 'documents', 'assignments', 'proposals', 'records', 'summaries', 'portfolios',
  'schedules', 'invoices', 'certificates', 'forms', 'spreadsheets', 'presentations', 'questionnaires', 'profiles', 'notices', 'checklists',
  'letters', 'memos', 'files', 'requests', 'evaluations', 'submissions', 'drafts', 'tickets', 'entries', 'statements',
  'receipts', 'plans', 'briefs', 'notes', 'surveys', 'agendas', 'transcripts', 'recommendations', 'registrations', 'assessments'
];

function sentenceTemplate(index, difficulty) {
  const name = sentenceNames[index % sentenceNames.length];
  const object = sentenceObjects[(index * 3) % sentenceObjects.length];
  const variant = difficulty === 'D1' ? index % 8 : difficulty === 'D2' ? index % 8 : index % 7;
  if (difficulty === 'D1') {
    const templates = [
      [`${name} do not understand the final instruction.`, 'do not understand', 'does not understand', ['does not understood', 'is not understand', 'do not understands'], 'subject–verb agreement'],
      [`Each of the ${object} have a reference number.`, 'have a reference number', 'has a reference number', ['having a reference number', 'have reference numbers', 'has reference numbers'], 'agreement with each'],
      [`${name} did not completed the timed section.`, 'did not completed', 'did not complete', ['has not completed yesterday', 'did not completes', 'not completed'], 'base verb after did'],
      [`${name} joined an university workshop.`, 'an university workshop', 'a university workshop', ['the university workshop', 'university an workshop', 'an unique workshop'], 'article by sound'],
      [`${name}'s dashboard displayed many informations.`, 'many informations', 'much information', ['many information', 'an information', 'informations'], 'uncountable noun'],
      [`One of the ${object} are missing.`, 'are missing', 'is missing', ['were missing', 'have missing', 'be missing'], 'singular head subject'],
      [`Neither ${name} nor the project members was ready for the assessment.`, 'was ready', 'were ready', ['is preparing', 'have ready', 'be ready'], 'plural agreement'],
      [`${name} have submitted the form.`, 'have submitted', 'has submitted', ['have submit', 'is submitted yesterday', 'has submit'], 'singular agreement']
    ];
    return templates[variant];
  }
  if (difficulty === 'D2') {
    const templates = [
      [`${name} has worked here since three years.`, 'since three years', 'for three years', ['from three years', 'since three year', 'during three years ago'], 'duration preposition'],
      [`The facilitator insisted to review the ${object}.`, 'insisted to review', 'insisted on reviewing', ['insisted for review', 'insisted reviewing to', 'insisted at reviewing'], 'fixed preposition'],
      [`By the time ${name} arrived, the test already started.`, 'already started', 'had already started', ['has already started', 'was already start', 'already starts'], 'past perfect sequence'],
      [`Neither ${name} nor the other learners was prepared.`, 'was prepared', 'were prepared', ['is preparing', 'has prepared', 'be prepared'], 'agreement with nearer subject'],
      [`${name} is senior than the other candidate.`, 'senior than', 'senior to', ['more senior than', 'senior from', 'senior over'], 'comparison preposition'],
      [`The company asked ${name} and I to present.`, 'and I', 'and me', ['and myself', 'with I', 'including myself only'], 'object pronoun'],
      [`If ${name} would practise, accuracy would improve.`, 'would practise', 'practised', ['will practised', 'had practice', 'would practiced'], 'conditional form'],
      [`${name} prefers reasoning than verbal practice.`, 'than verbal practice', 'to verbal practice', ['over than verbal practice', 'from verbal practice', 'with verbal practice'], 'prefer construction']
    ];
    return templates[variant];
  }
  const templates = [
    [`${name}'s role requires analysing data, clear writing, and to present findings.`, 'analysing data, clear writing, and to present findings', 'analysing data, writing clearly, and presenting findings', ['to analyse data, clear writing, and presenting findings', 'analysis data, writing clear, and presentations', 'analysing, to write, and presentation'], 'parallel structure'],
    [`Walking into the interview room, the questions seemed difficult to ${name}.`, 'the questions seemed difficult to ' + name, `${name} found the questions difficult`, [`the questions had difficulty for ${name}`, `difficulty was seemed by ${name}`, `the room made questions difficult`], 'dangling modifier'],
    [`The report prepared by ${name}, along with its appendices, were sent yesterday.`, 'were sent', 'was sent', ['have been sent', 'are sent yesterday', 'were send'], 'agreement with inserted phrase'],
    [`No sooner had ${name} submitted the test when the result appeared.`, 'when the result appeared', 'than the result appeared', ['then the result appeared', 'while result appears', 'as the result had appear'], 'paired conjunction'],
    [`The reason ${name} improved is because daily review became consistent.`, 'is because', 'is that', ['was due because', 'is owing because', 'being that because'], 'concise clause construction'],
    [`Having completed the ${object}, the laptop was closed by ${name}.`, 'the laptop was closed by ' + name, `${name} closed the laptop`, [`the laptop closed ${name}`, `closing was done to laptop`, `there was a closed laptop`], 'logical modifier subject'],
    [`Not only did ${name} solve the problem but also explained the shortcut.`, 'but also explained', 'but also explain', ['and also explained', 'but explaining also', 'also had explain'], 'parallel auxiliary form']
  ];
  return templates[variant];
}

function generateSentenceCorrection() {
  const questions = [];
  for (let index = 0; index < 110; index += 1) {
    const difficulty = levelFor(index, 40, 40);
    const [sentence, flawed, correct, distractors, rule] = sentenceTemplate(index, difficulty);
    const meta = baseMeta('sentence-correction', 'sen', index, 40, 40, {
      concept: rule.toLowerCase().replaceAll(' ', '-'),
      prompt: `Choose the best replacement for “${flawed}” in: ${sentence}`,
      hints: [`Check the ${rule} rule.`, 'Read the full sentence with each option and reject changes that create a new error.'],
      solution: [`The controlling rule is ${rule}.`, `Replace “${flawed}” with “${correct}”.`, `Corrected sentence: ${sentence.replace(flawed, correct)}`],
      misconceptionTag: 'sentence-rule'
    });
    questions.push(makeMcq(meta, correct, distractors));
  }
  return questions;
}

const jumbleTopics = [
  'a campus recycling drive', 'a placement study circle', 'a library digitisation project', 'a coding club workshop', 'a mock interview day',
  'a student garden project', 'a peer mentoring programme', 'a data-literacy seminar', 'a résumé review camp', 'a community tutoring plan',
  'a college sports meet', 'a robotics demonstration', 'a reading challenge', 'a clean-energy audit', 'a public-speaking club',
  'a career fair', 'a design sprint', 'a research poster event', 'a volunteer fundraiser', 'a language exchange'
];

const permutations = [
  [2, 0, 3, 1], [1, 3, 0, 2], [3, 1, 2, 0], [1, 0, 3, 2], [2, 3, 1, 0]
];

function jumbleQuestion(meta, orderedSentences, permutation) {
  const displayed = permutation.map((originalIndex) => orderedSentences[originalIndex]);
  const labels = ['A', 'B', 'C', 'D'];
  const correctOrder = orderedSentences.map((_, originalIndex) => labels[permutation.indexOf(originalIndex)]).join('-');
  const alternativeOne = correctOrder.split('-').toReversed().join('-');
  const parts = correctOrder.split('-');
  const alternativeTwo = [parts[0], parts[2], parts[1], parts[3]].join('-');
  const alternativeThree = [parts[1], parts[0], parts[3], parts[2]].join('-');
  meta.prompt = `Arrange the sentences into a coherent paragraph. ${displayed.map((sentence, index) => `${labels[index]}. ${sentence}`).join(' ')}`;
  meta.accessibility = meta.prompt;
  meta.solution = [
    `The opener introduces ${meta.contextLabel} without relying on an earlier reference.`,
    'Reference words and chronology connect the middle sentences.',
    `The coherent order is ${correctOrder}.`
  ];
  return makeMcq(meta, correctOrder, [alternativeOne, alternativeTwo, alternativeThree]);
}

function generateParaJumbles() {
  const questions = [];
  for (let index = 0; index < 110; index += 1) {
    const difficulty = levelFor(index, 40, 40);
    const topic = jumbleTopics[index % jumbleTopics.length];
    if (difficulty === 'D1') {
      const proposalReason = index < 20
        ? 'after a campus survey identified a recurring need'
        : 'after volunteers tested a smaller idea during orientation';
      const ordered = [
        `A student team proposed ${topic} ${proposalReason}.`,
        'The team then listed the people, materials, and time the plan would require.',
        'After receiving approval, the members ran a small trial.',
        'The trial results helped them improve the final version.'
      ];
      const meta = baseMeta('para-jumbles', 'par', index, 40, 40, {
        concept: 'chronological-order', prompt: '', contextLabel: topic,
        hints: ['Begin with the sentence that introduces the team and project.', '“The team”, “After receiving approval”, and “The trial” form a time chain.'],
        solution: [], misconceptionTag: 'paragraph-reference'
      });
      questions.push(jumbleQuestion(meta, ordered, permutations[index % permutations.length]));
    } else if (difficulty === 'D2') {
      const local = index - 40;
      const outreachEvidence = local < 20
        ? 'the announcement described the schedule but not the learner benefit'
        : 'the poster listed activities without showing a practical outcome';
      const ordered = [
        `The organisers of ${topic} noticed that early participation was low because ${outreachEvidence}.`,
        'This pattern suggested that students did not yet understand the practical benefit.',
        'They therefore replaced the general announcement with short demonstrations.',
        'As a result, registrations increased during the following week.'
      ];
      const meta = baseMeta('para-jumbles', 'par', index, 40, 40, {
        concept: 'reference-and-cause', prompt: '', contextLabel: topic,
        hints: ['“This pattern” must follow the observation it describes.', '“Therefore” gives a response, and “As a result” gives the outcome.'],
        solution: [], misconceptionTag: 'paragraph-reference'
      });
      questions.push(jumbleQuestion(meta, ordered, permutations[(local + 2) % permutations.length]));
    } else {
      const local = index - 80;
      if (local % 2 === 0) {
        const feedbackSource = local < 20 ? 'the first participant survey' : 'a follow-up facilitator review';
        const ordered = [
          `At first, feedback from ${feedbackSource} about ${topic} appeared contradictory.`,
          'Some participants valued its structure, whereas others wanted greater flexibility.',
          'A closer review showed that both groups were responding to different stages of the same process.',
          'The organisers consequently kept a common starting plan but allowed choices later.'
        ];
        const meta = baseMeta('para-jumbles', 'par', index, 40, 40, {
          concept: 'contrast-and-resolution', prompt: '', contextLabel: topic,
          hints: ['The paragraph begins with a contradiction and then identifies its two sides.', 'The final decision must follow the sentence that reconciles the feedback.'],
          solution: [], misconceptionTag: 'paragraph-reference'
        });
        questions.push(jumbleQuestion(meta, ordered, permutations[(local + 1) % permutations.length]));
      } else {
        const participants = 30 + local * 2;
        const passage = `A pilot for ${topic} invited ${participants} students. Attendance rose after organisers shortened each session, but survey ratings stayed unchanged. The team concluded that convenience improved participation while the learning experience still needed revision.`;
        const correct = 'Shorter sessions improved attendance, but not perceived quality.';
        const meta = baseMeta('para-jumbles', 'par', index, 40, 40, {
          concept: 'main-idea',
          prompt: `Read the passage and choose its best-supported conclusion: ${passage}`,
          hints: ['Separate the attendance result from the survey result.', 'Choose the option that reflects both outcomes without adding a new claim.'],
          solution: ['Attendance increased after sessions became shorter.', 'Ratings did not improve, so convenience and perceived quality changed differently.', `Therefore: ${correct}`],
          misconceptionTag: 'passage-inference'
        });
        questions.push(makeMcq(meta, correct, [
          'Shorter sessions automatically improved learning quality.',
          'Students stopped attending after the schedule changed.',
          'The pilot proved that no further revision was needed.'
        ]));
      }
    }
  }
  return questions;
}

export const GENERATED_QUESTIONS = Object.freeze([
  ...generateAverages(),
  ...generateAges(),
  ...generateProfitLoss(),
  ...generateTimeWork(),
  ...generateSeries(),
  ...generateCoding(),
  ...generateSyllogisms(),
  ...generateSentenceCorrection(),
  ...generateParaJumbles()
]);

export const GENERATED_QUESTION_COUNTS = Object.freeze({
  total: GENERATED_QUESTIONS.length,
  easy: GENERATED_QUESTIONS.filter((question) => question.difficulty === 'D1').length,
  medium: GENERATED_QUESTIONS.filter((question) => question.difficulty === 'D2').length,
  tough: GENERATED_QUESTIONS.filter((question) => question.difficulty === 'D3').length
});

export { GENERATED_CONTENT_VERSION };
