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
