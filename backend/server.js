import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aws4 from 'aws4';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));

const AMAZON_HOST = process.env.AMAZON_HOST || 'https://webservices.amazon.com';
const AMAZON_ACCESS_KEY = process.env.AMAZON_ACCESS_KEY;
const AMAZON_SECRET_KEY = process.env.AMAZON_SECRET_KEY;
const AMAZON_PARTNER_TAG = process.env.AMAZON_PARTNER_TAG || 'your-partner-tag';
const AMAZON_REGION = process.env.AMAZON_REGION || 'us-east-1';
const PORT = process.env.PORT || 3001;
const ADMIN_PORTAL_PATH = process.env.ADMIN_PORTAL_PATH || '/secret-admin-portal-8472';
const PRODUCT_STORE_PATH = path.join(__dirname, 'data', 'products-store.json');
const DEFAULT_PRODUCTS_PATH = path.join(projectRoot, 'data', 'products.json');
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'FashionHub2026!';
const ADMIN_PASSWORD_HASH = createPasswordHash(ADMIN_PASSWORD);
const sessions = new Map();
const loginAttempts = new Map();

fs.mkdirSync(path.dirname(PRODUCT_STORE_PATH), { recursive: true });

function createPasswordHash(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
}

function verifyPassword(password, hash) {
  const [salt, storedHash] = hash.split(':');
  if (!salt || !storedHash) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(storedHash, 'hex');
  const actual = Buffer.from(derived.toString('hex'), 'hex');
  return timingSafeEqual(expected, actual);
}

