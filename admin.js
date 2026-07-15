let catalog = null;
let editingId = null;
let editingType = 'photo';
let activePanel = 'dashboard';

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

function isLoggedIn() {
  return sessionStorage.getItem(ADMIN_CONFIG.sessionKey) === '1';
}

function login(password) {
  if (password === ADMIN_CONFIG.password) {
    sessionStorage.setItem(ADMIN_CONFIG.sessionKey, '1');
    return true;
  }
  return false;
}

function logout() {
  sessionStorage.removeItem(ADMIN_CONFIG.sessionKey);
  location.reload();
}

async function init() {
  if (!isLoggedIn()) {
    $('#loginScreen').style.display = 'flex';
    $('#adminLayout').classList.remove('active');
    $('#loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const pw = $('#loginPassword').value;
      if (login(pw)) {
        $('#loginScreen').style.display = 'none';
        startAdmin();
      } else {
        $('#loginError').style.display = 'block';
      }
    });
    return;
  }
  startAdmin();
}

async function startAdmin() {
  $('#loginScreen').style.display = 'none';
  $('#adminLayout').classList.add('active');
  await Catalog.load();
  catalog = Catalog.data;
  bindNav();
  bindToolbar();
  renderAll();
}

function bindNav() {
  $$('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      activePanel = btn.dataset.panel;
      $$('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $$('.panel').forEach(p => p.classList.remove('active'));
      $(`#panel-${activePanel}`).classList.add('active');
      renderAll();
    });
  });
  $('#logoutBtn').addEventListener('click', logout);
  $('#saveLocalBtn').addEventListener('click', saveLocal);
  $('#exportBtn').addEventListener('click', () => Catalog.exportJson(catalog));
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', importJson);
  $('#resetBtn').addEventListener('click', resetFromServer);
  $('#addProductBtn').addEventListener('click', () => openProductModal('photo'));
  $('#addVideoBtn').addEventListener('click', () => openProductModal('video'));
  $('#addCategoryBtn').addEventListener('click', addCategory);
  $('#saveStoreBtn').addEventListener('click', saveStore);
  $('#productForm').addEventListener('submit', saveProduct);
  $('#cancelModalBtn').addEventListener('click', closeModal);
  $('#modalOverlay').addEventListener('click', (e) => {
    if (e.target === $('#modalOverlay')) closeModal();
  });
  $('#imageFile').addEventListener('change', previewImageFile);
}

function bindToolbar() {
  $('#searchProducts').addEventListener('input', renderProductsTable);
  $('#filterCategory').addEventListener('change', renderProductsTable);
  $('#searchVideos').addEventListener('input', renderVideosTable);
}

function saveLocal() {
  Catalog.saveLocal(catalog);
  toast('Salvat local! Site-ul va folosi aceste date în acest browser.');
}

function resetFromServer() {
  if (!confirm('Resetezi la products.json de pe server?')) return;
  Catalog.clearLocal();
  toast('Cache șters. Reîncarcă pagina.');
  setTimeout(() => location.reload(), 1200);
}

