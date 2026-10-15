/* ============================================================
   domain-manager.js — Multi-Domain Architecture for StudyPilot AI
   
   Supports 3 default domains:
   1. 'aktu'   : AKTU Academic Tracker (Semester, syllabus, exams, SGPA)
   2. 'dsa'    : Data Structures & Algorithms (Roadmap, playlists, problem tests)
   3. 'webdev' : Web Development (Fullstack roadmap, projects, resources)
   
   Plus user-created custom domains with full persistence in Firestore + localStorage.
   ============================================================ */

import { auth, db } from './firebase-config.js';
import {
  doc, getDoc, setDoc, deleteDoc, collection, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Default domains definition
export const DEFAULT_DOMAINS = [
  {
    id: 'aktu',
    name: 'AKTU Academic Tracker',
    shortName: 'AKTU',
    icon: 'graduation-cap',
    type: 'academic',
    description: 'AKTU B.Tech syllabus, semester examinations, and SGPA tracking',
    targetDate: '',
    dailyHours: 2.0,
    isDefault: true
  },
  {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    shortName: 'DSA',
    icon: 'code',
    type: 'skill',
    description: 'Topic-wise DSA roadmap, YouTube playlists, and problem-solving tests',
    targetDate: '',
    dailyHours: 1.5,
    isDefault: true
  },
  {
    id: 'webdev',
    name: 'Web Development',
    shortName: 'Web Dev',
    icon: 'globe',
    type: 'skill',
    description: 'Fullstack web development roadmap, video tutorials, and project topics',
    targetDate: '',
    dailyHours: 2.0,
    isDefault: true
  }
];

let activeDomainId = localStorage.getItem('studypilot_active_domain') || 'aktu';
let customDomainsCache = [];
let isInitialized = false;

// ─── GET CURRENT ACTIVE DOMAIN ────────────────────────────────
export function getActiveDomainId() {
  return activeDomainId || 'aktu';
}

export function getActiveDomain() {
  const all = getAllDomains();
  return all.find(d => d.id === activeDomainId) || DEFAULT_DOMAINS[0];
}

export function getAllDomains() {
  return [...DEFAULT_DOMAINS, ...customDomainsCache];
}

// ─── INITIALIZE DOMAINS FOR USER ──────────────────────────────
export async function initDomains(user) {
  // Load cached custom domains from localStorage first for instant render
  try {
    const cached = localStorage.getItem(`studypilot_custom_domains_${user?.uid || 'anon'}`);
    if (cached) {
      customDomainsCache = JSON.parse(cached);
    }
  } catch (e) {
    customDomainsCache = [];
  }

  // Load from Firestore if user is authenticated
  if (user && db) {
    try {
      const colRef = collection(db, 'users', user.uid, 'customDomains');
      const snap = await getDocs(colRef);
      const list = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data(), isDefault: false });
      });
      customDomainsCache = list;
      localStorage.setItem(`studypilot_custom_domains_${user.uid}`, JSON.stringify(list));

      // Also load active domain preference from user doc
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().activeDomain) {
        activeDomainId = userSnap.data().activeDomain;
        localStorage.setItem('studypilot_active_domain', activeDomainId);
      }
    } catch (err) {
      console.warn('Could not sync custom domains from Firestore:', err);
    }
  }

  // Ensure active domain exists in list
  const exists = getAllDomains().some(d => d.id === activeDomainId);
  if (!exists) {
    activeDomainId = 'aktu';
    localStorage.setItem('studypilot_active_domain', 'aktu');
  }

  isInitialized = true;
  renderDomainTabs();
  return getActiveDomain();
}

// ─── SWITCH ACTIVE DOMAIN ─────────────────────────────────────
export async function switchDomain(domainId, user = auth.currentUser) {
  if (activeDomainId === domainId) return;

  const target = getAllDomains().find(d => d.id === domainId);
  if (!target) return;

  activeDomainId = domainId;
  localStorage.setItem('studypilot_active_domain', domainId);

  // Persist preference to user doc
  if (user && db) {
    try {
      await setDoc(doc(db, 'users', user.uid), { activeDomain: domainId }, { merge: true });
    } catch (err) {
      console.warn('Could not save active domain preference:', err);
    }
  }

  renderDomainTabs();

  // Dispatch custom event so active page reloads its domain data
  window.dispatchEvent(new CustomEvent('studypilot-domain-changed', {
    detail: { domainId, domain: target }
  }));
}

