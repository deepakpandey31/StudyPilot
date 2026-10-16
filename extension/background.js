/* ============================================================
   background.js — Service Worker for the Chrome Extension.

   WHAT THIS FILE DOES:
   1. Receives VIDEO_PROGRESS messages from content.js.
   2. Saves/updates video tracking data in chrome.storage.local.
   3. Receives GET_ALL_VIDEOS messages from website bridge or runtime.
   4. Auto-injects scripts into already-open tabs on install/reload.
   ============================================================ */

// ─── MESSAGE DISPATCHER ──────────────────────────────────────
function handleIncomingMessage(message, sender, sendResponse) {
  if (!message || !message.type) return false;

  if (message.type === 'PING') {
    sendResponse({ ok: true, pong: true, extensionId: chrome.runtime.id });
    return false;
  }

  if (message.type === 'VIDEO_PROGRESS') {
    saveVideoProgress(message.payload)
      .then(() => sendResponse({ ok: true }))
      .catch(err => {
        console.error('Background: error saving video progress', err);
        sendResponse({ ok: false, error: err.message });
      });
    return true;  // Keep message channel open for async response
  }

  if (message.type === 'GET_ALL_VIDEOS') {
    chrome.storage.local.get(['videos', 'bookmarks', 'activeDomain', 'todayMinutes', 'dailySeconds'], (result) => {
      sendResponse({
        ok: true,
        extensionId: chrome.runtime.id,
        videos: result.videos || {},
        bookmarks: result.bookmarks || {},
        activeDomain: result.activeDomain || 'aktu',
        todayMinutes: result.todayMinutes || 0,
        dailySeconds: result.dailySeconds || {}
      });
    });
    return true;
  }

  if (message.type === 'GET_ALL_BOOKMARKS') {
    chrome.storage.local.get('bookmarks', (result) => {
      sendResponse({ ok: true, bookmarks: result.bookmarks || {} });
    });
    return true;
  }

  if (message.type === 'GET_TODAY_MINUTES') {
    getTodayMinutes().then(minutes => {
      sendResponse({ ok: true, minutes });
    });
    return true;
  }

  if (message.type === 'MARK_VIDEO_BOOKMARKED') {
    markBookmarked(message)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => {
        console.error('Error in markBookmarked:', err);
        sendResponse({ ok: false, error: err.message });
      });
    return true;
  }
}

// Internal messages (from content.js or popup.js)
chrome.runtime.onMessage.addListener(handleIncomingMessage);

// External messages (from the web dashboard running on localhost or 127.0.0.1)
if (chrome.runtime.onMessageExternal) {
  chrome.runtime.onMessageExternal.addListener(handleIncomingMessage);
}

// ─── SAVE VIDEO PROGRESS ──────────────────────────────────────
async function saveVideoProgress(data) {
  if (!data || !data.videoId) return;

  const result       = await chrome.storage.local.get(['videos', 'activeDomain', 'dailySeconds']);
  const videos       = result.videos || {};
  const activeDomain = result.activeDomain || 'aktu';
  let dailySeconds   = result.dailySeconds || {};

  const existing = videos[data.videoId] || {};

  const updated = {
    ...existing,
    videoId:      data.videoId,
    title:        data.title        || existing.title        || 'Untitled',
    channel:      data.channel      || existing.channel      || '',
    url:          data.url          || existing.url          || '',
    thumbnailUrl: data.thumbnailUrl || existing.thumbnailUrl || '',
    playlistId:   data.playlistId   || existing.playlistId   || '',
    playlistTitle:data.playlistTitle|| existing.playlistTitle|| '',
    duration:     data.duration     || existing.duration     || 0,
    watchedSeconds: Math.max(
      data.watchedSeconds || 0,
      existing.watchedSeconds || 0
    ),
    currentTime:  data.currentTime  || existing.currentTime  || 0,
    completed:    data.completed    || existing.completed     || false,
    isStudy:      data.isStudy !== undefined ? data.isStudy : (existing.isStudy !== undefined ? existing.isStudy : true),
    lastWatched:  data.lastWatched  || Date.now(),
    subject:      data.subject      || existing.subject      || '',
    domainId:     data.domainId     || existing.domainId     || activeDomain || 'aktu',
    bookmarked:   existing.bookmarked || false,
    bookmarkCategory: existing.bookmarkCategory || '',
  };

  videos[data.videoId] = updated;

  // Track daily study seconds increment
  const todayKey = getTodayKey();
  if (data.deltaSeconds && data.deltaSeconds > 0 && updated.isStudy) {
    dailySeconds[todayKey] = (dailySeconds[todayKey] || 0) + data.deltaSeconds;
  }

  await chrome.storage.local.set({ videos, dailySeconds });
  await updateTodayMinutes(todayKey, dailySeconds, videos);
}