function readProductStore() {
  try {
    const raw = fs.readFileSync(PRODUCT_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const fallback = JSON.parse(fs.readFileSync(DEFAULT_PRODUCTS_PATH, 'utf8'));
    const seeded = fallback.map((product, index) => ({
      id: product.id || 1000 + index,
      title: product.name,
      name: product.name,
      description: product.description,
      category: product.category,
      tags: [product.tag],
      amazonUrl: product.amazonUrl || '',
      price: product.price || 0,
      priceLabel: product.priceLabel || `$${product.price || 0}`,
      saleBadge: product.tag,
      featured: product.tag.toLowerCase().includes('featured') || index === 0,
      seoTitle: product.name,
      pinterestDescription: product.description,
      altText: product.name,
      status: 'published',
      image: product.image || '',
      video: '',
      createdAt: new Date().toISOString(),
      publishAt: null,
      clicks: 0,
      amazonClicks: 0
    }));
    writeProductStore(seeded);
    return seeded;
  }
}

function writeProductStore(products) {
  fs.writeFileSync(PRODUCT_STORE_PATH, JSON.stringify(products, null, 2));
}

function buildAmazonSearchBody(keyword) {
  return {
    Keywords: keyword,
    PartnerType: 'Associates',
    PartnerTag: AMAZON_PARTNER_TAG,
    Marketplace: 'www.amazon.com',
    Operation: 'SearchItems',
    SearchIndex: 'All',
    Resources: [
      'ItemInfo.Title',
      'ItemInfo.Features',
      'Offers.Listings.Price',
      'Images.Primary.Large',
      'Images.Primary.Medium'
    ],
    ItemCount: 8
  };
}

function hashId(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function normalizeAmazonProduct(item, fallbackCategory = 'accessories') {
  const title = item?.ItemInfo?.Title?.DisplayValue || 'Amazon Product';
  const priceAmount = item?.Offers?.Listings?.[0]?.Price?.Amount;
  const price = priceAmount ? Number(priceAmount / 100).toFixed(2) : '0.00';
  const priceNumber = Number(price);
  const image = item?.Images?.Primary?.Large?.URL || item?.Images?.Primary?.Medium?.URL || '';
  const description = item?.ItemInfo?.Features?.DisplayValues?.[0] || 'Premium Amazon product curated for Fashion Hub.';

  return {
    id: Number(hashId(item?.ASIN || `${fallbackCategory}-${Date.now()}`)),
    name: title,
    price: priceNumber,
    priceLabel: `$${price}`,
    category: fallbackCategory,
    tag: 'Amazon Pick',
    accent: '#8fd6ff',
    description,
    image,
    amazonUrl: item?.DetailPageURL || '#'
  };
}

function getFallbackProducts(category) {
  return [
    {
      id: 101,
      name: 'Lumen Trench',
      price: 220,
      priceLabel: '$220',
      category,
      tag: 'Amazon Pick',
      accent: '#8fd6ff',
      description: 'A premium trench crafted for elevated everyday dressing.',
      image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80',
      amazonUrl: '#'
    },
    {
      id: 102,
      name: 'Aurelia Tote',
      price: 185,
      priceLabel: '$185',
      category,
      tag: 'Amazon Pick',
      accent: '#d1b0ff',
      description: 'A polished tote with everyday structure and luxury feel.',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      amazonUrl: '#'
    },
    {
      id: 103,
      name: 'Halo Chain',
      price: 95,
      priceLabel: '$95',
      category,
      tag: 'Amazon Pick',
      accent: '#ffd4a0',
      description: 'A refined accessory for modern layering and polish.',
      image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
      amazonUrl: '#'
    },
    {
      id: 104,
      name: 'Velora Loafer',
      price: 160,
      priceLabel: '$160',
      category,
      tag: 'Amazon Pick',
      accent: '#8ed6bf',
      description: 'A sculptural loafer built for effortless movement.',
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80',
      amazonUrl: '#'
    }
  ];
}

function getVisibleProducts(products) {
  return products.filter((product) => product.status === 'published' && (!product.publishAt || new Date(product.publishAt) <= new Date()));
}

function sanitizeProductInput(input, id) {
  return {
    id: id || Number(randomUUID().replace(/-/g, '').slice(0, 10)),
    title: input.title || input.name || 'Untitled product',
    name: input.title || input.name || 'Untitled product',
    description: input.description || '',
    category: input.category || 'accessories',
    tags: Array.isArray(input.tags) ? input.tags : String(input.tags || '').split(',').map((item) => item.trim()).filter(Boolean),
    amazonUrl: input.amazonUrl || '',
    price: Number(input.price || 0),
    priceLabel: input.priceLabel || `$${Number(input.price || 0).toFixed(2)}`,
    saleBadge: input.saleBadge || '',
    featured: Boolean(input.featured),
    seoTitle: input.seoTitle || input.title || input.name || 'Luxury product',
    pinterestDescription: input.pinterestDescription || input.description || '',
    altText: input.altText || input.title || input.name || 'Fashion Hub product',
    status: input.status || 'draft',
    image: input.image || '',
    video: input.video || '',
    publishAt: input.publishAt || null,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    clicks: Number(input.clicks || 0),
    amazonClicks: Number(input.amazonClicks || 0)
  };
}

function mapProductForPublic(product) {
  return {
    id: product.id,
    name: product.title || product.name,
    title: product.title || product.name,
    description: product.description || product.pinterestDescription || '',
    category: product.category || 'accessories',
    tag: product.saleBadge || (product.featured ? 'Featured' : 'Premium'),
    accent: product.featured ? '#8fd6ff' : '#d1b0ff',
    price: Number(product.price || 0),
    priceLabel: product.priceLabel || `$${Number(product.price || 0).toFixed(2)}`,
    image: product.image || '',
    amazonUrl: product.amazonUrl || '#',
    featured: Boolean(product.featured),
    seoTitle: product.seoTitle || product.title || product.name,
    pinterestDescription: product.pinterestDescription || product.description || '',
    altText: product.altText || product.title || product.name,
    status: product.status,
    tags: product.tags || [],
    createdAt: product.createdAt,
    publishAt: product.publishAt,
    clicks: Number(product.clicks || 0),
    amazonClicks: Number(product.amazonClicks || 0)
  };
}

function buildMetrics(products) {
  const visible = getVisibleProducts(products);
  return {
    totalProducts: products.length,
    publishedProducts: visible.length,
    drafts: products.filter((product) => product.status === 'draft').length,
    featuredProducts: visible.filter((product) => product.featured).length,
    totalClicks: products.reduce((sum, product) => sum + Number(product.clicks || 0), 0),
    amazonLinkClicks: products.reduce((sum, product) => sum + Number(product.amazonClicks || 0), 0),
    topProducts: visible.slice().sort((a, b) => Number(b.clicks || 0) - Number(a.clicks || 0)).slice(0, 3),
    recentlyAdded: visible.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 3)
  };
}

async function fetchAmazonProducts(keyword, category) {
  if (!AMAZON_ACCESS_KEY || !AMAZON_SECRET_KEY) {
    return getFallbackProducts(category);
  }

  const payload = buildAmazonSearchBody(keyword);
  const request = {
    method: 'POST',
    protocol: 'https:',
    hostname: 'webservices.amazon.com',
    path: '/paapi5/searchitems',
    service: 'ProductAdvertisingAPI',
    region: AMAZON_REGION,
    headers: {
      'Content-Type': 'application/json',
      'x-amz-target': 'com.amazon.paapi5.SearchItems.SearchItems'
    },
    body: JSON.stringify(payload)
  };

  const signed = aws4.sign(request, {
    accessKeyId: AMAZON_ACCESS_KEY,
    secretAccessKey: AMAZON_SECRET_KEY,
    sessionToken: process.env.AMAZON_SESSION_TOKEN
  });

  const response = await fetch(`${AMAZON_HOST}/paapi5/searchitems`, {
    method: 'POST',
    headers: signed.headers,
    body: signed.body
  });

  if (!response.ok) {
    throw new Error('Unable to query Amazon Product Advertising API');
  }

  const result = await response.json();
  const items = result?.SearchResult?.Items || [];
  return items.map((item) => normalizeAmazonProduct(item, category));
}

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((accumulator, item) => {
    const [key, ...rest] = item.split('=');
    if (key) {
      accumulator[key.trim()] = rest.join('=').trim();
    }
    return accumulator;
  }, {});
}

