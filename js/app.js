import { loadProducts, getProductById, getFilteredProducts } from './products.js';
import { bindSearchControls } from './search.js';
import { renderProductCard, renderMiniItem, renderEmptyState } from './ui.js';

const state = {
  activeCategory: 'all',
  searchTerm: '',
  sortBy: 'featured',
  isDark: true,
  searchKeyword: 'fashion essentials',
  searchCategory: 'accessories'
};

const featuredContainer = document.getElementById('featured-products');
const bestSellersContainer = document.getElementById('best-sellers-list');
const trendingContainer = document.getElementById('trending-list');
const editorPicksContainer = document.getElementById('editor-picks-list');
const recentlyAddedContainer = document.getElementById('recently-added-list');
const featuredPicksContainer = document.getElementById('featured-picks-list');
const searchInput = document.getElementById('search-input');
const searchForm = document.getElementById('search-form');
const chips = document.querySelectorAll('.chip');
const sortSelect = document.getElementById('sort-select');
const newsletterForm = document.getElementById('newsletter-form');
const formMessage = document.getElementById('form-message');
const countdown = document.getElementById('countdown');
const themeToggle = document.getElementById('theme-toggle');
const menuToggle = document.getElementById('menu-toggle');
const topNav = document.getElementById('top-nav');
const modal = document.getElementById('quick-view-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const loadingOverlay = document.getElementById('loading-overlay');

let products = [];

function initState() {
  state.isDark = true;
}

function renderLists() {
  const filtered = getFilteredProducts(products, state);
  const featured = filtered.slice(0, 4);
  const bestSellerItems = filtered.filter((product) => (product.tag || '').toLowerCase().includes('best'));
  const trendingItems = filtered.filter((product) => (product.tag || '').toLowerCase().includes('trending'));
  const editorPicks = filtered.slice(0, 3);
  const recentlyAddedItems = products.slice(0, 3);
  const featuredPicks = filtered.filter((product) => product.featured || (product.tag || '').toLowerCase().includes('featured')).slice(0, 3);

  featuredContainer.innerHTML = featured.length ? featured.map((product) => renderProductCard(product, false)).join('') : renderEmptyState('No items match your search yet.');
  bestSellersContainer.innerHTML = bestSellerItems.length ? bestSellerItems.slice(0, 3).map(renderMiniItem).join('') : renderEmptyState('Try another search.');
  trendingContainer.innerHTML = trendingItems.length ? trendingItems.slice(0, 3).map(renderMiniItem).join('') : renderEmptyState('Try another search.');
  editorPicksContainer.innerHTML = editorPicks.length ? editorPicks.map(renderMiniItem).join('') : renderEmptyState('Try another search.');
  recentlyAddedContainer.innerHTML = recentlyAddedItems.length ? recentlyAddedItems.map(renderMiniItem).join('') : renderEmptyState('Check back soon.');
  featuredPicksContainer.innerHTML = featuredPicks.length ? featuredPicks.map(renderMiniItem).join('') : renderEmptyState('Curated luxuries will appear here.');
}

function openQuickView(id) {
  const product = getProductById(products, id);
  if (!product) return;
  modalBody.innerHTML = `
    <div class="product-meta">
      <p class="eyebrow">Quick view</p>
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <p class="price">${product.priceLabel}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="${product.amazonUrl || '#'}" target="_blank" rel="noopener noreferrer">View on Amazon</a>
        <a class="btn btn-secondary" href="product.html?id=${product.id}">View details</a>
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

function toggleTheme() {
  state.isDark = !state.isDark;
  document.body.classList.toggle('light-theme', !state.isDark);
  themeToggle.textContent = state.isDark ? '☾' : '☀';
}

function toggleMenu() {
  topNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(topNav.classList.contains('open')));
}

function attachEvents() {
  bindSearchControls({ searchInput, searchForm, chips, sortSelect, state, onChange: renderLists });

  featuredContainer.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const id = Number(button.dataset.id);
    if (button.dataset.action === 'quick-view') {
      openQuickView(id);
    } else if (button.dataset.action === 'details') {
      window.location.href = `product.html?id=${id}`;
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

  themeToggle.addEventListener('click', toggleTheme);
  menuToggle.addEventListener('click', toggleMenu);
  modalClose.addEventListener('click', closeQuickView);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeQuickView();
    }
  });
}

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

async function init() {
  initState();
  attachEvents();
  document.querySelector('.page-shell')?.classList.add('is-loading');

  try {
    products = await loadProducts(state.searchKeyword, state.searchCategory);
    renderLists();
  } finally {
    updateCountdown();
    setInterval(updateCountdown, 60000);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        loadingOverlay?.classList.add('hidden');
        document.querySelector('.page-shell')?.classList.remove('is-loading');
      });
    });
  }
}

init();
