/* ============================================================
   sgpa.js — SGPA Estimator with Mode A (Manual Credit-Weighted)
   and Mode B (Progress-Based Academic Preparation Analysis).

   Supports:
   - Exact AKTU 10-point credit-weighted formula
   - Empirical synthesis of syllabus completion, test attempts,
     study duration, and sessional marks
   - Honest estimation range, confidence classification, and
     high-priority revision topics
   ============================================================ */

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection, getDocs, doc, getDoc, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { SYLLABUS } from './syllabus-data.js';

let currentUser     = null;
let currentSemester = 3;
let rowCount        = 0;
let userTests       = [];
let userProgress    = {};
let totalStudyMins  = 0;

// ─── AKTU GRADE LOOKUP (Official 10-Point Scale) ───────────────
function getGradeInfo(pct) {
  if (pct >= 91) return { grade: 'O',  points: 10, label: 'Outstanding' };
  if (pct >= 81) return { grade: 'A+', points: 9,  label: 'Excellent' };
  if (pct >= 71) return { grade: 'A',  points: 8,  label: 'Very Good' };
  if (pct >= 61) return { grade: 'B+', points: 7,  label: 'Good' };
  if (pct >= 51) return { grade: 'B',  points: 6,  label: 'Above Average' };
  if (pct >= 45) return { grade: 'C',  points: 5,  label: 'Average' };
  if (pct >= 40) return { grade: 'D',  points: 4,  label: 'Pass' };
  return         { grade: 'F',  points: 0,  label: 'Fail' };
}

// ─── AUTH GUARD & INIT ────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = '../index.html'; return; }
  currentUser = user;
  renderUserInfo(user);

  // 1. Load user profile & semester
  try {
    const cachedSem = localStorage.getItem('studypilot_current_semester');
    if (cachedSem) currentSemester = parseInt(cachedSem, 10);
  } catch (e) {}

  try {
    const profileRef = doc(db, 'users', user.uid);
    const snap       = await getDoc(profileRef);
    if (snap.exists() && snap.data().semester) {
      currentSemester = parseInt(snap.data().semester, 10);
      try { localStorage.setItem('studypilot_current_semester', String(currentSemester)); } catch (e) {}
    }
  } catch (e) {}

  if (currentSemester < 1 || currentSemester > 4) currentSemester = 3;

  const semSelect = document.getElementById('sgpa-semester-select');
  if (semSelect) semSelect.value = String(currentSemester);

  // 2. Pre-fill Mode A subjects from canonical syllabus
  populateSemesterSubjects(currentSemester);

  // 3. Load empirical data for Mode B
  await loadModeBMetrics();
});

