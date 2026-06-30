/* Main Application Entry & Routing Coordinator Module */

import { initStorage } from './storage.js';
import { renderHome } from './pages/home.js';
import { renderAdd } from './pages/add.js';
import { renderLibrary } from './pages/library.js';
import { renderReview } from './pages/review.js';
import { renderStats } from './pages/stats.js';
import { parseExcelFile, executeImport, exportExcel, downloadExcelTemplate } from './excel.js';

// Global Toast System
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '<i class="fa-solid fa-circle-check"></i>';
  if (type === 'danger') icon = '<i class="fa-solid fa-circle-exclamation"></i>';
  if (type === 'info') icon = '<i class="fa-solid fa-circle-info"></i>';
  
  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);
  
  // Slide out and remove
  setTimeout(() => {
    toast.style.animation = 'toast-slide 0.3s reverse forwards';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3000);
}

// Global App State
const state = {
  activePage: 'home',
  theme: 'dark',
  pendingImportRecords: []
};

// Route Switcher
function handleRoute() {
  const hash = window.location.hash || '#/home';
  const page = hash.replace('#/', '');
  state.activePage = page;
  
  // Highlight active header link
  document.querySelectorAll('.nav-links .nav-link').forEach(link => {
    if (link.getAttribute('data-page') === page) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
  
  const contentArea = document.getElementById('app-content');
  if (!contentArea) return;
  
  // Clear modal states when navigating
  closeAllModals();
  
  // Show spinner
  contentArea.innerHTML = `<div class="loader"><div class="spinner"></div></div>`;
  
  // Render pages
  setTimeout(() => {
    switch (page) {
      case 'home':
        renderHome(contentArea);
        break;
      case 'add':
        renderAdd(contentArea);
        break;
      case 'library':
        renderLibrary(contentArea);
        break;
      case 'review':
        renderReview(contentArea);
        break;
      case 'stats':
        renderStats(contentArea);
        break;
      default:
        renderHome(contentArea);
    }
  }, 150); // subtle delay for visual transition
}

// Theme Coordinator
function initTheme() {
  const savedTheme = localStorage.getItem('jlpt_theme') || 'dark';
  state.theme = savedTheme;
  const body = document.body;
  const toggleBtn = document.getElementById('theme-toggle');
  
  if (savedTheme === 'light') {
    body.classList.remove('dark-theme');
    body.classList.add('light-theme');
    if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else {
    body.classList.add('dark-theme');
    body.classList.remove('light-theme');
    if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }
}

function toggleTheme() {
  const body = document.body;
  const toggleBtn = document.getElementById('theme-toggle');
  
  if (body.classList.contains('dark-theme')) {
    body.classList.remove('dark-theme');
    body.classList.add('light-theme');
    toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    state.theme = 'light';
  } else {
    body.classList.add('dark-theme');
    body.classList.remove('light-theme');
    toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    state.theme = 'dark';
  }
  localStorage.setItem('jlpt_theme', state.theme);
  showToast(`Switched to ${state.theme} theme`, 'info');
}

// Modal management
function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.classList.add('hidden');
  });
}

