import { loadProducts, getProductById, getFilteredProducts } from './products.js';
import { bindSearchControls } from './search.js';
import { getWishlist, toggleWishlist } from './wishlist.js';
import { getRecent, addRecentView } from './recent.js';
import { renderProductCard, renderMiniItem, renderEmptyState } from './ui.js';

const state = {
  activeCategory: 'all',
  searchTerm: '',
  sortBy: 'featured',
  wishlist: [],
  recent: [],
  isDark: true,
  currentRole: 'user',
  searchKeyword: 'fashion essentials',
  searchCategory: 'accessories',
  isAdminAuthenticated: false
};

const featuredContainer = document.getElementById('featured-products');
const bestSellersContainer = document.getElementById('best-sellers-list');
const trendingContainer = document.getElementById('trending-list');
const editorPicksContainer = document.getElementById('editor-picks-list');
const recentlyAddedContainer = document.getElementById('recently-added-list');
const wishlistContainer = document.getElementById('wishlist-list');
const recentContainer = document.getElementById('recent-list');
const wishlistCount = document.getElementById('wishlist-count');
const searchInput = document.getElementById('search-input');
const searchForm = document.getElementById('search-form');
const chips = document.querySelectorAll('.chip');
const sortSelect = document.getElementById('sort-select');
const newsletterForm = document.getElementById('newsletter-form');
const formMessage = document.getElementById('form-message');
const countdown = document.getElementById('countdown');
const themeToggle = document.getElementById('theme-toggle');
const wishlistTrigger = document.getElementById('wishlist-trigger');
const menuToggle = document.getElementById('menu-toggle');
const topNav = document.getElementById('top-nav');
const modal = document.getElementById('quick-view-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const loadingOverlay = document.getElementById('loading-overlay');
const userPanelTab = document.getElementById('user-panel-tab');
const adminPanelTab = document.getElementById('admin-panel-tab');
const userPanel = document.getElementById('user-panel');
const adminPanel = document.getElementById('admin-panel');
const panelWishlistCount = document.getElementById('panel-wishlist-count');
const panelRecentCount = document.getElementById('panel-recent-count');
const panelProductCount = document.getElementById('panel-product-count');
const panelCurrentKeyword = document.getElementById('panel-current-keyword');
const adminForm = document.getElementById('admin-form');
const adminKeywordInput = document.getElementById('admin-keyword');
const adminCategorySelect = document.getElementById('admin-category');
const adminLoginForm = document.getElementById('admin-login-form');
const adminPassphraseInput = document.getElementById('admin-passphrase');
const adminLoginMessage = document.getElementById('admin-login-message');
const adminControls = document.getElementById('admin-controls');
const adminAuthSection = document.getElementById('admin-auth-section');

let products = [];

function initState() {
  state.wishlist = getWishlist();
  state.recent = getRecent();
  state.isDark = true;
}

function renderLists() {
  const filtered = getFilteredProducts(products, state);
  const featured = filtered.slice(0, 4);
  const bestSellerItems = filtered.filter((product) => product.tag.toLowerCase().includes('best'));
  const trendingItems = filtered.filter((product) => product.tag.toLowerCase().includes('trending'));
  const editorPicks = filtered.slice(0, 3);
  const recentlyAddedItems = products.slice(0, 3);

  featuredContainer.innerHTML = featured.length ? featured.map((product) => renderProductCard(product, state.wishlist.includes(product.id))).join('') : renderEmptyState('No items match your search yet.');
  bestSellersContainer.innerHTML = bestSellerItems.length ? bestSellerItems.slice(0, 3).map(renderMiniItem).join('') : renderEmptyState('Try another search.');
  trendingContainer.innerHTML = trendingItems.length ? trendingItems.slice(0, 3).map(renderMiniItem).join('') : renderEmptyState('Try another search.');
  editorPicksContainer.innerHTML = editorPicks.length ? editorPicks.map(renderMiniItem).join('') : renderEmptyState('Try another search.');
  recentlyAddedContainer.innerHTML = recentlyAddedItems.length ? recentlyAddedItems.map(renderMiniItem).join('') : renderEmptyState('Check back soon.');

  const wishlistItems = state.wishlist.map((id) => getProductById(products, id)).filter(Boolean);
  const recentItems = state.recent.map((id) => getProductById(products, id)).filter(Boolean);

  wishlistContainer.innerHTML = wishlistItems.length ? wishlistItems.slice(0, 3).map(renderMiniItem).join('') : renderEmptyState('Your saved pieces will appear here.');
  recentContainer.innerHTML = recentItems.length ? recentItems.slice(0, 3).map(renderMiniItem).join('') : renderEmptyState('Browse a product to see it here.');
  wishlistCount.textContent = wishlistItems.length;
  updatePanelUI();
}

function updatePanelUI() {
  if (panelWishlistCount) {
    panelWishlistCount.textContent = `${state.wishlist.length} saved`;
  }
  if (panelRecentCount) {
    panelRecentCount.textContent = `${state.recent.length} viewed`;
  }
  if (panelProductCount) {
    panelProductCount.textContent = `${products.length}`;
  }
  if (panelCurrentKeyword) {
    panelCurrentKeyword.textContent = state.searchKeyword;
  }
}

function setRole(role) {
  state.currentRole = role;

  if (userPanelTab && adminPanelTab) {
    userPanelTab.classList.toggle('active', role === 'user');
    adminPanelTab.classList.toggle('active', role === 'admin');
    userPanelTab.setAttribute('aria-selected', String(role === 'user'));
    adminPanelTab.setAttribute('aria-selected', String(role === 'admin'));
  }

  if (userPanel && adminPanel) {
    userPanel.classList.toggle('hidden', role !== 'user');
    adminPanel.classList.toggle('hidden', role !== 'admin');
  }

  if (role === 'admin' && state.isAdminAuthenticated) {
    adminAuthSection?.classList.add('hidden');
    adminControls?.classList.remove('hidden');
  } else if (role === 'admin') {
    adminAuthSection?.classList.remove('hidden');
    adminControls?.classList.add('hidden');
  } else {
    adminAuthSection?.classList.add('hidden');
    adminControls?.classList.add('hidden');
  }
}

function toggleWishlistItem(id) {
  const next = toggleWishlist(id);
  state.wishlist = next;
  renderLists();
}

function addToRecent(id) {
  state.recent = addRecentView(id);
  renderLists();
}

function openQuickView(id) {
  const product = getProductById(products, id);
  if (!product) return;
  addToRecent(id);
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
    if (button.dataset.action === 'wishlist') {
      toggleWishlistItem(id);
    } else if (button.dataset.action === 'quick-view') {
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

  userPanelTab?.addEventListener('click', () => setRole('user'));
  adminPanelTab?.addEventListener('click', () => setRole('admin'));

  adminLoginForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const passphrase = adminPassphraseInput?.value.trim() || '';
    const expectedPassphrase = window.FASHION_HUB_ADMIN_PASSPHRASE?.trim() || 'fashionhub123';
    if (passphrase.toLowerCase() === expectedPassphrase.toLowerCase()) {
      state.isAdminAuthenticated = true;
      adminLoginMessage.textContent = 'Admin unlocked. You can now load products.';
      adminAuthSection?.classList.add('hidden');
      adminControls?.classList.remove('hidden');
      setRole('admin');
    } else {
      adminLoginMessage.textContent = 'Incorrect passphrase. Try again.';
    }
  });

  adminForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.isAdminAuthenticated) {
      return;
    }
    const keyword = adminKeywordInput?.value.trim() || 'fashion essentials';
    const category = adminCategorySelect?.value || 'accessories';
    state.searchKeyword = keyword;
    state.searchCategory = category;
    products = await loadProducts(state.searchKeyword, state.searchCategory);
    renderLists();
  });

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
    toggleWishlistItem(id);
    openQuickView(id);
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
  products = await loadProducts(state.searchKeyword, state.searchCategory);
  renderLists();
  setRole(state.currentRole);
  updateCountdown();
  setInterval(updateCountdown, 60000);
  setTimeout(() => {
    loadingOverlay.classList.add('hidden');
  }, 800);
}

init();
