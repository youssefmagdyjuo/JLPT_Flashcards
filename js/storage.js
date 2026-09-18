/* LocalStorage Database & Business Logic API */

const CARDS_KEY = 'jlpt_flashcards_db';
const SESSIONS_KEY = 'jlpt_flashcards_sessions';

// Default initial data to make the app look premium and functional on first load
const DEFAULT_CARDS = [
  {
    id: 'def-h1',
    type: 'hiragana',
    english: 'A',
    japanese: 'あ',
    pronunciation: 'a',
    jlpt: 'N5',
    notes: 'First character in Hiragana syllabary.',
    favorite: true,
    createdAt: Date.now()
  },
  {
    id: 'def-h2',
    type: 'hiragana',
    english: 'I',
    japanese: 'い',
    pronunciation: 'i',
    jlpt: 'N5',
    notes: 'Second character in Hiragana syllabary.',
    favorite: false,
    createdAt: Date.now()
  },
  {
    id: 'def-h3',
    type: 'hiragana',
    english: 'U',
    japanese: 'う',
    pronunciation: 'u',
    jlpt: 'N5',
    notes: 'Third character in Hiragana syllabary.',
    favorite: false,
    createdAt: Date.now()
  },
  {
    id: 'def-h4',
    type: 'hiragana',
    english: 'E',
    japanese: 'え',
    pronunciation: 'e',
    jlpt: 'N5',
    notes: 'Fourth character in Hiragana syllabary.',
    favorite: false,
    createdAt: Date.now()
  },
  {
    id: 'def-h5',
    type: 'hiragana',
    english: 'O',
    japanese: 'お',
    pronunciation: 'o',
    jlpt: 'N5',
    notes: 'Fifth character in Hiragana syllabary.',
    favorite: false,
    createdAt: Date.now()
  },
  {
    id: 'def-h6',
    type: 'hiragana',
    english: 'KA',
    japanese: 'か',
    pronunciation: 'ka',
    jlpt: 'N5',
    notes: 'K-row character in Hiragana.',
    favorite: false,
    createdAt: Date.now()
  },
  {
    id: 'def-h7',
    type: 'hiragana',
    english: 'KI',
    japanese: 'き',
    pronunciation: 'ki',
    jlpt: 'N5',
    notes: 'K-row character in Hiragana.',
    favorite: false,
    createdAt: Date.now()
  },
  {
    id: 'def-h8',
    type: 'hiragana',
    english: 'KU',
    japanese: 'く',
    pronunciation: 'ku',
    jlpt: 'N5',
    notes: 'K-row character in Hiragana.',
    favorite: false,
    createdAt: Date.now()
  },
  {
    id: 'def-h9',
    type: 'hiragana',
    english: 'KE',
    japanese: 'け',
    pronunciation: 'ke',
    jlpt: 'N5',
    notes: 'K-row character in Hiragana.',
    favorite: false,
    createdAt: Date.now()
  },
  {
    id: 'def-h10',
    type: 'hiragana',
    english: 'KO',
    japanese: 'こ',
    pronunciation: 'ko',
    jlpt: 'N5',
    notes: 'K-row character in Hiragana.',
    favorite: false,
    createdAt: Date.now()
  },
  {
    id: 'def-k1',
    type: 'katakana',
    english: 'KA',
    japanese: 'カ',
    pronunciation: 'ka',
    jlpt: 'N5',
    notes: 'Katakana character for KA.',
    favorite: false,
    createdAt: Date.now()
  },
  {
    id: 'def-2',
    type: 'verb',
    english: 'To eat',
    japanese: '食べる',
    pronunciation: 'たべる (taberu)',
    jlpt: 'N5',
    notes: 'Ru-verb (Group 2 verb).',
    favorite: false,
    createdAt: Date.now()
  },
  {
    id: 'def-3',
    type: 'sentence',
    english: 'I like Japanese language.',
    japanese: '日本語が好きです。',
    pronunciation: 'にほんごがすきです (nihongo ga suki desu)',
    jlpt: 'N5',
    notes: '「غا」 particle is used before 「好き」.',
    favorite: true,
    createdAt: Date.now()
  },
  {
    id: 'def-4',
    type: 'kanji',
    kanji: '水',
    meaning: 'Water',
    onyomi: 'スイ (sui)',
    kunyomi: 'みず (mizu)',
    pronunciation: 'みず (mizu)',
    jlpt: 'N5',
    example: '水道 (すいどう - tap water)',
    translation: 'Tap water',
    notes: 'Radical is water itself.',
    favorite: false,
    createdAt: Date.now()
  }
];

// Initialize Storage
export function initStorage() {
  if (!localStorage.getItem(CARDS_KEY)) {
    localStorage.setItem(CARDS_KEY, JSON.stringify(DEFAULT_CARDS));
  }
  if (!localStorage.getItem(SESSIONS_KEY)) {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([]));
  }
}

