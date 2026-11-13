const STORAGE_KEY = 'flashcards_app_state_v1';

const defaultState = {
  decks: [
    { id: 'deck-1', name: 'Generative AI Basics', createdAt: Date.now() }
  ],
  cardsByDeckId: {
    'deck-1': [
      { id: 'card-1', front: 'What is Generative AI?', back: 'AI that creates new content (text, code, images) by learning patterns from training data.', updatedAt: Date.now() },
      { id: 'card-2', front: 'What does Temperature control in an LLM?', back: 'The randomness/creativity of token predictions (lower = deterministic, higher = creative).', updatedAt: Date.now() }
    ]
  },
  activeDeckId: 'deck-1',
  ui: { activeCardIndex: 0, searchQuery: '' }
};

let state = loadState();
let modalContext = { mode: null, opener: null };

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed, ui: { activeCardIndex: 0, searchQuery: '' } };
  } catch (e) {
    console.error('Failed to parse LocalStorage state, falling back to default.', e);
    return structuredClone(defaultState);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      decks: state.decks,
      cardsByDeckId: state.cardsByDeckId,
      activeDeckId: state.activeDeckId
    }));
  } catch (e) {
    console.error('Failed to save state to LocalStorage.', e);
  }
}

function getFilteredCards() {
  if (!state.activeDeckId) return [];
  const cards = state.cardsByDeckId[state.activeDeckId] || [];
  const q = state.ui.searchQuery.trim().toLowerCase();
  if (!q) return cards;
  return cards.filter(c => c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q));
}

function resetFlipState() {
  document.getElementById('flashcard').classList.remove('is-flipped');
}

function render() {
  const deckListEl = document.getElementById('deck-list');
  deckListEl.innerHTML = '';

  state.decks.forEach(deck => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = `deck-item ${deck.id === state.activeDeckId ? 'active' : ''}`;
    btn.textContent = deck.name;
    btn.dataset.deckId = deck.id;
    li.appendChild(btn);
    deckListEl.appendChild(li);
  });

  const activeDeck = state.decks.find(d => d.id === state.activeDeckId);
  const titleEl = document.getElementById('active-deck-title');
  const deckActions = document.getElementById('deck-actions');
  const toolbar = document.getElementById('toolbar');
  const emptyState = document.getElementById('empty-state');
  const cardContainer = document.getElementById('card-container');

  if (!activeDeck) {
    titleEl.textContent = 'Select or Create a Deck';
    deckActions.classList.add('hidden');
    toolbar.classList.add('hidden');
    cardContainer.classList.add('hidden');
    emptyState.classList.remove('hidden');
    emptyState.textContent = 'No decks yet. Click "+ New Deck" to get started!';
    return;
  }

  titleEl.textContent = activeDeck.name;
  deckActions.classList.remove('hidden');
  toolbar.classList.remove('hidden');

  const filteredCards = getFilteredCards();
  const matchCountEl = document.getElementById('match-count');
  matchCountEl.textContent = state.ui.searchQuery ? `${filteredCards.length} match(es)` : '';

  if (filteredCards.length === 0) {
    cardContainer.classList.add('hidden');
    emptyState.classList.remove('hidden');
    emptyState.textContent = state.ui.searchQuery
      ? 'No cards match your search keyword.'
      : 'This deck has no cards yet. Click "+ New Card" to add one!';
    return;
  }

  if (state.ui.activeCardIndex >= filteredCards.length) {
    state.ui.activeCardIndex = 0;
  }

  emptyState.classList.add('hidden');
  cardContainer.classList.remove('hidden');

  const currentCard = filteredCards[state.ui.activeCardIndex];
  document.getElementById('card-front-text').textContent = currentCard.front;
  document.getElementById('card-back-text').textContent = currentCard.back;
  document.getElementById('card-progress').textContent = `Card ${state.ui.activeCardIndex + 1} of ${filteredCards.length}`;
}

/* Modal with Focus Trap & Return Focus */
function openModal(mode, openerElement) {
  modalContext = { mode, opener: openerElement };
  const overlay = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const deckFields = document.getElementById('deck-fields');
  const cardFields = document.getElementById('card-fields');
  const errorEl = document.getElementById('modal-error');
  const deckInput = document.getElementById('deck-name-input');
  const frontInput = document.getElementById('card-front-input');
  const backInput = document.getElementById('card-back-input');

  errorEl.classList.add('hidden');
  overlay.classList.remove('hidden');

  if (mode === 'new-deck' || mode === 'edit-deck') {
    deckFields.classList.remove('hidden');
    cardFields.classList.add('hidden');
    title.textContent = mode === 'new-deck' ? 'Create New Deck' : 'Rename Deck';
    const activeDeck = state.decks.find(d => d.id === state.activeDeckId);
    deckInput.value = mode === 'edit-deck' && activeDeck ? activeDeck.name : '';
    deckInput.focus();
  } else {
    deckFields.classList.add('hidden');
    cardFields.classList.remove('hidden');
    title.textContent = mode === 'new-card' ? 'Add New Card' : 'Edit Card';
    const currentCard = getFilteredCards()[state.ui.activeCardIndex];
    frontInput.value = mode === 'edit-card' && currentCard ? currentCard.front : '';
    backInput.value = mode === 'edit-card' && currentCard ? currentCard.back : '';
    frontInput.focus();
  }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  if (modalContext.opener) modalContext.opener.focus();
  modalContext = { mode: null, opener: null };
}