// ─── UPDATE TODAY'S STUDY MINUTES ────────────────────────────
async function updateTodayMinutes(todayKey, dailySeconds, videos) {
  if (!todayKey) todayKey = getTodayKey();

  let totalSecToday = 0;
  if (dailySeconds && dailySeconds[todayKey] !== undefined) {
    totalSecToday = dailySeconds[todayKey];
  } else {
    // Fallback: sum of all videos watched today
    Object.values(videos || {}).forEach(video => {
      const lastWatched = new Date(video.lastWatched || 0);
      const lastWatchedKey = `${lastWatched.getFullYear()}-${String(lastWatched.getMonth()+1).padStart(2,'0')}-${String(lastWatched.getDate()).padStart(2,'0')}`;
      if (lastWatchedKey === todayKey && video.isStudy) {
        totalSecToday += (video.watchedSeconds || 0);
      }
    });
  }

  const todayMinutes = Math.floor(totalSecToday / 60);

  await chrome.storage.local.set({
    lastSyncDate: todayKey,
    todayMinutes: todayMinutes
  });
}

// ─── GET TODAY'S MINUTES ──────────────────────────────────────
async function getTodayMinutes() {
  const result = await chrome.storage.local.get(['todayMinutes', 'lastSyncDate', 'dailySeconds', 'videos']);
  const todayKey = getTodayKey();

  if (result.dailySeconds && result.dailySeconds[todayKey]) {
    return Math.floor(result.dailySeconds[todayKey] / 60);
  }

  if (result.lastSyncDate === todayKey && result.todayMinutes !== undefined) {
    return result.todayMinutes;
  }

  return 0;
}

