/* ============================================================
   todos.js — High-performance To-Do list with 0ms instant loading,
   offline-first LocalStorage caching, and background Firestore sync.
   ============================================================ */

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc,
  query, where, doc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { DomainManager } from './domain-manager.js';

let currentUser     = null;
let currentDomainId = localStorage.getItem('studypilot_active_domain') || 'aktu';
let showingTab      = 'pending';
let allLocalTodos   = [];

// ─── INSTANT ZERO-DELAY BOOTSTRAP (0ms Render) ────────────────
try {
  DomainManager.renderDomainTabs();
} catch (e) {}

// Initial synchronous load and render from memory / local cache
loadTodosFromCache();

// ─── AUTH GUARD & BACKGROUND CLOUD SYNC ───────────────────────
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    renderUserInfo(user);

    // Initialize Domain Manager
    try {
      await DomainManager.init('domain-selector-container', (domainId) => {
        currentDomainId = domainId;
        localStorage.setItem('studypilot_active_domain', domainId);
        filterAndRenderTodos();
        if (currentUser) syncTodosFromCloud();
      });
    } catch (e) {}

    currentDomainId = DomainManager.getActiveDomainId() || currentDomainId;

    // Background sync from cloud without blocking screen
    syncTodosFromCloud();

  } else {
    const isLocalPreview = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalPreview) {
      window.location.href = '../index.html';
    }
  }
});

// ─── CACHE-FIRST TODO LOADING (0ms) ───────────────────────────
function loadTodosFromCache() {
  try {
    const raw = localStorage.getItem('studypilot_todos');
    if (raw) {
      allLocalTodos = JSON.parse(raw);
    } else {
      allLocalTodos = [];
    }
  } catch (e) {
    allLocalTodos = [];
  }
  filterAndRenderTodos();
}

