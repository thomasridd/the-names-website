// Simple search functionality
// This is a placeholder for future search implementation
// Consider using Fuse.js or Lunr.js for production

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const nameItems = document.querySelectorAll('.name-item');

      nameItems.forEach(item => {
        const nameText = item.textContent.toLowerCase();
        if (nameText.includes(query)) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }
});
