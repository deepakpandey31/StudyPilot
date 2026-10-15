/* ============================================================
   tests.js — Practice Tests with Mode A (Custom) & Mode B (Progress-Based).

   Supports:
   - Domain isolation (AKTU, DSA, Web Dev, Custom)
   - Mode A: Custom Test by Subject, Unit, & Specific Topics
   - Mode B: Test based strictly on Student's Completed/In-Progress Topics
   - Multi-model Gemini fallback cascade (1.5-flash -> 2.0-flash -> 1.5-flash-latest -> 1.5-pro)
   - Offline fallback concept questions when no API key is set
   - Option index normalization (0-3 & A-D)
   - In-memory test history sorting to avoid composite index crashes
   ============================================================ */

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection, addDoc, getDocs, query, where,
  serverTimestamp, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { SYLLABUS, getDomainRoadmap, getAllDomainTopics } from './syllabus-data.js?v=20261016_v3';
import { DomainManager } from './domain-manager.js?v=20261016_v3';

const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
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

// ─── INSTANT ZERO-DELAY BOOTSTRAP (0ms Render) ────────────────
try {
  const cachedName = localStorage.getItem('studypilot_user_name') || 'Student';
  const cachedEmail = localStorage.getItem('studypilot_user_email') || '';
  renderUserInfo({ displayName: cachedName, email: cachedEmail });
} catch (e) {}

try {
  DomainManager.renderDomainTabs();
} catch (e) {}

// Synchronously render dropdowns, topics & cached test history
initTestsPageInstantly();

// ─── AUTH & BACKGROUND CLOUD SYNC ─────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    renderUserInfo(user);

    // Initialize domain manager
    try {
      await DomainManager.init('domain-selector-container', (domainId) => {
        currentDomainId = domainId;
        localStorage.setItem('studypilot_active_domain', domainId);
        onDomainChanged(domainId);
      });
    } catch (e) {}

    currentDomainId = DomainManager.getActiveDomainId() || currentDomainId;

    // Load semester preference for AKTU in background
    try {
      const profileRef = doc(db, 'users', user.uid);
      const snap       = await getDoc(profileRef);
      if (snap.exists() && snap.data().semester) {
        currentSemester = parseInt(snap.data().semester, 10);
        localStorage.setItem('studypilot_current_semester', String(currentSemester));
      }
    } catch (e) {}

    // Cloud sync in background
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
  initTestsPageInstantly();
  if (currentUser) {
    syncTestHistoryFromCloud();
  }
}

