/* ============================================================
   tests.js — Practice Tests with Mode A (Custom) & Mode B (Progress-Based).

   Supports:
   - Domain isolation (AKTU, DSA, Web Dev, Custom)
   - Mode A: Custom Practice Test by Subject, Unit, & Specific Topics (with Semester switcher for AKTU)
   - Mode B: Progress-Based Test strictly covering completed syllabus topics + diagnostic mode
   - Multi-model Gemini fallback cascade (1.5-flash -> 2.0-flash -> 2.5-flash -> 1.5-flash-latest -> 1.5-pro)
   - Resilient AI response parsing with automatic offline fallback when key is missing or quota exceeded
   - Curated high-yield computer science question bank + dynamic procedural generator with randomized answers
   - Option index normalization (0-3 & A-D)
   - Offline-first local test history persistence (0ms delay) + Firestore cloud synchronization
   - Clear test history support & dynamic Gemini API status badge
   ============================================================ */

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection, addDoc, getDocs, query, where,
  serverTimestamp, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { SYLLABUS, getDomainRoadmap, getAllDomainTopics } from './syllabus-data.js?v=20261016_v4';
import { DomainManager } from './domain-manager.js?v=20261016_v4';

const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro'
];

let currentUser      = null;
let currentDomainId  = localStorage.getItem('studypilot_active_domain') || 'aktu';
let currentSemester  = parseInt(localStorage.getItem('studypilot_current_semester') || '3', 10);
let domainRoadmap    = [];   // Array of Subject objects for active domain
let completedTopics  = {};   // { [key]: true }
let activeMode       = 'A';  // 'A' or 'B'

let currentQuestions = [];
let userAnswers      = {};
let testSubject      = '';
let testUnit         = '';
let testTopicsList   = [];

// ─── UTILITY HELPERS ──────────────────────────────────────────
function setButtonLoading(btn, isLoading) {
  if (!btn) return;
  const text    = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.btn-spinner');
  btn.disabled  = !!isLoading;
  if (text)    text.classList.toggle('hidden', !!isLoading);
  if (spinner) spinner.classList.toggle('hidden', !isLoading);
}
window.setButtonLoading = setButtonLoading;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function updateApiKeyNotice() {
  const notice = document.getElementById('ai-notice');
  if (!notice) return;
  const key = localStorage.getItem('gemini_api_key') || '';
  if (key) {
    notice.style.background = '#ECFDF5';
    notice.style.borderColor = '#A7F3D0';
    notice.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <strong style="color:#065F46;">✅ Gemini AI Connected:</strong>
          <span style="color:#047857;">AI-powered practice tests are fully active using your personal Gemini API key.</span>
        </div>
        <a href="settings.html" class="btn btn-ghost btn-xs" style="font-size:11px; padding:2px 8px;">Manage Key</a>
      </div>
    `;
  } else {
    notice.style.background = 'var(--color-primary-lt)';
    notice.style.borderColor = '#BFDBFE';
    notice.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <strong>🔑 Gemini API Integration:</strong> AI questions are generated using your personal Gemini API key.
          Enter it in <a href="settings.html" style="font-weight:600; text-decoration:underline;">Settings</a>.
          <span class="text-muted text-xs" style="display:block; margin-top:2px;">Without a key, the generator runs in curated offline concept mode.</span>
        </div>
        <span class="badge badge-blue" style="font-size:10px;">Offline Mode Active</span>
      </div>
    `;
  }
}

// ─── INSTANT ZERO-DELAY BOOTSTRAP (0ms Render) ────────────────
try {
  const cachedName = localStorage.getItem('studypilot_user_name') || 'Student';
  const cachedEmail = localStorage.getItem('studypilot_user_email') || '';
  renderUserInfo({ displayName: cachedName, email: cachedEmail });
} catch (e) {}

try {
  DomainManager.renderDomainTabs();
} catch (e) {}

// Listen to domain switches anywhere in the app
window.addEventListener('studypilot-domain-changed', (e) => {
  if (e.detail?.domainId && e.detail.domainId !== currentDomainId) {
    onDomainChanged(e.detail.domainId);
  }
});

// Synchronously render dropdowns, topics, notice & cached test history
initTestsPageInstantly();
updateApiKeyNotice();

// ─── AUTH & BACKGROUND CLOUD SYNC ─────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    renderUserInfo(user);

    // Initialize domain manager with user context
    try {
      await DomainManager.init('domain-selector-container', (domainId) => {
        onDomainChanged(domainId);
      });
    } catch (e) {}

    currentDomainId = DomainManager.getActiveDomainId() || currentDomainId;

    // Load semester preference for AKTU in background
    try {
      const profileRef = doc(db, 'users', user.uid);
      const snap       = await getDoc(profileRef);
      if (snap.exists() && snap.data().semester) {
        const sem = parseInt(snap.data().semester, 10);
        if (sem && sem !== currentSemester) {
          currentSemester = sem;
          localStorage.setItem('studypilot_current_semester', String(currentSemester));
          initTestsPageInstantly();
        }
      }
    } catch (e) {}

    // Cloud sync progress and test history in background
    syncProgressFromCloud();
    syncTestHistoryFromCloud();

  } else {
    const isLocalPreview = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalPreview) {
      window.location.href = '../index.html';
    }
  }
});

// ─── DOMAIN CHANGE HANDLER ────────────────────────────────────
function onDomainChanged(domainId) {
  currentDomainId = domainId;
  localStorage.setItem('studypilot_active_domain', domainId);

  // Reset active test state if domain changed
  if (currentQuestions.length > 0) {
    resetTest();
  }

  initTestsPageInstantly();

  if (currentUser) {
    syncProgressFromCloud();
    syncTestHistoryFromCloud();
  }
}

// ─── CHANGE AKTU SEMESTER ─────────────────────────────────────
window.changeTestSemester = function(semValue) {
  currentSemester = parseInt(semValue, 10) || 3;
  localStorage.setItem('studypilot_current_semester', String(currentSemester));
  initTestsPageInstantly();
  if (currentUser) {
    syncProgressFromCloud();
  }
};

