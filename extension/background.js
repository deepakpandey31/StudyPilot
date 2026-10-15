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

  if (videos[videoId]) {
    videos[videoId].bookmarked         = true;
    videos[videoId].bookmarkCategory   = category;
    videos[videoId].bookmarkTimestamp  = currentTime;
    videos[videoId].timestampFormatted = timestampFormatted;
    videos[videoId].domainId           = domainId;
  }

  // Key bookmarks by videoId + timestamp to support multiple timestamp notes per lecture
  const bookmarkKey = `${videoId}_${currentTime}`;
  bookmarks[bookmarkKey] = {
    id:                 bookmarkKey,
    videoId:            videoId,
    title:              payload.title || videos[videoId]?.title || 'Untitled',
    channel:            payload.channel || videos[videoId]?.channel || '',
    url:                jumpUrl,
    thumbnailUrl:       payload.thumbnailUrl || videos[videoId]?.thumbnailUrl || '',
    playlistId:         payload.playlistId || videos[videoId]?.playlistId || '',
    playlistTitle:      payload.playlistTitle || videos[videoId]?.playlistTitle || '',
    category:           category,
    timestamp:          currentTime,
    timestampFormatted: timestampFormatted,
    domainId:           domainId,
    subject:            payload.subject || videos[videoId]?.subject || '',
    createdAt:          Date.now()
  };

  // Also maintain backward-compatible video key
  bookmarks[videoId] = bookmarks[bookmarkKey];

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
