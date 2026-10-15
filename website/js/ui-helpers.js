/* ============================================================
   ui-helpers.js  — Small reusable UI utility functions.
   Loaded as a regular <script> (NOT a module) so that any page
   can call these functions without importing.

   WHAT'S IN HERE:
   - showToast(message, type) — displays a temporary notification
   - formatDuration(seconds)  — converts seconds to "1h 23m" string
   - formatDate(timestamp)    — converts timestamp to readable date
   - setActive(linkId)        — marks a sidebar link as active
   ============================================================ */

/* ─── TOAST NOTIFICATION SYSTEM ─────────────────────────────
   Usage: showToast('Video saved!', 'success')
   Type can be: 'success', 'error', 'warning', or omit for default dark.
   The toast disappears automatically after 3 seconds.
   ─────────────────────────────────────────────────────────── */
function showToast(message, type = '') {
  // Create the container if it doesn't already exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  // Create the toast element
  const toast = document.createElement('div');
  toast.className = 'toast' + (type ? ' ' + type : '');
  toast.textContent = message;

  container.appendChild(toast);

  // Remove the toast after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 320);
  }, 3000);
}

/* ─── FORMAT DURATION ────────────────────────────────────────
   Converts a number of seconds into a human-readable string.
   Examples:
     formatDuration(90)    → "1m 30s"
     formatDuration(3720)  → "1h 2m"
     formatDuration(45)    → "45s"
   ─────────────────────────────────────────────────────────── */
function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) return '0s';

  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs    = Math.floor(totalSeconds % 60);

  if (hours > 0)    return `${hours}h ${minutes}m`;
  if (minutes > 0)  return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

/* ─── FORMAT MINUTES ─────────────────────────────────────────
   Like formatDuration but input is minutes.
   formatMinutes(90) → "1h 30m"
   ─────────────────────────────────────────────────────────── */
function formatMinutes(totalMinutes) {
  if (!totalMinutes || totalMinutes < 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const mins  = Math.floor(totalMinutes % 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/* ─── FORMAT DATE ────────────────────────────────────────────
   Converts a JS Date or Firestore Timestamp to a readable string.
   Examples:
     formatDate(new Date())     → "14 Oct 2026"
     formatDate(firestoreTS)    → "14 Oct 2026"
   ─────────────────────────────────────────────────────────── */
function formatDate(dateInput) {
  if (!dateInput) return '';

  let date;
  // Firestore Timestamps have a .toDate() method
  if (typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date(dateInput);
  }

  return date.toLocaleDateString('en-IN', {
    day:   'numeric',
    month: 'short',
    year:  'numeric'
  });
}

/* ─── GET TODAY'S DATE STRING ─────────────────────────────────
   Returns today's date as "YYYY-MM-DD" — used as a key in Firestore
   for storing per-day activity (e.g., "2026-10-14").
   ─────────────────────────────────────────────────────────── */
function getTodayKey() {
  const now = new Date();
  const y   = now.getFullYear();
  const m   = String(now.getMonth() + 1).padStart(2, '0');  // month is 0-indexed
  const d   = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/* ─── MARK ACTIVE SIDEBAR LINK ───────────────────────────────
   Call this on every dashboard page to highlight the correct
   sidebar link.
   Usage: setActiveSidebarLink('nav-dashboard')
   ─────────────────────────────────────────────────────────── */
function setActiveSidebarLink(linkId) {
  // Remove 'active' from all sidebar links
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active');
  });

  // Add 'active' to the specified link
  const activeLink = document.getElementById(linkId);
  if (activeLink) activeLink.classList.add('active');
}

/* ─── SIDEBAR MOBILE TOGGLE ──────────────────────────────────
   Toggles sidebar open/closed on mobile screens.
   ─────────────────────────────────────────────────────────── */
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('open');
  }
}

/* ─── CALCULATE PERCENTAGE ───────────────────────────────────
   Safe division: returns 0 if denominator is 0.
   ─────────────────────────────────────────────────────────── */
function calcPercent(part, total) {
  if (!total || total === 0) return 0;
  return Math.round((part / total) * 100);
}

/* ─── USER INITIALS (for avatar) ─────────────────────────────
   getInitials("Arjun Sharma") → "AS"
   ─────────────────────────────────────────────────────────── */
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