// ─── CANONICAL SUBJECT AUTO-DETECTOR ───────────────────────────
const CANONICAL_SUBJECT_MATCHERS = [
  // Semester 3 (BCS-Series)
  { code: 'BCS302', name: 'Computer Organization and Architecture', aliases: ['computer organization and architecture', 'computer organization', 'computer architecture', 'coa', 'co&a', 'cpu architecture'] },
  { code: 'BCS303', name: 'Discrete Structures and Theory of Logic', aliases: ['discrete structures and theory of logic', 'discrete structures', 'discrete mathematics', 'discrete math', 'discrete maths', 'dstl', 'theory of logic', 'boolean algebra', 'graph theory', 'relations and functions'] },
  { code: 'BCS301', name: 'Data Structure', aliases: ['data structure', 'data structures', 'linked list', 'trees and graphs', 'stack and queue', 'sorting algorithms'] },
  { code: 'BAS303', name: 'Mathematics III, IV or V', aliases: ['mathematics iii', 'mathematics 3', 'maths iii', 'maths 3', 'math 3', 'math iii', 'bas303', 'engineering mathematics 3', 'engg mathematics 3', 'matrices', 'matrix', 'maths', 'mathematics', 'engineering mathematics', 'engg mathematics', 'fourier series', 'laplace transform', 'pde', 'differential equations', 'complex variable', 'complex analysis'] },
  { code: 'BOE3**', name: 'Science-Based Open Elective', aliases: ['science-based open elective', 'science based open elective', 'boe3'] },
  { code: 'BVE301', name: 'Universal Human Values & Professional Ethics', aliases: ['universal human values', 'human values', 'professional ethics', 'uhv', 'bve301'] },
  { code: 'BAS301', name: 'Technical Communication', aliases: ['technical communication', 'bas301'] },
  { code: 'BCC301', name: 'Cyber Security', aliases: ['cyber security', 'cybersecurity', 'bcc301', 'information security'] },
  { code: 'BCC302', name: 'Python Programming', aliases: ['python programming', 'python syntax', 'bcc302'] },
  { code: 'BCS353', name: 'Web Designing Workshop', aliases: ['web designing workshop', 'web design workshop', 'bcs353'] },

  // Semester 4 (BCS-Series)
  { code: 'BCS401', name: 'Operating System', aliases: ['operating system', 'operating systems', 'bcs401', 'cpu scheduling', 'deadlock', 'virtual memory', 'process synchronization'] },
  { code: 'BCS402', name: 'Theory of Automata and Formal Languages', aliases: ['theory of automata and formal languages', 'theory of automata', 'automata and formal languages', 'automata theory', 'tafl', 'toc', 'bcs402', 'theory of computation', 'turing machine', 'finite automata', 'cfg', 'pda'] },
  { code: 'BCS403', name: 'Object-Oriented Programming with Java', aliases: ['object-oriented programming with java', 'oop with java', 'oops with java', 'java programming', 'bcs403', 'java oops', 'core java'] },
  { code: 'BAS403', name: 'Mathematics III, IV or V', aliases: ['mathematics iv', 'mathematics 4', 'maths iv', 'maths 4', 'math 4', 'math iv', 'bas403', 'probability and statistics', 'random variables'] },
  { code: 'BOE4**', name: 'Science-Based Open Elective', aliases: ['science-based open elective', 'boe4'] },
  { code: 'BAS401', name: 'Technical Communication', aliases: ['technical communication', 'bas401'] },
  { code: 'BVE401', name: 'Universal Human Values and Professional Ethics', aliases: ['universal human values and professional ethics', 'human values', 'bve401'] },
  { code: 'BCC402', name: 'Python Programming', aliases: ['python programming', 'bcc402'] },
  { code: 'BCC401', name: 'Cyber Security', aliases: ['cyber security', 'bcc401'] },

  // Semester 1 & 2 (2026–27 CSE Stream)
  { code: 'AAS101E', name: 'Quantum Physics and Applications', aliases: ['quantum physics', 'applied physics', 'modern physics', 'aas101e', 'aas201e'] },
  { code: 'AAS102D', name: 'Applied Chemistry for Smart Systems', aliases: ['applied chemistry', 'engineering chemistry', 'smart systems', 'aas102d', 'aas202d'] },
  { code: 'AAS103D', name: 'Calculus and Linear Algebra', aliases: ['maths 1', 'maths-1', 'math 1', 'math-1', 'mathematics 1', 'mathematics-1', 'maths i', 'calculus and linear algebra', 'calculus', 'linear algebra', 'aas103d', 'engineering mathematics 1'] },
  { code: 'AAS203D', name: 'Numerical Methods', aliases: ['maths 2', 'maths-2', 'math 2', 'math-2', 'mathematics 2', 'numerical methods', 'aas203d', 'engineering mathematics 2'] },
  { code: 'AEE101A', name: 'Fundamentals of Electrical Engineering', aliases: ['electrical engineering', 'basic electrical', 'aee101a', 'aee201a', 'bee'] },
  { code: 'AEC101A', name: 'Fundamentals of Electronics Engineering', aliases: ['electronics engineering', 'basic electronics', 'aec101a', 'aec201a'] },
  { code: 'ACS101',  name: 'Programming Languages', aliases: ['programming languages', 'c programming', 'programming in c', 'acs101'] },
  { code: 'ACS201',  name: 'Essentials of Data Structures', aliases: ['essentials of data structures', 'acs201'] },
  { code: 'AAI101',  name: 'Introduction to AI and Prompt Engineering', aliases: ['prompt engineering', 'artificial intelligence', 'aai101', 'aai201', 'generative ai'] },
  { code: 'AME101A', name: 'Fundamentals of Mechanical Engineering', aliases: ['mechanical engineering', 'basic mechanical', 'ame101a', 'ame201a'] },
  { code: 'AAS105',  name: 'Professional Communication and Technical Writing', aliases: ['professional communication and technical writing', 'professional communication', 'technical writing', 'aas105', 'aas205'] },
  { code: 'AAS104',  name: 'Introduction to Indian Knowledge System', aliases: ['indian knowledge system', 'iks', 'aas104', 'aas204'] }
];