// ─── CREATE CUSTOM DOMAIN ─────────────────────────────────────
export async function createCustomDomain(domainData, user = auth.currentUser) {
  const id = 'custom_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4);
  const newDomain = {
    id,
    name: domainData.name.trim(),
    shortName: domainData.shortName?.trim() || domainData.name.trim().slice(0, 12),
    description: domainData.description?.trim() || '',
    type: domainData.type || 'skill',
    targetDate: domainData.targetDate || '',
    dailyHours: parseFloat(domainData.dailyHours) || 1.5,
    createdAt: new Date().toISOString(),
    isDefault: false
  };

  customDomainsCache.push(newDomain);
  if (user) {
    localStorage.setItem(`studypilot_custom_domains_${user.uid}`, JSON.stringify(customDomainsCache));
    if (db) {
      await setDoc(doc(db, 'users', user.uid, 'customDomains', id), {
        ...newDomain,
        updatedAt: serverTimestamp()
      });
    }
  }

  await switchDomain(id, user);
  return newDomain;
}

// ─── UPDATE CUSTOM DOMAIN ─────────────────────────────────────
export async function updateCustomDomain(domainId, updates, user = auth.currentUser) {
  const idx = customDomainsCache.findIndex(d => d.id === domainId);
  if (idx === -1) {
    // If it's a default domain, update local target date or daily hours
    const defaultIdx = DEFAULT_DOMAINS.findIndex(d => d.id === domainId);
    if (defaultIdx !== -1) {
      DEFAULT_DOMAINS[defaultIdx] = { ...DEFAULT_DOMAINS[defaultIdx], ...updates };
      if (user && db) {
        await setDoc(doc(db, 'users', user.uid, 'domainSettings', domainId), updates, { merge: true });
      }
      renderDomainTabs();
      window.dispatchEvent(new CustomEvent('studypilot-domain-changed', {
        detail: { domainId, domain: DEFAULT_DOMAINS[defaultIdx] }
      }));
    }
    return;
  }

  customDomainsCache[idx] = { ...customDomainsCache[idx], ...updates };
  if (user) {
    localStorage.setItem(`studypilot_custom_domains_${user.uid}`, JSON.stringify(customDomainsCache));
    if (db) {
      await setDoc(doc(db, 'users', user.uid, 'customDomains', domainId), updates, { merge: true });
    }
  }

  renderDomainTabs();
  window.dispatchEvent(new CustomEvent('studypilot-domain-changed', {
    detail: { domainId, domain: customDomainsCache[idx] }
  }));
}

// ─── DELETE CUSTOM DOMAIN ─────────────────────────────────────
export async function deleteCustomDomain(domainId, user = auth.currentUser) {
  if (DEFAULT_DOMAINS.some(d => d.id === domainId)) {
    throw new Error('Default domains cannot be deleted.');
  }

  customDomainsCache = customDomainsCache.filter(d => d.id !== domainId);
  if (user) {
    localStorage.setItem(`studypilot_custom_domains_${user.uid}`, JSON.stringify(customDomainsCache));
    if (db) {
      await deleteDoc(doc(db, 'users', user.uid, 'customDomains', domainId));
    }
  }

  // If deleted domain was active, fall back to AKTU
  if (activeDomainId === domainId) {
    await switchDomain('aktu', user);
  } else {
    renderDomainTabs();
  }
}