// Load all cards
export function loadCards() {
  initStorage();
  try {
    return JSON.parse(localStorage.getItem(CARDS_KEY)) || [];
  } catch (e) {
    console.error('Failed to parse cards database', e);
    return [];
  }
}

// Save all cards
export function saveCards(cards) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

// Add a single card
export function addCard(cardData) {
  const cards = loadCards();
  const newCard = {
    ...cardData,
    id: 'card-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    favorite: false,
    createdAt: Date.now()
  };
  cards.push(newCard);
  saveCards(cards);
  return newCard;
}

// Update a card
export function updateCard(updatedCard) {
  const cards = loadCards();
  const index = cards.findIndex(c => c.id === updatedCard.id);
  if (index !== -1) {
    cards[index] = { ...cards[index], ...updatedCard };
    saveCards(cards);
    return true;
  }
  return false;
}

// Delete a card
export function deleteCard(id) {
  let cards = loadCards();
  cards = cards.filter(c => c.id !== id);
  saveCards(cards);
}

// Duplicate card
export function duplicateCard(id) {
  const cards = loadCards();
  const card = cards.find(c => c.id === id);
  if (card) {
    const copy = {
      ...card,
      id: 'card-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      favorite: false,
      createdAt: Date.now()
    };
    // Append Copy to title or Japanese if helpful
    if (copy.type === 'kanji') {
      copy.notes = (copy.notes || '') + ' (Copy)';
    } else {
      copy.english = copy.english + ' (Copy)';
    }
    cards.push(copy);
    saveCards(cards);
    return copy;
  }
  return null;
}

// Toggle favorite state
export function toggleFavorite(id) {
  const cards = loadCards();
  const card = cards.find(c => c.id === id);
  if (card) {
    card.favorite = !card.favorite;
    saveCards(cards);
    return card.favorite;
  }
  return false;
}

// Check if card is a duplicate based on type and unique content
export function getDuplicate(card, cardsList) {
  return cardsList.find(c => {
    if (c.type !== card.type) return false;
    if (card.type === 'kanji') {
      return (c.kanji || '').trim().toLowerCase() === (card.kanji || '').trim().toLowerCase();
    } else {
      return (c.japanese || '').trim().toLowerCase() === (card.japanese || '').trim().toLowerCase() &&
             (c.english || '').trim().toLowerCase() === (card.english || '').trim().toLowerCase();
    }
  });
}

// Shuffle Cards Utility
export function shuffleCards(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Get review cards based on filter parameters
export function getReviewCards(filters) {
  const cards = loadCards();
  let filtered = cards;

  // Categories filter: array of types (checkboxes support)
  if (filters.categories && filters.categories.length > 0) {
    filtered = filtered.filter(c => filters.categories.includes(c.type));
  }

  // JLPT Filter: All, N5, N4, N3, N2, N1
  if (filters.jlpt && filters.jlpt !== 'all') {
    filtered = filtered.filter(c => c.jlpt === filters.jlpt);
  }

  // Favorites mode check
  if (filters.favoritesOnly) {
    filtered = filtered.filter(c => c.favorite);
  }

  // Shuffle option
  if (filters.shuffle) {
    filtered = shuffleCards(filtered);
  }

  // Count limit (e.g. 10, 20, 30, 50, all)
  if (filters.count && filters.count !== 'all') {
    const countVal = parseInt(filters.count, 10);
    if (!isNaN(countVal)) {
      filtered = filtered.slice(0, countVal);
    }
  }

  return filtered;
}

// Log study sessions
export function logStudySession(session) {
  try {
    const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY)) || [];
    sessions.push({
      id: 'session-' + Date.now(),
      date: new Date().toISOString(),
      ...session
    });
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to log study session', e);
  }
}

// Load study sessions
export function loadSessions() {
  initStorage();
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY)) || [];
  } catch (e) {
    console.error('Failed to parse sessions', e);
    return [];
  }
}

// Get summary counts
export function getStats() {
  const cards = loadCards();
  const sessions = loadSessions();
  
  const stats = {
    total: cards.length,
    hiragana: cards.filter(c => c.type === 'hiragana').length,
    katakana: cards.filter(c => c.type === 'katakana').length,
    verbs: cards.filter(c => c.type === 'verb').length,
    sentences: cards.filter(c => c.type === 'sentence').length,
    kanji: cards.filter(c => c.type === 'kanji').length,
    favorites: cards.filter(c => c.favorite).length,
    jlpt: {
      N5: cards.filter(c => c.jlpt === 'N5').length,
      N4: cards.filter(c => c.jlpt === 'N4').length,
      N3: cards.filter(c => c.jlpt === 'N3').length,
      N2: cards.filter(c => c.jlpt === 'N2').length,
      N1: cards.filter(c => c.jlpt === 'N1').length,
    },
    sessions: sessions.slice(-10).reverse() // Last 10 sessions, newest first
  };
  
  return stats;
}
