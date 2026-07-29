import { getQuestion, getQuestions, publicQuestion } from './questions.js';
import { TOPIC_CATALOG } from './catalog.js';
import { newTopicState } from './store.js';

export const TOPICS = TOPIC_CATALOG;

export const LESSONS = {
  percentages: {
    eyebrow: 'Concept lab · 2 minutes',
    title: 'Start with the whole',
    summary: 'A percentage is a relationship to 100. Name the whole first; every calculation becomes easier after that.',
    visual: 'percent-grid',
    steps: [
      { label: 'Whole', value: '₹800', note: 'This is 100%.' },
      { label: 'Rate', value: '15%', note: 'That means 15 out of 100.' },
      { label: 'Part', value: '₹120', note: '0.15 × ₹800.' }
    ],
    check: 'If 10% is ₹80, another 5% is ₹40. Together, 15% is ₹120.'
  },
  ratios: {
    eyebrow: 'Concept lab · 2 minutes',
    title: 'Think in equal-sized parts',
    summary: 'A 3:2 ratio means five equal parts in total—not three things and two things of any size.',
    visual: 'ratio-bars',
    steps: [
      { label: 'Relationship', value: '3 : 2', note: 'Three parts to two parts.' },
      { label: 'Total parts', value: '5', note: 'Add the ratio terms.' },
      { label: 'If total = 40', value: '24 : 16', note: 'Each part is 8.' }
    ],
    check: 'Scaling both sides preserves the relationship: 3:2 = 6:4 = 24:16.'
  },
  grammar: {
    eyebrow: 'Concept lab · 2 minutes',
    title: 'Find the sentence anchor',
    summary: 'In error spotting, do not trust sound alone. Find the subject, time signal, or fixed expression that controls the form.',
    visual: 'sentence-map',
    steps: [
      { label: 'Subject', value: 'The list', note: 'This is the head noun.' },
      { label: 'Distraction', value: 'of candidates', note: 'Ignore it when matching the verb.' },
      { label: 'Verb', value: 'was posted', note: 'Singular subject, singular verb.' }
    ],
    check: 'Read the sentence without the middle phrase: “The list was posted.”'
  },
  'averages-mixtures': {
    eyebrow: 'Concept lab · 2 minutes',
    title: 'Turn every average back into a total',
    summary: 'Averages combine safely only after each group is converted to its total value. Group size is the weight.',
    visual: 'concept-map',
    steps: [
      { label: 'Recover totals', value: '8 × 60 = 480', note: 'Multiply each group average by its number of members.' },
      { label: 'Combine', value: '480 + 240', note: 'Add group totals and group sizes separately.' },
      { label: 'Re-average', value: '720 ÷ 12 = 60', note: 'Divide the combined total by the combined count.' }
    ],
    check: 'Never average two group averages directly unless both groups contain the same number of values.'
  },
  ages: {
    eyebrow: 'Concept lab · 2 minutes',
    title: 'Keep one present-age anchor',
    summary: 'Represent present ages first. Moving to the past or future changes every person by the same number of years.',
    visual: 'concept-map',
    steps: [
      { label: 'Present', value: 'A = x, B = x + 8', note: 'Use the fixed age difference to connect both people.' },
      { label: 'Shift time', value: 'After 4 years: +4', note: 'Add or subtract the same time shift from every age.' },
      { label: 'Solve', value: '(x + 12):(x + 4)', note: 'Apply the stated ratio only after shifting both ages.' }
    ],
    check: 'Age ratios change over time, but the difference between two people’s ages does not.'
  },
  'profit-loss': {
    eyebrow: 'Concept lab · 2 minutes',
    title: 'Name the percentage base',
    summary: 'Profit and loss use cost price as the base. Discount uses marked price. Keep those prices distinct.',
    visual: 'concept-map',
    steps: [
      { label: 'Choose a base', value: 'Cost = ₹100', note: 'A ₹100 base makes percentage movement visible.' },
      { label: 'Apply in order', value: 'Markup, then discount', note: 'Each percentage acts on the current amount.' },
      { label: 'Compare', value: 'Selling − cost', note: 'Return to cost price when finding profit or loss percent.' }
    ],
    check: 'Two successive percentage changes use multipliers; their rates should not simply be added.'
  },
  'time-work': {
    eyebrow: 'Concept lab · 2 minutes',
    title: 'Combine work rates, not completion times',
    summary: 'If a person finishes in t days, their one-day rate is 1/t of the work. Rates add when people work together.',
    visual: 'concept-map',
    steps: [
      { label: 'Convert', value: '12 days → 1/12', note: 'Write how much of the job is completed per day.' },
      { label: 'Combine', value: '1/12 + 1/18', note: 'Add helpers and subtract leaks or undoing work.' },
      { label: 'Invert', value: 'Rate → time', note: 'Take the reciprocal of the combined daily rate.' }
    ],
    check: 'For equally efficient workers on fixed work, workers × days remains constant.'
  },
  series: {
    eyebrow: 'Concept lab · 2 minutes',
    title: 'Test a pattern across every gap',
    summary: 'One pair can suggest many rules. Compare differences, ratios, and alternating positions before extending a series.',
    visual: 'concept-map',
    steps: [
      { label: 'Inspect', value: '4, 9, 16, 25', note: 'Check more than one transition before naming a rule.' },
      { label: 'Separate', value: '+5, +7, +9', note: 'Differences can reveal a second pattern.' },
      { label: 'Extend', value: '+11 → 36', note: 'Use the same rule for exactly one next step.' }
    ],
    check: 'If one rule does not fit every visible term, check odd and even positions as separate sequences.'
  },
  coding: {
    eyebrow: 'Concept lab · 2 minutes',
    title: 'Write each coding operation in order',
    summary: 'Coding questions become manageable when shifts, reversals, and position rules are applied one step at a time.',
    visual: 'concept-map',
    steps: [
      { label: 'Identify', value: 'Forward by 1', note: 'State the direction and size of the letter movement.' },
      { label: 'Transform', value: 'CAT → DBU', note: 'Apply the operation to every position consistently.' },
      { label: 'Verify', value: 'Z wraps to A', note: 'Check alphabet boundaries and multi-step order.' }
    ],
    check: 'When a rule says reverse then shift, changing that order usually produces a different code.'
  },
  syllogisms: {
    eyebrow: 'Concept lab · 2 minutes',
    title: 'Accept only what must follow',
    summary: 'Translate each statement into containment, overlap, or separation. Do not add existence or reverse a relationship.',
    visual: 'concept-map',
    steps: [
      { label: 'Map', value: 'All A are B', note: 'Place the entire A class inside B.' },
      { label: 'Link', value: 'No B are C', note: 'Keep the B and C classes separate.' },
      { label: 'Conclude', value: 'No A are C', note: 'Carry only guaranteed relationships through the chain.' }
    ],
    check: '“All A are B” does not mean “All B are A,” and it does not prove that any A exists.'
  },
  'sentence-correction': {
    eyebrow: 'Concept lab · 2 minutes',
    title: 'Let one grammar rule control the edit',
    summary: 'Locate the subject, time marker, pronoun role, modifier, or parallel structure before comparing replacements.',
    visual: 'concept-map',
    steps: [
      { label: 'Anchor', value: 'Each', note: 'Find the word that controls agreement or tense.' },
      { label: 'Remove noise', value: 'of the reports', note: 'Temporarily ignore phrases that do not control the verb.' },
      { label: 'Repair', value: 'has a number', note: 'Choose the smallest replacement that fixes the rule.' }
    ],
    check: 'Read the whole corrected sentence once more to ensure the replacement did not create a second error.'
  },
  'para-jumbles': {
    eyebrow: 'Concept lab · 2 minutes',
    title: 'Follow references and purpose',
    summary: 'A coherent paragraph introduces an idea, develops it through reference or cause, and closes with a result or implication.',
    visual: 'concept-map',
    steps: [
      { label: 'Open', value: 'Introduce the subject', note: 'The first sentence should not depend on an unexplained pronoun.' },
      { label: 'Connect', value: 'this, however, therefore', note: 'Use reference and transition words to link adjacent ideas.' },
      { label: 'Close', value: 'Result or conclusion', note: 'Place outcomes after the actions or evidence that caused them.' }
    ],
    check: 'For comprehension, choose what the passage supports—not a broader claim that merely sounds reasonable.'
  }
};

