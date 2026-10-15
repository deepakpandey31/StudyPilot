# StudyPilot AI 🎓🚀
> **An Intelligent Autonomous Study Productivity & Syllabus Tracking Ecosystem for Engineering Students**
>
> **Author:** Deepak Pandey ([@deepakpandey31](https://github.com/deepakpandey31))  
> **Course:** B.Tech Computer Science & Engineering (AKTU)  
> **Project Type:** Final / Mini Project Submission  

---

## 📌 Project Overview & Why We Built This

As college engineering students, a huge percentage of our academic preparation happens on YouTube — watching lectures on Data Structures, Operating Systems, Computer Networks, and DBMS. 

However, we face several recurring problems:
1. **Unstructured Learning:** YouTube videos don't follow our specific AKTU syllabus structure or unit divisions.
2. **Fake Progress:** We open a 2-hour playlist, skip through 20 minutes, and feel we completed it without tracking actual retention.
3. **Disconnected Notes & Doubts:** Important explanations and numerical formulas get lost without exact video timestamps.
4. **Exam Anxiety & SGPA Uncertainty:** There is no bridge between watching video lectures and testing whether you can actually solve exam-level MCQs.

**StudyPilot AI solves this end-to-end.** It is a two-part hybrid system consisting of:
- **A Manifest V3 Chrome Extension** that runs seamlessly in the background on YouTube, capturing playback telemetry, filtering out skipped intervals, bookmarking exact second-level timestamps, and categorizing study domains.
- **A Responsive Web Application** built with vanilla modern web standards (HTML5, CSS3, ES6 Modules) integrated with **Google Firebase** (Auth + Firestore) and **Google Gemini Generative AI**, featuring syllabus roadmaps with in-place editing, dual-mode practice tests, and an AKTU credit-weighted SGPA estimator.

---

## 🏗️ System Architecture & Data Flow

```text
  +-----------------------------------------------------------------------+
  |                        YOUTUBE BROWSER TAB                            |
  |  HTML5 Video Player  --> [content.js] (Tracks playback delta & seek)  |
  +----------------------------------+------------------------------------+
                                     |
                                     v
  +-----------------------------------------------------------------------+
  |                     STUDYPILOT CHROME EXTENSION                       |
  |  - Service Worker: [background.js]                                    |
  |  - Persistent Storage: chrome.storage.local                           |
  |  - User Interface: [popup.html] / [popup.js]                          |
  +----------------------------------+------------------------------------+
                                     |
                                     v
  +-----------------------------------------------------------------------+
  |                     WEB-EXTENSION BRIDGE LAYER                        |
  |  - Injected Bridge Script: [bridge.js]                                |
  |  - Cross-Origin Window Messaging: window.postMessage & storage events |
  +----------------------------------+------------------------------------+
                                     |
                                     v
  +-----------------------------------------------------------------------+
  |                     STUDYPILOT AI WEB PLATFORM                        |
  |  - Authentication: Firebase Auth (Email/Password)                     |
  |  - Cloud Persistence: Google Cloud Firestore (Security Rules locked)  |
  |  - AI Assessment Engine: Gemini 1.5/2.0 Cascade + Offline Generator   |
  |  - Academic Engines: Official AKTU SGPA Calculator & Roadmap Engine   |
  +-----------------------------------------------------------------------+
```

---

## ✨ Key Features & Capabilities

### 1. ⏱️ Intelligent YouTube Lecture Tracking (Manifest V3)
- **Zero-Friction Detection:** Listens to YouTube's internal SPA events (`yt-navigate-finish`, `yt-page-data-updated`) without requiring manual page reloads.
- **Cheat-Proof Telemetry:** Compares `video.currentTime` every 2.5 seconds. If playback jumps by more than 20 seconds, it recognizes the user skipped forward and does not count skipped time.
- **90% Completion Rule:** Automatically marks a topic/lecture as "Completed" only when the student watches at least 90% of the video duration.
- **Timestamped Bookmarking:** One-click bookmarks that capture the exact second (e.g. `14:25`). Clicking "Watch" in the web dashboard opens YouTube directly at `&t=865s`.

### 2. 🗂️ Multi-Domain Learning Architecture
Organize study sessions into isolated sandboxes:
- **AKTU Academic Tracker (`aktu`):** Full 1st through 8th semester syllabi for AKTU CSE with credit mappings and unit structures.
- **Data Structures & Algorithms (`dsa`):** Arrays, Linked Lists, Stacks, Queues, Binary Trees, BSTs, Graphs, and Dynamic Programming.
- **Web Development (`webdev`):** Modern HTML5/CSS3, JavaScript ES6+, Web APIs, and Backend fundamentals.
- **Custom Domains:** Students can create any custom target (e.g., *Gate 2027*, *Machine Learning*, *DevOps*) with individual daily study goals and custom roadmaps.

### 3. 🗺️ In-Place Editable Roadmap Engine
- Structured hierarchy: `Domain → Subject → Unit → Topic → Attached Resource URL`.
- In-place editing allows adding new subjects, renaming units, creating custom topics, and attaching lecture/notes links with instant cloud and local cache synchronization.
- Real-time syllabus coverage percentage computed uniformly across the platform.

### 4. 🧠 Dual-Mode AI Practice Test Generator
- **Mode A (Custom Test):** Pick any subject, unit, and optional specific topics. Select 5, 10, 15, or 20 questions.
- **Mode B (Progress-Based Test):** Automatically inspects the student's completed and in-progress topics in the active domain, generating MCQs targeted at what they have actually studied.
- **Multi-Model Gemini Fallback Cascade:** Tries `gemini-1.5-flash` → `gemini-2.0-flash` → `gemini-1.5-flash-latest` → `gemini-1.5-pro`.
- **Offline Fallback Question Bank:** If no Gemini API key is configured, StudyPilot runs an instant offline concept question engine so tests never break.

### 5. 📊 Dual-Mode SGPA Estimator
- **Mode A (Official AKTU Formula):**
  $$\text{SGPA} = \frac{\sum (\text{Credits}_i \times \text{GradePoints}_i)}{\sum \text{Credits}_i}$$
  Includes full live grade point calculation, credit breakdown tables, and custom subject additions.
- **Mode B (Progress & Readiness Predictor):** Synthesizes completed syllabus percentage, average test scores, recorded study hours, and sessional exam marks to estimate an expected SGPA band and generate high-priority revision topics.

---

## 📁 Repository Structure

```text
StudyPilot/
├── README.md                   # Complete documentation & viva guide (This file)
├── start-server.bat            # One-click Windows dev server launcher (Zero-cache)
├── vercel.json                 # Vercel 1-click cloud web deployment config
├── firebase.json               # Firebase Hosting & Firestore rules config
├── .gitignore                  # Git exclusions for production hygiene
│
├── extension/                  # Chrome Extension (Manifest V3)
│   ├── manifest.json           # Extension permissions, host rules, and content scripts
│   ├── background.js           # Service worker handling storage & alarms
│   ├── content.js              # YouTube DOM observer & HTML5 video tracker
│   ├── bridge.js               # Zero-port communication bridge to localhost/web
│   ├── popup.html              # Modern extension popup interface
│   ├── popup.js                # Extension popup controls, domain & bookmark picker
│   └── icons/                  # High-resolution extension icons (16, 48, 128px)
│
├── website/                    # Web Application Front-End
│   ├── index.html              # Landing page, feature overview, and auth modal
│   ├── server.py               # Python zero-cache development web server
│   ├── css/
│   │   ├── style.css           # Global design system, tokens, and CSS resets
│   │   ├── auth.css            # Landing page layout, hero, and modal styling
│   │   └── dashboard.css       # App shell, responsive sidebar, cards, and modals
│   ├── js/
│   │   ├── firebase-config.js  # Firebase modular SDK initialization
│   │   ├── auth.js             # Auth state listener, signup, login, and redirection
│   │   ├── ui-helpers.js       # Toast notifications, formatters, and modal helpers
│   │   ├── domain-manager.js   # Multi-domain switching, custom domain CRUD
│   │   ├── dashboard.js        # Study metrics, streak calculator, Chart.js graphs
│   │   ├── roadmap.js          # In-place editable roadmap & topic checkbox engine
│   │   ├── tests.js            # Dual-mode MCQ test engine with Gemini AI cascade
│   │   ├── bookmarks.js        # Timestamped video bookmark manager with direct seek
│   │   ├── sgpa.js             # AKTU credit-weighted calculator & exam predictor
│   │   ├── todos.js            # Domain-isolated task manager
│   │   ├── settings.js         # User profile and Gemini API key manager
│   │   ├── sync.js             # Extension-to-Firestore synchronization bridge
│   │   └── syllabus-data.js    # Preloaded AKTU CSE Sem 1-8, DSA, and WebDev roadmaps
│   └── pages/
│       ├── dashboard.html      # Main user study dashboard
│       ├── roadmap.html        # Interactive syllabus roadmap
│       ├── tests.html          # Practice tests page
│       ├── bookmarks.html      # Timestamp bookmarks page
│       ├── todos.html          # Tasks and to-do list
│       ├── sgpa.html           # SGPA estimator & readiness page
│       └── settings.html       # Profile and API settings page
│
└── docs/
    ├── firestore.rules         # Enterprise security rules for Firestore collections
    └── README.md               # Secondary documentation reference
```

---

## 🚀 Setup & Execution Guide

### Part 1: Running the Web App Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/deepakpandey31/StudyPilot.git
   cd StudyPilot
   ```

2. **Launch the local web server:**
   - On Windows: Simply **double-click** `start-server.bat`.
   - Or using terminal:
     ```bash
     cd website
     python server.py 8000
     ```

3. **Open in browser:**
   Navigate to: **`http://localhost:8000/index.html`**

> **Note on ES Modules:** Web browsers block JavaScript ES6 `import`/`export` statements when opening files via `file:///`. You must run a local server (like `server.py`, VS Code Live Server, or `start-server.bat`).

---

### Part 2: Installing the Chrome Extension

1. Open Google Chrome and enter `chrome://extensions` in the address bar.
2. Toggle **Developer mode** (top-right corner) to **ON**.
3. Click the **"Load unpacked"** button (top-left corner).
4. Select the `extension/` folder from this project directory.
5. Click the puzzle icon in Chrome's toolbar and **Pin** StudyPilot AI.
6. Open any YouTube lecture video — the extension automatically detects the video title, duration, and playback progress!

---

### Part 3: Deploying to the Cloud

#### Option A: Web App on Vercel (1-Click)
1. Push your code to GitHub: `https://github.com/deepakpandey31/StudyPilot`.
2. Log in to [Vercel](https://vercel.com) with GitHub.
3. Click **"Add New Project"** → Import **StudyPilot**.
4. The included `vercel.json` will automatically configure routing. Click **Deploy**.
5. Add your new Vercel domain to Firebase Console under:
   `Authentication` → `Settings` → `Authorized domains`.

#### Option B: Web App on Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## 🔒 Firestore Security Rules Schema

The database uses strict user-level authorization rules (`docs/firestore.rules`):

| Collection | Path | Access Rule |
|---|---|---|
| `users` | `/users/{uid}` | Read & Write only if `request.auth.uid == uid` |
| `customRoadmaps` | `/users/{uid}/customRoadmaps/{docId}` | Isolated to document owner |
| `roadmap` | `/users/{uid}/roadmap/{docId}` | Isolated to document owner |
| `videos` | `/videos/{videoId}` | `request.auth.uid == resource.data.userId` |
| `bookmarks` | `/bookmarks/{bookmarkId}` | `request.auth.uid == resource.data.userId` |
| `tests` | `/tests/{testId}` | `request.auth.uid == resource.data.userId` |
| `todos` | `/todos/{todoId}` | `request.auth.uid == resource.data.userId` |

---

## 🎓 30 Essential Viva Questions & Answers (College Evaluation Prep)

### Section A: Chrome Extension & Browser Architecture
**Q1: Why did you build a Chrome Extension instead of doing everything in the website?**  
> *Answer:* Modern browsers enforce the Same-Origin Policy (SOP). A regular website cannot read video telemetry or DOM elements inside YouTube. A Chrome Extension with content script permissions on `*://*.youtube.com/*` is the only secure way to track study video playback.

**Q2: What is Manifest V3 and how does it differ from Manifest V2?**  
> *Answer:* Manifest V3 is Google's modern extension specification. It replaces long-running background pages with event-driven Service Workers (`background.js`), restricts remotely hosted code to enhance security, and uses declarative APIs.

**Q3: How does your extension detect navigation when a user clicks another YouTube video without refreshing?**  
> *Answer:* YouTube is a Single-Page Application (SPA). Instead of regular HTTP reloads, YouTube uses internal pushState routing and dispatches custom events `yt-navigate-finish` and `yt-page-data-updated`. We add event listeners for these in `content.js` to re-initialize tracking smoothly.

**Q4: How do you prevent users from cheating their study time by fast-forwarding or dragging the video slider?**  
> *Answer:* In `content.js`, we sample the HTML5 video player's `currentTime` every 2.5 seconds. If the delta between the current timestamp and the last recorded timestamp exceeds 20 seconds, we flag a scrub/seek action and ignore the jump, adding only genuine elapsed seconds to `watchedSeconds`.

**Q5: How does the extension communicate with the website running on localhost or Vercel?**  
> *Answer:* We implemented a dual-bridge: (1) `bridge.js` is injected into the website host and communicates through safe `window.postMessage` protocols, and (2) reactive listeners on `chrome.storage.onChanged` immediately push updates to `sync.js` on the website.

**Q6: What is the purpose of `externally_connectable` in `manifest.json`?**  
> *Answer:* It declares which web domains (e.g. `http://localhost/*`) are allowed to send messages directly to the extension using `chrome.runtime.sendMessage(extensionId, payload)`.

---

### Section B: JavaScript & Web Architecture
**Q7: Why did you use native JavaScript ES6 Modules instead of bundling with Webpack or Vite?**  
> *Answer:* Native ES Modules (`type="module"`) are directly supported by all modern browsers. It eliminates heavy `node_modules` dependencies, simplifies deployment, provides instant file reloading without compile steps, and makes the codebase transparent for viva inspection.

**Q8: What is the purpose of cache-busting query strings like `?v=20261016_v3`?**  
> *Answer:* Browsers aggressively cache JavaScript ES Modules and HTTP responses. Appending a version or timestamp query string forces the browser to fetch the latest code from the server rather than executing outdated cached scripts.

**Q9: What is function hoisting in JavaScript and why did it matter in `tests.js`?**  
> *Answer:* Function declarations (`function foo() {}`) are hoisted to the top of their scope during compilation, meaning they can be called before they are lexically defined. Function expressions assigned to variables (`const foo = function() {}` or `window.foo = ...`) are not hoisted, which can cause `ReferenceError` if called prematurely during synchronous page bootstrap.

**Q10: Why do you sanitize strings with `escapeHtml()`?**  
> *Answer:* To defend against Cross-Site Scripting (XSS). If user input, video titles, or AI responses contain malicious HTML or `<script>` tags, inserting them via `innerHTML` without escaping would execute arbitrary JavaScript. `escapeHtml()` converts characters like `<`, `>`, `&`, and `"` to safe HTML entities.

---

### Section C: Firebase & Cloud Storage
**Q11: What is the difference between Firebase Authentication and Firebase Firestore?**  
> *Answer:* Firebase Authentication manages user identity, session tokens, and password hashing securely. Firestore is a cloud-hosted NoSQL document database organized into collections and JSON-like documents.

**Q12: What does `merge: true` do in Firestore's `setDoc()` method?**  
> *Answer:* By default, `setDoc()` overwrites the entire target document, deleting any unspecified fields. Specifying `{ merge: true }` ensures that only the provided keys are updated, leaving existing document fields intact.

**Q13: Why did you use in-memory client sorting for test history instead of Firestore's `.orderBy()`?**  
> *Answer:* In Firestore, querying with `.where('userId', '==', uid)` combined with `.orderBy('createdAt', 'desc')` requires a Composite Index. If the index is not yet built in Google Cloud Console, Firestore throws a query error. Sorting in-memory on the client is completely resilient and requires zero index configuration.

---

### Section D: Artificial Intelligence & Practice Tests
**Q14: How does StudyPilot generate multiple-choice questions using Gemini AI?**  
> *Answer:* We build an engineered prompt specifying the exact topic, unit, question difficulty, and strict JSON response formatting rules (`question`, 4 `options`, integer `correct` index 0–3, and `explanation`). We send this via a `POST` request to the Google Generative Language REST API endpoint.

**Q15: Why did you implement a multi-model fallback cascade?**  
> *Answer:* Generative AI endpoints can occasionally hit regional rate limits or transient errors. Our cascade sequentially attempts `gemini-1.5-flash` → `gemini-2.0-flash` → `gemini-1.5-flash-latest` → `gemini-1.5-pro` before surfacing an error to ensure high availability.

**Q16: How does Mode B (Progress-Based Test) determine which questions to generate?**  
> *Answer:* It queries the student's completed topics ledger (`completedTopics[subject_unit_topic] == true`) in the active domain. It passes only those verified concepts into the AI prompt so students are tested strictly on material they have actually studied.

**Q17: Where is the Gemini API key stored and why?**  
> *Answer:* It is stored in the browser's `localStorage`. This ensures the student's personal API key never leaves their device and is never exposed to public repositories or shared database records.

---

### Section E: SGPA Estimator & Formulas
**Q18: What is the official AKTU grading formula used in Mode A?**  
> *Answer:* SGPA is calculated as $\frac{\sum (C_i \times G_i)}{\sum C_i}$, where $C_i$ is the credit weight assigned to subject $i$ and $G_i$ is the Grade Point earned based on percentage marks (e.g., 90–100% = Outstanding/10 pts, 80–89% = Excellent/9 pts, 70–79% = Very Good/8 pts, etc.).

**Q19: How does Mode B calculate an empirical SGPA prediction?**  
> *Answer:* It creates a weighted composite score combining four data points: (1) Syllabus completion percentage (30%), (2) Average practice test score (35%), (3) Consistency of recorded study hours vs goal (15%), and (4) Optional sessional marks (20%). It translates this composite score into a realistic SGPA range with a confidence classification.

---

## 👨‍💻 Author & Contributions
- **Lead Developer:** Deepak Pandey
- **GitHub:** [@deepakpandey31](https://github.com/deepakpandey31)
- **Institution:** Dr. A.P.J. Abdul Kalam Technical University (AKTU)
- **Department:** Computer Science & Engineering
