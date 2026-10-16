/* ============================================================
   sync.js — Seamless Extension-to-Firestore Synchronization.

   Supports dual communication channels:
   1. Injected bridge script via window.postMessage (Zero permission / port issues)
   2. Direct chrome.runtime.sendMessage fallback
   ============================================================ */

import { auth, db } from './firebase-config.js';
import {
  doc, setDoc, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Global connection state
window.__studypilot_extension_connected = false;
window.__studypilot_last_payload = null;

// Auto-detect extension when bridge broadcasts presence or changes
window.addEventListener('message', async (event) => {
  if (!event.data) return;

  if ((event.data.type === 'STUDYPILOT_EXTENSION_READY' || event.data.type === 'STUDYPILOT_PONG') && event.data.extensionId) {
    window.__studypilot_extension_connected = true;
    const extId = event.data.extensionId;
    localStorage.setItem('studypilot_extension_id', extId);

    updateExtensionBadge(true, extId, event.data.videosCount || 0);

    const extEl = document.getElementById('extension-id-input');
    const statEl = document.getElementById('ext-status');
    if (extEl && (!extEl.value || extEl.value !== extId)) extEl.value = extId;
    if (statEl) statEl.textContent = `✓ Extension active & connected (${extId.slice(0, 8)}…). Auto-sync is active.`;
  }

  // Reactive live sync: when YouTube playback updates in extension, auto-sync to Firestore
  if (event.data.type === 'STUDYPILOT_STORAGE_CHANGED' && event.data.payload) {
    window.__studypilot_extension_connected = true;
    window.__studypilot_last_payload = event.data.payload;
    if (auth?.currentUser) {
      console.log('[StudyPilot AI] Real-time storage update detected from extension. Syncing to Firestore…');
      const res = await syncExtensionData(auth.currentUser, event.data.payload);
      window.dispatchEvent(new CustomEvent('studypilot-extension-synced', { detail: res }));
    }
  }
});

// Ping extension bridge immediately upon loading
setTimeout(() => {
  window.postMessage({ type: 'STUDYPILOT_PING' }, '*');
}, 100);

export function updateExtensionBadge(isConnected, extId = '', count = 0) {
  const badge = document.getElementById('ext-conn-badge');
  if (badge) {
    if (isConnected) {
      badge.className = 'badge badge-green';
      badge.textContent = `● Extension Connected (${count} vids)`;
      badge.title = `StudyPilot AI Chrome Extension is active (${extId || 'Ready'})`;
    } else {
      badge.className = 'badge badge-yellow';
      badge.textContent = 'Extension Checking…';
      badge.title = 'Searching for StudyPilot Extension';
    }
  }
}

export function getExtensionId() {
  return localStorage.getItem('studypilot_extension_id') || '';
}

// ─── REQUEST PAYLOAD FROM EXTENSION (DUAL CHANNEL) ────────────
export async function requestExtensionData() {
  // 1. Try bridge content script with a 2000ms timeout
  const bridgePayload = await new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, 2000);

    function onResponse(event) {
      if (event.source !== window || !event.data) return;
      if (event.data.type === 'STUDYPILOT_SYNC_RESPONSE') {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          window.removeEventListener('message', onResponse);
          if (event.data.payload) {
            window.__studypilot_extension_connected = true;
            if (event.data.payload.extensionId) {
              localStorage.setItem('studypilot_extension_id', event.data.payload.extensionId);
            }
            resolve(event.data.payload);
          } else {
            resolve(null);
          }
        }
      }
    }

    window.addEventListener('message', onResponse);
    window.postMessage({ type: 'STUDYPILOT_REQUEST_SYNC' }, '*');
  });

  if (bridgePayload && (bridgePayload.videos !== undefined || bridgePayload.bookmarks !== undefined)) {
    window.__studypilot_last_payload = bridgePayload;
    return bridgePayload;
  }

  // 2. Fallback to direct chrome.runtime.sendMessage if available
  const extId = getExtensionId();
  if (extId && typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    try {
      const resp = await sendMessageToExtension(extId, { type: 'GET_ALL_VIDEOS' });
      if (resp && (resp.videos !== undefined || resp.bookmarks !== undefined)) {
        window.__studypilot_extension_connected = true;
        window.__studypilot_last_payload = resp;
        return resp;
      }
    } catch (err) {
      console.warn('Direct extension messaging skipped:', err.message);
    }
  }

  // 3. Fallback to cached payload from recent storage event
  if (window.__studypilot_last_payload) {
    return window.__studypilot_last_payload;
  }

  return null;
}