// ─── INSTANT PAGE INITIALIZATION (0ms) ────────────────────────
function initTestsPageInstantly() {
  const domain = DomainManager.getActiveDomain ? DomainManager.getActiveDomain() : { name: currentDomainId };
  const subEl  = document.getElementById('tests-page-subtitle');
  if (subEl) {
    subEl.textContent = `Practice tests for ${domain.name || 'this domain'} — custom selection or tailored to your progress`;
  }

  // Handle AKTU Semester Selector visibility
  const semContainer = document.getElementById('test-semester-container');
  const semSelect    = document.getElementById('test-semester');
  if (semContainer) {
    if (currentDomainId === 'aktu') {
      semContainer.style.display = 'block';
      if (semSelect) semSelect.value = String(currentSemester);
    } else {
      semContainer.style.display = 'none';
    }
  }

  // 1. Load active roadmap
  const customKey = currentDomainId === 'aktu' ? `aktu_sem_${currentSemester}` : currentDomainId;
  let loadedRm = null;
  try {
    const cachedRm = localStorage.getItem(`studypilot_custom_roadmap_${customKey}`);
    if (cachedRm) loadedRm = JSON.parse(cachedRm);
  } catch (e) {}

  if (!loadedRm || !Array.isArray(loadedRm) || loadedRm.length === 0) {
    loadedRm = getDomainRoadmap(currentDomainId, currentSemester) || [];
  }
  domainRoadmap = loadedRm;

  // 2. Load cached progress
  loadCompletedTopicsLocal();

  // Attach DOM listeners if not already present
  const subSelect = document.getElementById('test-subject');
  if (subSelect && !subSelect.dataset.listenerAttached) {
    subSelect.addEventListener('change', updateTopicList);
    subSelect.dataset.listenerAttached = 'true';
  }
  const unitSelect = document.getElementById('test-unit');
  if (unitSelect && !unitSelect.dataset.listenerAttached) {
    unitSelect.addEventListener('change', updateTopicCheckboxes);
    unitSelect.dataset.listenerAttached = 'true';
  }

  populateSubjectDropdown();
  populateModeBTopics();
  renderCachedTestHistory();
  updateApiKeyNotice();
}

// ─── LOAD PROGRESS FROM LOCALSTORAGE ──────────────────────────
function loadCompletedTopicsLocal() {
  try {
    let cachedProg = localStorage.getItem(`studypilot_roadmap_progress_progress_${currentDomainId}`);
    if (!cachedProg) {
      cachedProg = localStorage.getItem(`studypilot_roadmap_progress_${currentDomainId}`);
    }
    if (!cachedProg && currentDomainId === 'aktu') {
      cachedProg = localStorage.getItem('studypilot_roadmap_progress_progress');
    }
    if (cachedProg) {
      completedTopics = JSON.parse(cachedProg);
    } else {
      completedTopics = {};
    }
  } catch (e) {
    completedTopics = {};
  }
}

// ─── SYNC PROGRESS FROM CLOUD (Background) ────────────────────
async function syncProgressFromCloud() {
  if (!currentUser || !db) return;
  try {
    const progressKey = `progress_${currentDomainId}`;
    const progressRef = doc(db, 'users', currentUser.uid, 'roadmap', progressKey);
    const snap = await getDoc(progressRef);
    if (snap.exists() && snap.data().completedTopics) {
      completedTopics = { ...completedTopics, ...snap.data().completedTopics };
      try {
        localStorage.setItem(`studypilot_roadmap_progress_${progressKey}`, JSON.stringify(completedTopics));
      } catch (e) {}
      populateModeBTopics();
    } else if (currentDomainId === 'aktu') {
      const legacyRef = doc(db, 'users', currentUser.uid, 'roadmap', 'progress');
      const legSnap = await getDoc(legacyRef);
      if (legSnap.exists() && legSnap.data().completedTopics) {
        completedTopics = { ...completedTopics, ...legSnap.data().completedTopics };
        populateModeBTopics();
      }
    }
  } catch (e) {
    console.warn('Progress cloud sync note:', e);
  }
}

// ─── MODE SWITCHER ────────────────────────────────────────────
function switchTestMode(mode) {
  activeMode = mode;
  const btnA  = document.getElementById('btn-mode-a');
  const btnB  = document.getElementById('btn-mode-b');
  const cardA = document.getElementById('mode-a-card');
  const cardB = document.getElementById('mode-b-card');

  if (mode === 'A') {
    if (btnA) btnA.className = 'btn btn-primary btn-sm';
    if (btnB) btnB.className = 'btn btn-ghost btn-sm';
    if (cardA) cardA.style.display = 'block';
    if (cardB) cardB.style.display = 'none';
  } else {
    if (btnA) btnA.className = 'btn btn-ghost btn-sm';
    if (btnB) btnB.className = 'btn btn-primary btn-sm';
    if (cardA) cardA.style.display = 'none';
    if (cardB) cardB.style.display = 'block';
    populateModeBTopics();
  }
}
window.switchTestMode = switchTestMode;

// ─── POPULATE SUBJECT DROPDOWN (MODE A) ────────────────────────
function populateSubjectDropdown() {
  const sel = document.getElementById('test-subject');
  if (!sel) return;

  if (!domainRoadmap || domainRoadmap.length === 0) {
    sel.innerHTML = '<option value="">No subjects found in this domain</option>';
    updateTopicList();
    return;
  }

  const prevVal = sel.value;
  sel.innerHTML = domainRoadmap.map(s => {
    const val = s.code || s.id || s.name;
    return `<option value="${escapeHtml(val)}">${escapeHtml(s.name)}</option>`;
  }).join('');

  if (prevVal && domainRoadmap.some(s => (s.code || s.id || s.name) === prevVal)) {
    sel.value = prevVal;
  }

  updateTopicList();
}
window.populateSubjectDropdown = populateSubjectDropdown;

function updateTopicList() {
  const sel = document.getElementById('test-subject');
  const subjectCode = sel?.value;
  const unitSel     = document.getElementById('test-unit');
  if (!unitSel) return;

  const subject = (domainRoadmap || []).find(s => (s.code || s.id || s.name) === subjectCode);
  if (!subject) {
    unitSel.innerHTML = '<option value="">All units (Entire Subject)</option>';
    updateTopicCheckboxes();
    return;
  }

  const units = subject.units || [];
  let unitOptions = '<option value="">All units (Entire Subject)</option>';
  units.forEach(u => {
    const uVal = u.id || u.name;
    const tCount = (u.topics || []).length;
    unitOptions += `<option value="${escapeHtml(uVal)}">${escapeHtml(u.name)}${tCount > 0 ? ` (${tCount} topics)` : ''}</option>`;
  });

  unitSel.innerHTML = unitOptions;
  updateTopicCheckboxes();
}
window.updateTopicList = updateTopicList;

