/* ═══════════════════════════════════════════════════════
   K_K FASHION — app.js
   GEN-Z PREMIUM (sub-cats) | OTHER (sub-cats)
═══════════════════════════════════════════════════════ */

const WHATSAPP_NUMBER = "9950701758";
const ADMIN_PIN       = "8619";

const load = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const $    = (id) => document.getElementById(id);

let genzSubCategories  = [];
let otherSubCategories = [];
let products           = [];
let cart               = load("knk_cart", []);
let activeMainCat      = "GENZ";
let activeSubCat       = "All";
let editingProductId   = null;

const finalPrice = (p) => Math.round(p.price - (p.price * (p.discount || 0)) / 100 + (p.extra || 0));

/* ── Firebase Callbacks ── */
window.updateSettingsFromFirebase = function(genzSubs, otherSubs) {
  genzSubCategories  = Array.isArray(genzSubs)  ? genzSubs  : [];
  otherSubCategories = Array.isArray(otherSubs) ? otherSubs : [];
  renderSubCats();
  if (!$("adminPanel").classList.contains("hidden")) renderAdmin();
};

window.updateProductsFromFirebase = function(fbProducts) {
  products = fbProducts;
  renderProducts();
  if (!$("adminPanel").classList.contains("hidden")) renderAdmin();
};

/* ── Splash ── */
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const splash = $("splash");
    splash.style.transition = "opacity 0.5s ease";
    splash.style.opacity = "0";
    setTimeout(() => {
      splash.classList.add("hidden");
      $("app").classList.remove("hidden");
      renderSubCats();
      renderProducts();
      renderCartCount();
    }, 500);
  }, 2500);
});

/* ── Main Category Toggle ── */
window.selectMainCat = function(cat) {
  activeMainCat = cat;
  activeSubCat  = "All";
  $("btnGenz").classList.toggle("active",  cat === "GENZ");
  $("btnOther").classList.toggle("active", cat === "OTHER");
  renderSubCats();
  renderProducts();
};

/* ── Sub-Category Bar ── */
function renderSubCats() {
  const wrap    = $("subCats");
  const subWrap = $("subCatsWrap");
  wrap.innerHTML = "";

  const list = activeMainCat === "GENZ" ? genzSubCategories : otherSubCategories;

  if (list.length === 0) {
    subWrap.classList.add("hidden-bar");
    return;
  }

  subWrap.classList.remove("hidden-bar");

  ["All", ...list].forEach((c, i) => {
    const b = document.createElement("button");
    b.className = "cat" + (c === activeSubCat ? " active" : "");
    b.textContent = c;
    b.style.animationDelay = (i * 0.06) + "s";
    b.style.animation = "fadeUp 0.4s ease both";
    b.onclick = () => { activeSubCat = c; renderSubCats(); renderProducts(); };
    wrap.appendChild(b);
  });
}

