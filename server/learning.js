import { getQuestions, publicQuestion } from './questions.js';
import { newTopicState } from './store.js';

export const TOPICS = [
  {
    id: 'percentages',
    domain: 'Quantitative aptitude',
    shortDomain: 'Quant',
    name: 'Percentages',
    description: 'See the whole, compare change, and work backwards with confidence.',
    concepts: ['Percent of a whole', 'Percentage change', 'Reverse percentage', 'Successive change'],
    accent: 'indigo',
    icon: 'percent',
    questionCount: 30
  },
  {
    id: 'ratios',
    domain: 'Quantitative aptitude',
    shortDomain: 'Quant',
    name: 'Ratio & proportion',
    description: 'Scale relationships, split totals, and reason through mixtures.',
    concepts: ['Simplifying', 'Proportion', 'Sharing', 'Mixtures'],
    accent: 'emerald',
    icon: 'scale',
    questionCount: 30
  },
  {
    id: 'grammar',
    domain: 'Verbal ability',
    shortDomain: 'Verbal',
    name: 'Grammar & error spotting',
    description: 'Find the rule behind what sounds right and repair errors precisely.',
    concepts: ['Agreement', 'Tense', 'Articles', 'Usage'],
    accent: 'coral',
    icon: 'type',
    questionCount: 30
  }
];

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
  }
};

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

function appendUnique(target, candidates, count) {
  for (const candidate of candidates) {
    if (target.length >= count) break;
    if (!target.some((question) => question.id === candidate.id)) target.push(candidate);
  }
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
    for (const topic of TOPICS) {
      const pool = getQuestions({ topicId: topic.id }).filter((question) => question.difficulty !== 'D3');
      appendUnique(selected, [pool[1], pool[10]].filter(Boolean), selected.length + 2);
    }
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
    });
    const topics = dueTopics.length ? dueTopics : TOPICS;
    for (const topic of topics) {
      const pool = sortedCandidates(user, getQuestions({ topicId: topic.id }), difficultyFor(user.progress.topics[topic.id]));
      appendUnique(selected, pool, Math.min(6, selected.length + 2));
    }
    if (selected.length < 6) appendUnique(selected, sortedCandidates(user, getQuestions(), 'D2'), 6);
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
  appendUnique(selected, sortedCandidates(user, getQuestions({ topicId: growthTopic.id }), difficultyFor(growthState)), 4);

  const repairTopic = TOPICS.map((topic) => ({ topic, mistakes: Object.values(user.progress.topics[topic.id].misconceptions || {}).reduce((sum, value) => sum + value, 0) }))
    .sort((a, b) => b.mistakes - a.mistakes)[0]?.topic;
  if (repairTopic) appendUnique(selected, sortedCandidates(user, getQuestions({ topicId: repairTopic.id }), 'D1'), 5);

  const dueTopic = TOPICS.find((topic) => {
    const due = user.progress.topics[topic.id].reviewDue;
    return due && new Date(due) <= new Date();
  });
  if (dueTopic) appendUnique(selected, sortedCandidates(user, getQuestions({ topicId: dueTopic.id }), difficultyFor(user.progress.topics[dueTopic.id])), 7);

  for (const topic of TOPICS) appendUnique(selected, sortedCandidates(user, getQuestions({ topicId: topic.id }), difficultyFor(user.progress.topics[topic.id])), Math.min(8, selected.length + 1));
  appendUnique(selected, sortedCandidates(user, getQuestions(), 'D2'), 8);
  return selected.slice(0, 8);
}

export function applyAttempt(user, question, attempt) {
  ensureProgress(user);
  const state = user.progress.topics[question.topicId];
  const now = new Date();
  const independent = attempt.correct && !attempt.hintCount;
  const isTimedEvidence = attempt.mode === 'assessment';

  state.attempts += 1;
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

    if (isTimedEvidence && state.mastery >= 45) {
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
  const overallMastery = Math.round(topics.reduce((sum, topic) => sum + topic.mastery, 0) / topics.length);
  const overallReadiness = Math.round(topics.reduce((sum, topic) => sum + topic.readiness, 0) / topics.length);
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
    lesson: mission.type === 'diagnostic' ? null : LESSONS[topic.id],
    questions: questions.map((question) => publicQuestion(question, { hideLabels: mission.type === 'diagnostic' })),
    startedAt: mission.startedAt
  };
}

export function selectAssessmentQuestions(user) {
  ensureProgress(user);
  const selected = [];
  for (const topic of TOPICS) {
    const pool = sortedCandidates(user, getQuestions({ topicId: topic.id }).filter((question) => question.difficulty !== 'D1'), 'D2');
    appendUnique(selected, pool, selected.length + 4);
  }
  return selected.slice(0, 12);
}
