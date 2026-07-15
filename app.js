let cart = JSON.parse(localStorage.getItem('cart') || '[]');

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function formatPrice(price) {
  return `${price.toLocaleString('ro-MD')} MDL`;
}

function getSiteBase() {
  let path = window.location.pathname;
  if (path.endsWith('index.html')) path = path.slice(0, -'index.html'.length);
  if (!path.endsWith('/')) path += '/';
  return window.location.origin + path;
}

function getProductLink(item) {
  return new URL(item.image, getSiteBase()).href;
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const count = cart.length;
  const badge = $('#cartCount');
  badge.textContent = count;
  badge.classList.toggle('visible', count > 0);

  const container = $('#cartItems');
  const totalEl = $('#cartTotal');

  if (cart.length === 0) {
    container.innerHTML = '<p class="cart-empty">Coșul este gol</p>';
    totalEl.textContent = '0 MDL';
    return;
  }

  container.innerHTML = cart.map((item, i) => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
        <button class="cart-remove" data-index="${i}">Elimină</button>
      </div>
    </div>
  `).join('');

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  totalEl.textContent = formatPrice(total);

  container.querySelectorAll('.cart-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      cart.splice(+btn.dataset.index, 1);
      saveCart();
    });
  });
}

function addToCart(product) {
  cart.push(product);
  saveCart();
  showToast(`${product.name} adăugat în coș`);
}

function showToast(msg) {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

let activeCategory = 'Toate';

function renderCategoryFilters() {
  const container = $('#categoryFilters');
  if (!container || typeof CATEGORIES === 'undefined') return;
  container.innerHTML = CATEGORIES.map(cat => `
    <button class="filter-btn${cat === activeCategory ? ' active' : ''}" data-category="${cat}">${cat}</button>
  `).join('');

  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.category;
      container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts();
    });
  });
}

function renderProducts() {
  const grid = $('#productsGrid');
  const filtered = activeCategory === 'Toate'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === activeCategory);

  grid.innerHTML = filtered.map((p, i) => `
    <article class="product-card reveal" style="transition-delay: ${i * 0.1}s" data-id="${p.id}">
      <div class="product-image">
        <span class="product-badge">${p.badge}</span>
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <div class="product-overlay">
          <button class="overlay-btn" data-action="view" data-id="${p.id}">Detalii</button>
          <button class="overlay-btn" data-action="cart" data-id="${p.id}">Adaugă</button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <h3 class="product-name">${p.name}</h3>
        <div class="product-meta">
          <span class="product-price">${formatPrice(p.price)}</span>
          <span class="product-sizes">Mărimi ${p.sizes}</span>
        </div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const product = PRODUCTS.find(p => p.id === btn.dataset.id);
      if (btn.dataset.action === 'cart') addToCart(product);
      else openProductModal(product);
    });
  });

  initScrollReveal();
}

function renderVideos() {
  const grid = $('#videosGrid');
  grid.innerHTML = VIDEO_PRODUCTS.map((v, i) => `
    <article class="video-card reveal" style="transition-delay: ${i * 0.05}s" data-id="${v.id}">
      <img class="video-poster" src="${v.image}" alt="${v.name}" loading="lazy">
      <video class="video-preview" src="${v.video}" muted loop playsinline preload="metadata" poster="${v.image}"></video>
      <div class="video-play">
        <div class="play-icon">
          <svg viewBox="0 0 24 24"><polygon points="8,5 19,12 8,19"/></svg>
        </div>
      </div>
      <div class="video-info">
        <h3>${v.name}</h3>
        <span class="product-price">${formatPrice(v.price)}</span>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.video-card').forEach(card => {
    const preview = card.querySelector('.video-preview');
    card.addEventListener('mouseenter', () => {
      preview.play().catch(() => {});
      card.classList.add('playing');
    });
    card.addEventListener('mouseleave', () => {
      preview.pause();
      preview.currentTime = 0;
      card.classList.remove('playing');
    });
    card.addEventListener('click', () => {
      const video = VIDEO_PRODUCTS.find(v => v.id === card.dataset.id);
      openVideoModal(video);
    });
  });

  initScrollReveal();
}

function openProductModal(product) {
  const modal = $('#productModal');
  modal.querySelector('.modal-image img').src = product.image;
  modal.querySelector('.modal-image img').alt = product.name;
  modal.querySelector('h3').textContent = product.name;
  modal.querySelector('.modal-price').textContent = formatPrice(product.price);
  modal.querySelector('.modal-desc').textContent = product.description;
  modal.querySelector('.modal-sizes').textContent = `Mărimi: ${product.sizes}`;

  const addBtn = modal.querySelector('[data-modal-cart]');
  addBtn.onclick = () => {
    addToCart(product);
    closeModals();
  };

  const igBtn = modal.querySelector('[data-modal-ig]');
  igBtn.href = product.instagram;

  modal.classList.add('active');
}

function openVideoModal(video) {
  const modal = $('#videoModal');
  const player = modal.querySelector('video');
  player.src = video.video;
  player.poster = video.image;
  player.load();
  player.play().catch(() => {});
  modal.querySelector('h3').textContent = video.name;
  modal.querySelector('.modal-price').textContent = formatPrice(video.price);
  modal.querySelector('.modal-desc').textContent = video.description;

  const addBtn = modal.querySelector('[data-modal-cart]');
  addBtn.onclick = () => {
    addToCart({ ...video, image: video.image });
    closeModals();
  };

  const igBtn = modal.querySelector('[data-modal-ig]');
  igBtn.href = video.reel;

  modal.classList.add('active');
}

function closeModals() {
  $$('.modal-overlay').forEach(m => m.classList.remove('active'));
  const player = $('#videoModal video');
  if (player) {
    player.pause();
    player.removeAttribute('src');
    player.load();
  }
}

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal').forEach(el => observer.observe(el));
}

function initNav() {
  const nav = $('#nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });

  $('#menuToggle').addEventListener('click', () => {
    $('#navLinks').classList.toggle('open');
  });

  $$('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      $('#navLinks').classList.remove('open');
    });
  });
}

function initCart() {
  $('#cartBtn').addEventListener('click', () => {
    $('#cartSidebar').classList.add('open');
    $('#cartBackdrop').classList.add('open');
  });

  const close = () => {
    $('#cartSidebar').classList.remove('open');
    $('#cartBackdrop').classList.remove('open');
  };

  $('#cartClose').addEventListener('click', close);
  $('#cartBackdrop').addEventListener('click', close);

  $('#checkoutBtn').addEventListener('click', () => {
    if (cart.length === 0) return;
    const total = cart.reduce((s, i) => s + i.price, 0);
    const lines = cart.map((item, i) => {
      const sizes = item.sizes ? ` (mărimi ${item.sizes})` : '';
      return `${i + 1}. ${item.name} — ${formatPrice(item.price)}${sizes}\n🔗 ${getProductLink(item)}`;
    });
    const msg = `Bună! Doresc să comand:\n\n${lines.join('\n\n')}\n\n💰 Total: ${formatPrice(total)}`;
    window.open(`https://wa.me/37369253147?text=${encodeURIComponent(msg)}`, '_blank');
  });
}

function initModals() {
  $$('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', closeModals);
  });

  $$('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModals();
    });
  });
}

function initLoader() {
  window.addEventListener('load', () => {
    setTimeout(() => $('#loader').classList.add('hidden'), 800);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderCategoryFilters();
  renderProducts();
  renderVideos();
  updateCartUI();
  initScrollReveal();
  initNav();
  initCart();
  initModals();
  initLoader();
});