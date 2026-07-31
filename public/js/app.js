import { api, ApiError, getToken, setToken } from './api.js';
import { icon, logoMark } from './icons.js';

const app = document.querySelector('#app');
const toastRegion = document.querySelector('#toast-region');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

const state = {
  bootstrap: null,
  busy: false,
  mobileNavOpen: false,
  mission: null,
  missionStage: 'intro',
  missionIndex: 0,
  currentQuestion: null,
  originalQuestion: null,
  isRetry: false,
  answer: null,
  hints: [],
  hintIndex: 0,
  feedback: null,
  solutionVisible: 1,
  questionStartedAt: 0,
  missionSummary: null,
  assessment: null,
  assessmentIndex: 0,
  assessmentAnswers: {},
  assessmentMarked: new Set(),
  assessmentReport: null,
  assessmentTimer: null,
  content: null,
  contentSearch: '',
  contentTopic: 'all',
  contentPage: 1
};

const REGIONS = [
  {
    id: 'coast',
    domain: 'Quantitative aptitude',
    name: 'Quantitative Coast',
    icon: 'mountain',
    blurb: 'Measured routes where every method has a base you can name.'
  },
  {
    id: 'wilds',
    domain: 'Logical reasoning',
    name: 'Logic Wilds',
    icon: 'trees',
    blurb: 'Branching trails where patterns must be proven, not guessed.'
  },
  {
    id: 'archives',
    domain: 'Verbal ability',
    name: 'Verbal Archives',
    icon: 'archive',
    blurb: 'Restored inscriptions where precise language carries the meaning.'
  }
];

const EXPLORER_RANKS = [
  'New Explorer',
  'Pathfinder',
  'Trail Scholar',
  'Knowledge Cartographer',
  'Master Navigator',
  'Grand Wayfinder'
];

const ROUTE_STATES = {
  unseen: { key: 'uncharted', label: 'Uncharted', note: 'Fog still covers this route.' },
  exploring: { key: 'discovered', label: 'Route discovered', note: 'The trail is visible; keep charting.' },
  practising: { key: 'charting', label: 'Charting', note: 'Details are filling in with each attempt.' },
  stable: { key: 'mapped', label: 'Route mapped', note: 'The method is holding steady.' },
  mastered: { key: 'restored', label: 'Landmark restored', note: 'Durable recall across sessions.' },
  'review-due': { key: 'revisit', label: 'Waypoint revisit due', note: 'A short revisit will strengthen recall.' }
};

