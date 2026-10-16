/* ============================================================
   auth.js  — Handles login, signup, logout, and auth state.

   WHAT THIS FILE DOES:
   - Listens for the user's login state (are they signed in?).
   - If signed in and we are on the landing page → redirect to dashboard.
   - If NOT signed in and we are on a protected page → redirect to home.
   - Handles the signup form submission.
   - Handles the login form submission.
   - Handles logout.

   DATA FLOW:
   User fills form → JS reads values → calls Firebase Auth function
   → Firebase returns success or error → we redirect or show error message.

   VIVA TIP: "We use Firebase Authentication so we never store passwords
   ourselves. Firebase handles hashing and security automatically."
   ============================================================ */

import { auth, db } from './firebase-config.js';

// Firebase Auth functions we need
import {
  createUserWithEmailAndPassword,   // for signup
  signInWithEmailAndPassword,       // for login
  signOut,                          // for logout
  onAuthStateChanged,               // to detect if user is already logged in
  updateProfile                     // to save the user's display name
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firestore functions to create the user's profile document
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ─── AUTH STATE LISTENER ──────────────────────────────────────
// onAuthStateChanged fires every time the login state changes.
// We use it to automatically redirect users to the right page.
onAuthStateChanged(auth, (user) => {
  const onLandingPage  = window.location.pathname.endsWith('index.html') ||
                         window.location.pathname === '/' ||
                         window.location.pathname.endsWith('/website/');
  const onDashboard    = window.location.pathname.includes('dashboard');

  if (user) {
    // User IS logged in
    if (onLandingPage) {
      // They opened the home page but are already signed in → go to dashboard
      window.location.href = 'pages/dashboard.html';
    }
    // If they are already on a dashboard page, do nothing (let that page handle it)
  } else {
    // User is NOT logged in
    if (onDashboard || window.location.pathname.includes('pages/')) {
      // They tried to open a protected page without logging in → send to home
      window.location.href = '../index.html';
    }
  }
});

// ─── SIGNUP HANDLER ───────────────────────────────────────────
// Called when the signup form is submitted (onsubmit="handleSignup(event)")
// Dynamic Year -> Semester toggle in signup modal
window.handleSignupYearChange = function(yearVal) {
  const semSelect = document.getElementById('signup-semester');
  if (!semSelect) return;
  const isYear1 = String(yearVal) === '1';

  document.querySelectorAll('.sem-yr1').forEach(el => el.style.display = isYear1 ? 'block' : 'none');
  document.querySelectorAll('.sem-yr2').forEach(el => el.style.display = isYear1 ? 'none' : 'block');

  if (isYear1) {
    semSelect.value = '1';
  } else {
    semSelect.value = '3';
  }
};

window.handleSignup = async function(event) {
  event.preventDefault();  // stop the browser from reloading the page

  // Read values from the form inputs
  const name        = document.getElementById('signup-name').value.trim();
  const email       = document.getElementById('signup-email').value.trim();
  const password    = document.getElementById('signup-password').value;
  const yearVal     = document.getElementById('signup-year')?.value || '2';
  const semesterVal = parseInt(document.getElementById('signup-semester')?.value || '3', 10);
  const branchVal   = document.getElementById('signup-branch')?.value || 'CSE';
  const errorEl     = document.getElementById('signup-error');
  const btn         = document.getElementById('signup-btn');

  // Clear previous errors
  errorEl.textContent = '';

  // Basic validation (Firebase will also validate, but this gives faster feedback)
  if (!name) {
    errorEl.textContent = 'Please enter your name.';
    return;
  }

  // Show loading spinner on the button
  setButtonLoading(btn, true);

  try {
    // Step 1: Create the account in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Step 2: Save the display name to Firebase Auth profile
    await updateProfile(user, { displayName: name });

    // Step 3: Create a user profile document in Firestore
    // This stores academic information matching authoritative AKTU CSE curriculum
    const academicYear = yearVal === '1' ? 'First Year' : 'Second Year';
    await setDoc(doc(db, 'users', user.uid), {
      name:         name,
      email:        email,
      branch:       branchVal,
      academicYear: academicYear,
      semester:     semesterVal,
      dailyGoalMin: 60,
      createdAt:    serverTimestamp()
    });

    try {
      localStorage.setItem('studypilot_current_semester', String(semesterVal));
      localStorage.setItem('studypilot_academic_year', academicYear);
      localStorage.setItem('studypilot_user_name', name);
    } catch (e) {}

    // Step 4: Redirect to dashboard
    window.location.href = 'pages/dashboard.html';

  } catch (err) {
    errorEl.textContent = getAuthErrorMessage(err.code);
    setButtonLoading(btn, false);
  }
};

// ─── LOGIN HANDLER ────────────────────────────────────────────
window.handleLogin = async function(event) {
  event.preventDefault();

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl  = document.getElementById('login-error');
  const btn      = document.getElementById('login-btn');

  errorEl.textContent = '';
  setButtonLoading(btn, true);

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will fire and redirect automatically,
    // but we also redirect here for speed
    window.location.href = 'pages/dashboard.html';

  } catch (err) {
    errorEl.textContent = getAuthErrorMessage(err.code);
    setButtonLoading(btn, false);
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────
// Called by the logout button on any dashboard page
window.handleLogout = async function() {
  try {
    await signOut(auth);
    // Redirect back to home page after logout
    // The path depends on whether we're in /pages/ or root
    const isInPages = window.location.pathname.includes('/pages/');
    window.location.href = isInPages ? '../index.html' : 'index.html';
  } catch (err) {
    console.error('Logout error:', err);
    showToast('Could not sign out. Please try again.', 'error');
  }
};

// ─── HELPER: SHOW/HIDE BUTTON SPINNER ──────────────────────
// Shows a spinning animation on the button while an async action is running
function setButtonLoading(btn, isLoading) {
  const textEl    = btn.querySelector('.btn-text');
  const spinnerEl = btn.querySelector('.btn-spinner');

  if (isLoading) {
    btn.disabled   = true;
    if (textEl)    textEl.classList.add('hidden');
    if (spinnerEl) spinnerEl.classList.remove('hidden');
  } else {
    btn.disabled   = false;
    if (textEl)    textEl.classList.remove('hidden');
    if (spinnerEl) spinnerEl.classList.add('hidden');
  }
}

// ─── HELPER: CONVERT FIREBASE ERROR CODES TO READABLE MESSAGES
// Firebase error codes are like "auth/wrong-password" — not user-friendly.
// This function returns a simple English message for each common error.
function getAuthErrorMessage(code) {
  const messages = {
    'auth/email-already-in-use': 'This email is already registered. Try signing in.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/weak-password':        'Password must be at least 6 characters long.',
    'auth/wrong-password':       'Incorrect password. Please try again.',
    'auth/user-not-found':       'No account found with this email address.',
    'auth/too-many-requests':    'Too many failed attempts. Please try again in a few minutes.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/invalid-credential':   'Incorrect email or password. Please try again.'
  };

  // Return the matching message, or a generic fallback
  return messages[code] || `Sign-in failed (${code}). Please try again.`;
}

// ─── UI PANEL FUNCTIONS ────────────────────────────────────────
// These control showing/hiding the auth modal and switching between tabs.
// They are on window so the HTML onclick attributes can call them.

window.showAuthPanel = function(tab = 'login') {
  const overlay = document.getElementById('auth-overlay');
  if (overlay) {
    overlay.classList.add('visible');
    switchTab(tab);
  }
};

window.hideAuthPanel = function() {
  const overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.classList.remove('visible');
};

window.switchTab = function(tab) {
  const loginForm  = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const tabLogin   = document.getElementById('tab-login');
  const tabSignup  = document.getElementById('tab-signup');

  if (!loginForm || !signupForm) return;

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
  } else {
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
  }
};

// Close modal when clicking outside of it
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('auth-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      // If the click was directly on the overlay (not inside the modal box), close it
      if (e.target === overlay) hideAuthPanel();
    });
  }
});