// ─── POPULATE SUBJECTS FROM CANONICAL DATA ────────────────────
function populateSemesterSubjects(sem) {
  const tbody = document.getElementById('subjects-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  rowCount = 0;

  const subjects = SYLLABUS[sem] || SYLLABUS[3] || [];
  if (subjects.length > 0) {
    subjects.forEach(sub => {
      // Display canonical subject with code and name
      const displayName = sub.code ? `[${sub.code}] ${sub.name}` : sub.name;
      addSubjectRow(displayName, sub.credits, sub.isNonCredit || sub.credits === 0);
    });
  } else {
    for (let i = 0; i < 4; i++) addSubjectRow();
  }
}

window.changeSGPASemester = async function(newSem) {
  currentSemester = parseInt(newSem, 10);
  populateSemesterSubjects(currentSemester);
  await loadModeBMetrics();
  showToast(`Loaded canonical subjects for Semester ${currentSemester}`, 'info');
};

// ─── MODE SWITCHER ────────────────────────────────────────────
window.switchSGPAMode = function(mode) {
  const btnA  = document.getElementById('btn-sgpa-mode-a');
  const btnB  = document.getElementById('btn-sgpa-mode-b');
  const cardA = document.getElementById('sgpa-mode-a-container');
  const cardB = document.getElementById('sgpa-mode-b-container');

  if (mode === 'A') {
    btnA.className = 'btn btn-primary btn-sm';
    btnB.className = 'btn btn-ghost btn-sm';
    cardA.style.display = 'block';
    cardB.style.display = 'none';
  } else {
    btnA.className = 'btn btn-ghost btn-sm';
    btnB.className = 'btn btn-primary btn-sm';
    cardA.style.display = 'none';
    cardB.style.display = 'block';
  }
};

// ─── MODE A: ADD SUBJECT ROW ──────────────────────────────────
window.addSubjectRow = function(name = '', credits = 4, isNC = false) {
  const tbody = document.getElementById('subjects-tbody');
  if (!tbody) return;

  rowCount++;
  const id = rowCount;

  const row = document.createElement('tr');
  row.id    = `row-${id}`;
  row.dataset.isNc = isNC ? 'true' : 'false';
  row.innerHTML = `
    <td>
      <input type="text" id="subj-name-${id}" value="${escapeHtml(name)}"
             placeholder="Subject name" style="min-width:200px;" />
    </td>
    <td>
      <input type="number" id="subj-credits-${id}" value="${credits}"
             min="0" max="8" placeholder="Credits" ${isNC ? 'title="Non-credit (Audit) course — exempt from SGPA divisor"' : ''} />
      ${isNC ? '<span class="text-xs text-muted" style="display:block; font-size:10px;">NC (Audit)</span>' : ''}
    </td>
    <td>
      <input type="number" id="subj-marks-${id}" value=""
             min="0" max="100" placeholder="0–100"
             oninput="updateGradePreview(${id})" />
    </td>
    <td>
      <span id="grade-preview-${id}" style="font-weight:700; color:var(--color-primary); font-size:13px;">—</span>
    </td>
    <td>
      <button onclick="removeRow(${id})" class="btn btn-ghost btn-sm"
              title="Remove row" aria-label="Remove subject row">✕</button>
    </td>`;

  tbody.appendChild(row);
};

window.updateGradePreview = function(id) {
  const marks = parseFloat(document.getElementById(`subj-marks-${id}`)?.value);
  const previewEl = document.getElementById(`grade-preview-${id}`);
  if (!previewEl) return;

  if (isNaN(marks) || marks < 0 || marks > 100) {
    previewEl.textContent = '—';
    return;
  }

  const { grade, points } = getGradeInfo(marks);
  previewEl.textContent = `${grade} (${points})`;
};

window.removeRow = function(id) {
  const row = document.getElementById(`row-${id}`);
  if (row) row.remove();
};

// ─── MODE A: CALCULATE SGPA ───────────────────────────────────
window.calculateSGPA = function() {
  const tbody = document.getElementById('subjects-tbody');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  if (rows.length === 0) {
    showToast('Please add at least one subject row.', 'error');
    return;
  }

  let totalCredits      = 0;
  let totalCreditPoints = 0;

  let breakdownHtml = `
    <table class="sgpa-grade-table" style="margin-top:16px;">
      <thead><tr>
        <th>Subject</th><th>Credits</th><th>Expected %</th><th>Grade</th><th>Grade Points</th><th>Credit × Points</th>
      </tr></thead>
      <tbody>`;

  let hasError = false;

  rows.forEach(row => {
    const id      = row.id.replace('row-', '');
    const name    = document.getElementById(`subj-name-${id}`)?.value.trim() || `Subject ${id}`;
    const credits = parseFloat(document.getElementById(`subj-credits-${id}`)?.value);
    const marks   = parseFloat(document.getElementById(`subj-marks-${id}`)?.value);

    if (isNaN(credits) || credits < 0) {
      showToast(`Invalid credits for "${name}". Must be 0 or greater.`, 'error');
      hasError = true;
      return;
    }

    if (isNaN(marks) || marks < 0 || marks > 100) {
      showToast(`Enter valid percentage (0–100) for "${name}".`, 'error');
      hasError = true;
      return;
    }

    const { grade, points } = getGradeInfo(marks);
    const isNc = credits === 0;
    const creditPoints = credits * points;

    if (!isNc) {
      totalCredits      += credits;
      totalCreditPoints += creditPoints;
    }

    breakdownHtml += `
      <tr>
        <td style="text-align:left; font-weight:500;">${escapeHtml(name)}</td>
        <td>${credits === 0 ? '0 (NC)' : credits}</td>
        <td>${marks}%</td>
        <td><strong>${grade}</strong></td>
        <td>${points}</td>
        <td style="font-weight:600;">${credits === 0 ? '— (Audit)' : creditPoints}</td>
      </tr>`;
  });

  if (hasError) return;
  if (totalCredits === 0) {
    showToast('Add at least one credit-bearing course to calculate SGPA.', 'error');
    return;
  }

  const rawSGPA = totalCreditPoints / totalCredits;
  const sgpa    = rawSGPA.toFixed(2);

  breakdownHtml += `
      <tr style="background:#F9FAFB; font-weight:700;">
        <td style="text-align:left;">TOTAL</td>
        <td>${totalCredits}</td>
        <td>—</td>
        <td>—</td>
        <td>—</td>
        <td>${totalCreditPoints}</td>
      </tr>
    </tbody>
  </table>
  <div style="margin-top:12px; font-size:12px; color:var(--color-text-muted); text-align:right;">
    Formula applied: SGPA = ${totalCreditPoints} ÷ ${totalCredits} = <strong>${sgpa}</strong>
  </div>`;

  // Render Result
  const resultCard = document.getElementById('sgpa-result');
  const valEl      = document.getElementById('sgpa-value');
  const gradeEl    = document.getElementById('sgpa-result-grade');
  const bdownEl    = document.getElementById('sgpa-breakdown');

  if (valEl)   valEl.textContent   = sgpa;
  if (bdownEl) bdownEl.innerHTML   = breakdownHtml;

  if (gradeEl) {
    const num = parseFloat(sgpa);
    if (num >= 9.0) gradeEl.textContent = 'Outstanding Performance (First Division with Honours tier)';
    else if (num >= 8.0) gradeEl.textContent = 'Excellent Academic Standing (First Division tier)';
    else if (num >= 6.5) gradeEl.textContent = 'Good Standing (First Division tier)';
    else if (num >= 5.0) gradeEl.textContent = 'Pass Division tier';
    else gradeEl.textContent = 'At risk — focus on high credit subjects';
  }

  if (resultCard) {
    resultCard.classList.add('visible');
    resultCard.scrollIntoView({ behavior: 'smooth' });
  }
};

// ─── MODE B: LOAD ACADEMIC SIGNALS ────────────────────────────
async function loadModeBMetrics() {
  try {
    // 1. Progress Doc for AKTU
    const progRef  = doc(db, 'users', currentUser.uid, 'roadmap', 'progress_aktu');
    let progSnap   = await getDoc(progRef);
    if (!progSnap.exists()) {
      const legRef = doc(db, 'users', currentUser.uid, 'roadmap', 'progress');
      progSnap     = await getDoc(legRef);
    }
    userProgress = progSnap.exists() ? (progSnap.data().completedTopics || {}) : {};

    // Calculate syllabus %
    const subjects = SYLLABUS[currentSemester] || SYLLABUS[3] || [];
    let totalTopics = 0;
    let doneTopics  = 0;

    subjects.forEach(sub => {
      (sub.units || []).forEach(unit => {
        (unit.topics || []).forEach(topic => {
          totalTopics++;
          const k = `${sub.code}_${unit.id}_${topic.id}`;
          if (userProgress[k]) doneTopics++;
        });
      });
    });

    const sylPct = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;
    const sylEl  = document.getElementById('signal-syllabus-pct');
    const sylSub = document.getElementById('signal-syllabus-sub');
    if (sylEl)  sylEl.textContent  = `${sylPct}%`;
    if (sylSub) sylSub.textContent = `${doneTopics} of ${totalTopics} topics completed`;

    // 2. Practice Tests
    const tQuery = query(collection(db, 'tests'), where('userId', '==', currentUser.uid));
    const tSnap  = await getDocs(tQuery);
    userTests    = [];
    let testScoreSum = 0;

    tSnap.forEach(d => {
      const t = d.data();
      userTests.push(t);
      const pct = t.percentage ?? Math.round(((t.score || 0) / (t.totalQuestions || 1)) * 100);
      testScoreSum += pct;
    });

    const testAvgEl   = document.getElementById('signal-test-avg');
    const testCountEl = document.getElementById('signal-test-count');
    if (userTests.length > 0) {
      const avg = Math.round(testScoreSum / userTests.length);
      if (testAvgEl) testAvgEl.textContent = `${avg}%`;
      if (testCountEl) testCountEl.textContent = `Across ${userTests.length} practice test(s)`;
    } else {
      if (testAvgEl) testAvgEl.textContent = 'None';
      if (testCountEl) testCountEl.textContent = 'No tests logged yet';
    }

    // 3. Study Hours from videos
    const vQuery = query(collection(db, 'videos'), where('userId', '==', currentUser.uid));
    const vSnap  = await getDocs(vQuery);
    let totalSec = 0;
    vSnap.forEach(d => {
      const v = d.data();
      totalSec += (v.watchedSeconds || 0);
    });

    totalStudyMins = Math.floor(totalSec / 60);
    const studyEl = document.getElementById('signal-study-time');
    if (studyEl) {
      const hours = (totalStudyMins / 60).toFixed(1);
      studyEl.textContent = `${hours}h`;
    }

  } catch (err) {
    console.warn('Error loading academic signals for Mode B:', err);
  }
}

// ─── MODE B: RUN PROGRESS ESTIMATION ──────────────────────────
window.runProgressEstimation = function() {
  const subjects = SYLLABUS[currentSemester] || SYLLABUS[3] || [];
  if (subjects.length === 0) {
    showToast('No syllabus subjects found for this semester.', 'error');
    return;
  }

  // 1. Calculate Syllabus coverage
  let totalTopics = 0;
  let doneTopics  = 0;
  const subjectProgress = {}; // { code: { name, credits, done, total } }

  subjects.forEach(sub => {
    let sDone = 0;
    let sTotal = 0;
    (sub.units || []).forEach(u => {
      (u.topics || []).forEach(t => {
        totalTopics++;
        sTotal++;
        const k = `${sub.code}_${u.id}_${t.id}`;
        if (userProgress[k]) {
          doneTopics++;
          sDone++;
        }
      });
    });
    subjectProgress[sub.code] = {
      name: sub.name,
      credits: sub.credits || 4,
      done: sDone,
      total: sTotal,
      pct: sTotal > 0 ? Math.round((sDone / sTotal) * 100) : 0
    };
  });

  const syllabusPct = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;

  // 2. Practice test metrics
  let testScoreSum = 0;
  userTests.forEach(t => {
    const pct = t.percentage ?? Math.round(((t.score || 0) / (t.totalQuestions || 1)) * 100);
    testScoreSum += pct;
  });
  const hasTests = userTests.length > 0;
  const testAvg  = hasTests ? Math.round(testScoreSum / userTests.length) : null;

  // 3. User optional inputs
  const sessionalInput = parseFloat(document.getElementById('input-sessional-avg')?.value);
  const hasSessional   = !isNaN(sessionalInput) && sessionalInput >= 0 && sessionalInput <= 100;
  const sessionalVal   = hasSessional ? sessionalInput : null;

  const examDaysInput  = parseInt(document.getElementById('input-exam-days')?.value, 10);
  const examDays       = !isNaN(examDaysInput) && examDaysInput > 0 ? examDaysInput : null;

  // 4. Multi-Factor Preparation Index (0 - 100)
  // We do NOT treat syllabus checkmarks as raw SGPA.
  // Tests & Sessionals provide rigorous performance evidence; syllabus completion provides coverage baseline.
  let prepIndex = 0;
  let confidence = 'Low Confidence';
  let badgeClass = 'badge-yellow';
  let limitationText = '';

  if (hasSessional && hasTests) {
    prepIndex = Math.round((sessionalVal * 0.40) + (testAvg * 0.35) + (syllabusPct * 0.25));
    confidence = userTests.length >= 3 ? 'High Confidence' : 'Medium-High Confidence';
    badgeClass = 'badge-green';
    limitationText = 'Grounded in empirical practice test scores, sessional exam data, and syllabus tracking.';
  } else if (hasTests) {
    prepIndex = Math.round((testAvg * 0.60) + (syllabusPct * 0.40));
    confidence = userTests.length >= 2 ? 'Medium Confidence' : 'Moderate Confidence';
    badgeClass = 'badge-blue';
    limitationText = 'Based on practice test performance and syllabus coverage. Entering sessional marks will sharpen accuracy.';
  } else if (hasSessional) {
    prepIndex = Math.round((sessionalVal * 0.70) + (syllabusPct * 0.30));
    confidence = 'Medium Confidence';
    badgeClass = 'badge-blue';
    limitationText = 'Based on sessional inputs and syllabus completion. Take Practice Tests in StudyPilot to validate exam readiness.';
  } else {
    // Only syllabus checkmarks available
    prepIndex = Math.round(syllabusPct * 0.70 + Math.min(30, (totalStudyMins / 60) * 3));
    confidence = 'Low Confidence (Preparation Baseline)';
    badgeClass = 'badge-gray';
    limitationText = 'Notice: No practice test scores or sessional marks logged. This estimate is purely an activity baseline. Take a Practice Test to get a validated score estimate.';
  }

  // 5. Predict Range
  let sgpaLow  = 0;
  let sgpaHigh = 0;

  if (prepIndex >= 90)      { sgpaLow = 8.8; sgpaHigh = 9.5; }
  else if (prepIndex >= 80) { sgpaLow = 8.0; sgpaHigh = 8.7; }
  else if (prepIndex >= 70) { sgpaLow = 7.3; sgpaHigh = 7.9; }
  else if (prepIndex >= 60) { sgpaLow = 6.5; sgpaHigh = 7.2; }
  else if (prepIndex >= 50) { sgpaLow = 5.6; sgpaHigh = 6.4; }
  else if (prepIndex >= 40) { sgpaLow = 4.8; sgpaHigh = 5.5; }
  else                      { sgpaLow = 3.8; sgpaHigh = 4.7; }

  // Adjust for upcoming exam timeline
  if (examDays !== null && examDays < 14 && prepIndex < 60) {
    limitationText += ` ⚠️ Exam is in ${examDays} days — immediate revision required for high-credit subjects.`;
  }

  // 6. Render Output Card
  const resultCard = document.getElementById('progress-estimate-result');
  const rangeEl    = document.getElementById('estimate-range-val');
  const badgeEl    = document.getElementById('estimate-confidence-badge');
  const prepEl     = document.getElementById('estimate-prep-index');
  const limitEl    = document.getElementById('estimate-limitations-text');
  const listEl     = document.getElementById('subject-readiness-list');
  const prioEl     = document.getElementById('priority-topics-list');

  if (rangeEl) rangeEl.textContent = `${sgpaLow.toFixed(1)} – ${sgpaHigh.toFixed(1)}`;
  if (badgeEl) {
    badgeEl.textContent = confidence;
    badgeEl.className   = `badge ${badgeClass}`;
  }
  if (prepEl)  prepEl.textContent  = `${prepIndex}%`;
  if (limitEl) limitEl.textContent = limitationText;

  // Render subject readiness rows
  if (listEl) {
    listEl.innerHTML = Object.values(subjectProgress).map(sp => {
      let statusTag = '';
      if (sp.pct >= 75) statusTag = `<span class="badge badge-green">Ready (${sp.pct}%)</span>`;
      else if (sp.pct >= 40) statusTag = `<span class="badge badge-blue">In Progress (${sp.pct}%)</span>`;
      else statusTag = `<span class="badge badge-red">Needs Attention (${sp.pct}%)</span>`;

      return `
      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--color-surface); padding:8px 12px; border:1px solid var(--color-border); border-radius:var(--radius-sm); font-size:var(--font-size-sm);">
        <div>
          <strong>${escapeHtml(sp.name)}</strong>
          <span class="text-xs text-muted" style="margin-left:6px;">(${sp.credits} Credits • ${sp.done}/${sp.total} topics)</span>
        </div>
        ${statusTag}
      </div>`;
    }).join('');
  }

  // High-yield priority revision topics (from subjects with low completion or low test scores)
  if (prioEl) {
    const incompleteTopics = [];
    subjects.forEach(sub => {
      const sp = subjectProgress[sub.code];
      if (sp && sp.pct < 70) {
        (sub.units || []).forEach(u => {
          (u.topics || []).forEach(t => {
            const k = `${sub.code}_${u.id}_${t.id}`;
            if (!userProgress[k] && incompleteTopics.length < 5) {
              incompleteTopics.push({ subject: sub.name, topic: t.name, unit: u.name });
            }
          });
        });
      }
    });

    if (incompleteTopics.length > 0) {
      prioEl.innerHTML = incompleteTopics.map(item => `
        <li>
          <strong>${escapeHtml(item.subject)}:</strong> ${escapeHtml(item.topic)}
          <span class="text-xs text-muted">(${escapeHtml(item.unit)})</span>
        </li>
      `).join('');
    } else {
      prioEl.innerHTML = `<li>All identified semester topics are completed. Take comprehensive practice tests to maintain exam sharpness.</li>`;
    }
  }

  if (resultCard) {
    resultCard.style.display = 'block';
    resultCard.scrollIntoView({ behavior: 'smooth' });
  }
};

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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
