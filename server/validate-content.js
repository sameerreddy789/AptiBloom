import assert from 'node:assert/strict';
import { TOPIC_CATALOG } from './catalog.js';
import { GENERATED_QUESTIONS, GENERATED_QUESTION_COUNTS } from './question-generators.js';
import { QUESTIONS, contentSummary, evaluateAnswer, publicQuestion } from './questions.js';
import {
  ATLAS_SEALS,
  LESSONS,
  TOPICS,
  applyAttempt,
  assessmentSignals,
  awardSeals,
  dashboardFor,
  sealProgress,
  selectAssessmentQuestions,
  selectMissionQuestions
} from './learning.js';
import { migrateDatabase, newTopicState } from './store.js';

const EXPECTED_TOPIC_COUNTS = Object.freeze({
  percentages: 30,
  ratios: 30,
  'averages-mixtures': 115,
  ages: 110,
  'profit-loss': 115,
  'time-work': 110,
  series: 110,
  coding: 110,
  syllogisms: 110,
  grammar: 30,
  'sentence-correction': 110,
  'para-jumbles': 110
});
const FRIENDLY_DIFFICULTIES = Object.freeze({ D1: 'Easy', D2: 'Medium', D3: 'Tough' });
const PLACEHOLDER_OPTION = /^(cannot be determined|no change|none of these)$/i;
const ARTIFICIAL_VARIANT_MARKER = /practice set|in week \d+|review cycle|review round|training batch \d+|\btask \d+\b|code set \d+|\bvariant \d+\b/i;
const PRIVATE_FIELDS = ['answer', 'hints', 'solution', 'misconception', 'tolerance', 'reviewer', 'provenance'];

function canonicalAnswer(question) {
  return question.type === 'short-text' ? question.answer[0] : question.answer;
}

function freshUser() {
  return {
    id: 'content-validator',
    settings: { weeklyGoal: 4 },
    progress: {
      journeyXp: 0,
      petals: 0,
      weeklyDays: [],
      seals: {},
      topics: Object.fromEntries(TOPICS.map((topic) => [topic.id, newTopicState()]))
    },
    attempts: []
  };
}

function assertQuestionStructure(question) {
  assert.ok(question.id && question.prompt && question.topicId, `${question.id || 'Unknown item'} is incomplete`);
  assert.equal(question.difficultyLabel, FRIENDLY_DIFFICULTIES[question.difficulty], `${question.id} has the wrong difficulty label`);
  assert.ok(question.hints?.length >= 2, `${question.id} needs at least two hints`);
  assert.ok(question.solution?.length >= 3, `${question.id} needs at least three solution steps`);
  assert.ok(question.misconception?.title && question.misconception?.copy, `${question.id} needs misconception feedback`);
  assert.ok(evaluateAnswer(question, canonicalAnswer(question)), `${question.id} rejects its canonical answer`);

  if (question.options) {
    const labels = question.options.map((option) => option.label.trim().toLowerCase());
    assert.equal(new Set(labels).size, labels.length, `${question.id} has duplicate option labels`);
  }

  const publicData = publicQuestion(question);
  for (const field of PRIVATE_FIELDS) assert.ok(!(field in publicData), `${question.id} exposes ${field}`);
}

assert.equal(TOPIC_CATALOG.length, 12, 'The catalogue must contain 12 topics');
assert.equal(GENERATED_QUESTIONS.length, 1000, 'The generated bank must contain 1,000 questions');
assert.deepEqual(GENERATED_QUESTION_COUNTS, { total: 1000, easy: 360, medium: 370, tough: 270 });
assert.equal(QUESTIONS.length, 1090, 'The combined bank must contain 1,090 questions');

const summary = contentSummary();
assert.equal(summary.published, 90);
assert.equal(summary.pilot, 1000);
assert.deepEqual(summary.byDifficulty, { easy: 390, medium: 400, tough: 300 });
assert.deepEqual(Object.fromEntries(summary.byTopic.map((topic) => [topic.topicId, topic.count])), EXPECTED_TOPIC_COUNTS);
assert.deepEqual(Object.fromEntries(TOPIC_CATALOG.map((topic) => [topic.id, topic.questionCount])), EXPECTED_TOPIC_COUNTS);