const MISSION_THEME = {
  daily: { kicker: 'Route briefing', begin: 'Open the Field Guide' },
  diagnostic: { kicker: 'Before you set out', begin: 'Begin the survey' },
  topic: { kicker: 'Route briefing', begin: 'Open the Field Guide' },
  review: { kicker: 'Route briefing', begin: 'Open the Field Guide' },
  recovery: { kicker: 'Route briefing', begin: 'Open the Field Guide' }
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function clamp(value, minimum = 0, maximum = 100) {
  return Math.max(minimum, Math.min(maximum, Number(value) || 0));
}

function titleCase(value) {
  return String(value || '').replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function difficultyName(questionOrCode) {
  const code = typeof questionOrCode === 'string' ? questionOrCode : questionOrCode?.difficulty;
  const labels = { D1: 'Easy', D2: 'Medium', D3: 'Tough', D4: 'Stretch' };
  return typeof questionOrCode === 'object' && questionOrCode?.difficultyLabel
    ? questionOrCode.difficultyLabel
    : labels[code] || code || 'Mixed';
}

function formatCount(value) {
  return Number(value || 0).toLocaleString('en-IN');
}

function topicContentStatus(topicId) {
  const summary = state.bootstrap?.content?.byTopic?.find((topic) => topic.topicId === topicId);
  if (!summary) return 'unknown';
  if (summary.pilot && !summary.published) return 'pilot';
  if (summary.pilot) return 'mixed';
  return 'published';
}

function initials(name) {
  return String(name || 'Learner').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function formatDate(value, options = { month: 'short', day: 'numeric' }) {
  if (!value) return 'Not scheduled';
  return new Intl.DateTimeFormat('en-IN', options).format(new Date(value));
}

function relativeReview(value) {
  if (!value) return 'Build a signal first';
  const difference = new Date(value).getTime() - Date.now();
  if (difference <= 0) return 'Review due now';
  const days = Math.max(1, Math.ceil(difference / 86_400_000));
  return `Review in ${days} day${days === 1 ? '' : 's'}`;
}

function stateLabel(value) {
  const labels = {
    unseen: 'Unseen',
    exploring: 'Exploring',
    practising: 'Practising',
    stable: 'Stable',
    mastered: 'Mastered',
    'review-due': 'Review due'
  };
  return labels[value] || titleCase(value);
}

function routeState(topic) {
  return ROUTE_STATES[topic.state] || ROUTE_STATES.unseen;
}

function routeNumber(topicId) {
  const index = state.bootstrap?.dashboard.topics.findIndex((topic) => topic.id === topicId) ?? -1;
  return String(index + 1).padStart(2, '0');
}

function regionFor(topic) {
  return REGIONS.find((region) => region.domain === topic.domain) || REGIONS[0];
}

function regionRoutes(region) {
  return (state.bootstrap?.dashboard.topics || []).filter((topic) => topic.domain === region.domain);
}

function explorerRank(level = 1) {
  const index = Math.min(EXPLORER_RANKS.length - 1, Math.max(0, Math.floor((Number(level) || 1) - 1)));
  return { name: EXPLORER_RANKS[index], index };
}

function missionTheme(mission) {
  return MISSION_THEME[mission?.type] || MISSION_THEME.daily;
}

function atlasSeals(dashboard) {
  return dashboard.seals || [];
}

function applyTheme(settings = {}) {
  const preference = settings.theme || 'system';
  const theme = preference === 'system' ? (prefersDark.matches ? 'dark' : 'light') : preference;
  document.documentElement.dataset.theme = theme;
  document.body.classList.toggle('reduce-motion', Boolean(settings.reducedMotion));
  document.body.classList.toggle('quiet-mode', Boolean(settings.quietMode));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#0f1b20' : '#f6f2e8';
}

function toast(message, tone = 'info') {
  const element = document.createElement('div');
  element.className = `toast toast--${tone}`;
  element.innerHTML = `${icon(tone === 'success' ? 'checkCircle' : tone === 'error' ? 'alertCircle' : 'info', 19)}<span>${escapeHtml(message)}</span>`;
  toastRegion.append(element);
  window.setTimeout(() => element.classList.add('toast--visible'), 10);
  window.setTimeout(() => {
    element.classList.remove('toast--visible');
    window.setTimeout(() => element.remove(), 220);
  }, 3600);
}

function loadingView(label = 'Unfolding your atlas…') {
  return `<main class="boot-screen" id="main-content">
    <div class="boot-mark">${icon('compass', 34)}</div>
    <p>${escapeHtml(label)}</p>
  </main>`;
}

function buttonBusy(label = 'Please wait') {
  return `${icon('refresh', 18, 'spin')}<span>${escapeHtml(label)}</span>`;
}

async function refreshBootstrap() {
  state.bootstrap = await api.bootstrap();
  applyTheme(state.bootstrap.user.settings);
  return state.bootstrap;
}

function navigate(path, { replace = false } = {}) {
  if (replace) history.replaceState({}, '', path);
  else if (location.pathname !== path) history.pushState({}, '', path);
  state.mobileNavOpen = false;
  renderRoute();
  window.scrollTo({ top: 0, behavior: document.body.classList.contains('reduce-motion') ? 'auto' : 'smooth' });
}

function focusMainHeading() {
  requestAnimationFrame(() => {
    const heading = document.querySelector('#main-content h1');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  });
}

function brand(full = true, { tagline = true } = {}) {
  return `<a class="brand" href="/" data-nav="/" aria-label="AptiBloom home">
    ${logoMark(full ? 38 : 34)}
    ${full ? `<span class="brand-name">Apti<span>Bloom</span>${tagline ? '<small>The Lost Atlas</small>' : ''}</span>` : ''}
  </a>`;
}

function navItem(path, label, iconName, current) {
  const active = current === path;
  return `<a href="${path}" data-nav="${path}" class="nav-item${active ? ' is-active' : ''}" ${active ? 'aria-current="page"' : ''}>
    ${icon(iconName, 20)}<span>${label}</span>
  </a>`;
}

function appShell(content, currentPath) {
  const user = state.bootstrap.user;
  const dashboard = state.bootstrap.dashboard;
  const rank = explorerRank(dashboard.overall.journeyLevel);
  return `<div class="app-shell">
    <aside class="sidebar" aria-label="Primary navigation">
      <div class="sidebar-top">${brand(true)}</div>
      <nav class="sidebar-nav">
        ${navItem('/', 'Expedition board', 'compass', currentPath)}
        ${navItem('/learn', 'Explorer atlas', 'map', currentPath)}
        ${navItem('/progress', 'Explorer journal', 'chart', currentPath)}
        ${navItem('/sprint', 'Placement sprint', 'timer', currentPath)}
      </nav>
      <div class="sidebar-bottom">
        <a href="/studio" data-nav="/studio" class="nav-item nav-item--subtle${currentPath === '/studio' ? ' is-active' : ''}">${icon('layers', 19)}<span>Content studio</span></a>
        <a href="/settings" data-nav="/settings" class="nav-item nav-item--subtle${currentPath === '/settings' ? ' is-active' : ''}">${icon('settings', 19)}<span>Base camp settings</span></a>
        <div class="sidebar-profile">
          <span class="avatar">${escapeHtml(initials(user.name))}</span>
          <span><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(rank.name)}</small></span>
        </div>
      </div>
    </aside>
    <div class="app-column">
      <header class="topbar">
        <button class="icon-button mobile-menu-button" type="button" data-action="toggle-mobile-nav" aria-label="Open navigation" aria-expanded="${state.mobileNavOpen}">${icon('menu', 22)}</button>
        <div class="topbar-context"><span>${formatDate(new Date(), { weekday: 'long', month: 'short', day: 'numeric' })}</span><strong>Chart one route. Keep the method.</strong></div>
        <div class="topbar-actions">
          <span class="rank-chip" title="Explorer rank reflects participation, not skill mastery">${icon('compass', 17)}<span>${escapeHtml(rank.name)}</span><span class="visually-hidden">Explorer rank. Rank reflects participation, not skill mastery.</span></span>
          <span class="petal-balance" title="Petals are earned through useful learning actions">${icon('sparkles', 17)}<strong>${dashboard.overall.petals}</strong><span>petals</span></span>
          <button class="avatar avatar--button" type="button" data-nav="/settings" aria-label="Open base camp settings">${escapeHtml(initials(user.name))}</button>
        </div>
      </header>
      <div class="mobile-drawer${state.mobileNavOpen ? ' is-open' : ''}" aria-hidden="${!state.mobileNavOpen}">
        <nav aria-label="Mobile menu">
          ${navItem('/', 'Expedition board', 'compass', currentPath)}
          ${navItem('/learn', 'Explorer atlas', 'map', currentPath)}
          ${navItem('/progress', 'Explorer journal', 'chart', currentPath)}
          ${navItem('/sprint', 'Placement sprint', 'timer', currentPath)}
          ${navItem('/studio', 'Content studio', 'layers', currentPath)}
          ${navItem('/settings', 'Base camp settings', 'settings', currentPath)}
        </nav>
      </div>
      <main class="app-main" id="main-content">${content}</main>
      <nav class="bottom-nav" aria-label="Mobile primary navigation">
        ${navItem('/', 'Board', 'compass', currentPath)}
        ${navItem('/learn', 'Atlas', 'map', currentPath)}
        ${navItem('/progress', 'Journal', 'chart', currentPath)}
        ${navItem('/sprint', 'Sprint', 'timer', currentPath)}
      </nav>
    </div>
  </div>`;
}

function routeStateBadge(topic) {
  const route = routeState(topic);
  return `<span class="route-badge route-badge--${route.key}">${icon(route.key === 'restored' ? 'seal' : route.key === 'revisit' ? 'waypoint' : route.key === 'uncharted' ? 'fog' : 'route', 14)}${route.label}</span>`;
}

function routeNode(topic, index, { compact = false } = {}) {
  const route = routeState(topic);
  const beacon = topic.readiness > 0;
  const label = `Route ${index + 1}: ${topic.name}. ${route.label}. ${topic.mastery}% mastery.${beacon ? ' Readiness beacon lit.' : ''}`;
  return `<button type="button" class="route-node${compact ? ' route-node--compact' : ''} route-node--${route.key}"
    data-action="start-mission" data-type="topic" data-topic="${topic.id}"
    aria-label="${escapeHtml(label)}">
    <span class="route-node-index">${String(index + 1).padStart(2, '0')}</span>
    <span class="route-node-mark">${icon(topic.icon, compact ? 18 : 20)}${beacon ? `<i class="route-beacon">${icon('beacon', 12)}</i>` : ''}</span>
    <span class="route-node-body">
      <strong>${escapeHtml(topic.name)}</strong>
      <small>${escapeHtml(compact ? route.label : `${route.label} · ${topic.mastery}% mastery`)}</small>
    </span>
    ${compact ? '' : `<span class="route-node-progress" aria-hidden="true"><i style="--value:${clamp(topic.mastery)}%"></i></span>`}
  </button>`;
}

function atlasRegionPanel(region, { compact = false } = {}) {
  const routes = regionRoutes(region);
  const restored = routes.filter((topic) => topic.state === 'mastered').length;
  const charted = routes.filter((topic) => topic.attempts > 0).length;
  return `<section class="atlas-region atlas-region--${region.id}${compact ? ' atlas-region--compact' : ''}" aria-label="${escapeHtml(region.name)}">
    <header class="atlas-region-head">
      <span class="region-mark">${icon(region.icon, compact ? 19 : 22)}</span>
      <div>
        <h3>${escapeHtml(region.name)}</h3>
        ${compact ? `<p>${escapeHtml(region.domain)}</p>` : `<p>${escapeHtml(region.blurb)}</p>`}
      </div>
      <span class="region-tally">${charted}/${routes.length} routes charted · ${restored} restored</span>
    </header>
    <div class="atlas-trail">${routes.map((topic) => routeNode(topic, state.bootstrap.dashboard.topics.indexOf(topic), { compact })).join('')}</div>
  </section>`;
}

function atlasLegend() {
  return `<ul class="atlas-legend" aria-label="Atlas legend">
    <li><i class="legend-route legend-route--uncharted"></i>Uncharted</li>
    <li><i class="legend-route legend-route--charting"></i>Charting</li>
    <li><i class="legend-route legend-route--mapped"></i>Mapped</li>
    <li><i class="legend-route legend-route--restored"></i>Restored</li>
    <li><i class="legend-route legend-route--revisit"></i>Revisit due</li>
    <li>${icon('beacon', 14)}Readiness beacon</li>
  </ul>`;
}

function progressRing(value, label, size = 'normal') {
  const safe = clamp(value);
  return `<div class="progress-ring progress-ring--${size}" style="--progress:${safe * 3.6}deg" role="img" aria-label="${escapeHtml(label)}: ${safe}%">
    <div><strong>${Math.round(safe)}%</strong><span>${escapeHtml(label)}</span></div>
  </div>`;
}

function miniBar(value, label = '') {
  return `<div class="mini-progress" role="progressbar" aria-label="${escapeHtml(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${clamp(value)}"><span style="--value:${clamp(value)}%"></span></div>`;
}

function welcomeView() {
  return `<div class="marketing-page">
    <header class="marketing-nav">
      ${brand(true)}
      <nav aria-label="Welcome navigation">
        <a href="#method">How it works</a>
        <a href="#topics">Topics</a>
      </nav>
      <button class="button button--small button--ghost" type="button" data-action="guest-preview">Preview as guest</button>
    </header>
    <main id="main-content">
      <section class="hero section-wrap">
        <div class="hero-copy">
          <div class="eyebrow">${icon('compass', 16)} The Lost Atlas · calm placement preparation</div>
          <h1>Chart skills that hold up <span>under pressure.</span></h1>
          <p class="hero-lead">Seven-minute expeditions teach the method, repair wrong turns, and build placement pace only when you are ready.</p>
          <div class="hero-actions">
            <button class="button button--primary button--large" type="button" data-nav="/onboarding">Start my first expedition ${icon('arrowRight', 19)}</button>
            <button class="button button--ghost button--large" type="button" data-action="guest-preview">Explore without an account</button>
          </div>
          <div class="hero-proof" aria-label="AptiBloom principles">
            <span>${icon('clock', 17)} 5–8 minute expeditions</span>
            <span>${icon('shield', 17)} Private by default</span>
            <span>${icon('route', 17)} Wrong turns become repairs</span>
          </div>
        </div>
        <div class="hero-product" aria-label="Daily Expedition preview">
          <div class="hero-orbit hero-orbit--one"></div><div class="hero-orbit hero-orbit--two"></div>
          <article class="product-preview">
            <header><span class="preview-brand">${logoMark(31)}<strong>AptiBloom</strong></span><span class="preview-chip">7 min</span></header>
            <div class="preview-kicker">Your next route</div>
            <h2>Daily Expedition</h2>
            <p>Percentages · Route 01 · Quantitative Coast</p>
            <div class="preview-atlas" aria-hidden="true">
              <span class="preview-contour"></span>
              <span class="preview-path"></span>
              <i class="preview-stop preview-stop--one">${icon('seal', 13)}</i>
              <i class="preview-stop preview-stop--two">${icon('route', 13)}</i>
              <i class="preview-stop preview-stop--three">${icon('waypoint', 13)}</i>
              <i class="preview-stop preview-stop--four">${icon('fog', 13)}</i>
            </div>
            <div class="preview-progress"><span></span><span></span><span></span><span></span><span></span><span></span></div>
            <div class="button button--primary preview-button">Begin the route ${icon('arrowRight', 17)}</div>
          </article>
          <div class="floating-note floating-note--accuracy">${icon('target', 17)}<span><strong>Evidence, not taps</strong><small>Landmarks need real recall</small></span></div>
          <div class="floating-note floating-note--calm">${icon('map', 17)}<span><strong>No streak guilt</strong><small>A flexible weekly rhythm</small></span></div>
        </div>
      </section>
      <section class="trust-strip section-wrap" aria-label="AptiBloom curriculum coverage">
        <div><strong>1,090</strong><span>90 published · 1,000 pilot-validated</span></div>
        <div><strong>12</strong><span>routes across three regions</span></div>
        <div><strong>6</strong><span>thoughtful interaction types</span></div>
        <div><strong>0</strong><span>lives, loot boxes, or shame</span></div>
      </section>
      <section class="method-section section-wrap" id="method">
        <div class="section-heading section-heading--center"><div class="eyebrow">The expedition loop</div><h2>Do more than check an answer.</h2><p>Every expedition moves from curiosity to durable recall without turning learning into another stressful class.</p></div>
        <div class="method-grid">
          ${[
            ['survey', 'Survey', 'Try one approachable problem before the explanation.'],
            ['telescope', 'Field guide', 'See one short visual model built around the idea.'],
            ['route', 'Chart', 'Complete the method instead of tapping next.'],
            ['footsteps', 'Repair', 'Fix the exact false trail, then retry nearby.'],
            ['waypoint', 'Revisit', 'Return to older routes until recall holds.']
          ].map(([iconName, title, copy], index) => `<article class="method-card"><span class="method-number">0${index + 1}</span><div class="method-letter">${icon(iconName === 'survey' ? 'compass' : iconName, 22)}</div><h3>${title}</h3><p>${copy}</p></article>`).join('')}
        </div>
      </section>
      <section class="topic-showcase section-wrap" id="topics">
        <div class="section-heading"><div class="eyebrow">Placement curriculum</div><h2>Three regions. Twelve charted routes.</h2><p>Build quantitative accuracy, logical pattern recognition, and verbal precision with difficulty that grows from Easy to Tough.</p></div>
        <div class="showcase-grid">
          <article class="showcase-card showcase-card--indigo"><div class="showcase-icon">${icon('mountain', 25)}</div><span>Quantitative aptitude · Quantitative Coast</span><h3>Numbers with a method</h3><p>Percentages, ratios, averages, ages, profit and loss, and time and work.</p><small>6 routes · 510 questions · Easy–Tough</small></article>
          <article class="showcase-card showcase-card--green"><div class="showcase-icon">${icon('trees', 25)}</div><span>Logical reasoning · Logic Wilds</span><h3>Patterns you can explain</h3><p>Number and letter series, coding and decoding, and conclusion-based syllogisms.</p><small>3 routes · 330 questions · Easy–Tough</small></article>
          <article class="showcase-card showcase-card--coral"><div class="showcase-icon">${icon('archive', 25)}</div><span>Verbal ability · Verbal Archives</span><h3>Language with precision</h3><p>Grammar, sentence correction, para jumbles, and reading comprehension.</p><small>3 routes · 250 questions · Easy–Tough</small></article>
        </div>
      </section>
      <section class="final-cta section-wrap">
        <div><div class="eyebrow eyebrow--light">Your first expedition takes seven minutes</div><h2>Leave knowing one thing better.</h2><p>No pressure score. No public rank. Just the next useful route.</p></div>
        <button class="button button--light button--large" type="button" data-nav="/onboarding">Build my plan ${icon('arrowRight', 19)}</button>
      </section>
    </main>
    <footer class="marketing-footer section-wrap">${brand(true)}<p>Chart every skill. Recover the method. Prove you are ready.</p><span>Prototype · Local-first</span></footer>
  </div>`;
}

function onboardingView() {
  return `<div class="onboarding-page">
    <header class="onboarding-header">${brand(true)}<button type="button" class="button button--ghost button--small" data-action="guest-preview">Preview as guest</button></header>
    <main class="onboarding-main" id="main-content">
      <section class="onboarding-copy">
        <button class="text-button" type="button" data-nav="/">${icon('arrowLeft', 17)} Back to welcome</button>
        <div class="eyebrow">Your first route · about 90 seconds</div>
        <h1>Make placement prep fit <span>your week.</span></h1>
        <p>We use these answers only to choose a sensible first route. Your starting estimate is never an intelligence label.</p>
        <div class="onboarding-promise">
          <div>${icon('clock', 20)}<span><strong>Short by design</strong><small>Sessions stay under ten minutes.</small></span></div>
          <div>${icon('eye', 20)}<span><strong>Explainable</strong><small>You can see why anything is recommended.</small></span></div>
          <div>${icon('shield', 20)}<span><strong>Private progress</strong><small>No public ranking or social pressure.</small></span></div>
        </div>
      </section>
      <section class="onboarding-card">
        <div class="form-step"><span>1</span><div><strong>Set your goal</strong><small>We’ll build the first week around it.</small></div></div>
        <form id="onboarding-form">
          <div class="field-row">
            <label class="field"><span>Your name</span><input name="name" autocomplete="name" maxlength="60" placeholder="e.g. Aanya" required></label>
            <label class="field"><span>Email</span><input type="email" name="email" autocomplete="email" placeholder="you@college.edu" required></label>
          </div>
          <div class="field-row">
            <label class="field"><span>Placement timeline</span><select name="placementWindow"><option>Within 1 month</option><option selected>3–6 months</option><option>6–12 months</option><option>Exploring early</option></select></label>
            <label class="field"><span>Weekly availability</span><select name="weeklyMinutes"><option value="20">About 20 minutes</option><option value="40" selected>About 40 minutes</option><option value="70">About 70 minutes</option><option value="100">More than 90 minutes</option></select></label>
          </div>
          <fieldset class="choice-fieldset"><legend>How confident does aptitude feel today?</legend><div class="segmented-options">
            <label><input type="radio" name="confidence" value="starting"><span>Starting fresh</span></label>
            <label><input type="radio" name="confidence" value="building" checked><span>Building basics</span></label>
            <label><input type="radio" name="confidence" value="confident"><span>Mostly confident</span></label>
          </div></fieldset>
          <label class="field"><span>Target company or test pattern <small>Optional</small></span><input name="target" maxlength="80" placeholder="Campus placements in general"></label>
          <fieldset class="start-fieldset"><legend>Choose your first step</legend>
            <label class="start-choice"><input type="radio" name="chosenStart" value="diagnostic" checked><span class="choice-icon">${icon('telescope', 20)}</span><span><strong>Survey six routes</strong><small>6 untimed questions · best first plan</small></span><i>${icon('check', 17)}</i></label>
            <label class="start-choice"><input type="radio" name="chosenStart" value="percentages"><span class="choice-icon">${icon('percent', 20)}</span><span><strong>Start on Percentages</strong><small>Field Guide + guided practice</small></span><i>${icon('check', 17)}</i></label>
            <label class="start-choice"><input type="radio" name="chosenStart" value="grammar"><span class="choice-icon">${icon('type', 20)}</span><span><strong>Start on Grammar</strong><small>Error spotting + precise feedback</small></span><i>${icon('check', 17)}</i></label>
          </fieldset>
          <button class="button button--primary button--wide button--large" type="submit" ${state.busy ? 'disabled' : ''}>${state.busy ? buttonBusy('Building your plan') : `Build my first plan ${icon('arrowRight', 19)}`}</button>
          <p class="form-note">Local prototype sign-in. Your learning data stays on this device’s local server.</p>
        </form>
      </section>
    </main>
  </div>`;
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

function homeView() {
  const dashboard = state.bootstrap.dashboard;
  const user = state.bootstrap.user;
  const recommendation = dashboard.recommendation;
  const missionAction = recommendation.type === 'assessment'
    ? 'data-nav="/sprint"'
    : `data-action="start-mission" data-type="${recommendation.type}" data-topic="${recommendation.topicId}"`;
  const weeklyGoal = dashboard.weeklyRhythm.goal;
  const weeklyCompleted = dashboard.weeklyRhythm.completed;
  const routeTopic = dashboard.topics.find((topic) => topic.id === recommendation.topicId);
  const region = routeTopic ? regionFor(routeTopic) : REGIONS[0];
  const rank = explorerRank(dashboard.overall.journeyLevel);
  const seals = atlasSeals(dashboard);
  const earnedSeals = seals.filter((seal) => seal.earned);
  const nextWaypoint = [...dashboard.topics]
    .filter((topic) => topic.reviewDue)
    .sort((first, second) => new Date(first.reviewDue) - new Date(second.reviewDue))[0];

  return `<div class="page page--home">
    <section class="page-intro home-intro"><div><span class="page-kicker">${greeting()}, ${escapeHtml(user.name.split(' ')[0])}</span><h1>Your next route is ready.</h1><p>One focused expedition is enough for today. The atlas keeps every route you have already charted.</p></div><button class="button button--ghost" type="button" data-nav="/learn">Open the explorer atlas ${icon('arrowRight', 17)}</button></section>
    <section class="daily-card">
      <div class="daily-copy">
        <div class="daily-meta"><span class="pill pill--light">Recommended route</span><span>${icon('clock', 16)} ${escapeHtml(recommendation.duration)}</span>${routeTopic ? `<span>${icon('map', 16)} Route ${routeNumber(routeTopic.id)} · ${escapeHtml(region.name)}</span>` : ''}</div>
        <h2>${escapeHtml(recommendation.title)}</h2>
        <p>${escapeHtml(recommendation.reason)}</p>
        <div class="mission-mix"><span><i></i> Current growth</span><span><i></i> False-trail repair</span><span><i></i> Waypoint revisit</span></div>
        <button class="button button--light button--large" type="button" ${missionAction}>Begin the route ${icon('arrowRight', 19)}</button>
      </div>
      <div class="daily-visual" aria-hidden="true">
        <span class="atlas-contour"></span>
        <span class="atlas-ridge atlas-ridge--one"></span><span class="atlas-ridge atlas-ridge--two"></span>
        <span class="atlas-path"></span>
        <i class="atlas-marker atlas-marker--start">${icon('footsteps', 14)}</i>
        <i class="atlas-marker atlas-marker--mid">${icon('waypoint', 14)}</i>
        <i class="atlas-marker atlas-marker--end">${icon('landmark', 14)}</i>
        <div class="daily-visual-note"><span>${icon('compass', 17)}</span><strong>${dashboard.overall.mastery}%</strong><small>atlas mastery</small></div>
      </div>
    </section>
    <section class="stat-grid stat-grid--four">
      <article class="stat-card"><span class="stat-icon stat-icon--indigo">${icon('target', 20)}</span><div><small>Recent accuracy</small><strong>${dashboard.overall.attempted ? `${dashboard.overall.accuracy}%` : '—'}</strong><p>${dashboard.overall.attempted ? 'Across your last 20 attempts' : 'Complete an expedition to begin'}</p></div></article>
      <article class="stat-card"><span class="stat-icon stat-icon--green">${icon('map', 20)}</span><div><small>Atlas mastery</small><strong>${dashboard.overall.mastery}%</strong><p>${dashboard.overall.masteryEvidenceTopics ? `Based on ${dashboard.overall.masteryEvidenceTopics} evidence-backed route${dashboard.overall.masteryEvidenceTopics === 1 ? '' : 's'}` : 'Untimed understanding'}</p></div></article>
      <article class="stat-card"><span class="stat-icon stat-icon--coral">${icon('beacon', 20)}</span><div><small>Placement readiness</small><strong>${dashboard.overall.readiness}%</strong><p>Published timed evidence only</p></div></article>
      <article class="stat-card"><span class="stat-icon stat-icon--gold">${icon('waypoint', 20)}</span><div><small>Waypoints due</small><strong>${dashboard.dueReviews}</strong><p>${dashboard.dueReviews ? 'Ready for retrieval' : 'Nothing overdue'}</p></div></article>
    </section>
    <section class="content-section">
      <div class="section-row"><div><span class="page-kicker">Explorer atlas preview</span><h2>Twelve routes. Three regions.</h2></div><a href="/learn" data-nav="/learn" class="text-link">Open the full atlas ${icon('arrowRight', 16)}</a></div>
      <div class="atlas-board atlas-board--compact panel">
        ${REGIONS.map((region) => atlasRegionPanel(region, { compact: true })).join('')}
        ${atlasLegend()}
      </div>
    </section>
    <section class="home-lower-grid">
      <article class="panel rhythm-panel">
        <div class="panel-heading"><div><span class="page-kicker">Expedition rhythm</span><h2>${weeklyCompleted} of ${weeklyGoal} learning days</h2></div><span class="calm-label">Flexible, never fragile</span></div>
        <div class="rhythm-days">${Array.from({ length: weeklyGoal }, (_, index) => `<div class="rhythm-day${index < weeklyCompleted ? ' is-complete' : ''}"><span>${index < weeklyCompleted ? icon('check', 16) : index + 1}</span><small>${index < weeklyCompleted ? 'Charted' : 'Open'}</small></div>`).join('')}</div>
        <p>${weeklyCompleted >= weeklyGoal ? 'This week’s plan is complete. Extra routes are optional.' : `Your expedition is still here. ${weeklyGoal - weeklyCompleted} useful route${weeklyGoal - weeklyCompleted === 1 ? '' : 's'} remain this week.`}</p>
      </article>
      <article class="panel next-panel">
        <div class="panel-heading"><div><span class="page-kicker">Next waypoint</span><h2>${dashboard.dueReviews ? `${dashboard.dueReviews} ready now` : nextWaypoint ? escapeHtml(relativeReview(nextWaypoint.reviewDue)) : 'Your schedule is clear'}</h2></div>${icon('waypoint', 24)}</div>
        <p>${dashboard.dueReviews ? 'A short revisit now will strengthen what you charted earlier.' : nextWaypoint ? `${escapeHtml(nextWaypoint.name)} returns when spacing makes the effort useful.` : 'We will bring a route back when spacing makes the effort useful.'}</p>
        <button class="button button--secondary button--wide" type="button" data-action="start-mission" data-type="review">${dashboard.dueReviews ? 'Revisit due waypoints' : 'Try a mixed revisit'} ${icon('arrowRight', 17)}</button>
      </article>
      <article class="panel seals-panel">
        <div class="panel-heading"><div><span class="page-kicker">Atlas seals</span><h2>${earnedSeals.length} of ${seals.length} earned</h2></div>${icon('seal', 24)}</div>
        <ul class="seal-row">${seals.map((seal) => `<li class="seal-chip${seal.earned ? ' is-earned' : ''}">${icon(seal.earned ? 'seal' : 'lock', 15)}${escapeHtml(seal.name)}<span class="visually-hidden">: ${seal.earned ? 'earned' : 'not yet earned'}. ${escapeHtml(seal.requirement)}</span></li>`).join('')}</ul>
        <p>Seals record expedition milestones from real attempts. They are never a spendable currency, and they cannot change mastery or readiness.</p>
      </article>
    </section>
    <section class="panel rank-panel">
      <div><span class="page-kicker">Explorer rank</span><h2>${escapeHtml(rank.name)}</h2><p>Rank reflects steady participation and unlocks presentation only. Mastery and readiness stay evidence-based.</p></div>
      <ol class="rank-track">${EXPLORER_RANKS.map((name, index) => `<li class="${index < rank.index ? 'is-passed' : index === rank.index ? 'is-current' : ''}"><span>${index <= rank.index ? icon('check', 13) : index + 1}</span><small>${escapeHtml(name)}</small></li>`).join('')}</ol>
    </section>
  </div>`;
}

function routeCard(topic, index) {
  const route = routeState(topic);
  const region = regionFor(topic);
  return `<article class="path-card path-card--${topic.accent} is-${route.key}">
    <div class="path-index"><small>Route</small>${String(index + 1).padStart(2, '0')}</div>
    <div class="path-main">
      <div class="path-heading"><span class="topic-symbol">${icon(topic.icon, 22)}</span><span class="pill">${escapeHtml(region.name)}</span>${topicContentStatus(topic.id) === 'pilot' ? '<span class="status-pill status-pill--pilot">Pilot questions · review pending</span>' : ''}<span class="path-question-count">${formatCount(topic.questionCount)} questions</span></div>
      <h3 class="path-title">${escapeHtml(topic.name)}</h3>
      <p class="path-domain-note">${escapeHtml(topic.domain)} · ${escapeHtml(route.note)}</p>
      <p>${escapeHtml(topic.description)}</p>
      <div class="concept-chips">${topic.concepts.map((concept) => `<span>${escapeHtml(concept)}</span>`).join('')}</div>
      <div class="difficulty-coverage" aria-label="${escapeHtml(topic.name)} difficulty coverage"><span>${icon('checkCircle', 14)} Easy</span><span>${icon('checkCircle', 14)} Medium</span><span>${icon('checkCircle', 14)} Tough</span></div>
      <div class="path-metrics"><div><span><strong>${topic.mastery}%</strong> mastery</span>${miniBar(topic.mastery, `${topic.name} mastery`)}</div><div><span><strong>${topic.readiness}%</strong> readiness</span>${miniBar(topic.readiness, `${topic.name} readiness`)}</div></div>
      <div class="path-footer">
        ${routeStateBadge(topic)}
        <span class="state-badge state-badge--${topic.state}">${stateLabel(topic.state)} · ${topic.mastery}%</span>
        <span>${icon('waypoint', 15)} ${escapeHtml(relativeReview(topic.reviewDue))}</span>
        <button class="button button--primary" type="button" data-action="start-mission" data-type="topic" data-topic="${topic.id}">${topic.attempts ? 'Continue Focus Trail' : 'Open Field Guide'} ${icon('arrowRight', 17)}</button>
      </div>
    </div>
    <div class="path-illustration" aria-hidden="true"><span class="path-orb"></span>${icon(topic.icon, 48)}${topic.readiness > 0 ? `<i class="path-beacon">${icon('beacon', 16)}</i>` : ''}</div>
  </article>`;
}

function learnView() {
  const dashboard = state.bootstrap.dashboard;
  const topics = dashboard.topics;
  const restored = topics.filter((topic) => topic.state === 'mastered').length;
  const charted = topics.filter((topic) => topic.attempts > 0).length;
  return `<div class="page">
    <section class="page-intro"><div><span class="page-kicker">Explorer atlas</span><h1>Chart the routes that matter next.</h1><p>No timers here. Open the Field Guide, chart the method, then practise without pressure.</p></div><button type="button" class="button button--secondary" data-action="start-mission" data-type="review">${icon('waypoint', 17)} Mixed revisit</button></section>
    <section class="atlas-board atlas-board--full panel">
      <div class="atlas-board-head">
        <div><span class="page-kicker">Atlas status</span><h2>${charted} of ${topics.length} routes charted · ${restored} landmark${restored === 1 ? '' : 's'} restored</h2></div>
        <p>Fog clears with attempts. Landmarks restore only after durable recall, and beacons need published timed evidence.</p>
      </div>
      ${REGIONS.map(atlasRegionPanel).join('')}
      ${atlasLegend()}
    </section>
    <section class="learning-paths">
      ${REGIONS.map((region) => `<div class="region-group">
        <div class="region-group-head"><span class="region-mark">${icon(region.icon, 20)}</span><div><h2>${escapeHtml(region.name)}</h2><small>${escapeHtml(region.domain)} · ${regionRoutes(region).length} routes</small></div></div>
        ${regionRoutes(region).map((topic) => routeCard(topic, topics.indexOf(topic))).join('')}
      </div>`).join('')}
    </section>
    <section class="panel bloom-explainer">
      <div class="section-row"><div><span class="page-kicker">Inside every route</span><h2>The expedition rhythm</h2></div><span class="calm-label">Built for durable recall</span></div>
      <ol class="bloom-steps">
        <li><span>${icon('compass', 17)}</span><div><strong>Survey</strong><small>Low-stakes attempt</small></div></li>
        <li><span>${icon('telescope', 17)}</span><div><strong>Field Guide</strong><small>Short visual model</small></div></li>
        <li><span>${icon('route', 17)}</span><div><strong>Chart</strong><small>Complete the method</small></div></li>
        <li><span>${icon('footsteps', 17)}</span><div><strong>Repair</strong><small>Fix the false trail</small></div></li>
        <li><span>${icon('waypoint', 17)}</span><div><strong>Revisit</strong><small>Spaced retrieval</small></div></li>
      </ol>
    </section>
  </div>`;
}

function accuracyChart(points) {
  if (!points.length) return `<div class="empty-chart"><span>${icon('chart', 28)}</span><strong>Your trend begins after one expedition.</strong><p>First-attempt results will appear here without judging learning speed.</p></div>`;
  return `<div class="accuracy-chart" role="img" aria-label="Recent answer accuracy trend">${points.map((point, index) => `<div class="chart-column"><span class="chart-dot${point.correct ? ' is-correct' : ''}" style="--height:${point.correct ? 78 : 28}%"></span><small>${index + 1}</small></div>`).join('')}</div>`;
}

function progressView() {
  const dashboard = state.bootstrap.dashboard;
  const seals = atlasSeals(dashboard);
  const rank = explorerRank(dashboard.overall.journeyLevel);
  return `<div class="page">
    <section class="page-intro"><div><span class="page-kicker">Explorer journal</span><h1>Progress you can explain.</h1><p>Mastery shows untimed understanding. Readiness beacons light only when accuracy holds under placement conditions.</p></div><button class="button button--ghost" type="button" data-action="export-data">${icon('download', 17)} Export my journal</button></section>
    <section class="progress-overview panel">
      <div class="progress-rings">${progressRing(dashboard.overall.mastery, 'Mastery', 'large')}${progressRing(dashboard.overall.readiness, 'Readiness', 'large')}${progressRing(dashboard.overall.accuracy, 'Accuracy', 'large')}</div>
      <div class="progress-story"><span class="page-kicker">Your current expedition</span><h2>${dashboard.overall.attempted ? 'The atlas is filling in.' : 'Your first evidence is waiting.'}</h2><p>${escapeHtml(dashboard.recommendation.reason)}</p><div class="score-legend"><span><i class="legend-dot legend-dot--mastery"></i><strong>Mastery</strong> varied, untimed performance${dashboard.overall.masteryEvidenceTopics ? ` · ${dashboard.overall.masteryEvidenceTopics} evidence-backed route${dashboard.overall.masteryEvidenceTopics === 1 ? '' : 's'}` : ''}</span><span><i class="legend-dot legend-dot--readiness"></i><strong>Readiness</strong> published timed performance only</span></div><button class="button button--primary" type="button" data-action="start-mission" data-type="${dashboard.recommendation.type === 'assessment' ? 'daily' : dashboard.recommendation.type}" data-topic="${dashboard.recommendation.topicId}">Take the next useful route ${icon('arrowRight', 17)}</button></div>
    </section>
    <section class="progress-grid">
      <article class="panel trend-panel"><div class="panel-heading"><div><span class="page-kicker">Recent attempts</span><h2>Accuracy signal</h2></div><span class="calm-label">First answer only</span></div>${accuracyChart(dashboard.accuracyTrend)}</article>
      <article class="panel evidence-panel"><div class="panel-heading"><div><span class="page-kicker">Evidence collected</span><h2>${dashboard.overall.attempted} attempts</h2></div>${icon('award', 25)}</div><div class="evidence-list"><div><span>${icon('route', 18)} Routes charted</span><strong>${dashboard.topics.filter((topic) => topic.attempts > 0).length}</strong></div><div><span>${icon('landmark', 18)} Landmarks restored</span><strong>${dashboard.topics.filter((topic) => topic.state === 'mastered').length}</strong></div><div><span>${icon('waypoint', 18)} Waypoints due</span><strong>${dashboard.dueReviews}</strong></div><div><span>${icon('compass', 18)} Explorer rank</span><strong>${escapeHtml(rank.name)}</strong></div></div></article>
    </section>
    <section class="content-section">
      <div class="section-row"><div><span class="page-kicker">Route detail</span><h2>Mastery and pace stay separate.</h2></div></div>
      <div class="skill-table-wrap panel"><table class="skill-table"><thead><tr><th>Route</th><th>Atlas state</th><th>Mastery</th><th>Readiness</th><th>First-try accuracy</th><th>Next waypoint</th></tr></thead><tbody>${dashboard.topics.map((topic, index) => `<tr><td><span class="table-topic"><i class="topic-symbol topic-symbol--small">${icon(topic.icon, 17)}</i><span><strong>${String(index + 1).padStart(2, '0')} · ${escapeHtml(topic.name)}</strong><small>${escapeHtml(topic.shortDomain)} · ${escapeHtml(regionFor(topic).name)}</small></span></span></td><td>${routeStateBadge(topic)}<small class="table-plain-state">${stateLabel(topic.state)}</small></td><td><strong>${topic.mastery}%</strong>${miniBar(topic.mastery, `${topic.name} mastery`)}</td><td><strong>${topic.readiness}%</strong>${miniBar(topic.readiness, `${topic.name} readiness`)}</td><td>${topic.attempts ? `${topic.firstTryAccuracy}%` : '—'}</td><td>${escapeHtml(relativeReview(topic.reviewDue))}</td></tr>`).join('')}</tbody></table></div>
    </section>
    <section class="progress-grid">
      <article class="panel misconception-panel"><div class="panel-heading"><div><span class="page-kicker">False-trail queue</span><h2>Patterns worth repairing</h2></div>${icon('footsteps', 24)}</div>${dashboard.misconceptions.length ? `<div class="misconception-list">${dashboard.misconceptions.map((item) => `<div><span><strong>${escapeHtml(titleCase(item.label))}</strong><small>Seen ${item.count} time${item.count === 1 ? '' : 's'}</small></span><button type="button" class="text-link" data-action="start-mission" data-type="recovery">Repair route ${icon('arrowRight', 15)}</button></div>`).join('')}</div>` : `<div class="empty-small"><p>No recurring false trail yet. Errors will be grouped here so practice stays specific.</p></div>`}</article>
      <article class="panel methodology-panel"><span class="stat-icon stat-icon--indigo">${icon('info', 20)}</span><h2>What restores a landmark?</h2><ul><li>${icon('check', 16)} Correct first attempts across varied questions</li><li>${icon('check', 16)} Successful alternate-route retries</li><li>${icon('check', 16)} Recall after a spaced waypoint revisit</li><li>${icon('close', 16)} Opening pages, seals, or cosmetics alone</li></ul></article>
    </section>
    <section class="panel seals-panel seals-panel--full">
      <div class="panel-heading"><div><span class="page-kicker">Atlas seals</span><h2>${seals.filter((seal) => seal.earned).length} of ${seals.length} earned</h2></div><span class="calm-label">Evidence, not currency</span></div>
      <div class="seal-grid">${seals.map((seal) => `<article class="seal-card${seal.earned ? ' is-earned' : ''}"><span>${icon(seal.earned ? 'seal' : 'lock', 19)}</span><div><strong>${escapeHtml(seal.name)}</strong><small>${escapeHtml(seal.requirement)}</small><small class="seal-status">${seal.earned ? 'Earned' : 'Not yet earned'}</small></div></article>`).join('')}</div>
    </section>
  </div>`;
}

function sprintIntroView() {
  const dashboard = state.bootstrap.dashboard;
  const litBeacons = dashboard.topics.filter((topic) => topic.readiness > 0).length;
  return `<div class="page">
    <section class="page-intro"><div><span class="page-kicker">The Summit Vault · Placement Sprint</span><h1>Accuracy first. Then pace.</h1><p>The atlas stops at this door. Inside, the test stays neutral: feedback is hidden until submission and no rewards interrupt you.</p></div></section>
    <section class="sprint-hero panel">
      <div class="sprint-copy"><div class="eyebrow">${icon('landmark', 16)} Mixed placement assessment</div><h2>12 questions · 12 minutes</h2><p>One Medium or Tough question from every route spans the Quantitative Coast, Logic Wilds, and Verbal Archives. Route labels stay hidden while you answer.</p><div class="pilot-disclosure">${icon('info', 16)} Pilot questions provide practice feedback but do not light readiness beacons until reviewer publication.</div><div class="sprint-rules"><span>${icon('timer', 18)} Persistent timer</span><span>${icon('flag', 18)} Mark for review</span><span>${icon('layers', 18)} Mixed routes</span><span>${icon('eye', 18)} Answers after submission</span></div><button class="button button--primary button--large" type="button" data-action="start-assessment" ${state.busy ? 'disabled' : ''}>${state.busy ? buttonBusy('Preparing the sprint') : `Start the placement sprint ${icon('arrowRight', 19)}`}</button></div>
      <div class="sprint-readiness"><span class="page-kicker">Readiness beacons · ${litBeacons} of ${dashboard.topics.length} lit</span>${dashboard.topics.map((topic) => `<div class="readiness-row${topic.readiness > 0 ? ' is-lit' : ''}"><span><i class="topic-symbol topic-symbol--small">${icon(topic.readiness > 0 ? 'beacon' : topic.icon, 16)}</i>${escapeHtml(topic.name)}</span><strong>${topic.readiness}%</strong>${miniBar(topic.readiness, `${topic.name} readiness`)}</div>`).join('')}<p>${icon('info', 16)} An unlit beacon means “not enough timed evidence,” not “low ability.”</p></div>
    </section>
    <section class="simulation-notes">
      <article><span>${icon('target', 21)}</span><h3>One score, useful detail</h3><p>See accuracy by region and the next useful route—not only a total.</p></article>
      <article><span>${icon('route', 21)}</span><h3>Review after submission</h3><p>Every item includes the method and your response once the test ends.</p></article>
      <article><span>${icon('shield', 21)}</span><h3>No public rank</h3><p>Your result stays private and never removes charted mastery.</p></article>
    </section>
  </div>`;
}

function settingsView() {
  const user = state.bootstrap.user;
  const settings = user.settings;
  return `<div class="page page--settings">
    <section class="page-intro"><div><span class="page-kicker">Base camp</span><h1>Make the expedition feel right.</h1><p>Adjust motion, sound, rhythm, and appearance without losing any feature.</p></div></section>
    <form id="settings-form" class="settings-layout">
      <section class="panel settings-section"><div class="settings-heading"><span class="stat-icon stat-icon--indigo">${icon('user', 20)}</span><div><h2>Profile and plan</h2><p>Used only to shape your recommendations.</p></div></div><div class="field-row"><label class="field"><span>Display name</span><input name="name" value="${escapeHtml(user.name)}" maxlength="60"></label><label class="field"><span>Placement timeline</span><select name="placementWindow">${['Within 1 month', '3–6 months', '6–12 months', 'Exploring early'].map((value) => `<option ${user.profile.placementWindow === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label></div><label class="field"><span>Target</span><input name="target" value="${escapeHtml(user.profile.target || '')}" maxlength="80"></label></section>
      <section class="panel settings-section"><div class="settings-heading"><span class="stat-icon stat-icon--green">${icon('sun', 20)}</span><div><h2>Atlas appearance</h2><p>Day atlas and night atlas meet the same contrast targets.</p></div></div><fieldset class="theme-picker"><legend>Theme</legend>${[['light', 'sun', 'Light'], ['dark', 'moon', 'Dark'], ['system', 'settings', 'System']].map(([value, iconName, label]) => `<label><input type="radio" name="theme" value="${value}" ${settings.theme === value ? 'checked' : ''}><span>${icon(iconName, 20)}<strong>${label}</strong></span></label>`).join('')}</fieldset></section>
      <section class="panel settings-section"><div class="settings-heading"><span class="stat-icon stat-icon--coral">${icon('eye', 20)}</span><div><h2>Comfort and access</h2><p>Changes apply immediately after saving.</p></div></div><div class="setting-toggles"><label class="toggle-row"><span><strong>Reduce motion</strong><small>Replace route and landmark movement with simple fades.</small></span><input type="checkbox" name="reducedMotion" ${settings.reducedMotion ? 'checked' : ''}><i aria-hidden="true"></i></label><label class="toggle-row"><span><strong>Quiet mode</strong><small>Keep optional study sounds muted.</small></span><input type="checkbox" name="quietMode" ${settings.quietMode ? 'checked' : ''}><i aria-hidden="true"></i></label><label class="toggle-row"><span><strong>Social comparison</strong><small>Off by default; no feature depends on it.</small></span><input type="checkbox" name="socialComparison" ${settings.socialComparison ? 'checked' : ''}><i aria-hidden="true"></i></label></div></section>
      <section class="panel settings-section"><div class="settings-heading"><span class="stat-icon stat-icon--gold">${icon('calendar', 20)}</span><div><h2>Expedition rhythm</h2><p>A target, never a streak you can lose.</p></div></div><label class="field"><span>Learning days per week</span><input type="range" name="weeklyGoal" min="1" max="7" value="${settings.weeklyGoal}" data-goal-range><output id="goal-output">${settings.weeklyGoal} days</output></label></section>
      <div class="settings-actions"><button class="button button--primary button--large" type="submit">Save preferences ${icon('check', 18)}</button><span id="settings-status" role="status"></span></div>
    </form>
    <section class="panel data-section"><div><span class="page-kicker">Your data</span><h2>Portable and removable.</h2><p>Export your local profile and attempts, or permanently remove them.</p></div><div><button class="button button--ghost" type="button" data-action="export-data">${icon('download', 17)} Export JSON</button><button class="button button--danger-ghost" type="button" data-action="open-delete-dialog">${icon('trash', 17)} Delete account</button><button class="button button--ghost" type="button" data-action="logout">${icon('logout', 17)} Sign out</button></div></section>
    <dialog class="dialog" id="delete-dialog"><form method="dialog" id="delete-form"><button class="dialog-close icon-button" value="cancel" aria-label="Close">${icon('close', 20)}</button><span class="dialog-icon dialog-icon--danger">${icon('trash', 24)}</span><h2>Delete local learning data?</h2><p>This removes your profile, attempts, expeditions, and assessments from this local server. It cannot be undone.</p><label class="field"><span>Type DELETE to confirm</span><input name="confirmation" autocomplete="off" required></label><div class="dialog-actions"><button class="button button--ghost" value="cancel">Keep my data</button><button class="button button--danger" type="submit" value="default">Delete permanently</button></div></form></dialog>
  </div>`;
}

function studioView() {
  const { summary, questions } = state.content;
  const search = state.contentSearch.trim().toLowerCase();
  const filtered = questions.filter((question) => {
    const matchesTopic = state.contentTopic === 'all' || question.topicId === state.contentTopic;
    const searchable = `${question.id} ${question.prompt} ${question.topicName} ${question.concept} ${question.difficultyLabel} ${question.status}`.toLowerCase();
    return matchesTopic && (!search || searchable.includes(search));
  });
  const pageSize = 100;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(Math.max(1, state.contentPage), pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const visibleQuestions = filtered.slice(pageStart, pageStart + pageSize);
  const firstVisible = filtered.length ? pageStart + 1 : 0;
  const lastVisible = Math.min(pageStart + pageSize, filtered.length);

  return `<div class="page">
    <section class="page-intro"><div><span class="page-kicker">Content studio</span><h1>Validated, versioned, transparent.</h1><p>Explore 90 reviewer-published questions and 1,000 automatically validated pilot questions. Correct answers remain server-side.</p></div><div class="studio-statuses"><span class="status-pill status-pill--success">${icon('checkCircle', 16)} ${formatCount(summary.published)} published</span><span class="status-pill status-pill--pilot">${icon('clock', 16)} ${formatCount(summary.pilot)} pilot</span></div></section>
    <section class="stat-grid stat-grid--four studio-stats">
      <article class="stat-card"><span class="stat-icon stat-icon--indigo">${icon('layers', 20)}</span><div><small>Versioned questions</small><strong>${formatCount(summary.total)}</strong><p>Content ${escapeHtml(summary.version)}</p></div></article>
      <article class="stat-card"><span class="stat-icon stat-icon--green">${icon('checkCircle', 20)}</span><div><small>Reviewer-published</small><strong>${formatCount(summary.published)}</strong><p>Existing reviewed bank</p></div></article>
      <article class="stat-card"><span class="stat-icon stat-icon--coral">${icon('clock', 20)}</span><div><small>Pilot validated</small><strong>${formatCount(summary.pilot)}</strong><p>Human review pending</p></div></article>
      <article class="stat-card"><span class="stat-icon stat-icon--gold">${icon('target', 20)}</span><div><small>Difficulty coverage</small><strong>${formatCount(summary.byDifficulty.easy)} / ${formatCount(summary.byDifficulty.medium)} / ${formatCount(summary.byDifficulty.tough)}</strong><p>Easy · Medium · Tough</p></div></article>
    </section>
    <section class="stat-grid stat-grid--four studio-topic-stats" aria-label="Question counts by topic">${summary.byTopic.map((topic) => { const meta = state.bootstrap.dashboard.topics.find((candidate) => candidate.id === topic.topicId); const tone = meta?.accent === 'emerald' ? 'green' : meta?.accent || 'indigo'; return `<article class="stat-card"><span class="stat-icon stat-icon--${tone}">${icon(meta?.icon || 'layers', 20)}</span><div><small>${escapeHtml(topic.topicName)}</small><strong>${formatCount(topic.count)}</strong><p>${topic.easy} Easy · ${topic.medium} Medium · ${topic.tough} Tough</p></div></article>`; }).join('')}</section>
    <section class="panel studio-panel">
      <div class="studio-toolbar"><div><span class="page-kicker">Question catalogue</span><h2>Published and pilot bank</h2></div><div class="studio-filters"><label class="search-field">${icon('search', 17)}<input type="search" placeholder="Search prompt or concept" value="${escapeHtml(state.contentSearch)}" data-content-search aria-label="Search question catalogue"></label><label class="select-field">${icon('filter', 17)}<select data-content-topic aria-label="Filter by topic"><option value="all">All topics</option>${summary.byTopic.map((topic) => `<option value="${topic.topicId}" ${state.contentTopic === topic.topicId ? 'selected' : ''}>${escapeHtml(topic.topicName)}</option>`).join('')}</select></label></div></div>
      <div class="content-table-wrap"><table class="content-table"><thead><tr><th>Item</th><th>Topic / concept</th><th>Form</th><th>Difficulty</th><th>Status</th><th>Version</th></tr></thead><tbody>${visibleQuestions.map((question) => { const published = question.status === 'published'; return `<tr><td><strong>${escapeHtml(question.id)}</strong><small title="${escapeHtml(question.prompt)}">${escapeHtml(question.prompt)}</small></td><td><strong>${escapeHtml(question.topicName)}</strong><small>${escapeHtml(titleCase(question.concept))}</small></td><td>${escapeHtml(titleCase(question.type))}</td><td><span class="difficulty-badge">${escapeHtml(difficultyName(question))}</span></td><td><span class="status-pill ${published ? 'status-pill--success' : 'status-pill--pilot'}">${published ? 'Published' : 'Pilot'}</span></td><td>v${question.version}</td></tr>`; }).join('')}</tbody></table>${filtered.length ? '' : '<div class="table-empty">No questions match this filter.</div>'}</div>
      <div class="studio-pagination"><span>Showing ${formatCount(firstVisible)}–${formatCount(lastVisible)} of ${formatCount(filtered.length)}</span><div><button class="button button--ghost button--small" type="button" data-action="content-prev" ${currentPage === 1 ? 'disabled' : ''}>${icon('chevronLeft', 15)} Previous</button><span>Page ${currentPage} of ${pageCount}</span><button class="button button--ghost button--small" type="button" data-action="content-next" ${currentPage === pageCount ? 'disabled' : ''}>Next ${icon('chevronRight', 15)}</button></div></div>
      <div class="studio-footnote">${icon('shield', 17)} Every question has a version, two progressive hints, a worked solution, misconception feedback, provenance, and review status.</div>
    </section>
  </div>`;
}

function renderLessonVisual(lesson) {
  if (lesson.visual === 'percent-grid') return `<div class="lesson-model percent-model"><div class="percent-blocks">${Array.from({ length: 20 }, (_, index) => `<i class="${index < 3 ? 'is-active' : ''}"></i>`).join('')}</div><span>15 of 100</span></div>`;
  if (lesson.visual === 'ratio-bars') return `<div class="lesson-model ratio-model"><div><span></span><span></span><span></span></div><div><span></span><span></span></div><small>3 equal parts : 2 equal parts</small></div>`;
  if (lesson.visual === 'concept-map') return `<div class="lesson-model concept-model" aria-hidden="true">${lesson.steps.map((step, index) => `<div><span>${icon(['target', 'layers', 'checkCircle'][index] || 'checkCircle', 20)}</span><strong>${escapeHtml(step.value)}</strong></div>`).join('')}</div>`;
  return `<div class="lesson-model sentence-model"><span class="sentence-subject">The list</span><span class="sentence-detail">of candidates</span><span class="sentence-verb">was posted</span><i></i></div>`;
}

function missionIntroView() {
  const mission = state.mission;
  const theme = missionTheme(mission);
  const topic = state.bootstrap?.dashboard.topics.find((candidate) => candidate.id === mission.topicId);
  const region = topic ? regionFor(topic) : null;
  return `<div class="mission-page mission-page--intro">
    <header class="mission-topbar">${brand(true)}<button type="button" class="button button--ghost button--small" data-nav="/">Save & leave</button></header>
    <main id="main-content" class="mission-intro-main">
      <div class="mission-orb" aria-hidden="true">${icon(mission.type === 'diagnostic' ? 'telescope' : 'compass', 44)}</div>
      <span class="page-kicker">${escapeHtml(theme.kicker)}</span>
      <h1>${escapeHtml(mission.title)}</h1><p>${escapeHtml(mission.subtitle)}</p>
      ${topic && region ? `<div class="mission-route-tag">${icon('map', 15)} Route ${routeNumber(topic.id)} · ${escapeHtml(topic.name)} · ${escapeHtml(region.name)}</div>` : ''}
      <div class="mission-facts"><span>${icon('clock', 18)} About ${mission.expectedMinutes} minutes</span><span>${icon('layers', 18)} ${mission.questions.length} encounters</span><span>${icon('timer', 18)} No timer</span></div>
      <div class="mission-composition"><div><i class="composition-current"></i><span><strong>50%</strong> current growth</span></div><div><i class="composition-repair"></i><span><strong>20%</strong> false-trail repair</span></div><div><i class="composition-review"></i><span><strong>20%</strong> waypoint revisit</span></div><div><i class="composition-transfer"></i><span><strong>10%</strong> transfer</span></div></div>
      <button class="button button--primary button--large" type="button" data-action="begin-mission">${mission.lesson ? escapeHtml(theme.begin) : 'Begin the survey'} ${icon('arrowRight', 19)}</button>
      <small class="mission-calm-note">You can pause any time. Speed does not affect charted mastery.</small>
    </main>
  </div>`;
}

function missionLessonView() {
  const lesson = state.mission.lesson;
  return `<div class="mission-page">
    <header class="mission-topbar"><button class="icon-button" type="button" data-action="mission-back" aria-label="Back to route briefing">${icon('arrowLeft', 21)}</button><div class="mission-progress-label"><span>Field Guide</span><div class="top-progress"><i style="--value:12%"></i></div></div><button type="button" class="text-button" data-nav="/">Save & leave</button></header>
    <main class="lesson-main" id="main-content">
      <section class="lesson-copy"><span class="page-kicker">${icon('telescope', 15)} ${escapeHtml(lesson.eyebrow)}</span><h1>${escapeHtml(lesson.title)}</h1><p>${escapeHtml(lesson.summary)}</p>${renderLessonVisual(lesson)}</section>
      <section class="lesson-steps"><h2>Chart the method</h2>${lesson.steps.map((step, index) => `<article><span>0${index + 1}</span><div><small>${escapeHtml(step.label)}</small><strong>${escapeHtml(step.value)}</strong><p>${escapeHtml(step.note)}</p></div></article>`).join('')}<div class="lesson-check">${icon('bulb', 20)}<p>${escapeHtml(lesson.check)}</p></div><button class="button button--primary button--wide button--large" type="button" data-action="start-questions">Set out on the route ${icon('arrowRight', 19)}</button></section>
    </main>
  </div>`;
}

function answerIsPresent(question, answer) {
  if (question.type === 'matching') return answer && question.matchRows.every((row) => answer[row.id]);
  if (question.type === 'ordering') return Array.isArray(answer) && answer.length === question.options.length;
  return answer !== null && answer !== undefined && String(answer).trim() !== '';
}

function answerControl(question, answer, context = 'mission') {
  const actionPrefix = context === 'assessment' ? 'assessment' : 'mission';
  if (['mcq', 'error-spot'].includes(question.type)) {
    return `<div class="option-list${question.type === 'error-spot' ? ' option-list--segments' : ''}" role="radiogroup" aria-label="Answer choices">${question.options.map((option, index) => `<button type="button" class="answer-option${answer === option.id ? ' is-selected' : ''}" data-action="${actionPrefix}-select" data-value="${option.id}" role="radio" aria-checked="${answer === option.id}"><span class="option-key">${String.fromCharCode(65 + index)}</span><span>${escapeHtml(option.label)}</span><i>${icon('check', 16)}</i></button>`).join('')}</div>`;
  }
  if (question.type === 'numeric') {
    return `<label class="numeric-answer"><span>Your answer</span><div><input type="text" inputmode="decimal" autocomplete="off" placeholder="Enter a number" value="${escapeHtml(answer ?? '')}" data-${actionPrefix}-input aria-label="Numeric answer">${question.inputSuffix ? `<span>${escapeHtml(question.inputSuffix.trim())}</span>` : ''}</div><small>You can use decimals where needed.</small></label>`;
  }
  if (question.type === 'short-text') {
    return `<label class="numeric-answer text-answer"><span>Your correction</span><div><input type="text" autocomplete="off" spellcheck="true" placeholder="Type the corrected words" value="${escapeHtml(answer ?? '')}" data-${actionPrefix}-input aria-label="Corrected phrase"></div><small>Capitalisation and final punctuation are flexible.</small></label>`;
  }
  if (question.type === 'ordering') {
    const ordered = Array.isArray(answer) ? answer : [];
    return `<div class="ordering-control"><p>Select each step in the order you would use it.</p><div class="ordered-slots">${question.options.map((_, index) => { const selected = question.options.find((option) => option.id === ordered[index]); return `<div class="order-slot${selected ? ' is-filled' : ''}"><span>${index + 1}</span>${selected ? escapeHtml(selected.label) : 'Choose a step'}</div>`; }).join('')}</div><div class="order-options">${question.options.filter((option) => !ordered.includes(option.id)).map((option) => `<button type="button" class="answer-option" data-action="${actionPrefix}-order" data-value="${option.id}">${icon('more', 18)}<span>${escapeHtml(option.label)}</span></button>`).join('')}</div>${ordered.length ? `<button type="button" class="text-button" data-action="${actionPrefix}-order-clear">${icon('refresh', 15)} Reset order</button>` : ''}</div>`;
  }
  if (question.type === 'matching') {
    const matches = answer && typeof answer === 'object' ? answer : {};
    return `<div class="matching-control"><p>Choose the matching value for each row.</p>${question.matchRows.map((row) => `<label><span>${escapeHtml(row.label)}</span><select data-${actionPrefix}-match="${row.id}" aria-label="Match for ${escapeHtml(row.label)}"><option value="">Choose…</option>${question.matchOptions.map((option) => `<option value="${option.id}" ${matches[row.id] === option.id ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}</select></label>`).join('')}</div>`;
  }
  return '';
}

function feedbackView(question) {
  const feedback = state.feedback;
  const wrong = !feedback.correct;
  const retryAvailable = wrong && feedback.retryQuestion && !state.isRetry;
  return `<section class="feedback-card feedback-card--${feedback.correct ? 'correct' : 'repair'}" aria-live="polite">
    <div class="feedback-result"><span class="feedback-icon">${icon(feedback.correct ? 'check' : 'footsteps', 27)}</span><div><span>${escapeHtml(feedback.label)}</span><h2>${feedback.correct ? 'That route holds.' : 'This route needs one repair.'}</h2></div>${feedback.reward.petals ? `<span class="reward-chip">${icon('sparkles', 15)} +${feedback.reward.petals}</span>` : ''}</div>
    <p class="feedback-message">${escapeHtml(feedback.message)}</p>
    ${feedback.misconception ? `<div class="misconception-note"><span class="misconception-tag">${icon('footsteps', 14)} False trail</span><strong>${escapeHtml(feedback.misconception.title)}</strong><p>${escapeHtml(feedback.misconception.copy)}</p></div>` : ''}
    <div class="solution-box"><div class="solution-heading"><span>${icon('route', 18)} Route walkthrough</span><small>Answer: ${escapeHtml(feedback.correctAnswer)}</small></div><ol>${feedback.solutionSteps.slice(0, state.solutionVisible).map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>${state.solutionVisible < feedback.solutionSteps.length ? `<button type="button" class="text-link" data-action="show-solution-step">Show the next step ${icon('chevronRight', 15)}</button>` : ''}</div>
    <div class="feedback-actions">${retryAvailable ? `<button class="button button--primary button--large" type="button" data-action="begin-retry">Take the alternate route ${icon('route', 18)}</button>` : `<button class="button button--primary button--large" type="button" data-action="next-question">${state.missionIndex === state.mission.questions.length - 1 ? 'Close the expedition log' : 'Continue the route'} ${icon('arrowRight', 18)}</button>`}<button class="button button--ghost" type="button" data-action="bookmark-question" data-question="${question.id}">${icon('bookmark', 17)} ${state.bootstrap.user.bookmarks.includes(question.id) ? 'Bookmarked' : 'Bookmark'}</button></div>
  </section>`;
}

function missionQuestionView() {
  const mission = state.mission;
  const question = state.currentQuestion || mission.questions[state.missionIndex];
  const progress = Math.round((state.missionIndex / mission.questions.length) * 100);
  const answered = Boolean(state.feedback);
  return `<div class="mission-page mission-page--question">
    <header class="mission-topbar"><button class="icon-button" type="button" data-nav="/" aria-label="Save and return home">${icon('close', 21)}</button><div class="mission-progress-label"><span>${state.isRetry ? 'Route repair' : `Stop ${state.missionIndex + 1} of ${mission.questions.length}`}</span><div class="top-progress"><i style="--value:${progress}%"></i></div></div><span class="mission-mode-label">${icon('timer', 16)} Untimed</span></header>
    <main class="question-main" id="main-content">
      <section class="question-card">
        <div class="question-meta"><span class="pill">${state.isRetry ? `${icon('route', 14)} Alternate route` : question.topicName || (mission.type === 'diagnostic' ? 'Route survey' : 'Mixed routes')}</span><div class="question-signals"><span>${escapeHtml(difficultyName(question))} · about ${question.expectedSeconds}s</span>${question.status === 'pilot' ? '<span class="status-pill status-pill--pilot">Pilot question · review pending</span>' : ''}</div></div>
        <h1>${escapeHtml(question.prompt)}</h1>
        ${answered ? feedbackView(question) : `<div class="answer-area">${answerControl(question, state.answer, 'mission')}</div><div class="question-tools"><button class="button button--hint" type="button" data-action="request-hint" ${state.hintIndex >= question.hintCount ? 'disabled' : ''}>${icon('compass', 17)} ${state.hints.length ? 'Another compass hint' : 'Use a compass hint'}</button><button class="text-button" type="button" data-action="open-report-dialog">${icon('flag', 16)} Report item</button></div>${state.hints.length ? `<div class="hint-stack" aria-live="polite">${state.hints.map((hint, index) => `<div><span>Compass hint ${index + 1}</span><p>${escapeHtml(hint)}</p></div>`).join('')}</div>` : ''}<button class="button button--primary button--large button--wide question-submit" type="button" data-action="submit-answer" ${!answerIsPresent(question, state.answer) || state.busy ? 'disabled' : ''}>${state.busy ? buttonBusy('Checking the method') : `Check my method ${icon('arrowRight', 18)}`}</button>`}
      </section>
      <aside class="question-aside"><div class="aside-card"><span class="page-kicker">Route map</span><div class="step-dots">${mission.questions.map((_, index) => `<i class="${index < state.missionIndex ? 'is-complete' : index === state.missionIndex ? 'is-current' : ''}">${index < state.missionIndex ? icon('check', 12) : index + 1}</i>`).join('')}</div><p>Markers show position along the route, not urgency.</p></div><div class="aside-card calm-reminder">${icon('compass', 20)}<p><strong>Method before speed.</strong> Readiness beacons are measured separately in the Summit Vault.</p></div></aside>
    </main>
    <dialog class="dialog" id="report-dialog"><form method="dialog" id="report-form"><button class="dialog-close icon-button" value="cancel" aria-label="Close">${icon('close', 20)}</button><span class="dialog-icon">${icon('flag', 23)}</span><h2>Report this question</h2><p>Tell the content reviewer what seems unclear or incorrect.</p><label class="field"><span>What should we review?</span><textarea name="reason" rows="4" maxlength="500" placeholder="Wording, answer, explanation, accessibility…" required></textarea></label><input type="hidden" name="questionId" value="${question.id}"><div class="dialog-actions"><button class="button button--ghost" value="cancel">Cancel</button><button class="button button--primary" type="submit" value="default">Send to review</button></div></form></dialog>
  </div>`;
}

function missionSummaryView() {
  const summary = state.missionSummary;
  const strongest = [...summary.topics].sort((a, b) => b.mastery - a.mastery)[0];
  const strongestRoute = routeState(strongest);
  return `<div class="mission-page mission-page--summary">
    <header class="mission-topbar">${brand(true)}<span class="status-pill status-pill--success">Expedition complete</span></header>
    <main class="summary-main" id="main-content">
      <div class="summary-atlas" aria-hidden="true"><span class="summary-contour"></span><span class="summary-route"></span><i class="summary-stop summary-stop--one">${icon('footsteps', 13)}</i><i class="summary-stop summary-stop--two">${icon('waypoint', 13)}</i><i class="summary-landmark">${icon('landmark', 18)}</i></div>
      <span class="page-kicker">Expedition log · a deliberate stopping point</span><h1>Route restored.</h1><p>You recovered one useful method. The atlas changed because of learning evidence—not because the page was open.</p>
      <div class="summary-stats"><div><strong>${summary.accuracy}%</strong><span>first-answer accuracy</span></div><div><strong>${summary.retryWins}</strong><span>false trails repaired</span></div><div><strong>+${summary.petalsEarned}</strong><span>petals earned</span></div></div>
      ${summary.sealsAwarded?.length ? `<div class="summary-seals"><span class="page-kicker">${icon('seal', 15)} ${summary.sealsAwarded.length === 1 ? 'New atlas seal' : 'New atlas seals'}</span><ul>${summary.sealsAwarded.map((seal) => `<li><strong>${escapeHtml(seal.name)}</strong><small>${escapeHtml(seal.requirement)}</small></li>`).join('')}</ul></div>` : ''}
      <article class="summary-insight"><span class="topic-symbol">${icon(strongest.icon, 21)}</span><div><small>Strongest signal today</small><strong>${escapeHtml(strongest.name)} · ${escapeHtml(strongestRoute.label)} · ${strongest.mastery}% mastery</strong><p>${escapeHtml(summary.recommendation.reason)}</p></div></article>
      <div class="summary-actions"><button class="button button--primary button--large" type="button" data-action="finish-mission">Return to the atlas ${icon('arrowRight', 18)}</button><button class="button button--ghost" type="button" data-nav="/progress">See what changed</button></div>
      <small class="mission-calm-note">Stopping here is a complete session. Continuing is optional.</small>
    </main>
  </div>`;
}

function renderMission() {
  if (!state.mission) return loadingView('Restoring your expedition…');
  if (state.missionStage === 'intro') return missionIntroView();
  if (state.missionStage === 'lesson') return missionLessonView();
  if (state.missionStage === 'summary') return missionSummaryView();
  return missionQuestionView();
}

function formatTimer(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function assessmentAnswer(question) {
  return state.assessmentAnswers[question.id]?.answer ?? null;
}

function assessmentView() {
  const assessment = state.assessment;
  const question = assessment.questions[state.assessmentIndex];
  const answer = assessmentAnswer(question);
  const answeredCount = Object.values(state.assessmentAnswers).filter((entry) => answerIsPresent(assessment.questions.find((item) => item.id === entry.questionId) || question, entry.answer)).length;
  return `<div class="assessment-page">
    <header class="assessment-header"><div>${brand(true, { tagline: false })}<span class="assessment-title">Mixed placement sprint</span></div><div class="assessment-timer" role="timer" aria-live="off">${icon('timer', 19)}<span id="assessment-time">${formatTimer(assessment.durationSeconds)}</span></div><button class="button button--ghost button--small" type="button" data-action="open-submit-dialog">Submit test</button></header>
    <div class="assessment-layout">
      <aside class="assessment-nav" aria-label="Question navigation"><div class="assessment-nav-heading"><span>Question palette</span><small>${answeredCount}/${assessment.questions.length} answered</small></div><div class="question-palette">${assessment.questions.map((item, index) => { const hasAnswer = answerIsPresent(item, assessmentAnswer(item)); const marked = state.assessmentMarked.has(item.id); return `<button type="button" class="palette-item${index === state.assessmentIndex ? ' is-current' : ''}${hasAnswer ? ' is-answered' : ''}${marked ? ' is-marked' : ''}" data-action="assessment-go" data-index="${index}" aria-label="Question ${index + 1}${hasAnswer ? ', answered' : ''}${marked ? ', marked for review' : ''}">${index + 1}</button>`; }).join('')}</div><div class="palette-legend"><span><i class="legend-current"></i>Current</span><span><i class="legend-answered"></i>Answered</span><span><i class="legend-marked"></i>Review</span></div><div class="assessment-note">${icon('info', 16)} Answers and explanations stay hidden until you submit.</div></aside>
      <main class="assessment-main" id="main-content"><div class="assessment-question-meta"><span>Question ${state.assessmentIndex + 1} of ${assessment.questions.length}</span><div class="question-signals"><span>${escapeHtml(difficultyName(question))} · suggested ${question.expectedSeconds}s</span>${question.status === 'pilot' ? '<span class="status-pill status-pill--pilot">Pilot question · practice signal</span>' : ''}</div></div><h1>${escapeHtml(question.prompt)}</h1><div class="assessment-answer">${answerControl(question, answer, 'assessment')}</div><div class="assessment-controls"><button class="button button--ghost" type="button" data-action="assessment-mark">${icon('flag', 17)} ${state.assessmentMarked.has(question.id) ? 'Marked for review' : 'Mark for review'}</button><div><button class="button button--ghost" type="button" data-action="assessment-prev" ${state.assessmentIndex === 0 ? 'disabled' : ''}>${icon('chevronLeft', 17)} Previous</button><button class="button button--primary" type="button" data-action="assessment-next">${state.assessmentIndex === assessment.questions.length - 1 ? 'Review palette' : 'Save & next'} ${icon('chevronRight', 17)}</button></div></div></main>
    </div>
    <dialog class="dialog" id="submit-dialog"><div><button class="dialog-close icon-button" type="button" data-action="close-submit-dialog" aria-label="Close">${icon('close', 20)}</button><span class="dialog-icon">${icon('flag', 23)}</span><h2>Submit your sprint?</h2><p>You answered ${answeredCount} of ${assessment.questions.length}. Unanswered items will be scored as incorrect.</p><div class="dialog-actions"><button class="button button--ghost" type="button" data-action="close-submit-dialog">Keep working</button><button class="button button--primary" type="button" data-action="confirm-assessment-submit">Submit & see report</button></div></div></dialog>
  </div>`;
}

function displaySuppliedAnswer(review) {
  const question = review.question;
  const value = review.suppliedAnswer;
  if (['mcq', 'error-spot'].includes(question.type)) return question.options?.find((option) => option.id === value)?.label || 'No answer';
  if (question.type === 'ordering' && Array.isArray(value)) return value.map((id) => question.options?.find((option) => option.id === id)?.label).filter(Boolean).join(' → ') || 'No answer';
  if (question.type === 'matching' && value) return question.matchRows?.map((row) => `${row.label}: ${question.matchOptions?.find((option) => option.id === value[row.id])?.label || '—'}`).join('; ');
  return value === undefined || value === null || value === '' ? 'No answer' : String(value);
}

function assessmentReportView() {
  const report = state.assessmentReport;
  const domainResults = report.byDomain || [];
  const topicResults = report.byTopic || [];
  const allSingleItemSignals = topicResults.length > 0 && topicResults.every((topic) => topic.signal === 'single-item');
  const topicHeading = allSingleItemSignals ? 'One item per route—not a final skill score.' : 'Sampled evidence by route.';
  const regionName = (domain) => REGIONS.find((region) => region.domain === domain)?.name || domain;
  return `<div class="report-page">
    <header class="mission-topbar">${brand(true)}<span class="status-pill">Sprint submitted</span></header>
    <main class="report-main" id="main-content">
      <section class="report-hero"><div><span class="page-kicker">Summit Vault report</span><h1>${report.accuracy >= 75 ? 'Accuracy is holding.' : 'The vault found your next route.'}</h1><p>${escapeHtml(report.nextRecommendation.reason)}</p><div class="report-actions"><button class="button button--primary" type="button" data-action="finish-assessment">Return to the journal ${icon('arrowRight', 17)}</button><button class="button button--ghost" type="button" data-action="start-mission" data-type="${report.nextRecommendation.type === 'assessment' ? 'daily' : report.nextRecommendation.type}" data-topic="${report.nextRecommendation.topicId}">Follow recommendation</button></div></div><div class="report-score">${progressRing(report.accuracy, 'Accuracy', 'xlarge')}<span>${report.score} of ${report.total} correct</span></div></section>
      ${domainResults.length ? `<section class="report-breakdown"><div class="section-row"><div><span class="page-kicker">Region breakdown</span><h2>Use the broader signal first.</h2></div><span class="calm-label">${escapeHtml(report.readinessPolicy || 'Assessment evidence stays separate from mastery')}</span></div><div class="report-topic-grid report-domain-grid">${domainResults.map((domain) => `<article><div><h3>${escapeHtml(regionName(domain.domain))}</h3><span>${domain.correct}/${domain.total} correct</span></div><strong>${domain.accuracy}%</strong>${miniBar(domain.accuracy, `${domain.domain} assessment accuracy`)}<p>${escapeHtml(domain.domain)} · based on ${domain.total} sampled item${domain.total === 1 ? '' : 's'}.</p></article>`).join('')}</div></section>` : ''}
      <section class="report-breakdown"><div class="section-row"><div><span class="page-kicker">Route samples</span><h2>${escapeHtml(topicHeading)}</h2></div><span class="calm-label">Build a trend through Focus Trails</span></div><div class="report-topic-grid">${topicResults.map((topic) => { const readiness = report.readiness.find((item) => item.topicId === topic.topicId); const resultLabel = topic.signal === 'not-sampled' ? 'Not sampled' : topic.correct === topic.total ? 'Held' : topic.correct === 0 ? 'Review' : 'Mixed'; return `<article><div><h3>${escapeHtml(topic.name)}</h3><span>${topic.correct}/${topic.total} sampled</span></div><strong>${resultLabel}</strong>${miniBar(topic.accuracy, `${topic.name} sampled result`)}<p>${escapeHtml(topic.nextAction)}</p><small>Mastery ${readiness?.mastery || 0}% · readiness ${readiness?.readiness || 0}%</small></article>`; }).join('')}</div></section>
      <section class="review-section"><div class="section-row"><div><span class="page-kicker">Route walkthroughs</span><h2>Review the method, not only the key.</h2></div></div><div class="review-list">${report.review.map((item, index) => `<details class="review-item${item.correct ? ' is-correct' : ' is-incorrect'}"><summary><span class="review-number">${index + 1}</span><span><strong>${escapeHtml(item.question.prompt)}</strong><small>${item.correct ? 'Correct method' : 'Needs repair'} · ${escapeHtml(item.question.topicName)}${item.question.status === 'pilot' ? ' · Pilot' : ''}</small></span><i>${icon(item.correct ? 'checkCircle' : 'alertCircle', 19)}</i></summary><div class="review-body"><div class="answer-comparison"><p><span>Your answer</span><strong>${escapeHtml(displaySuppliedAnswer(item))}</strong></p><p><span>Correct answer</span><strong>${escapeHtml(item.correctAnswer)}</strong></p></div><ol>${item.solutionSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol></div></details>`).join('')}</div></section>
    </main>
  </div>`;
}

async function renderRoute() {
  clearInterval(state.assessmentTimer);
  const path = location.pathname;
  if (!state.bootstrap) {
    app.innerHTML = path === '/onboarding' ? onboardingView() : welcomeView();
    focusMainHeading();
    return;
  }

  if (path.startsWith('/mission/')) {
    const missionId = path.split('/')[2];
    if (!state.mission || state.mission.id !== missionId) {
      app.innerHTML = loadingView('Restoring your expedition…');
      try {
        state.mission = await api.getMission(missionId);
        resetMissionState('intro');
      } catch (error) {
        state.mission = null;
        toast(error.message, 'error');
        navigate('/', { replace: true });
        return;
      }
    }
    app.innerHTML = renderMission();
    focusMainHeading();
    return;
  }

  if (path.startsWith('/assessment/')) {
    if (state.assessmentReport) app.innerHTML = assessmentReportView();
    else if (state.assessment) {
      app.innerHTML = assessmentView();
      startAssessmentTimer();
    } else {
      const assessmentId = path.split('/')[2];
      app.innerHTML = loadingView('Restoring your Summit Vault sprint…');
      try {
        state.assessment = await api.getAssessment(assessmentId);
        if (state.assessment.report) state.assessmentReport = state.assessment.report;
        renderRoute();
      } catch (error) {
        toast(error.message, 'error');
        navigate('/sprint', { replace: true });
      }
    }
    focusMainHeading();
    return;
  }

  if (path === '/onboarding') {
    navigate('/', { replace: true });
    return;
  }

  let content;
  if (path === '/') content = homeView();
  else if (path === '/learn') content = learnView();
  else if (path === '/progress') content = progressView();
  else if (path === '/sprint') content = sprintIntroView();
  else if (path === '/settings') content = settingsView();
  else if (path === '/studio') {
    if (!state.content) {
      app.innerHTML = appShell(loadingView('Opening the question catalogue…'), path);
      try {
        state.content = await api.getContent();
      } catch (error) {
        toast(error.message, 'error');
        navigate('/', { replace: true });
        return;
      }
    }
    content = studioView();
  } else {
    navigate('/', { replace: true });
    return;
  }
  app.innerHTML = appShell(content, path);
  focusMainHeading();
}

function resetMissionState(stage = 'intro') {
  state.missionStage = stage;
  state.missionIndex = 0;
  state.currentQuestion = state.mission?.questions[0] || null;
  state.originalQuestion = null;
  state.isRetry = false;
  state.answer = null;
  state.hints = [];
  state.hintIndex = 0;
  state.feedback = null;
  state.solutionVisible = 1;
  state.questionStartedAt = performance.now();
  state.missionSummary = null;
}

function resetQuestion(question = null) {
  state.currentQuestion = question || state.mission.questions[state.missionIndex];
  state.answer = null;
  state.hints = [];
  state.hintIndex = 0;
  state.feedback = null;
  state.solutionVisible = 1;
  state.questionStartedAt = performance.now();
}

async function guestPreview() {
  if (state.busy) return;
  state.busy = true;
  try {
    const session = await api.createSession({ mode: 'guest', name: 'Guest learner' });
    setToken(session.token);
    await api.updateProfile({ onboardingComplete: true, chosenStart: 'daily' });
    await refreshBootstrap();
    await api.recordEvent('guest_preview_started');
    navigate('/');
  } catch (error) {
    setToken(null);
    toast(error.message, 'error');
  } finally {
    state.busy = false;
  }
}

async function submitOnboarding(form) {
  if (state.busy) return;
  state.busy = true;
  renderRoute();
  const data = new FormData(form);
  const chosenStart = data.get('chosenStart');
  try {
    const session = await api.createSession({ mode: 'email', name: data.get('name'), email: data.get('email') });
    setToken(session.token);
    await api.updateProfile({
      name: data.get('name'),
      placementWindow: data.get('placementWindow'),
      weeklyMinutes: Number(data.get('weeklyMinutes')),
      confidence: data.get('confidence'),
      target: data.get('target') || 'Campus placements',
      chosenStart,
      onboardingComplete: true
    });
    await refreshBootstrap();
    await api.recordEvent('onboarding_completed', { chosenStart });
    if (chosenStart === 'diagnostic') await startMission('diagnostic');
    else await startMission('topic', chosenStart);
  } catch (error) {
    setToken(null);
    state.bootstrap = null;
    toast(error.message, 'error');
    navigate('/onboarding', { replace: true });
  } finally {
    state.busy = false;
  }
}

async function startMission(type = 'daily', topicId = null) {
  if (state.busy) return;
  state.busy = true;
  try {
    const mission = await api.createMission({ type, topicId });
    state.mission = mission;
    resetMissionState('intro');
    await api.recordEvent('mission_started', { type, topicId: mission.topicId });
    history.pushState({}, '', `/mission/${mission.id}`);
    await renderRoute();
  } catch (error) {
    toast(error.message, 'error');
  } finally {
    state.busy = false;
  }
}

async function requestHint() {
  const question = state.currentQuestion;
  if (!question || state.hintIndex >= question.hintCount) return;
  try {
    const result = await api.requestHint(state.mission.id, { questionId: question.id, index: state.hintIndex });
    state.hints.push(result.hint);
    state.hintIndex += 1;
    app.innerHTML = renderMission();
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function submitMissionAnswer() {
  const question = state.currentQuestion;
  if (!answerIsPresent(question, state.answer) || state.busy) return;
  state.busy = true;
  app.innerHTML = renderMission();
  try {
    state.feedback = await api.submitAttempt(state.mission.id, {
      questionId: question.id,
      questionVersion: question.version,
      answer: state.answer,
      hintCount: state.hints.length,
      responseMs: Math.round(performance.now() - state.questionStartedAt),
      isRetry: state.isRetry,
      originalQuestionId: state.originalQuestion?.id || null
    });
    if (state.feedback.reward?.petals) state.bootstrap.user.progress.petals += state.feedback.reward.petals;
    state.solutionVisible = state.feedback.correct ? 1 : Math.min(1, state.feedback.solutionSteps.length);
    await api.recordEvent('attempt_submitted', { questionId: question.id, correct: state.feedback.correct, isRetry: state.isRetry, hints: state.hints.length });
  } catch (error) {
    toast(error.message, 'error');
  } finally {
    state.busy = false;
    app.innerHTML = renderMission();
  }
}

async function advanceMission() {
  state.isRetry = false;
  state.originalQuestion = null;
  if (state.missionIndex >= state.mission.questions.length - 1) {
    state.busy = true;
    try {
      state.missionSummary = await api.completeMission(state.mission.id);
      await refreshBootstrap();
      state.missionStage = 'summary';
      app.innerHTML = renderMission();
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      state.busy = false;
    }
    return;
  }
  state.missionIndex += 1;
  resetQuestion();
  app.innerHTML = renderMission();
  focusMainHeading();
}

async function finishMission() {
  state.mission = null;
  state.missionSummary = null;
  await refreshBootstrap();
  navigate('/');
}

async function startAssessment() {
  if (state.busy) return;
  state.busy = true;
  renderRoute();
  try {
    state.assessment = await api.createAssessment();
    state.assessmentIndex = 0;
    state.assessmentAnswers = {};
    state.assessmentMarked = new Set();
    state.assessmentReport = null;
    history.pushState({}, '', `/assessment/${state.assessment.id}`);
    await api.recordEvent('assessment_started', { assessmentId: state.assessment.id });
    renderRoute();
  } catch (error) {
    toast(error.message, 'error');
  } finally {
    state.busy = false;
  }
}

function assessmentEntry(question) {
  state.assessmentAnswers[question.id] ??= { questionId: question.id, questionVersion: question.version, answer: null, responseMs: 0, openedAt: performance.now() };
  return state.assessmentAnswers[question.id];
}

function saveAssessmentTime() {
  const question = state.assessment?.questions[state.assessmentIndex];
  if (!question) return;
  const entry = assessmentEntry(question);
  entry.responseMs += Math.max(0, Math.round(performance.now() - entry.openedAt));
  entry.openedAt = performance.now();
}

function goToAssessmentQuestion(index) {
  saveAssessmentTime();
  state.assessmentIndex = clamp(index, 0, state.assessment.questions.length - 1);
  const question = state.assessment.questions[state.assessmentIndex];
  assessmentEntry(question).openedAt = performance.now();
  app.innerHTML = assessmentView();
  startAssessmentTimer();
  focusMainHeading();
}

function secondsRemaining() {
  if (!state.assessment) return 0;
  const end = new Date(state.assessment.startedAt).getTime() + state.assessment.durationSeconds * 1000;
  return Math.max(0, Math.ceil((end - Date.now()) / 1000));
}

function startAssessmentTimer() {
  clearInterval(state.assessmentTimer);
  const update = () => {
    const remaining = secondsRemaining();
    const timer = document.querySelector('#assessment-time');
    if (timer) timer.textContent = formatTimer(remaining);
    if (remaining <= 60) timer?.closest('.assessment-timer')?.classList.add('is-low');
    if (remaining <= 0) {
      clearInterval(state.assessmentTimer);
      submitAssessment(true);
    }
  };
  update();
  state.assessmentTimer = window.setInterval(update, 1000);
}

async function submitAssessment(autoSubmitted = false) {
  if (state.busy || !state.assessment) return;
  state.busy = true;
  clearInterval(state.assessmentTimer);
  saveAssessmentTime();
  try {
    const elapsedSeconds = state.assessment.durationSeconds - secondsRemaining();
    state.assessmentReport = await api.submitAssessment(state.assessment.id, { answers: state.assessmentAnswers, elapsedSeconds });
    await refreshBootstrap();
    await api.recordEvent('assessment_submitted', { assessmentId: state.assessment.id, autoSubmitted, accuracy: state.assessmentReport.accuracy });
    app.innerHTML = assessmentReportView();
    focusMainHeading();
    if (autoSubmitted) toast('Time ended. Your submitted answers are safe.', 'info');
  } catch (error) {
    toast(error.message, 'error');
    startAssessmentTimer();
  } finally {
    state.busy = false;
  }
}

async function exportData() {
  try {
    const data = await api.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aptibloom-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast('Your progress export is ready.', 'success');
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function handleAction(button) {
  const action = button.dataset.action;
  if (action === 'guest-preview') return guestPreview();
  if (action === 'toggle-mobile-nav') {
    state.mobileNavOpen = !state.mobileNavOpen;
    renderRoute();
    return;
  }
  if (action === 'start-mission') return startMission(button.dataset.type || 'daily', button.dataset.topic || null);
  if (action === 'begin-mission') {
    state.missionStage = state.mission.lesson ? 'lesson' : 'question';
    if (state.missionStage === 'question') resetQuestion();
    app.innerHTML = renderMission(); focusMainHeading(); return;
  }
  if (action === 'mission-back') { state.missionStage = 'intro'; app.innerHTML = renderMission(); return; }
  if (action === 'start-questions') { state.missionStage = 'question'; resetQuestion(); app.innerHTML = renderMission(); focusMainHeading(); return; }
  if (action === 'mission-select') { state.answer = button.dataset.value; app.innerHTML = renderMission(); return; }
  if (action === 'mission-order') { state.answer = Array.isArray(state.answer) ? [...state.answer, button.dataset.value] : [button.dataset.value]; app.innerHTML = renderMission(); return; }
  if (action === 'mission-order-clear') { state.answer = []; app.innerHTML = renderMission(); return; }
  if (action === 'request-hint') return requestHint();
  if (action === 'submit-answer') return submitMissionAnswer();
  if (action === 'show-solution-step') { state.solutionVisible += 1; app.innerHTML = renderMission(); return; }
  if (action === 'begin-retry') { state.originalQuestion = state.currentQuestion; state.isRetry = true; resetQuestion(state.feedback.retryQuestion); app.innerHTML = renderMission(); focusMainHeading(); return; }
  if (action === 'next-question') return advanceMission();
  if (action === 'finish-mission') return finishMission();
  if (action === 'bookmark-question') {
    try {
      const result = await api.toggleBookmark(button.dataset.question);
      state.bootstrap.user.bookmarks = result.bookmarks;
      toast(result.bookmarked ? 'Question bookmarked.' : 'Bookmark removed.', 'success');
      app.innerHTML = renderMission();
    } catch (error) { toast(error.message, 'error'); }
    return;
  }
  if (action === 'open-report-dialog') { document.querySelector('#report-dialog')?.showModal(); return; }
  if (action === 'start-assessment') return startAssessment();
  if (action === 'assessment-select') {
    const question = state.assessment.questions[state.assessmentIndex];
    assessmentEntry(question).answer = button.dataset.value;
    app.innerHTML = assessmentView(); startAssessmentTimer(); return;
  }
  if (action === 'assessment-order') {
    const question = state.assessment.questions[state.assessmentIndex];
    const entry = assessmentEntry(question);
    entry.answer = Array.isArray(entry.answer) ? [...entry.answer, button.dataset.value] : [button.dataset.value];
    app.innerHTML = assessmentView(); startAssessmentTimer(); return;
  }
  if (action === 'assessment-order-clear') {
    const question = state.assessment.questions[state.assessmentIndex]; assessmentEntry(question).answer = []; app.innerHTML = assessmentView(); startAssessmentTimer(); return;
  }
  if (action === 'assessment-go') return goToAssessmentQuestion(Number(button.dataset.index));
  if (action === 'assessment-prev') return goToAssessmentQuestion(state.assessmentIndex - 1);
  if (action === 'assessment-next') return goToAssessmentQuestion(Math.min(state.assessment.questions.length - 1, state.assessmentIndex + 1));
  if (action === 'assessment-mark') {
    const id = state.assessment.questions[state.assessmentIndex].id;
    if (state.assessmentMarked.has(id)) state.assessmentMarked.delete(id); else state.assessmentMarked.add(id);
    app.innerHTML = assessmentView(); startAssessmentTimer(); return;
  }
  if (action === 'open-submit-dialog') { document.querySelector('#submit-dialog')?.showModal(); return; }
  if (action === 'close-submit-dialog') { document.querySelector('#submit-dialog')?.close(); return; }
  if (action === 'confirm-assessment-submit') { document.querySelector('#submit-dialog')?.close(); return submitAssessment(false); }
  if (action === 'finish-assessment') { state.assessment = null; state.assessmentReport = null; return navigate('/progress'); }
  if (action === 'content-prev' || action === 'content-next') {
    state.contentPage = Math.max(1, state.contentPage + (action === 'content-next' ? 1 : -1));
    app.innerHTML = appShell(studioView(), '/studio');
    document.querySelector('.studio-panel')?.scrollIntoView({ block: 'start', behavior: document.body.classList.contains('reduce-motion') ? 'auto' : 'smooth' });
    return;
  }
  if (action === 'export-data') return exportData();
  if (action === 'logout') {
    try { await api.logout(); } catch { /* Local sign-out still clears the client session. */ }
    setToken(null); state.bootstrap = null; state.mission = null; state.assessment = null; navigate('/', { replace: true }); return;
  }
  if (action === 'open-delete-dialog') { document.querySelector('#delete-dialog')?.showModal(); return; }
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  if (form.id === 'onboarding-form') return submitOnboarding(form);
  if (form.id === 'settings-form') {
    const data = new FormData(form);
    try {
      const profile = await api.updateProfile({ name: data.get('name'), placementWindow: data.get('placementWindow'), target: data.get('target') });
      state.bootstrap = profile;
      const settingsResult = await api.updateSettings({
        theme: data.get('theme'), reducedMotion: data.has('reducedMotion'), quietMode: data.has('quietMode'), socialComparison: data.has('socialComparison'), weeklyGoal: Number(data.get('weeklyGoal'))
      });
      state.bootstrap.user.settings = settingsResult.settings;
      state.bootstrap.dashboard = settingsResult.dashboard;
      applyTheme(settingsResult.settings);
      toast('Preferences saved.', 'success');
      renderRoute();
    } catch (error) { toast(error.message, 'error'); }
    return;
  }
  if (form.id === 'report-form') {
    const data = new FormData(form);
    try {
      const result = await api.reportQuestion(data.get('questionId'), data.get('reason'));
      document.querySelector('#report-dialog')?.close();
      toast(result.message, 'success');
    } catch (error) { toast(error.message, 'error'); }
    return;
  }
  if (form.id === 'delete-form') {
    const data = new FormData(form);
    try {
      await api.deleteAccount(data.get('confirmation'));
      setToken(null); state.bootstrap = null; state.mission = null;
      toast('Local account data deleted.', 'success');
      navigate('/', { replace: true });
    } catch (error) { toast(error.message, 'error'); }
  }
}

function handleInput(event) {
  if (event.target.matches('[data-mission-input]')) {
    state.answer = event.target.value;
    const button = document.querySelector('[data-action="submit-answer"]');
    if (button) button.disabled = !answerIsPresent(state.currentQuestion, state.answer);
  }
  if (event.target.matches('[data-assessment-input]')) {
    const question = state.assessment.questions[state.assessmentIndex];
    assessmentEntry(question).answer = event.target.value;
  }
  if (event.target.matches('[data-goal-range]')) {
    const output = document.querySelector('#goal-output');
    if (output) output.textContent = `${event.target.value} day${event.target.value === '1' ? '' : 's'}`;
  }
  if (event.target.matches('[data-content-search]')) {
    state.contentSearch = event.target.value;
    state.contentPage = 1;
    const position = event.target.selectionStart;
    app.innerHTML = appShell(studioView(), '/studio');
    const replacement = document.querySelector('[data-content-search]');
    replacement?.focus(); replacement?.setSelectionRange(position, position);
  }
}

function handleChange(event) {
  if (event.target.matches('[data-mission-match]')) {
    state.answer = state.answer && typeof state.answer === 'object' && !Array.isArray(state.answer) ? { ...state.answer } : {};
    state.answer[event.target.dataset.missionMatch] = event.target.value;
    app.innerHTML = renderMission();
  }
  if (event.target.matches('[data-assessment-match]')) {
    const question = state.assessment.questions[state.assessmentIndex];
    const entry = assessmentEntry(question);
    entry.answer = entry.answer && typeof entry.answer === 'object' && !Array.isArray(entry.answer) ? { ...entry.answer } : {};
    entry.answer[event.target.dataset.assessmentMatch] = event.target.value;
  }
  if (event.target.matches('[data-content-topic]')) {
    state.contentTopic = event.target.value;
    state.contentPage = 1;
    app.innerHTML = appShell(studioView(), '/studio');
  }
}

app.addEventListener('click', (event) => {
  const nav = event.target.closest('[data-nav]');
  if (nav) {
    event.preventDefault();
    navigate(nav.dataset.nav);
    return;
  }
  const action = event.target.closest('[data-action]');
  if (action && !action.disabled) {
    event.preventDefault();
    handleAction(action).catch((error) => toast(error.message, 'error'));
  }
});
app.addEventListener('submit', (event) => handleSubmit(event).catch((error) => toast(error.message, 'error')));
app.addEventListener('input', handleInput);
app.addEventListener('change', handleChange);
window.addEventListener('popstate', renderRoute);
prefersDark.addEventListener('change', () => {
  if ((state.bootstrap?.user.settings.theme || 'system') === 'system') applyTheme(state.bootstrap?.user.settings || {});
});

async function init() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  if (getToken()) {
    try {
      await refreshBootstrap();
      if (!state.bootstrap.user.profile.onboardingComplete) history.replaceState({}, '', '/onboarding');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setToken(null);
      else toast('The local server is not ready yet. Refresh after starting it.', 'error');
      state.bootstrap = null;
    }
  }
  await renderRoute();
}

init();