/* ── Product Grid ── */
function renderProducts() {
  let list = [];

  if (activeMainCat === "GENZ") {
    $("activeTitle").textContent = activeSubCat === "All" ? "GEN-Z PREMIUM" : activeSubCat;
    const pool = products.filter(p => p.mainCategory === "GENZ");
    list = activeSubCat === "All" ? pool : pool.filter(p => p.subCategory === activeSubCat);
  } else {
    $("activeTitle").textContent = activeSubCat === "All" ? "OTHER" : activeSubCat;
    const pool = products.filter(p => p.mainCategory === "OTHER");
    list = activeSubCat === "All" ? pool : pool.filter(p => p.subCategory === activeSubCat);
  }

  const grid = $("products");
  if (list.length === 0) {
    grid.innerHTML = '<p class="empty">Loading products from server...</p>';
    return;
  }
  grid.innerHTML = "";

  list.forEach((p, i) => {
    const price   = finalPrice(p);
    const inStock = p.inStock !== false;
    const el = document.createElement("div");
    el.className = "product";
    el.style.animationDelay = (i * 0.07) + "s";

    el.innerHTML = `
      <div class="${!inStock ? 'out-of-stock-overlay' : ''}">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="info">
        <div class="name">${p.name}</div>
        <div class="price-row">
          <span class="price">₹${price}</span>
          ${p.discount > 0 ? `<span class="strike">₹${p.price}</span><span class="off">${p.discount}% off</span>` : ""}
        </div>
        <span class="stock-badge ${inStock ? 'in' : 'out'}">${inStock ? '● In Stock' : '● Out of Stock'}</span>
        <div class="btn-row" style="margin-top:10px;">
          <button class="btn-outline" ${!inStock ? 'disabled' : ''}>🛒 Cart</button>
          <button class="btn-primary" ${!inStock ? 'disabled' : ''}>💬 Buy</button>
        </div>
      </div>`;

    if (inStock) {
      el.querySelector(".btn-outline").onclick = () => addToCart(p);
      el.querySelector(".btn-primary").onclick = () => {
        const text = encodeURIComponent(`Hello! I want to buy:\n${p.name}\nPrice: ₹${price}`);
        window.open(`https://wa.me/91${WHATSAPP_NUMBER}?text=${text}`, "_blank");
      };
    }
    grid.appendChild(el);
  });
}

/* ── Cart ── */
function addToCart(p) {
  const found = cart.find(i => i.product.id === p.id);
  if (found) found.qty += 1; else cart.push({ product: p, qty: 1 });
  save("knk_cart", cart);
  renderCartCount();
  renderCart();
  const btn = $("cartBtn");
  btn.style.color = "#C9A84C";
  setTimeout(() => { btn.style.color = ""; }, 600);
}

function removeFromCart(id) { cart = cart.filter(i => i.product.id !== id); save("knk_cart", cart); renderCartCount(); renderCart(); }
function clearCart()        { cart = []; save("knk_cart", cart); renderCartCount(); renderCart(); }

function renderCartCount() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const badge = $("cartCount");
  badge.textContent = count;
  badge.classList.toggle("hidden", count === 0);
}

function renderCart() {
  const body = $("cartItems");
  const foot = $("cartFooter");
  if (cart.length === 0) {
    body.innerHTML = '<p class="empty">Cart is empty</p>';
    foot.classList.add("hidden");
    return;
  }
  body.innerHTML = "";
  cart.forEach(i => {
    const el = document.createElement("div");
    el.className = "cart-item";
    el.innerHTML = `
      <img src="${i.product.image}" alt="${i.product.name}" />
      <div class="ci-info">
        <div class="ci-name">${i.product.name}</div>
        <div class="ci-sub">₹${finalPrice(i.product)} × ${i.qty}</div>
      </div>
      <button class="trash">🗑️</button>`;
    el.querySelector(".trash").onclick = () => removeFromCart(i.product.id);
    body.appendChild(el);
  });
  const total = cart.reduce((s, i) => s + finalPrice(i.product) * i.qty, 0);
  $("cartTotal").textContent = "₹" + total;
  foot.classList.remove("hidden");
}

$("cartBtn").onclick      = () => { renderCart(); $("cartOverlay").classList.remove("hidden"); };
$("cartClose").onclick    = () => $("cartOverlay").classList.add("hidden");
$("cartOverlay").onclick  = e => { if (e.target === $("cartOverlay")) $("cartOverlay").classList.add("hidden"); };
$("clearCartBtn").onclick = clearCart;
$("checkoutBtn").onclick  = () => {
  if (!cart.length) return;
  const total = cart.reduce((s, i) => s + finalPrice(i.product) * i.qty, 0);
  const lines = cart.map(i => `${i.product.name} x${i.qty} = ₹${finalPrice(i.product) * i.qty}`).join("%0A");
  window.open(`https://wa.me/91${WHATSAPP_NUMBER}?text=Hello! My order:%0A${lines}%0A%0ATotal: ₹${total}`, "_blank");
};