function importJson(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      catalog = JSON.parse(ev.target.result);
      Catalog.saveLocal(catalog);
      renderAll();
      toast('Import reușit!');
    } catch {
      toast('Fișier JSON invalid');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function saveStore() {
  catalog.store = {
    name: $('#storeName').value,
    tagline: $('#storeTagline').value,
    siteUrl: $('#storeSiteUrl').value,
    instagram: $('#storeInstagram').value,
    phone: $('#storePhone').value,
    address: $('#storeAddress').value,
    city: $('#storeCity').value,
    followers: $('#storeFollowers').value,
    posts: $('#storePosts').value,
  };
  Catalog.saveLocal(catalog);
  toast('Setări magazin salvate');
}

function renderAll() {
  renderStats();
  renderCategoryFilters();
  renderProductsTable();
  renderVideosTable();
  renderCategories();
  renderStoreForm();
}

function renderStats() {
  $('#statProducts').textContent = catalog.products.length;
  $('#statVideos').textContent = catalog.videoProducts.length;
  $('#statCategories').textContent = catalog.categories.length;
}

function renderCategoryFilters() {
  const opts = catalog.categories.map(c => `<option value="${c}">${c}</option>`).join('');
  $('#filterCategory').innerHTML = `<option value="">Toate categoriile</option>${opts}`;
  $('#formCategory').innerHTML = opts;
}

function renderProductsTable() {
  const search = ($('#searchProducts').value || '').toLowerCase();
  const cat = $('#filterCategory').value;
  let items = catalog.products;
  if (search) items = items.filter(p => p.name.toLowerCase().includes(search) || p.id.includes(search));
  if (cat) items = items.filter(p => p.category === cat);

  $('#productsTable').innerHTML = items.map(p => `
    <tr>
      <td><img class="product-thumb" src="${p.image}" alt="" onerror="this.style.opacity=0.3"></td>
      <td><strong>${p.name}</strong><br><small style="color:var(--muted)">${p.id}</small></td>
      <td>${p.category}</td>
      <td>${p.price.toLocaleString()} MDL</td>
      <td>${p.sizes || '—'}</td>
      <td><span class="badge-type">foto</span></td>
      <td class="actions">
        <button class="btn btn-outline btn-sm" onclick="editProduct('photo','${p.id}')">Editează</button>
        <button class="btn btn-danger btn-sm" onclick="deleteProduct('photo','${p.id}')">Șterge</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--muted)">Niciun produs</td></tr>';
}

function renderVideosTable() {
  const search = ($('#searchVideos').value || '').toLowerCase();
  let items = catalog.videoProducts;
  if (search) items = items.filter(p => p.name.toLowerCase().includes(search));

  $('#videosTable').innerHTML = items.map(p => `
    <tr>
      <td><img class="product-thumb" src="${p.image}" alt=""></td>
      <td><strong>${p.name}</strong><br><small style="color:var(--muted)">${p.id}</small></td>
      <td>${p.category}</td>
      <td>${p.price.toLocaleString()} MDL</td>
      <td><span class="badge-type video">video</span></td>
      <td class="actions">
        <button class="btn btn-outline btn-sm" onclick="editProduct('video','${p.id}')">Editează</button>
        <button class="btn btn-danger btn-sm" onclick="deleteProduct('video','${p.id}')">Șterge</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--muted)">Niciun video</td></tr>';
}

function renderCategories() {
  $('#categoriesList').innerHTML = catalog.categories.map((cat, i) => `
    <div class="cat-item">
      <input type="text" value="${cat}" data-idx="${i}" onchange="renameCategory(${i}, this.value)">
      <button class="btn btn-danger btn-sm" onclick="deleteCategory(${i})">Șterge</button>
    </div>
  `).join('');
}

function renderStoreForm() {
  const s = catalog.store;
  $('#storeName').value = s.name || '';
  $('#storeTagline').value = s.tagline || '';
  $('#storeSiteUrl').value = s.siteUrl || '';
  $('#storeInstagram').value = s.instagram || '';
  $('#storePhone').value = s.phone || '';
  $('#storeAddress').value = s.address || '';
  $('#storeCity').value = s.city || '';
  $('#storeFollowers').value = s.followers || '';
  $('#storePosts').value = s.posts || '';
}

function openProductModal(type, product = null) {
  editingType = type;
  editingId = product ? product.id : null;
  $('#modalTitle').textContent = product ? 'Editează produs' : (type === 'video' ? 'Adaugă video' : 'Adaugă produs');
  $('#videoFields').style.display = type === 'video' ? 'block' : 'none';

  if (product) {
    $('#formId').value = product.id;
    $('#formId').disabled = true;
    $('#formName').value = product.name;
    $('#formCategory').value = product.category;
    $('#formPrice').value = product.price;
    $('#formSizes').value = product.sizes || '';
    $('#formDescription').value = product.description || '';
    $('#formImage').value = product.image || '';
    $('#formBadge').value = product.badge || '';
    $('#formInstagram').value = product.instagram || product.reel || '';
    $('#formVideo').value = product.video || '';
    $('#imagePreview').src = product.image;
  } else {
    $('#formId').value = '';
    $('#formId').disabled = false;
    $('#productForm').reset();
    $('#imagePreview').src = '';
    $('#formCategory').value = catalog.categories[0] || '';
  }
  $('#modalOverlay').classList.add('active');
}

window.editProduct = function(type, id) {
  const list = type === 'video' ? catalog.videoProducts : catalog.products;
  const product = list.find(p => p.id === id);
  if (product) openProductModal(type, product);
};

window.deleteProduct = function(type, id) {
  if (!confirm('Ștergi acest produs?')) return;
  if (type === 'video') {
    catalog.videoProducts = catalog.videoProducts.filter(p => p.id !== id);
  } else {
    catalog.products = catalog.products.filter(p => p.id !== id);
  }
  Catalog.saveLocal(catalog);
  renderAll();
  toast('Produs șters');
};

window.deleteCategory = function(idx) {
  const cat = catalog.categories[idx];
  const used = [...catalog.products, ...catalog.videoProducts].some(p => p.category === cat);
  if (used) { toast('Categoria este folosită de produse'); return; }
  if (!confirm(`Ștergi categoria "${cat}"?`)) return;
  catalog.categories.splice(idx, 1);
  Catalog.saveLocal(catalog);
  renderAll();
  toast('Categorie ștearsă');
};

window.renameCategory = function(idx, val) {
  const old = catalog.categories[idx];
  catalog.categories[idx] = val.trim();
  catalog.products.forEach(p => { if (p.category === old) p.category = val.trim(); });
  catalog.videoProducts.forEach(p => { if (p.category === old) p.category = val.trim(); });
  Catalog.saveLocal(catalog);
  renderCategoryFilters();
};

function addCategory() {
  const name = $('#newCategory').value.trim();
  if (!name) return;
  if (catalog.categories.includes(name)) { toast('Categoria există deja'); return; }
  catalog.categories.push(name);
  catalog.categories.sort();
  $('#newCategory').value = '';
  Catalog.saveLocal(catalog);
  renderAll();
  toast('Categorie adăugată');
}

function saveProduct(e) {
  e.preventDefault();
  let id = $('#formId').value.trim();
  if (!editingId) {
    id = id || Catalog.slugify($('#formName').value);
    const allIds = [...catalog.products, ...catalog.videoProducts].map(p => p.id);
    if (allIds.includes(id)) { toast('ID-ul există deja'); return; }
  }

  const item = {
    id,
    name: $('#formName').value.trim(),
    category: $('#formCategory').value,
    price: +$('#formPrice').value,
    sizes: $('#formSizes').value.trim(),
    description: $('#formDescription').value.trim(),
    image: $('#formImage').value.trim(),
    instagram: $('#formInstagram').value.trim() || catalog.store.instagram,
  };

  if (editingType === 'photo') {
    item.type = 'photo';
    item.badge = $('#formBadge').value.trim() || 'În stoc';
    if (editingId) {
      const idx = catalog.products.findIndex(p => p.id === editingId);
      catalog.products[idx] = item;
    } else {
      catalog.products.unshift(item);
    }
  } else {
    item.video = $('#formVideo').value.trim();
    item.reel = item.instagram;
    if (editingId) {
      const idx = catalog.videoProducts.findIndex(p => p.id === id);
      catalog.videoProducts[idx] = item;
    } else {
      catalog.videoProducts.unshift(item);
    }
  }

  Catalog.saveLocal(catalog);
  closeModal();
  renderAll();
  toast('Produs salvat!');
}

function closeModal() {
  $('#modalOverlay').classList.remove('active');
  editingId = null;
}

function previewImageFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    $('#imagePreview').src = ev.target.result;
    const slug = Catalog.slugify($('#formName').value || file.name.replace(/\.\w+$/, ''));
    $('#formImage').value = `assets/products/${slug}.jpg`;
    toast('Setează imaginea în assets/products/ și fă git push');
  };
  reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', init);