const allIds = QUESTIONS.map((question) => question.id);
const generatedPrompts = GENERATED_QUESTIONS.map((question) => question.prompt.toLowerCase().replace(/\s+/g, ' ').trim());
assert.equal(new Set(allIds).size, allIds.length, 'Question IDs must be unique');
assert.equal(new Set(generatedPrompts).size, generatedPrompts.length, 'Generated prompts must be unique');
assert.ok(ARTIFICIAL_VARIANT_MARKER.test('Original prompt. Variant 42'), 'Artificial ordinal-marker validation must detect suffixed variants');

for (const question of QUESTIONS) assertQuestionStructure(question);
for (const question of GENERATED_QUESTIONS) {
  assert.equal(question.status, 'pilot', `${question.id} must remain pilot until human review`);
  assert.ok(question.provenance && question.reviewer, `${question.id} needs provenance and review metadata`);
  assert.ok(!ARTIFICIAL_VARIANT_MARKER.test(question.prompt), `${question.id} uses an artificial uniqueness marker`);
  if (question.options) {
    assert.ok(question.options.every((option) => !PLACEHOLDER_OPTION.test(option.label)), `${question.id} contains a placeholder option`);
  }
}

const generatedMcqs = GENERATED_QUESTIONS.filter((question) => question.type === 'mcq');
const answerIds = ['a', 'b', 'c', 'd'];
const globalAnswerCounts = answerIds.map((answerId) => generatedMcqs.filter((question) => question.answer === answerId).length);
assert.ok(Math.max(...globalAnswerCounts) < generatedMcqs.length * 0.3, 'Generated MCQ keys are globally concentrated in one position');
assert.ok(Math.min(...globalAnswerCounts) > generatedMcqs.length * 0.2, 'Generated MCQ keys underuse an answer position');

const prefixRangeGroups = new Map();
for (const question of generatedMcqs) {
  const prefix = question.id.match(/^[a-z]+/i)?.[0] || question.topicId;
  const key = `${prefix}:${question.difficulty}`;
  if (!prefixRangeGroups.has(key)) prefixRangeGroups.set(key, []);
  prefixRangeGroups.get(key).push(question);
}
let prefixRangePredictorMatches = 0;
for (const [key, questions] of prefixRangeGroups) {
  const counts = answerIds.map((answerId) => questions.filter((question) => question.answer === answerId).length);
  const largestCount = Math.max(...counts);
  prefixRangePredictorMatches += largestCount;
  assert.ok(largestCount / questions.length <= 0.4, `${key} over-concentrates generated MCQ keys in one position`);
}
assert.ok(prefixRangePredictorMatches < generatedMcqs.length * 0.32, 'Question prefix and difficulty range still predict generated MCQ keys');