/* Event Listeners (Single Bindings & Delegation) */
document.getElementById('deck-list').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-deck-id]');
  if (!btn) return;
  state.activeDeckId = btn.dataset.deckId;
  state.ui.activeCardIndex = 0;
  resetFlipState();
  saveState();
  render();
});

document.getElementById('new-deck-btn').addEventListener('click', (e) => openModal('new-deck', e.currentTarget));
document.getElementById('edit-deck-btn').addEventListener('click', (e) => openModal('edit-deck', e.currentTarget));
document.getElementById('new-card-btn').addEventListener('click', (e) => openModal('new-card', e.currentTarget));
document.getElementById('edit-card-btn').addEventListener('click', (e) => openModal('edit-card', e.currentTarget));
document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

document.getElementById('delete-deck-btn').addEventListener('click', () => {
  if (!state.activeDeckId || !confirm('Delete this deck and all its cards?')) return;
  delete state.cardsByDeckId[state.activeDeckId];
  state.decks = state.decks.filter(d => d.id !== state.activeDeckId);
  state.activeDeckId = state.decks[0]?.id || null;
  state.ui.activeCardIndex = 0;
  resetFlipState();
  saveState();
  render();
});

document.getElementById('delete-card-btn').addEventListener('click', () => {
  const filtered = getFilteredCards();
  const current = filtered[state.ui.activeCardIndex];
  if (!current || !confirm('Delete this card?')) return;
  state.cardsByDeckId[state.activeDeckId] = state.cardsByDeckId[state.activeDeckId].filter(c => c.id !== current.id);
  resetFlipState();
  saveState();
  render();
});

document.getElementById('modal-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('modal-error');
  const { mode } = modalContext;

  if (mode === 'new-deck' || mode === 'edit-deck') {
    const name = document.getElementById('deck-name-input').value.trim();
    if (!name) {
      errorEl.textContent = 'Deck name cannot be empty.';
      errorEl.classList.remove('hidden');
      return;
    }
    if (mode === 'new-deck') {
      const id = 'deck-' + Date.now();
      state.decks.push({ id, name, createdAt: Date.now() });
      state.cardsByDeckId[id] = [];
      state.activeDeckId = id;
      state.ui.activeCardIndex = 0;
    } else {
      const deck = state.decks.find(d => d.id === state.activeDeckId);
      if (deck) deck.name = name;
    }
  } else {
    const front = document.getElementById('card-front-input').value.trim();
    const back = document.getElementById('card-back-input').value.trim();
    if (!front || !back) {
      errorEl.textContent = 'Both Front and Back text are required.';
      errorEl.classList.remove('hidden');
      return;
    }
    const deckCards = state.cardsByDeckId[state.activeDeckId] || [];
    if (mode === 'new-card') {
      deckCards.push({ id: 'card-' + Date.now(), front, back, updatedAt: Date.now() });
      state.cardsByDeckId[state.activeDeckId] = deckCards;
      state.ui.activeCardIndex = deckCards.length - 1;
    } else {
      const current = getFilteredCards()[state.ui.activeCardIndex];
      if (current) {
        current.front = front;
        current.back = back;
        current.updatedAt = Date.now();
      }
    }
  }

  resetFlipState();
  saveState();
  closeModal();
  render();
});

/* Study Navigation & Flip */
function toggleFlip() {
  document.getElementById('flashcard').classList.toggle('is-flipped');
}

function changeCard(delta) {
  const filtered = getFilteredCards();
  if (filtered.length === 0) return;
  resetFlipState();
  state.ui.activeCardIndex = (state.ui.activeCardIndex + delta + filtered.length) % filtered.length;
  render();
}

document.getElementById('flashcard').addEventListener('click', toggleFlip);
document.getElementById('flip-btn').addEventListener('click', toggleFlip);
document.getElementById('prev-btn').addEventListener('click', () => changeCard(-1));
document.getElementById('next-btn').addEventListener('click', () => changeCard(1));

document.getElementById('shuffle-btn').addEventListener('click', () => {
  const cards = state.cardsByDeckId[state.activeDeckId];
  if (!cards || cards.length < 2) return;
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  state.ui.activeCardIndex = 0;
  resetFlipState();
  saveState();
  render();
});

/* Debounced Search (300ms) */
let searchTimeout;
document.getElementById('search-input').addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    state.ui.searchQuery = e.target.value;
    state.ui.activeCardIndex = 0;
    resetFlipState();
    render();
  }, 300);
});

/* Keyboard Accessibility & Modal Focus Trap */
document.addEventListener('keydown', (e) => {
  const modalOpen = !document.getElementById('modal-overlay').classList.contains('hidden');
  if (modalOpen) {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') {
      const focusables = document.getElementById('modal-overlay').querySelectorAll('input:not(.hidden *), textarea:not(.hidden *), button');
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    return;
  }

  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (e.code === 'Space') { e.preventDefault(); toggleFlip(); }
  if (e.code === 'ArrowLeft') changeCard(-1);
  if (e.code === 'ArrowRight') changeCard(1);
});

render();