/* ── Admin PIN ── */
let tapCount = 0, tapTimer = null;
$("logoBtn").onclick = () => {
  tapCount++;
  if (tapTimer) clearTimeout(tapTimer);
  if (tapCount >= 7) { tapCount = 0; openPin(); return; }
  tapTimer = setTimeout(() => { tapCount = 0; }, 1200);
};

function openPin() {
  $("pinInput").value = "";
  $("pinError").classList.add("hidden");
  $("adminPin").classList.remove("hidden");
  $("pinInput").focus();
}

$("pinClose").onclick   = () => $("adminPin").classList.add("hidden");
$("pinUnlock").onclick  = tryUnlock;
$("pinInput").onkeydown = e => { if (e.key === "Enter") tryUnlock(); };

function tryUnlock() {
  if ($("pinInput").value === ADMIN_PIN) {
    $("adminPin").classList.add("hidden");
    openAdmin();
  } else {
    $("pinError").classList.remove("hidden");
    $("pinInput").style.borderColor = "#e05555";
    setTimeout(() => { $("pinInput").style.borderColor = ""; }, 800);
  }
}

/* ── Admin Panel ── */
function openAdmin() { renderAdmin(); $("adminPanel").classList.remove("hidden"); }
$("adminClose").onclick = () => $("adminPanel").classList.add("hidden");

function renderChips(containerId, arr, type) {
  const container = $(containerId);
  container.innerHTML = "";
  arr.forEach(c => {
    const el = document.createElement("span");
    el.className = "chip";
    el.innerHTML = `${c} <button title="Delete">✕</button>`;
    el.querySelector("button").onclick = () => {
      if (!confirm(`"${c}" delete karein?`)) return;
      if (type === "GENZ") {
        genzSubCategories = genzSubCategories.filter(x => x !== c);
      } else {
        otherSubCategories = otherSubCategories.filter(x => x !== c);
      }
      if (window.saveSettingsToFirebase) window.saveSettingsToFirebase(genzSubCategories, otherSubCategories);
      renderSubCats();
      renderProducts();
      renderAdmin();
    };
    container.appendChild(el);
  });
}