function genericLesson(topic) {
  const notes = [
    'Identify the quantities, statements, or sentence links that control the problem.',
    'Apply one rule at a time and keep each intermediate step visible.',
    'Check the result against the original wording before choosing an answer.'
  ];
  return {
    eyebrow: 'Concept lab · 2 minutes',
    title: `Build the ${topic.name} method`,
    summary: topic.description,
    visual: 'concept-map',
    steps: topic.concepts.slice(0, 3).map((concept, index) => ({
      label: `Move ${index + 1}`,
      value: concept,
      note: notes[index]
    })),
    check: `Name the ${topic.name.toLowerCase()} rule you are using, then verify that every step answers the exact question asked.`
  };
}

const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const DAY_MS = 24 * 60 * 60 * 1000;

function ensureProgress(user) {
  user.progress ??= { journeyXp: 0, petals: 0, weeklyDays: [], topics: {} };
  user.progress.topics ??= {};
  for (const topic of TOPICS) {
    user.progress.topics[topic.id] = {
      ...newTopicState(),
      ...(user.progress.topics[topic.id] || {})
    };
  }
  return user.progress;
}

function recentAttempts(user, topicId, count = 10) {
  return (user.attempts || []).filter((attempt) => attempt.topicId === topicId && !attempt.isRetry).slice(-count);
}

