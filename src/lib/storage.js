// Trwały zapis w localStorage (zastępuje window.storage z artifactu claude.ai).
// Zwraca { value } albo null, żeby reszta kodu mogła zostać przy async API.
export const storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    return value === null ? null : { value };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
  },
};
