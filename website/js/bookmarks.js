/* ============================================================
   bookmarks.js — Multi-domain video bookmark manager with exact
   playback timestamp capture and direct YouTube jump-to-time navigation.

   Features:
   - Instant LocalStorage resilience (0ms latency, works offline & online)
   - Real-time Chrome Extension automatic synchronization
   - Exact timestamp navigation: https://youtube.com/watch?v=ID&t=Xs
   - Dual-persistence: LocalStorage cache + Firestore Cloud Sync
   - Category filters: All, Important, Revision, Difficult Topic, Doubt
   ============================================================ */

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection, getDocs, deleteDoc, doc, addDoc, setDoc,
  serverTimestamp, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { DomainManager, getActiveDomainId, getActiveDomain } from './domain-manager.js';
import { syncExtensionData, updateExtensionBadge, requestExtensionData } from './sync.js';

let currentUser     = null;
let currentDomainId = getActiveDomainId() || 'aktu';
let allBookmarks    = [];
let activeCategory  = 'all';
let searchQuery     = '';

// ─── INSTANT BOOTSTRAP (Zero Delay UI) ────────────────────────
// 1. Instantly display user info from cache so "Loading…" never lingers
try {
  const cachedName = localStorage.getItem('studypilot_user_name') || 'Student';
  const cachedEmail = localStorage.getItem('studypilot_user_email') || '';
  renderUserInfo({ displayName: cachedName, email: cachedEmail });
} catch (e) {}

// 2. Instantly load cached bookmarks and render UI
loadBookmarksFromCache();

// 3. Initialize domain tabs
try {
  DomainManager.renderDomainTabs();
} catch (e) {}

// ─── AUTH STATE LISTENER ──────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    try {
      localStorage.setItem('studypilot_user_name', user.displayName || 'Student');
      if (user.email) localStorage.setItem('studypilot_user_email', user.email);
      localStorage.setItem('studypilot_user_uid', user.uid);
    } catch (e) {}
    renderUserInfo(user);

    // Initialize DomainManager for this user
    try {
      await DomainManager.init('domain-selector-container', (domainId) => {
        currentDomainId = domainId;
        const addDomainSel = document.getElementById('bm-add-domain');
        if (addDomainSel) addDomainSel.value = domainId;
        filterAndRender();
      });
    } catch (dmErr) {
      console.warn('DomainManager init note:', dmErr);
    }

    currentDomainId = DomainManager.getActiveDomainId();
    const addDomainSel = document.getElementById('bm-add-domain');
    if (addDomainSel) addDomainSel.value = currentDomainId;

    // Load from Firestore and merge with local bookmarks
    await loadBookmarksFromFirestore();

    // Background sync with extension
    syncExtensionData(user).then((res) => {
      if (res && res.status === 'synced' && (res.bookmarksCount > 0 || res.count > 0)) {
        loadBookmarksFromCache();
      }
    }).catch((syncErr) => {
      console.log('Bookmarks extension sync note:', syncErr);
    });

  } else {
    // If not signed in and not local preview, redirect
    const isLocalPreview = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalPreview) {
      window.location.href = '../index.html';
    } else {
      renderUserInfo({ displayName: 'Student', email: 'student@studypilot.local' });
    }
  }
});

// Live listener for real-time background sync from extension
window.addEventListener('studypilot-extension-synced', async (e) => {
  console.log('[StudyPilot AI] Bookmarks extension sync event received. Updating list…');
  loadBookmarksFromCache();
  if (currentUser) {
    await loadBookmarksFromFirestore();
  }
});

