// Name search with Fuse.js autocomplete
let fuse = null;
let searchIndex = [];
let currentFocus = -1;

// Load search index and initialize Fuse.js
async function initializeSearch() {
  try {
    const response = await fetch('/search-index.json');
    searchIndex = await response.json();

    // Initialize Fuse.js with fuzzy search options
    fuse = new Fuse(searchIndex, {
      keys: ['name'],
      threshold: 0.3, // Lower = more strict matching (0.0 = exact, 1.0 = match anything)
      ignoreLocation: true,
      minMatchCharLength: 1
    });

    console.log(`Search initialized with ${searchIndex.length} names`);
  } catch (error) {
    console.error('Failed to load search index:', error);
  }
}

// Show autocomplete results
function showResults(results) {
  const resultsContainer = document.getElementById('search-results');
  const searchInput = document.getElementById('search-input');

  if (!resultsContainer || !searchInput) return;

  // Clear previous results
  resultsContainer.innerHTML = '';
  currentFocus = -1;

  if (results.length === 0 || searchInput.value.trim() === '') {
    resultsContainer.style.display = 'none';
    return;
  }

  // Show top 10 results
  const topResults = results.slice(0, 10);

  topResults.forEach((result, index) => {
    const item = result.item;
    const resultDiv = document.createElement('div');
    resultDiv.className = 'search-result-item';
    resultDiv.dataset.index = index;

    // Create result HTML with name and gender badge
    resultDiv.innerHTML = `
      <span class="search-result-name">${item.name}</span>
      <span class="search-result-badge ${item.gender}">${item.gender}</span>
    `;

    // Click handler
    resultDiv.addEventListener('click', () => {
      navigateToName(item);
    });

    resultsContainer.appendChild(resultDiv);
  });

  resultsContainer.style.display = 'block';
}

// Navigate to name page
function navigateToName(item) {
  window.location.href = `/names/${item.gender}/${item.slug}/`;
}

// Handle keyboard navigation
function handleKeyboardNavigation(e) {
  const resultsContainer = document.getElementById('search-results');
  if (!resultsContainer || resultsContainer.style.display === 'none') return;

  const items = resultsContainer.getElementsByClassName('search-result-item');
  if (items.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    currentFocus++;
    if (currentFocus >= items.length) currentFocus = 0;
    setActive(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    currentFocus--;
    if (currentFocus < 0) currentFocus = items.length - 1;
    setActive(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (currentFocus > -1 && items[currentFocus]) {
      const index = parseInt(items[currentFocus].dataset.index);
      const results = fuse.search(document.getElementById('search-input').value);
      if (results[index]) {
        navigateToName(results[index].item);
      }
    }
  } else if (e.key === 'Escape') {
    document.getElementById('search-results').style.display = 'none';
    currentFocus = -1;
  }
}

// Set active item in results
function setActive(items) {
  for (let i = 0; i < items.length; i++) {
    items[i].classList.remove('active');
  }
  if (currentFocus >= 0 && currentFocus < items.length) {
    items[currentFocus].classList.add('active');
    items[currentFocus].scrollIntoView({ block: 'nearest' });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await initializeSearch();

  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  if (!searchInput || !searchResults) {
    console.warn('Search elements not found in DOM');
    return;
  }

  // Search input handler
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    if (!fuse || query.length === 0) {
      searchResults.style.display = 'none';
      return;
    }

    const results = fuse.search(query);
    showResults(results);
  });

  // Keyboard navigation
  searchInput.addEventListener('keydown', handleKeyboardNavigation);

  // Close results when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      searchResults.style.display = 'none';
      currentFocus = -1;
    }
  });

  // Prevent form submission if wrapped in form
  const searchForm = searchInput.closest('form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
    });
  }
});
