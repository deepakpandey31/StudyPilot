/* ============================================================
   dashboard.js — Loads real user data from Firestore and
                  renders the dashboard stats, charts, and lists.

   WHAT THIS FILE DOES:
   1. Checks the user is logged in (auth guard).
   2. Loads the user's profile from Firestore.
   3. Loads today's study activity.
   4. Loads this week's study data for the bar chart.
   5. Loads recently tracked videos.
   6. Loads subject progress from the roadmap.
   7. Loads pending to-do tasks.
   8. Handles the daily goal save.

   DATA FLOW:
   Firebase Auth → get user UID → query Firestore collections
   → render data into HTML elements.
   ============================================================ */

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, setDoc, collection,
  query, where, orderBy, limit,
  getDocs, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { syncExtensionData } from './sync.js';
import { initDomains, getActiveDomain, getActiveDomainId, updateCustomDomain } from './domain-manager.js';
import { getDomainRoadmap } from './syllabus-data.js';

let currentLoggedInUser = null;

// ─── AUTH GUARD ───────────────────────────────────────────────
// Listen for auth state. If no user is signed in, go back to home.
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = '../index.html';
    return;
  }
  currentLoggedInUser = user;
  // Initialize multi-domain architecture
  await initDomains(user);

  // User is logged in — load the dashboard
  await initDashboard(user);
});

// Listen for domain switches
window.addEventListener('studypilot-domain-changed', async () => {
  if (currentLoggedInUser) {
    await initDashboard(currentLoggedInUser);
  }
});

// Real-time live listener for background sync from extension
window.addEventListener('studypilot-extension-synced', async (e) => {
  if (currentLoggedInUser) {
    console.log('[StudyPilot AI] Extension sync event received. Refreshing dashboard data…');
    await Promise.all([
      loadRecentVideos(currentLoggedInUser.uid),
      loadTodayActivity(currentLoggedInUser.uid),
      loadWeeklyActivity(currentLoggedInUser.uid),
      loadSubjectProgress(currentLoggedInUser.uid)
    ]);
  }
});

// ─── MAIN INIT FUNCTION ───────────────────────────────────────
async function initDashboard(user) {
  try {
    // Update sidebar user info
    renderUserInfo(user);

    // Set greeting and date
    renderGreeting(user.displayName || 'Student');

    // Attempt sync from Chrome extension if installed
    try {
      const syncRes = await syncExtensionData(user);
      if (syncRes && syncRes.status === 'synced' && syncRes.count > 0) {
        showToast(`✓ Extension synced ${syncRes.videosCount || syncRes.count} video(s).`, 'success');
      }
    } catch (syncErr) {
      console.log('Extension sync skipped:', syncErr);
    }

    // Load all sections in parallel for speed
    // Promise.all runs all these at the same time instead of one by one
    await Promise.all([
      loadUserProfile(user),
      loadTodayActivity(user.uid),
      loadWeeklyActivity(user.uid),
      loadRecentVideos(user.uid),
      loadSubjectProgress(user.uid),
      loadPendingTodos(user.uid)
    ]);

  } catch (err) {
    console.error('Dashboard init error:', err);
    showToast('Some data failed to load. Check your internet connection.', 'error');
  }
}

// ─── USER INFO IN SIDEBAR ─────────────────────────────────────
function renderUserInfo(user) {
  const name    = user.displayName || 'Student';
  const email   = user.email || '';
  const initials = getInitials(name);

  const avatarEl = document.getElementById('sidebar-avatar');
  const nameEl   = document.getElementById('sidebar-name');
  const emailEl  = document.getElementById('sidebar-email');

  if (avatarEl) avatarEl.textContent = initials;
  if (nameEl)   nameEl.textContent   = name;
  if (emailEl)  emailEl.textContent  = email;
}

// ─── GREETING TEXT ────────────────────────────────────────────
function renderGreeting(name) {
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  if (hour >= 17)               greeting = 'Good evening';

  const el = document.getElementById('greeting-text');
  if (el) el.textContent = `${greeting}, ${name.split(' ')[0]}!`;

  const dateEl = document.getElementById('today-date');
  if (dateEl) dateEl.textContent = formatDate(new Date());
}

