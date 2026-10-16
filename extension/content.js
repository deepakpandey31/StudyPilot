/* ============================================================
   content.js — Injected into YouTube to track study video playback.
   ============================================================ */

const TRACK_INTERVAL_MS   = 2500;   // check every 2.5 seconds for responsive tracking
const COMPLETION_THRESHOLD = 0.90;   // 90% watched = completed

let videoId           = null;
let trackingInterval  = null;
let watchedSeconds    = 0;
let lastTrackedTime   = null;
let isClassifiedStudy = true;
let currentSubject    = '';
let currentDomainId   = 'aktu';

function isContextValid() {
  try {
    return Boolean(typeof chrome !== 'undefined' && chrome?.runtime && Boolean(chrome.runtime.id));
  } catch (e) {
    return false;
  }
}

// Load initial activeDomain from extension storage
try {
  if (isContextValid() && chrome?.storage?.local) {
    chrome.storage.local.get('activeDomain', (res) => {
      if (!isContextValid()) return;
      if (res?.activeDomain) currentDomainId = res.activeDomain;
    });
    if (chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes) => {
        if (!isContextValid()) return;
        if (changes.activeDomain?.newValue) {
          currentDomainId = changes.activeDomain.newValue;
        }
      });
    }
  }
} catch (e) {}

// ─── INITIALIZATION ───────────────────────────────────────────
if (isContextValid()) {
  initTracking();
}

// YouTube Single Page Navigation events
const handleNav = () => {
  if (!isContextValid()) {
    if (trackingInterval) clearInterval(trackingInterval);
    return;
  }
  setTimeout(() => {
    if (isContextValid()) initTracking();
  }, 800);
};

document.addEventListener('yt-navigate-finish', handleNav);
document.addEventListener('yt-page-data-updated', handleNav);
window.addEventListener('popstate', handleNav);

function initTracking() {
  if (!isContextValid()) {
    if (trackingInterval) clearInterval(trackingInterval);
    return;
  }

  const newVideoId = extractVideoId();

  if (!newVideoId) {
    if (videoId) sendProgress();
    videoId = null;
    if (trackingInterval) clearInterval(trackingInterval);
    return;
  }

  if (newVideoId !== videoId) {
    if (videoId) sendProgress();

    videoId           = newVideoId;
    watchedSeconds    = 0;
    lastTrackedTime   = null;
    isClassifiedStudy = true;

    // Restore existing progress from storage if video was watched previously
    try {
      if (isContextValid() && chrome?.storage?.local) {
        chrome.storage.local.get(['videos', 'activeDomain'], (res) => {
          if (!isContextValid()) return;
          if (res?.videos && res.videos[newVideoId]) {
            const prev = res.videos[newVideoId];
            watchedSeconds = prev.watchedSeconds || 0;
            if (prev.subject) currentSubject = prev.subject;
            if (prev.isStudy !== undefined) isClassifiedStudy = prev.isStudy;
          }
          if (res?.activeDomain) currentDomainId = res.activeDomain;
        });
      }
    } catch (e) {
      if (trackingInterval) clearInterval(trackingInterval);
      return;
    }

    console.log('[StudyPilot AI] Video tracking active for:', videoId);

    if (trackingInterval) clearInterval(trackingInterval);
    trackingInterval = setInterval(trackPlayback, TRACK_INTERVAL_MS);

    // Initial announce
    setTimeout(() => {
      if (isContextValid()) sendProgress(0);
    }, 1200);

    // Attach event listeners to player
    attachPlayerListeners();
  }
}

function extractVideoId() {
  if (!window.location.pathname.startsWith('/watch')) return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('v') || null;
}

function getVideoElement() {
  return document.querySelector('video.html5-main-video') ||
         document.querySelector('video');
}

function attachPlayerListeners() {
  const player = getVideoElement();
  if (!player) {
    setTimeout(attachPlayerListeners, 1000);
    return;
  }

  if (player._studypilot_attached) return;
  player._studypilot_attached = true;

  player.addEventListener('play', () => trackPlayback());
  player.addEventListener('pause', () => {
    trackPlayback();
    sendProgress(0);
  });
  player.addEventListener('ended', () => {
    watchedSeconds = Math.max(watchedSeconds, Math.floor(player.duration || 0));
    sendProgress(0);
  });
}

