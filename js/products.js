let cachedProducts = null;

function getApiBaseUrl() {
  return window.FASHION_HUB_API_URL || 'http://127.0.0.1:3001';
}

function getFallbackProducts(keyword = 'fashion essentials', category = 'accessories') {
  const baseCategory = category || 'accessories';
  return [
    {
      id: 201,
      name: `${keyword} Essentials`,
      price: 129,
      priceLabel: '$129',
      category: baseCategory,
      tag: 'Amazon Pick',
      accent: '#8fd6ff',
      description: 'A polished pick curated for the latest fashion essentials.',
      image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80',
      amazonUrl: '#'
    },
    {
      id: 202,
      name: `${keyword} Carryall`,
      price: 154,
      priceLabel: '$154',
      category: baseCategory,
      tag: 'Featured',
      accent: '#d1b0ff',
      description: 'Elevated structure for daily movement and refined styling.',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      amazonUrl: '#'
    },
    {
      id: 203,
      name: `${keyword} Accent`,
      price: 79,
      priceLabel: '$79',
      category: baseCategory,
      tag: 'Trending',
      accent: '#ffd4a0',
      description: 'A refined accent piece that sharpens any outfit instantly.',
      image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
      amazonUrl: '#'
    }
  ];
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
    const normalizedProducts = Array.isArray(products) && products.length ? products : getFallbackProducts(keyword, category);
    cachedProducts = Object.assign(normalizedProducts, { keyword, category });
    return normalizedProducts;
  } catch (error) {
    console.error(error);
    const fallbackProducts = getFallbackProducts(keyword, category);
    cachedProducts = Object.assign(fallbackProducts, { keyword, category });
    return fallbackProducts;
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
