import http from 'node:http';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import {
  createOrResumeSession,
  deleteUserForSession,
  ensureStore,
  getSessionUser,
  isoNow,
  readDatabase,
  removeSession,
  sanitizeUser,
  updateDatabase,
  updateSessionUser
} from './server/store.js';
import {
  CONTENT_VERSION,
  QUESTIONS,
  contentCatalogue,
  contentSummary,
  correctAnswerDisplay,
  evaluateAnswer,
  findNearNeighbour,
  getQuestion,
  publicQuestion
} from './server/questions.js';
import {
  TOPICS,
  applyAttempt,
  completeMission,
  dashboardFor,
  missionPayload,
  recommendationFor,
  selectAssessmentQuestions,
  selectMissionQuestions,
  topicProgress
} from './server/learning.js';

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const JSON_LIMIT = 1024 * 1024;
const rateBuckets = new Map();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function securityHeaders(contentType = 'application/json; charset=utf-8') {
  return {
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
  };
}

function jsonResponse(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    ...securityHeaders(),
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  response.end(JSON.stringify(payload));
}

function apiError(response, statusCode, code, message, details = undefined) {
  jsonResponse(response, statusCode, {
    error: { code, message, ...(details ? { details } : {}) }
  });
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > JSON_LIMIT) {
      const error = new Error('Request body is too large.');
      error.statusCode = 413;
      throw error;
    }
  }
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    const error = new Error('Request body must be valid JSON.');
    error.statusCode = 400;
    throw error;
  }
}

function bearerToken(request) {
  const authorization = request.headers.authorization || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
}

async function authenticated(request, response) {
  const token = bearerToken(request);
  const auth = await getSessionUser(token);
  if (!auth) {
    apiError(response, 401, 'AUTH_REQUIRED', 'Sign in or continue as a guest to use AptiBloom.');
    return null;
  }
  return { ...auth, token };
}

function allowRequest(request, key, limit = 60, windowMs = 60_000) {
  const identity = `${request.socket.remoteAddress || 'local'}:${key}`;
  const now = Date.now();
  const entries = (rateBuckets.get(identity) || []).filter((time) => now - time < windowMs);
  if (entries.length >= limit) return false;
  entries.push(now);
  rateBuckets.set(identity, entries);
  return true;
}

function publicBootstrap(user) {
  return {
    user: sanitizeUser(user),
    dashboard: dashboardFor(user),
    topics: TOPICS,
    content: contentSummary(),
    serverTime: isoNow()
  };
}

function cleanProfile(body) {
  const allowed = ['placementWindow', 'target', 'confidence', 'weeklyMinutes', 'chosenStart', 'onboardingComplete'];
  return Object.fromEntries(allowed.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]));
}

function cleanSettings(body) {
  const result = {};
  if (['light', 'dark', 'system'].includes(body.theme)) result.theme = body.theme;
  if (typeof body.reducedMotion === 'boolean') result.reducedMotion = body.reducedMotion;
  if (typeof body.quietMode === 'boolean') result.quietMode = body.quietMode;
  if (typeof body.socialComparison === 'boolean') result.socialComparison = body.socialComparison;
  if (Number.isInteger(Number(body.weeklyGoal)) && Number(body.weeklyGoal) >= 1 && Number(body.weeklyGoal) <= 7) result.weeklyGoal = Number(body.weeklyGoal);
  return result;
}

function missionFromDatabase(database, missionId, userId) {
  const mission = database.missions[missionId];
  return mission && mission.userId === userId ? mission : null;
}

function assessmentFromDatabase(database, assessmentId, userId) {
  const assessment = database.assessments[assessmentId];
  return assessment && assessment.userId === userId ? assessment : null;
}

