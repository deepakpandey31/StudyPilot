/* ============================================================
   roadmap.js — Multi-Domain Syllabus & Learning Roadmap.

   Supports:
   1. AKTU CSE Semesters 1–8 with verified syllabus data.
   2. Data Structures & Algorithms (DSA) comprehensive roadmap.
   3. Web Development complete foundational & modern roadmap.
   4. Custom user domains with full roadmap editing.
   5. In-place editing: Add, Edit, and Delete Subjects, Units, Topics, and Resource Links.
   6. Progress persistence per domain with backward compatibility.
   ============================================================ */

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, setDoc, deleteDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { SYLLABUS, DSA_ROADMAP, WEBDEV_ROADMAP, getDomainRoadmap } from './syllabus-data.js';
import { DomainManager } from './domain-manager.js';

// Global state
let currentUser     = null;
let currentDomainId = localStorage.getItem('studypilot_active_domain') || 'aktu';
let currentSemester = parseInt(localStorage.getItem('studypilot_current_semester') || '3', 10);
let currentRoadmap  = [];   // Array of Subject objects
let completedTopics = {};   // { "DS_U1_T1": true, ... }

// ─── INSTANT ZERO-DELAY BOOTSTRAP (0ms Render) ────────────────
try {
  const cachedName = localStorage.getItem('studypilot_user_name') || 'Student';
  const cachedEmail = localStorage.getItem('studypilot_user_email') || '';
  renderUserInfo({ displayName: cachedName, email: cachedEmail });
} catch (e) {}

try {
  DomainManager.renderDomainTabs();
} catch (e) {}

// Initial synchronous load and render from memory / local cache
loadRoadmapInstantly();

// ─── AUTH GUARD & BACKGROUND CLOUD SYNC ───────────────────────
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    renderUserInfo(user);

    // Initialize Domain Manager
    try {
      await DomainManager.init('domain-selector-container', (domainId) => {
        currentDomainId = domainId;
        localStorage.setItem('studypilot_active_domain', domainId);
        handleDomainSwitch(domainId);
      });
    } catch (e) {}

    currentDomainId = DomainManager.getActiveDomainId() || currentDomainId;

    // Load user's saved semester preference for AKTU in background
    try {
      const profileRef = doc(db, 'users', user.uid);
      const snap       = await getDoc(profileRef);
      if (snap.exists() && snap.data().semester) {
        currentSemester = parseInt(snap.data().semester, 10);
        localStorage.setItem('studypilot_current_semester', String(currentSemester));
        const sel = document.getElementById('semester-select');
        if (sel) sel.value = String(currentSemester);
      }
    } catch (e) {}

    // Cloud sync in background without blocking screen
    syncRoadmapFromCloud();

  } else {
    const isLocalPreview = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalPreview) {
      window.location.href = '../index.html';
    }
  }
});

// ─── DOMAIN SWITCH HANDLER ────────────────────────────────────
function handleDomainSwitch(domainId) {
  currentDomainId = domainId;
  localStorage.setItem('studypilot_active_domain', domainId);
  loadRoadmapInstantly();
  if (currentUser) {
    syncRoadmapFromCloud();
  }
}

// ─── INSTANT LOCAL ROADMAP LOADER (0ms) ────────────────────────
function loadRoadmapInstantly() {
  const domain = DomainManager.getActiveDomain ? DomainManager.getActiveDomain() : { name: currentDomainId, description: '' };
  const titleEl = document.getElementById('roadmap-page-title');
  const subEl   = document.getElementById('roadmap-page-subtitle');
  const semContainer = document.getElementById('semester-select-container');
  const bannerTitle  = document.getElementById('overall-banner-title');
  const sel = document.getElementById('semester-select');
  if (sel) sel.value = String(currentSemester);

  if (currentDomainId === 'aktu') {
    if (semContainer) semContainer.style.display = 'block';
    if (titleEl) titleEl.textContent = 'AKTU Syllabus Roadmap';
    if (subEl) subEl.textContent = 'Track your official university syllabus progress, units, and learning resources';
    if (bannerTitle) bannerTitle.textContent = `Semester ${currentSemester} Progress`;
  } else {
    if (semContainer) semContainer.style.display = 'none';
    if (titleEl) titleEl.textContent = `${domain.name || 'Domain'} Roadmap`;
    if (subEl) subEl.textContent = domain.description || `Master your ${domain.name || ''} roadmap topic by topic`;
    if (bannerTitle) bannerTitle.textContent = `${domain.name || 'Domain'} Overall Progress`;
  }

  // 1. Read cached custom roadmap or default starter roadmap
  let loadedRoadmap = null;
  try {
    const cachedRm = localStorage.getItem(`studypilot_custom_roadmap_${getCustomRoadmapDocKey()}`);
    if (cachedRm) loadedRoadmap = JSON.parse(cachedRm);
  } catch (e) {}

  if (!loadedRoadmap || !Array.isArray(loadedRoadmap) || loadedRoadmap.length === 0) {
    loadedRoadmap = getDomainRoadmap(currentDomainId, currentSemester) || [];
  }
  currentRoadmap = JSON.parse(JSON.stringify(loadedRoadmap));

  // 2. Read cached progress
  try {
    const cachedProg = localStorage.getItem(`studypilot_roadmap_progress_${getProgressDocKey()}`);
    if (cachedProg) {
      completedTopics = JSON.parse(cachedProg);
    } else {
      completedTopics = {};
    }
  } catch (e) {
    completedTopics = {};
  }

  // Render UI immediately
  renderRoadmapUI();
}