function wireExcelEvents() {
  const importModal = document.getElementById('import-modal');
  const closeImportBtn = document.getElementById('close-import-btn');
  const cancelImportBtn = document.getElementById('cancel-import-btn');
  const dragDropZone = document.getElementById('drag-drop-zone');
  const fileInput = document.getElementById('excel-file-input');
  const confirmImportBtn = document.getElementById('confirm-import-btn');
  
  const strategySelection = document.getElementById('import-strategy-selection');
  const previewSection = document.getElementById('import-preview-section');
  
  // Summary modal
  const summaryModal = document.getElementById('summary-modal');
  const closeSummaryBtn = document.getElementById('close-summary-btn');
  const closeSummaryOkBtn = document.getElementById('close-summary-ok-btn');
  
  // Export modal
  const exportModal = document.getElementById('export-modal');
  const closeExportBtn = document.getElementById('close-export-btn');
  const cancelExportBtn = document.getElementById('cancel-export-btn');
  const confirmExportBtn = document.getElementById('confirm-export-btn');
  
  // Drag and Drop triggers
  if (dragDropZone) {
    dragDropZone.addEventListener('click', () => fileInput.click());
    
    dragDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dragDropZone.classList.add('dragover');
    });
    
    dragDropZone.addEventListener('dragleave', () => {
      dragDropZone.classList.remove('dragover');
    });
    
    dragDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dragDropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleImportFile(e.dataTransfer.files[0]);
      }
    });
  }
  
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleImportFile(e.target.files[0]);
      }
    });
  }
  
  async function handleImportFile(file) {
    if (!file.name.endsWith('.xlsx')) {
      showToast('Invalid file format. Please upload a .xlsx Excel workbook.', 'danger');
      return;
    }
    
    try {
      showToast('Reading spreadsheet...', 'info');
      const parsed = await parseExcelFile(file);
      state.pendingImportRecords = parsed.records;
      
      if (parsed.totalCount === 0) {
        showToast('No flashcard records found in the Words, Verbs, Sentences, or Kanji sheets.', 'danger');
        return;
      }
      
      // Update UI elements to show preview
      document.getElementById('preview-total-count').textContent = `Found: ${parsed.totalCount} records`;
      const valid = parsed.records.filter(r => r.isValid).length;
      const invalid = parsed.records.length - valid;
      
      document.getElementById('preview-valid-count').textContent = `${valid} valid`;
      document.getElementById('preview-invalid-count').textContent = `${invalid} invalid`;
      
      // Populate preview table
      const headerRow = document.getElementById('preview-table-header');
      const bodyRows = document.getElementById('preview-table-body');
      
      headerRow.innerHTML = `
        <th>Sheet</th>
        <th>Row</th>
        <th>Main Content</th>
        <th>JLPT</th>
        <th>Status</th>
      `;
      
      bodyRows.innerHTML = '';
      
      parsed.records.slice(0, 10).forEach(rec => {
        const tr = document.createElement('tr');
        if (!rec.isValid) tr.className = 'row-invalid';
        
        const mainContent = rec.category === 'kanji' 
          ? `${rec.data.kanji || ''} (${rec.data.meaning || ''})` 
          : `${rec.data.japanese || ''} / ${rec.data.english || ''}`;
          
        tr.innerHTML = `
          <td><strong>${rec.sheetName}</strong></td>
          <td>${rec.rowNumber}</td>
          <td>${mainContent}</td>
          <td><span class="lib-card-jlpt" style="position:static;">${rec.data.jlpt || 'N/A'}</span></td>
          <td>${rec.isValid ? '<span class="text-success"><i class="fa-solid fa-check"></i> Valid</span>' : `<span class="text-danger" title="${rec.errors.join(', ')}"><i class="fa-solid fa-xmark"></i> Invalid</span>`}</td>
        `;
        bodyRows.appendChild(tr);
      });
      
      if (parsed.records.length > 10) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="5" class="text-center text-secondary">...and ${parsed.records.length - 10} more rows</td>`;
        bodyRows.appendChild(tr);
      }
      
      strategySelection.classList.remove('hidden');
      previewSection.classList.remove('hidden');
      confirmImportBtn.classList.remove('hidden');
      
      showToast('File loaded successfully! Please select strategy and confirm.', 'success');
      
    } catch (err) {
      console.error(err);
      showToast('Failed to parse Excel file. Check file integrity.', 'danger');
    }
  }
  
  // Confirm import click
  if (confirmImportBtn) {
    confirmImportBtn.addEventListener('click', () => {
      if (state.pendingImportRecords.length === 0) return;
      
      const strategy = document.querySelector('input[name="duplicate-strategy"]:checked').value;
      const summary = executeImport(state.pendingImportRecords, strategy);
      
      // Update summary modal
      document.getElementById('sum-total').textContent = summary.total;
      document.getElementById('sum-imported').textContent = summary.imported;
      document.getElementById('sum-skipped').textContent = summary.skipped;
      document.getElementById('sum-replaced').textContent = summary.replaced;
      document.getElementById('sum-failed').textContent = summary.failed;
      
      closeAllModals();
      summaryModal.classList.remove('hidden');
      
      // Reload active page if library or stats
      if (state.activePage === 'library' || state.activePage === 'stats' || state.activePage === 'home') {
        handleRoute();
      }
    });
  }
  
  // Wire up close/cancels
  const wireCloses = (btn, modal) => {
    if (btn) btn.addEventListener('click', () => modal.classList.add('hidden'));
  };
  
  wireCloses(closeImportBtn, importModal);
  wireCloses(cancelImportBtn, importModal);
  wireCloses(closeSummaryBtn, summaryModal);
  wireCloses(closeSummaryOkBtn, summaryModal);
  wireCloses(closeExportBtn, exportModal);
  wireCloses(cancelExportBtn, exportModal);
  
  // Confirm Export click
  if (confirmExportBtn) {
    confirmExportBtn.addEventListener('click', () => {
      const scope = document.querySelector('input[name="export-scope"]:checked').value;
      exportExcel(scope);
      exportModal.classList.add('hidden');
      showToast(`Exported ${scope} flashcards to Excel`, 'success');
    });
  }
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  initTheme();
  
  // Bind Theme Toggle
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  
  // Bind Logo click
  const logo = document.getElementById('nav-logo');
  if (logo) logo.addEventListener('click', () => {
    window.location.hash = '#/home';
  });
  
  // Navigation Routing
  window.addEventListener('hashchange', handleRoute);
  
  // Wire Modals & Excel Events
  wireExcelEvents();
  
  // Run routing for initial load
  handleRoute();
});
export { closeAllModals };
export { downloadExcelTemplate };