function attemptContentStatus(attempt) {
  return attempt.contentStatus || getQuestion(attempt.questionId)?.status || null;
}

function accuracy(attempts) {
  if (!attempts.length) return 0;
  return Math.round((attempts.filter((attempt) => attempt.correct).length / attempts.length) * 100);
}

function firstTryAccuracy(attempts) {
  const firstAttempts = attempts.filter((attempt) => !attempt.isRetry);
  return accuracy(firstAttempts);
}

function stateFor(topicState) {
  if (!topicState.attempts) return 'unseen';
  if (topicState.reviewDue && new Date(topicState.reviewDue) <= new Date() && topicState.mastery >= 55) return 'review-due';
  if (topicState.mastery >= 80 && topicState.reviewStage >= 1 && topicState.sessions.length >= 2) return 'mastered';
  if (topicState.mastery >= 60) return 'stable';
  if (topicState.mastery >= 25) return 'practising';
  return 'exploring';
}

function difficultyFor(state) {
  if (state.mastery >= 70) return 'D3';
  if (state.mastery >= 30) return 'D2';
  return 'D1';
}

function attemptedCountMap(user) {
  return (user.attempts || []).reduce((map, attempt) => {
    map[attempt.questionId] = (map[attempt.questionId] || 0) + 1;
    return map;
  }, {});
}

function sortedCandidates(user, candidates, preferredDifficulty) {
  const counts = attemptedCountMap(user);
  const difficultyOrder = preferredDifficulty === 'D3' ? ['D3', 'D2', 'D1'] : preferredDifficulty === 'D2' ? ['D2', 'D1', 'D3'] : ['D1', 'D2', 'D3'];
  return [...candidates].sort((a, b) => {
    const countDifference = (counts[a.id] || 0) - (counts[b.id] || 0);
    if (countDifference) return countDifference;
    return difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty);
  });
}

function appendUnique(target, candidates, targetLength, { maxPerTopic = Number.POSITIVE_INFINITY } = {}) {
  const topicCounts = target.reduce((counts, question) => {
    counts[question.topicId] = (counts[question.topicId] || 0) + 1;
    return counts;
  }, {});

  for (const candidate of candidates) {
    if (target.length >= targetLength) break;
    if (target.some((question) => question.id === candidate.id)) continue;
    if ((topicCounts[candidate.topicId] || 0) >= maxPerTopic) continue;
    target.push(candidate);
    topicCounts[candidate.topicId] = (topicCounts[candidate.topicId] || 0) + 1;
  }
}

function appendMissingDomains(user, target, topics, targetLength, maxPerTopic) {
  const representedDomains = new Set(target.map((question) => question.domain));
  const domainOrder = [...new Set(TOPICS.map((topic) => topic.domain))];

  for (const domain of domainOrder) {
    if (target.length >= targetLength) break;
    if (representedDomains.has(domain)) continue;

    for (const topic of topics.filter((candidate) => candidate.domain === domain)) {
      const previousLength = target.length;
      const pool = sortedCandidates(user, getQuestions({ topicId: topic.id }), difficultyFor(user.progress.topics[topic.id]));
      appendUnique(target, pool, Math.min(targetLength, target.length + 1), { maxPerTopic });
      if (target.length > previousLength) {
        representedDomains.add(domain);
        break;
      }
    }
  }
}

