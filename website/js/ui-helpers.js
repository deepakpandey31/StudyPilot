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

// ES Module exports for compatibility when imported
export {
  showToast,
  formatDuration,
  formatDate,
  formatTimestamp,
  setActive,
  setButtonLoading,
  debounce,
  closeModal
};

