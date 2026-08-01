import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAmazonSearchBody, normalizeAmazonProduct, getVisibleProducts } from '../server.js';

test('buildAmazonSearchBody includes keyword and partner metadata', () => {
  const body = buildAmazonSearchBody('fashion essentials');
  assert.equal(body.Keywords, 'fashion essentials');
  assert.equal(body.PartnerType, 'Associates');
  assert.equal(body.PartnerTag, 'your-partner-tag');
  assert.ok(body.Resources.includes('ItemInfo.Title'));
});

test('normalizeAmazonProduct converts Amazon item shape to storefront format', () => {
  const product = normalizeAmazonProduct({
    ASIN: 'B12345',
    DetailPageURL: 'https://www.amazon.com/example',
    ItemInfo: { Title: { DisplayValue: 'Lumen Trench' } },
    Offers: { Listings: [{ Price: { Amount: 22000, Currency: 'USD' } }] },
    Images: { Primary: { Large: { URL: 'https://example.com/image.jpg' } } }
  }, 'outerwear');

  assert.equal(product.name, 'Lumen Trench');
  assert.equal(product.price, 220);
  assert.equal(product.image, 'https://example.com/image.jpg');
  assert.equal(product.category, 'outerwear');
});

test('getVisibleProducts returns only published products for the storefront', () => {
  const products = [
    { id: 1, title: 'Published', status: 'published' },
    { id: 2, title: 'Draft', status: 'draft' }
  ];

  assert.deepEqual(getVisibleProducts(products), [{ id: 1, title: 'Published', status: 'published' }]);
});
