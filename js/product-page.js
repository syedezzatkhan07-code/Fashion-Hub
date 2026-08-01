import { loadProducts, getProductById } from './products.js';

const params = new URLSearchParams(window.location.search);
const productId = Number(params.get('id'));

const breadcrumb = document.getElementById('breadcrumb');
const backBtn = document.getElementById('back-btn');
const galleryMain = document.getElementById('gallery-main');
const galleryTitle = document.getElementById('gallery-title');
const galleryThumbs = document.getElementById('gallery-thumbs');
const productTag = document.getElementById('product-tag');
const productName = document.getElementById('product-name');
const productDescription = document.getElementById('product-description');
const productPrice = document.getElementById('product-price');
const stickyPrice = document.getElementById('sticky-price');
const specList = document.getElementById('spec-list');
const reviewList = document.getElementById('review-list');
const bundleGrid = document.getElementById('bundle-grid');
const relatedGrid = document.getElementById('related-grid');
const themeToggle = document.getElementById('theme-toggle');
const shareBtn = document.getElementById('share-btn');

function updateSeo(product) {
  document.title = `${product.name} | Fashion Hub`;
  document.querySelector('meta[name="description"]').setAttribute('content', `${product.name} is a premium ${product.category} piece from Fashion Hub featuring refined craftsmanship, modern style, and elevated comfort.`);
  document.querySelector('link[rel="canonical"]').setAttribute('href', `https://fashionhub.com/product.html?id=${product.id}`);
  document.querySelector('meta[property="og:title"]').setAttribute('content', `${product.name} | Fashion Hub`);
  document.querySelector('meta[property="og:description"]').setAttribute('content', `${product.name} is a premium ${product.category} piece from Fashion Hub featuring refined craftsmanship, modern style, and elevated comfort.`);
  document.querySelector('meta[property="og:url"]').setAttribute('content', `https://fashionhub.com/product.html?id=${product.id}`);
  document.querySelector('meta[name="twitter:title"]').setAttribute('content', `${product.name} | Fashion Hub`);
  document.querySelector('meta[name="twitter:description"]').setAttribute('content', `${product.name} is a premium ${product.category} piece from Fashion Hub featuring refined craftsmanship, modern style, and elevated comfort.`);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: ['https://fashionhub.com/assets/og-image.svg'],
    brand: { '@type': 'Brand', name: 'Fashion Hub' },
    category: product.category,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: product.price,
      availability: 'https://schema.org/InStock',
      url: `https://fashionhub.com/product.html?id=${product.id}`
    }
  };

  const existing = document.getElementById('product-schema');
  if (existing) existing.remove();

  const script = document.createElement('script');
  script.id = 'product-schema';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://fashionhub.com/' },
      { '@type': 'ListItem', position: 2, name: 'Products', item: 'https://fashionhub.com/index.html#featured' },
      { '@type': 'ListItem', position: 3, name: product.name, item: `https://fashionhub.com/product.html?id=${product.id}` }
    ]
  };

  const breadcrumbScript = document.getElementById('breadcrumb-schema');
  if (breadcrumbScript) breadcrumbScript.remove();

  const breadcrumbJson = document.createElement('script');
  breadcrumbJson.id = 'breadcrumb-schema';
  breadcrumbJson.type = 'application/ld+json';
  breadcrumbJson.textContent = JSON.stringify(breadcrumbSchema);
  document.head.appendChild(breadcrumbJson);
}

backBtn.addEventListener('click', () => history.back());

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  themeToggle.textContent = document.body.classList.contains('light-theme') ? '☀' : '☾';
});

shareBtn?.addEventListener('click', async () => {
  const shareUrl = `https://fashionhub.com/product.html?id=${productId}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: document.title, text: 'Discover this look from Fashion Hub.', url: shareUrl });
    } catch (error) {
      console.info('Share cancelled', error);
    }
  } else {
    window.open(`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent('https://fashionhub.com/assets/hero-illustration.svg')}&description=${encodeURIComponent(document.title)}`, '_blank', 'noopener,noreferrer');
  }
});

function renderProduct(product) {
  breadcrumb.innerHTML = `
    <a href="index.html">Home</a>
    <span>/</span>
    <a href="index.html#featured">Shop</a>
    <span>/</span>
    <span>${product.name}</span>
  `;

  galleryMain.style.background = `linear-gradient(135deg, ${product.accent}, #ffffff22)`;
  galleryTitle.textContent = `${product.name} • ${product.tag}`;
  productTag.textContent = product.tag;
  productName.textContent = product.name;
  productDescription.textContent = product.description;
  productPrice.textContent = product.priceLabel;
  stickyPrice.textContent = product.priceLabel;

  galleryThumbs.innerHTML = [
    { label: 'Front view', detail: `${product.name} in a polished silhouette` },
    { label: 'Detail view', detail: 'Crafted finish and premium texture' },
    { label: 'Lifestyle view', detail: 'Styled for everyday movement' }
  ].map((item, index) => `
    <div class="thumb-card ${index === 0 ? 'active' : ''}">
      <strong>${item.label}</strong>
      <span class="hero-copy">${item.detail}</span>
    </div>
  `).join('');

  specList.innerHTML = `
    <div class="spec-item"><strong>Material</strong><span>Premium leather and brushed finish</span></div>
    <div class="spec-item"><strong>Fit</strong><span>Tailored to feel refined and effortless</span></div>
    <div class="spec-item"><strong>Care</strong><span>Spot clean and store flat to preserve shape</span></div>
  `;

  reviewList.innerHTML = `
    <div class="review-item">
      <div class="review-meta"><strong>Ava</strong><span>★★★★★</span></div>
      <p>Exceptional finish and the perfect balance of structure and softness.</p>
    </div>
    <div class="review-item">
      <div class="review-meta"><strong>Noah</strong><span>★★★★★</span></div>
      <p>Elegant without feeling overdone, and the delivery felt very premium.</p>
    </div>
  `;
}

function renderRelated(products, current) {
  const related = products.filter((item) => item.id !== current.id).slice(0, 3);
  relatedGrid.innerHTML = related.length ? related.map((item) => `
    <div class="related-card">
      <strong>${item.name}</strong>
      <p class="hero-copy">${item.description}</p>
      <div class="price-row">
        <span class="price">${item.priceLabel}</span>
        <a class="btn btn-secondary" href="product.html?id=${item.id}">View</a>
      </div>
    </div>
  `).join('') : '<p class="empty-state">No additional products to show.</p>';

  const bundle = related.slice(0, 2);
  bundleGrid.innerHTML = bundle.length ? bundle.map((item) => `
    <div class="bundle-card">
      <strong>${item.name}</strong>
      <p class="hero-copy">${item.description}</p>
      <span class="price">${item.priceLabel}</span>
    </div>
  `).join('') : '<p class="empty-state">Bundle suggestions coming soon.</p>';
}

async function init() {
  const products = await loadProducts();
  const product = getProductById(products, productId);

  if (!product) {
    document.getElementById('product-page').innerHTML = '<p class="empty-state">This product is unavailable right now.</p>';
    return;
  }

  renderProduct(product);
  updateSeo(product);
  renderRelated(products, product);
}

init();