// ─── BACKGROUND CLOUD SYNC (Non-Blocking) ──────────────────────
async function syncRoadmapFromCloud() {
  if (!currentUser || !db) return;

  try {
    // 1. Check custom roadmap in Firestore
    const roadmapRef = doc(db, 'users', currentUser.uid, 'customRoadmaps', getCustomRoadmapDocKey());
    const rmSnap     = await getDoc(roadmapRef);

    if (rmSnap.exists() && Array.isArray(rmSnap.data().subjects) && rmSnap.data().subjects.length > 0) {
      currentRoadmap = JSON.parse(JSON.stringify(rmSnap.data().subjects));
      try {
        localStorage.setItem(`studypilot_custom_roadmap_${getCustomRoadmapDocKey()}`, JSON.stringify(currentRoadmap));
      } catch (e) {}
    }

    // 2. Check cloud progress
    const progressRef = doc(db, 'users', currentUser.uid, 'roadmap', getProgressDocKey());
    const progSnap    = await getDoc(progressRef);

    if (progSnap.exists() && progSnap.data().completedTopics) {
      completedTopics = { ...completedTopics, ...progSnap.data().completedTopics };
      try {
        localStorage.setItem(`studypilot_roadmap_progress_${getProgressDocKey()}`, JSON.stringify(completedTopics));
      } catch (e) {}
    } else if (currentDomainId === 'aktu') {
      const legacyRef  = doc(db, 'users', currentUser.uid, 'roadmap', 'progress');
      const legacySnap = await getDoc(legacyRef);
      if (legacySnap.exists() && legacySnap.data().completedTopics) {
        completedTopics = { ...completedTopics, ...legacySnap.data().completedTopics };
        try {
          localStorage.setItem(`studypilot_roadmap_progress_${getProgressDocKey()}`, JSON.stringify(completedTopics));
        } catch (e) {}
      }
    }

    renderRoadmapUI();
  } catch (err) {
    console.warn('Cloud roadmap sync note (offline/local used):', err);
  }
}

// ─── GET STORAGE KEYS ─────────────────────────────────────────
function getCustomRoadmapDocKey() {
  if (currentDomainId === 'aktu') {
    return `aktu_sem_${currentSemester}`;
  }
  return currentDomainId;
}

function getProgressDocKey() {
  return `progress_${currentDomainId}`;
}

