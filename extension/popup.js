/* ============================================================
   popup.js — Controls the extension popup UI.

   HOW IT WORKS:
   1. When the popup opens, query the active YouTube tab via
      chrome.tabs and get the current video state from content.js.
   2. Display the video title, progress, and today's study time.
   3. Allow the user to assign a subject and bookmark videos.

   MESSAGE FLOW:
   popup.js → chrome.tabs.sendMessage → content.js (GET_CURRENT_VIDEO)
   content.js replies → popup.js updates UI

   popup.js → chrome.runtime.sendMessage → background.js (GET_TODAY_MINUTES)
   background.js replies → popup.js shows today's minutes
   ============================================================ */

let currentVideoData = null;
let isStudying       = true;

// ─── ON POPUP OPEN ────────────────────────────────────────────
// chrome.tabs.query finds the active YouTube tab
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Find the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if we're on YouTube
    const isYouTube = tab?.url?.includes('youtube.com/watch');

    if (!isYouTube) {
      showNoVideo();
      return;
    }

    // Ask the content script for the current video state
    chrome.tabs.sendMessage(tab.id, { type: 'GET_CURRENT_VIDEO' }, async (response) => {
      if (chrome.runtime.lastError || !response?.payload) {
        // Tab was already open before extension was loaded — inject content.js dynamically
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          // Wait 300ms for content.js to initialize then retry
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { type: 'GET_CURRENT_VIDEO' }, (retryResp) => {
              if (retryResp?.payload && retryResp.payload.videoId) {
                currentVideoData = retryResp.payload;
                updatePopupUI(retryResp.payload);
              } else {
                showNoVideo();
              }
            });
          }, 300);
        } catch (injectErr) {
          console.warn('Could not inject content script:', injectErr);
          showNoVideo();
        }
        return;
      }
      currentVideoData = response.payload;
      updatePopupUI(response.payload);
    });

    // Get today's total study time from background.js
    chrome.runtime.sendMessage({ type: 'GET_TODAY_MINUTES' }, (response) => {
      const minutes = response?.minutes || 0;
      const el = document.getElementById('popup-today-time');
      if (el) el.textContent = formatMinutes(minutes);
    });

    // Setup event listeners (Chrome MV3 requires addEventListener, disallows inline onclick)
    setupEventListeners();

  } catch (err) {
    console.error('Popup error:', err);
    showNoVideo();
  }
});

function setupEventListeners() {
  const domainSelect = document.getElementById('popup-domain-select');
  if (domainSelect) {
    chrome.storage.local.get('activeDomain', (res) => {
      if (res.activeDomain) domainSelect.value = res.activeDomain;
    });
    domainSelect.addEventListener('change', (e) => {
      chrome.storage.local.set({ activeDomain: e.target.value });
    });
  }

  const subjectSelect = document.getElementById('popup-subject-select');
  if (subjectSelect) {
    subjectSelect.addEventListener('change', (e) => assignSubject(e.target.value));
  }

  const btnBookmark = document.getElementById('btn-bookmark');
  if (btnBookmark) {
    btnBookmark.addEventListener('click', async () => {
      const catRow = document.getElementById('bookmark-cat-row');
      const timePrev = document.getElementById('bm-timestamp-preview');
      if (catRow) {
        const willShow = catRow.style.display === 'none';
        catRow.style.display = willShow ? 'block' : 'none';
        if (willShow) {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'GET_CURRENT_VIDEO' }, (resp) => {
              if (resp?.payload?.currentTime !== undefined) {
                currentVideoData = resp.payload;
                if (timePrev) {
                  timePrev.textContent = `⏱ At ${formatTimestamp(resp.payload.currentTime)}`;
                }
              }
            });
          }
          if (timePrev && currentVideoData?.currentTime !== undefined) {
            timePrev.textContent = `⏱ At ${formatTimestamp(currentVideoData.currentTime)}`;
          }
        }
      }
    });
  }

  document.querySelectorAll('.btn-bm-cat').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cat = e.currentTarget.getAttribute('data-category') || 'important';
      bookmarkVideo(cat);
    });
  });

  const btnStudyToggle = document.getElementById('btn-study-toggle');
  if (btnStudyToggle) {
    btnStudyToggle.addEventListener('click', toggleStudy);
  }

  const btnSyncNow = document.getElementById('btn-sync-now');
  if (btnSyncNow) {
    btnSyncNow.addEventListener('click', syncNow);
  }

  const btnOpenDash = document.getElementById('btn-open-dashboard');
  if (btnOpenDash) {
    btnOpenDash.addEventListener('click', syncNow);
  }

  const btnAddTest = document.getElementById('btn-add-test-video');
  if (btnAddTest) {
    btnAddTest.addEventListener('click', addTestSampleVideo);
  }
}