function updateTopicCheckboxes() {
  const subjectCode = document.getElementById('test-subject')?.value;
  const unitId      = document.getElementById('test-unit')?.value;
  const container   = document.getElementById('topic-checkboxes-list');
  const countLabel  = document.getElementById('topic-select-count');
  if (!container) return;

  const subject = (domainRoadmap || []).find(s => (s.code || s.id || s.name) === subjectCode);
  if (!subject) {
    container.innerHTML = '<span class="text-muted text-xs">No topics available.</span>';
    if (countLabel) countLabel.textContent = '0 topics';
    return;
  }

  let topics = [];
  if (unitId) {
    const unit = (subject.units || []).find(u => (u.id || u.name) === unitId);
    topics = unit ? (unit.topics || []) : [];
  } else {
    (subject.units || []).forEach(u => {
      topics.push(...(u.topics || []));
    });
  }

  if (topics.length === 0) {
    container.innerHTML = '<span class="text-muted text-xs">No specific topics found for this selection.</span>';
    if (countLabel) countLabel.textContent = '0 topics';
    return;
  }

  container.innerHTML = topics.map((t) => `
    <label style="display:flex; align-items:center; gap:8px; cursor:pointer; padding:2px 0;">
      <input type="checkbox" class="mode-a-topic-check" value="${escapeHtml(t.name)}" style="accent-color:var(--color-primary);" />
      <span style="font-size:13px; color:var(--color-text);">${escapeHtml(t.name)}</span>
    </label>
  `).join('');

  // Attach change listener to update counter dynamically
  container.querySelectorAll('.mode-a-topic-check').forEach(cb => {
    cb.addEventListener('change', updateSelectedTopicCount);
  });

  updateSelectedTopicCount();
}
window.updateTopicCheckboxes = updateTopicCheckboxes;

function updateSelectedTopicCount() {
  const countLabel = document.getElementById('topic-select-count');
  if (!countLabel) return;
  const allChecks = document.querySelectorAll('.mode-a-topic-check');
  const checked = document.querySelectorAll('.mode-a-topic-check:checked');
  if (allChecks.length === 0) {
    countLabel.textContent = '0 topics';
  } else if (checked.length === 0) {
    countLabel.textContent = `All ${allChecks.length} topics in scope`;
  } else {
    countLabel.textContent = `${checked.length} of ${allChecks.length} topics selected`;
  }
}
window.updateSelectedTopicCount = updateSelectedTopicCount;

function selectAllTopics(shouldSelect) {
  const allChecks = document.querySelectorAll('.mode-a-topic-check');
  allChecks.forEach(cb => { cb.checked = !!shouldSelect; });
  updateSelectedTopicCount();
}
window.selectAllTopics = selectAllTopics;

// ─── POPULATE MODE B (PROGRESS-BASED TOPICS) ──────────────────
function populateModeBTopics() {
  const container = document.getElementById('mode-b-topics-pills');
  const countLbl  = document.getElementById('mode-b-count-label');
  const badge     = document.getElementById('mode-b-domain-badge');
  const domain    = DomainManager.getActiveDomain();

  if (badge) badge.textContent = domain.name;

  // Find all covered topics
  const covered = [];
  domainRoadmap.forEach(sub => {
    const subCode = sub.code || sub.id || 'SUB';
    (sub.units || []).forEach(unit => {
      const uId = unit.id || unit.name || 'U';
      (unit.topics || []).forEach(topic => {
        const tId = topic.id || topic.name || 'T';
        const key = `${subCode}_${uId}_${tId}`;
        const altKey = `${sub.code}_${unit.id}_${topic.id}`;
        if (completedTopics[key] || (sub.code && completedTopics[altKey]) || completedTopics[topic.name]) {
          covered.push({
            subjectName: sub.name,
            unitName: unit.name,
            topicName: topic.name,
            resource: topic.resource || topic.resourceUrl || ''
          });
        }
      });
    });
  });

  if (!container || !countLbl) return;

  if (covered.length === 0) {
    countLbl.textContent = '0 Completed Topics Detected';
    container.innerHTML = `
      <div style="width:100%; padding:10px; background:#FEF3C7; border:1px solid #FCD34D; border-radius:var(--radius-sm); color:#92400E; font-size:12px; line-height:1.5;">
        ⚠️ You haven't checked off any completed topics in <strong>${escapeHtml(domain.name)}</strong> yet.<br/>
        Check off topics in your <strong><a href="roadmap.html" style="text-decoration:underline; font-weight:600; color:#92400E;">Syllabus Roadmap</a></strong>, or enable <em>"Include upcoming topics as diagnostic questions"</em> below to test your baseline readiness.
      </div>`;
    return;
  }

  countLbl.textContent = `${covered.length} Topics Completed in ${domain.name}`;
  container.innerHTML = covered.map(c => `
    <span class="badge badge-blue" style="font-size:11px; padding:3px 8px; max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(c.subjectName)}: ${escapeHtml(c.topicName)}">
      ✓ ${escapeHtml(c.topicName)}
    </span>
  `).join('');
}

