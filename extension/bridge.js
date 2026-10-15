/* ============================================================
   bridge.js — StudyPilot AI Web-to-Extension Bridge Script.
   Pure event-driven architecture (Zero background timers)
   Prevents "Extension context invalidated" errors completely.
   ============================================================ */

(function() {
  // Safe context check helper
  function isAlive() {
    try {
      return Boolean(typeof chrome !== 'undefined' && chrome?.runtime?.id);
    } catch (e) {
      return false;
    }
  }

  // Initial one-time announcement that extension is loaded in this tab
  try {
    if (isAlive()) {
      window.postMessage({
        type: 'STUDYPILOT_EXTENSION_READY',
        extensionId: chrome.runtime.id
      }, '*');
    }
  } catch (e) {}

  // 1. Storage change listener — reactive real-time sync when videos or bookmarks are saved
  try {
    if (chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        try {
          if (!isAlive()) return;
          if (areaName === 'local' && (changes.videos || changes.bookmarks || changes.todayMinutes)) {
            chrome.storage.local.get(['videos', 'bookmarks', 'activeDomain', 'todayMinutes', 'dailySeconds'], (result) => {
              try {
                if (!isAlive()) return;
                window.postMessage({
                  type: 'STUDYPILOT_STORAGE_CHANGED',
                  payload: {
                    ok: true,
                    extensionId: chrome.runtime?.id || '',
                    videos: result?.videos || {},
                    bookmarks: result?.bookmarks || {},
                    activeDomain: result?.activeDomain || 'aktu',
                    todayMinutes: result?.todayMinutes || 0,
                    dailySeconds: result?.dailySeconds || {}
                  }
                }, '*');
              } catch (err) {}
            });
          }
        } catch (err) {}
      });
    }
  } catch (e) {}

  // 2. Window message handler — listens only when webpage specifically requests data
  function onWindowMessage(event) {
    if (event.source !== window || !event.data) return;

    // If context is dead, stop listening immediately
    if (!isAlive()) {
      window.removeEventListener('message', onWindowMessage);
      return;
    }

    // Ping request
    if (event.data.type === 'STUDYPILOT_PING') {
      try {
        window.postMessage({
          type: 'STUDYPILOT_PONG',
          extensionId: chrome.runtime?.id || ''
        }, '*');
      } catch (e) {
        window.removeEventListener('message', onWindowMessage);
      }
      return;
    }

    // Sync request
    if (event.data.type === 'STUDYPILOT_REQUEST_SYNC') {
      try {
        if (chrome?.storage?.local) {
          chrome.storage.local.get(['videos', 'bookmarks', 'activeDomain', 'todayMinutes', 'dailySeconds'], (result) => {
            try {
              if (!isAlive()) return;
              window.postMessage({
                type: 'STUDYPILOT_SYNC_RESPONSE',
                payload: {
                  ok: true,
                  extensionId: chrome.runtime?.id || '',
                  videos: result?.videos || {},
                  bookmarks: result?.bookmarks || {},
                  activeDomain: result?.activeDomain || 'aktu',
                  todayMinutes: result?.todayMinutes || 0,
                  dailySeconds: result?.dailySeconds || {}
                }
              }, '*');
            } catch (err) {}
          });
        }
      } catch (err) {
        window.removeEventListener('message', onWindowMessage);
      }
      return;
    }

    // Insert demo video / test data
    if (event.data.type === 'STUDYPILOT_INSERT_DEMO_DATA') {
      try {
        const demoVideoId = 'demo_' + Date.now();
        chrome.storage.local.get(['videos', 'activeDomain'], (res) => {
          try {
            if (!isAlive()) return;
            const videos = res?.videos || {};
            const domain = res?.activeDomain || 'aktu';
            videos[demoVideoId] = {
              videoId: demoVideoId,
              title: event.data.title || 'Data Structures & Algorithms in C++ - Full Course (Lecture 1)',
              channel: 'CodeHelp - by Babbar',
              url: 'https://www.youtube.com/watch?v=WQoB2z67hvY',
              thumbnailUrl: 'https://img.youtube.com/vi/WQoB2z67hvY/mqdefault.jpg',
              playlistId: 'PLDzeHZWIZsTryvtXdMr6rPh4IDexB5NIA',
              playlistTitle: 'Complete C++ Placement Course',
              duration: 3600,
              watchedSeconds: 1800,
              currentTime: 1800,
              completed: false,
              isStudy: true,
              subject: 'DS',
              domainId: domain,
              lastWatched: Date.now()
            };
            chrome.storage.local.set({ videos }, () => {
              window.postMessage({ type: 'STUDYPILOT_DEMO_INSERTED', ok: true }, '*');
            });
          } catch (e) {}
        });
      } catch (err) {
        window.removeEventListener('message', onWindowMessage);
      }
    }
  }

  window.addEventListener('message', onWindowMessage);

  if (isAlive()) {
    console.log('[StudyPilot AI] Extension bridge active. Zero-timer event model.');
  }
})();