window.renderAdmin = function renderAdmin() {
  renderChips("adminGenzSubCats",  genzSubCategories,  "GENZ");
  renderChips("adminOtherSubCats", otherSubCategories, "OTHER");

  onMainCatChange();

  $("adminProdTitle").textContent = `Products (${products.length})`;
  const filterMain = $("adminFilterMain").value || "ALL";
  const list = $("adminProducts");
  list.innerHTML = "";

  const filtered = filterMain === "ALL" ? products :
    products.filter(p => p.mainCategory === filterMain);

  filtered.forEach(p => {
    const price     = finalPrice(p);
    const inStock   = p.inStock !== false;
    const mainLabel = p.mainCategory === "GENZ" ? "GEN-Z PREMIUM" : "OTHER";
    const subLabel  = p.subCategory ? ` · ${p.subCategory}` : "";

    const el = document.createElement("div");
    el.className = "admin-prod";
    el.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <div class="ap-info">
        <div class="ap-name">${p.name}</div>
        <div class="ap-sub">${mainLabel}${subLabel}</div>
        <div class="ap-price">₹${price} ${p.discount > 0 ? `(${p.discount}% off)` : ''} · <span style="color:${inStock ? '#4cc968' : '#e05555'}">${inStock ? 'In Stock' : 'Out of Stock'}</span></div>
      </div>
      <div class="ap-actions">
        <button class="edit-btn" title="Edit">✏️</button>
        <button class="trash" title="Delete">🗑️</button>
      </div>`;

    el.querySelector(".edit-btn").onclick = () => openEditModal(p);
    el.querySelector(".trash").onclick    = () => {
      if (!confirm("Kya aap sach me is product ko delete karna chahte hain?")) return;
      products = products.filter(x => x.id !== p.id);
      renderProducts();
      renderAdmin();
      if (window.deleteProductFromFirebase) window.deleteProductFromFirebase(p.id);
    };
    list.appendChild(el);
  });
};

/* ── Add GEN-Z sub-category ── */
$("addGenzSubCatBtn").onclick = () => {
  const v = $("newGenzSubCat").value.trim().toUpperCase();
  if (!v) return;
  if (genzSubCategories.some(x => x.toUpperCase() === v)) { alert("Pehle se exist karti hai!"); return; }
  genzSubCategories.push(v);
  if (window.saveSettingsToFirebase) window.saveSettingsToFirebase(genzSubCategories, otherSubCategories);
  $("newGenzSubCat").value = "";
  renderSubCats(); renderProducts(); renderAdmin();
};

/* ── Add OTHER sub-category ── */
$("addOtherSubCatBtn").onclick = () => {
  const v = $("newOtherSubCat").value.trim().toUpperCase();
  if (!v) return;
  if (otherSubCategories.some(x => x.toUpperCase() === v)) { alert("Pehle se exist karti hai!"); return; }
  otherSubCategories.push(v);
  if (window.saveSettingsToFirebase) window.saveSettingsToFirebase(genzSubCategories, otherSubCategories);
  $("newOtherSubCat").value = "";
  renderSubCats(); renderProducts(); renderAdmin();
};

/* ── Main category change → sync sub-cat dropdown ── */
window.onMainCatChange = function() {
  const val   = $("pMainCat").value;
  const group = $("subCatGroup");
  const list  = val === "GENZ" ? genzSubCategories : otherSubCategories;

  if (list.length === 0) {
    group.style.display = "none";
  } else {
    group.style.display = "";
    const sel = $("pSubCat");
    sel.innerHTML = "";
    list.forEach(c => {
      const o = document.createElement("option");
      o.value = c; o.textContent = c;
      sel.appendChild(o);
    });
  }
};

/* ── Stock toggle in Add Product form ── */
$("pInStock").addEventListener("change", function() {
  const lbl = $("pStockLabel");
  lbl.textContent = this.checked ? "In Stock" : "Out of Stock";
  lbl.className   = "stock-label " + (this.checked ? "in" : "out");
});

/* ── Edit Product Modal ── */
function openEditModal(p) {
  editingProductId           = p.id;
  $("editPName").textContent = p.name;
  $("editPPrice").value      = p.price;
  $("editPDiscount").value   = p.discount || 0;
  $("editPExtra").value      = p.extra    || 0;
  const inStock              = p.inStock !== false;
  $("editInStock").checked   = inStock;
  const lbl = $("editStockLabel");
  lbl.textContent = inStock ? "In Stock" : "Out of Stock";
  lbl.className   = "stock-label " + (inStock ? "in" : "out");
  $("editModal").classList.remove("hidden");
}

$("editInStock").addEventListener("change", function() {
  const lbl = $("editStockLabel");
  lbl.textContent = this.checked ? "In Stock" : "Out of Stock";
  lbl.className   = "stock-label " + (this.checked ? "in" : "out");
});

$("editClose").onclick = () => { $("editModal").classList.add("hidden"); editingProductId = null; };

$("saveEditBtn").onclick = () => {
  if (!editingProductId) return;
  const newPrice    = Number($("editPPrice").value);
  const newDiscount = Number($("editPDiscount").value) || 0;
  const newExtra    = Number($("editPExtra").value)    || 0;
  const newInStock  = $("editInStock").checked;

  if (!newPrice || newPrice <= 0) { alert("Sahi price daalein!"); return; }

  const idx = products.findIndex(p => p.id === editingProductId);
  if (idx > -1) {
    products[idx].price    = newPrice;
    products[idx].discount = newDiscount;
    products[idx].extra    = newExtra;
    products[idx].inStock  = newInStock;
    renderProducts();
    renderAdmin();
  }

  if (window.updateProductInFirebase) {
    window.updateProductInFirebase(editingProductId, {
      price: newPrice, discount: newDiscount, extra: newExtra, inStock: newInStock
    });
  }

  $("editModal").classList.add("hidden");
  editingProductId = null;
};

/* ── Initial Render ── */
renderCartCount();
