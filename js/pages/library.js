/* Library Catalog Page Module */

import { loadCards, deleteCard, toggleFavorite, duplicateCard } from '../storage.js';
import { downloadExcelTemplate } from '../excel.js';
import { showToast } from '../app.js';

export function renderLibrary(container) {
  let cards = loadCards();
  
  // Local state for searching/filtering
  let searchQuery = '';
  let categoryFilter = 'all';
  let jlptFilter = 'all';
  let sortOrder = 'newest';

  function drawCards() {
    const gridContainer = container.querySelector('#library-grid-container');
    if (!gridContainer) return;

    // Filter cards
    let filtered = cards.filter(card => {
      // Category filter
      if (categoryFilter !== 'all' && card.type !== categoryFilter) return false;
      
      // JLPT filter
      if (jlptFilter !== 'all' && card.jlpt !== jlptFilter) return false;
      
      // Search query (case-insensitive checks on text values)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (card.type === 'kanji') {
          return (card.kanji || '').toLowerCase().includes(query) ||
                 (card.meaning || '').toLowerCase().includes(query) ||
                 (card.onyomi || '').toLowerCase().includes(query) ||
                 (card.kunyomi || '').toLowerCase().includes(query) ||
                 (card.pronunciation || '').toLowerCase().includes(query) ||
                 (card.notes || '').toLowerCase().includes(query);
        } else {
          return (card.english || '').toLowerCase().includes(query) ||
                 (card.japanese || '').toLowerCase().includes(query) ||
                 (card.pronunciation || '').toLowerCase().includes(query) ||
                 (card.notes || '').toLowerCase().includes(query);
        }
      }
      return true;
    });

    // Sort cards
    filtered.sort((a, b) => {
      if (sortOrder === 'newest') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      } else if (sortOrder === 'oldest') {
        return (a.createdAt || 0) - (b.createdAt || 0);
      } else if (sortOrder === 'alpha') {
        const aVal = a.type === 'kanji' ? (a.kanji || '') : (a.japanese || '');
        const bVal = b.type === 'kanji' ? (b.kanji || '') : (b.japanese || '');
        return aVal.localeCompare(bVal, 'ja');
      }
      return 0;
    });

    // Render results
    if (filtered.length === 0) {
      gridContainer.innerHTML = `
        <div class="empty-library">
          <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 15px;"></i>
          <h3>No cards found matching current filters</h3>
          <p class="margin-top-md">Try clearing search inputs or add new flashcards using the action button above.</p>
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = filtered.map(card => {
      let contentHTML = '';
      if (card.type === 'kanji') {
        contentHTML = `
          <div class="lib-card-jp">${card.kanji}</div>
          <div class="lib-card-reading">On: ${card.onyomi || 'N/A'} | Kun: ${card.kunyomi || 'N/A'}</div>
          <div class="lib-card-en">${card.meaning}</div>
        `;
      } else {
        contentHTML = `
          <div class="lib-card-jp">${card.japanese}</div>
          <div class="lib-card-reading">${card.pronunciation}</div>
          <div class="lib-card-en">${card.english}</div>
        `;
      }

      return `
        <div class="lib-card" data-id="${card.id}">
          <div class="lib-card-jlpt">${card.jlpt}</div>
          <span class="lib-card-badge badge-${card.type}">${card.type}</span>
          
          <div class="lib-card-content">
            ${contentHTML}
          </div>
          
          <div class="lib-card-footer">
            <div class="lib-card-actions">
              <button class="lib-action-btn fav-btn ${card.favorite ? 'active' : ''}" title="Favorite">
                <i class="fa-solid fa-star"></i>
              </button>
              <button class="lib-action-btn dup-btn" title="Duplicate">
                <i class="fa-solid fa-copy"></i>
              </button>
              <button class="lib-action-btn edit-btn" title="Edit">
                <i class="fa-solid fa-pen"></i>
              </button>
            </div>
            <button class="lib-action-btn del-btn" title="Delete">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Bind item action listeners
    gridContainer.querySelectorAll('.lib-card').forEach(el => {
      const cardId = el.getAttribute('data-id');

      // Favorite toggle
      el.querySelector('.fav-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const active = toggleFavorite(cardId);
        // Toggle locally
        const btn = el.querySelector('.fav-btn');
        if (active) {
          btn.classList.add('active');
          showToast('Added card to favorites', 'success');
        } else {
          btn.classList.remove('active');
          showToast('Removed card from favorites', 'info');
        }
        // Sync memory list
        const c = cards.find(item => item.id === cardId);
        if (c) c.favorite = active;
      });

      // Duplicate card
      el.querySelector('.dup-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const copy = duplicateCard(cardId);
        if (copy) {
          cards = loadCards(); // reload data
          drawCards();
          showToast('Card duplicated successfully!', 'success');
        }
      });

      // Edit card redirection
      el.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.hash = `#/add?edit=${cardId}`;
      });

      // Delete card
      el.querySelector('.del-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this flashcard?')) {
          deleteCard(cardId);
          cards = cards.filter(item => item.id !== cardId);
          drawCards();
          showToast('Flashcard deleted', 'info');
        }
      });
    });
  }

  // Draw main structure
  container.innerHTML = `
    <div class="library-page-wrapper">
      <div class="library-header">
        <h2><i class="fa-solid fa-book-open"></i> Flashcard Library</h2>
        
        <div class="library-actions">
          <button id="download-template-btn" class="btn secondary-btn" title="Download Excel template for bulk editing">
            <i class="fa-solid fa-cloud-arrow-down"></i> Template
          </button>
          <button id="open-import-btn" class="btn secondary-btn">
            <i class="fa-solid fa-file-import"></i> Import Excel
          </button>
          <button id="open-export-btn" class="btn primary-btn">
            <i class="fa-solid fa-file-export"></i> Export Excel
          </button>
        </div>
      </div>
      
      <!-- Search & Filters Container -->
      <div class="search-filter-bar">
        <div class="form-group" style="margin:0;">
          <input type="text" id="lib-search" class="form-control" placeholder="Search Japanese, English, readings..." value="${searchQuery}">
        </div>
        
        <div class="form-group" style="margin:0;">
          <select id="lib-filter-cat" class="form-control">
            <option value="all">All Categories</option>
            <option value="hiragana">🇯🇵 Hiragana</option>
            <option value="katakana">🈂️ Katakana</option>
            <option value="verb">⚡ Verbs</option>
            <option value="sentence">💬 Sentences</option>
            <option value="kanji">🈶 Kanji</option>
          </select>
        </div>
        
        <div class="form-group" style="margin:0;">
          <select id="lib-filter-jlpt" class="form-control">
            <option value="all">All JLPT Levels</option>
            <option value="N5">N5</option>
            <option value="N4">N4</option>
            <option value="N3">N3</option>
            <option value="N2">N2</option>
            <option value="N1">N1</option>
          </select>
        </div>
        
        <div class="form-group" style="margin:0;">
          <select id="lib-sort" class="form-control">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="alpha">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>
      
      <!-- Card Grid -->
      <div id="library-grid-container" class="library-grid">
        <!-- Dynamic cards -->
      </div>
    </div>
  `;

  // Draw initial cards
  drawCards();

  // Search input events
  const searchEl = container.querySelector('#lib-search');
  searchEl.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    drawCards();
  });

  // Filter Category
  const catEl = container.querySelector('#lib-filter-cat');
  catEl.addEventListener('change', (e) => {
    categoryFilter = e.target.value;
    drawCards();
  });

  // Filter JLPT
  const jlptEl = container.querySelector('#lib-filter-jlpt');
  jlptEl.addEventListener('change', (e) => {
    jlptFilter = e.target.value;
    drawCards();
  });

  // Sort Order
  const sortEl = container.querySelector('#lib-sort');
  sortEl.addEventListener('change', (e) => {
    sortOrder = e.target.value;
    drawCards();
  });

  // Excel trigger wireups
  container.querySelector('#download-template-btn').addEventListener('click', () => {
    downloadExcelTemplate();
    showToast('Downloaded blank Excel Template', 'success');
  });

  container.querySelector('#open-import-btn').addEventListener('click', () => {
    // Open import modal
    const importModal = document.getElementById('import-modal');
    
    // Clear preview states
    document.getElementById('excel-file-input').value = '';
    document.getElementById('import-strategy-selection').classList.add('hidden');
    document.getElementById('import-preview-section').classList.add('hidden');
    document.getElementById('confirm-import-btn').classList.add('hidden');
    
    importModal.classList.remove('hidden');
  });

  container.querySelector('#open-export-btn').addEventListener('click', () => {
    const exportModal = document.getElementById('export-modal');
    exportModal.classList.remove('hidden');
  });
}
