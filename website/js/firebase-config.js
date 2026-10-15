/* ============================================================
   firebase-config.js
   PURPOSE: Initialize Firebase app and export shared services.

   HOW IT WORKS:
   - We import the Firebase SDK from a CDN (no npm needed).
   - We create ONE Firebase app instance.
   - We export `auth` (for login/signup) and `db` (for Firestore).
   - Every other JS file imports from HERE — not from Firebase directly.
     This keeps all Firebase setup in one place.

   ⚠️  YOU MUST FILL IN YOUR OWN CONFIG BELOW.
   Follow the setup instructions in README.md to get these values
   from your Firebase project's console.
   ============================================================ */

// Import only the parts of Firebase we actually need.
// "firebase/app"  — the core Firebase initializer
// "firebase/auth" — for login, signup, logout
// "firebase/firestore" — for the cloud database
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ─── YOUR FIREBASE PROJECT CONFIG ────────────────────────────
// Go to: Firebase Console → Your Project → Project Settings → Web App
// Copy the firebaseConfig object and paste the values below.
//
// DO NOT share these values publicly on GitHub if your Firestore rules
// are not locked down. See firestore.rules in /docs for security rules.
const firebaseConfig = {
  apiKey:            "AIzaSyCstafIMSnpyBM2gYYGefmIZfrsI1DY2Sg",
  authDomain:        "studypilot-c5311.firebaseapp.com",
  projectId:         "studypilot-c5311",
  storageBucket:     "studypilot-c5311.firebasestorage.app",
  messagingSenderId: "553718083550",
  appId:             "1:553718083550:web:40e6ebcfaa0ef191f9f74f"
};

// Initialize Firebase (this runs once when the page loads)
const app = initializeApp(firebaseConfig);

// Create and export the services we need across the app
export const auth = getAuth(app);
export const db   = getFirestore(app);

// Export the app itself in case any file needs it
export default app;