/* ─── CLAMP A NUMBER ─────────────────────────────────────────
   clamp(150, 0, 100) → 100   (keeps value between min and max)
   ─────────────────────────────────────────────────────────── */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/* ─── DEBOUNCE ───────────────────────────────────────────────
   Prevents a function from firing too often.
   Example: debounce(saveToFirestore, 800) will only call
   saveToFirestore after the user stops typing for 800ms.
   ─────────────────────────────────────────────────────────── */
function debounce(fn, delayMs) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delayMs);
  };
}

// ─── INSTANT SIDEBAR USER RENDERER ────────────────────────────
// Runs automatically on every page to prevent "Loading…" flash
(function() {
  function renderCachedSidebar() {
    try {
      const name  = localStorage.getItem('studypilot_user_name') || 'Student';
      const email = localStorage.getItem('studypilot_user_email') || '';
      const av    = document.getElementById('sidebar-avatar');
      const nm    = document.getElementById('sidebar-name');
      const em    = document.getElementById('sidebar-email');
      if (av && (!av.textContent || av.textContent === '?')) {
        av.textContent = (name.charAt(0) || 'S').toUpperCase();
      }
      if (nm && (!nm.textContent || nm.textContent.includes('Loading') || nm.textContent === 'Loading…')) {
        nm.textContent = name;
      }
      if (em && !em.textContent && email) {
        em.textContent = email;
      }
    } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderCachedSidebar);
  } else {
    renderCachedSidebar();
  }
})();

function closeModal(modalId) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active', 'visible', 'open');
  }
}
window.closeModal = closeModal;