function filterAndRenderTodos() {
  const listEl  = document.getElementById('todo-list');
  const emptyEl = document.getElementById('todo-empty');
  if (!listEl) return;

  const isCompleted = showingTab === 'completed';
  const filtered = allLocalTodos.filter(t => {
    const docDomain = t.domainId || 'aktu';
    return docDomain === currentDomainId && !!t.completed === isCompleted;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = '';
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  // Sort: completed tasks newest first; pending tasks by dueDate or createdAt
  filtered.sort((a, b) => {
    if (isCompleted) {
      const tA = a.completedAt?.toDate ? a.completedAt.toDate().getTime() : (a.completedAt ? new Date(a.completedAt).getTime() : 0);
      const tB = b.completedAt?.toDate ? b.completedAt.toDate().getTime() : (b.completedAt ? new Date(b.completedAt).getTime() : 0);
      return tB - tA;
    } else {
      if (a.dueDate || b.dueDate) {
        const dA = a.dueDate ? (a.dueDate.toDate ? a.dueDate.toDate().getTime() : new Date(a.dueDate).getTime()) : Infinity;
        const dB = b.dueDate ? (b.dueDate.toDate ? b.dueDate.toDate().getTime() : new Date(b.dueDate).getTime()) : Infinity;
        if (dA !== dB) return dA - dB;
      }
      const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return tB - tA;
    }
  });

  if (emptyEl) emptyEl.classList.add('hidden');

  let html = '';
  filtered.forEach(t => {
    const id = t.id;

    // Check if overdue
    let dueText  = '';
    let dueClass = '';
    if (t.dueDate) {
      const due = t.dueDate.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
      const now = new Date();
      dueText = 'Due: ' + formatDate(due);
      if (!t.completed && due < now) dueClass = 'overdue';
    }

    html += `
    <div class="todo-item" id="todo-item-${id}">
      <input
        type="checkbox"
        class="todo-check"
        ${t.completed ? 'checked' : ''}
        onchange="toggleComplete('${id}', this.checked)"
        aria-label="${escapeHtml(t.title)}"
      />
      <div class="todo-body">
        <div class="todo-title ${t.completed ? 'done' : ''}">${escapeHtml(t.title)}</div>
        ${dueText ? `<div class="todo-due ${dueClass}">${dueText}</div>` : ''}
      </div>
      <div class="todo-actions">
        <button class="btn btn-ghost btn-sm" onclick="deleteTodo('${id}')"
                title="Delete task" aria-label="Delete task: ${escapeHtml(t.title)}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
        </button>
      </div>
    </div>`;
  });

  listEl.innerHTML = html;
}

// ─── BACKGROUND CLOUD SYNC ────────────────────────────────────
async function syncTodosFromCloud() {
  if (!currentUser || !db) return;

  try {
    const q = query(
      collection(db, 'todos'),
      where('userId', '==', currentUser.uid)
    );
    const snap = await getDocs(q);

    const cloudList = [];
    snap.forEach(docSnap => {
      cloudList.push({ id: docSnap.id, ...docSnap.data() });
    });

    if (cloudList.length > 0) {
      // Merge cloud list with local list
      const mergedMap = new Map();
      allLocalTodos.forEach(t => mergedMap.set(t.id, t));
      cloudList.forEach(t => mergedMap.set(t.id, t));

      allLocalTodos = Array.from(mergedMap.values());
      try {
        localStorage.setItem('studypilot_todos', JSON.stringify(allLocalTodos));
      } catch (e) {}

      filterAndRenderTodos();
    }
  } catch (err) {
    console.warn('To-do cloud sync note:', err);
  }
}

// ─── ADD TASK ─────────────────────────────────────────────────
window.addTodo = async function(event) {
  if (event) event.preventDefault();

  const titleInput = document.getElementById('todo-title-input');
  const dueInput   = document.getElementById('todo-due-input');
  const btn        = document.getElementById('todo-add-btn');

  const title  = titleInput.value.trim();
  const dueVal = dueInput.value;

  if (!title) return;

  const taskId = 'todo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  const newTask = {
    id:        taskId,
    userId:    currentUser?.uid || 'local_user',
    domainId:  currentDomainId,
    title:     title,
    completed: false,
    createdAt: new Date().toISOString(),
    dueDate:   dueVal ? new Date(dueVal).toISOString() : null
  };

  // 1. Immediately save to LocalStorage for 0ms UI update
  allLocalTodos.unshift(newTask);
  try {
    localStorage.setItem('studypilot_todos', JSON.stringify(allLocalTodos));
  } catch (e) {}

  // Reset form
  titleInput.value = '';
  dueInput.value   = '';
  showToast('✓ Task added!', 'success');

  // Render immediately
  if (showingTab !== 'pending') {
    switchTodoTab('pending');
  } else {
    filterAndRenderTodos();
  }

  // 2. Background Firestore Sync
  if (currentUser && db) {
    try {
      await addDoc(collection(db, 'todos'), {
        ...newTask,
        createdAt: serverTimestamp(),
        dueDate: dueVal ? new Date(dueVal) : null
      });
    } catch (err) {
      console.warn('Firestore add todo note (saved locally):', err);
    }
  }
};

// ─── TOGGLE COMPLETE ──────────────────────────────────────────
window.toggleComplete = async function(id, isChecked) {
  const task = allLocalTodos.find(t => t.id === id);
  if (task) {
    task.completed = isChecked;
    task.completedAt = isChecked ? new Date().toISOString() : null;
    try {
      localStorage.setItem('studypilot_todos', JSON.stringify(allLocalTodos));
    } catch (e) {}
    filterAndRenderTodos();
  }

  showToast(isChecked ? 'Task marked complete!' : 'Task moved back to pending.', 'success');

  // Background Firestore Sync
  if (currentUser && db) {
    try {
      await updateDoc(doc(db, 'todos', id), {
        completed:   isChecked,
        completedAt: isChecked ? serverTimestamp() : null
      });
    } catch (err) {
      console.warn('Firestore toggle todo note:', err);
    }
  }
};

// ─── DELETE TODO ──────────────────────────────────────────────
window.deleteTodo = async function(id) {
  if (!confirm('Delete this task? This cannot be undone.')) return;

  allLocalTodos = allLocalTodos.filter(t => t.id !== id);
  try {
    localStorage.setItem('studypilot_todos', JSON.stringify(allLocalTodos));
  } catch (e) {}
  filterAndRenderTodos();

  showToast('Task deleted.', 'info');

  // Background Firestore Delete
  if (currentUser && db) {
    try {
      await deleteDoc(doc(db, 'todos', id));
    } catch (err) {
      console.warn('Firestore delete todo note:', err);
    }
  }
};

// ─── SWITCH TAB ───────────────────────────────────────────────
window.switchTodoTab = function(tab) {
  showingTab = tab;
  document.getElementById('tab-pending').classList.toggle('active',   tab === 'pending');
  document.getElementById('tab-completed').classList.toggle('active', tab === 'completed');
  filterAndRenderTodos();
};

window.loadTodos = async function() {
  loadTodosFromCache();
  if (currentUser) await syncTodosFromCloud();
};

// ─── SIDEBAR USER INFO & LOGOUT ───────────────────────────────
function renderUserInfo(user) {
  const name = user.displayName || 'Student';
  const av   = document.getElementById('sidebar-avatar');
  const nm   = document.getElementById('sidebar-name');
  const em   = document.getElementById('sidebar-email');
  if (av) av.textContent = (name.charAt(0) || 'S').toUpperCase();
  if (nm) nm.textContent = name;
  if (em) em.textContent = user.email || '';
}

window.handleLogout = async function() {
  await signOut(auth);
  window.location.href = '../index.html';
};

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
