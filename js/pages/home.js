/* Home Dashboard View - WoodNest Glassmorphic Design */

import { getStats } from '../storage.js';

export function renderHome(container) {
  const stats = getStats();
  
  container.innerHTML = `
    <div class="home-grid">
      <!-- Hero Header & Quick Actions -->
      <div class="home-hero">
        <h1 class="fade-in">Master Japanese<br>One Card at a Time</h1>
        <p class="fade-in-delayed">Build custom flashcards, practice using sleek 3D cards, and track your JLPT mastery offline.</p>
        
        <div class="home-actions-group">
          <a href="#/review" class="home-action-card">
            <div class="action-icon icon-review"><i class="fa-solid fa-play"></i></div>
            <h3>Start Review</h3>
            <span>Practice active recall</span>
          </a>
          <a href="#/add" class="home-action-card">
            <div class="action-icon icon-add"><i class="fa-solid fa-plus"></i></div>
            <h3>Add Flashcard</h3>
            <span>Create custom cards</span>
          </a>
          <a href="#/library" class="home-action-card">
            <div class="action-icon icon-library"><i class="fa-solid fa-bookmark"></i></div>
            <h3>Open Library</h3>
            <span>Search & edit cards</span>
          </a>
          <a href="#/stats" class="home-action-card">
            <div class="action-icon icon-stats"><i class="fa-solid fa-chart-line"></i></div>
            <h3>Statistics</h3>
            <span>View your progress</span>
          </a>
        </div>
      </div>
      
      <!-- Category Counts Dashboard -->
      <div class="home-stats-widget fade-in-delayed">
        <h2 class="widget-title"><i class="fa-solid fa-database"></i> Library Overview</h2>
        
        <div class="category-stats-list">
          <div class="cat-stat-item">
            <div class="cat-info">
              <span class="cat-badge-icon cat-badge-words" style="color:var(--secondary);"><i class="fa-solid fa-language"></i></span>
              <span class="cat-name">🇯🇵 Hiragana</span>
            </div>
            <span class="cat-count">${stats.hiragana || 0}</span>
          </div>
          
          <div class="cat-stat-item">
            <div class="cat-info">
              <span class="cat-badge-icon cat-badge-words" style="color:var(--accent-orange);"><i class="fa-solid fa-cubes"></i></span>
              <span class="cat-name">🈂️ Katakana</span>
            </div>
            <span class="cat-count">${stats.katakana || 0}</span>
          </div>
          
          <div class="cat-stat-item">
            <div class="cat-info">
              <span class="cat-badge-icon cat-badge-verbs"><i class="fa-solid fa-bolt"></i></span>
              <span class="cat-name">⚡ Verbs</span>
            </div>
            <span class="cat-count">${stats.verbs}</span>
          </div>
          
          <div class="cat-stat-item">
            <div class="cat-info">
              <span class="cat-badge-icon cat-badge-sentences"><i class="fa-solid fa-comment"></i></span>
              <span class="cat-name">💬 Sentences</span>
            </div>
            <span class="cat-count">${stats.sentences}</span>
          </div>
          
          <div class="cat-stat-item">
            <div class="cat-info">
              <span class="cat-badge-icon cat-badge-kanji"><i class="fa-solid fa-yin-yang"></i></span>
              <span class="cat-name">🈶 Kanji</span>
            </div>
            <span class="cat-count">${stats.kanji}</span>
          </div>
          
          <div class="cat-stat-item" style="border-color: var(--secondary); background: rgba(21, 178, 211, 0.05)">
            <div class="cat-info">
              <span class="cat-badge-icon" style="color: var(--secondary)"><i class="fa-solid fa-layer-group"></i></span>
              <span class="cat-name" style="font-weight: 700">Total Deck</span>
            </div>
            <span class="cat-count" style="color: var(--secondary)">${stats.total}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
