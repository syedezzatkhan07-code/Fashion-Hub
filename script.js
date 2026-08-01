const products = [
  {
    id: 1,
    name: 'Lumen Trench',
    price: 220,
    priceLabel: '$220',
    category: 'outerwear',
    tag: 'Featured',
    accent: '#79c7ff',
    description: 'Weather-ready with a softened silhouette.'
  },
  {
    id: 2,
    name: 'Aurelia Tote',
    price: 185,
    priceLabel: '$185',
    category: 'bags',
    tag: 'New',
    accent: '#c4a0ff',
    description: 'Structured carrying comfort in matte leather.'
  },
  {
    id: 3,
    name: 'Halo Chain',
    price: 95,
    priceLabel: '$95',
    category: 'accessories',
    tag: 'Trending',
    accent: '#ffd4a0',
    description: 'A polished staple for everyday layering.'
  },
  {
    id: 4,
    name: 'Velora Loafer',
    price: 160,
    priceLabel: '$160',
    category: 'footwear',
    tag: 'Best Seller',
    accent: '#8ed6bf',
    description: 'Effortless movement with sculptural detailing.'
  },
  {
    id: 5,
    name: 'Contour Overshirt',
    price: 140,
    priceLabel: '$140',
    category: 'outerwear',
    tag: 'Best Seller',
    accent: '#f3a6d5',
    description: 'Lightweight layering with premium drape.'
  },
  {
    id: 6,
    name: 'Monarch Crossbody',
    price: 125,
    priceLabel: '$125',
    category: 'bags',
    tag: 'Trending',
    accent: '#ff9f7a',
    description: 'Compact form with an elevated finish.'
  },
  {
    id: 7,
    name: 'Sculpt Glasses',
    price: 78,
    priceLabel: '$78',
    category: 'accessories',
    tag: 'Featured',
    accent: '#9fd6ff',
    description: 'Subtle curves for refined everyday wear.'
  },
  {
    id: 8,
    name: 'Noir Runner',
    price: 148,
    priceLabel: '$148',
    category: 'footwear',
    tag: 'Trending',
    accent: '#7a8cff',
    description: 'A fluid silhouette with all-day ease.'
  }
];

const state = {
  activeCategory: 'all',
  searchTerm: '',
  sortBy: 'featured',
  wishlist: [],
  recent: [],
  isDark: true
};

