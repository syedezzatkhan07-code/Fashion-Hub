const STORAGE_KEY = 'fashion-hub-recent';

function readRecent() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

function writeRecent(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getRecent() {
  return readRecent();
}

export function addRecentView(id) {
  const next = [id, ...readRecent().filter((item) => item !== id)].slice(0, 5);
  writeRecent(next);
  return next;
}