async function handleApi(request, response, url) {
  const { pathname } = url;
  const method = request.method || 'GET';

  if (method === 'GET' && pathname === '/api/health') {
    return jsonResponse(response, 200, {
      status: 'ok',
      service: 'AptiBloom',
      contentVersion: CONTENT_VERSION,
      questions: QUESTIONS.length,
      time: isoNow()
    });
  }

  if (method === 'POST' && pathname === '/api/auth/session') {
    if (!allowRequest(request, 'auth', 20)) return apiError(response, 429, 'RATE_LIMITED', 'Please wait a moment before trying again.');
    const body = await readJson(request);
    const mode = body.mode === 'guest' ? 'guest' : 'email';
    const email = String(body.email || '').trim();
    if (mode === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiError(response, 400, 'INVALID_EMAIL', 'Enter a valid email address.');
    }
    const session = await createOrResumeSession({ mode, name: body.name, email });
    return jsonResponse(response, 201, session);
  }

  const auth = await authenticated(request, response);
  if (!auth) return;

  if (method === 'GET' && pathname === '/api/bootstrap') {
    return jsonResponse(response, 200, publicBootstrap(auth.user));
  }

  if (method === 'POST' && pathname === '/api/auth/logout') {
    await removeSession(auth.token);
    return jsonResponse(response, 200, { signedOut: true });
  }

  if (method === 'PATCH' && pathname === '/api/profile') {
    const body = await readJson(request);
    const result = await updateSessionUser(auth.token, (user) => {
      user.profile = { ...user.profile, ...cleanProfile(body) };
      if (body.name !== undefined && String(body.name).trim()) user.name = String(body.name).trim().slice(0, 60);
      return publicBootstrap(user);
    });
    return jsonResponse(response, 200, result);
  }

  if (method === 'PATCH' && pathname === '/api/settings') {
    const body = await readJson(request);
    const result = await updateSessionUser(auth.token, (user) => {
      user.settings = { ...user.settings, ...cleanSettings(body) };
      return { settings: user.settings, dashboard: dashboardFor(user) };
    });
    return jsonResponse(response, 200, result);
  }

  if (method === 'GET' && pathname === '/api/content') {
    return jsonResponse(response, 200, { summary: contentSummary(), questions: contentCatalogue() });
  }

  if (method === 'POST' && pathname === '/api/events') {
    const body = await readJson(request);
    await updateDatabase((database) => {
      database.events.push({
        id: randomUUID(),
        userId: auth.user.id,
        name: String(body.name || 'unknown').slice(0, 80),
        properties: body.properties && typeof body.properties === 'object' ? body.properties : {},
        createdAt: isoNow()
      });
      database.events = database.events.slice(-5000);
    });
    return jsonResponse(response, 202, { recorded: true });
  }

  if (method === 'POST' && pathname === '/api/missions') {
    if (!allowRequest(request, 'missions', 40)) return apiError(response, 429, 'RATE_LIMITED', 'Please wait before starting another mission.');
    const body = await readJson(request);
    const type = ['daily', 'diagnostic', 'topic', 'review', 'recovery'].includes(body.type) ? body.type : 'daily';
    const topicId = TOPICS.some((topic) => topic.id === body.topicId) ? body.topicId : null;
    const questions = selectMissionQuestions(auth.user, type, topicId);
    const mission = {
      id: randomUUID(),
      userId: auth.user.id,
      type,
      topicId: topicId || recommendationFor(auth.user).topicId,
      questionIds: questions.map((question) => question.id),
      retryIds: [],
      attempts: [],
      hints: [],
      startedAt: isoNow(),
      completedAt: null
    };
    await updateDatabase((database) => {
      database.missions[mission.id] = mission;
    });
    return jsonResponse(response, 201, missionPayload(mission, questions, auth.user));
  }

  const missionMatch = pathname.match(/^\/api\/missions\/([^/]+)$/);
  if (method === 'GET' && missionMatch) {
    const mission = missionFromDatabase(auth.database, missionMatch[1], auth.user.id);
    if (!mission) return apiError(response, 404, 'MISSION_NOT_FOUND', 'That mission could not be found.');
    const questions = mission.questionIds.map(getQuestion).filter(Boolean);
    return jsonResponse(response, 200, missionPayload(mission, questions, auth.user));
  }

  const hintMatch = pathname.match(/^\/api\/missions\/([^/]+)\/hint$/);
  if (method === 'POST' && hintMatch) {
    const body = await readJson(request);
    const result = await updateSessionUser(auth.token, (user, database) => {
      const mission = missionFromDatabase(database, hintMatch[1], user.id);
      if (!mission) return { error: 'MISSION_NOT_FOUND' };
      const question = getQuestion(body.questionId);
      if (!question || ![...mission.questionIds, ...mission.retryIds].includes(question.id)) return { error: 'QUESTION_NOT_FOUND' };
      const index = Math.max(0, Math.min(Number(body.index || 0), question.hints.length - 1));
      mission.hints.push({ questionId: question.id, index, at: isoNow() });
      return { hint: question.hints[index], index, remaining: Math.max(0, question.hints.length - index - 1) };
    });
    if (result?.error === 'MISSION_NOT_FOUND') return apiError(response, 404, result.error, 'That mission could not be found.');
    if (result?.error === 'QUESTION_NOT_FOUND') return apiError(response, 404, result.error, 'That question is not part of this mission.');
    return jsonResponse(response, 200, result);
  }

  const attemptMatch = pathname.match(/^\/api\/missions\/([^/]+)\/attempt$/);
  if (method === 'POST' && attemptMatch) {
    if (!allowRequest(request, 'attempt', 180)) return apiError(response, 429, 'RATE_LIMITED', 'Pause briefly before submitting again.');
    const body = await readJson(request);
    const result = await updateSessionUser(auth.token, (user, database) => {
      const mission = missionFromDatabase(database, attemptMatch[1], user.id);
      if (!mission) return { error: 'MISSION_NOT_FOUND' };
      if (mission.completedAt) return { error: 'MISSION_COMPLETE' };
      const question = getQuestion(body.questionId);
      if (!question || ![...mission.questionIds, ...mission.retryIds].includes(question.id)) return { error: 'QUESTION_NOT_FOUND' };
      if (mission.attempts.some((attempt) => attempt.questionId === question.id)) return { error: 'ALREADY_ANSWERED' };

      const correct = evaluateAnswer(question, body.answer);
      const attempt = {
        id: randomUUID(),
        missionId: mission.id,
        questionId: question.id,
        questionVersion: question.version,
        topicId: question.topicId,
        concept: question.concept,
        difficulty: question.difficulty,
        correct,
        suppliedAnswer: body.answer,
        hintCount: Math.max(0, Number(body.hintCount || 0)),
        responseMs: Math.max(0, Math.min(Number(body.responseMs || 0), 30 * 60 * 1000)),
        isRetry: Boolean(body.isRetry),
        originalQuestionId: body.originalQuestionId || null,
        mode: mission.type,
        createdAt: isoNow()
      };
      const reward = applyAttempt(user, question, attempt);
      attempt.reward = { petals: reward.petals, xp: reward.xp };
      user.attempts.push(attempt);
      user.attempts = user.attempts.slice(-2000);
      mission.attempts.push(attempt);

      let retryQuestion = null;
      if (!correct && !attempt.isRetry) {
        const neighbour = findNearNeighbour(question, [...mission.questionIds, ...mission.retryIds]);
        if (neighbour) {
          mission.retryIds.push(neighbour.id);
          retryQuestion = publicQuestion(neighbour);
        }
      }

      return {
        correct,
        label: correct ? (attempt.isRetry ? 'Repair complete' : 'Method secured') : 'Let’s repair this step',
        message: correct
          ? (attempt.hintCount ? 'The hint helped you rebuild the method. Try the next one independently.' : 'Your reasoning held. Keep that method—not just the answer.')
          : question.misconception?.copy || 'Review the smallest useful step, then try a nearby problem.',
        misconception: correct ? null : question.misconception,
        solutionSteps: question.solution,
        correctAnswer: correctAnswerDisplay(question),
        reward: attempt.reward,
        retryQuestion,
        topic: topicProgress(user).find((topic) => topic.id === question.topicId)
      };
    });

    const errors = {
      MISSION_NOT_FOUND: [404, 'That mission could not be found.'],
      MISSION_COMPLETE: [409, 'This mission has already been completed.'],
      QUESTION_NOT_FOUND: [404, 'That question is not part of this mission.'],
      ALREADY_ANSWERED: [409, 'This question has already been answered in the mission.']
    };
    if (result?.error) return apiError(response, errors[result.error]?.[0] || 400, result.error, errors[result.error]?.[1] || 'Unable to submit this answer.');
    return jsonResponse(response, 200, result);
  }

  const completeMatch = pathname.match(/^\/api\/missions\/([^/]+)\/complete$/);
  if (method === 'POST' && completeMatch) {
    const result = await updateSessionUser(auth.token, (user, database) => {
      const mission = missionFromDatabase(database, completeMatch[1], user.id);
      if (!mission) return { error: 'MISSION_NOT_FOUND' };
      if (mission.completedAt && mission.summary) return mission.summary;
      const answeredOriginals = new Set(mission.attempts.filter((attempt) => !attempt.isRetry).map((attempt) => attempt.questionId));
      if (answeredOriginals.size < mission.questionIds.length) return { error: 'MISSION_INCOMPLETE', answered: answeredOriginals.size, total: mission.questionIds.length };
      mission.completedAt = isoNow();
      mission.summary = completeMission(user, mission);
      return mission.summary;
    });
    if (result?.error === 'MISSION_NOT_FOUND') return apiError(response, 404, result.error, 'That mission could not be found.');
    if (result?.error === 'MISSION_INCOMPLETE') return apiError(response, 409, result.error, `Answer all ${result.total} mission questions before finishing.`, { answered: result.answered, total: result.total });
    return jsonResponse(response, 200, result);
  }

  if (method === 'POST' && pathname === '/api/assessments') {
    const questions = selectAssessmentQuestions(auth.user);
    const assessment = {
      id: randomUUID(),
      userId: auth.user.id,
      blueprint: 'prototype-mixed-v1',
      questionIds: questions.map((question) => question.id),
      durationSeconds: 12 * 60,
      startedAt: isoNow(),
      submittedAt: null,
      report: null
    };
    await updateDatabase((database) => {
      database.assessments[assessment.id] = assessment;
    });
    return jsonResponse(response, 201, {
      id: assessment.id,
      title: 'Mixed placement sprint',
      durationSeconds: assessment.durationSeconds,
      startedAt: assessment.startedAt,
      questions: questions.map((question, index) => ({ number: index + 1, ...publicQuestion(question, { hideLabels: true }) }))
    });
  }

  const assessmentMatch = pathname.match(/^\/api\/assessments\/([^/]+)$/);
  if (method === 'GET' && assessmentMatch) {
    const assessment = assessmentFromDatabase(auth.database, assessmentMatch[1], auth.user.id);
    if (!assessment) return apiError(response, 404, 'ASSESSMENT_NOT_FOUND', 'That assessment could not be found.');
    const questions = assessment.questionIds.map(getQuestion).filter(Boolean);
    return jsonResponse(response, 200, {
      id: assessment.id,
      title: 'Mixed placement sprint',
      durationSeconds: assessment.durationSeconds,
      startedAt: assessment.startedAt,
      submittedAt: assessment.submittedAt,
      report: assessment.report,
      questions: questions.map((question, index) => ({ number: index + 1, ...publicQuestion(question, { hideLabels: true }) }))
    });
  }

  const submitAssessmentMatch = pathname.match(/^\/api\/assessments\/([^/]+)\/submit$/);
  if (method === 'POST' && submitAssessmentMatch) {
    const body = await readJson(request);
    const result = await updateSessionUser(auth.token, (user, database) => {
      const assessment = assessmentFromDatabase(database, submitAssessmentMatch[1], user.id);
      if (!assessment) return { error: 'ASSESSMENT_NOT_FOUND' };
      if (assessment.submittedAt) return assessment.report;
      const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
      const review = [];

      for (const questionId of assessment.questionIds) {
        const question = getQuestion(questionId);
        if (!question) continue;
        const responseEntry = answers[questionId] && typeof answers[questionId] === 'object' && !Array.isArray(answers[questionId])
          ? answers[questionId]
          : { answer: answers[questionId] };
        const correct = evaluateAnswer(question, responseEntry.answer);
        const attempt = {
          id: randomUUID(),
          missionId: assessment.id,
          questionId: question.id,
          questionVersion: question.version,
          topicId: question.topicId,
          concept: question.concept,
          difficulty: question.difficulty,
          correct,
          suppliedAnswer: responseEntry.answer,
          hintCount: 0,
          responseMs: Math.max(0, Number(responseEntry.responseMs || 0)),
          isRetry: false,
          originalQuestionId: null,
          mode: 'assessment',
          createdAt: isoNow()
        };
        const reward = applyAttempt(user, question, attempt);
        attempt.reward = { petals: reward.petals, xp: reward.xp };
        user.attempts.push(attempt);
        review.push({
          question: publicQuestion(question, { hideLabels: false }),
          suppliedAnswer: responseEntry.answer,
          correct,
          correctAnswer: correctAnswerDisplay(question),
          solutionSteps: question.solution
        });
      }

      const byTopic = TOPICS.map((topic) => {
        const topicReview = review.filter((item) => item.question.topicId === topic.id);
        const correct = topicReview.filter((item) => item.correct).length;
        return {
          topicId: topic.id,
          name: topic.name,
          correct,
          total: topicReview.length,
          accuracy: topicReview.length ? Math.round((correct / topicReview.length) * 100) : 0,
          nextAction: correct / Math.max(1, topicReview.length) >= 0.75 ? 'Keep the method; train pace next.' : 'Return to an untimed Focus Run.'
        };
      });
      const correct = review.filter((item) => item.correct).length;
      assessment.submittedAt = isoNow();
      assessment.report = {
        assessmentId: assessment.id,
        submittedAt: assessment.submittedAt,
        score: correct,
        total: review.length,
        accuracy: review.length ? Math.round((correct / review.length) * 100) : 0,
        elapsedSeconds: Math.max(0, Number(body.elapsedSeconds || 0)),
        byTopic,
        readiness: topicProgress(user).map((topic) => ({ topicId: topic.id, name: topic.name, mastery: topic.mastery, readiness: topic.readiness })),
        nextRecommendation: recommendationFor(user),
        review
      };
      return assessment.report;
    });
    if (result?.error) return apiError(response, 404, result.error, 'That assessment could not be found.');
    return jsonResponse(response, 200, result);
  }

  const bookmarkMatch = pathname.match(/^\/api\/questions\/([^/]+)\/bookmark$/);
  if (method === 'POST' && bookmarkMatch) {
    const question = getQuestion(bookmarkMatch[1]);
    if (!question) return apiError(response, 404, 'QUESTION_NOT_FOUND', 'That question could not be found.');
    const result = await updateSessionUser(auth.token, (user) => {
      const index = user.bookmarks.indexOf(question.id);
      if (index >= 0) user.bookmarks.splice(index, 1);
      else user.bookmarks.push(question.id);
      return { bookmarked: index < 0, bookmarks: user.bookmarks };
    });
    return jsonResponse(response, 200, result);
  }

  const reportMatch = pathname.match(/^\/api\/questions\/([^/]+)\/report$/);
  if (method === 'POST' && reportMatch) {
    const question = getQuestion(reportMatch[1]);
    if (!question) return apiError(response, 404, 'QUESTION_NOT_FOUND', 'That question could not be found.');
    const body = await readJson(request);
    await updateDatabase((database) => {
      database.questionReports.push({
        id: randomUUID(),
        userId: auth.user.id,
        questionId: question.id,
        questionVersion: question.version,
        reason: String(body.reason || 'Needs review').slice(0, 500),
        status: 'open',
        createdAt: isoNow()
      });
    });
    return jsonResponse(response, 201, { reported: true, message: 'Thanks. This item is now in the review queue.' });
  }

  if (method === 'GET' && pathname === '/api/export') {
    const database = await readDatabase();
    const user = database.users[auth.user.id];
    const payload = {
      exportedAt: isoNow(),
      profile: sanitizeUser(user),
      attempts: user.attempts,
      methodology: 'AptiBloom transparent rules-based mastery model'
    };
    return jsonResponse(response, 200, payload, {
      'Content-Disposition': `attachment; filename="aptibloom-${user.id.slice(0, 8)}.json"`
    });
  }

  if (method === 'DELETE' && pathname === '/api/account') {
    const body = await readJson(request);
    if (body.confirmation !== 'DELETE') return apiError(response, 400, 'CONFIRMATION_REQUIRED', 'Type DELETE to confirm account deletion.');
    await deleteUserForSession(auth.token);
    return jsonResponse(response, 200, { deleted: true });
  }

  return apiError(response, 404, 'NOT_FOUND', 'The requested API route does not exist.');
}