// ─── MODE A: GENERATE CUSTOM TEST ─────────────────────────────
window.generateTest = async function() {
  const subjectCode = document.getElementById('test-subject')?.value;
  const unitId      = document.getElementById('test-unit')?.value;
  const numQ        = parseInt(document.getElementById('test-num-q')?.value || '10', 10);
  const btn         = document.getElementById('gen-test-btn');

  if (!subjectCode) {
    showToast('Please select a subject first.', 'error');
    return;
  }

  const subject = (domainRoadmap || []).find(s => (s.code || s.id || s.name) === subjectCode);
  if (!subject) {
    showToast('Subject not found in active roadmap.', 'error');
    return;
  }

  const unit = unitId ? (subject.units || []).find(u => (u.id || u.name) === unitId) : null;

  // Selected topic checkboxes
  const checkedBoxes = Array.from(document.querySelectorAll('.mode-a-topic-check:checked'));
  let topicNames = [];
  if (checkedBoxes.length > 0) {
    topicNames = checkedBoxes.map(cb => cb.value);
  } else if (unit) {
    topicNames = (unit.topics || []).map(t => t.name);
  } else {
    topicNames = (subject.units || []).flatMap(u => (u.topics || []).map(t => t.name));
  }

  if (topicNames.length === 0) {
    showToast('No topics available in selected scope.', 'error');
    return;
  }

  testSubject    = subject.name;
  testUnit       = unit ? unit.name : 'All Units';
  testTopicsList = topicNames;

  await runTestGeneration({
    mode: 'custom',
    subjectName: testSubject,
    unitName: testUnit,
    topicNames: topicNames,
    numQ: numQ,
    btn: btn,
    sourceDescription: 'Curriculum topics & syllabus objectives'
  });
};

// ─── MODE B: GENERATE PROGRESS-BASED TEST ─────────────────────
window.generateProgressTest = async function() {
  const includeDiag = document.getElementById('mode-b-include-diagnostic')?.checked;
  const numQ        = parseInt(document.getElementById('test-num-q-b')?.value || '10', 10);
  const btn         = document.getElementById('gen-progress-test-btn');
  const domain      = DomainManager.getActiveDomain();

  // Find completed and upcoming topics
  const coveredTopics = [];
  const upcomingTopics = [];

  domainRoadmap.forEach(sub => {
    const subCode = sub.code || sub.id || 'SUB';
    (sub.units || []).forEach(unit => {
      const uId = unit.id || unit.name || 'U';
      (unit.topics || []).forEach(topic => {
        const tId = topic.id || topic.name || 'T';
        const key = `${subCode}_${uId}_${tId}`;
        const altKey = `${sub.code}_${unit.id}_${topic.id}`;
        if (completedTopics[key] || (sub.code && completedTopics[altKey]) || completedTopics[topic.name]) {
          coveredTopics.push(topic.name);
        } else {
          upcomingTopics.push(topic.name);
        }
      });
    });
  });

  let targetTopics = [...coveredTopics];

  if (targetTopics.length === 0) {
    if (!includeDiag) {
      showToast('No completed topics found. Check topics in Roadmap or enable diagnostic mode below.', 'warning');
      return;
    }
    // Diagnostic mode: pick first upcoming topics
    targetTopics = upcomingTopics.slice(0, Math.min(8, upcomingTopics.length));
    if (targetTopics.length === 0) {
      showToast('No topics found in active domain.', 'error');
      return;
    }
  } else if (includeDiag && upcomingTopics.length > 0) {
    // Add up to 2 diagnostic upcoming topics
    targetTopics.push(...upcomingTopics.slice(0, 2));
  }

  testSubject    = `${domain.name} (Progress Test)`;
  testUnit       = `${coveredTopics.length} Covered Topics`;
  testTopicsList = targetTopics;

  await runTestGeneration({
    mode: 'progress',
    subjectName: testSubject,
    unitName: testUnit,
    topicNames: targetTopics,
    numQ: numQ,
    btn: btn,
    sourceDescription: 'Student verified progress records & completed study modules'
  });
};

