/* Review Setup and Study Session Controller Module */

import { getReviewCards, logStudySession } from '../storage.js';
import { showToast } from '../app.js';

export function renderReview(container) {
  // Setup Session State
  let sessionCards = [];
  let cardsPerPage = 4; // cards displayed per round
  let currentRound = 0; // current round index
  let score = 0; // count of cards user self-assessed as correct
  let answered = {}; // map of global card index -> boolean (true: correct, false: incorrect)
  let keyboardHandler = null;
  let isNavigating = false;

  // Render review configuration form
  function renderSetup() {
    container.innerHTML = `
      <div class="review-setup-wrapper">
        <h2 class="margin-bottom-md"><i class="fa-solid fa-graduation-cap"></i> Configure Review Session</h2>
        
        <div class="form-glass-card setup-grid">
          <!-- Category Option (Default: Hiragana ONLY) -->
          <div class="form-group">
            <label>Categories (Select one or more)</label>
            <div class="pill-group" id="setup-category">
              <div class="pill-option active" data-val="hiragana">🇯🇵 Hiragana</div>
              <div class="pill-option" data-val="katakana">🈂️ Katakana</div>
              <div class="pill-option" data-val="verb">⚡ Verbs</div>
              <div class="pill-option" data-val="sentence">💬 Sentences</div>
              <div class="pill-option" data-val="kanji">🈶 Kanji</div>
            </div>
          </div>
          
          <!-- Cards Per Round -->
          <div class="form-group">
            <label>Cards Per Round</label>
            <div class="pill-group" id="setup-cards-per-page">
              <div class="pill-option" data-val="1">1 Card</div>
              <div class="pill-option" data-val="2">2 Cards</div>
              <div class="pill-option active" data-val="4">4 Cards</div>
              <div class="pill-option" data-val="6">6 Cards</div>
              <div class="pill-option" data-val="8">8 Cards</div>
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

          <!-- Favorites Review Toggle -->
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

    // Bind setup option click events for single-choice pill groups
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
      cardsPerPage = parseInt(getActiveVal('setup-cards-per-page'), 10) || 4;
      
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

      currentRound = 0;
      score = 0;
      answered = {};
      isNavigating = false;
      
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
    if (keyboardHandler) {
      document.removeEventListener('keydown', keyboardHandler);
    }

    keyboardHandler = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggleFlipAll();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        goPreviousRound();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        goNextRound();
      }
    };

    document.addEventListener('keydown', keyboardHandler);
  }

  // Generate Card Front HTML
  function generateCardFrontHTML(card, isMultiCard) {
    if (card.type === 'kanji') {
      return `
        <div class="card-face card-face-front">
          <span class="card-label">Kanji Flashcard</span>
          <span class="card-level-badge">${card.jlpt || 'N5'}</span>
          <div class="card-question" style="font-size: ${isMultiCard ? '3.2rem' : '4.8rem'};">${card.kanji}</div>
          <div class="card-hint-text"><i class="fa-solid fa-rotate"></i> Click card to show details</div>
        </div>
      `;
    }
    return `
      <div class="card-face card-face-front">
        <span class="card-label">${card.type} Flashcard</span>
        <span class="card-level-badge">${card.jlpt || 'N5'}</span>
        <div class="card-question" style="font-size: ${isMultiCard ? '2.4rem' : '3.2rem'};">${card.english}</div>
        <div class="card-hint-text"><i class="fa-solid fa-rotate"></i> Click card to flip</div>
      </div>
    `;
  }

  // Generate Card Back HTML
  function generateCardBackHTML(card, globalIdx, isMultiCard) {
    const isRecalled = answered[globalIdx] === true;
    const isForgot = answered[globalIdx] === false;

    if (card.type === 'kanji') {
      return `
        <div class="card-face card-face-back">
          <span class="card-label">Kanji Details</span>
          <div class="card-japanese" style="font-size: ${isMultiCard ? '2rem' : '2.6rem'};">${card.kanji}</div>
          <div class="card-reading-large">${card.meaning}</div>
          
          <div class="card-detail-group">
            <div class="detail-row">
              <span class="detail-label">On'yomi</span>
              <span class="detail-val">${card.onyomi || '-'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Kun'yomi</span>
              <span class="detail-val">${card.kunyomi || '-'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Pronunciation</span>
              <span class="detail-val">${card.pronunciation || '-'}</span>
            </div>
            ${card.example && !isMultiCard ? `
              <div class="detail-row">
                <span class="detail-label">Example</span>
                <span class="detail-val">${card.example} / ${card.translation || ''}</span>
              </div>
            ` : ''}
          </div>
          
          <div class="margin-top-md display-flex gap-10" style="width:100%;">
            <button class="btn secondary-btn score-wrong-btn ${isForgot ? 'active-choice' : ''}" data-idx="${globalIdx}" style="flex:1; border-color: rgba(239, 68, 68, 0.4);">
              <i class="fa-solid fa-xmark text-danger"></i> Forgot
            </button>
            <button class="btn primary-btn score-right-btn ${isRecalled ? 'active-choice' : ''}" data-idx="${globalIdx}" style="flex:1; background: linear-gradient(135deg, #10b981, #059669);">
              <i class="fa-solid fa-check"></i> Recalled
            </button>
          </div>
        </div>
      `;
    }

    let backDetails = '';
    if (card.type === 'sentence') {
      backDetails = `
        <div class="detail-row">
          <span class="detail-label">Grammar Notes</span>
          <span class="detail-val">${card.translation || '-'}</span>
        </div>
      `;
    }

    return `
      <div class="card-face card-face-back">
        <span class="card-label">${card.type} Details</span>
        <div class="card-japanese">${card.japanese}</div>
        <div class="card-reading-large">${card.pronunciation}</div>
        
        <div class="card-detail-group">
          <div class="detail-row">
            <span class="detail-label">English</span>
            <span class="detail-val">${card.english}</span>
          </div>
          ${backDetails}
          ${card.notes && !isMultiCard ? `
            <div class="detail-row">
              <span class="detail-label">Notes</span>
              <span class="detail-val">${card.notes}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="margin-top-md display-flex gap-10" style="width:100%;">
          <button class="btn secondary-btn score-wrong-btn ${isForgot ? 'active-choice' : ''}" data-idx="${globalIdx}" style="flex:1; border-color: rgba(239, 68, 68, 0.4);">
            <i class="fa-solid fa-xmark text-danger"></i> Forgot
          </button>
          <button class="btn primary-btn score-right-btn ${isRecalled ? 'active-choice' : ''}" data-idx="${globalIdx}" style="flex:1; background: linear-gradient(135deg, #10b981, #059669);">
            <i class="fa-solid fa-check"></i> Recalled
          </button>
        </div>
      </div>
    `;
  }

  // Navigation between rounds / pages
  function goToRound(targetRound) {
    if (isNavigating) return;
    const totalRounds = Math.ceil(sessionCards.length / cardsPerPage);

    if (targetRound < 0) {
      showToast('Already at the first round', 'info');
      return;
    }
    if (targetRound >= totalRounds) {
      finishSession();
      return;
    }

    const grid = container.querySelector('#cards-stage-grid');
    const flippedCards = grid ? Array.from(grid.querySelectorAll('.study-card.is-flipped')) : [];

    if (flippedCards.length > 0) {
      isNavigating = true;

      // Rotate any flipped cards back to the front face (original design, visible 3D flip)
      flippedCards.forEach(card => card.classList.remove('is-flipped'));

      // Wait 600ms matching CSS flip transition so next round's text is delayed and NOT spoiled!
      setTimeout(() => {
        currentRound = targetRound;
        renderActiveRound();
        isNavigating = false;
      }, 600);
    } else {
      currentRound = targetRound;
      renderActiveRound();
    }
  }

  function goPreviousRound() {
    goToRound(currentRound - 1);
  }

  function goNextRound() {
    goToRound(currentRound + 1);
  }

  function toggleFlipAll() {
    if (isNavigating) return;
    const grid = container.querySelector('#cards-stage-grid');
    if (!grid) return;

    const cards = grid.querySelectorAll('.study-card');
    const hasUnflipped = Array.from(cards).some(c => !c.classList.contains('is-flipped'));

    cards.forEach(card => {
      if (hasUnflipped) {
        card.classList.add('is-flipped');
      } else {
        card.classList.remove('is-flipped');
      }
    });
  }

  function renderCardStage() {
    const isMulti = cardsPerPage > 1;

    container.innerHTML = `
      <div class="review-stage-container">
        <!-- Review session header -->
        <div class="review-session-header">
          <div>
            <span class="progress-info" id="session-progress-text"></span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" id="session-progress-bar"></div>
          </div>
          <button id="finish-session-btn" class="btn secondary-btn" style="padding: 8px 16px; font-size:0.85rem">
            <i class="fa-solid fa-flag-checkered"></i> Finish
          </button>
        </div>
        
        <!-- Multi-Card 3D Stage Grid -->
        <div class="cards-stage-grid grid-${cardsPerPage} ${isMulti ? 'multi-card' : ''}" id="cards-stage-grid">
          <!-- Dynamically injected round cards -->
        </div>

        <div class="keyboard-shortcut-helper">
          <span>Shortcuts: <strong>←</strong> Prev ${isMulti ? 'Round' : 'Card'} | <strong>→</strong> Next ${isMulti ? 'Round' : 'Card'} | Click any card to flip individually</span>
        </div>
        
        <!-- Controls -->
        <div class="study-controls">
          <button id="study-prev-btn" class="btn secondary-btn"><i class="fa-solid fa-chevron-left"></i> Previous ${isMulti ? 'Round' : 'Card'}</button>
          <button id="study-flip-all-btn" class="btn secondary-btn"><i class="fa-solid fa-rotate"></i> Flip ${isMulti ? 'All Cards' : 'Card'}</button>
          <button id="study-next-btn" class="btn primary-btn">Next ${isMulti ? 'Round' : 'Card'} <i class="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>
    `;

    // Wire stage navigation buttons
    container.querySelector('#study-prev-btn').addEventListener('click', goPreviousRound);
    container.querySelector('#study-flip-all-btn').addEventListener('click', toggleFlipAll);
    container.querySelector('#study-next-btn').addEventListener('click', goNextRound);
    container.querySelector('#finish-session-btn').addEventListener('click', finishSession);

    // Initial round cards rendering
    renderActiveRound();
  }

  function renderActiveRound() {
    const grid = container.querySelector('#cards-stage-grid');
    if (!grid) return;

    const totalRounds = Math.ceil(sessionCards.length / cardsPerPage);
    const startIdx = currentRound * cardsPerPage;
    const endIdx = Math.min(startIdx + cardsPerPage, sessionCards.length);
    const roundCards = sessionCards.slice(startIdx, endIdx);
    const isMulti = cardsPerPage > 1;

    // Build grid items HTML
    grid.innerHTML = roundCards.map((card, offset) => {
      const globalIdx = startIdx + offset;
      const frontHTML = generateCardFrontHTML(card, isMulti);
      const backHTML = generateCardBackHTML(card, globalIdx, isMulti);
      const isRecalled = answered[globalIdx] === true;
      const isForgot = answered[globalIdx] === false;
      const assessedClass = isRecalled ? 'assessed-recalled' : (isForgot ? 'assessed-forgot' : '');

      return `
        <div class="card-scene" data-card-idx="${globalIdx}">
          <div class="study-card ${assessedClass}" id="study-card-${globalIdx}">
            ${frontHTML}
            ${backHTML}
          </div>
        </div>
      `;
    }).join('');

    // Attach click to flip each card individually
    grid.querySelectorAll('.card-scene').forEach(scene => {
      scene.addEventListener('click', (e) => {
        if (isNavigating) return;
        const studyCard = scene.querySelector('.study-card');
        if (studyCard) {
          studyCard.classList.toggle('is-flipped');
        }
      });
    });

    // Attach scoring button listeners
    grid.querySelectorAll('.score-right-btn, .score-wrong-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent card flip
        if (isNavigating) return;

        const globalIdx = parseInt(btn.getAttribute('data-idx'), 10);
        const isCorrect = btn.classList.contains('score-right-btn');
        const wasScored = answered[globalIdx] !== undefined;
        const wasCorrect = answered[globalIdx] === true;

        answered[globalIdx] = isCorrect;

        if (!wasScored) {
          if (isCorrect) score++;
        } else {
          if (wasCorrect && !isCorrect) score--;
          if (!wasCorrect && isCorrect) score++;
        }

        // Visual feedback on card
        const cardElem = grid.querySelector(`#study-card-${globalIdx}`);
        if (cardElem) {
          cardElem.classList.remove('assessed-recalled', 'assessed-forgot');
          cardElem.classList.add(isCorrect ? 'assessed-recalled' : 'assessed-forgot');
          
          const parentScene = cardElem.closest('.card-scene');
          if (parentScene) {
            parentScene.querySelectorAll('.score-right-btn, .score-wrong-btn').forEach(b => b.classList.remove('active-choice'));
            btn.classList.add('active-choice');
          }
        }

        // If single card mode, auto advance after 300ms
        if (cardsPerPage === 1) {
          if (currentRound < totalRounds - 1) {
            setTimeout(goNextRound, 300);
          } else {
            showToast('Last card evaluated! Click Finish to complete session.', 'success');
          }
        }
      });
    });

    // Update Progress header
    const progressText = container.querySelector('#session-progress-text');
    const progressBar = container.querySelector('#session-progress-bar');
    
    if (progressText) {
      if (cardsPerPage === 1) {
        progressText.textContent = `${currentRound + 1} / ${sessionCards.length}`;
      } else {
        progressText.textContent = `Round ${currentRound + 1} of ${totalRounds} (Cards ${startIdx + 1}–${endIdx} of ${sessionCards.length})`;
      }
    }
    if (progressBar) {
      const percentage = (endIdx / sessionCards.length) * 100;
      progressBar.style.width = `${percentage}%`;
    }

    // Update Next button label on last round
    const nextBtn = container.querySelector('#study-next-btn');
    if (nextBtn) {
      if (currentRound === totalRounds - 1) {
        nextBtn.innerHTML = `<i class="fa-solid fa-flag-checkered"></i> Finish`;
        nextBtn.classList.add('primary-btn');
      } else {
        nextBtn.innerHTML = `Next ${isMulti ? 'Round' : 'Card'} <i class="fa-solid fa-chevron-right"></i>`;
      }
    }

    const prevBtn = container.querySelector('#study-prev-btn');
    if (prevBtn) {
      prevBtn.disabled = currentRound === 0;
    }
  }

  function finishSession() {
    isNavigating = false;
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
