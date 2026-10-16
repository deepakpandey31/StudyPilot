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

  // Auto-detect subject from video title
  const detected = autoDetectSubjectFromTitle(data.title);
  const subjectNameEl = document.getElementById('popup-subject-name');
  if (subjectNameEl) {
    if (detected) {
      subjectNameEl.textContent = `${detected.code} — ${detected.name}`;
      subjectNameEl.title = `${detected.code} — ${detected.name}`;
      subjectNameEl.style.color = 'var(--color-primary)';
    } else {
      subjectNameEl.textContent = 'Auto-categorized by Topic';
      subjectNameEl.style.color = 'var(--color-muted)';
    }
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

  // Auto-detect subject from video title
  const detected = autoDetectSubjectFromTitle(videoData.title);
  const autoSubject = detected ? `${detected.code} — ${detected.name}` : (videoData.subject || '');
  const autoCode = detected ? detected.code : '';

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
    subject:            autoSubject,
    subjectCode:        autoCode
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