function balancedTopicOrder(topics) {
  const domainOrder = [...new Set(TOPICS.map((topic) => topic.domain))];
  const queues = domainOrder.map((domain) => topics.filter((topic) => topic.domain === domain));
  const ordered = [];
  const longestQueue = Math.max(0, ...queues.map((queue) => queue.length));
  for (let index = 0; index < longestQueue; index += 1) {
    for (const queue of queues) {
      if (queue[index]) ordered.push(queue[index]);
    }
  }
  return ordered;
}

export function weakestTopic(user) {
  ensureProgress(user);
  return TOPICS.reduce((weakest, topic) => {
    const state = user.progress.topics[topic.id];
    if (!weakest) return topic;
    const weakestState = user.progress.topics[weakest.id];
    if (state.mastery < weakestState.mastery) return topic;
    if (state.mastery === weakestState.mastery && state.attempts < weakestState.attempts) return topic;
    return weakest;
  }, null);
}

export function selectMissionQuestions(user, type = 'daily', topicId = null) {
  ensureProgress(user);
  const selected = [];

  if (type === 'diagnostic') {
    const diagnosticTopics = [...new Set(TOPICS.map((topic) => topic.domain))]
      .flatMap((domain) => {
        const domainTopics = TOPICS.filter((topic) => topic.domain === domain);
        return [domainTopics[0], domainTopics.at(-1)];
      })
      .filter(Boolean)
      .slice(0, 6);

    diagnosticTopics.forEach((topic, index) => {
      const difficulty = index % 2 === 0 ? 'D1' : 'D2';
      const pool = getQuestions({ topicId: topic.id, difficulty });
      appendUnique(selected, pool, selected.length + 1);
    });
    return selected;
  }

  if (type === 'topic') {
    const topic = TOPICS.find((candidate) => candidate.id === topicId) || weakestTopic(user);
    const topicState = user.progress.topics[topic.id];
    const pool = sortedCandidates(user, getQuestions({ topicId: topic.id }), difficultyFor(topicState));
    appendUnique(selected, pool, 8);
    return selected;
  }

  if (type === 'review') {
    const dueTopics = TOPICS.filter((topic) => {
      const due = user.progress.topics[topic.id].reviewDue;
      return due && new Date(due) <= new Date();
    }).sort((first, second) => new Date(user.progress.topics[first.id].reviewDue) - new Date(user.progress.topics[second.id].reviewDue));
    const dueTopicIds = new Set(dueTopics.map((topic) => topic.id));
    const topics = balancedTopicOrder(dueTopics.length ? dueTopics : TOPICS);
    const activeDomains = new Set(topics.map((topic) => topic.domain));
    const domainCount = new Set(TOPICS.map((topic) => topic.domain)).size;
    const firstPassLimit = 6 - (domainCount - activeDomains.size);

    for (const topic of topics) {
      if (selected.length >= firstPassLimit) break;
      const pool = sortedCandidates(user, getQuestions({ topicId: topic.id }), difficultyFor(user.progress.topics[topic.id]));
      appendUnique(selected, pool, Math.min(firstPassLimit, selected.length + 1), { maxPerTopic: 2 });
    }

    const nonDueTopics = balancedTopicOrder(TOPICS.filter((topic) => !dueTopicIds.has(topic.id)));
    appendMissingDomains(user, selected, nonDueTopics, 6, 2);

    if (selected.length < 6) {
      for (const topic of topics) {
        const pool = sortedCandidates(user, getQuestions({ topicId: topic.id }), difficultyFor(user.progress.topics[topic.id]));
        appendUnique(selected, pool, Math.min(6, selected.length + 1), { maxPerTopic: 2 });
      }
    }
    if (selected.length < 6) {
      for (const topic of nonDueTopics) {
        const pool = sortedCandidates(user, getQuestions({ topicId: topic.id }), difficultyFor(user.progress.topics[topic.id]));
        appendUnique(selected, pool, Math.min(6, selected.length + 1), { maxPerTopic: 2 });
      }
    }
    if (selected.length < 6) appendUnique(selected, sortedCandidates(user, getQuestions(), 'D2'), 6, { maxPerTopic: 2 });
    return selected.slice(0, 6);
  }

  if (type === 'recovery') {
    const topic = TOPICS.find((candidate) => candidate.id === topicId) || weakestTopic(user);
    const state = user.progress.topics[topic.id];
    const misconception = Object.entries(state.misconceptions || {}).sort((a, b) => b[1] - a[1])[0]?.[0];
    const focused = misconception ? getQuestions({ topicId: topic.id }).filter((question) => question.misconceptionTag === misconception) : [];
    appendUnique(selected, sortedCandidates(user, focused, 'D1'), 3);
    appendUnique(selected, sortedCandidates(user, getQuestions({ topicId: topic.id }), 'D2'), 4);
    return selected.slice(0, 4);
  }

  const growthTopic = weakestTopic(user);
  const growthState = user.progress.topics[growthTopic.id];
  const dailyTopicCap = 4;
  appendUnique(
    selected,
    sortedCandidates(user, getQuestions({ topicId: growthTopic.id }), difficultyFor(growthState)),
    4,
    { maxPerTopic: dailyTopicCap }
  );

  const coverageTopics = balancedTopicOrder(TOPICS.filter((topic) => topic.id !== growthTopic.id));
  appendMissingDomains(user, selected, coverageTopics, 8, dailyTopicCap);

  const repairCandidate = TOPICS.map((topic) => ({ topic, mistakes: Object.values(user.progress.topics[topic.id].misconceptions || {}).reduce((sum, value) => sum + value, 0) }))
    .sort((a, b) => b.mistakes - a.mistakes)[0];
  const repairTopic = repairCandidate?.mistakes > 0 ? repairCandidate.topic : null;
  if (repairTopic) {
    appendUnique(
      selected,
      sortedCandidates(user, getQuestions({ topicId: repairTopic.id }), 'D1'),
      Math.min(8, selected.length + 1),
      { maxPerTopic: dailyTopicCap }
    );
  }

  const dueTopic = TOPICS.filter((topic) => {
    const due = user.progress.topics[topic.id].reviewDue;
    return due && new Date(due) <= new Date();
  }).sort((first, second) => new Date(user.progress.topics[first.id].reviewDue) - new Date(user.progress.topics[second.id].reviewDue))[0];
  if (dueTopic) {
    appendUnique(
      selected,
      sortedCandidates(user, getQuestions({ topicId: dueTopic.id }), difficultyFor(user.progress.topics[dueTopic.id])),
      Math.min(8, selected.length + 2),
      { maxPerTopic: dailyTopicCap }
    );
  }

  const representedTopics = new Set(selected.map((question) => question.topicId));
  const fillTopics = balancedTopicOrder(TOPICS.filter((topic) => !representedTopics.has(topic.id)));
  for (const topic of fillTopics) {
    appendUnique(
      selected,
      sortedCandidates(user, getQuestions({ topicId: topic.id }), difficultyFor(user.progress.topics[topic.id])),
      Math.min(8, selected.length + 1),
      { maxPerTopic: dailyTopicCap }
    );
  }
  if (selected.length < 8) {
    for (const topic of balancedTopicOrder(TOPICS)) {
      appendUnique(
        selected,
        sortedCandidates(user, getQuestions({ topicId: topic.id }), difficultyFor(user.progress.topics[topic.id])),
        Math.min(8, selected.length + 1),
        { maxPerTopic: dailyTopicCap }
      );
    }
  }
  appendUnique(selected, sortedCandidates(user, getQuestions(), 'D2'), 8, { maxPerTopic: dailyTopicCap });
  return selected.slice(0, 8);
}

