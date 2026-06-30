/* Add / Edit Flashcard Form Controller Module */

import { addCard, updateCard, loadCards } from '../storage.js';
import { showToast } from '../app.js';

export function renderAdd(container) {
  // Parse query params (e.g. #/add?edit=id)
  const hash = window.location.hash;
  let editId = null;
  if (hash.includes('?')) {
    const query = hash.split('?')[1];
    const params = new URLSearchParams(query);
    editId = params.get('edit');
  }

  let editingCard = null;
  if (editId) {
    const cards = loadCards();
    editingCard = cards.find(c => c.id === editId);
  }

  let selectedCategory = editingCard ? editingCard.type : 'hiragana';

  function generateFormHTML(category) {
    if (category === 'word' || category === 'hiragana' || category === 'katakana') {
      return `
        <div class="form-group">
          <label for="english">English Meaning *</label>
          <input type="text" id="english" class="form-control" placeholder="e.g. Friend" value="${editingCard ? editingCard.english : ''}" required>
        </div>
        <div class="form-group">
          <label for="japanese">Japanese (Kanji/Kana) *</label>
          <input type="text" id="japanese" class="form-control" placeholder="e.g. 友達" value="${editingCard ? editingCard.japanese : ''}" required>
        </div>
        <div class="form-group">
          <label for="pronunciation">Pronunciation (Furigana/Romaji) *</label>
          <input type="text" id="pronunciation" class="form-control" placeholder="e.g. ともだち (tomodachi)" value="${editingCard ? editingCard.pronunciation : ''}" required>
        </div>
        <div class="form-group">
          <label for="jlpt">JLPT Level *</label>
          <select id="jlpt" class="form-control" required>
            <option value="N5" ${editingCard && editingCard.jlpt === 'N5' ? 'selected' : ''}>N5</option>
            <option value="N4" ${editingCard && editingCard.jlpt === 'N4' ? 'selected' : ''}>N4</option>
            <option value="N3" ${editingCard && editingCard.jlpt === 'N3' ? 'selected' : ''}>N3</option>
            <option value="N2" ${editingCard && editingCard.jlpt === 'N2' ? 'selected' : ''}>N2</option>
            <option value="N1" ${editingCard && editingCard.jlpt === 'N1' ? 'selected' : ''}>N1</option>
          </select>
        </div>
        <div class="form-group span-2">
          <label for="notes">Notes (Optional)</label>
          <textarea id="notes" class="form-control" placeholder="e.g. Often used in casual conversations...">${editingCard && editingCard.notes ? editingCard.notes : ''}</textarea>
        </div>
      `;
    } else if (category === 'verb') {
      return `
        <div class="form-group">
          <label for="english">English Meaning *</label>
          <input type="text" id="english" class="form-control" placeholder="e.g. To eat" value="${editingCard ? editingCard.english : ''}" required>
        </div>
        <div class="form-group">
          <label for="japanese">Japanese Kanji/Kana *</label>
          <input type="text" id="japanese" class="form-control" placeholder="e.g. 食べる" value="${editingCard ? editingCard.japanese : ''}" required>
        </div>
        <div class="form-group">
          <label for="pronunciation">Pronunciation *</label>
          <input type="text" id="pronunciation" class="form-control" placeholder="e.g. たべる (taberu)" value="${editingCard ? editingCard.pronunciation : ''}" required>
        </div>
        <div class="form-group">
          <label for="jlpt">JLPT Level *</label>
          <select id="jlpt" class="form-control" required>
            <option value="N5" ${editingCard && editingCard.jlpt === 'N5' ? 'selected' : ''}>N5</option>
            <option value="N4" ${editingCard && editingCard.jlpt === 'N4' ? 'selected' : ''}>N4</option>
            <option value="N3" ${editingCard && editingCard.jlpt === 'N3' ? 'selected' : ''}>N3</option>
            <option value="N2" ${editingCard && editingCard.jlpt === 'N2' ? 'selected' : ''}>N2</option>
            <option value="N1" ${editingCard && editingCard.jlpt === 'N1' ? 'selected' : ''}>N1</option>
          </select>
        </div>
        <div class="form-group span-2">
          <label for="notes">Conjugation / Grammar Notes</label>
          <textarea id="notes" class="form-control" placeholder="e.g. Ru-verb (Group 2). Polite: 食べます">${editingCard && editingCard.notes ? editingCard.notes : ''}</textarea>
        </div>
      `;
    } else if (category === 'sentence') {
      return `
        <div class="form-group">
          <label for="english">English Meaning *</label>
          <input type="text" id="english" class="form-control" placeholder="e.g. I like Japanese language." value="${editingCard ? editingCard.english : ''}" required>
        </div>
        <div class="form-group">
          <label for="japanese">Japanese Sentence *</label>
          <input type="text" id="japanese" class="form-control" placeholder="e.g. 日本語が好きです。" value="${editingCard ? editingCard.japanese : ''}" required>
        </div>
        <div class="form-group">
          <label for="pronunciation">Pronunciation Reading *</label>
          <input type="text" id="pronunciation" class="form-control" placeholder="e.g. にほんごがすきです" value="${editingCard ? editingCard.pronunciation : ''}" required>
        </div>
        <div class="form-group">
          <label for="jlpt">JLPT Level *</label>
          <select id="jlpt" class="form-control" required>
            <option value="N5" ${editingCard && editingCard.jlpt === 'N5' ? 'selected' : ''}>N5</option>
            <option value="N4" ${editingCard && editingCard.jlpt === 'N4' ? 'selected' : ''}>N4</option>
            <option value="N3" ${editingCard && editingCard.jlpt === 'N3' ? 'selected' : ''}>N3</option>
            <option value="N2" ${editingCard && editingCard.jlpt === 'N2' ? 'selected' : ''}>N2</option>
            <option value="N1" ${editingCard && editingCard.jlpt === 'N1' ? 'selected' : ''}>N1</option>
          </select>
        </div>
        <div class="form-group span-2">
          <label for="translation">Translation Notes / Breakdown</label>
          <textarea id="translation" class="form-control" placeholder="e.g. 日本語 (Japanese) + が (particle) + 好き (like) + です (is)">${editingCard && editingCard.translation ? editingCard.translation : ''}</textarea>
        </div>
        <div class="form-group span-2">
          <label for="notes">General Notes (Optional)</label>
          <textarea id="notes" class="form-control" placeholder="e.g. Commonly used to state a preference...">${editingCard && editingCard.notes ? editingCard.notes : ''}</textarea>
        </div>
      `;
    } else if (category === 'kanji') {
      return `
        <div class="form-group">
          <label for="kanji">Kanji Character *</label>
          <input type="text" id="kanji" class="form-control" placeholder="e.g. 水" value="${editingCard ? editingCard.kanji : ''}" required>
        </div>
        <div class="form-group">
          <label for="meaning">English Meaning *</label>
          <input type="text" id="meaning" class="form-control" placeholder="e.g. Water" value="${editingCard ? editingCard.meaning : ''}" required>
        </div>
        <div class="form-group">
          <label for="onyomi">On Reading (On'yomi)</label>
          <input type="text" id="onyomi" class="form-control" placeholder="e.g. スイ (sui)" value="${editingCard ? editingCard.onyomi : ''}">
        </div>
        <div class="form-group">
          <label for="kunyomi">Kun Reading (Kun'yomi)</label>
          <input type="text" id="kunyomi" class="form-control" placeholder="e.g. みず (mizu)" value="${editingCard ? editingCard.kunyomi : ''}">
        </div>
        <div class="form-group">
          <label for="pronunciation">Pronunciation *</label>
          <input type="text" id="pronunciation" class="form-control" placeholder="e.g. みず" value="${editingCard ? editingCard.pronunciation : ''}" required>
        </div>
        <div class="form-group">
          <label for="jlpt">JLPT Level *</label>
          <select id="jlpt" class="form-control" required>
            <option value="N5" ${editingCard && editingCard.jlpt === 'N5' ? 'selected' : ''}>N5</option>
            <option value="N4" ${editingCard && editingCard.jlpt === 'N4' ? 'selected' : ''}>N4</option>
            <option value="N3" ${editingCard && editingCard.jlpt === 'N3' ? 'selected' : ''}>N3</option>
            <option value="N2" ${editingCard && editingCard.jlpt === 'N2' ? 'selected' : ''}>N2</option>
            <option value="N1" ${editingCard && editingCard.jlpt === 'N1' ? 'selected' : ''}>N1</option>
          </select>
        </div>
        <div class="form-group">
          <label for="example">Example Sentence</label>
          <input type="text" id="example" class="form-control" placeholder="e.g. 水道" value="${editingCard ? editingCard.example : ''}">
        </div>
        <div class="form-group">
          <label for="translation">Example Translation</label>
          <input type="text" id="translation" class="form-control" placeholder="e.g. Tap water" value="${editingCard ? editingCard.translation : ''}">
        </div>
        <div class="form-group span-2">
          <label for="notes">Kanji Notes (Radicals, Origins)</label>
          <textarea id="notes" class="form-control" placeholder="e.g. Represents flowing water stream.">${editingCard && editingCard.notes ? editingCard.notes : ''}</textarea>
        </div>
      `;
    }
  }

  function updateFormFields() {
    const fieldsContainer = document.getElementById('dynamic-form-fields');
    if (fieldsContainer) {
      fieldsContainer.innerHTML = generateFormHTML(selectedCategory);
    }
  }

  // Initial Container rendering
  container.innerHTML = `
    <div class="add-page-wrapper">
      <h2 class="margin-bottom-md"><i class="fa-solid fa-edit"></i> ${editingCard ? 'Edit Flashcard' : 'Create New Flashcard'}</h2>
      
      <!-- Category Selection Pills (Disabled when editing to avoid schema confusion) -->
      <div class="category-selector-pills">
        <div class="cat-pill ${selectedCategory === 'hiragana' ? 'active' : ''} ${editingCard ? 'disabled' : ''}" data-cat="hiragana">🇯🇵 Hiragana</div>
        <div class="cat-pill ${selectedCategory === 'katakana' ? 'active' : ''} ${editingCard ? 'disabled' : ''}" data-cat="katakana">🈂️ Katakana</div>
        <div class="cat-pill ${selectedCategory === 'verb' ? 'active' : ''} ${editingCard ? 'disabled' : ''}" data-cat="verb">⚡ Verbs</div>
        <div class="cat-pill ${selectedCategory === 'sentence' ? 'active' : ''} ${editingCard ? 'disabled' : ''}" data-cat="sentence">💬 Sentences</div>
        <div class="cat-pill ${selectedCategory === 'kanji' ? 'active' : ''} ${editingCard ? 'disabled' : ''}" data-cat="kanji">🈶 Kanji</div>
      </div>
      
      <form id="flashcard-form" class="form-glass-card">
        <div id="dynamic-form-fields" class="form-grid">
          <!-- Dynamic -->
        </div>
        
        <div class="form-actions">
          <button type="button" id="form-cancel" class="btn secondary-btn">Cancel</button>
          <button type="submit" class="btn primary-btn"><i class="fa-solid fa-save"></i> Save Flashcard</button>
        </div>
      </form>
    </div>
  `;

  // Draw initial form fields
  updateFormFields();

  // Category Switch Event Listeners (only allowed when not editing)
  if (!editingCard) {
    container.querySelectorAll('.cat-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        container.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        selectedCategory = pill.getAttribute('data-cat');
        updateFormFields();
      });
    });
  }

  // Cancel trigger
  const cancelBtn = container.querySelector('#form-cancel');
  cancelBtn.addEventListener('click', () => {
    window.location.hash = '#/library';
  });

  // Form Submit Action
  const form = container.querySelector('#flashcard-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Gathers fields based on active state
    const cardObj = {
      type: selectedCategory,
      jlpt: container.querySelector('#jlpt').value,
      notes: container.querySelector('#notes').value || ''
    };
    
    if (selectedCategory === 'word' || selectedCategory === 'verb' || selectedCategory === 'hiragana' || selectedCategory === 'katakana') {
      cardObj.english = container.querySelector('#english').value.trim();
      cardObj.japanese = container.querySelector('#japanese').value.trim();
      cardObj.pronunciation = container.querySelector('#pronunciation').value.trim();
    } else if (selectedCategory === 'sentence') {
      cardObj.english = container.querySelector('#english').value.trim();
      cardObj.japanese = container.querySelector('#japanese').value.trim();
      cardObj.pronunciation = container.querySelector('#pronunciation').value.trim();
      cardObj.translation = container.querySelector('#translation').value.trim();
    } else if (selectedCategory === 'kanji') {
      cardObj.kanji = container.querySelector('#kanji').value.trim();
      cardObj.meaning = container.querySelector('#meaning').value.trim();
      cardObj.onyomi = container.querySelector('#onyomi').value.trim();
      cardObj.kunyomi = container.querySelector('#kunyomi').value.trim();
      cardObj.pronunciation = container.querySelector('#pronunciation').value.trim();
      cardObj.example = container.querySelector('#example').value.trim();
      cardObj.translation = container.querySelector('#translation').value.trim();
    }

    if (editingCard) {
      cardObj.id = editingCard.id;
      cardObj.favorite = editingCard.favorite;
      updateCard(cardObj);
      showToast('Flashcard updated successfully!', 'success');
    } else {
      addCard(cardObj);
      showToast('New flashcard added successfully!', 'success');
    }
    
    // Redirect to library
    window.location.hash = '#/library';
  });
}