// ─── CACHE-FIRST BOOKMARK LOADING ─────────────────────────────
function loadBookmarksFromCache() {
  const mergedMap = new Map();

  // 1. Read locally added bookmarks
  try {
    const rawLocal = localStorage.getItem('studypilot_local_bookmarks');
    if (rawLocal) {
      const list = JSON.parse(rawLocal);
      if (Array.isArray(list)) {
        list.forEach(b => {
          const key = b.id || `${b.videoId}_${b.timestamp}`;
          mergedMap.set(key, b);
        });
      }
    }
  } catch (e) {}

  // 2. Read synced bookmarks from extension
  try {
    const rawSynced = localStorage.getItem('studypilot_synced_bookmarks');
    if (rawSynced) {
      const map = JSON.parse(rawSynced);
      Object.entries(map).forEach(([key, b]) => {
        if (!b) return;
        const uniqueKey = b.id || `${b.videoId || key}_${b.timestamp || 0}`;
        if (!mergedMap.has(uniqueKey)) {
          mergedMap.set(uniqueKey, {
            id: uniqueKey,
            ...b,
            domainId: b.domainId || currentDomainId || 'aktu',
            category: b.category || 'important'
          });
        }
      });
    }
  } catch (e) {}

  allBookmarks = Array.from(mergedMap.values());
  sortBookmarks();
  filterAndRender();
}

async function loadBookmarksFromFirestore() {
  if (!currentUser || !db) return;

  try {
    const q = query(
      collection(db, 'bookmarks'),
      where('userId', '==', currentUser.uid)
    );
    const snap = await getDocs(q);

    const firestoreList = [];
    snap.forEach(docSnap => {
      firestoreList.push({ id: docSnap.id, ...docSnap.data() });
    });

    if (firestoreList.length > 0) {
      const mergedMap = new Map();
      // Keep existing memory list
      allBookmarks.forEach(b => {
        const k = b.id || `${b.videoId}_${b.timestamp}`;
        mergedMap.set(k, b);
      });
      // Merge firestore list
      firestoreList.forEach(b => {
        const k = b.id || `${b.videoId}_${b.timestamp}`;
        mergedMap.set(k, b);
      });

      allBookmarks = Array.from(mergedMap.values());
      sortBookmarks();

      // Mirror to local cache
      try {
        localStorage.setItem('studypilot_local_bookmarks', JSON.stringify(allBookmarks));
      } catch (e) {}

      filterAndRender();
    }
  } catch (err) {
    console.warn('Firestore bookmarks query note:', err);
  }
}

function sortBookmarks() {
  allBookmarks.sort((a, b) => {
    const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return tB - tA;
  });
}

// ─── FILTER AND RENDER ────────────────────────────────────────
function filterAndRender() {
  let filtered = allBookmarks.filter(bm => {
    // 1. Domain filter (default legacy bookmarks to 'aktu')
    const bmDomain = bm.domainId || 'aktu';
    if (bmDomain !== currentDomainId) return false;

    // 2. Category filter
    if (activeCategory !== 'all' && bm.category !== activeCategory) return false;

    // 3. Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle   = (bm.title || '').toLowerCase().includes(q);
      const matchSubject = (bm.subject || '').toLowerCase().includes(q);
      const matchChannel = (bm.channel || '').toLowerCase().includes(q);
      if (!matchTitle && !matchSubject && !matchChannel) return false;
    }

    return true;
  });

  renderBookmarks(filtered);
}