const legacyKeyMatches = generatedMcqs.filter((question) => {
  const idHash = [...question.id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const predictedAnswer = ['a', 'b', 'c', 'd'][(4 - (idHash % 4)) % 4];
  return question.answer === predictedAnswer;
}).length;
assert.ok(legacyKeyMatches < generatedMcqs.length * 0.4, 'Public IDs still encode generated MCQ keys');

const v1PublishedFixtures = {
  'pct-001': { options: ['40', '45', '60', '50'], answer: 'd' },
  'pct-003': { options: ['72', '63', '54', '60'], answer: 'b' },
  'pct-005': { options: ['175', '182', '200', '180'], answer: 'd' }
};
for (const [questionId, fixture] of Object.entries(v1PublishedFixtures)) {
  const question = QUESTIONS.find((candidate) => candidate.id === questionId);
  const legacyQuestion = publicQuestion(question, { version: 1 });
  assert.deepEqual(legacyQuestion.options.map((option) => option.label), fixture.options, `${questionId} no longer reproduces its committed v1 option order`);
  assert.ok(evaluateAnswer(question, fixture.answer, 1), `${questionId} rejects its committed v1 answer ID`);
}

const remappedPublishedMcq = QUESTIONS.find((question) => {
  if (question.status !== 'published' || question.type !== 'mcq') return false;
  const correctLabel = question.options.find((option) => option.id === question.answer)?.label;
  const legacyAnswer = publicQuestion(question, { version: 1 }).options.find((option) => option.label === correctLabel)?.id;
  return legacyAnswer && legacyAnswer !== question.answer;
});
assert.ok(remappedPublishedMcq, 'At least one published MCQ must exercise versioned option compatibility');
const remappedCorrectLabel = remappedPublishedMcq.options.find((option) => option.id === remappedPublishedMcq.answer).label;
const legacyPublicQuestion = publicQuestion(remappedPublishedMcq, { version: 1 });
const legacyCorrectAnswer = legacyPublicQuestion.options.find((option) => option.label === remappedCorrectLabel).id;
assert.equal(legacyPublicQuestion.version, 1);
assert.ok(evaluateAnswer(remappedPublishedMcq, legacyCorrectAnswer, 1), 'A saved v1 option ID must still grade against its delivered label');
assert.ok(!evaluateAnswer(remappedPublishedMcq, legacyCorrectAnswer, 99), 'Unsupported question versions must not be graded');

const invalidSyllogisms = GENERATED_QUESTIONS.filter((question) =>
  question.topicId === 'syllogisms' && /\b(?:all|no)\s+([a-z-]+)\s+are\s+\1\b/i.test(question.prompt)
);
assert.deepEqual(invalidSyllogisms.map((question) => question.id), [], 'Syllogism classes must not collapse into self-relations');
assert.ok(GENERATED_QUESTIONS.every((question) => question.solution.every((step) => !/actually that also proves/i.test(step))), 'Solutions must not contradict themselves');

assert.equal(Object.keys(LESSONS).length, 12, 'Every topic needs an authored concept lesson');
assert.equal(new Set(TOPICS.map((topic) => LESSONS[topic.id]?.title)).size, 12, 'Topic lessons must be distinct');
for (const topic of TOPICS) assert.ok(LESSONS[topic.id]?.steps?.length >= 3, `${topic.id} needs a complete lesson`);

const diagnostic = selectMissionQuestions(freshUser(), 'diagnostic');
assert.equal(diagnostic.length, 6);
assert.equal(new Set(diagnostic.map((question) => question.topicId)).size, 6);
assert.equal(new Set(diagnostic.map((question) => question.domain)).size, 3);

const daily = selectMissionQuestions(freshUser(), 'daily');
assert.equal(daily.length, 8);
assert.equal(new Set(daily.map((question) => question.domain)).size, 3, 'Daily missions must span all three domains');
assert.ok(Math.max(...Object.values(daily.reduce((counts, question) => {
  counts[question.topicId] = (counts[question.topicId] || 0) + 1;
  return counts;
}, {}))) <= 4, 'Daily missions are over-concentrated in one topic');

const adversarialDailyUser = freshUser();
for (const topic of TOPICS) {
  adversarialDailyUser.progress.topics[topic.id].mastery = 50;
  adversarialDailyUser.progress.topics[topic.id].attempts = 3;
}
Object.assign(adversarialDailyUser.progress.topics.percentages, {
  mastery: 0,
  misconceptions: { 'percent-of': 9 },
  reviewDue: new Date(Date.now() - 86_400_000).toISOString()
});
const adversarialDaily = selectMissionQuestions(adversarialDailyUser, 'daily');
const adversarialDailyCounts = adversarialDaily.reduce((counts, question) => {
  counts[question.topicId] = (counts[question.topicId] || 0) + 1;
  return counts;
}, {});
assert.equal(adversarialDaily.length, 8);
assert.equal(new Set(adversarialDaily.map((question) => question.domain)).size, 3, 'A weak, mistaken, due topic must not collapse daily domain coverage');
assert.equal(adversarialDailyCounts.percentages, 4, 'The weakest topic should retain four focused daily questions');
assert.ok(Math.max(...Object.values(adversarialDailyCounts)) <= 4, 'A weak, mistaken, due topic exceeds the daily topic cap');

const dueUser = freshUser();
for (const topic of TOPICS) {
  dueUser.progress.topics[topic.id].mastery = 50;
  dueUser.progress.topics[topic.id].attempts = 1;
  dueUser.progress.topics[topic.id].reviewDue = new Date(Date.now() - 86_400_000).toISOString();
}
const review = selectMissionQuestions(dueUser, 'review');
assert.equal(review.length, 6);
assert.equal(new Set(review.map((question) => question.topicId)).size, 6);
assert.equal(new Set(review.map((question) => question.domain)).size, 3, 'Review missions must be domain-balanced');

const singleDueUser = freshUser();
singleDueUser.progress.topics.percentages.reviewDue = new Date(Date.now() - 86_400_000).toISOString();
const singleDueReview = selectMissionQuestions(singleDueUser, 'review');
const singleDueCounts = singleDueReview.reduce((counts, question) => {
  counts[question.topicId] = (counts[question.topicId] || 0) + 1;
  return counts;
}, {});
assert.equal(singleDueReview.length, 6);
assert.equal(new Set(singleDueReview.map((question) => question.domain)).size, 3, 'One due topic must not collapse review domain coverage');
assert.ok((singleDueCounts.percentages || 0) <= 2, 'One due topic exceeds the review topic cap');
assert.ok(Math.max(...Object.values(singleDueCounts)) <= 2, 'Review fallback exceeds the per-topic cap');

const assessment = selectAssessmentQuestions(freshUser());
assert.equal(assessment.length, 12);
assert.equal(new Set(assessment.map((question) => question.topicId)).size, 12);
assert.equal(new Set(assessment.map((question) => question.domain)).size, 3);
assert.ok(assessment.every((question) => ['D2', 'D3'].includes(question.difficulty)));

const assessmentBreakdown = assessmentSignals(assessment.map((question, index) => ({
  question,
  correct: index % 2 === 0
})));
assert.equal(assessmentBreakdown.byTopic.length, 12);
assert.ok(assessmentBreakdown.byTopic.every((signal) => signal.total === 1 && signal.signal === 'single-item'), 'Assessment topic results must remain labelled as single-item signals');
assert.equal(assessmentBreakdown.byDomain.length, 3);
assert.equal(assessmentBreakdown.byDomain.reduce((sum, domain) => sum + domain.total, 0), 12);
assert.equal(assessmentBreakdown.readinessPolicy, 'Only published assessment items update readiness; pilot items remain practice signals.');

const partialBreakdown = assessmentSignals(assessment.slice(0, 11).map((question) => ({ question, correct: true })), 'topic-sample-v2');
assert.equal(partialBreakdown.byTopic.filter((signal) => signal.signal === 'not-sampled').length, 1, 'A partial topic-sample report must identify unsampled paths');
const legacyAssessmentReview = QUESTIONS.filter((question) => question.topicId === 'percentages').slice(0, 4).map((question, index) => ({
  question,
  correct: index < 3
}));
const legacyBreakdown = assessmentSignals(legacyAssessmentReview, 'prototype-mixed-v1');
assert.equal(legacyBreakdown.byTopic.length, 1, 'Legacy reports must omit paths that were not sampled');
assert.equal(legacyBreakdown.byTopic[0].signal, 'multi-item');
assert.equal(legacyBreakdown.byTopic[0].total, 4);
assert.equal(legacyBreakdown.byTopic[0].accuracy, 75);

const existingUser = freshUser();
for (const topicId of ['percentages', 'ratios', 'grammar']) {
  existingUser.progress.topics[topicId].attempts = 10;
  existingUser.progress.topics[topicId].mastery = 100;
  existingUser.progress.topics[topicId].readiness = 100;
}
const existingDashboard = dashboardFor(existingUser);
assert.equal(existingDashboard.overall.mastery, 100, 'New unseen topics must not lower retained mastery');
assert.equal(existingDashboard.overall.readiness, 100, 'New unseen topics must not lower retained readiness');

const unevenEvidenceUser = freshUser();
Object.assign(unevenEvidenceUser.progress.topics.percentages, { attempts: 3, mastery: 0 });
Object.assign(unevenEvidenceUser.progress.topics.ratios, { attempts: 2, mastery: 20 });
Object.assign(unevenEvidenceUser.progress.topics.grammar, { attempts: 2, mastery: 20 });
unevenEvidenceUser.attempts = [
  { topicId: 'percentages', questionId: 'pct-001', mode: 'daily', correct: false, isRetry: false },
  { topicId: 'ratios', questionId: 'rat-001', mode: 'daily', correct: true, isRetry: false },
  { topicId: 'grammar', questionId: 'grm-001', mode: 'daily', correct: true, isRetry: false }
];
assert.equal(dashboardFor(unevenEvidenceUser).overall.mastery, 13, 'Established aggregation must not discard legitimate one- or two-attempt topics');

const retainedAssessment = selectAssessmentQuestions(existingUser);
for (const question of retainedAssessment) {
  const attempt = {
    questionId: question.id,
    topicId: question.topicId,
    correct: true,
    hintCount: 0,
    isRetry: false,
    mode: 'assessment',
    responseMs: 1000,
    missionId: 'retained-score-assessment'
  };
  applyAttempt(existingUser, question, attempt);
  existingUser.attempts.push(attempt);
}
const postAssessmentDashboard = dashboardFor(existingUser);
assert.equal(postAssessmentDashboard.overall.mastery, 100, 'One pilot assessment item per new topic must not dilute established mastery');
assert.equal(postAssessmentDashboard.overall.readiness, 100, 'Pilot-only assessment topics must not enter the readiness denominator');
assert.equal(postAssessmentDashboard.overall.masteryEvidenceTopics, 3, 'Mastery reporting must expose the denominator used for the aggregate');
assert.equal(postAssessmentDashboard.overall.practisedTopics, 12, 'Coverage must remain distinct from aggregate evidence');

const pilotUser = freshUser();
pilotUser.progress.topics.ages.mastery = 50;
const pilotQuestion = GENERATED_QUESTIONS.find((question) => question.topicId === 'ages');
applyAttempt(pilotUser, pilotQuestion, {
  correct: true,
  hintCount: 0,
  isRetry: false,
  mode: 'assessment',
  responseMs: 1000,
  missionId: 'pilot-readiness-check'
});
assert.equal(pilotUser.progress.topics.ages.readiness, 0, 'Pilot items must not increase placement readiness');
assert.equal(pilotUser.progress.topics.ages.readinessEvidence, 0, 'Pilot items must not enter the readiness denominator');

const publishedUser = freshUser();
publishedUser.progress.topics.percentages.mastery = 50;
const publishedQuestion = QUESTIONS.find((question) => question.topicId === 'percentages' && question.difficulty === 'D2' && question.status === 'published');
applyAttempt(publishedUser, publishedQuestion, {
  correct: true,
  hintCount: 0,
  isRetry: false,
  mode: 'assessment',
  responseMs: 1000,
  missionId: 'published-readiness-check'
});
assert.equal(publishedUser.progress.topics.percentages.readinessEvidence, 1, 'Published assessment items must create readiness evidence');
assert.ok(publishedUser.progress.topics.percentages.readiness > 0, 'Correct published assessment items must increase readiness');
assert.equal(dashboardFor(publishedUser).overall.readiness, publishedUser.progress.topics.percentages.readiness, 'Overall readiness must use published evidence topics');

const legacyReadinessUser = freshUser();
Object.assign(legacyReadinessUser.progress.topics.percentages, { attempts: 1, readiness: 60 });
Object.assign(legacyReadinessUser.progress.topics.ratios, { attempts: 1, readiness: 0 });
legacyReadinessUser.attempts = [
  { topicId: 'percentages', questionId: 'pct-011', mode: 'assessment', correct: true, isRetry: false },
  { topicId: 'ratios', questionId: 'rat-011', mode: 'assessment', correct: false, isRetry: false }
];
const migratedDatabase = migrateDatabase({ schemaVersion: 1, users: { legacy: legacyReadinessUser } });
assert.equal(migratedDatabase.schemaVersion, 2);
assert.equal(legacyReadinessUser.progress.topics.percentages.readinessEvidence, 1);
assert.equal(legacyReadinessUser.progress.topics.ratios.readinessEvidence, 1);
assert.equal(dashboardFor(legacyReadinessUser).overall.readiness, 30, 'A zero-readiness topic with published evidence must remain in the denominator');

const sealUser = freshUser();
const initialSeals = sealProgress(sealUser);
assert.equal(initialSeals.length, ATLAS_SEALS.length, 'Every atlas seal must be reported');
assert.deepEqual(initialSeals.filter((seal) => seal.earned).map((seal) => seal.id), [], 'A new explorer must not hold any seal');
assert.ok(initialSeals.every((seal) => seal.name && seal.requirement), 'Seals must disclose their requirement');

const sealById = (user, id) => sealProgress(user).find((seal) => seal.id === id);

sealUser.progress.topics.percentages.attempts = 2;
sealUser.attempts.push({ questionId: 'pct-001', topicId: 'percentages', mode: 'daily', correct: false, isRetry: false, missionId: 'seal-daily' });
awardSeals(sealUser);
assert.equal(sealById(sealUser, 'first-route').earned, false, 'An incorrect attempt must not earn First Route Charted');

sealUser.attempts.push({ questionId: 'pct-002', topicId: 'percentages', mode: 'daily', correct: true, isRetry: false, missionId: 'seal-daily' });
awardSeals(sealUser);
assert.equal(sealById(sealUser, 'first-route').earned, true, 'A correct attempt must earn First Route Charted');
assert.equal(sealById(sealUser, 'recall-keeper').earned, false, 'Practice alone must not earn Recall Keeper');

sealUser.attempts.push({ questionId: 'pct-003', topicId: 'percentages', mode: 'review', correct: false, isRetry: false, missionId: 'seal-review-failed' });
awardSeals(sealUser);
assert.equal(sealById(sealUser, 'recall-keeper').earned, false, 'A failed retrieval must not earn Recall Keeper');

sealUser.attempts.push({ questionId: 'pct-004', topicId: 'percentages', mode: 'review', correct: true, isRetry: false, missionId: 'seal-review' });
const awarded = awardSeals(sealUser);
assert.ok(awarded.some((seal) => seal.id === 'recall-keeper'), 'A correct waypoint revisit with nothing overdue must earn Recall Keeper');
assert.ok(sealById(sealUser, 'recall-keeper').earnedAt, 'Awarded seals must persist an earned timestamp');

sealUser.progress.topics.percentages.reviewDue = new Date(Date.now() - 86_400_000).toISOString();
sealUser.settings.weeklyGoal = 7;
assert.equal(sealById(sealUser, 'recall-keeper').earned, true, 'A persisted seal must never un-earn');
assert.equal(awardSeals(sealUser).length, 0, 'Seals must not be awarded twice');

const repairUser = freshUser();
repairUser.progress.topics.ratios.retriesSucceeded = 1;
awardSeals(repairUser);
assert.equal(sealById(repairUser, 'false-trail-repairer').earned, true, 'A successful alternate route must earn False-Trail Repairer');

const mappedSealUser = freshUser();
mappedSealUser.progress.topics.ratios.mastery = 60;
awardSeals(mappedSealUser);
assert.equal(sealById(mappedSealUser, 'route-mapped').earned, true, 'Route Mapped must match its stated 60% mastery requirement');

const unawardedUser = freshUser();
unawardedUser.progress.topics.ratios.mastery = 60;
assert.equal(sealById(unawardedUser, 'route-mapped').earned, false, 'Seals must only report persisted awards');

const pilotSealUser = freshUser();
pilotSealUser.progress.topics.ages.mastery = 50;
applyAttempt(pilotSealUser, GENERATED_QUESTIONS.find((question) => question.topicId === 'ages'), {
  correct: true,
  hintCount: 0,
  isRetry: false,
  mode: 'assessment',
  responseMs: 1000,
  missionId: 'pilot-seal-check'
});
awardSeals(pilotSealUser);
assert.equal(sealById(pilotSealUser, 'readiness-beacon').earned, false, 'Pilot evidence must not earn the readiness beacon seal');

const dashboardSeals = dashboardFor(freshUser()).seals;
assert.equal(dashboardSeals.length, ATLAS_SEALS.length, 'The dashboard must expose seal progress for the client');

const legacyUser = freshUser();
delete legacyUser.progress.seals;
legacyUser.progress.topics.grammar.mastery = 70;
legacyUser.attempts.push({ questionId: 'grm-001', topicId: 'grammar', mode: 'daily', correct: true, isRetry: false, missionId: 'legacy' });
const migratedSealDatabase = migrateDatabase({ schemaVersion: 1, users: { legacy: legacyUser } });
assert.equal(migratedSealDatabase.schemaVersion, 2);
assert.equal(sealById(legacyUser, 'first-route').earned, true, 'Migration must backfill seals already satisfied by existing evidence');
assert.ok(sealById(legacyUser, 'first-route').earnedAt, 'Backfilled seals must persist a timestamp');

const currentSchemaUser = freshUser();
currentSchemaUser.attempts.push({ questionId: 'pct-001', topicId: 'percentages', mode: 'daily', correct: true, isRetry: false, missionId: 'already-migrated' });
migrateDatabase({ schemaVersion: 2, users: { current: currentSchemaUser } });
assert.equal(sealById(currentSchemaUser, 'first-route').earned, false, 'Reading an already-migrated database must not award seals outside session-end moments');

console.log(`Validated ${QUESTIONS.length} questions across ${TOPICS.length} topics: ${summary.published} published, ${summary.pilot} pilot.`);
