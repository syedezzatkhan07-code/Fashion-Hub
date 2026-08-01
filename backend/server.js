import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aws4 from 'aws4';

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const AMAZON_HOST = process.env.AMAZON_HOST || 'https://webservices.amazon.com';
const AMAZON_ACCESS_KEY = process.env.AMAZON_ACCESS_KEY;
const AMAZON_SECRET_KEY = process.env.AMAZON_SECRET_KEY;
const AMAZON_PARTNER_TAG = process.env.AMAZON_PARTNER_TAG || 'your-partner-tag';
const AMAZON_REGION = process.env.AMAZON_REGION || 'us-east-1';
const PORT = process.env.PORT || 3001;

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

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/products', async (req, res) => {
  const keyword = req.query.keyword || 'fashion essentials';
  const category = req.query.category || 'accessories';

  try {
    const products = await fetchAmazonProducts(keyword, category);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Unable to fetch products from Amazon at the moment.' });
  }
});

app.listen(PORT, () => {
  console.log(`Fashion Hub backend listening on port ${PORT}`);
});

export { buildAmazonSearchBody, normalizeAmazonProduct };