// ─── RENDER DOMAIN TABS UI COMPONENT ──────────────────────────
export function renderDomainTabs() {
  const container = document.getElementById('domain-selector-container');
  if (!container) return;

  const domains = getAllDomains();
  let tabsHtml = `
    <div class="domain-tabs-wrapper">
      <div class="domain-tabs" role="tablist" aria-label="Study domains">
  `;

  domains.forEach(d => {
    const isActive = d.id === activeDomainId;
    tabsHtml += `
      <div class="domain-tab-item ${isActive ? 'active' : ''}">
        <button class="domain-tab ${isActive ? 'active' : ''}"
                onclick="window._studyPilotSwitchDomain('${d.id}')"
                role="tab"
                aria-selected="${isActive}">
          <span class="domain-tab-title">${escapeHtml(d.shortName || d.name)}</span>
          ${d.isDefault ? '' : `<span class="domain-custom-badge">Custom</span>`}
        </button>
        ${!d.isDefault ? `
          <button class="domain-tab-manage-btn" onclick="window._studyPilotOpenManageDomain('${d.id}')" title="Edit or delete domain" aria-label="Manage ${escapeHtml(d.name)}">
            ⋮
          </button>
        ` : ''}
      </div>
    `;
  });

  tabsHtml += `
        <button class="domain-add-btn" onclick="window._studyPilotOpenNewDomainModal()" title="Add custom study domain" aria-label="Add custom domain">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span class="domain-add-label">New Domain</span>
        </button>
      </div>
    </div>
  `;

  container.innerHTML = tabsHtml;
}

// ─── MODAL CONTROLS EXPOSED TO WINDOW ─────────────────────────
window._studyPilotSwitchDomain = function(domainId) {
  switchDomain(domainId);
};

window._studyPilotOpenNewDomainModal = function() {
  let modal = document.getElementById('domain-modal');
  if (!modal) {
    createDomainModalDom();
    modal = document.getElementById('domain-modal');
  }
  document.getElementById('domain-form-title').textContent = 'Create New Study Domain';
  document.getElementById('domain-form-id').value = '';
  document.getElementById('domain-form-name').value = '';
  document.getElementById('domain-form-desc').value = '';
  document.getElementById('domain-form-type').value = 'skill';
  document.getElementById('domain-form-target').value = '';
  document.getElementById('domain-form-hours').value = '2';
  document.getElementById('domain-delete-btn').style.display = 'none';
  modal.style.display = 'flex';
};

window._studyPilotOpenManageDomain = function(domainId) {
  let modal = document.getElementById('domain-modal');
  if (!modal) {
    createDomainModalDom();
    modal = document.getElementById('domain-modal');
  }
  const domain = getAllDomains().find(d => d.id === domainId);
  if (!domain) return;

  document.getElementById('domain-form-title').textContent = 'Edit Study Domain';
  document.getElementById('domain-form-id').value = domain.id;
  document.getElementById('domain-form-name').value = domain.name;
  document.getElementById('domain-form-desc').value = domain.description || '';
  document.getElementById('domain-form-type').value = domain.type || 'skill';
  document.getElementById('domain-form-target').value = domain.targetDate || '';
  document.getElementById('domain-form-hours').value = domain.dailyHours || '2';
  
  const delBtn = document.getElementById('domain-delete-btn');
  delBtn.style.display = domain.isDefault ? 'none' : 'inline-block';

  modal.style.display = 'flex';
};

window._studyPilotCloseDomainModal = function() {
  const modal = document.getElementById('domain-modal');
  if (modal) modal.style.display = 'none';
};