// ─── INSERT TEST STUDY VIDEO (For zero-friction verification) ──
async function addTestSampleVideo() {
  const btn = document.getElementById('btn-add-test-video');
  if (btn) btn.disabled = true;

  try {
    const res = await chrome.storage.local.get(['videos', 'activeDomain', 'dailySeconds']);
    const videos = res.videos || {};
    const domain = res.activeDomain || 'aktu';
    const testId = 'sample_dsa_' + Math.floor(Math.random() * 1000);

    videos[testId] = {
      videoId: testId,
      title: 'Data Structures & Algorithms - Arrays & Recursion (AKTU CSE)',
      channel: 'StudyPilot Academy',
      url: 'https://www.youtube.com/watch?v=sample_dsa',
      thumbnailUrl: 'https://img.youtube.com/vi/WQoB2z67hvY/mqdefault.jpg',
      playlistId: 'PL_AKTU_CSE_DS',
      playlistTitle: 'AKTU B.Tech Data Structures Full Course',
      duration: 3600,
      watchedSeconds: 1500,
      currentTime: 1500,
      completed: false,
      isStudy: true,
      subject: 'DS',
      domainId: domain,
      lastWatched: Date.now()
    };

    const todayKey = (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    })();

    const dailySeconds = res.dailySeconds || {};
    dailySeconds[todayKey] = (dailySeconds[todayKey] || 0) + 1500;

    await chrome.storage.local.set({
      videos,
      dailySeconds,
      todayMinutes: Math.floor(dailySeconds[todayKey] / 60)
    });

    if (btn) {
      btn.innerHTML = '✓ Sample Lecture Added! Opening Dashboard…';
      btn.style.color = '#16A34A';
      btn.style.borderColor = '#16A34A';
    }

    setTimeout(() => {
      syncNow();
    }, 800);

  } catch (err) {
    console.error('Test video error:', err);
    if (btn) btn.disabled = false;
  }
}

// ─── UPDATE POPUP UI ──────────────────────────────────────────
function updatePopupUI(data) {
  if (!data || !data.videoId) { showNoVideo(); return; }

  // Show video state, hide no-video state
  document.getElementById('no-video-state')?.classList.add('hidden');
  document.getElementById('video-state')?.classList.remove('hidden');

  // Video title and channel
  const titleEl   = document.getElementById('popup-video-title');
  const channelEl = document.getElementById('popup-channel');
  if (titleEl)   titleEl.textContent   = data.title   || 'Untitled video';
  if (channelEl) channelEl.textContent = data.channel || '';

  // Progress
  const duration    = data.duration     || 1;
  const currentTime = data.currentTime  || 0;
  const pct         = Math.min(100, Math.round((currentTime / duration) * 100));

  const barEl   = document.getElementById('popup-progress-bar');
  const pctEl   = document.getElementById('popup-pct');
  const timeEl  = document.getElementById('popup-watched-time');

  if (barEl)  barEl.style.width    = `${pct}%`;
  if (pctEl)  pctEl.textContent    = `${pct}% watched`;
  if (timeEl) timeEl.textContent   = formatSeconds(data.watchedSeconds || 0) + ' watched';

  // Completion badge
  const badgeEl = document.getElementById('popup-status-badge');
  if (badgeEl) {
    if (data.completed) {
      badgeEl.textContent  = 'Completed ✓';
      badgeEl.className    = 'badge badge-green';
    } else {
      badgeEl.textContent  = 'In Progress';
      badgeEl.className    = 'badge badge-yellow';
    }
  }

  // Subject dropdown
  if (data.subject) {
    const sel = document.getElementById('popup-subject-select');
    if (sel) sel.value = data.subject;
  }

  // Study toggle button
  isStudying = data.isStudy !== false;
  updateStudyToggle();
}

function showNoVideo() {
  document.getElementById('no-video-state')?.classList.remove('hidden');
  document.getElementById('video-state')?.classList.add('hidden');
}