export function applyAttempt(user, question, attempt) {
  ensureProgress(user);
  const state = user.progress.topics[question.topicId];
  const now = new Date();
  const independent = attempt.correct && !attempt.hintCount;
  const isTimedEvidence = attempt.mode === 'assessment';
  const isPublishedReadinessEvidence = isTimedEvidence && question.status === 'published';

  state.attempts += 1;
  if (isPublishedReadinessEvidence) state.readinessEvidence += 1;
  state.lastPractisedAt = now.toISOString();
  if (!state.uniqueItems.includes(question.id)) state.uniqueItems.push(question.id);
  if (attempt.missionId && !state.sessions.includes(attempt.missionId)) state.sessions.push(attempt.missionId);
  state.uniqueItems = state.uniqueItems.slice(-50);
  state.sessions = state.sessions.slice(-20);

  if (attempt.correct) {
    state.correct += 1;
    if (!attempt.isRetry) state.firstTryCorrect += 1;
    if (attempt.hintCount) state.hintedCorrect += 1;
    if (attempt.isRetry) state.retriesSucceeded += 1;

    const difficultyWeight = question.difficulty === 'D3' ? 10 : question.difficulty === 'D2' ? 8 : 6;
    const evidence = attempt.isRetry ? 4 : attempt.hintCount ? 3 : difficultyWeight;
    state.mastery = Math.min(100, state.mastery + evidence);

    if (isPublishedReadinessEvidence && state.mastery >= 45) {
      const paceFactor = attempt.responseMs && attempt.responseMs <= question.expectedSeconds * 1000 ? 6 : 3;
      state.readiness = Math.min(100, state.readiness + paceFactor);
    }

    const reviewIsDue = state.reviewDue && new Date(state.reviewDue) <= now;
    if (!state.reviewDue) {
      state.reviewStage = 0;
      state.reviewDue = new Date(now.getTime() + REVIEW_INTERVALS[0] * DAY_MS).toISOString();
    } else if (independent && (attempt.mode === 'review' || reviewIsDue)) {
      state.reviewStage = Math.min(REVIEW_INTERVALS.length - 1, state.reviewStage + 1);
      const days = REVIEW_INTERVALS[state.reviewStage];
      state.reviewDue = new Date(now.getTime() + days * DAY_MS).toISOString();
    }
  } else {
    state.mastery = Math.max(0, state.mastery - (question.difficulty === 'D3' ? 1 : 2));
    const tag = question.misconceptionTag || question.concept;
    state.misconceptions[tag] = (state.misconceptions[tag] || 0) + 1;
    state.reviewStage = 0;
    state.reviewDue = new Date(now.getTime() + DAY_MS).toISOString();
  }

  state.state = stateFor(state);
  const petals = attempt.correct ? (attempt.isRetry ? 1 : independent ? 2 : 1) : 0;
  const xp = attempt.correct ? (attempt.isRetry ? 5 : 10) : 2;
  user.progress.petals += petals;
  user.progress.journeyXp += xp;
  return { state, petals, xp };
}