// ─── INTERACTIVE EXTENSION SETUP MODAL (100% Free 30s Setup) ─
function openExtensionSetupModal() {
  let modal = document.getElementById('extension-setup-modal-overlay');
  const isPagesDir = window.location.pathname.includes('/pages/');
  const zipUrl = isPagesDir ? '../downloads/StudyPilot-Extension.zip' : 'downloads/StudyPilot-Extension.zip';

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'extension-setup-modal-overlay';
    modal.className = 'domain-modal-overlay';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px;';

    modal.innerHTML = `
      <div class="card domain-modal-card" style="max-width:520px; width:100%; padding:22px; position:relative; max-height:92vh; overflow-y:auto; background:var(--color-surface); border-radius:var(--radius-md); box-shadow:0 12px 36px rgba(0,0,0,0.2);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:24px;">🧩</span>
            <div>
              <div style="font-size:16px; font-weight:700; color:var(--color-text);">Add Chrome Extension</div>
              <div style="font-size:12px; color:var(--color-text-muted);">100% Free • Works in 30 Seconds</div>
            </div>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" onclick="closeExtensionSetupModal()" style="font-size:18px; padding:2px 8px; line-height:1;">✕</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px;">
          <!-- Step 1 -->
          <div style="background:var(--color-bg); border:1px solid var(--color-border); border-radius:var(--radius-sm); padding:12px 14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <div>
                <strong style="font-size:13px; color:var(--color-text);">Step 1: Download Extension</strong>
                <div style="font-size:11px; color:var(--color-text-muted);">Pre-built package (17 KB)</div>
              </div>
              <a href="${zipUrl}" download class="btn btn-primary btn-sm" style="display:inline-flex; align-items:center; gap:6px; font-size:12px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download ZIP
              </a>
            </div>
          </div>

          <!-- Step 2 -->
          <div style="background:var(--color-bg); border:1px solid var(--color-border); border-radius:var(--radius-sm); padding:12px 14px;">
            <strong style="font-size:13px; color:var(--color-text);">Step 2: Unzip (Extract)</strong>
            <div style="font-size:12px; color:var(--color-text-muted); margin-top:3px; line-height:1.5;">
              In your <strong>Downloads</strong> folder &rarr; Right click <code>StudyPilot-Extension.zip</code> &rarr; Click <strong>"Extract All"</strong> (or Unzip).
            </div>
          </div>

          <!-- Step 3 -->
          <div style="background:var(--color-bg); border:1px solid var(--color-border); border-radius:var(--radius-sm); padding:12px 14px;">
            <strong style="font-size:13px; color:var(--color-text);">Step 3: Load into Google Chrome</strong>
            <div style="margin-top:6px; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span style="font-size:12px; color:var(--color-text);">1. Open URL:</span>
              <code style="background:#E2E8F0; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600;">chrome://extensions</code>
              <button type="button" class="btn btn-ghost btn-xs" id="copy-chrome-url-btn" onclick="copyChromeExtensionsUrl()" style="font-size:11px; padding:2px 6px;">Copy URL</button>
            </div>
            <div style="font-size:12px; color:var(--color-text); margin-top:6px; line-height:1.6;">
              2. Turn <strong>ON</strong> <span style="background:#EFF6FF; color:#1D4ED8; padding:1px 5px; border-radius:3px; font-weight:600;">Developer mode</span> (top-right toggle).<br/>
              3. Click <span style="background:#F1F5F9; padding:1px 5px; border-radius:3px; font-weight:600;">Load unpacked</span> (top-left) & select the unzipped <code>extension</code> folder!
            </div>
          </div>

          <!-- Live Connection Test -->
          <div id="ext-modal-status-box" style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:var(--radius-sm); padding:12px 14px; text-align:center;">
            <div id="ext-modal-status-text" style="font-size:13px; font-weight:600; color:#166534; margin-bottom:6px;">
              ${window.__studypilot_extension_connected ? '✓ Extension Connected & Active!' : 'Once loaded in Chrome, verify connection:'}
            </div>
            <button type="button" class="btn btn-primary btn-sm" onclick="testModalExtensionConnection()">
              ⚡ Test Connection
            </button>
          </div>
        </div>

        <div style="margin-top:14px; text-align:center;">
          <button type="button" class="btn btn-ghost btn-sm" onclick="closeExtensionSetupModal()">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
}

function closeExtensionSetupModal() {
  const modal = document.getElementById('extension-setup-modal-overlay');
  if (modal) modal.style.display = 'none';
}
window.openExtensionSetupModal = openExtensionSetupModal;
window.closeExtensionSetupModal = closeExtensionSetupModal;

function copyChromeExtensionsUrl() {
  navigator.clipboard.writeText('chrome://extensions').then(() => {
    const btn = document.getElementById('copy-chrome-url-btn');
    if (btn) btn.textContent = '✓ Copied!';
    showToast('Copied "chrome://extensions" — paste it into your browser address bar!', 'success');
    setTimeout(() => {
      if (btn) btn.textContent = 'Copy URL';
    }, 2500);
  });
}
window.copyChromeExtensionsUrl = copyChromeExtensionsUrl;

function testModalExtensionConnection() {
  window.postMessage({ type: 'STUDYPILOT_PING' }, '*');
  const box = document.getElementById('ext-modal-status-box');
  const txt = document.getElementById('ext-modal-status-text');

  setTimeout(() => {
    if (window.__studypilot_extension_connected) {
      if (box) { box.style.background = '#DCFCE7'; box.style.borderColor = '#86EFAC'; }
      if (txt) { txt.style.color = '#15803D'; txt.textContent = '🎉 Extension Connected Successfully!'; }
      showToast('StudyPilot Extension detected & connected!', 'success');
    } else {
      if (txt) { txt.style.color = '#92400E'; txt.textContent = '⏳ Not detected yet. Make sure you turned Developer mode ON and loaded the folder in chrome://extensions.'; }
      showToast('Extension not detected yet. Check chrome://extensions', 'warning');
    }
  }, 350);
}
window.testModalExtensionConnection = testModalExtensionConnection;

// Global window attachments
window.showToast = showToast;
window.formatDuration = formatDuration;
window.formatMinutes = formatMinutes;
window.formatDate = formatDate;
window.getTodayKey = getTodayKey;
window.setActiveSidebarLink = setActiveSidebarLink;
window.toggleSidebar = toggleSidebar;
window.calcPercent = calcPercent;
window.getInitials = getInitials;
window.clamp = clamp;
window.debounce = debounce;
window.closeModal = closeModal;
window.openExtensionSetupModal = openExtensionSetupModal;
window.closeExtensionSetupModal = closeExtensionSetupModal;
window.copyChromeExtensionsUrl = copyChromeExtensionsUrl;
window.testModalExtensionConnection = testModalExtensionConnection;