// ─── EXECUTE TEST GENERATION ──────────────────────────────────
async function runTestGeneration({ mode, subjectName, unitName, topicNames, numQ, btn, sourceDescription }) {
  const apiKey = localStorage.getItem('gemini_api_key') || '';

  setButtonLoading(btn, true);
  document.getElementById('ai-loading')?.classList.add('visible');
  document.getElementById('questions-area').innerHTML = '';
  document.getElementById('score-card')?.classList.remove('visible');
  document.getElementById('submit-row').style.display = 'none';
  currentQuestions = [];
  userAnswers      = {};

  try {
    let questions = [];

    if (apiKey) {
      try {
        questions = await callGeminiAI({
          apiKey,
          subjectName,
          unitName,
          topicNames,
          numQ,
          mode,
          sourceDescription
        });
      } catch (aiErr) {
        console.warn('Gemini AI call failed, falling back to curated question bank:', aiErr.message);
        showToast(`AI generation unavailable (${aiErr.message || 'error'}). Generating curated practice questions.`, 'warning');
        questions = generateOfflineFallback(subjectName, topicNames, numQ);
      }
    } else {
      questions = generateOfflineFallback(subjectName, topicNames, numQ);
      showToast('Offline Mode: Practice questions generated. Add Gemini API Key in Settings for AI tests.', 'info');
    }

    if (!questions || questions.length === 0) {
      questions = generateOfflineFallback(subjectName, topicNames, numQ);
    }

    currentQuestions = questions;
    renderQuestions(questions, mode, topicNames, sourceDescription);
    document.getElementById('submit-row').style.display = 'block';

    // Scroll smoothly to questions area
    setTimeout(() => {
      document.getElementById('questions-area')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

  } catch (err) {
    console.error('Test generation error:', err);
    showToast(`Test generation failed: ${err.message}`, 'error');
  } finally {
    setButtonLoading(btn, false);
    document.getElementById('ai-loading')?.classList.remove('visible');
  }
}

// ─── CALL GEMINI API ──────────────────────────────────────────
async function callGeminiAI({ apiKey, subjectName, unitName, topicNames, numQ, mode, sourceDescription }) {
  const prompt = `You are a university computer science exam author designing a high-yield multiple-choice assessment.

Scope:
- Domain/Subject: ${subjectName}
- Unit/Context: ${unitName}
- Test Mode: ${mode === 'progress' ? 'Mode B: Tested strictly on student\'s completed study history' : 'Mode A: Custom curriculum review'}
- Content Source: ${sourceDescription}
- Specific Topics in Scope:
${topicNames.map(t => `- ${t}`).join('\n')}

Generate exactly ${numQ} rigorous multiple-choice questions testing conceptual clarity, code behavior, and problem-solving.
Each question MUST have:
1. "question": Specific question text.
2. "options": Array of exactly 4 distinct strings [Option A, Option B, Option C, Option D].
3. "correct": Correct option index (0 for A, 1 for B, 2 for C, 3 for D). Distribute correct answers across 0, 1, 2, and 3.
4. "explanation": 1-2 sentence concise explanation of why the answer is correct and why other options are incorrect.
5. "topic": The exact topic name from the scope list above.

Return ONLY a valid JSON array in this exact format with NO markdown wrapping or preamble:
[
  {
    "question": "What is ...?",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explanation": "Because ...",
    "topic": "Topic Name"
  }
]`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.65,
      maxOutputTokens: 4096,
      responseMimeType: "application/json"
    }
  };

  let lastError = null;
  let rawText   = '';

  for (const model of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      let response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      // If model does not support responseMimeType (400 Bad Request), retry without it
      if (!response.ok && response.status === 400) {
        const retryBody = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.65, maxOutputTokens: 4096 }
        };
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(retryBody)
        });
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `API HTTP ${response.status} on model ${model}`);
      }

      const data = await response.json();
      rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (rawText) break;
    } catch (err) {
      lastError = err;
      console.warn(`Gemini model ${model} failed, attempting next:`, err.message);
    }
  }

  if (!rawText) {
    throw lastError || new Error('All Gemini API models failed. Please check your API key in Settings.');
  }

  // Parse JSON response resiliently
  let cleanJson = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  let parsed = null;
  try {
    parsed = JSON.parse(cleanJson);
  } catch (e1) {
    const arrayMatch = cleanJson.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try { parsed = JSON.parse(arrayMatch[0]); } catch (e2) {}
    }
    if (!parsed) {
      const objMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (objMatch) {
        try { parsed = JSON.parse(objMatch[0]); } catch (e3) {}
      }
    }
  }

  let list = [];
  if (Array.isArray(parsed)) {
    list = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.questions)) list = parsed.questions;
    else if (Array.isArray(parsed.test)) list = parsed.test;
    else if (Array.isArray(parsed.mcqs)) list = parsed.mcqs;
    else {
      const arrKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
      if (arrKey) list = parsed[arrKey];
    }
  }

  if (!list || list.length === 0) {
    throw new Error('AI returned non-array JSON format.');
  }

  return list.map((q, idx) => {
    let cIdx = 0;
    if (typeof q.correct === 'number') {
      cIdx = q.correct;
    } else if (typeof q.correct === 'string') {
      const t = q.correct.trim().toUpperCase();
      if (t === 'A' || t === '0' || t.startsWith('OPTION A')) cIdx = 0;
      else if (t === 'B' || t === '1' || t.startsWith('OPTION B')) cIdx = 1;
      else if (t === 'C' || t === '2' || t.startsWith('OPTION C')) cIdx = 2;
      else if (t === 'D' || t === '3' || t.startsWith('OPTION D')) cIdx = 3;
      else {
        const found = (q.options || []).findIndex(opt => opt && opt.toLowerCase().trim() === q.correct.toLowerCase().trim());
        cIdx = found >= 0 ? found : (parseInt(t, 10) || 0);
      }
    }

    const options = Array.isArray(q.options) && q.options.length >= 4
      ? q.options.slice(0, 4)
      : (Array.isArray(q.options) && q.options.length > 0 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D']);
    while (options.length < 4) {
      options.push(`Option ${['A','B','C','D'][options.length]}`);
    }

    return {
      question:    q.question || `Concept Question on ${topicNames[idx % topicNames.length] || subjectName}`,
      options:     options,
      correct:     Math.min(Math.max(cIdx, 0), 3),
      explanation: q.explanation || 'Refer to your syllabus notes and lecture resources for in-depth explanation.',
      topic:       q.topic || (topicNames[idx % topicNames.length] || subjectName)
    };
  });
}

