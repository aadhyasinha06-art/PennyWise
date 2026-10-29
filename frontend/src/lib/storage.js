// Safe localStorage helpers. Nothing here ever clears storage on its own.
export function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
}

// Tiny store so the UI can show a warning if the browser refuses to save.
let saveFailed = false;
const listeners = new Set();
function setSaveFailed(value) {
  if (saveFailed === value) return;
  saveFailed = value;
  listeners.forEach((fn) => fn());
}
export const subscribeSaveStatus = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getSaveFailed = () => saveFailed;

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    setSaveFailed(false);
    return true;
  } catch {
    setSaveFailed(true); // storage full or blocked
    return false;
  }
}

export const hasStorageKey = (key) => {
  try { return localStorage.getItem(key) !== null; } catch { return false; }
};
