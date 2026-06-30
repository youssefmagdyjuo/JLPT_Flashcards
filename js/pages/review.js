/* Review Setup and Study Session Controller Module */

import { getReviewCards, logStudySession } from '../storage.js';
import { showToast } from '../app.js';

export function renderReview(container) {
  // Setup Session State
  let sessionCards = [];
  let currentIndex = 0;
  let score = 0; // count of cards user self-assessed as correct
  let answered = {}; // map of index -> boolean (true: correct, false: incorrect)
  let keyboardHandler = null;

  // Render review configuration form
  function renderSetup() {
    container.innerHTML = `
      <div class="review-setup-wrapper">
        <h2 class="margin-bottom-md"><i class="fa-solid fa-graduation-cap"></i> Configure Review Session</h2>
        
        <div class="form-glass-card setup-grid">
          <!-- Category Option -->
          <div class="form-group">
            <label>Categories (Select one or more)</label>
            <div class="pill-group" id="setup-category">
              <div class="pill-option active" data-val="hiragana">🇯🇵 Hiragana</div>
              <div class="pill-option active" data-val="katakana">🈂️ Katakana</div>
              <div class="pill-option active" data-val="verb">⚡ Verbs</div>
              <div class="pill-option active" data-val="sentence">💬 Sentences</div>
              <div class="pill-option active" data-val="kanji">🈶 Kanji</div>
            </div>
          </div>
          
          <!-- JLPT Level -->
          <div class="form-group">
            <label>JLPT Level</label>
            <div class="pill-group" id="setup-jlpt">
              <div class="pill-option active" data-val="all">All Levels</div>
              <div class="pill-option" data-val="N5">N5</div>
              <div class="pill-option" data-val="N4">N4</div>
              <div class="pill-option" data-val="N3">N3</div>
              <div class="pill-option" data-val="N2">N2</div>
              <div class="pill-option" data-val="N1">N1</div>
            </div>
          </div>
          
          <!-- Question Count -->
          <div class="form-group">
            <label>Question Count</label>
            <div class="pill-group" id="setup-count">
              <div class="pill-option active" data-val="10">10 Cards</div>
              <div class="pill-option" data-val="20">20 Cards</div>
              <div class="pill-option" data-val="30">30 Cards</div>
              <div class="pill-option" data-val="all">All Cards</div>
            </div>
          </div>
          
          <!-- Shuffle -->
          <div class="form-group">
            <label>Shuffle Deck</label>
            <div class="pill-group" id="setup-shuffle">
              <div class="pill-option active" data-val="true">Yes</div>
              <div class="pill-option" data-val="false">No</div>
            </div>
          </div>

          <!-- Bonus: Favorites Review Toggle -->
          <div class="form-group">
            <label>Review Mode</label>
            <div class="pill-group" id="setup-mode">
              <div class="pill-option active" data-val="false">Standard Deck</div>
              <div class="pill-option" data-val="true"><i class="fa-solid fa-star" style="color:var(--accent-yellow)"></i> Favorites Only</div>
            </div>
          </div>
          
          <div class="form-actions" style="margin-top: 10px;">
            <button id="start-session-btn" class="btn primary-btn"><i class="fa-solid fa-play"></i> Start Review</button>
          </div>
        </div>
      </div>
    `;

    // Bind setup option click events
    container.querySelectorAll('.pill-group:not(#setup-category)').forEach(group => {
      group.querySelectorAll('.pill-option').forEach(opt => {
        opt.addEventListener('click', () => {
          group.querySelectorAll('.pill-option').forEach(o => o.classList.remove('active'));
          opt.classList.add('active');
        });
      });
    });

    // Custom multi-select toggle binding for category group
    const catGroup = container.querySelector('#setup-category');
    catGroup.querySelectorAll('.pill-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const activeCount = catGroup.querySelectorAll('.pill-option.active').length;
        // Don't allow deselecting the last active category
        if (opt.classList.contains('active') && activeCount <= 1) {
          showToast('You must keep at least one category selected!', 'info');
          return;
        }
        opt.classList.toggle('active');
      });
    });

    // Start Session click handler
    container.querySelector('#start-session-btn').addEventListener('click', () => {
      const getActiveVal = (id) => container.querySelector(`#${id} .pill-option.active`).getAttribute('data-val');
      
      const selectedCats = Array.from(container.querySelectorAll('#setup-category .pill-option.active')).map(el => el.getAttribute('data-val'));
      
      const filters = {
        categories: selectedCats,
        jlpt: getActiveVal('setup-jlpt'),
        count: getActiveVal('setup-count'),
        shuffle: getActiveVal('setup-shuffle') === 'true',
        favoritesOnly: getActiveVal('setup-mode') === 'true'
      };

      sessionCards = getReviewCards(filters);
      
      if (sessionCards.length === 0) {
        showToast('No cards found matching the criteria. Add cards or modify filters.', 'danger');
        return;
      }

      currentIndex = 0;
      score = 0;
      answered = {};
      
      // Start study stage
      startReviewStage();
    });
  }

  // Study stage view rendering
  function startReviewStage() {
    renderCardStage();
    setupKeyboardShortcuts();
  }

  // Keyboard shortcut listener
  function setupKeyboardShortcuts() {
    // Remove previous handlers to prevent leak
    if (keyboardHandler) {
      document.removeEventListener('keydown', keyboardHandler);
    }

    keyboardHandler = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        flipCard();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        goPrevious();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };

    document.addEventListener('keydown', keyboardHandler);
  }

  function flipCard() {
    const studyCard = container.querySelector('#study-card');
    if (studyCard) {
      studyCard.classList.toggle('is-flipped');
    }
  }

  function goPrevious() {
    if (currentIndex > 0) {
      currentIndex--;
      renderActiveCard();
    } else {
      showToast('Already at the first card', 'info');
    }
  }

  function goNext() {
    if (currentIndex < sessionCards.length - 1) {
      currentIndex++;
      renderActiveCard();
    } else {
      // Prompt completion if at last card
      showToast('You reached the end of the session! Click Finish to save.', 'info');
    }
  }

  function renderCardStage() {
    container.innerHTML = `
      <div class="review-stage-container">
        <!-- Review session header -->
        <div class="review-session-header">
          <div>
            <span class="progress-info" id="session-progress-text">1 / 10</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" id="session-progress-bar"></div>
          </div>
          <button id="finish-session-btn" class="btn secondary-btn" style="padding: 8px 16px; font-size:0.85rem">
            <i class="fa-solid fa-flag-checkered"></i> Finish
          </button>
        </div>
        
        <!-- 3D Card Scene -->
        <div class="card-scene" id="card-scene-container">
          <div class="study-card" id="study-card">
            <!-- Front and Back injected dynamically -->
          </div>
        </div>

        <div class="keyboard-shortcut-helper">
          <span>Shortcuts: <strong>←</strong> Prev | <strong>→</strong> Next | <strong>Space</strong> Flip Card</span>
        </div>
        
        <!-- Controls -->
        <div class="study-controls">
          <button id="study-prev-btn" class="btn secondary-btn"><i class="fa-solid fa-chevron-left"></i> Previous</button>
          <button id="study-flip-btn" class="btn secondary-btn"><i class="fa-solid fa-rotate"></i> Flip Card</button>
          <button id="study-next-btn" class="btn secondary-btn">Next <i class="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>
    `;

    // Wire buttons
    container.querySelector('#study-prev-btn').addEventListener('click', goPrevious);
    container.querySelector('#study-flip-btn').addEventListener('click', flipCard);
    container.querySelector('#study-next-btn').addEventListener('click', goNext);
    container.querySelector('#card-scene-container').addEventListener('click', flipCard);
    container.querySelector('#finish-session-btn').addEventListener('click', finishSession);

    // Initial card rendering
    renderActiveCard();
  }

  function renderActiveCard() {
    const card = sessionCards[currentIndex];
    const studyCard = container.querySelector('#study-card');
    
    if (!studyCard || !card) return;
    
    // Reset flip status
    studyCard.classList.remove('is-flipped');
    
    // Build Front Side Content
    let frontHTML = '';
    if (card.type === 'kanji') {
      frontHTML = `
        <div class="card-face card-face-front">
          <span class="card-label">Kanji Flashcard</span>
          <span class="card-level-badge">${card.jlpt}</span>
          <div class="card-question" style="font-size: 5rem;">${card.kanji}</div>
          <div class="card-hint-text"><i class="fa-solid fa-lightbulb"></i> Click card to show readings & meaning</div>
        </div>
      `;
    } else {
      frontHTML = `
        <div class="card-face card-face-front">
          <span class="card-label">${card.type} Flashcard</span>
          <span class="card-level-badge">${card.jlpt}</span>
          <div class="card-question">${card.english}</div>
          <div class="card-hint-text"><i class="fa-solid fa-lightbulb"></i> Click card to flip</div>
        </div>
      `;
    }

    // Build Back Side Content
    let backHTML = '';
    if (card.type === 'kanji') {
      backHTML = `
        <div class="card-face card-face-back">
          <span class="card-label">Kanji Details</span>
          <div class="card-japanese" style="font-size: 2.6rem;">${card.kanji}</div>
          <div class="card-reading-large">${card.meaning}</div>
          
          <div class="card-detail-group">
            <div class="detail-row">
              <span class="detail-label">On'yomi (Chinese Reading)</span>
              <span class="detail-val">${card.onyomi || '-'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Kun'yomi (Japanese Reading)</span>
              <span class="detail-val">${card.kunyomi || '-'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Pronunciation</span>
              <span class="detail-val">${card.pronunciation}</span>
            </div>
            ${card.example ? `
              <div class="detail-row">
                <span class="detail-label">Example Sentence</span>
                <span class="detail-val">${card.example} / ${card.translation || ''}</span>
              </div>
            ` : ''}
            ${card.notes ? `
              <div class="detail-row">
                <span class="detail-label">Notes</span>
                <span class="detail-val">${card.notes}</span>
              </div>
            ` : ''}
          </div>
          
          <!-- Premium assessment buttons -->
          <div class="margin-top-md display-flex gap-10" style="width:100%;">
            <button class="btn secondary-btn score-wrong-btn" style="flex:1; border-color: rgba(239, 68, 68, 0.4);"><i class="fa-solid fa-xmark text-danger"></i> Forgot</button>
            <button class="btn primary-btn score-right-btn" style="flex:1; background: linear-gradient(135deg, #10b981, #059669);"><i class="fa-solid fa-check"></i> Recalled</button>
          </div>
        </div>
      `;
    } else {
      let backDetails = '';
      if (card.type === 'sentence') {
        backDetails = `
          <div class="detail-row">
            <span class="detail-label">Grammar / Translation Notes</span>
            <span class="detail-val">${card.translation || '-'}</span>
          </div>
        `;
      }
      
      backHTML = `
        <div class="card-face card-face-back">
          <span class="card-label">${card.type} Details</span>
          <div class="card-japanese">${card.japanese}</div>
          <div class="card-reading-large">${card.pronunciation}</div>
          
          <div class="card-detail-group">
            <div class="detail-row">
              <span class="detail-label">English Definition</span>
              <span class="detail-val">${card.english}</span>
            </div>
            ${backDetails}
            ${card.notes ? `
              <div class="detail-row">
                <span class="detail-label">Notes</span>
                <span class="detail-val">${card.notes}</span>
              </div>
            ` : ''}
          </div>
          
          <!-- Premium assessment buttons -->
          <div class="margin-top-md display-flex gap-10" style="width:100%;">
            <button class="btn secondary-btn score-wrong-btn" style="flex:1; border-color: rgba(239, 68, 68, 0.4);"><i class="fa-solid fa-xmark text-danger"></i> Forgot</button>
            <button class="btn primary-btn score-right-btn" style="flex:1; background: linear-gradient(135deg, #10b981, #059669);"><i class="fa-solid fa-check"></i> Recalled</button>
          </div>
        </div>
      `;
    }

    // Set inside scene
    studyCard.innerHTML = frontHTML + backHTML;

    // Bind score buttons
    const bindScoring = (btnClass, isCorrect) => {
      const btn = studyCard.querySelector(btnClass);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation(); // prevent flip card trigger
          
          const wasScored = answered[currentIndex] !== undefined;
          const wasCorrect = answered[currentIndex] === true;
          
          answered[currentIndex] = isCorrect;
          
          if (!wasScored) {
            if (isCorrect) score++;
          } else {
            // Adjust score if user changed answer
            if (wasCorrect && !isCorrect) score--;
            if (!wasCorrect && isCorrect) score++;
          }
          
          // Auto advance to next card or notify success
          if (currentIndex < sessionCards.length - 1) {
            setTimeout(goNext, 300);
          } else {
            showToast('Last card evaluated! Click Finish to complete session.', 'success');
          }
        });
      }
    };

    bindScoring('.score-right-btn', true);
    bindScoring('.score-wrong-btn', false);

    // Update Progress Indicator Info
    const progressText = container.querySelector('#session-progress-text');
    const progressBar = container.querySelector('#session-progress-bar');
    
    if (progressText) {
      progressText.textContent = `${currentIndex + 1} / ${sessionCards.length}`;
    }
    if (progressBar) {
      const percentage = ((currentIndex + 1) / sessionCards.length) * 100;
      progressBar.style.width = `${percentage}%`;
    }
  }

  function finishSession() {
    // Unbind keyboard shortcuts
    if (keyboardHandler) {
      document.removeEventListener('keydown', keyboardHandler);
      keyboardHandler = null;
    }

    // Calculate final stats
    const totalCardsReviewed = sessionCards.length;
    const answeredCount = Object.keys(answered).length;
    const accuracy = answeredCount > 0 ? Math.round((score / answeredCount) * 100) : 0;
    
    // Log details to localStorage database
    logStudySession({
      total: totalCardsReviewed,
      accuracy: accuracy,
      recalled: score,
      forgotten: answeredCount - score,
      unassessed: totalCardsReviewed - answeredCount
    });

    // Render results view screen
    container.innerHTML = `
      <div class="completion-container glass-card">
        <div class="trophy-icon"><i class="fa-solid fa-trophy"></i></div>
        <h2 class="margin-bottom-md">Study Session Finished!</h2>
        <p class="text-secondary margin-bottom-md">Awesome job! Active recall exercises strengthen synaptic connections in language modules.</p>
        
        <div class="summary-stats-grid margin-bottom-md" style="grid-template-columns: repeat(3, 1fr);">
          <div class="stat-box">
            <span class="stat-num">${totalCardsReviewed}</span>
            <span class="stat-label">Reviewed</span>
          </div>
          <div class="stat-box">
            <span class="stat-num text-success">${score}</span>
            <span class="stat-label">Recalled</span>
          </div>
          <div class="stat-box">
            <span class="stat-num text-info">${accuracy}%</span>
            <span class="stat-label">Accuracy</span>
          </div>
        </div>
        
        <div class="form-actions justify-center">
          <button id="restart-session-btn" class="btn secondary-btn"><i class="fa-solid fa-arrow-rotate-left"></i> Review Again</button>
          <button id="go-home-btn" class="btn primary-btn"><i class="fa-solid fa-house"></i> Home Dashboard</button>
        </div>
      </div>
    `;

    // Bind finishing actions
    container.querySelector('#restart-session-btn').addEventListener('click', () => {
      renderSetup();
    });
    
    container.querySelector('#go-home-btn').addEventListener('click', () => {
      window.location.hash = '#/home';
    });
  }

  // Draw initial form
  renderSetup();
}