// ─── RENDER ROADMAP UI ────────────────────────────────────────
function renderRoadmapUI() {
  const container = document.getElementById('roadmap-container');
  if (!container) return;

  if (!currentRoadmap || currentRoadmap.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:40px 20px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p style="margin-top:10px; font-weight:600;">No subjects or modules in this roadmap yet.</p>
        <p class="text-muted text-sm" style="margin-bottom:15px;">Add your first subject or curriculum module to begin tracking progress.</p>
        <button class="btn btn-primary btn-sm" onclick="openSubjectModal()">+ Add Subject</button>
      </div>`;
    updateOverallBanner(0, 0);
    return;
  }

  let html           = '';
  let totalTopics    = 0;
  let totalCompleted = 0;

  currentRoadmap.forEach((subject, sIdx) => {
    let sTotalTopics     = 0;
    let sCompletedTopics = 0;

    const units = subject.units || [];
    units.forEach(unit => {
      (unit.topics || []).forEach(topic => {
        sTotalTopics++;
        totalTopics++;
        const key = `${subject.code}_${unit.id}_${topic.id}`;
        if (completedTopics[key]) {
          sCompletedTopics++;
          totalCompleted++;
        }
      });
    });

    const pct = calcPercent(sCompletedTopics, sTotalTopics);

    html += `
    <div class="subject-block" id="subject-block-${sIdx}">
      <div class="subject-header" onclick="toggleSubject(${sIdx})" role="button"
           aria-expanded="false" aria-controls="subject-body-${sIdx}">
        <div class="subject-title-row">
          <span class="subject-name">${escapeHtml(subject.name)}</span>
          <span class="badge badge-gray">${escapeHtml(subject.code || 'SUB')}</span>
          ${subject.credits ? `<span class="badge badge-gray">${subject.credits} cr</span>` : ''}
        </div>
        <div style="display:flex; align-items:center; gap:12px; flex-shrink:0;">
          <span class="subject-progress-info" id="subj-info-${sIdx}">
            ${sCompletedTopics}/${sTotalTopics}
          </span>
          <div class="subject-bar-wrap">
            <div class="subject-bar-fill" id="subj-bar-${sIdx}" style="width:${pct}%"></div>
          </div>
          <div class="roadmap-toolbar" onclick="event.stopPropagation()">
            <button class="btn-icon-subtle" title="Edit Subject" onclick="openSubjectModal(${sIdx})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            <button class="btn-icon-subtle btn-icon-danger" title="Delete Subject" onclick="deleteSubject(${sIdx})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
          <svg class="subject-expand-icon" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
               stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>

      <div class="subject-body" id="subject-body-${sIdx}">
        ${buildUnitsHtml(subject, sIdx)}
        <div style="margin-top:16px; padding-top:12px; border-top:1px dashed var(--color-border); display:flex; justify-content:flex-start;">
          <button class="btn btn-ghost btn-sm" onclick="openUnitModal(${sIdx})">
            + Add Unit / Chapter
          </button>
        </div>
      </div>
    </div>`;
  });

  container.innerHTML = html;
  updateOverallBanner(totalCompleted, totalTopics);
}

// ─── BUILD UNITS HTML ─────────────────────────────────────────
function buildUnitsHtml(subject, sIdx) {
  const units = subject.units || [];
  if (units.length === 0) {
    return `<p class="text-muted text-sm" style="padding:10px 0;">No units in this subject yet. Click "+ Add Unit / Chapter" below.</p>`;
  }

  let html = '';
  units.forEach((unit, uIdx) => {
    const topics = unit.topics || [];
    let uTotal     = topics.length;
    let uCompleted = 0;

    topics.forEach(topic => {
      const key = `${subject.code}_${unit.id}_${topic.id}`;
      if (completedTopics[key]) uCompleted++;
    });

    html += `
    <div class="unit-block" style="background:var(--color-bg); border:1px solid var(--color-border); border-radius:var(--radius-sm); padding:12px; margin-bottom:12px;">
      <div class="unit-header" style="display:flex; align-items:center; margin-bottom:8px;">
        <span style="font-weight:600; color:var(--color-text);">${escapeHtml(unit.name)}</span>
        <span class="unit-progress-pill" id="unit-pill-${sIdx}-${uIdx}" style="margin-left:8px;">
          ${uCompleted}/${uTotal}
        </span>
        <div class="unit-actions">
          <button class="btn-icon-subtle" title="Add Topic to Unit" onclick="openTopicModal(${sIdx}, ${uIdx})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span style="font-size:11px; margin-left:3px;">Topic</span>
          </button>
          <button class="btn-icon-subtle" title="Edit Unit" onclick="openUnitModal(${sIdx}, ${uIdx})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
          <button class="btn-icon-subtle btn-icon-danger" title="Delete Unit" onclick="deleteUnit(${sIdx}, ${uIdx})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          </button>
        </div>
      </div>`;

    if (topics.length === 0) {
      html += `<p class="text-muted text-xs" style="margin-left:8px; padding:4px 0;">No topics added yet. Click "+ Topic" above.</p>`;
    } else {
      topics.forEach((topic, tIdx) => {
        const key       = `${subject.code}_${unit.id}_${topic.id}`;
        const isDone    = !!completedTopics[key];
        const checkId   = `chk-${sIdx}-${uIdx}-${tIdx}`;

        html += `
        <div class="topic-row">
          <input
            type="checkbox"
            class="topic-checkbox"
            id="${checkId}"
            ${isDone ? 'checked' : ''}
            onchange="toggleTopic('${key}', this.checked, ${sIdx}, ${uIdx})"
            aria-label="${escapeHtml(topic.name)}"
          />
          <label class="topic-name ${isDone ? 'completed' : ''}" for="${checkId}">
            ${escapeHtml(topic.name)}
          </label>
          ${topic.resource ? `
            <a href="${escapeHtml(topic.resource)}" target="_blank" rel="noopener noreferrer" class="topic-resource-badge" title="Open learning resource">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Resource
            </a>` : ''}
          <div class="topic-actions">
            <button class="btn-icon-subtle" title="Edit Topic / Resource" onclick="openTopicModal(${sIdx}, ${uIdx}, ${tIdx})">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            <button class="btn-icon-subtle btn-icon-danger" title="Delete Topic" onclick="deleteTopic(${sIdx}, ${uIdx}, ${tIdx})">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
            </button>
          </div>
        </div>`;
      });
    }

    html += `</div>`;
  });

  return html;
}

// ─── TOGGLE TOPIC CHECKBOX ────────────────────────────────────
window.toggleTopic = async function(key, isChecked, sIdx, uIdx) {
  if (isChecked) {
    completedTopics[key] = true;
  } else {
    delete completedTopics[key];
  }

  // Update label visually
  const checkbox = document.querySelector(`input[onchange*="'${key}'"]`);
  if (checkbox) {
    const label = checkbox.nextElementSibling;
    if (label) label.classList.toggle('completed', isChecked);
  }

  updateSubjectProgress(sIdx);

  // 1. Immediately save to LocalStorage for 0ms offline-first guarantee
  try {
    localStorage.setItem(`studypilot_roadmap_progress_${getProgressDocKey()}`, JSON.stringify(completedTopics));
  } catch (e) {}

  // 2. Background Firestore Sync
  if (currentUser && db) {
    try {
      const progressRef = doc(db, 'users', currentUser.uid, 'roadmap', getProgressDocKey());
      await setDoc(progressRef, {
        completedTopics: completedTopics,
        lastUpdated: new Date().toISOString(),
        domainId: currentDomainId
      }, { merge: true });

      if (currentDomainId === 'aktu') {
        const legacyRef = doc(db, 'users', currentUser.uid, 'roadmap', 'progress');
        await setDoc(legacyRef, {
          completedTopics: completedTopics,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore topic progress sync note (saved locally):', err);
    }
  }
};

// ─── UPDATE PROGRESS CALCULATION IN UI ────────────────────────
function updateSubjectProgress(sIdx) {
  const subject = currentRoadmap[sIdx];
  if (!subject) return;

  let sTotalTopics     = 0;
  let sCompletedTopics = 0;

  (subject.units || []).forEach((unit, uIdx) => {
    let uTotal     = (unit.topics || []).length;
    let uCompleted = 0;

    (unit.topics || []).forEach(topic => {
      sTotalTopics++;
      const key = `${subject.code}_${unit.id}_${topic.id}`;
      if (completedTopics[key]) {
        sCompletedTopics++;
        uCompleted++;
      }
    });

    const pillEl = document.getElementById(`unit-pill-${sIdx}-${uIdx}`);
    if (pillEl) pillEl.textContent = `${uCompleted}/${uTotal}`;
  });

  const pct    = calcPercent(sCompletedTopics, sTotalTopics);
  const barEl  = document.getElementById(`subj-bar-${sIdx}`);
  const infoEl = document.getElementById(`subj-info-${sIdx}`);
  if (barEl)  barEl.style.width  = `${pct}%`;
  if (infoEl) infoEl.textContent = `${sCompletedTopics}/${sTotalTopics}`;

  // Recalculate overall
  let totalTopics    = 0;
  let totalCompleted = 0;
  currentRoadmap.forEach(sub => {
    (sub.units || []).forEach(u => {
      (u.topics || []).forEach(t => {
        totalTopics++;
        const k = `${sub.code}_${u.id}_${t.id}`;
        if (completedTopics[k]) totalCompleted++;
      });
    });
  });

  updateOverallBanner(totalCompleted, totalTopics);
}

function updateOverallBanner(completed, total) {
  const pct    = calcPercent(completed, total);
  const pctEl  = document.getElementById('overall-pct');
  const barEl  = document.getElementById('overall-bar');
  const textEl = document.getElementById('overall-topics-text');

  if (pctEl)  pctEl.textContent  = `${pct}%`;
  if (barEl)  barEl.style.width  = `${pct}%`;
  if (textEl) textEl.textContent = `${completed} of ${total} topics completed`;
}

// ─── SAVE ROADMAP STRUCTURE TO FIRESTORE ──────────────────────
async function saveRoadmapStructure() {
  try {
    const roadmapRef = doc(db, 'users', currentUser.uid, 'customRoadmaps', getCustomRoadmapDocKey());
    await setDoc(roadmapRef, {
      domainId: currentDomainId,
      semester: currentDomainId === 'aktu' ? currentSemester : null,
      subjects: currentRoadmap,
      lastUpdated: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.error('Error saving roadmap structure:', err);
    showToast('Failed to save changes to cloud.', 'error');
    return false;
  }
}

// ─── SUBJECT CRUD ─────────────────────────────────────────────
window.openSubjectModal = function(editIndex = -1) {
  const modal   = document.getElementById('modal-subject');
  const titleEl = document.getElementById('modal-subject-title');
  const idxEl   = document.getElementById('edit-subject-index');
  const nameEl  = document.getElementById('subject-input-name');
  const codeEl  = document.getElementById('subject-input-code');
  const credEl  = document.getElementById('subject-input-credits');

  if (editIndex >= 0 && currentRoadmap[editIndex]) {
    const sub = currentRoadmap[editIndex];
    titleEl.textContent = 'Edit Subject';
    idxEl.value = String(editIndex);
    nameEl.value = sub.name || '';
    codeEl.value = sub.code || '';
    credEl.value = sub.credits || 4;
  } else {
    titleEl.textContent = 'Add Subject';
    idxEl.value = '-1';
    nameEl.value = '';
    codeEl.value = '';
    credEl.value = 4;
  }

  if (modal) modal.classList.add('active');
};

window.closeSubjectModal = function() {
  const modal = document.getElementById('modal-subject');
  if (modal) modal.classList.remove('active');
};

window.saveSubject = async function(e) {
  e.preventDefault();
  const editIndex = parseInt(document.getElementById('edit-subject-index').value, 10);
  const name      = document.getElementById('subject-input-name').value.trim();
  const code      = document.getElementById('subject-input-code').value.trim().toUpperCase().replace(/\s+/g, '_');
  const credits   = parseInt(document.getElementById('subject-input-credits').value, 10) || 4;

  if (!name || !code) return;

  if (editIndex >= 0 && currentRoadmap[editIndex]) {
    currentRoadmap[editIndex].name    = name;
    currentRoadmap[editIndex].code    = code;
    currentRoadmap[editIndex].credits = credits;
    showToast('Subject updated.', 'success');
  } else {
    currentRoadmap.push({
      name,
      code,
      credits,
      units: []
    });
    showToast('Subject added.', 'success');
  }

  closeSubjectModal();
  renderRoadmapUI();
  await saveRoadmapStructure();
};

window.deleteSubject = async function(sIdx) {
  const sub = currentRoadmap[sIdx];
  if (!sub) return;
  if (!confirm(`Are you sure you want to delete "${sub.name}" and all its units?`)) return;

  // Clean up completed topics for this subject
  (sub.units || []).forEach(u => {
    (u.topics || []).forEach(t => {
      delete completedTopics[`${sub.code}_${u.id}_${t.id}`];
    });
  });

  currentRoadmap.splice(sIdx, 1);
  renderRoadmapUI();
  await saveRoadmapStructure();
  showToast('Subject deleted.', 'info');
};

// ─── UNIT CRUD ────────────────────────────────────────────────
window.openUnitModal = function(sIdx, editIndex = -1) {
  const modal   = document.getElementById('modal-unit');
  const titleEl = document.getElementById('modal-unit-title');
  const sIdxEl  = document.getElementById('unit-subject-index');
  const editEl  = document.getElementById('unit-edit-index');
  const nameEl  = document.getElementById('unit-input-name');

  sIdxEl.value = String(sIdx);
  editEl.value = String(editIndex);

  if (editIndex >= 0 && currentRoadmap[sIdx] && currentRoadmap[sIdx].units[editIndex]) {
    titleEl.textContent = 'Edit Unit / Chapter';
    nameEl.value = currentRoadmap[sIdx].units[editIndex].name || '';
  } else {
    titleEl.textContent = 'Add Unit / Chapter';
    const nextNum = (currentRoadmap[sIdx]?.units?.length || 0) + 1;
    nameEl.value = `Unit ${nextNum} — `;
  }

  if (modal) modal.classList.add('active');
};

window.closeUnitModal = function() {
  const modal = document.getElementById('modal-unit');
  if (modal) modal.classList.remove('active');
};

window.saveUnit = async function(e) {
  e.preventDefault();
  const sIdx   = parseInt(document.getElementById('unit-subject-index').value, 10);
  const editEl = parseInt(document.getElementById('unit-edit-index').value, 10);
  const name   = document.getElementById('unit-input-name').value.trim();

  if (!name || sIdx < 0 || !currentRoadmap[sIdx]) return;

  if (!currentRoadmap[sIdx].units) currentRoadmap[sIdx].units = [];

  if (editEl >= 0 && currentRoadmap[sIdx].units[editEl]) {
    currentRoadmap[sIdx].units[editEl].name = name;
    showToast('Unit updated.', 'success');
  } else {
    const unitId = `U${currentRoadmap[sIdx].units.length + 1}`;
    currentRoadmap[sIdx].units.push({
      id: unitId,
      name,
      topics: []
    });
    showToast('Unit added.', 'success');
  }

  closeUnitModal();
  renderRoadmapUI();
  await saveRoadmapStructure();
};

window.deleteUnit = async function(sIdx, uIdx) {
  const sub = currentRoadmap[sIdx];
  if (!sub || !sub.units[uIdx]) return;
  const unit = sub.units[uIdx];

  if (!confirm(`Delete "${unit.name}" and its topics?`)) return;

  (unit.topics || []).forEach(t => {
    delete completedTopics[`${sub.code}_${unit.id}_${t.id}`];
  });

  sub.units.splice(uIdx, 1);
  renderRoadmapUI();
  await saveRoadmapStructure();
  showToast('Unit removed.', 'info');
};

// ─── TOPIC CRUD ───────────────────────────────────────────────
window.openTopicModal = function(sIdx, uIdx, editIndex = -1) {
  const modal    = document.getElementById('modal-topic');
  const titleEl  = document.getElementById('modal-topic-title');
  const sIdxEl   = document.getElementById('topic-subject-index');
  const uIdxEl   = document.getElementById('topic-unit-index');
  const editEl   = document.getElementById('topic-edit-index');
  const nameEl   = document.getElementById('topic-input-name');
  const resEl    = document.getElementById('topic-input-resource');

  sIdxEl.value = String(sIdx);
  uIdxEl.value = String(uIdx);
  editEl.value = String(editIndex);

  const unit = currentRoadmap[sIdx]?.units?.[uIdx];
  if (editIndex >= 0 && unit?.topics?.[editIndex]) {
    const topic = unit.topics[editIndex];
    titleEl.textContent = 'Edit Topic';
    nameEl.value = topic.name || '';
    resEl.value  = topic.resource || '';
  } else {
    titleEl.textContent = 'Add Topic';
    nameEl.value = '';
    resEl.value  = '';
  }

  if (modal) modal.classList.add('active');
};

window.closeTopicModal = function() {
  const modal = document.getElementById('modal-topic');
  if (modal) modal.classList.remove('active');
};

window.saveTopic = async function(e) {
  e.preventDefault();
  const sIdx   = parseInt(document.getElementById('topic-subject-index').value, 10);
  const uIdx   = parseInt(document.getElementById('topic-unit-index').value, 10);
  const editEl = parseInt(document.getElementById('topic-edit-index').value, 10);
  const name   = document.getElementById('topic-input-name').value.trim();
  const res    = document.getElementById('topic-input-resource').value.trim();

  const unit = currentRoadmap[sIdx]?.units?.[uIdx];
  if (!name || !unit) return;

  if (!unit.topics) unit.topics = [];

  if (editEl >= 0 && unit.topics[editEl]) {
    unit.topics[editEl].name     = name;
    unit.topics[editEl].resource = res || null;
    showToast('Topic updated.', 'success');
  } else {
    const topicId = `T${unit.topics.length + 1}`;
    unit.topics.push({
      id: topicId,
      name,
      resource: res || null
    });
    showToast('Topic added.', 'success');
  }

  closeTopicModal();
  renderRoadmapUI();
  await saveRoadmapStructure();
};

window.deleteTopic = async function(sIdx, uIdx, tIdx) {
  const sub  = currentRoadmap[sIdx];
  const unit = sub?.units?.[uIdx];
  const topic = unit?.topics?.[tIdx];
  if (!topic) return;

  if (!confirm(`Delete topic "${topic.name}"?`)) return;

  delete completedTopics[`${sub.code}_${unit.id}_${topic.id}`];
  unit.topics.splice(tIdx, 1);

  renderRoadmapUI();
  await saveRoadmapStructure();
  showToast('Topic deleted.', 'info');
};

// ─── RESET ROADMAP TO OFFICIAL DEFAULTS ───────────────────────
window.confirmResetRoadmap = async function() {
  const domain = DomainManager.getActiveDomain();
  if (!confirm(`Reset "${domain.name}" roadmap to default structure? Your checked topic progress will be preserved where IDs match.`)) {
    return;
  }

  try {
    const roadmapRef = doc(db, 'users', currentUser.uid, 'customRoadmaps', getCustomRoadmapDocKey());
    await deleteDoc(roadmapRef);

    const defaultSubjects = getDomainRoadmap(currentDomainId, currentSemester);
    currentRoadmap = JSON.parse(JSON.stringify(defaultSubjects || []));

    renderRoadmapUI();
    showToast('Reset to default curriculum structure.', 'success');
  } catch (err) {
    console.error('Error resetting roadmap:', err);
    showToast('Could not reset roadmap.', 'error');
  }
};

// ─── TOGGLE SUBJECT ACCORDION ─────────────────────────────────
window.toggleSubject = function(sIdx) {
  const block = document.getElementById(`subject-block-${sIdx}`);
  if (block) {
    block.classList.toggle('open');
    const header = block.querySelector('.subject-header');
    if (header) {
      const expanded = block.classList.contains('open');
      header.setAttribute('aria-expanded', String(expanded));
    }
  }
};

// ─── CHANGE SEMESTER (FOR AKTU) ───────────────────────────────
window.changeSemester = async function(newSemester) {
  currentSemester = parseInt(newSemester, 10);

  if (currentUser) {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        semester: currentSemester
      });
    } catch (err) {
      console.warn('Could not save semester preference:', err);
    }
  }

  const bannerTitle = document.getElementById('overall-banner-title');
  if (bannerTitle && currentDomainId === 'aktu') {
    bannerTitle.textContent = `Semester ${currentSemester} Progress`;
  }

  await loadRoadmap();
};

// ─── PERSONALIZED DAILY STUDY CALENDAR ENGINE ─────────────────
let activeRoadmapView = 'tree';
let selectedCalDate   = getLocalTodayString();
let dailyScheduleMap  = {};

function getLocalTodayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return 'No date';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const todayStr = getLocalTodayString();
  const isToday = dateStr === todayStr;
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  const formatted = d.toLocaleDateString('en-IN', options);
  return isToday ? `Today (${formatted})` : formatted;
}

window.switchRoadmapView = function(view) {
  activeRoadmapView = view;
  const btnTree = document.getElementById('btn-view-tree');
  const btnCal  = document.getElementById('btn-view-calendar');
  const treeView = document.getElementById('roadmap-tree-view');
  const calView  = document.getElementById('roadmap-calendar-view');

  if (view === 'tree') {
    if (btnTree) btnTree.className = 'btn btn-primary btn-sm';
    if (btnCal)  btnCal.className  = 'btn btn-ghost btn-sm';
    if (treeView) treeView.style.display = 'block';
    if (calView)  calView.style.display  = 'none';
  } else {
    if (btnTree) btnTree.className = 'btn btn-ghost btn-sm';
    if (btnCal)  btnCal.className  = 'btn btn-primary btn-sm';
    if (treeView) treeView.style.display = 'none';
    if (calView)  calView.style.display  = 'block';
    loadCalendarViewData();
  }
};

function getPlannerStorageKey() {
  return `studypilot_exam_planner_${currentDomainId}_sem_${currentSemester}`;
}

function getPlannerDocKey() {
  return `planner_${currentDomainId}_sem_${currentSemester}`;
}

async function loadCalendarViewData() {
  const badgeEl = document.getElementById('cal-academic-badge');
  if (badgeEl) {
    if (currentDomainId === 'aktu') {
      const yr = currentSemester <= 2 ? 'First Year (2026–27 CSE)' : 'Second Year (BCS-Series)';
      badgeEl.textContent = `Semester ${currentSemester} • ${yr}`;
    } else {
      badgeEl.textContent = `Domain: ${currentDomainId.toUpperCase()}`;
    }
  }

  // Load saved planner settings from cache or Firestore
  let planner = null;
  try {
    const raw = localStorage.getItem(getPlannerStorageKey());
    if (raw) planner = JSON.parse(raw);
  } catch (e) {}

  if (!planner && currentUser && db) {
    try {
      // 1. Try roadmap subcollection (conforms to Firestore security rules)
      const pRef = doc(db, 'users', currentUser.uid, 'roadmap', getPlannerDocKey());
      const pSnap = await getDoc(pRef);
      if (pSnap.exists()) {
        planner = pSnap.data();
        try { localStorage.setItem(getPlannerStorageKey(), JSON.stringify(planner)); } catch (e) {}
      } else {
        // 2. Legacy fallback
        const legacyRef = doc(db, 'users', currentUser.uid, 'examPlanner', getPlannerStorageKey());
        const legSnap = await getDoc(legacyRef);
        if (legSnap.exists()) {
          planner = legSnap.data();
          try { localStorage.setItem(getPlannerStorageKey(), JSON.stringify(planner)); } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('Notice loading cloud planner:', e);
    }
  }

  const nameInput  = document.getElementById('cal-exam-name');
  const dateInput  = document.getElementById('cal-exam-date');
  const hoursInput = document.getElementById('cal-daily-hours');

  if (planner) {
    if (nameInput)  nameInput.value  = planner.examName || '';
    if (dateInput)  dateInput.value  = planner.examDate || '';
    if (hoursInput) hoursInput.value = planner.dailyHours || 3;
    dailyScheduleMap = planner.dailySchedule || {};
  } else {
    if (nameInput)  nameInput.value  = currentDomainId === 'aktu' ? `AKTU Semester ${currentSemester} Examination` : 'Certification Exam';
    if (hoursInput) hoursInput.value = 3;
  }

  renderCalendarViewUI();
}

window.handleSaveExamPlanner = async function(event) {
  if (event) event.preventDefault();

  const nameVal  = document.getElementById('cal-exam-name')?.value.trim() || 'Exam';
  const dateVal  = document.getElementById('cal-exam-date')?.value;
  const hoursVal = parseFloat(document.getElementById('cal-daily-hours')?.value || '3');

  if (!dateVal) {
    showToast('Please select a target examination date.', 'error');
    return;
  }

  const todayStr = getLocalTodayString();
  if (dateVal <= todayStr) {
    showToast('Target examination date must be in the future.', 'error');
    return;
  }

  const btn = document.getElementById('btn-save-planner');
  if (btn) btn.disabled = true;

  try {
    if (!currentRoadmap || currentRoadmap.length === 0) {
      currentRoadmap = getDomainRoadmap(currentDomainId, currentSemester) || [];
    }

    // Generate schedule across days
    const schedule = generateDailyStudySchedule(dateVal, hoursVal);
    dailyScheduleMap = schedule;

    const plannerData = {
      examName: nameVal,
      examDate: dateVal,
      dailyHours: hoursVal,
      dailySchedule: dailyScheduleMap,
      updatedAt: new Date().toISOString()
    };

    // 1. Immediately save to localStorage
    try {
      localStorage.setItem(getPlannerStorageKey(), JSON.stringify(plannerData));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // 2. Render UI and notify student immediately
    selectedCalDate = todayStr;
    renderCalendarViewUI();
    showToast('Personalized daily study roadmap generated!', 'success');

    // 3. Sync to Firestore in background under permitted 'roadmap' subcollection
    if (currentUser && db) {
      try {
        const pRef = doc(db, 'users', currentUser.uid, 'roadmap', getPlannerDocKey());
        await setDoc(pRef, plannerData, { merge: true });
      } catch (cloudErr) {
        console.warn('Notice: Firestore cloud sync skipped, local schedule active:', cloudErr);
      }
    }
  } catch (err) {
    console.error('Error generating exam planner:', err);
    showToast('Could not generate schedule. Please try again.', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
};

function generateDailyStudySchedule(targetDateStr, dailyHours) {
  const allTopics = [];
  (currentRoadmap || []).forEach(subject => {
    (subject.units || []).forEach(unit => {
      (unit.topics || []).forEach(topic => {
        const key = `${subject.code}_${unit.id}_${topic.id}`;
        allTopics.push({
          key,
          subjectName: subject.name,
          subjectCode: subject.code,
          subjectCredits: subject.credits || 3,
          unitName: unit.name,
          topicName: topic.name,
          isDone: !!completedTopics[key]
        });
      });
    });
  });

  // Filter incomplete topics (prioritize by subject credits descending)
  const pendingTopics = allTopics.filter(t => !t.isDone);
  pendingTopics.sort((a, b) => b.subjectCredits - a.subjectCredits);

  // Calculate days array from today to target date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parts = targetDateStr.split('-').map(Number);
  const target = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const schedule = {};
  const topicsPerDay = Math.max(1, Math.ceil(pendingTopics.length / diffDays));

  let topicIndex = 0;
  for (let i = 0; i < diffDays; i++) {
    const curDate = new Date(today);
    curDate.setDate(today.getDate() + i);
    const y = curDate.getFullYear();
    const m = String(curDate.getMonth() + 1).padStart(2, '0');
    const d = String(curDate.getDate()).padStart(2, '0');
    const dStr = `${y}-${m}-${d}`;

    schedule[dStr] = [];

    // Assign topics for this day
    for (let j = 0; j < topicsPerDay && topicIndex < pendingTopics.length; j++) {
      const top = pendingTopics[topicIndex++];
      schedule[dStr].push({
        id: `task_${dStr}_${top.key}`,
        key: top.key,
        subjectName: top.subjectName,
        subjectCode: top.subjectCode,
        unitName: top.unitName,
        topicName: top.topicName,
        durationMins: 45,
        status: 'scheduled'
      });
    }
  }

  return schedule;
}

window.redistributeUnfinishedTasks = async function() {
  const todayStr = getLocalTodayString();
  const dateInput = document.getElementById('cal-exam-date');
  const targetDateStr = dateInput?.value;

  if (!targetDateStr) {
    showToast('Please set an exam date first.', 'error');
    return;
  }

  // Find all unfinished tasks on dates before today
  const overdueTasks = [];
  Object.keys(dailyScheduleMap).forEach(dStr => {
    if (dStr < todayStr) {
      const dayTasks = dailyScheduleMap[dStr] || [];
      dayTasks.forEach(t => {
        if (!completedTopics[t.key] && t.status !== 'completed') {
          t.status = 'overdue';
          overdueTasks.push(t);
        }
      });
    }
  });

  if (overdueTasks.length === 0) {
    showToast('No overdue tasks found! Great work staying on track.', 'success');
    renderCalendarViewUI();
    return;
  }

  // Append overdue tasks into today and future days without duplicate active topics
  const scheduledKeys = new Set();
  const futureDates = Object.keys(dailyScheduleMap).filter(d => d >= todayStr).sort();
  if (futureDates.length === 0) futureDates.push(todayStr);

  futureDates.forEach(d => {
    (dailyScheduleMap[d] || []).forEach(t => scheduledKeys.add(t.key));
  });

  let assignIdx = 0;
  overdueTasks.forEach(task => {
    if (!scheduledKeys.has(task.key) && !completedTopics[task.key]) {
      const targetDay = futureDates[assignIdx % futureDates.length];
      if (!dailyScheduleMap[targetDay]) dailyScheduleMap[targetDay] = [];
      dailyScheduleMap[targetDay].push({
        ...task,
        id: `task_${targetDay}_${task.key}_rescheduled`,
        status: 'rescheduled'
      });
      scheduledKeys.add(task.key);
      assignIdx++;
    }
  });

  // Save updated schedule
  const hoursVal = parseFloat(document.getElementById('cal-daily-hours')?.value || '3');
  const nameVal  = document.getElementById('cal-exam-name')?.value || 'Exam';
  const plannerData = {
    examName: nameVal,
    examDate: targetDateStr,
    dailyHours: hoursVal,
    dailySchedule: dailyScheduleMap,
    updatedAt: new Date().toISOString()
  };

  try { localStorage.setItem(getPlannerStorageKey(), JSON.stringify(plannerData)); } catch (e) {}
  showToast(`${overdueTasks.length} unfinished tasks rescheduled across remaining days!`, 'success');
  renderCalendarViewUI();

  if (currentUser && db) {
    try {
      const pRef = doc(db, 'users', currentUser.uid, 'roadmap', getPlannerDocKey());
      await setDoc(pRef, plannerData, { merge: true });
    } catch (cloudErr) {
      console.warn('Notice: cloud sync skipped for reschedule:', cloudErr);
    }
  }
};

window.navCalendarDay = function(delta) {
  if (delta === 0) {
    selectedCalDate = getLocalTodayString();
  } else {
    const parts = selectedCalDate.split('-');
    const cur = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    cur.setDate(cur.getDate() + delta);
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    selectedCalDate = `${y}-${m}-${d}`;
  }
  renderCalendarViewUI();
};

window.toggleCalendarTask = async function(dateStr, key, isChecked) {
  // 1. Update completedTopics canonical status
  if (isChecked) {
    completedTopics[key] = true;
  } else {
    delete completedTopics[key];
  }

  // 2. Update task in schedule
  if (dailyScheduleMap[dateStr]) {
    dailyScheduleMap[dateStr].forEach(t => {
      if (t.key === key) {
        t.status = isChecked ? 'completed' : 'scheduled';
      }
    });
  }

  // 3. Persist progress to local storage and Firestore
  try {
    localStorage.setItem(`studypilot_roadmap_progress_${getProgressDocKey()}`, JSON.stringify(completedTopics));
  } catch (e) {}

  if (currentUser && db) {
    const progressRef = doc(db, 'users', currentUser.uid, 'roadmap', getProgressDocKey());
    setDoc(progressRef, { completedTopics, updatedAt: new Date().toISOString() }, { merge: true }).catch(console.warn);
  }

  // 4. Update schedule in storage
  const plannerRaw = localStorage.getItem(getPlannerStorageKey());
  if (plannerRaw) {
    try {
      const p = JSON.parse(plannerRaw);
      p.dailySchedule = dailyScheduleMap;
      localStorage.setItem(getPlannerStorageKey(), JSON.stringify(p));
      if (currentUser && db) {
        const pRef = doc(db, 'users', currentUser.uid, 'roadmap', getPlannerDocKey());
        setDoc(pRef, { dailySchedule: dailyScheduleMap }, { merge: true }).catch(console.warn);
      }
    } catch (e) {}
  }

  renderCalendarViewUI();
  renderRoadmapUI(); // sync tree view immediately
};

function renderCalendarViewUI() {
  const dateDisplayEl = document.getElementById('cal-display-date');
  const dateSubEl     = document.getElementById('cal-display-sub');
  const countBadgeEl  = document.getElementById('cal-day-count-badge');
  const tasksListEl   = document.getElementById('cal-tasks-list');
  const paceStatsEl   = document.getElementById('cal-pace-stats');
  const paceAlertEl   = document.getElementById('cal-pace-alert');

  if (dateDisplayEl) dateDisplayEl.textContent = formatDisplayDate(selectedCalDate);
  if (dateSubEl) {
    const todayStr = getLocalTodayString();
    if (selectedCalDate === todayStr) dateSubEl.textContent = 'Showing today\'s active workload';
    else if (selectedCalDate < todayStr) dateSubEl.textContent = 'Historical past study date';
    else dateSubEl.textContent = 'Upcoming study session';
  }

  // Pace stats & Workload Advisory
  const dateInput  = document.getElementById('cal-exam-date');
  const hoursInput = document.getElementById('cal-daily-hours');
  const targetDateStr = dateInput?.value;
  const dailyHours    = parseFloat(hoursInput?.value || '3');

  if (targetDateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let totalPendingTopics = 0;
    (currentRoadmap || []).forEach(s => {
      (s.units || []).forEach(u => {
        (u.topics || []).forEach(t => {
          if (!completedTopics[`${s.code}_${u.id}_${t.id}`]) totalPendingTopics++;
        });
      });
    });

    const estHoursNeeded = Math.round((totalPendingTopics * 0.75) * 10) / 10;
    const availableHours = Math.max(0, daysLeft * dailyHours);

    if (paceStatsEl) {
      paceStatsEl.innerHTML = `
        <strong>${daysLeft > 0 ? daysLeft : 0} days remaining</strong> until exam.
        Remaining: <strong>${totalPendingTopics} topics</strong> (~${estHoursNeeded} hrs needed).
        Available study capacity: <strong>${availableHours} hrs</strong>.
      `;
    }

    if (paceAlertEl) {
      if (estHoursNeeded > availableHours && daysLeft > 0) {
        paceAlertEl.style.display = 'block';
        paceAlertEl.innerHTML = `⚠️ Workload Warning: ${estHoursNeeded} hrs needed exceeds capacity of ${availableHours} hrs. Increase daily hours or prioritize core theory topics!`;
      } else {
        paceAlertEl.style.display = 'none';
      }
    }
  } else if (paceStatsEl) {
    paceStatsEl.innerHTML = 'Enter target exam date and daily hours above to calculate pacing.';
  }

  // Render tasks for selected date
  const dayTasks = dailyScheduleMap[selectedCalDate] || [];
  if (countBadgeEl) countBadgeEl.textContent = `${dayTasks.length} Tasks Scheduled`;

  if (!tasksListEl) return;

  if (dayTasks.length === 0) {
    tasksListEl.innerHTML = `
      <div class="empty-state" style="padding:28px 16px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <p style="margin-top:8px;">No tasks assigned for ${formatDisplayDate(selectedCalDate)}.</p>
        <p class="text-muted text-xs">Click "Generate / Recalculate Plan" above to distribute your syllabus across the calendar.</p>
      </div>`;
    return;
  }

  let html = '<div style="display:flex; flex-direction:column; gap:10px;">';
  dayTasks.forEach(task => {
    const isDone = !!completedTopics[task.key];
    const isPast = selectedCalDate < getLocalTodayString();

    let badgeClass = 'badge-blue';
    let badgeText  = 'Scheduled';

    if (isDone) {
      badgeClass = 'badge-green';
      badgeText  = 'Completed ✓';
    } else if (task.status === 'rescheduled') {
      badgeClass = 'badge-purple';
      badgeText  = 'Rescheduled';
    } else if (isPast || task.status === 'overdue') {
      badgeClass = 'badge-red';
      badgeText  = 'Overdue';
    }

    html += `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:var(--color-bg); border:1px solid var(--color-border); border-radius:var(--radius-sm); gap:12px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:240px;">
          <input
            type="checkbox"
            class="topic-checkbox"
            style="width:18px; height:18px; cursor:pointer;"
            ${isDone ? 'checked' : ''}
            onchange="toggleCalendarTask('${selectedCalDate}', '${task.key}', this.checked)"
          />
          <div>
            <div style="font-weight:600; font-size:14px; color:var(--color-text); ${isDone ? 'text-decoration:line-through; opacity:0.7;' : ''}">
              ${escapeHtml(task.topicName)}
            </div>
            <div class="text-xs text-muted" style="margin-top:2px;">
              <span style="font-weight:600; color:var(--color-primary);">${escapeHtml(task.subjectCode)}</span> • ${escapeHtml(task.subjectName)} &gt; ${escapeHtml(task.unitName)}
            </div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <span class="text-xs text-muted">⏱ ${task.durationMins || 45} mins</span>
          <span class="badge ${badgeClass}" style="font-size:11px;">${badgeText}</span>
        </div>
      </div>
    `;
  });
  html += '</div>';

  tasksListEl.innerHTML = html;
}

// ─── USER INFO IN SIDEBAR ─────────────────────────────────────
function renderUserInfo(user) {
  const name     = user.displayName || 'Student';
  const initials = getInitials(name);

  const av = document.getElementById('sidebar-avatar');
  const nm = document.getElementById('sidebar-name');
  const em = document.getElementById('sidebar-email');

  if (av) av.textContent = initials;
  if (nm) nm.textContent = name;
  if (em) em.textContent = user.email || '';
}

// ─── LOGOUT ───────────────────────────────────────────────────
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
window.handleLogout = async function() {
  await signOut(auth);
  window.location.href = '../index.html';
};

// ─── UTILITIES ────────────────────────────────────────────────
function calcPercent(part, total) {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