const featuredContainer = document.getElementById('featured-products');
const bestSellersContainer = document.getElementById('best-sellers-list');
const trendingContainer = document.getElementById('trending-list');
const wishlistContainer = document.getElementById('wishlist-list');
const recentContainer = document.getElementById('recent-list');
const searchInput = document.getElementById('search-input');
const searchForm = document.getElementById('search-form');
const chips = document.querySelectorAll('.chip');
const newsletterForm = document.getElementById('newsletter-form');
const formMessage = document.getElementById('form-message');
const countdown = document.getElementById('countdown');
const sortSelect = document.getElementById('sort-select');
const themeToggle = document.getElementById('theme-toggle');
const wishlistTrigger = document.getElementById('wishlist-trigger');
const wishlistCount = document.getElementById('wishlist-count');
const menuToggle = document.getElementById('menu-toggle');
const topNav = document.getElementById('top-nav');
const modal = document.getElementById('quick-view-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const loadingOverlay = document.getElementById('loading-overlay');

function getProductById(id) {
  return products.find((product) => product.id === id);
}

function getFilteredProducts() {
  const term = state.searchTerm.trim().toLowerCase();
  let filtered = products.filter((product) => {
    const matchesCategory = state.activeCategory === 'all' || product.category === state.activeCategory;
    const matchesSearch = !term || `${product.name} ${product.description} ${product.tag}`.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  if (state.sortBy === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (state.sortBy === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (state.sortBy === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  return filtered;
}

function renderCard(product) {
  const saved = state.wishlist.includes(product.id);
  return `
    <article class="product-card">
      <div class="product-visual" style="background: linear-gradient(135deg, ${product.accent}, #ffffff22);">
        <span class="product-tag">${product.tag}</span>
      </div>
      <div class="product-meta">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-footer">
          <span class="price">${product.priceLabel}</span>
          <div class="card-actions">
            <button class="icon-btn ${saved ? 'active' : ''}" data-action="wishlist" data-id="${product.id}" type="button" aria-label="Add ${product.name} to wishlist">♡</button>
            <button class="icon-btn" data-action="quick-view" data-id="${product.id}" type="button" aria-label="Quick view ${product.name}">⌕</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderMiniItem(product) {
  return `
    <div class="mini-item">
      <div class="mini-info">
        <strong>${product.name}</strong>
        <span>${product.priceLabel}</span>
      </div>
      <span class="price">${product.tag}</span>
    </div>
  `;
}

function renderLists() {
  const filtered = getFilteredProducts();
  const featured = filtered.slice(0, 4);
  const bestSellerItems = filtered.filter((product) => product.tag.toLowerCase().includes('best'));
  const trendingItems = filtered.filter((product) => product.tag.toLowerCase().includes('trending'));

  featuredContainer.innerHTML = featured.length ? featured.map(renderCard).join('') : '<p class="hero-copy">No items match your search yet.</p>';
  bestSellersContainer.innerHTML = bestSellerItems.length ? bestSellerItems.slice(0, 3).map(renderMiniItem).join('') : '<p class="hero-copy">Try another search.</p>';
  trendingContainer.innerHTML = trendingItems.length ? trendingItems.slice(0, 3).map(renderMiniItem).join('') : '<p class="hero-copy">Try another search.</p>';

  const wishlistItems = state.wishlist.map((id) => getProductById(id)).filter(Boolean);
  const recentItems = state.recent.map((id) => getProductById(id)).filter(Boolean);

  wishlistContainer.innerHTML = wishlistItems.length ? wishlistItems.slice(0, 3).map(renderMiniItem).join('') : '<p class="hero-copy">Your saved pieces will appear here.</p>';
  recentContainer.innerHTML = recentItems.length ? recentItems.slice(0, 3).map(renderMiniItem).join('') : '<p class="hero-copy">Browse a product to see it here.</p>';
  wishlistCount.textContent = wishlistItems.length;
}

function toggleWishlist(id) {
  if (state.wishlist.includes(id)) {
    state.wishlist = state.wishlist.filter((item) => item !== id);
  } else {
    state.wishlist = [...state.wishlist, id];
  }
  renderLists();
}

function addRecentView(id) {
  state.recent = [id, ...state.recent.filter((item) => item !== id)].slice(0, 5);
  renderLists();
}

function openQuickView(id) {
  const product = getProductById(id);
  if (!product) return;
  addRecentView(id);
  modalBody.innerHTML = `
    <div class="product-meta">
      <p class="eyebrow">Quick view</p>
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <p class="price">${product.priceLabel}</p>
      <div class="hero-actions">
        <button class="btn btn-primary" data-action="wishlist" data-id="${product.id}" type="button">${state.wishlist.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}</button>
        <a class="btn btn-secondary" href="#newsletter">Reserve now</a>
      </div>
    </div>
  `;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeQuickView() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((item) => item.classList.remove('active'));
    chip.classList.add('active');
    state.activeCategory = chip.dataset.filter;
    renderLists();
  });
});

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  state.searchTerm = searchInput.value;
  renderLists();
});

searchInput.addEventListener('input', (event) => {
  state.searchTerm = event.target.value;
  renderLists();
});

sortSelect.addEventListener('change', (event) => {
  state.sortBy = event.target.value;
  renderLists();
});

featuredContainer.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) {
    const card = event.target.closest('.product-card');
    if (card) {
      const id = Number(card.querySelector('button[data-action="wishlist"]').dataset.id);
      addRecentView(id);
    }
    return;
  }

  const { action, id } = button.dataset;
  if (action === 'wishlist') {
    toggleWishlist(Number(id));
  } else if (action === 'quick-view') {
    openQuickView(Number(id));
  }
});

newsletterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = newsletterForm.querySelector('input');
  if (input.value.trim()) {
    formMessage.textContent = `Thanks, ${input.value.trim()} — your first drop invite is on the way.`;
    input.value = '';
  }
});

function updateCountdown() {
  const now = new Date();
  const target = new Date(now);
  target.setDate(target.getDate() + 5);
  target.setHours(12, 0, 0, 0);

  const diff = target - now;
  if (diff <= 0) {
    countdown.textContent = 'Now live';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  countdown.textContent = `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
}

function toggleTheme() {
  state.isDark = !state.isDark;
  document.body.classList.toggle('light-theme', !state.isDark);
  themeToggle.textContent = state.isDark ? '☾' : '☀';
}

function toggleMenu() {
  topNav.classList.toggle('open');
  const expanded = topNav.classList.contains('open');
  menuToggle.setAttribute('aria-expanded', String(expanded));
}

themeToggle.addEventListener('click', toggleTheme);
wishlistTrigger.addEventListener('click', () => {
  document.getElementById('best-sellers').scrollIntoView({ behavior: 'smooth' });
});
menuToggle.addEventListener('click', toggleMenu);
modalClose.addEventListener('click', closeQuickView);
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeQuickView();
  }
});

modalBody.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const id = Number(button.dataset.id);
  toggleWishlist(id);
  openQuickView(id);
});

window.addEventListener('load', () => {
  setTimeout(() => {
    loadingOverlay.classList.add('hidden');
  }, 800);
});

setInterval(updateCountdown, 60000);
updateCountdown();
renderLists();