async function serveStatic(request, response, url) {
  if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
    response.writeHead(405, securityHeaders('text/plain; charset=utf-8'));
    return response.end('Method not allowed');
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400, securityHeaders('text/plain; charset=utf-8'));
    return response.end('Bad request');
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  let filePath = path.resolve(PUBLIC_DIR, relativePath);
  const isInsidePublicDirectory = filePath === PUBLIC_DIR || filePath.startsWith(`${PUBLIC_DIR}${path.sep}`);
  if (!isInsidePublicDirectory) {
    response.writeHead(403, securityHeaders('text/plain; charset=utf-8'));
    return response.end('Forbidden');
  }

  try {
    const details = await stat(filePath);
    if (details.isDirectory()) filePath = path.join(filePath, 'index.html');
  } catch {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  try {
    const content = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extension] || 'application/octet-stream';
    response.writeHead(200, {
      ...securityHeaders(contentType),
      'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    if (request.method === 'HEAD') return response.end();
    response.end(content);
  } catch {
    response.writeHead(404, securityHeaders('text/plain; charset=utf-8'));
    response.end('Not found');
  }
}

await ensureStore();

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || `localhost:${PORT}`}`);
  try {
    if (url.pathname.startsWith('/api/')) await handleApi(request, response, url);
    else await serveStatic(request, response, url);
  } catch (error) {
    console.error('[AptiBloom]', error);
    if (!response.headersSent) {
      apiError(response, error.statusCode || 500, error.statusCode === 400 ? 'INVALID_JSON' : 'SERVER_ERROR', error.statusCode ? error.message : 'Something went wrong. Your progress is safe; please try again.');
    } else {
      response.end();
    }
  }
});

server.listen(PORT, () => {
  console.log(`AptiBloom is growing at http://localhost:${PORT}`);
  console.log(`Loaded ${QUESTIONS.length} reviewed questions across ${TOPICS.length} topics.`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
