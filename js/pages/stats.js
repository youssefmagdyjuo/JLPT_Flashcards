/* Statistics Dashboard Page Module */

import { getStats } from '../storage.js';

export function renderStats(container) {
  const stats = getStats();
  
  // Calculate max count for JLPT levels to scale the bars
  const counts = Object.values(stats.jlpt);
  const maxCount = Math.max(...counts, 1); // Avoid division by zero

  // Build JLPT bar rows
  const jlptLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const barRowsHTML = jlptLevels.map(level => {
    const count = stats.jlpt[level] || 0;
    const percentage = Math.round((count / maxCount) * 100);
    return `
      <div class="bar-row">
        <span class="bar-label">${level}</span>
        <div class="bar-outer">
          <div class="bar-inner" style="width: ${percentage}%"></div>
        </div>
        <span class="bar-val">${count}</span>
      </div>
    `;
  }).join('');

  // Build Recent Sessions HTML
  let sessionsHTML = '';
  if (stats.sessions.length === 0) {
    sessionsHTML = `
      <div class="text-center text-secondary padding-md" style="padding: 30px;">
        <i class="fa-solid fa-hourglass-empty" style="font-size: 2.5rem; margin-bottom: 12px;"></i>
        <p>No study sessions recorded yet. Start reviewing to build up history.</p>
      </div>
    `;
  } else {
    sessionsHTML = stats.sessions.map(s => {
      const date = new Date(s.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      return `
        <div class="history-item">
          <div class="history-left">
            <span class="history-dot"></span>
            <strong>${date}</strong>
          </div>
          <div>
            <span>Reviewed: <strong>${s.total}</strong> cards</span>
            <span style="margin-left: 10px; color: var(--secondary)">Accuracy: <strong>${s.accuracy}%</strong></span>
          </div>
          <div class="history-right">
            <span>(${s.recalled} Correct / ${s.forgotten} Wrong)</span>
          </div>
        </div>
      `;
    }).join('');
  }

  container.innerHTML = `
    <div class="stats-page-wrapper">
      <h2 class="margin-bottom-md"><i class="fa-solid fa-chart-pie"></i> Study Analytics</h2>
      
      <!-- Overview Grid Cards -->
      <div class="stats-overview-grid">
        <div class="stat-card">
          <span class="stat-card-value">${stats.total}</span>
          <span class="stat-card-label">Total Cards</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-value">${stats.hiragana || 0}</span>
          <span class="stat-card-label">Hiragana</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-value">${stats.katakana || 0}</span>
          <span class="stat-card-label">Katakana</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-value">${stats.verbs}</span>
          <span class="stat-card-label">Verbs</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-value">${stats.sentences}</span>
          <span class="stat-card-label">Sentences</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-value">${stats.kanji}</span>
          <span class="stat-card-label">Kanji</span>
        </div>
        <div class="stat-card" style="border-color: var(--accent-yellow); grid-column: span 1;">
          <span class="stat-card-value" style="color: var(--accent-yellow);"><i class="fa-solid fa-star"></i> ${stats.favorites}</span>
          <span class="stat-card-label">Favorites</span>
        </div>
      </div>
      
      <!-- Charts and logs row -->
      <div class="stats-charts-row">
        <!-- JLPT distribution -->
        <div class="chart-card">
          <h3>Cards by JLPT Level</h3>
          <div class="custom-bar-chart">
            ${barRowsHTML}
          </div>
        </div>
        
        <!-- Recent logs -->
        <div class="chart-card">
          <h3>Recent Study Sessions</h3>
          <div class="history-list">
            ${sessionsHTML}
          </div>
        </div>
      </div>
    </div>
  `;
}