// ─── CURATED TECHNICAL QUESTION BANK ──────────────────────────
const CURATED_TECHNICAL_KB = [
  {
    keywords: ['array', 'prefix sum', 'subarray'],
    question: 'What is the time complexity to compute the sum of any contiguous subarray [L, R] using a precomputed Prefix Sum array?',
    options: ['O(1) time complexity', 'O(N) time complexity', 'O(log N) time complexity', 'O(R - L) time complexity'],
    correct: 0,
    explanation: 'With a precomputed prefix sum array, any range sum [L, R] is calculated in O(1) time using: P[R] - P[L - 1].'
  },
  {
    keywords: ['two sum', 'hash', 'table', 'map'],
    question: 'How does an unordered hash map reduce the time complexity of the Two-Sum problem from O(N²) brute force?',
    options: ['Reduces time to O(N) by storing visited complements for O(1) average lookup', 'Reduces time to O(N log N) by sorting the array', 'Reduces space complexity to O(1)', 'Guarantees worst-case O(1) lookup even under severe hash collisions'],
    correct: 0,
    explanation: 'By checking whether (target - current_element) exists in the hash map during iteration, the lookup is O(1) average, achieving O(N) total time.'
  },
  {
    keywords: ['stack', 'lifo', 'parentheses'],
    question: 'Which data structure principle underlies expression parsing and balanced parentheses verification?',
    options: ['LIFO (Last-In, First-Out) via a Stack', 'FIFO (First-In, First-Out) via a Queue', 'Random access via contiguous array pointers', 'Priority ordering via Min-Heap'],
    correct: 0,
    explanation: 'A stack operates on LIFO order, ensuring that the most recently opened parenthesis is matched first with the next closing symbol.'
  },
  {
    keywords: ['queue', 'fifo', 'circular'],
    question: 'What primary problem does a Circular Queue solve compared to a linear array-based queue?',
    options: ['Memory wastage caused by unused space when front pointer advances', 'Time complexity of enqueue operation becoming O(N)', 'Inability to store primitive data types', 'Lack of support for dynamic pointer linking'],
    correct: 0,
    explanation: 'In a linear array queue, dequeuing elements leaves empty slots at the front that cannot be reused without shifting; circular queues wrap around using modulo arithmetic.'
  },
  {
    keywords: ['linked list', 'floyd', 'cycle'],
    question: 'In Floyd’s Cycle-Finding Algorithm (Tortoise and Hare), how are the two pointers initialized and moved?',
    options: ['Slow pointer advances 1 node; fast pointer advances 2 nodes per step', 'Both pointers move 1 node in opposite directions', 'Fast pointer advances 3 nodes while slow pointer remains stationary', 'Fast pointer moves only when slow pointer reaches a NULL reference'],
    correct: 0,
    explanation: 'Floyd\'s algorithm moves the slow pointer by 1 step and the fast pointer by 2 steps. If a cycle exists, they are guaranteed to meet inside the loop.'
  },
  {
    keywords: ['tree', 'binary search tree', 'bst'],
    question: 'What is the characteristic property of a valid Binary Search Tree (BST)?',
    options: ['Left subtree values < Root value < Right subtree values for every node', 'Every node has exactly two children', 'The height of left and right subtrees differs by at most 1', 'Nodes are inserted in sorted order from left to right on each level'],
    correct: 0,
    explanation: 'In a BST, all keys in the left subtree of a node must be less than the node’s key, and all keys in the right subtree must be greater.'
  },
  {
    keywords: ['graph', 'bfs', 'dfs', 'shortest'],
    question: 'Which traversal algorithm is guaranteed to find the shortest path in an unweighted graph?',
    options: ['Breadth-First Search (BFS)', 'Depth-First Search (DFS)', 'Pre-order Traversal', 'Post-order Traversal'],
    correct: 0,
    explanation: 'BFS explores nodes level by level in order of distance from the source, guaranteeing the shortest path in unweighted graphs.'
  },
  {
    keywords: ['process', 'thread', 'cpu', 'scheduling'],
    question: 'What is the fundamental difference in resource sharing between processes and threads?',
    options: ['Threads of the same process share memory address space and open files, whereas processes have isolated address spaces', 'Processes share virtual memory pages while threads have independent physical pages', 'Threads cannot run concurrently on multi-core CPUs', 'Processes switch context faster than threads'],
    correct: 0,
    explanation: 'Threads within the same process share code, data, and OS resources, resulting in lightweight context switching, whereas processes have isolated memory spaces.'
  },
  {
    keywords: ['deadlock', 'mutex', 'semaphore'],
    question: 'Which of the following is NOT one of Coffman’s four necessary conditions for deadlock to occur?',
    options: ['Preemptive resource allocation by operating system', 'Mutual exclusion', 'Hold and wait', 'Circular wait'],
    correct: 0,
    explanation: 'The four Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Preemption breaks deadlock.'
  },
  {
    keywords: ['sql', 'acid', 'transaction', 'dbms'],
    question: 'Under ACID properties in relational databases, what does the "A" (Atomicity) guarantee?',
    options: ['All operations in a transaction complete successfully, or all changes are rolled back completely', 'Data is replicated simultaneously across multiple physical clusters', 'Transactions are executed sequentially without interleaving', 'Transactions persist even after unexpected system crashes'],
    correct: 0,
    explanation: 'Atomicity ensures "all-or-nothing" execution: if any statement in a transaction fails, the entire transaction is rolled back.'
  },
  {
    keywords: ['rest', 'api', 'http', 'status'],
    question: 'Which HTTP status code should be returned when a client successfully creates a new resource via POST?',
    options: ['201 Created', '200 OK', '204 No Content', '302 Found'],
    correct: 0,
    explanation: 'HTTP 201 Created indicates that the request succeeded and led to the creation of a new resource.'
  },
  {
    keywords: ['javascript', 'promise', 'async', 'await'],
    question: 'What does the async keyword do when prepended to a JavaScript function?',
    options: ['It causes the function to automatically return a Promise that resolves with the returned value', 'It executes the function in a dedicated background worker thread', 'It forces synchronous blocking execution', 'It pauses the JavaScript event loop until finished'],
    correct: 0,
    explanation: 'An async function always returns a Promise; non-Promise return values are automatically wrapped in a resolved Promise.'
  }
];

// ─── OFFLINE FALLBACK QUESTIONS GENERATOR ─────────────────────
function generateOfflineFallback(subjectName, topicNames, numQ) {
  const questions = [];
  const scopeTopics = topicNames.length > 0 ? topicNames : [subjectName];

  // Template variations to make questions engaging and diverse
  const templates = [
    {
      q: (t, s) => `Which statement accurately describes the core mechanism or purpose of "${t}" in ${s}?`,
      correctTpl: (t) => `It provides a structured, deterministic approach to implementing "${t}" with optimized execution.`,
      d1: () => `It is an obsolete construct prohibited by modern compiler optimization standards.`,
      d2: () => `It operates solely at the hardware firmware register layer without software abstraction.`,
      d3: () => `It requires linear reallocation of the entire memory space on every access.`,
      exp: (t) => `"${t}" is an established core concept designed for structured, efficient computational problem-solving.`
    },
    {
      q: (t, s) => `When applying "${t}" in ${s}, what primary performance trade-off or advantage must be considered?`,
      correctTpl: (t) => `Balancing time complexity against auxiliary memory overhead required by "${t}".`,
      d1: () => `Elimination of all CPU clock cycle latency across distributed networks.`,
      d2: () => `Zero memory allocation regardless of the input data volume.`,
      d3: () => `Automatic conversion of synchronous threads into kernel interrupts.`,
      exp: (t) => `Optimal utilization of "${t}" requires engineering trade-offs between algorithmic speed and space consumption.`
    },
    {
      q: (t, s) => `In real-world software architecture, which scenario is best suited for "${t}"?`,
      correctTpl: (t) => `When modularity, predictable state transitions, and maintainability are critical for "${t}".`,
      d1: () => `Only when compiling unmanaged assembly for 8-bit microcontrollers.`,
      d2: () => `When bypassing all operating system memory security safeguards.`,
      d3: () => `Only in single-user batch processing with offline persistent disk storage.`,
      exp: (t) => `"${t}" is adopted in industry to maintain clean separation of concerns and robust runtime stability.`
    },
    {
      q: (t, s) => `What common problem or bug does proper understanding of "${t}" prevent in ${s}?`,
      correctTpl: (t) => `Unintended side effects, race conditions, or suboptimal algorithmic bottlenecks related to "${t}".`,
      d1: () => `Physical semiconductor hardware degradation over prolonged use.`,
      d2: () => `Inability of power supplies to regulate dynamic voltage.`,
      d3: () => `Syntax incompatibility between different keyboard input encodings.`,
      exp: (t) => `Mastery of "${t}" prevents performance degradation and logic defects in production environments.`
    }
  ];

  for (let i = 0; i < numQ; i++) {
    const topic = scopeTopics[i % scopeTopics.length];
    const topicLower = topic.toLowerCase();

    // Check if we have a match in the curated technical knowledge bank
    const matchedCurated = CURATED_TECHNICAL_KB.find(item =>
      item.keywords.some(k => topicLower.includes(k) || subjectName.toLowerCase().includes(k))
    );

    if (matchedCurated && Math.random() < 0.65) {
      // Shuffle options so correct is not always 0
      const optionsWithMeta = matchedCurated.options.map((opt, oIdx) => ({
        text: opt,
        isCorrect: oIdx === matchedCurated.correct
      }));

      // Shuffle options array
      for (let j = optionsWithMeta.length - 1; j > 0; j--) {
        const rand = Math.floor(Math.random() * (j + 1));
        [optionsWithMeta[j], optionsWithMeta[rand]] = [optionsWithMeta[rand], optionsWithMeta[j]];
      }

      const correctIndex = optionsWithMeta.findIndex(o => o.isCorrect);

      questions.push({
        question: matchedCurated.question,
        options: optionsWithMeta.map(o => o.text),
        correct: correctIndex,
        explanation: matchedCurated.explanation,
        topic: topic
      });
      continue;
    }

    // Procedural generation with randomized answer placement
    const tpl = templates[i % templates.length];
    const correctText = tpl.correctTpl(topic);
    const distractors = [tpl.d1(topic), tpl.d2(topic), tpl.d3(topic)];

    // Randomize correct answer position between 0, 1, 2, 3
    const correctPos = Math.floor(Math.random() * 4);
    const options = [];
    let dIdx = 0;
    for (let pos = 0; pos < 4; pos++) {
      if (pos === correctPos) {
        options.push(correctText);
      } else {
        options.push(distractors[dIdx++]);
      }
    }

    questions.push({
      question: tpl.q(topic, subjectName),
      options: options,
      correct: correctPos,
      explanation: tpl.exp(topic),
      topic: topic
    });
  }

  return questions;
}