// ─── SYNC EXTENSION DATA TO FIRESTORE ─────────────────────────
export async function syncExtensionData(user, preloadedPayload = null) {
  if (!user) return { status: 'no_user', count: 0 };

  try {
    const response = preloadedPayload || await requestExtensionData();
    if (!response) {
      updateExtensionBadge(false);
      return { status: 'not_connected', count: 0, message: 'Could not connect to extension.' };
    }

    const videos = response.videos || {};
    const bookmarks = response.bookmarks || {};
    const keys = Object.keys(videos);
    const bmKeys = Object.keys(bookmarks);

    updateExtensionBadge(true, response.extensionId || getExtensionId(), keys.length);

    if (keys.length === 0 && bmKeys.length === 0) {
      return {
        status: 'empty',
        count: 0,
        message: 'Extension is connected, but 0 videos have been tracked yet. Open a YouTube lecture and start watching!'
      };
    }

    const batch = writeBatch(db);
    let batchCount = 0;
    const dailyTotals = {};

    // 1. Sync Videos
    keys.forEach(videoId => {
      const v = videos[videoId];
      if (v.isStudy === false) return;

      const docRef = doc(db, 'videos', `${user.uid}_${videoId}`);
      batch.set(docRef, {
        userId:             user.uid,
        videoId:            v.videoId || videoId,
        title:              v.title         || 'Untitled',
        channel:            v.channel       || '',
        url:                v.url           || '',
        thumbnailUrl:       v.thumbnailUrl  || '',
        playlistId:         v.playlistId    || '',
        playlistTitle:      v.playlistTitle || '',
        duration:           v.duration      || 0,
        watchedSeconds:     v.watchedSeconds || 0,
        currentTime:        v.currentTime   || 0,
        completed:          v.completed     || false,
        subject:            v.subject       || '',
        domainId:           v.domainId      || response.activeDomain || 'aktu',
        lastWatched:        new Date(v.lastWatched || Date.now()),
        syncedAt:           serverTimestamp()
      }, { merge: true });

      // If marked bookmarked directly on the video record
      if (v.bookmarked && v.bookmarkCategory) {
        const timeSec = Math.floor(v.bookmarkTimestamp !== undefined ? v.bookmarkTimestamp : (v.currentTime || 0));
        const docId = `${user.uid}_${videoId}_${timeSec}`;
        const bmRef = doc(db, 'bookmarks', docId);
        let timeFormatted = v.timestampFormatted;
        if (!timeFormatted || timeFormatted === '0s') {
          const m = Math.floor(timeSec / 60);
          const s = timeSec % 60;
          timeFormatted = `${m}:${String(s).padStart(2, '0')}`;
        }
        let watchUrl = v.url || `https://youtube.com/watch?v=${videoId}`;
        if (watchUrl.includes('youtube.com')) {
          const clean = watchUrl.replace(/[?&]t=\d+s?/, '');
          watchUrl = clean.includes('?') ? `${clean}&t=${timeSec}s` : `${clean}?t=${timeSec}s`;
        }

        batch.set(bmRef, {
          userId:             user.uid,
          bookmarkId:         `${videoId}_${timeSec}`,
          videoId:            v.videoId || videoId,
          title:              v.title         || 'Untitled',
          thumbnailUrl:       v.thumbnailUrl  || '',
          channel:            v.channel       || '',
          category:           v.bookmarkCategory || 'important',
          subject:            v.subject       || '',
          timestamp:          timeSec,
          timestampFormatted: timeFormatted,
          domainId:           v.domainId      || response.activeDomain || 'aktu',
          url:                watchUrl,
          createdAt:          serverTimestamp()
        }, { merge: true });
      }

      if (v.lastWatched) {
        const d = new Date(v.lastWatched);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dailyTotals[key] = (dailyTotals[key] || 0) + (v.watchedSeconds || 0);
      }

      batchCount++;
    });

    // 2. Sync Dedicated Bookmarks Store (strictly deduplicated by videoId + timestamp)
    const seenDedupeKeys = new Set();
    const cleanSyncedBookmarks = {};

    bmKeys.forEach(bId => {
      const b = bookmarks[bId];
      if (!b) return;
      const vid = b.videoId || bId;
      const timeSec = Math.floor(b.timestamp !== undefined ? b.timestamp : 0);
      const dedupeKey = `${vid}_${timeSec}`;
      if (seenDedupeKeys.has(dedupeKey)) return;
      seenDedupeKeys.add(dedupeKey);

      cleanSyncedBookmarks[dedupeKey] = { ...b, id: dedupeKey, videoId: vid, timestamp: timeSec };

      const docId = `${user.uid}_${dedupeKey}`;
      const bmRef = doc(db, 'bookmarks', docId);

      let timeFormatted = b.timestampFormatted;
      if (!timeFormatted || timeFormatted === '0s') {
        const m = Math.floor(timeSec / 60);
        const s = timeSec % 60;
        timeFormatted = `${m}:${String(s).padStart(2, '0')}`;
      }

      let watchUrl = b.url || `https://youtube.com/watch?v=${vid}`;
      if (watchUrl.includes('youtube.com')) {
        const clean = watchUrl.replace(/[?&]t=\d+s?/, '');
        watchUrl = clean.includes('?') ? `${clean}&t=${timeSec}s` : `${clean}?t=${timeSec}s`;
      }

      batch.set(bmRef, {
        userId:             user.uid,
        bookmarkId:         dedupeKey,
        videoId:            vid,
        title:              b.title         || 'Untitled',
        thumbnailUrl:       b.thumbnailUrl  || '',
        channel:            b.channel       || '',
        category:           b.category      || 'important',
        subject:            b.subject       || '',
        timestamp:          timeSec,
        timestampFormatted: timeFormatted,
        domainId:           b.domainId      || response.activeDomain || 'aktu',
        url:                watchUrl,
        createdAt:          serverTimestamp()
      }, { merge: true });
      batchCount++;
    });

    // Save to LocalStorage immediately for instant UI availability & resilience
    try {
      localStorage.setItem('studypilot_synced_videos', JSON.stringify(videos));
      localStorage.setItem('studypilot_synced_bookmarks', JSON.stringify(cleanSyncedBookmarks));
      if (response.todayMinutes !== undefined) {
        localStorage.setItem('studypilot_today_minutes', String(response.todayMinutes));
      }
    } catch (lsErr) {
      console.warn('LocalStorage sync cache write note:', lsErr);
    }

    if (batchCount > 0 && db && user?.uid) {
      try {
        await batch.commit();
        console.log(`Sync: Successfully synced ${batchCount} records to Firestore.`);
      } catch (firestoreErr) {
        console.warn('Firestore cloud sync commit note (local sync cached successfully):', firestoreErr);
      }
    }

    // 3. Write Daily Activity Totals (merge with dailySeconds from extension if present)
    if (response.dailySeconds) {
      Object.entries(response.dailySeconds).forEach(([dateKey, sec]) => {
        dailyTotals[dateKey] = Math.max(dailyTotals[dateKey] || 0, sec);
      });
    }

    if (db && user?.uid) {
      for (const [dateKey, totalSeconds] of Object.entries(dailyTotals)) {
        try {
          const actRef = doc(db, 'dailyActivity', `${user.uid}_${dateKey}`);
          const totalMinutes = Math.floor(totalSeconds / 60);

          await setDoc(actRef, {
            userId:       user.uid,
            date:         dateKey,
            totalMinutes: totalMinutes,
            totalSeconds: totalSeconds,
            updatedAt:    serverTimestamp()
          }, { merge: true });
        } catch (actErr) {
          console.warn('Daily activity sync note:', actErr);
        }
      }
    }

    const res = {
      status: 'synced',
      count: batchCount || keys.length,
      videosCount: keys.length,
      bookmarksCount: bmKeys.length
    };

    window.dispatchEvent(new CustomEvent('studypilot-extension-synced', { detail: res }));
    return res;

  } catch (err) {
    console.error('Sync error:', err);
    return { status: 'error', count: 0, error: err.message };
  }
}

function sendMessageToExtension(extensionId, message) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(extensionId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

// ─── INSERT SAMPLE STUDY LECTURE (DEBUG & INSTANT TEST) ───────
export function insertSampleVideoAndSync() {
  window.postMessage({
    type: 'STUDYPILOT_INSERT_DEMO_DATA',
    title: 'Data Structures: Arrays, Trees & Graphs - AKTU Unit 1'
  }, '*');

  setTimeout(() => {
    if (auth?.currentUser) syncExtensionData(auth.currentUser);
  }, 500);
}

// Global hooks for manual testing in browser console or UI
window.syncStudyPilotExtension = () => syncExtensionData(auth.currentUser);
window.requestExtensionData    = requestExtensionData;
window.insertSampleVideoAndSync = insertSampleVideoAndSync;
