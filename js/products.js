let cachedProducts = null;

function getApiBaseUrl() {
  return window.FASHION_HUB_API_URL || 'http://127.0.0.1:3001';
}

export async function loadProducts(keyword = 'fashion essentials', category = 'accessories') {
  if (cachedProducts?.keyword === keyword && cachedProducts?.category === category && cachedProducts.length) {
    return cachedProducts;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/products?keyword=${encodeURIComponent(keyword)}&category=${encodeURIComponent(category)}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Products could not be loaded');
    }

    const products = await response.json();
    cachedProducts = Object.assign(products, { keyword, category });
    return products;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export function getProductById(products, id) {
  return products.find((product) => String(product.id) === String(id));
}

export function getFilteredProducts(products, state) {
  const term = state.searchTerm.trim().toLowerCase();
  let filtered = products.filter((product) => {
    const categoryMatch = state.activeCategory === 'all' || product.category === state.activeCategory;
    const searchMatch = !term || `${product.name} ${product.description} ${product.tag}`.toLowerCase().includes(term);
    return categoryMatch && searchMatch;
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