// ─── RENDER QUESTIONS ON PAGE ─────────────────────────────────
function renderQuestions(questions, mode, topicNames, sourceDescription) {
  const area = document.getElementById('questions-area');
  if (!area) return;

  const letters = ['A', 'B', 'C', 'D'];
  let html = `
    <div style="background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-md); padding:16px 20px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div>
        <div style="font-weight:700; font-size:15px; color:var(--color-text);">
          ${mode === 'progress' ? 'Mode B: Progress-Based Practice Test' : 'Mode A: Custom Practice Test'}
        </div>
        <div class="text-xs text-muted" style="margin-top:2px;">
          Source: ${escapeHtml(sourceDescription)} • ${questions.length} questions
        </div>
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:4px; max-width:400px;">
        ${topicNames.slice(0, 4).map(t => `<span class="badge badge-gray" style="font-size:10px;">${escapeHtml(t)}</span>`).join('')}
        ${topicNames.length > 4 ? `<span class="badge badge-gray" style="font-size:10px;">+${topicNames.length - 4} more</span>` : ''}
      </div>
    </div>`;

  questions.forEach((q, idx) => {
    html += `
    <div class="question-card" id="q-card-${idx}">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span class="question-num">Question ${idx + 1} of ${questions.length}</span>
        ${q.topic ? `<span class="badge badge-blue" style="font-size:10px;">${escapeHtml(q.topic)}</span>` : ''}
      </div>
      <div class="question-text">${escapeHtml(q.question)}</div>
      <ul class="options-list">
        ${q.options.map((opt, oIdx) => `
          <li>
            <button
              type="button"
              class="option-btn"
              id="opt-${idx}-${oIdx}"
              onclick="selectOption(${idx}, ${oIdx})"
            >
              <span class="option-letter">${letters[oIdx]}</span>
              <span>${escapeHtml(opt)}</span>
            </button>
          </li>
        `).join('')}
      </ul>
      <div class="explanation-box" id="exp-${idx}">
        <strong>Explanation:</strong> ${escapeHtml(q.explanation)}
      </div>
    </div>`;
  });

  area.innerHTML = html;
}

// ─── USER SELECTS OPTION ──────────────────────────────────────
window.selectOption = function(qIdx, oIdx) {
  // Prevent changing answers after submission
  if (document.getElementById('score-card')?.classList.contains('visible')) return;

  userAnswers[qIdx] = oIdx;

  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`opt-${qIdx}-${i}`);
    if (btn) btn.classList.toggle('selected', i === oIdx);
  }
};