export function completeMission(user, mission) {
  ensureProgress(user);
  const day = new Date().toISOString().slice(0, 10);
  if (!user.progress.weeklyDays.includes(day)) user.progress.weeklyDays.push(day);
  user.progress.weeklyDays = user.progress.weeklyDays.filter((date) => Date.now() - new Date(date).getTime() < 35 * DAY_MS);

  const attempts = (user.attempts || []).filter((attempt) => attempt.missionId === mission.id && !attempt.isRetry);
  const correct = attempts.filter((attempt) => attempt.correct).length;
  const retryWins = (user.attempts || []).filter((attempt) => attempt.missionId === mission.id && attempt.isRetry && attempt.correct).length;
  const completionBonus = attempts.length ? 3 : 0;
  user.progress.petals += completionBonus;
  user.progress.journeyXp += completionBonus * 5;

  return {
    questions: attempts.length,
    correct,
    accuracy: attempts.length ? Math.round((correct / attempts.length) * 100) : 0,
    retryWins,
    petalsEarned: attempts.reduce((sum, attempt) => sum + (attempt.reward?.petals || 0), 0) + completionBonus,
    xpEarned: attempts.reduce((sum, attempt) => sum + (attempt.reward?.xp || 0), 0) + completionBonus * 5,
    topics: topicProgress(user),
    recommendation: recommendationFor(user)
  };
}