window._studyPilotSubmitDomain = async function(event) {
  event.preventDefault();
  const id = document.getElementById('domain-form-id').value;
  const name = document.getElementById('domain-form-name').value.trim();
  const desc = document.getElementById('domain-form-desc').value.trim();
  const type = document.getElementById('domain-form-type').value;
  const targetDate = document.getElementById('domain-form-target').value;
  const dailyHours = parseFloat(document.getElementById('domain-form-hours').value) || 2;

  if (!name) return;

  const btn = document.getElementById('domain-save-btn');
  if (btn) btn.disabled = true;

  try {
    if (id) {
      await updateCustomDomain(id, {
        name,
        shortName: name.length > 12 ? name.slice(0, 11) + '…' : name,
        description: desc,
        type,
        targetDate,
        dailyHours
      });
      if (typeof window.showToast === 'function') window.showToast('Domain updated!', 'success');
    } else {
      await createCustomDomain({
        name,
        description: desc,
        type,
        targetDate,
        dailyHours
      });
      if (typeof window.showToast === 'function') window.showToast('Domain created!', 'success');
    }
    window._studyPilotCloseDomainModal();
  } catch (err) {
    console.error('Error saving domain:', err);
    if (typeof window.showToast === 'function') window.showToast('Could not save domain.', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
};

window._studyPilotDeleteActiveDomain = async function() {
  const id = document.getElementById('domain-form-id').value;
  if (!id) return;
  const domain = getAllDomains().find(d => d.id === id);
  if (!domain) return;

  if (!confirm(`Are you sure you want to delete the domain "${domain.name}"? This action cannot be undone.`)) {
    return;
  }

  try {
    await deleteCustomDomain(id);
    window._studyPilotCloseDomainModal();
    if (typeof window.showToast === 'function') window.showToast('Domain deleted.', 'success');
  } catch (err) {
    if (typeof window.showToast === 'function') window.showToast(err.message, 'error');
  }
};

function createDomainModalDom() {
  const existing = document.getElementById('domain-modal');
  if (existing) return;

  const modal = document.createElement('div');
  modal.id = 'domain-modal';
  modal.className = 'domain-modal-overlay';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div class="card domain-modal-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--sp-4);">
        <h3 id="domain-form-title" style="font-size:18px; font-weight:600; margin:0;">Create Study Domain</h3>
        <button type="button" class="btn btn-ghost btn-sm" onclick="window._studyPilotCloseDomainModal()">✕</button>
      </div>
      <form onsubmit="window._studyPilotSubmitDomain(event)">
        <input type="hidden" id="domain-form-id" />
        <div class="form-group">
          <label for="domain-form-name">Domain Name *</label>
          <input type="text" id="domain-form-name" placeholder="e.g. System Design, Machine Learning" required maxlength="50" />
        </div>
        <div class="form-group">
          <label for="domain-form-desc">Description (optional)</label>
          <input type="text" id="domain-form-desc" placeholder="Goals, target exams, or topic summary" maxlength="150" />
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-4);">
          <div class="form-group">
            <label for="domain-form-type">Domain Category</label>
            <select id="domain-form-type">
              <option value="skill">Skill / Engineering</option>
              <option value="academic">University / College</option>
              <option value="competitive">Competitive / Interview</option>
              <option value="general">Self Study / General</option>
            </select>
          </div>
          <div class="form-group">
            <label for="domain-form-hours">Daily Study Target (Hours)</label>
            <input type="number" id="domain-form-hours" step="0.5" min="0.5" max="12" value="2" />
          </div>
        </div>
        <div class="form-group">
          <label for="domain-form-target">Target Completion Date (optional)</label>
          <input type="date" id="domain-form-target" />
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:var(--sp-5);">
          <button type="button" class="btn btn-ghost" id="domain-delete-btn" style="color:var(--color-danger); display:none;" onclick="window._studyPilotDeleteActiveDomain()">Delete Domain</button>
          <div style="display:flex; gap:var(--sp-2); margin-left:auto;">
            <button type="button" class="btn btn-ghost" onclick="window._studyPilotCloseDomainModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="domain-save-btn">Save Domain</button>
          </div>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── DOMAIN MANAGER OBJECT EXPORT ─────────────────────────────
// Supports backward-compatible DomainManager.init() across all pages
export const DomainManager = {
  init: async function(containerId, onSwitchCallback) {
    if (onSwitchCallback) {
      window.addEventListener('studypilot-domain-changed', (e) => {
        if (e.detail?.domainId) {
          onSwitchCallback(e.detail.domainId);
        }
      });
    }
    const user = auth.currentUser;
    await initDomains(user);
    renderDomainTabs();
    return getActiveDomain();
  },
  getActiveDomainId: getActiveDomainId,
  getActiveDomain: getActiveDomain,
  getAllDomains: getAllDomains,
  switchDomain: switchDomain,
  renderDomainTabs: renderDomainTabs
};

export default DomainManager;

