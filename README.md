# Flashcards Study App — AI Coding Challenge

A single-page, accessible browser-based Flashcards Study App built with vanilla HTML, CSS, and JavaScript using LocalStorage persistence.

## Reflection on AI-Assisted Development (5 Key Insights)

* **Where AI Saved Time:** GitHub Copilot significantly accelerated boilerplate scaffolding, particularly generating the responsive CSS Grid layout (`prefers-color-scheme` dark mode variables and 3D `preserve-3d` / `backface-visibility` card flip styles) and the initial CRUD modal HTML structure in minutes rather than writing it from scratch.
* **AI Bug Identified and Fixed:** Copilot initially did not reset the `.is-flipped` CSS class when navigating to the next or previous card—meaning if a user flipped Card 1 to see the answer and clicked "Next", Card 2 immediately showed its back (answer) side first. I fixed this by creating a dedicated `resetFlipState()` helper function and calling it inside `changeCard()`, deck switching, and search filtering.
* **Code Snippet Refactored for Clarity:** Copilot originally attached individual `click` event listeners inside the `render()` loop for every deck button, causing duplicate listeners on re-render. I refactored the sidebar to use single-binding event delegation on the parent `#deck-list`:
  ```javascript
  document.getElementById('deck-list').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-deck-id]');
    if (!btn) return;
    state.activeDeckId = btn.dataset.deckId;
    state.ui.activeCardIndex = 0;
    resetFlipState();
    saveState();
    render();
  });