export function topicProgress(user) {
  ensureProgress(user);
  return TOPICS.map((topic) => {
    const state = user.progress.topics[topic.id];
    const attempts = recentAttempts(user, topic.id, 12);
    return {
      ...topic,
      mastery: Math.round(state.mastery),
      readiness: Math.round(state.readiness),
      state: stateFor(state),
      attempts: state.attempts,
      firstTryAccuracy: firstTryAccuracy(attempts),
      reviewDue: state.reviewDue,
      lastPractisedAt: state.lastPractisedAt,
      misconception: Object.entries(state.misconceptions || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || null
    };
  });
}

export function recommendationFor(user) {
  ensureProgress(user);
  const due = TOPICS.find((topic) => {
    const value = user.progress.topics[topic.id].reviewDue;
    return value && new Date(value) <= new Date();
  });
  if (due) {
    return {
      type: 'review',
      topicId: due.id,
      title: `Review ${due.name}`,
      reason: `This review is due because your last ${due.name.toLowerCase()} practice is ready for retrieval.`,
      duration: '6 min'
    };
  }

  const weakest = weakestTopic(user);
  const state = user.progress.topics[weakest.id];
  const misconception = Object.entries(state.misconceptions || {}).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (misconception && state.misconceptions[misconception] >= 2) {
    return {
      type: 'recovery',
      topicId: weakest.id,
      title: `Repair ${weakest.name}`,
      reason: `A repeated ${misconception.replaceAll('-', ' ')} pattern makes this the most useful next step.`,
      duration: '5 min'
    };
  }
  if (state.mastery >= 65 && state.readiness < state.mastery - 20) {
    return {
      type: 'assessment',
      topicId: weakest.id,
      title: 'Train placement pace',
      reason: 'Your concept accuracy is stable; a short mixed sprint will now build pace.',
      duration: '10 min'
    };
  }
  return {
    type: 'daily',
    topicId: weakest.id,
    title: 'Start today’s Daily Bloom',
    reason: state.attempts ? `${weakest.name} is recommended because it has the most room to grow.` : `Begin with ${weakest.name} to create your first mastery signal.`,
    duration: '7 min'
  };
}

export function dashboardFor(user) {
  ensureProgress(user);
  const topics = topicProgress(user);
  const attempts = (user.attempts || []).filter((attempt) => !attempt.isRetry);
  const recent = attempts.slice(-20);
  const dueReviews = topics.filter((topic) => topic.reviewDue && new Date(topic.reviewDue) <= new Date()).length;
  const evidencedTopics = topics.filter((topic) => topic.attempts > 0);
  const masteryEvidenceTopics = evidencedTopics.filter((topic) => {
    if (topic.attempts >= 3) return true;
    const topicAttempts = attempts.filter((attempt) => attempt.topicId === topic.id);
    if (!topicAttempts.length) return true;
    return topicAttempts.some((attempt) => attempt.mode !== 'assessment' || attemptContentStatus(attempt) === 'published');
  });
  const masteryTopics = masteryEvidenceTopics.length ? masteryEvidenceTopics : evidencedTopics.length ? evidencedTopics : topics;
  const masteryEvidenceCount = masteryEvidenceTopics.length || evidencedTopics.length;
  const readinessTopics = topics.filter((topic) => {
    const state = user.progress.topics[topic.id];
    return state.readinessEvidence > 0 || topic.readiness > 0 || attempts.some((attempt) =>
      attempt.topicId === topic.id && attempt.mode === 'assessment' && attemptContentStatus(attempt) === 'published'
    );
  });
  const overallMastery = Math.round(masteryTopics.reduce((sum, topic) => sum + topic.mastery, 0) / masteryTopics.length);
  const overallReadiness = readinessTopics.length
    ? Math.round(readinessTopics.reduce((sum, topic) => sum + topic.readiness, 0) / readinessTopics.length)
    : 0;
  const weekStart = Date.now() - 7 * DAY_MS;
  const weeklyDays = [...new Set(user.progress.weeklyDays.filter((date) => new Date(date).getTime() >= weekStart))];

  const misconceptionCounts = {};
  for (const topic of TOPICS) {
    for (const [tag, count] of Object.entries(user.progress.topics[topic.id].misconceptions || {})) {
      misconceptionCounts[tag] = (misconceptionCounts[tag] || 0) + count;
    }
  }

  return {
    topics,
    recommendation: recommendationFor(user),
    dueReviews,
    overall: {
      mastery: overallMastery,
      readiness: overallReadiness,
      accuracy: accuracy(recent),
      attempted: attempts.length,
      practisedTopics: evidencedTopics.length,
      masteryEvidenceTopics: masteryEvidenceCount,
      totalTopics: topics.length,
      journeyLevel: Math.floor(user.progress.journeyXp / 120) + 1,
      journeyXp: user.progress.journeyXp,
      petals: user.progress.petals
    },
    weeklyRhythm: {
      completed: weeklyDays.length,
      goal: user.settings.weeklyGoal,
      days: weeklyDays
    },
    accuracyTrend: attempts.slice(-12).map((attempt, index) => ({
      index: index + 1,
      correct: attempt.correct,
      topicId: attempt.topicId
    })),
    misconceptions: Object.entries(misconceptionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([tag, count]) => ({ tag, count, label: tag.replaceAll('-', ' ') })),
    recentActivity: attempts.slice(-5).reverse()
  };
}

export function missionPayload(mission, questions, user) {
  const topic = TOPICS.find((candidate) => candidate.id === mission.topicId) || weakestTopic(user);
  const titles = {
    daily: 'Daily Bloom',
    diagnostic: 'Starting-point check',
    topic: `${topic.name} Focus Run`,
    review: 'Due review',
    recovery: `${topic.name} Recovery Mission`
  };
  return {
    id: mission.id,
    type: mission.type,
    title: titles[mission.type] || 'Learning mission',
    subtitle: mission.type === 'diagnostic' ? 'A calm estimate—not an intelligence label.' : 'Understand first. Build pace later.',
    topicId: topic.id,
    expectedMinutes: Math.max(4, Math.ceil(questions.length * 0.8)),
    lesson: mission.type === 'diagnostic' ? null : (LESSONS[topic.id] || genericLesson(topic)),
    questions: questions.map((question) => publicQuestion(question, {
      hideLabels: mission.type === 'diagnostic',
      version: mission.questionVersions?.[question.id] ?? 1
    })),
    startedAt: mission.startedAt
  };
}

export function selectAssessmentQuestions(user) {
  ensureProgress(user);
  const selected = [];
  for (const topic of TOPICS) {
    const pool = sortedCandidates(user, getQuestions({ topicId: topic.id }).filter((question) => question.difficulty !== 'D1'), 'D2');
    appendUnique(selected, pool, selected.length + 1);
  }
  return selected;
}

export function assessmentSignals(review, blueprint = 'topic-sample-v2') {
  const isTopicSample = blueprint === 'topic-sample-v2';
  const byTopic = TOPICS.map((topic) => {
    const topicReview = review.filter((item) => item.question.topicId === topic.id);
    const correct = topicReview.filter((item) => item.correct).length;
    const total = topicReview.length;
    const accuracy = total ? Math.round((correct / total) * 100) : 0;
    const signal = total === 0 ? 'not-sampled' : total === 1 ? 'single-item' : 'multi-item';
    let nextAction;
    if (signal === 'not-sampled') {
      nextAction = 'This path was not sampled in this sprint; use a Focus Run to create evidence.';
    } else if (signal === 'single-item') {
      nextAction = correct
        ? 'One sampled item held; keep practising before treating this as a stable trend.'
        : 'One sampled item needs review; use an untimed Focus Run for stronger evidence.';
    } else {
      nextAction = accuracy >= 75
        ? `${correct} of ${total} sampled items held; keep building evidence before treating this as a stable trend.`
        : `${total - correct} of ${total} sampled items need review; use an untimed Focus Run next.`;
    }
    return { topicId: topic.id, name: topic.name, correct, total, accuracy, signal, nextAction };
  }).filter((signal) => isTopicSample || signal.total > 0);

  const byDomain = [...new Set(TOPICS.map((topic) => topic.domain))].map((domain) => {
    const domainReview = review.filter((item) => item.question.domain === domain);
    const correct = domainReview.filter((item) => item.correct).length;
    return {
      domain,
      correct,
      total: domainReview.length,
      accuracy: domainReview.length ? Math.round((correct / domainReview.length) * 100) : 0
    };
  }).filter((signal) => isTopicSample || signal.total > 0);

  return {
    byTopic,
    byDomain,
    readinessPolicy: 'Only published assessment items update readiness; pilot items remain practice signals.'
  };
}