// ─── INSTANT PAGE INITIALIZATION (0ms) ────────────────────────
function initTestsPageInstantly() {
  const domain = DomainManager.getActiveDomain ? DomainManager.getActiveDomain() : { name: currentDomainId };
  const subEl  = document.getElementById('tests-page-subtitle');
  if (subEl) {
    subEl.textContent = `Practice tests for ${domain.name || 'this domain'} — custom selection or tailored to your progress`;
  }

  // 1. Load roadmap
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

  // 2. Load progress
  try {
    let cachedProg = localStorage.getItem(`studypilot_roadmap_progress_progress_${currentDomainId}`);
    if (!cachedProg) {
      cachedProg = localStorage.getItem(`studypilot_roadmap_progress_${currentDomainId}`);
    }
    if (!cachedProg && currentDomainId === 'aktu') {
      cachedProg = localStorage.getItem('studypilot_roadmap_progress_progress');
    }
    if (cachedProg) completedTopics = JSON.parse(cachedProg);
    else completedTopics = {};
  } catch (e) {
    completedTopics = {};
  }

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

  sel.innerHTML = domainRoadmap.map(s => {
    const val = s.code || s.id || s.name;
    return `<option value="${escapeHtml(val)}">${escapeHtml(s.name)}</option>`;
  }).join('');

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

  container.innerHTML = topics.map((t, idx) => `
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

  // Find all topics where completedTopics[key] === true
  const covered = [];
  domainRoadmap.forEach(sub => {
    (sub.units || []).forEach(unit => {
      (unit.topics || []).forEach(topic => {
        const key = `${sub.code}_${unit.id}_${topic.id}`;
        if (completedTopics[key]) {
          covered.push({
            subjectName: sub.name,
            unitName: unit.name,
            topicName: topic.name,
            resource: topic.resource
          });
        }
      });
    });
  });

  if (!container || !countLbl) return;

  if (covered.length === 0) {
    countLbl.textContent = '0 Completed Topics Detected';
    container.innerHTML = `
      <div style="width:100%; padding:10px; background:#FEF3C7; border:1px solid #FCD34D; border-radius:var(--radius-sm); color:#92400E; font-size:12px;">
        ⚠️ You haven't marked any topics as completed in <strong>${domain.name}</strong> yet.<br/>
        Check off topics in your <strong>Syllabus Roadmap</strong>, or check <em>"Include upcoming topics as diagnostic questions"</em> below to test your readiness.
      </div>`;
    return;
  }

  countLbl.textContent = `${covered.length} Topics Covered in ${domain.name}`;
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

  // Find completed topics
  const coveredTopics = [];
  const upcomingTopics = [];

  domainRoadmap.forEach(sub => {
    (sub.units || []).forEach(unit => {
      (unit.topics || []).forEach(topic => {
        const key = `${sub.code}_${unit.id}_${topic.id}`;
        if (completedTopics[key]) {
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
      showToast('No completed topics found. Check topics in Roadmap or enable diagnostic mode.', 'warning');
      return;
    }
    // Pick the first few upcoming topics for a diagnostic assessment
    targetTopics = upcomingTopics.slice(0, Math.min(8, upcomingTopics.length));
    if (targetTopics.length === 0) {
      showToast('No topics found in active domain.', 'error');
      return;
    }
  } else if (includeDiag && upcomingTopics.length > 0) {
    // Add 2 diagnostic topics
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
      questions = await callGeminiAI({
        apiKey,
        subjectName,
        unitName,
        topicNames,
        numQ,
        mode,
        sourceDescription
      });
    } else {
      questions = generateOfflineFallback(subjectName, topicNames, numQ);
      showToast('Offline Mode: Basic concept questions generated. Add Gemini API Key in Settings for AI tests.', 'warning');
    }

    currentQuestions = questions;
    renderQuestions(questions, mode, topicNames, sourceDescription);
    document.getElementById('submit-row').style.display = 'block';

    // Scroll to questions area smoothly
    document.getElementById('questions-area')?.scrollIntoView({ behavior: 'smooth' });

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

Generate exactly ${numQ} rigorous multiple-choice questions testing conceptual clarity and problem-solving.
Each question MUST have:
1. "question": Specific question text.
2. "options": Array of exactly 4 strings [Option A, Option B, Option C, Option D].
3. "correct": Correct option index (0 for A, 1 for B, 2 for C, 3 for D).
4. "explanation": 1-2 sentence concise explanation of why the answer is correct.
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
      maxOutputTokens: 4096
    }
  };

  let lastError = null;
  let rawText   = '';

  for (const model of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

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

  let cleanJson = rawText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
  const match = cleanJson.match(/\[[\s\S]*\]/);
  if (match) cleanJson = match[0];

  const parsed = JSON.parse(cleanJson);
  if (!Array.isArray(parsed)) throw new Error('AI returned non-array JSON format.');

  return parsed.map(q => {
    let cIdx = 0;
    if (typeof q.correct === 'number') {
      cIdx = q.correct;
    } else if (typeof q.correct === 'string') {
      const t = q.correct.trim().toUpperCase();
      if (t === 'A' || t === '0') cIdx = 0;
      else if (t === 'B' || t === '1') cIdx = 1;
      else if (t === 'C' || t === '2') cIdx = 2;
      else if (t === 'D' || t === '3') cIdx = 3;
      else cIdx = parseInt(t, 10) || 0;
    }

    return {
      question:    q.question || 'Concept Question',
      options:     Array.isArray(q.options) && q.options.length >= 4 ? q.options.slice(0, 4) : ['Option A', 'Option B', 'Option C', 'Option D'],
      correct:     Math.min(Math.max(cIdx, 0), 3),
      explanation: q.explanation || 'Refer to your syllabus notes and documentation for in-depth explanation.',
      topic:       q.topic || (topicNames[0] || 'Curriculum Topic')
    };
  });
}

// ─── OFFLINE FALLBACK QUESTIONS ───────────────────────────────
function generateOfflineFallback(subjectName, topicNames, numQ) {
  const questions = [];
  for (let i = 0; i < numQ; i++) {
    const topic = topicNames[i % topicNames.length];
    questions.push({
      question: `Which statement accurately describes the core purpose or mechanism of "${topic}" in ${subjectName}?`,
      options: [
        `It serves as an essential component and concept in ${subjectName} implementation.`,
        `It is deprecated syntax incompatible with standard computer science architectures.`,
        `It refers solely to legacy hardware register configurations.`,
        `It operates exclusively outside the domain of software systems.`
      ],
      correct: 0,
      explanation: `"${topic}" is a verified concept within ${subjectName}. For AI-generated technical questions, connect your Gemini API key in Settings.`,
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
          ${mode === 'progress' ? 'Mode B: Progress-Based Test' : 'Mode A: Custom Practice Test'}
        </div>
        <div class="text-xs text-muted" style="margin-top:2px;">
          Generated from: ${escapeHtml(sourceDescription)} • ${questions.length} questions
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
    if (pct >= 80) scoreMsg.textContent = '🎉 Excellent mastery! You are well prepared in these topics.';
    else if (pct >= 60) scoreMsg.textContent = '👍 Good job! Review the explanations for any missed questions.';
    else scoreMsg.textContent = '📚 Keep revising! Watch the attached topic videos and try again.';
  }
  if (scoreCard) scoreCard.classList.add('visible');
  scoreCard?.scrollIntoView({ behavior: 'smooth' });

  // Hide submit button
  document.getElementById('submit-row').style.display = 'none';

  // Save result to Firestore
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

    await loadTestHistory();
  } catch (err) {
    console.error('Error saving test result:', err);
    showToast('Failed to save test result to cloud.', 'error');
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
function renderCachedTestHistory() {
  const listEl = document.getElementById('test-history-list');
  if (!listEl) return;

  let tests = [];
  try {
    const raw = localStorage.getItem(`studypilot_test_history_${currentDomainId}`);
    if (raw) tests = JSON.parse(raw);
  } catch (e) {}

  if (!tests || tests.length === 0) {
    listEl.innerHTML = `<div class="empty-state"><p class="text-muted text-sm">No test attempts for this domain yet. Take a test above.</p></div>`;
    return;
  }

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

async function syncTestHistoryFromCloud() {
  if (!currentUser || !db) return;

  try {
    const q = query(
      collection(db, 'tests'),
      where('userId', '==', currentUser.uid)
    );
    const snap = await getDocs(q);

    const tests = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const docDomain = data.domainId || 'aktu';
      if (docDomain === currentDomainId) {
        tests.push({ id: docSnap.id, ...data });
      }
    });

    tests.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt || 0)).getTime();
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt || 0)).getTime();
      return tB - tA;
    });

    if (tests.length > 0) {
      try {
        localStorage.setItem(`studypilot_test_history_${currentDomainId}`, JSON.stringify(tests));
      } catch (e) {}
      renderTestHistoryList(tests);
    }
  } catch (err) {
    console.warn('Test history cloud sync note:', err);
  }
}

async function loadTestHistory() {
  renderCachedTestHistory();
  if (currentUser) {
    await syncTestHistoryFromCloud();
  }
}

// ─── USER INFO & LOGOUT ───────────────────────────────────────
function renderUserInfo(user) {
  const name     = user.displayName || 'Student';
  const av = document.getElementById('sidebar-avatar');
  const nm = document.getElementById('sidebar-name');
  const em = document.getElementById('sidebar-email');

  if (av) av.textContent = name.charAt(0).toUpperCase();
  if (nm) nm.textContent = name;
  if (em) em.textContent = user.email || '';
}

window.handleLogout = async function() {
  await signOut(auth);
  window.location.href = '../index.html';
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
