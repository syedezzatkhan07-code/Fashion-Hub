const STORAGE_KEY = 'fashion-hub-wishlist';

function readWishlist() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

function writeWishlist(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getWishlist() {
  return readWishlist();
}

export function toggleWishlist(id) {
  const next = readWishlist();
  const updated = next.includes(id) ? next.filter((item) => item !== id) : [...next, id];
  writeWishlist(updated);
  return updated;
}
