export function bindSearchControls({ searchInput, searchForm, chips, sortSelect, state, onChange }) {
  searchForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    state.searchTerm = searchInput?.value || '';
    onChange(state);
  });

  searchInput?.addEventListener('input', (event) => {
    state.searchTerm = event.target.value;
    onChange(state);
  });

  sortSelect?.addEventListener('change', (event) => {
    state.sortBy = event.target.value;
    onChange(state);
  });

  chips?.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((item) => item.classList.remove('active'));
      chip.classList.add('active');
      state.activeCategory = chip.dataset.filter || 'all';
      onChange(state);
    });
  });
}