// ─── RENDER BOOKMARKS ─────────────────────────────────────────
function renderBookmarks(list) {
  const gridEl  = document.getElementById('bookmarks-grid');
  const emptyEl = document.getElementById('bookmarks-empty');
  if (!gridEl) return;

  if (list.length === 0) {
    gridEl.innerHTML = '';
    if (emptyEl) {
      emptyEl.classList.remove('hidden');
      const domain = DomainManager.getActiveDomain ? DomainManager.getActiveDomain() : { name: 'this domain' };
      const domainName = domain?.name || 'this domain';
      emptyEl.querySelector('p').innerHTML = `No bookmarks in <strong>${escapeHtml(domainName)}</strong>.<br/>Click "+ Add Bookmark" or save directly from the Chrome extension with exact video timestamps.`;
    }
    return;
  }

  if (emptyEl) emptyEl.classList.add('hidden');

  let html = '';
  list.forEach(bm => {
    const thumb = bm.thumbnailUrl
      ? `<img src="${escapeHtml(bm.thumbnailUrl)}" alt="Video thumbnail" loading="lazy" />`
      : `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`;

    const categoryMap = {
      important: { label: 'Important', badge: 'badge-red' },
      revision:  { label: 'Revision',  badge: 'badge-blue' },
      difficult: { label: 'Difficult Topic', badge: 'badge-yellow' },
      doubt:     { label: 'Doubt',     badge: 'badge-gray' }
    };

    const catInfo = categoryMap[bm.category] || { label: bm.category || 'Bookmark', badge: 'badge-gray' };

    // Format timestamp string & jump URL
    const sec = Math.floor(bm.timestamp || 0);
    const timeFormatted = bm.timestampFormatted || (sec > 0 ? formatTimestampSec(sec) : '');

    let watchUrl = bm.url || (bm.videoId ? `https://youtube.com/watch?v=${bm.videoId}` : '#');
    if (watchUrl.includes('youtube.com') && sec > 0 && !watchUrl.includes('&t=') && !watchUrl.includes('?t=')) {
      watchUrl = watchUrl.includes('?') ? `${watchUrl}&t=${sec}s` : `${watchUrl}?t=${sec}s`;
    }

    const dateStr = bm.createdAt?.toDate
      ? bm.createdAt.toDate().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
      : (bm.createdAt ? new Date(bm.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Saved');

    html += `
      <div class="bookmark-card">
        <a href="${escapeHtml(watchUrl)}" target="_blank" rel="noopener noreferrer" class="bookmark-thumb" title="Jump to ${timeFormatted || 'video'} on YouTube">
          ${thumb}
        </a>
        <div class="bookmark-title" title="${escapeHtml(bm.title || 'Untitled Bookmark')}">
          ${escapeHtml(bm.title || 'Untitled Bookmark')}
        </div>
        <div class="bookmark-meta">
          <span class="badge ${catInfo.badge}">${escapeHtml(catInfo.label)}</span>
          ${timeFormatted ? `
            <a href="${escapeHtml(watchUrl)}" target="_blank" rel="noopener noreferrer" class="badge badge-purple" title="Click to jump to exact timestamp" style="text-decoration:none; display:inline-flex; align-items:center; gap:3px;">
              ⏱ ${escapeHtml(timeFormatted)}
            </a>
          ` : ''}
          <span style="color:var(--color-text-muted); font-size:11px;">${escapeHtml(bm.subject || 'General')}</span>
          <span style="color:var(--color-text-muted); font-size:11px; margin-left:auto;">${dateStr}</span>
        </div>
        <div class="bookmark-actions">
          <a href="${escapeHtml(watchUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="flex:1; text-align:center; text-decoration:none;">
            ${timeFormatted ? `▶ Jump to ${escapeHtml(timeFormatted)}` : '▶ Watch Video'}
          </a>
          <button class="btn btn-ghost btn-sm" onclick="window.removeBookmark('${escapeHtml(bm.id)}')" title="Delete bookmark" aria-label="Delete bookmark">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
  });

  gridEl.innerHTML = html;
}

// ─── WINDOW EXPOSED ACTIONS ───────────────────────────────────

window.filterBookmarks = function(category) {
  activeCategory = category;
  ['all', 'important', 'revision', 'difficult', 'doubt'].forEach(c => {
    const el = document.getElementById(`filter-${c}`);
    if (el) el.classList.toggle('active', c === category);
  });
  filterAndRender();
};

window.onSearchInput = function(val) {
  searchQuery = (val || '').trim();
  filterAndRender();
};

window.toggleAddBookmarkModal = function(show) {
  const modal = document.getElementById('add-bookmark-modal');
  if (modal) {
    modal.style.display = show ? 'flex' : 'none';
    if (show) {
      const titleInput = document.getElementById('bm-add-title');
      if (titleInput) titleInput.focus();
    }
  }
};

window.addBookmark = async function(event) {
  if (event) event.preventDefault();

  const titleEl = document.getElementById('bm-add-title');
  const urlEl   = document.getElementById('bm-add-url');
  const timeEl  = document.getElementById('bm-add-timestamp');
  const domEl   = document.getElementById('bm-add-domain');
  const catEl   = document.getElementById('bm-add-cat');
  const subjEl  = document.getElementById('bm-add-subj');
  const btn     = document.getElementById('bm-add-btn');

  const title     = titleEl?.value.trim() || '';
  const url       = urlEl?.value.trim()   || '';
  const timeRaw   = timeEl?.value.trim()  || '';
  const domainId  = domEl?.value          || currentDomainId || 'aktu';
  const category  = catEl?.value          || 'important';
  const subject   = subjEl?.value.trim()  || 'General';

  if (!title || !url) {
    showToast('Please enter both title and video URL.', 'error');
    return;
  }

  // Parse timestamp (accepts "MM:SS", "H:MM:SS", or seconds "755", or url "?t=123")
  let timestampSeconds = 0;
  let timestampFormatted = '';

  if (timeRaw) {
    if (timeRaw.includes(':')) {
      const parts = timeRaw.split(':').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        timestampSeconds = parts[0] * 60 + parts[1];
        timestampFormatted = timeRaw;
      } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        timestampSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        timestampFormatted = timeRaw;
      }
    } else {
      const parsedSec = parseInt(timeRaw, 10);
      if (!isNaN(parsedSec)) {
        timestampSeconds = parsedSec;
        timestampFormatted = formatTimestampSec(parsedSec);
      }
    }
  }

  // If timestamp wasn't in field, check if it was embedded in the URL (e.g. ?t=75s)
  if (timestampSeconds === 0) {
    const tMatch = url.match(/[?&]t=(\d+)s?/);
    if (tMatch && tMatch[1]) {
      timestampSeconds = parseInt(tMatch[1], 10);
      timestampFormatted = formatTimestampSec(timestampSeconds);
    }
  }

  // Extract YouTube videoId
  let videoId = '';
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.searchParams.get('v')) {
      videoId = parsedUrl.searchParams.get('v');
    } else if (parsedUrl.hostname.includes('youtu.be')) {
      videoId = parsedUrl.pathname.replace('/', '');
    }
  } catch (e) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) videoId = match[1];
  }

  // Direct YouTube watch URL with timestamp
  let jumpUrl = url;
  if (timestampSeconds > 0 && jumpUrl.includes('youtube.com')) {
    const cleanUrl = jumpUrl.replace(/[?&]t=\d+s?/, '');
    jumpUrl = cleanUrl.includes('?') ? `${cleanUrl}&t=${timestampSeconds}s` : `${cleanUrl}?t=${timestampSeconds}s`;
  }

  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';
  const bookmarkId = `bm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const userUid = currentUser?.uid || localStorage.getItem('studypilot_user_uid') || 'local_user';

  const newBookmark = {
    id:                 bookmarkId,
    userId:             userUid,
    title:              title,
    url:                jumpUrl,
    videoId:            videoId,
    thumbnailUrl:       thumbnailUrl,
    timestamp:          timestampSeconds,
    timestampFormatted: timestampFormatted || (timestampSeconds > 0 ? formatTimestampSec(timestampSeconds) : ''),
    domainId:           domainId,
    category:           category,
    subject:            subject,
    createdAt:          new Date().toISOString()
  };

  // 1. Immediately save to LocalStorage for 100% offline & instant guarantee
  try {
    let localList = [];
    const rawLocal = localStorage.getItem('studypilot_local_bookmarks');
    if (rawLocal) localList = JSON.parse(rawLocal);
    localList.unshift(newBookmark);
    localStorage.setItem('studypilot_local_bookmarks', JSON.stringify(localList));
  } catch (e) {}

  // 2. Put in memory and render immediately
  allBookmarks.unshift(newBookmark);
  filterAndRender();

  // 3. Close modal & reset form
  window.toggleAddBookmarkModal(false);
  if (titleEl) titleEl.value = '';
  if (urlEl)   urlEl.value   = '';
  if (timeEl)  timeEl.value  = '';
  if (subjEl)  subjEl.value  = '';

  showToast('✓ Bookmark added successfully!', 'success');

  // 4. Background Cloud Sync to Firestore
  if (currentUser && db) {
    if (btn) btn.disabled = true;
    try {
      const docRef = doc(db, 'bookmarks', `${currentUser.uid}_${bookmarkId}`);
      await setDoc(docRef, {
        ...newBookmark,
        createdAt: serverTimestamp()
      }, { merge: true });
      console.log('Bookmark synced to Firestore cloud.');
    } catch (fsErr) {
      console.warn('Firestore cloud bookmark write note (saved locally):', fsErr);
    } finally {
      if (btn) btn.disabled = false;
    }
  }
};

window.removeBookmark = async function(id) {
  if (!confirm('Remove this bookmark?')) return;

  // 1. Remove from in-memory list
  allBookmarks = allBookmarks.filter(bm => bm.id !== id);
  filterAndRender();

  // 2. Remove from LocalStorage
  try {
    const rawLocal = localStorage.getItem('studypilot_local_bookmarks');
    if (rawLocal) {
      let list = JSON.parse(rawLocal);
      list = list.filter(bm => bm.id !== id);
      localStorage.setItem('studypilot_local_bookmarks', JSON.stringify(list));
    }
  } catch (e) {}

  showToast('Bookmark removed.', 'info');

  // 3. Remove from Firestore
  if (currentUser && db) {
    try {
      const docRef = doc(db, 'bookmarks', id.startsWith(currentUser.uid) ? id : `${currentUser.uid}_${id}`);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Could not remove from Firestore (removed locally):', err);
    }
  }
};

window.handleManualBookmarkSync = async function() {
  const btn = document.getElementById('manual-bm-sync-btn');
  const txt = document.getElementById('manual-bm-sync-btn-text');
  if (btn) btn.disabled = true;
  if (txt) txt.textContent = 'Syncing…';

  try {
    const res = await syncExtensionData(currentUser || { uid: 'local_user' });
    if (!res || res.status === 'not_connected') {
      showToast('Extension not detected. Make sure StudyPilot extension is active.', 'error');
    } else {
      loadBookmarksFromCache();
      const bmCount = res.bookmarksCount || 0;
      showToast(`✓ Bookmarks synced from extension (${bmCount} bookmark${bmCount === 1 ? '' : 's'}).`, 'success');
    }
  } catch (err) {
    console.error('Manual bookmark sync error:', err);
    showToast('Sync note: ' + err.message, 'info');
  } finally {
    if (btn) btn.disabled = false;
    if (txt) txt.textContent = 'Sync Bookmarks';
  }
};

window.handleLogout = async function() {
  try {
    await signOut(auth);
  } catch (e) {}
  localStorage.removeItem('studypilot_user_name');
  localStorage.removeItem('studypilot_user_email');
  localStorage.removeItem('studypilot_user_uid');
  window.location.href = '../index.html';
};

// ─── UTILITIES ────────────────────────────────────────────────
function formatTimestampSec(totalSec) {
  const s = Math.floor(totalSec || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function renderUserInfo(user) {
  const name = user?.displayName || 'Student';
  const av   = document.getElementById('sidebar-avatar');
  const nm   = document.getElementById('sidebar-name');
  const em   = document.getElementById('sidebar-email');
  if (av) av.textContent = (name.charAt(0) || 'S').toUpperCase();
  if (nm) nm.textContent = name;
  if (em) em.textContent = user?.email || '';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
