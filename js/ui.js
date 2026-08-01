export function renderProductCard(product, isSaved) {
  const imageMarkup = product.image ? `<img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy" decoding="async" />` : '';

  return `
    <article class="product-card">
      <div class="product-visual" style="background: linear-gradient(135deg, ${product.accent}, #ffffff22);">
        ${imageMarkup}
        <span class="product-tag">${product.tag}</span>
      </div>
      <div class="product-meta">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-footer">
          <span class="price">${product.priceLabel}</span>
          <div class="card-actions">
            <button class="icon-btn ${isSaved ? 'active' : ''}" data-action="wishlist" data-id="${product.id}" type="button" aria-label="Add ${product.name} to wishlist">♡</button>
            <button class="icon-btn" data-action="quick-view" data-id="${product.id}" type="button" aria-label="Quick view ${product.name}">⌕</button>
            <button class="icon-btn" data-action="details" data-id="${product.id}" type="button" aria-label="View details for ${product.name}">↗</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

export function renderMiniItem(product) {
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

export function renderEmptyState(message) {
  return `<p class="hero-copy">${message}</p>`;
}