// ─── SUBMIT TEST & SCORE ──────────────────────────────────────
window.submitTest = async function() {
  const answeredCount = Object.keys(userAnswers).length;
  if (answeredCount < currentQuestions.length) {
    if (!confirm(`You have answered ${answeredCount} of ${currentQuestions.length} questions. Submit anyway?`)) {
      return;
    }
  }

  let score = 0;
  currentQuestions.forEach((q, idx) => {
    const chosen  = userAnswers[idx];
    const correct = q.correct;

    if (chosen === correct) score++;

    // Style options
    for (let i = 0; i < 4; i++) {
      const btn = document.getElementById(`opt-${idx}-${i}`);
      if (!btn) continue;
      btn.disabled = true;
      btn.classList.remove('selected');

      if (i === correct) {
        btn.classList.add('correct');
      } else if (i === chosen && chosen !== correct) {
        btn.classList.add('wrong');
      }
    }

    // Show explanation
    const exp = document.getElementById(`exp-${idx}`);
    if (exp) exp.classList.add('visible');
  });

  const total = currentQuestions.length;
  const pct   = Math.round((score / total) * 100);

  // Render score card
  const scoreCard = document.getElementById('score-card');
  const scoreDisp = document.getElementById('score-display');
  const scoreMsg  = document.getElementById('score-message');

  if (scoreDisp) scoreDisp.textContent = `${score} / ${total} (${pct}%)`;
  if (scoreMsg) {
    if (pct >= 80) scoreMsg.textContent = '🎉 Excellent mastery! You are thoroughly prepared in these topics.';
    else if (pct >= 60) scoreMsg.textContent = '👍 Good job! Review the explanations for any missed questions below.';
    else scoreMsg.textContent = '📚 Keep revising! Review topic resources in your Roadmap and try another test.';
  }
  if (scoreCard) scoreCard.classList.add('visible');

  // Hide submit button
  document.getElementById('submit-row').style.display = 'none';

  // Smooth scroll to score card
  setTimeout(() => {
    scoreCard?.scrollIntoView({ behavior: 'smooth' });
  }, 100);

  // 1. Immediately save to LocalStorage (Offline-first 0ms)
  const testRecord = {
    id: 'test_' + Date.now(),
    userId: currentUser ? currentUser.uid : 'local',
    domainId: currentDomainId,
    mode: activeMode === 'A' ? 'custom' : 'progress',
    subjectName: testSubject,
    unitName: testUnit,
    score: score,
    totalQuestions: total,
    percentage: pct,
    topicsCovered: testTopicsList.slice(0, 20),
    createdAt: new Date().toISOString()
  };

  saveTestRecordLocally(testRecord);
  renderCachedTestHistory();

  // 2. Cloud Firestore Sync if user is authenticated
  if (currentUser && db) {
    try {
      await addDoc(collection(db, 'tests'), {
        userId: currentUser.uid,
        domainId: currentDomainId,
        mode: activeMode === 'A' ? 'custom' : 'progress',
        subjectName: testSubject,
        unitName: testUnit,
        score: score,
        totalQuestions: total,
        percentage: pct,
        topicsCovered: testTopicsList.slice(0, 20),
        createdAt: serverTimestamp()
      });
      syncTestHistoryFromCloud();
    } catch (err) {
      console.warn('Test result cloud sync note (saved locally):', err);
    }
  }
};

window.resetTest = function() {
  currentQuestions = [];
  userAnswers      = {};
  document.getElementById('questions-area').innerHTML = '';
  document.getElementById('score-card')?.classList.remove('visible');
  document.getElementById('submit-row').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ─── TEST HISTORY (LOCAL CACHE + CLOUD SYNC) ─────────────────
function getCachedTestHistory() {
  try {
    const raw = localStorage.getItem(`studypilot_test_history_${currentDomainId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function saveTestRecordLocally(record) {
  try {
    const existing = getCachedTestHistory();
    const updated = [record, ...existing.filter(t => t.id !== record.id)].slice(0, 25);
    localStorage.setItem(`studypilot_test_history_${currentDomainId}`, JSON.stringify(updated));
  } catch (e) {}
}

function renderCachedTestHistory() {
  const listEl = document.getElementById('test-history-list');
  const clearBtn = document.getElementById('clear-tests-btn');
  if (!listEl) return;

  const tests = getCachedTestHistory();

  if (!tests || tests.length === 0) {
    if (clearBtn) clearBtn.style.display = 'none';
    listEl.innerHTML = `<div class="empty-state"><p class="text-muted text-sm">No test attempts for this domain yet. Generate your first test above.</p></div>`;
    return;
  }

  if (clearBtn) clearBtn.style.display = 'inline-block';
  renderTestHistoryList(tests);
}

function renderTestHistoryList(tests) {
  const listEl = document.getElementById('test-history-list');
  if (!listEl) return;

  listEl.innerHTML = tests.slice(0, 8).map(t => {
    const pct   = t.percentage ?? Math.round(((t.score || 0) / (t.totalQuestions || 1)) * 100);
    const badge = pct >= 70 ? 'badge-green' : pct >= 40 ? 'badge-blue' : 'badge-red';
    const modeLabel = t.mode === 'progress' ? 'Mode B (Progress)' : 'Mode A (Custom)';

    let dateStr = 'Recently';
    if (t.createdAt?.toDate) {
      dateStr = t.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } else if (t.createdAt) {
      dateStr = new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }

    return `
    <div class="test-history-item">
      <div>
        <div style="font-weight:600; color:var(--color-text);">
          ${escapeHtml(t.subjectName || 'Practice Test')}
        </div>
        <div class="text-muted text-xs">
          ${modeLabel} • ${escapeHtml(t.unitName || '')} • ${dateStr}
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:var(--font-size-sm); font-weight:600;">${t.score}/${t.totalQuestions}</span>
        <span class="badge ${badge}">${pct}%</span>
      </div>
    </div>`;
  }).join('');
}

window.clearTestHistory = function() {
  if (!confirm('Are you sure you want to clear your test history for this domain?')) return;
  try {
    localStorage.removeItem(`studypilot_test_history_${currentDomainId}`);
  } catch (e) {}
  renderCachedTestHistory();
  showToast('Test history cleared.', 'info');
};

async function syncTestHistoryFromCloud() {
  if (!currentUser || !db) return;

  try {
    const q = query(
      collection(db, 'tests'),
      where('userId', '==', currentUser.uid)
    );
    const snap = await getDocs(q);

    const cloudTests = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const docDomain = data.domainId || 'aktu';
      if (docDomain === currentDomainId) {
        cloudTests.push({ id: docSnap.id, ...data });
      }
    });

    // Merge cloud tests with local tests
    const localTests = getCachedTestHistory();
    const map = new Map();

    localTests.forEach(t => { if (t.id) map.set(t.id, t); });
    cloudTests.forEach(t => { if (t.id) map.set(t.id, t); });

    const merged = Array.from(map.values());
    merged.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt || 0)).getTime();
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt || 0)).getTime();
      return tB - tA;
    });

    if (merged.length > 0) {
      try {
        localStorage.setItem(`studypilot_test_history_${currentDomainId}`, JSON.stringify(merged));
      } catch (e) {}
      renderCachedTestHistory();
    }
  } catch (err) {
    console.warn('Test history cloud sync note:', err);
  }
}

// ─── USER INFO & LOGOUT ───────────────────────────────────────
function renderUserInfo(user) {
  const name = user.displayName || 'Student';
  const av   = document.getElementById('sidebar-avatar');
  const nm   = document.getElementById('sidebar-name');
  const em   = document.getElementById('sidebar-email');

  if (av) av.textContent = name.charAt(0).toUpperCase();
  if (nm) nm.textContent = name;
  if (em) em.textContent = user.email || '';
}

window.handleLogout = async function() {
  await signOut(auth);
  window.location.href = '../index.html';
};