function autoDetectSubjectFromTitle(title) {
  if (!title) return null;
  const lower = title.toLowerCase();

  for (const item of CANONICAL_SUBJECT_MATCHERS) {
    for (const alias of item.aliases) {
      let isMatch = false;
      if (alias.length <= 4) {
        const regex = new RegExp(`\\b${alias.replace(/[*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        isMatch = regex.test(lower);
      } else {
        isMatch = lower.includes(alias);
      }
      if (isMatch) {
        return { code: item.code, name: item.name };
      }
    }
  }

  // Exact code fallback
  for (const item of CANONICAL_SUBJECT_MATCHERS) {
    const codeClean = item.code.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
    if (codeClean && lower.includes(codeClean)) {
      return { code: item.code, name: item.name };
    }
  }

  return null;
}

// ─── MARK VIDEO BOOKMARKED ────────────────────────────────────
async function markBookmarked(payload) {
  const videoId = payload.videoId;
  if (!videoId) return;

  const res = await chrome.storage.local.get(['videos', 'bookmarks', 'activeDomain']);
  const videos    = res.videos || {};
  const bookmarks = res.bookmarks || {};
  const activeDomain = res.activeDomain || 'aktu';

  const currentTime        = Math.floor(payload.currentTime || 0);
  const timestampFormatted = payload.timestampFormatted || '0:00';
  const domainId           = payload.domainId || activeDomain || 'aktu';
  const category           = payload.category || 'important';

  // Jump URL with exact timestamp appended
  let jumpUrl = payload.url || `https://youtube.com/watch?v=${videoId}`;
  if (jumpUrl.includes('youtube.com')) {
    const cleanUrl = jumpUrl.replace(/[?&]t=\d+s?/, '');
    jumpUrl = cleanUrl.includes('?') ? `${cleanUrl}&t=${currentTime}s` : `${cleanUrl}?t=${currentTime}s`;
  }

  // Auto-detect subject from title if not explicitly provided
  const videoTitle = payload.title || videos[videoId]?.title || '';
  let resolvedSubject = payload.subject || videos[videoId]?.subject || '';
  if (!resolvedSubject && videoTitle) {
    const detected = autoDetectSubjectFromTitle(videoTitle);
    if (detected) {
      resolvedSubject = `${detected.code} — ${detected.name}`;
    }
  }

  if (videos[videoId]) {
    videos[videoId].bookmarked         = true;
    videos[videoId].bookmarkCategory   = category;
    videos[videoId].bookmarkTimestamp  = currentTime;
    videos[videoId].timestampFormatted = timestampFormatted;
    videos[videoId].domainId           = domainId;
    if (resolvedSubject) videos[videoId].subject = resolvedSubject;
  }

  // Key bookmarks by videoId + timestamp to support multiple timestamp notes per lecture
  const bookmarkKey = `${videoId}_${currentTime}`;
  bookmarks[bookmarkKey] = {
    id:                 bookmarkKey,
    videoId:            videoId,
    title:              videoTitle || 'Untitled',
    channel:            payload.channel || videos[videoId]?.channel || '',
    url:                jumpUrl,
    thumbnailUrl:       payload.thumbnailUrl || videos[videoId]?.thumbnailUrl || '',
    playlistId:         payload.playlistId || videos[videoId]?.playlistId || '',
    playlistTitle:      payload.playlistTitle || videos[videoId]?.playlistTitle || '',
    category:           category,
    timestamp:          currentTime,
    timestampFormatted: timestampFormatted,
    domainId:           domainId,
    subject:            resolvedSubject,
    createdAt:          Date.now()
  };

  // Clean up any old duplicate single-key entry for this video
  if (bookmarks[videoId] && bookmarks[videoId] !== bookmarks[bookmarkKey]) {
    delete bookmarks[videoId];
  }

  await chrome.storage.local.set({ videos, bookmarks });
}

// ─── HELPER: GET TODAY'S DATE KEY ────────────────────────────
function getTodayKey() {
  const now = new Date();
  const y   = now.getFullYear();
  const m   = String(now.getMonth() + 1).padStart(2, '0');
  const d   = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── AUTO-INJECT SCRIPTS ON INSTALL / RELOAD ─────────────────
// Ensures already-open YouTube and localhost tabs work immediately without refresh
async function injectScriptsIntoOpenTabs() {
  try {
    // 1. YouTube tabs
    const ytTabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
    for (const tab of ytTabs) {
      if (tab.id && tab.url && tab.url.includes('/watch')) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }).catch(() => {});
      }
    }

    // 2. Localhost & 127.0.0.1 web tabs
    const localPatterns = ['*://localhost/*', '*://127.0.0.1/*'];
    for (const pat of localPatterns) {
      const localTabs = await chrome.tabs.query({ url: pat });
      for (const tab of localTabs) {
        if (tab.id) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['bridge.js']
          }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.log('Auto-inject note:', err);
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({ videos: {}, bookmarks: {}, todayMinutes: 0, dailySeconds: {} });
  }
  injectScriptsIntoOpenTabs();
});

// Auto-inject on startup as well
chrome.runtime.onStartup.addListener(() => {
  injectScriptsIntoOpenTabs();
});
