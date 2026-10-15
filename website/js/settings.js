/* ============================================================
   settings.js — Profile settings and API key management.
   ============================================================ */

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentUser = null;

// ─── AUTH GUARD ───────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = '../index.html'; return; }
  currentUser = user;
  renderUserInfo(user);
  await loadProfile(user);
  loadGeminiKeyStatus();
  loadExtensionIdStatus();
});

// ─── LOAD PROFILE ─────────────────────────────────────────────
async function loadProfile(user) {
  const profileRef = doc(db, 'users', user.uid);
  const snap       = await getDoc(profileRef);

  if (snap.exists()) {
    const data = snap.data();
    const nameEl     = document.getElementById('set-name');
    const branchEl   = document.getElementById('set-branch');
    const semEl      = document.getElementById('set-semester');
    const goalEl     = document.getElementById('set-goal');

    if (nameEl)   nameEl.value   = data.name     || user.displayName || '';
    if (branchEl) branchEl.value = data.branch   || 'CSE';
    if (semEl)    semEl.value    = String(data.semester   || 3);
    if (goalEl)   goalEl.value   = data.dailyGoalMin || 60;
  } else {
    // Profile doesn't exist yet, prefill from auth
    const nameEl = document.getElementById('set-name');
    if (nameEl) nameEl.value = user.displayName || '';
  }
}

// ─── SAVE PROFILE ─────────────────────────────────────────────
window.saveProfile = async function(event) {
  event.preventDefault();

  const name     = document.getElementById('set-name')?.value.trim();
  const branch   = document.getElementById('set-branch')?.value;
  const semester = parseInt(document.getElementById('set-semester')?.value || '3', 10);
  const goal     = parseInt(document.getElementById('set-goal')?.value || '60', 10);
  const btn      = document.getElementById('profile-save-btn');

  if (!name) { showToast('Please enter your name.', 'error'); return; }

  setButtonLoading(btn, true);

  try {
    // Update Firebase Auth display name
    await updateProfile(currentUser, { displayName: name });

    // Update Firestore profile
    const profileRef = doc(db, 'users', currentUser.uid);
    await setDoc(profileRef, {
      name,
      branch,
      semester,
      dailyGoalMin: goal,
      email: currentUser.email
    }, { merge: true });

    showToast('Profile saved!', 'success');

    // Refresh sidebar avatar initials
    renderUserInfo({ ...currentUser, displayName: name });

  } catch (err) {
    console.error('Save profile error:', err);
    showToast('Could not save profile. Please try again.', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
};

// ─── GEMINI KEY ────────────────────────────────────────────────
function loadGeminiKeyStatus() {
  const key    = localStorage.getItem('gemini_api_key') || '';
  const keyEl  = document.getElementById('gemini-key-input');
  const statEl = document.getElementById('key-status');

  if (key) {
    if (keyEl)  keyEl.value      = key;
    if (statEl) statEl.textContent = '✓ API key is saved in this browser.';
  } else {
    if (statEl) statEl.textContent = 'No API key saved. Tests will use basic mode.';
  }
}

window.saveGeminiKey = function() {
  let key = document.getElementById('gemini-key-input')?.value.trim();
  const statEl = document.getElementById('key-status');

  if (!key) { showToast('Please enter an API key.', 'error'); return; }

  // Remove accidental quotes if copied with quotes
  key = key.replace(/^["']|["']$/g, '').trim();

  if (key.length < 15) {
    showToast('The API key seems too short. Please copy the complete key.', 'error');
    return;
  }

  localStorage.setItem('gemini_api_key', key);
  if (statEl) statEl.textContent = '✓ API key saved in this browser.';
  showToast('Gemini API key saved successfully!', 'success');
};

window.clearGeminiKey = function() {
  localStorage.removeItem('gemini_api_key');
  const keyEl  = document.getElementById('gemini-key-input');
  const statEl = document.getElementById('key-status');
  if (keyEl)  keyEl.value      = '';
  if (statEl) statEl.textContent = 'API key removed. Tests will use basic mode.';
  showToast('API key removed.', 'success');
};

// ─── CHROME EXTENSION ID ───────────────────────────────────────
function loadExtensionIdStatus() {
  const extId  = localStorage.getItem('studypilot_extension_id') || '';
  const extEl  = document.getElementById('extension-id-input');
  const statEl = document.getElementById('ext-status');

  if (extId) {
    if (extEl)  extEl.value        = extId;
    if (statEl) statEl.textContent = `✓ Extension ID saved (${extId.slice(0, 8)}…). Automatic sync active.`;
  } else {
    if (statEl) statEl.textContent = 'No Extension ID set. Sync will be inactive.';
  }
}

window.saveExtensionId = function() {
  const extId  = document.getElementById('extension-id-input')?.value.trim();
  const statEl = document.getElementById('ext-status');

  if (!extId) { showToast('Please enter an Extension ID.', 'error'); return; }

  localStorage.setItem('studypilot_extension_id', extId);
  if (statEl) statEl.textContent = `✓ Extension ID saved (${extId.slice(0, 8)}…). Automatic sync active.`;
  showToast('Extension ID saved!', 'success');
};

window.clearExtensionId = function() {
  localStorage.removeItem('studypilot_extension_id');
  const extEl  = document.getElementById('extension-id-input');
  const statEl = document.getElementById('ext-status');
  if (extEl)  extEl.value        = '';
  if (statEl) statEl.textContent = 'Extension ID removed.';
  showToast('Extension ID removed.', 'success');
};

// ─── SIDEBAR & LOGOUT ─────────────────────────────────────────
function renderUserInfo(user) {
  const name = user.displayName || 'Student';
  const av   = document.getElementById('sidebar-avatar');
  const nm   = document.getElementById('sidebar-name');
  const em   = document.getElementById('sidebar-email');
  if (av) av.textContent = getInitials(name);
  if (nm) nm.textContent = name;
  if (em) em.textContent = user.email || '';
}

window.handleLogout = async function() {
  await signOut(auth);
  window.location.href = '../index.html';
};

function setButtonLoading(btn, isLoading) {
  const text    = btn?.querySelector('.btn-text');
  const spinner = btn?.querySelector('.btn-spinner');
  if (btn)     btn.disabled   = isLoading;
  if (text)    text.classList.toggle('hidden',    isLoading);
  if (spinner) spinner.classList.toggle('hidden', !isLoading);
}