// ─── LOAD USER PROFILE (for daily goal) ───────────────────────
async function loadUserProfile(user) {
  const profileRef = doc(db, 'users', user.uid);
  const snap       = await getDoc(profileRef);

  let goalMinutes = 60;  // default

  if (snap.exists()) {
    const data = snap.data();
    goalMinutes = data.dailyGoalMin || 60;
  }

  // Pre-fill the goal input
  const goalInput = document.getElementById('goal-input');
  if (goalInput) goalInput.value = goalMinutes;

  // Store on window so other functions can read it
  window._userGoalMinutes = goalMinutes;
  window._userId          = user.uid;
}

// ─── TODAY'S STUDY ACTIVITY ───────────────────────────────────
// We look for a document in the "dailyActivity" collection
// keyed by `userId_YYYY-MM-DD`
async function loadTodayActivity(uid) {
  const todayKey = getTodayKey();            // e.g. "2026-10-14"
  const docId    = `${uid}_${todayKey}`;     // e.g. "abc123_2026-10-14"

  let studiedMinutes = 0;
  try {
    const actRef = doc(db, 'dailyActivity', docId);
    const snap   = await getDoc(actRef);
    if (snap.exists()) {
      studiedMinutes = snap.data().totalMinutes || 0;
    }
  } catch (err) {
    console.warn('Daily activity load note:', err);
  }

  // Resilient fallback to local storage synced minutes if Firestore returns 0
  if (!studiedMinutes) {
    try {
      const localMin = parseInt(localStorage.getItem('studypilot_today_minutes'), 10);
      if (!isNaN(localMin) && localMin > 0) {
        studiedMinutes = localMin;
      }
    } catch (e) {}
  }

  const goalMin = window._userGoalMinutes || 60;

  // Update stat card
  const todayTimeEl = document.getElementById('stat-today-time');
  const todayGoalEl = document.getElementById('stat-today-goal');
  if (todayTimeEl) todayTimeEl.textContent = formatMinutes(studiedMinutes);
  if (todayGoalEl) todayGoalEl.textContent = `Goal: ${formatMinutes(goalMin)}`;

  // Update goal progress bar
  const pct     = clamp(calcPercent(studiedMinutes, goalMin), 0, 100);
  const barEl   = document.getElementById('goal-progress-bar');
  const textEl  = document.getElementById('goal-progress-text');
  if (barEl)  barEl.style.width = `${pct}%`;
  if (textEl) textEl.textContent = `${studiedMinutes} min of ${goalMin} min`;

  // Store for other functions
  window._todayStudiedMinutes = studiedMinutes;
}

// ─── WEEKLY ACTIVITY DATA (for bar chart) ─────────────────────
// Reads the last 7 days of dailyActivity documents
async function loadWeeklyActivity(uid) {
  // Build list of last 7 day keys: ["2026-10-08", ..., "2026-10-14"]
  const days = getLast7Days();

  // Fetch all 7 documents in parallel
  const promises = days.map(day => {
    const docId = `${uid}_${day}`;
    return getDoc(doc(db, 'dailyActivity', docId));
  });
  const snaps = await Promise.all(promises);

  const labels  = days.map(d => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  });
  const values  = snaps.map(snap => snap.exists() ? (snap.data().totalMinutes || 0) : 0);

  // Total week time
  const weekTotal = values.reduce((sum, v) => sum + v, 0);
  const weekEl    = document.getElementById('stat-week-time');
  if (weekEl) weekEl.textContent = formatMinutes(weekTotal);

  // Draw Chart.js bar chart
  drawWeeklyChart(labels, values);
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${day}`);
  }
  return days;
}

// ─── CHART.JS BAR CHART ───────────────────────────────────────
function drawWeeklyChart(labels, values) {
  const canvas = document.getElementById('weeklyChart');
  if (!canvas) return;

  // Destroy previous chart instance if it exists (for re-renders)
  if (window._weeklyChart) window._weeklyChart.destroy();

  window._weeklyChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Minutes studied',
        data: values,
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        borderColor:     'rgba(37, 99, 235, 0.8)',
        borderWidth:     1.5,
        borderRadius:    4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y} min`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            font: { family: 'Inter', size: 11 },
            color: '#9CA3AF',
            callback: (v) => `${v}m`
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Inter', size: 11 },
            color: '#9CA3AF'
          }
        }
      }
    }
  });
}