// ─── ASSIGN SUBJECT ───────────────────────────────────────────
window.assignSubject = async function(subjectCode) {
  if (!currentVideoData?.videoId) return;

  // Send to background to update stored subject
  chrome.runtime.sendMessage({
    type:    'VIDEO_PROGRESS',
    payload: { ...currentVideoData, subject: subjectCode }
  });

  // Also send via tabs to update content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'SET_SUBJECT',
      subjectCode
    });
  }
};

// ─── BOOKMARK VIDEO ───────────────────────────────────────────
window.bookmarkVideo = async function(category = 'important') {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id && !currentVideoData?.videoId) return;

  // 1. Fetch exact live playback time from the active YouTube tab
  let videoData = currentVideoData;
  if (tab?.id) {
    try {
      const liveResp = await new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { type: 'GET_CURRENT_VIDEO' }, (r) => {
          if (chrome.runtime.lastError || !r) resolve(null);
          else resolve(r.payload);
        });
      });
      if (liveResp && liveResp.videoId) {
        videoData = liveResp;
        currentVideoData = liveResp;
      }
    } catch (e) {
      console.log('Live tab fetch note:', e);
    }
  }

  if (!videoData?.videoId) return;

  const domainSelect  = document.getElementById('popup-domain-select');
  const domainId      = domainSelect?.value || 'aktu';
  const currentTime   = Math.floor(videoData.currentTime || 0);
  const timeFormatted = formatTimestamp(currentTime);

  chrome.runtime.sendMessage({
    type:               'MARK_VIDEO_BOOKMARKED',
    videoId:            videoData.videoId,
    title:              videoData.title || 'Untitled',
    channel:            videoData.channel || '',
    url:                videoData.url || '',
    thumbnailUrl:       videoData.thumbnailUrl || '',
    playlistId:         videoData.playlistId || '',
    playlistTitle:      videoData.playlistTitle || '',
    category:           category,
    currentTime:        currentTime,
    timestampFormatted: timeFormatted,
    domainId:           domainId,
    subject:            videoData.subject || ''
  }, (response) => {
    if (response?.ok) {
      // Show visual confirmation
      const btn = document.getElementById('btn-bookmark');
      if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML  = `✓ Bookmarked at ${timeFormatted}!`;
        btn.style.background = '#16A34A';
        setTimeout(() => {
          btn.innerHTML        = original;
          btn.style.background = '';
        }, 2500);
      }
    }
  });

  // Hide category row after selection
  const catRow = document.getElementById('bookmark-cat-row');
  if (catRow) catRow.style.display = 'none';
};

// ─── TOGGLE STUDY / IGNORE ───────────────────────────────────
window.toggleStudy = async function() {
  isStudying = !isStudying;
  updateStudyToggle();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type:    'SET_STUDY_CLASSIFICATION',
      isStudy: isStudying
    });
  }
};

function updateStudyToggle() {
  const btn = document.getElementById('btn-study-toggle');
  if (!btn) return;

  if (isStudying) {
    btn.textContent  = '✓ Studying';
    btn.style.borderColor = '#16A34A';
    btn.style.color       = '#16A34A';
  } else {
    btn.textContent  = '✕ Ignoring';
    btn.style.borderColor = '#DC2626';
    btn.style.color       = '#DC2626';
  }
}

// ─── SYNC NOW ────────────────────────────────────────────────
// Focuses open dashboard or opens http://localhost:8000/pages/dashboard.html
window.syncNow = async function() {
  const statusEl = document.getElementById('sync-status');
  const dotEl    = document.getElementById('sync-dot');
  if (statusEl) statusEl.textContent = 'Opening dashboard…';
  if (dotEl)    dotEl.classList.add('syncing');

  try {
    const tabs = await chrome.tabs.query({});
    const dashTab = tabs.find(t => t.url && (t.url.includes('/pages/dashboard.html') || t.url.endsWith('dashboard.html')));
    if (dashTab && dashTab.id) {
      await chrome.tabs.update(dashTab.id, { active: true });
      if (dashTab.windowId) await chrome.windows.update(dashTab.windowId, { focused: true });
      if (statusEl) statusEl.textContent = 'Dashboard activated!';
      return;
    }
  } catch (err) {
    console.log('Tab query note:', err);
  }

  chrome.tabs.create({ url: 'http://localhost:8000/pages/dashboard.html' });
};

// ─── HELPERS ─────────────────────────────────────────────────
function formatSeconds(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatTimestamp(secs) {
  const s = Math.floor(secs || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function formatMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