function getSession(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const sessionId = cookies['fashionhub-admin-session'];
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
}

function refreshSession(session) {
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(session.id, session);
}

function setSessionCookie(res, sessionId) {
  res.cookie('fashionhub-admin-session', sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS,
    secure: false
  });
}

function rateLimit(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const bucket = loginAttempts.get(key) || { count: 0, resetAt: now + 60_000 };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + 60_000;
  }
  if (bucket.count >= 8) {
    return res.status(429).json({ error: 'Too many login attempts. Please wait a minute and try again.' });
  }
  bucket.count += 1;
  loginAttempts.set(key, bucket);
  next();
}

function requireAdmin(req, res, next) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  refreshSession(session);
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const expectedToken = session.csrfToken;
    const receivedToken = req.get('x-csrf-token');
    if (!expectedToken || !receivedToken || receivedToken !== expectedToken) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }
  req.adminSession = session;
  next();
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/products', async (req, res) => {
  const keyword = req.query.keyword || 'fashion essentials';
  const category = req.query.category || 'accessories';
  const productsFromStore = readProductStore();
  const visibleProducts = getVisibleProducts(productsFromStore).map(mapProductForPublic);

  if (visibleProducts.length) {
    const filteredByCategory = category === 'all' ? visibleProducts : visibleProducts.filter((product) => product.category === category);
    const filteredByKeyword = keyword ? filteredByCategory.filter((product) => `${product.name} ${product.description} ${product.tag}`.toLowerCase().includes(keyword.toLowerCase())) : filteredByCategory;
    return res.json(filteredByKeyword.length ? filteredByKeyword : filteredByCategory);
  }

  try {
    const products = await fetchAmazonProducts(keyword, category);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Unable to fetch products from Amazon at the moment.' });
  }
});

app.get('/api/admin/session', (req, res) => {
  const session = getSession(req);
  if (!session) {
    return res.json({ authenticated: false });
  }
  return res.json({ authenticated: true, username: session.username });
});

app.get('/api/admin/csrf-token', requireAdmin, (req, res) => {
  res.json({ token: req.adminSession.csrfToken });
});

app.post('/api/admin/login', rateLimit, (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && verifyPassword(password || '', ADMIN_PASSWORD_HASH)) {
    const sessionId = randomUUID();
    const session = {
      id: sessionId,
      username,
      csrfToken: randomBytes(24).toString('hex'),
      expiresAt: Date.now() + SESSION_TTL_MS
    };
    sessions.set(sessionId, session);
    setSessionCookie(res, sessionId);
    return res.json({ ok: true, redirect: ADMIN_PORTAL_PATH });
  }

  return res.status(401).json({ error: 'Invalid admin credentials.' });
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const cookies = parseCookies(req.headers.cookie || '');
  const sessionId = cookies['fashionhub-admin-session'];
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.clearCookie('fashionhub-admin-session');
  res.json({ ok: true });
});

app.get('/api/admin/products', requireAdmin, (req, res) => {
  const products = readProductStore();
  res.json(products);
});

app.get('/api/admin/metrics', requireAdmin, (req, res) => {
  const products = readProductStore();
  res.json(buildMetrics(products));
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const products = readProductStore();
  const nextProduct = sanitizeProductInput(req.body, undefined);
  products.push(nextProduct);
  writeProductStore(products);
  res.json(nextProduct);
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const products = readProductStore();
  const id = Number(req.params.id);
  const index = products.findIndex((product) => Number(product.id) === Number(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  const updated = sanitizeProductInput({ ...products[index], ...req.body }, id);
  products[index] = updated;
  writeProductStore(products);
  return res.json(updated);
});

app.post('/api/admin/products/:id/duplicate', requireAdmin, (req, res) => {
  const products = readProductStore();
  const id = Number(req.params.id);
  const original = products.find((product) => Number(product.id) === Number(id));
  if (!original) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  const duplicate = sanitizeProductInput({ ...original, id: undefined, title: `${original.title} Copy`, name: `${original.name} Copy`, createdAt: new Date().toISOString() }, undefined);
  products.push(duplicate);
  writeProductStore(products);
  return res.json(duplicate);
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const products = readProductStore();
  const nextProducts = products.filter((product) => Number(product.id) !== Number(req.params.id));
  if (nextProducts.length === products.length) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  writeProductStore(nextProducts);
  return res.json({ ok: true });
});

app.get(ADMIN_PORTAL_PATH, (req, res) => {
  if (!getSession(req)) {
    return res.redirect('/');
  }
  res.sendFile(path.join(projectRoot, 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Fashion Hub backend listening on port ${PORT}`);
});

export { buildAmazonSearchBody, normalizeAmazonProduct, getVisibleProducts };
