const Catalog = {
  STORAGE_KEY: 'rochii_catalog_v1',
  data: null,

  async load() {
    let data = null;
    const cached = localStorage.getItem(this.STORAGE_KEY);
    if (cached) {
      try { data = JSON.parse(cached); } catch (_) {}
    }
    if (!data) {
      const res = await fetch('data/products.json?v=' + Date.now());
      data = await res.json();
    }
    this.data = data;
    return data;
  },

  saveLocal(data) {
    this.data = data;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  },

  clearLocal() {
    localStorage.removeItem(this.STORAGE_KEY);
  },

  exportJson(data = this.data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'products.json';
    a.click();
    URL.revokeObjectURL(a.href);
  },

  applyToGlobals() {
    const d = this.data;
    window.STORE = d.store;
    window.PRODUCTS = d.products;
    window.VIDEO_PRODUCTS = d.videoProducts;
    window.CATEGORIES = ['Toate', ...d.categories];
  },

  slugify(text) {
    return text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'produs';
  }
};