function trackPlayback() {
  if (!isContextValid()) {
    if (trackingInterval) clearInterval(trackingInterval);
    return;
  }

  const player = getVideoElement();
  if (!player || player.paused || player.ended) return;

  const currentTime = player.currentTime;
  let delta = 0;

  if (lastTrackedTime !== null) {
    const elapsed = currentTime - lastTrackedTime;
    // Allow natural playback elapsed time (0 to 6 seconds)
    if (elapsed > 0 && elapsed <= 6) {
      delta = elapsed;
      watchedSeconds += elapsed;
    }
  }

  lastTrackedTime = currentTime;
  sendProgress(delta);
}

function collectMetadata(delta = 0) {
  const currentVid = extractVideoId();
  if (currentVid) videoId = currentVid;

  const player      = getVideoElement();
  const duration    = player ? Math.floor(player.duration || 0) : 0;
  const currentTime = player ? Math.floor(player.currentTime || 0) : 0;

  const titleEl    = document.querySelector('h1.ytd-watch-metadata yt-formatted-string') ||
                     document.querySelector('#title h1') ||
                     document.querySelector('h1.title');
  const title      = titleEl?.textContent?.trim() || document.title.replace(' - YouTube', '').trim();

  const channelEl  = document.querySelector('#channel-name a') ||
                     document.querySelector('ytd-channel-name a');
  const channel    = channelEl?.textContent?.trim() || '';

  const params     = new URLSearchParams(window.location.search);
  const playlistId = params.get('list') || '';

  const playlistTitleEl = document.querySelector('ytd-playlist-panel-renderer .title') ||
                          document.querySelector('#playlist-title');
  const playlistTitle   = playlistTitleEl?.textContent?.trim() || '';

  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';
  const completed    = duration > 0 && (currentTime / duration) >= COMPLETION_THRESHOLD;

  return {
    videoId,
    title,
    channel,
    duration,
    currentTime,
    watchedSeconds:   Math.floor(watchedSeconds),
    deltaSeconds:     Math.floor(delta),
    completed,
    url:              window.location.href,
    playlistId,
    playlistTitle,
    thumbnailUrl,
    isStudy:          isClassifiedStudy,
    subject:          currentSubject,
    domainId:         currentDomainId,
    lastWatched:      Date.now()
  };
}

function sendProgress(delta = 0) {
  if (!videoId || !isContextValid()) return;
  const data = collectMetadata(delta);

  // 1. Direct write to chrome.storage.local for instantaneous persistence
  try {
    if (isContextValid() && chrome?.storage?.local) {
      chrome.storage.local.get(['videos', 'activeDomain', 'todayMinutes'], (res) => {
        if (!isContextValid()) return;
        const videos = res.videos || {};
        const activeDomain = res.activeDomain || 'aktu';
        const existing = videos[data.videoId] || {};

        videos[data.videoId] = {
          ...existing,
          ...data,
          domainId: data.domainId || existing.domainId || activeDomain || 'aktu',
          watchedSeconds: Math.max(data.watchedSeconds || 0, existing.watchedSeconds || 0)
        };

        chrome.storage.local.set({ videos });
      });
    }
  } catch (e) {
    if (trackingInterval) clearInterval(trackingInterval);
  }

  // 2. Also dispatch message to background worker
  try {
    if (isContextValid() && chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type:    'VIDEO_PROGRESS',
        payload: data
      }, () => {
        if (!isContextValid() || chrome.runtime.lastError) {
          // Expected when popup or background is idle or context invalidated
        }
      });
    }
  } catch (e) {
    // Context may be invalidated if extension was reloaded
    if (trackingInterval) clearInterval(trackingInterval);
  }
}

// ─── POPUP COMMUNICATION ──────────────────────────────────────
try {
  if (isContextValid() && chrome?.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!isContextValid()) return;
      if (message.type === 'GET_CURRENT_VIDEO') {
        sendResponse({ payload: collectMetadata(0) });
      }

      if (message.type === 'SET_STUDY_CLASSIFICATION') {
        isClassifiedStudy = message.isStudy;
        sendProgress(0);
        sendResponse({ ok: true });
      }

      if (message.type === 'SET_SUBJECT') {
        currentSubject = message.subjectCode || '';
        sendProgress(0);
        sendResponse({ ok: true });
      }

      return true;
    });
  }
} catch (e) {}

window.addEventListener('beforeunload', () => {
  try {
    if (isContextValid()) sendProgress(0);
  } catch (e) {}
  if (trackingInterval) clearInterval(trackingInterval);
});