// ─── RECENT VIDEOS ────────────────────────────────────────────
// Reads the `videos` collection for this user, filtered by active domain
async function loadRecentVideos(uid) {
  const listEl = document.getElementById('recent-videos-list');
  const noEl   = document.getElementById('no-videos-msg');
  if (!listEl) return;

  const currentDomainId = getActiveDomainId();

  const allVideos = [];
  try {
    const q = query(
      collection(db, 'videos'),
      where('userId', '==', uid)
    );
    const snap = await getDocs(q);
    snap.forEach(docSnap => {
      allVideos.push({ id: docSnap.id, ...docSnap.data() });
    });
  } catch (err) {
    console.warn('Firestore video query note:', err);
  }

  // Resiliently merge from local synced videos cache
  try {
    const localRaw = localStorage.getItem('studypilot_synced_videos');
    if (localRaw) {
      const localMap = JSON.parse(localRaw);
      Object.entries(localMap).forEach(([vid, v]) => {
        const alreadyInList = allVideos.some(x => (x.videoId === vid || x.id === `${uid}_${vid}`));
        if (!alreadyInList) {
          allVideos.push({ id: `${uid}_${vid}`, ...v });
        }
      });
    }
  } catch (lsErr) {
    console.warn('LocalStorage video merge note:', lsErr);
  }

  // Update total video stats for this domain
  await loadVideoStats(uid);

  // Filter by domain (backward compatible: missing domainId belongs to 'aktu')
  const domainVideos = allVideos.filter(v => (v.domainId || 'aktu') === currentDomainId);

  if (domainVideos.length === 0) {
    if (noEl) noEl.classList.remove('hidden');
    listEl.innerHTML = `
      <div class="empty-state" id="no-videos-msg">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
        <p>No videos tracked in ${escapeHtml(getActiveDomain()?.name || 'this domain')} yet.<br/>Watch a video and assign it to this domain in the extension.</p>
      </div>`;
    return;
  }

  // Sort in-memory by lastWatched descending
  domainVideos.sort((a, b) => {
    const tA = a.lastWatched?.toDate ? a.lastWatched.toDate().getTime() : (new Date(a.lastWatched || 0)).getTime();
    const tB = b.lastWatched?.toDate ? b.lastWatched.toDate().getTime() : (new Date(b.lastWatched || 0)).getTime();
    return tB - tA;
  });

  const recentFive = domainVideos.slice(0, 5);

  if (noEl) noEl.classList.add('hidden');

  // Build HTML for each video
  let html = '';
  recentFive.forEach(v => {
    const totalDuration = v.duration || v.durationSeconds || 1;
    const pct = clamp(calcPercent(v.watchedSeconds || 0, totalDuration), 0, 100);
    const isComplete = v.completed || pct >= 90;

    html += `
      <div class="video-item">
        <div class="video-thumb">
          ${v.thumbnailUrl
            ? `<img src="${escapeHtml(v.thumbnailUrl)}" alt="Thumbnail" loading="lazy" />`
            : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`
          }
        </div>
        <div class="video-info">
          <div class="video-title" title="${escapeHtml(v.title || 'Untitled')}">
            ${escapeHtml(v.title || 'Untitled video')}
          </div>
          <div class="video-meta">
            <span>${escapeHtml(v.subject || 'General')}</span>
            <span>${formatDuration(v.watchedSeconds || 0)} watched</span>
            <span class="badge ${isComplete ? 'badge-green' : 'badge-yellow'}">
              ${isComplete ? 'Done' : pct + '%'}
            </span>
          </div>
        </div>
        <a href="https://youtube.com/watch?v=${escapeHtml(v.videoId)}" target="_blank" rel="noopener"
           class="btn btn-ghost btn-sm" title="Open on YouTube" aria-label="Open ${escapeHtml(v.title || '')} on YouTube">
          ↗
        </a>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

// ─── VIDEO STATS (Domain Aware) ───────────────────────────────
async function loadVideoStats(uid) {
  const currentDomainId = getActiveDomainId();
  const videoList = [];

  try {
    const q    = query(collection(db, 'videos'), where('userId', '==', uid));
    const snap = await getDocs(q);
    snap.forEach(d => videoList.push(d.data()));
  } catch (e) {}

  try {
    const localRaw = localStorage.getItem('studypilot_synced_videos');
    if (localRaw) {
      const localMap = JSON.parse(localRaw);
      Object.values(localMap).forEach(v => {
        if (!videoList.some(x => x.videoId === v.videoId)) videoList.push(v);
      });
    }
  } catch (e) {}

  let total     = 0;
  let completed = 0;
  videoList.forEach(v => {
    if ((v.domainId || 'aktu') === currentDomainId) {
      total++;
      if (v.completed) completed++;
    }
  });

  const totalEl = document.getElementById('stat-videos');
  const doneEl  = document.getElementById('stat-videos-done');
  if (totalEl) totalEl.textContent = total;
  if (doneEl)  doneEl.textContent  = `${completed} completed`;
}

// ─── SUBJECT PROGRESS (Domain & Custom Roadmap Aware) ──────────
async function loadSubjectProgress(uid) {
  const listEl = document.getElementById('subject-progress-list');
  if (!listEl) return;

  const currentDomain = getActiveDomain();
  const domainId = currentDomain.id;

  const profileRef = doc(db, 'users', uid);
  const snap       = await getDoc(profileRef);
  const semester   = snap.exists() ? (snap.data().semester || 3) : 3;

  // Check if user has a customized roadmap for this domain
  let subjects = [];
  try {
    const customMapRef = doc(db, 'users', uid, 'customRoadmaps', domainId);
    const customMapSnap = await getDoc(customMapRef);
    if (customMapSnap.exists() && customMapSnap.data().subjects) {
      subjects = customMapSnap.data().subjects;
    }
  } catch (e) {
    console.warn('Could not check custom roadmap:', e);
  }

  // If no custom roadmap saved, load default domain roadmap
  if (!subjects || subjects.length === 0) {
    subjects = getDomainRoadmap(domainId, semester);
  }

  // Load progress doc for this domain
  let progress = {};
  const progressDocId = domainId === 'aktu' ? 'progress' : `progress_${domainId}`;
  const rSnap = await getDoc(doc(db, 'users', uid, 'roadmap', progressDocId));
  if (rSnap.exists()) {
    progress = rSnap.data().completedTopics || {};
  } else if (domainId === 'aktu') {
    // Check fallback
    const fbSnap = await getDoc(doc(db, 'users', uid, 'roadmap', 'progress_aktu'));
    if (fbSnap.exists()) progress = fbSnap.data().completedTopics || {};
  }

  let totalTopics = 0;
  let completedTopics = 0;
  let subjectRows = '';

  subjects.forEach(subject => {
    let sTotalTopics = 0;
    let sCompletedTopics = 0;

    (subject.units || []).forEach(unit => {
      (unit.topics || []).forEach(topic => {
        sTotalTopics++;
        totalTopics++;
        const key = `${subject.code || 'SUB'}_${unit.id}_${topic.id}`;
        if (progress[key]) {
          sCompletedTopics++;
          completedTopics++;
        }
      });
    });

    const pct = calcPercent(sCompletedTopics, sTotalTopics);
    subjectRows += `
      <div style="margin-bottom: var(--sp-4);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:13px;">
          <span style="font-weight:500;">${escapeHtml(subject.name)}</span>
          <span class="text-muted">${sCompletedTopics}/${sTotalTopics} topics &nbsp; <strong>${pct}%</strong></span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${pct >= 80 ? 'green' : pct >= 40 ? '' : 'yellow'}"
               style="width:${pct}%"></div>
        </div>
      </div>
    `;
  });

  listEl.innerHTML = subjectRows || '<p class="text-muted text-sm">No topics configured in this domain.</p>';

  // Update stat card
  const syllabusEl = document.getElementById('stat-syllabus');
  const topicsEl   = document.getElementById('stat-syllabus-topics');
  const overallPct = calcPercent(completedTopics, totalTopics);
  if (syllabusEl) syllabusEl.textContent = `${overallPct}%`;
  if (topicsEl)   topicsEl.textContent   = `${completedTopics} of ${totalTopics} topics done`;

  // Render domain planner & workload advisory
  renderDomainPlanner(currentDomain, totalTopics, completedTopics);
}

// ─── DOMAIN TARGET PLANNER ADVISORY ───────────────────────────
function renderDomainPlanner(domain, totalTopics, completedTopics) {
  const badgeEl = document.getElementById('domain-badge');
  const nameEl  = document.getElementById('domain-name-display');
  const descEl  = document.getElementById('domain-desc-display');
  const targetEl = document.getElementById('domain-target-display');
  const paceText = document.getElementById('domain-pace-text');
  const warnEl  = document.getElementById('domain-pace-warning');

  if (badgeEl) badgeEl.textContent = domain.shortName || domain.name;
  if (nameEl)  nameEl.textContent  = domain.name;
  if (descEl)  descEl.textContent  = domain.description || `${domain.name} study tracking and roadmap.`;

  const remainingTopics = Math.max(0, totalTopics - completedTopics);
  const targetDateStr = domain.targetDate;

  if (targetDateStr) {
    const targetDate = new Date(targetDateStr);
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (targetEl) targetEl.textContent = `${formatDate(targetDate)} (${diffDays > 0 ? diffDays + ' days left' : 'Due today / overdue'})`;

    if (diffDays > 0 && remainingTopics > 0) {
      const pacePerDay = (remainingTopics / diffDays).toFixed(1);
      // Assuming average 1 topic takes ~1.5 hours of lecture + practice
      const dailyHoursNeeded = ((remainingTopics * 1.5) / diffDays).toFixed(1);
      const availableHours = parseFloat(domain.dailyHours) || 2.0;

      if (paceText) {
        paceText.innerHTML = `
          <strong>${remainingTopics} topics remaining.</strong>
          Pace needed: <strong>${pacePerDay} topics/day</strong> (~${dailyHoursNeeded} hrs/day vs ${availableHours} hrs available).
        `;
      }

      if (warnEl) {
        warnEl.style.display = (parseFloat(dailyHoursNeeded) > availableHours) ? 'block' : 'none';
      }
    } else if (remainingTopics === 0) {
      if (paceText) paceText.innerHTML = `🎉 <strong>All ${totalTopics} topics completed in this domain!</strong> Great job!`;
      if (warnEl) warnEl.style.display = 'none';
    } else {
      if (paceText) paceText.innerHTML = `⚠️ Target date has passed with ${remainingTopics} topics remaining. Please update target date.`;
      if (warnEl) warnEl.style.display = 'block';
    }
  } else {
    if (targetEl) targetEl.textContent = 'No target date set';
    if (paceText) {
      paceText.innerHTML = `
        <strong>${remainingTopics} of ${totalTopics} topics remaining.</strong> Set a target date to calculate your required study pace.
      `;
    }
    if (warnEl) warnEl.style.display = 'none';
  }
}

// ─── OPEN PLANNER EDIT MODAL ──────────────────────────────────
window._studyPilotOpenDomainPlannerEdit = function() {
  const domain = getActiveDomain();
  if (typeof window._studyPilotOpenManageDomain === 'function') {
    window._studyPilotOpenManageDomain(domain.id);
  }
};

// ─── PENDING TO-DO TASKS ──────────────────────────────────────
async function loadPendingTodos(uid) {
  const listEl = document.getElementById('pending-todos-list');
  if (!listEl) return;

  const q = query(
    collection(db, 'todos'),
    where('userId', '==', uid)
  );

  const snap = await getDocs(q);

  const todos = [];
  snap.forEach(docSnap => {
    const t = docSnap.data();
    if (!t.completed) {
      todos.push({ id: docSnap.id, ...t });
    }
  });

  if (todos.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        <p>No pending tasks. <a href="todos.html">Add a task →</a></p>
      </div>`;
    return;
  }

  // Sort: tasks with earlier due dates first, tasks without due dates last
  todos.sort((a, b) => {
    const dA = a.dueDate ? (a.dueDate.toDate ? a.dueDate.toDate().getTime() : new Date(a.dueDate).getTime()) : Infinity;
    const dB = b.dueDate ? (b.dueDate.toDate ? b.dueDate.toDate().getTime() : new Date(b.dueDate).getTime()) : Infinity;
    return dA - dB;
  });

  const pendingFive = todos.slice(0, 5);

  let html = '<ul style="list-style:none; padding:0; margin:0;">';
  pendingFive.forEach(t => {
    const id = t.id;
    let dueText = '';
    if (t.dueDate) {
      const d = t.dueDate.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
      dueText = `Due: ${formatDate(d)}`;
    }
    html += `
      <li style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--color-border);">
        <input type="checkbox" id="todo-${id}"
               onchange="quickCompleteTodo('${id}')"
               style="width:16px;height:16px;accent-color:var(--color-primary);cursor:pointer;"
               aria-label="Complete task: ${escapeHtml(t.title)}" />
        <div style="flex:1; min-width:0;">
          <div style="font-size:13px; font-weight:500;">${escapeHtml(t.title)}</div>
          ${dueText ? `<div class="text-muted text-sm">${dueText}</div>` : ''}
        </div>
      </li>`;
  });
  html += '</ul>';

  listEl.innerHTML = html;
}

// Quick-complete a to-do from dashboard without navigating away
window.quickCompleteTodo = async function(todoId) {
  try {
    await updateDoc(doc(db, 'todos', todoId), {
      completed:   true,
      completedAt: serverTimestamp()
    });
    showToast('Task marked complete!', 'success');
    // Reload the todos list
    if (window._userId) loadPendingTodos(window._userId);
  } catch (err) {
    showToast('Could not update task.', 'error');
  }
};

// ─── SAVE DAILY GOAL ──────────────────────────────────────────
window.saveGoal = async function() {
  const input = document.getElementById('goal-input');
  const uid   = window._userId;
  if (!input || !uid) return;

  const minutes = parseInt(input.value, 10);
  if (isNaN(minutes) || minutes < 10 || minutes > 720) {
    showToast('Please enter a goal between 10 and 720 minutes.', 'error');
    return;
  }

  try {
    await updateDoc(doc(db, 'users', uid), { dailyGoalMin: minutes });
    window._userGoalMinutes = minutes;
    showToast('Daily goal updated!', 'success');
    // Refresh today's progress bar
    await loadTodayActivity(uid);
  } catch (err) {
    showToast('Could not save goal.', 'error');
  }
};

// ─── HELPER: ESCAPE HTML ──────────────────────────────────────
// Prevents XSS: converts < > & etc. to safe HTML entities
// This is important when displaying data that came from user input or external APIs
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── LOGOUT ───────────────────────────────────────────────────
window.handleLogout = async function() {
  try {
    await signOut(auth);
    window.location.href = '../index.html';
  } catch (err) {
    console.error('Logout error:', err);
    showToast('Could not sign out.', 'error');
  }
};

// ─── MANUAL EXTENSION SYNC ────────────────────────────────────
window.handleManualSync = async function() {
  if (!currentLoggedInUser) {
    showToast('Please wait, logging in…', 'info');
    return;
  }

  const btn = document.getElementById('manual-sync-btn');
  const btnText = document.getElementById('manual-sync-btn-text');
  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Syncing…';

  try {
    const res = await syncExtensionData(currentLoggedInUser);
    if (!res || res.status === 'not_connected') {
      showToast('Extension not detected. Make sure StudyPilot AI extension is loaded & enabled in chrome://extensions.', 'error');
    } else if (res.status === 'empty') {
      showToast('Extension connected! But 0 videos tracked yet. Play a YouTube lecture for 10-15 seconds and try again.', 'info');
    } else if (res.status === 'synced') {
      showToast(`✓ Synced ${res.count} records (${res.videosCount || 0} videos) from extension!`, 'success');
      await Promise.all([
        loadRecentVideos(currentLoggedInUser.uid),
        loadTodayActivity(currentLoggedInUser.uid),
        loadWeeklyActivity(currentLoggedInUser.uid)
      ]);
    } else if (res.status === 'error') {
      showToast('Sync error: ' + (res.error || 'Unknown'), 'error');
    }
  } catch (err) {
    console.error('Manual sync error:', err);
    showToast('Sync failed: ' + err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Sync Extension';
  }
};
