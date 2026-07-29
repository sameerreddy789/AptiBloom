import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes, randomUUID } from 'node:crypto';
import path from 'node:path';
import { TOPIC_IDS } from './catalog.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'aptibloom.json');
const CURRENT_SCHEMA_VERSION = 2;
const LEGACY_PUBLISHED_QUESTION_ID = /^(?:pct|rat|grm)-\d+$/;
let writeQueue = Promise.resolve();

const isoNow = () => new Date().toISOString();

function emptyDatabase() {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: isoNow(),
    users: {},
    sessions: {},
    missions: {},
    assessments: {},
    events: [],
    questionReports: []
  };
}

export function newTopicState() {
  return {
    attempts: 0,
    firstTryCorrect: 0,
    correct: 0,
    hintedCorrect: 0,
    retriesSucceeded: 0,
    uniqueItems: [],
    sessions: [],
    mastery: 0,
    readiness: 0,
    readinessEvidence: 0,
    state: 'unseen',
    reviewStage: 0,
    reviewDue: null,
    lastPractisedAt: null,
    misconceptions: {}
  };
}

function defaultUser({ name, email = null, isGuest = false }) {
  const id = randomUUID();
  return {
    id,
    name: String(name || 'Learner').trim().slice(0, 60) || 'Learner',
    email,
    isGuest,
    role: 'learner',
    createdAt: isoNow(),
    updatedAt: isoNow(),
    profile: {
      onboardingComplete: false,
      placementWindow: '3–6 months',
      target: 'Campus placements',
      confidence: 'building',
      weeklyMinutes: 40,
      chosenStart: 'diagnostic'
    },
    settings: {
      theme: 'system',
      reducedMotion: false,
      quietMode: true,
      weeklyGoal: 4,
      socialComparison: false
    },
    progress: {
      journeyXp: 0,
      petals: 0,
      weeklyDays: [],
      topics: Object.fromEntries(TOPIC_IDS.map((topicId) => [topicId, newTopicState()]))
    },
    attempts: [],
    bookmarks: []
  };
}

function ensureUserShape(user) {
  user.profile ??= defaultUser({ name: user.name }).profile;
  user.settings ??= defaultUser({ name: user.name }).settings;
  user.progress ??= { journeyXp: 0, petals: 0, weeklyDays: [], topics: {} };
  user.progress.journeyXp ??= 0;
  user.progress.petals ??= 0;
  user.progress.weeklyDays ??= [];
  user.progress.topics ??= {};
  for (const topicId of TOPIC_IDS) {
    user.progress.topics[topicId] = {
      ...newTopicState(),
      ...(user.progress.topics[topicId] || {})
    };
  }
  user.attempts ??= [];
  user.bookmarks ??= [];
  return user;
}

export function migrateDatabase(database) {
  database.users ??= {};
  for (const user of Object.values(database.users)) ensureUserShape(user);

  if (Number(database.schemaVersion || 1) < 2) {
    for (const user of Object.values(database.users)) {
      const evidenceByTopic = {};
      for (const attempt of user.attempts) {
        if (attempt.isRetry || attempt.mode !== 'assessment') continue;
        const published = attempt.contentStatus === 'published' ||
          (!attempt.contentStatus && LEGACY_PUBLISHED_QUESTION_ID.test(String(attempt.questionId || '')));
        if (!published || !attempt.topicId) continue;
        evidenceByTopic[attempt.topicId] = (evidenceByTopic[attempt.topicId] || 0) + 1;
      }
      for (const [topicId, count] of Object.entries(evidenceByTopic)) {
        const state = user.progress.topics[topicId];
        if (state) state.readinessEvidence = Math.max(state.readinessEvidence || 0, count);
      }
    }
  }

  database.schemaVersion = CURRENT_SCHEMA_VERSION;
  return database;
}

export async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DB_PATH, 'utf8');
  } catch {
    await writeFile(DB_PATH, JSON.stringify(emptyDatabase(), null, 2), 'utf8');
  }
}

export async function readDatabase() {
  await ensureStore();
  const raw = await readFile(DB_PATH, 'utf8');
  return migrateDatabase(JSON.parse(raw));
}

export function updateDatabase(mutator) {
  const operation = writeQueue.then(async () => {
    const database = await readDatabase();
    const result = await mutator(database);
    await writeFile(DB_PATH, JSON.stringify(database, null, 2), 'utf8');
    return result;
  });
  writeQueue = operation.catch(() => undefined);
  return operation;
}

export async function createOrResumeSession({ mode, name, email }) {
  return updateDatabase((database) => {
    const normalizedEmail = mode === 'email' ? String(email || '').trim().toLowerCase() : null;
    let user = normalizedEmail
      ? Object.values(database.users).find((candidate) => candidate.email === normalizedEmail)
      : null;

    if (!user) {
      user = defaultUser({
        name: name || (mode === 'guest' ? 'Guest learner' : normalizedEmail?.split('@')[0]),
        email: normalizedEmail,
        isGuest: mode === 'guest'
      });
      database.users[user.id] = user;
    } else {
      ensureUserShape(user);
      if (name?.trim()) user.name = String(name).trim().slice(0, 60);
      user.updatedAt = isoNow();
    }

    const token = randomBytes(32).toString('hex');
    database.sessions[token] = {
      token,
      userId: user.id,
      createdAt: isoNow(),
      lastSeenAt: isoNow()
    };
    return { token, user: sanitizeUser(user) };
  });
}

export async function getSessionUser(token) {
  if (!token) return null;
  const database = await readDatabase();
  const session = database.sessions[token];
  if (!session) return null;
  const user = database.users[session.userId];
  if (!user) return null;
  ensureUserShape(user);
  return { database, session, user };
}

export async function updateSessionUser(token, mutator) {
  if (!token) return null;
  return updateDatabase(async (database) => {
    const session = database.sessions[token];
    if (!session || !database.users[session.userId]) return null;
    const user = ensureUserShape(database.users[session.userId]);
    session.lastSeenAt = isoNow();
    user.updatedAt = isoNow();
    return mutator(user, database, session);
  });
}

export async function removeSession(token) {
  if (!token) return;
  await updateDatabase((database) => {
    delete database.sessions[token];
  });
}

export async function deleteUserForSession(token) {
  return updateDatabase((database) => {
    const session = database.sessions[token];
    if (!session) return false;
    const userId = session.userId;
    delete database.users[userId];
    for (const [sessionToken, storedSession] of Object.entries(database.sessions)) {
      if (storedSession.userId === userId) delete database.sessions[sessionToken];
    }
    for (const [id, mission] of Object.entries(database.missions)) {
      if (mission.userId === userId) delete database.missions[id];
    }
    for (const [id, assessment] of Object.entries(database.assessments)) {
      if (assessment.userId === userId) delete database.assessments[id];
    }
    database.events = database.events.filter((event) => event.userId !== userId);
    return true;
  });
}

export function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isGuest: user.isGuest,
    role: user.role,
    createdAt: user.createdAt,
    profile: user.profile,
    settings: user.settings,
    progress: user.progress,
    bookmarks: user.bookmarks
  };
}

export { isoNow, randomUUID };
