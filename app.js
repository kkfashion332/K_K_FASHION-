/* ═══════════════════════════════════════════════════════
   K_K FASHION — app.js
   Complete app: Categories + Search + Cart + Checkout + UPI
═══════════════════════════════════════════════════════ */

const ADMIN_PIN = "9672";
const UPI_ID    = "pathaanshab786@ybl";
const UPI_NAME  = "K_K Fashion";

const load = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; } };
const save = (k, v)  => localStorage.setItem(k, JSON.stringify(v));
const $    = id      => document.getElementById(id);

let mainCategories       = [];
let products             = [];
let cart                 = load("knk_cart", []);
let activeMainCatId      = null;
let activeSubCat         = "All";
let editingProductId     = null;
let searchQuery          = "";
let currentDetailProduct = null;
let checkoutProduct      = null;

const genId      = () => "p_" + Date.now() + Math.floor(Math.random() * 1000);
const finalPrice = p  => Math.round(p.price - (p.price * (p.discount || 0)) / 100 + (p.extra || 0));
const getCat     = id => mainCategories.find(c => c.id === id);

/* ════════════════════════════════════
   DEMO DATA
════════════════════════════════════ */
const DEMO_CATEGORIES = [
  { id: "cat_shirts",  name: "SHIRTS",       subCategories: ["CASUAL", "FORMAL", "PRINTED"] },
  { id: "cat_tshirts", name: "T-SHIRTS",     subCategories: ["PLAIN", "GRAPHIC", "POLO"] },
  { id: "cat_pants",   name: "PANTS",        subCategories: ["JEANS", "CHINOS", "SHORTS"] },
  { id: "cat_combo",   name: "COMBO DEALS",  subCategories: [] },
];

const DEMO_PRODUCTS = [
  { id:"p01", name:"Classic Casual Shirt",    price:999,  discount:20, extra:0, inStock:true,  mainCategoryId:"cat_shirts",  subCategory:"CASUAL",  image:"https://picsum.photos/seed/shirt1/400/400" },
  { id:"p02", name:"Premium Formal Shirt",    price:1499, discount:15, extra:0, inStock:true,  mainCategoryId:"cat_shirts",  subCategory:"FORMAL",  image:"https://picsum.photos/seed/shirt2/400/400" },
  { id:"p03", name:"Floral Printed Shirt",    price:899,  discount:25, extra:0, inStock:true,  mainCategoryId:"cat_shirts",  subCategory:"PRINTED", image:"https://picsum.photos/seed/shirt3/400/400" },
  { id:"p04", name:"Solid Plain T-Shirt",     price:499,  discount:10, extra:0, inStock:true,  mainCategoryId:"cat_tshirts", subCategory:"PLAIN",   image:"https://picsum.photos/seed/tee1/400/400" },
  { id:"p05", name:"Graphic Print Tee",       price:649,  discount:20, extra:0, inStock:true,  mainCategoryId:"cat_tshirts", subCategory:"GRAPHIC", image:"https://picsum.photos/seed/tee2/400/400" },
  { id:"p06", name:"Polo Collar T-Shirt",     price:799,  discount:0,  extra:0, inStock:true,  mainCategoryId:"cat_tshirts", subCategory:"POLO",    image:"https://picsum.photos/seed/polo1/400/400" },
  { id:"p07", name:"Slim Fit Jeans",          price:1299, discount:18, extra:0, inStock:true,  mainCategoryId:"cat_pants",   subCategory:"JEANS",   image:"https://picsum.photos/seed/jeans1/400/400" },
  { id:"p08", name:"Chino Trousers",          price:1099, discount:10, extra:0, inStock:false, mainCategoryId:"cat_pants",   subCategory:"CHINOS",  image:"https://picsum.photos/seed/chino1/400/400" },
  { id:"p09", name:"Casual Shorts",           price:599,  discount:15, extra:0, inStock:true,  mainCategoryId:"cat_pants",   subCategory:"SHORTS",  image:"https://picsum.photos/seed/shorts1/400/400" },
  { id:"p10", name:"Shirt + Jeans Combo",     price:2199, discount:22, extra:0, inStock:true,  mainCategoryId:"cat_combo",   subCategory:"",        image:"https://picsum.photos/seed/combo1/400/400" },
  { id:"p11", name:"3 T-Shirts Combo Pack",   price:1299, discount:30, extra:0, inStock:true,  mainCategoryId:"cat_combo",   subCategory:"",        image:"https://picsum.photos/seed/combo2/400/400" },
  { id:"p12", name:"Formal Shirt + Trousers", price:2499, discount:20, extra:50,inStock:true,  mainCategoryId:"cat_combo",   subCategory:"",        image:"https://picsum.photos/seed/combo3/400/400" },
];

/* ════════════════════════════════════
   FIREBASE CALLBACKS
════════════════════════════════════ */
window.updateCategoriesFromFirebase = function(cats) {
  mainCategories = cats || [];
  if (!activeMainCatId && mainCategories.length > 0) activeMainCatId = mainCategories[0].id;
  renderMainCats(); renderSubCats(); renderProducts();
  if (!$("adminPanel").classList.contains("hidden")) renderAdmin();
};

window.updateProductsFromFirebase = function(fbProducts) {
  products = fbProducts || [];
  renderProducts();
  if (!$("adminPanel").classList.contains("hidden")) renderAdmin();
};

window.saveCategoriesToFirebase = window.saveCategoriesToFirebase || function(cats) {
  save("knk_cats_local", cats);
};
window.saveProductToFirebase = window.saveProductToFirebase || function(product) {
  products = [product, ...products];
  save("knk_products_local", products);
  renderProducts();
  if (!$("adminPanel").classList.contains("hidden")) renderAdmin();
};
window.updateProductInFirebase = window.updateProductInFirebase || function(id, updates) {
  const idx = products.findIndex(p => p.id === id);
  if (idx > -1) products[idx] = { ...products[idx], ...updates };
  save("knk_products_local", products);
};
window.deleteProductFromFirebase = window.deleteProductFromFirebase || function(id) {
  products = products.filter(p => p.id !== id);
  save("knk_products_local", products);
};

/* ════════════════════════════════════
   SPLASH + INIT
════════════════════════════════════ */
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const splash = $("splash");
    splash.style.transition = "opacity 0.5s ease";
    splash.style.opacity = "0";
    setTimeout(() => {
      splash.classList.add("hidden");
      $("app").classList.remove("hidden");
    }, 500);
  }, 2500);

  const savedCats  = load("knk_cats_local", null);
  const savedProds = load("knk_products_local", null);

  if (savedCats && savedCats.length > 0) {
    window.updateCategoriesFromFirebase(savedCats);
    window.updateProductsFromFirebase(savedProds && savedProds.length > 0 ? savedProds : DEMO_PRODUCTS);
  } else {
    window.updateCategoriesFromFirebase(DEMO_CATEGORIES);
    window.updateProductsFromFirebase(DEMO_PRODUCTS);
  }

  renderCartCount();
});

/* ════════════════════════════════════
   MAIN CATEGORY BAR
════════════════════════════════════ */
function renderMainCats() {
  const wrap = $("mainCats");
  wrap.innerHTML = "";
  mainCategories.forEach((cat, i) => {
    const btn = document.createElement("button");
    btn.className = "main-cat-btn" + (cat.id === activeMainCatId && !searchQuery ? " active" : "");
    btn.style.animationDelay = (i * 0.07) + "s";
    btn.style.animation = "fadeUp 0.4s ease both";
    btn.innerHTML = `<span class="mc-label">${cat.name}</span>`;
    btn.onclick = () => selectMainCat(cat.id);
    wrap.appendChild(btn);
  });
}

window.selectMainCat = function(id) {
  if (searchQuery) {
    searchQuery = "";
    $("searchInput").value = "";
    $("searchClear").classList.add("hidden");
  }
  activeMainCatId = id;
  activeSubCat    = "All";
  renderMainCats(); renderSubCats(); renderProducts();
};

/* ════════════════════════════════════
   SUB-CATEGORY BAR
════════════════════════════════════ */
function renderSubCats() {
  const wrap    = $("subCats");
  const subWrap = $("subCatsWrap");
  wrap.innerHTML = "";
  if (searchQuery) { subWrap.classList.add("hidden-bar"); return; }

  const cat = getCat(activeMainCatId);
  if (!cat || !cat.subCategories || cat.subCategories.length === 0) {
    subWrap.classList.add("hidden-bar"); return;
  }
  subWrap.classList.remove("hidden-bar");
  ["All", ...cat.subCategories].forEach((s, i) => {
    const b = document.createElement("button");
    b.className = "cat" + (s === activeSubCat ? " active" : "");
    b.textContent = s;
    b.style.animationDelay = (i * 0.05) + "s";
    b.style.animation = "fadeUp 0.4s ease both";
    b.onclick = () => { activeSubCat = s; renderSubCats(); renderProducts(); };
    wrap.appendChild(b);
  });
}

/* ════════════════════════════════════
   SEARCH
════════════════════════════════════ */
function searchMatches(p, q) {
  if (!q) return false;
  const cat = getCat(p.mainCategoryId);
  const haystack = [p.name || "", p.subCategory || "", cat ? cat.name : ""].join(" ").toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every(w => haystack.includes(w));
}

let searchDebounce = null;
$("searchInput").addEventListener("input", function() {
  const v = this.value.trim();
  $("searchClear").classList.toggle("hidden", !v);
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    searchQuery = v;
    renderMainCats(); renderSubCats(); renderProducts();
  }, 120);
});
$("searchClear").addEventListener("click", () => {
  $("searchInput").value = "";
  $("searchClear").classList.add("hidden");
  searchQuery = "";
  renderMainCats(); renderSubCats(); renderProducts();
  $("searchInput").focus();
});
$("searchInput").addEventListener("keydown", e => {
  if (e.key === "Escape") {
    $("searchInput").value = "";
    $("searchClear").classList.add("hidden");
    searchQuery = "";
    renderMainCats(); renderSubCats(); renderProducts();
    $("searchInput").blur();
  }
});

/* ════════════════════════════════════
   PRODUCT GRID
════════════════════════════════════ */
function renderProducts() {
  const title = $("activeTitle");
  let list;

  if (searchQuery) {
    list = products.filter(p => searchMatches(p, searchQuery));
    title.innerHTML = `Search: "<span style="color:var(--primary)">${searchQuery}</span>"
                       <span class="search-count">${list.length} result${list.length === 1 ? "" : "s"}</span>`;
  } else {
    const cat = getCat(activeMainCatId);
    title.textContent = activeSubCat === "All" ? (cat ? cat.name : "") : activeSubCat;
    list = products.filter(p => p.mainCategoryId === activeMainCatId);
    if (activeSubCat !== "All") list = list.filter(p => p.subCategory === activeSubCat);
  }

  const grid = $("products");
  if (list.length === 0) {
    grid.innerHTML = searchQuery
      ? `<p class="empty">Koi product nahi mila "<strong>${searchQuery}</strong>" ke liye.<br/>Doosra word try karein.</p>`
      : `<p class="empty">Is category mein koi product nahi hai abhi.</p>`;
    return;
  }
  grid.innerHTML = "";

  list.forEach((p, i) => {
    const price   = finalPrice(p);
    const inStock = p.inStock !== false;
    const cat     = getCat(p.mainCategoryId);
    const tag     = searchQuery
      ? `<div class="prod-cat-tag">${cat ? cat.name : ""}${p.subCategory ? " · " + p.subCategory : ""}</div>`
      : "";

    const el = document.createElement("div");
    el.className = "product";
    el.style.animationDelay = (i * 0.05) + "s";
    el.innerHTML = `
      <div class="${!inStock ? 'out-of-stock-overlay' : ''}">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="info">
        <div class="name">${p.name}</div>
        ${tag}
        <div class="price-row">
          <span class="price">&#8377;${price}</span>
          ${p.discount > 0 ? `<span class="strike">&#8377;${p.price}</span><span class="off">${p.discount}% off</span>` : ""}
        </div>
        <span class="stock-badge ${inStock ? 'in' : 'out'}">${inStock ? '&#9679; In Stock' : '&#9679; Out of Stock'}</span>
        <div class="btn-row">
          <button class="btn-outline btn-cart-grid" ${!inStock ? 'disabled' : ''}>&#128722; Cart</button>
          <button class="btn-primary btn-buy-grid"  ${!inStock ? 'disabled' : ''}>Buy Now</button>
        </div>
      </div>`;

    el.querySelector("img").onclick   = () => openProductDetail(p);
    el.querySelector(".name").onclick = () => openProductDetail(p);

    if (inStock) {
      el.querySelector(".btn-cart-grid").onclick = (e) => { e.stopPropagation(); addToCart(p); };
      el.querySelector(".btn-buy-grid").onclick  = (e) => { e.stopPropagation(); openCheckout(p); };
    }
    grid.appendChild(el);
  });
}

/* ════════════════════════════════════
   PRODUCT DETAIL PAGE
════════════════════════════════════ */
function openProductDetail(p) {
  currentDetailProduct = p;
  const price   = finalPrice(p);
  const inStock = p.inStock !== false;
  const cat     = getCat(p.mainCategoryId);

  $("pdImage").src = p.image;
  $("pdImage").alt = p.name;

  const badge = $("pdStockBadge");
  badge.innerHTML = inStock ? "&#9679; In Stock" : "&#9679; Out of Stock";
  badge.className = "stock-badge pd-img-stock " + (inStock ? "in" : "out");

  let bc = cat ? cat.name : "";
  if (p.subCategory) bc += " \u203a " + p.subCategory;
  $("pdBreadcrumb").textContent = bc;
  $("pdName").textContent  = p.name;
  $("pdPrice").textContent = "\u20b9" + price;

  if (p.discount > 0) {
    $("pdStrike").textContent = "\u20b9" + p.price;
    $("pdStrike").classList.remove("hidden");
    $("pdOff").textContent = p.discount + "% off";
    $("pdOff").classList.remove("hidden");
  } else {
    $("pdStrike").classList.add("hidden");
    $("pdOff").classList.add("hidden");
  }

  const addBtn = $("pdAddCart");
  const buyBtn = $("pdBuyNow");
  addBtn.disabled = !inStock;
  buyBtn.disabled = !inStock;
  addBtn.textContent = inStock ? "🛒 Add to Cart" : "Out of Stock";
  buyBtn.textContent = inStock ? "Buy Now"        : "Out of Stock";

  if (inStock) {
    addBtn.onclick = () => {
      addToCart(p);
      addBtn.textContent = "✅ Added!";
      setTimeout(() => { addBtn.textContent = "🛒 Add to Cart"; }, 1200);
    };
    buyBtn.onclick = () => openCheckout(p);
  }

  renderHorizSections(p);
  $("pdScroll").scrollTop = 0;
  $("prodDetail").classList.remove("hidden", "closing");
  syncDetailCartBadge();
}

function closeProductDetail() {
  const detail = $("prodDetail");
  detail.classList.add("closing");
  detail.addEventListener("animationend", () => {
    detail.classList.add("hidden");
    detail.classList.remove("closing");
    currentDetailProduct = null;
  }, { once: true });
}

$("pdBackBtn").onclick = closeProductDetail;
$("pdCartBtn").onclick = () => { renderCart(); $("cartOverlay").classList.remove("hidden"); };

/* Horizontal Related Sections */
function renderHorizSections(currentProduct) {
  const container = $("pdHorizSections");
  container.innerHTML = "";

  if (currentProduct.subCategory) {
    const subList = products.filter(p => p.id !== currentProduct.id && p.subCategory === currentProduct.subCategory);
    if (subList.length > 0) container.appendChild(buildHorizSection("More from " + currentProduct.subCategory, subList));
  }

  const sameMainList = products.filter(p =>
    p.id !== currentProduct.id &&
    p.mainCategoryId === currentProduct.mainCategoryId &&
    (currentProduct.subCategory ? p.subCategory !== currentProduct.subCategory : true)
  );
  if (sameMainList.length > 0) {
    const cat = getCat(currentProduct.mainCategoryId);
    container.appendChild(buildHorizSection("More from " + (cat ? cat.name : "This Category"), sameMainList));
  }

  mainCategories.forEach(cat => {
    if (cat.id === currentProduct.mainCategoryId) return;
    const catProds = products.filter(p => p.mainCategoryId === cat.id);
    if (catProds.length === 0) return;
    const subs = cat.subCategories || [];
    if (subs.length > 0) {
      subs.forEach(sub => {
        const sp = catProds.filter(p => p.subCategory === sub);
        if (sp.length > 0) container.appendChild(buildHorizSection(cat.name + " \u00b7 " + sub, sp));
      });
      const noSub = catProds.filter(p => !p.subCategory || !subs.includes(p.subCategory));
      if (noSub.length > 0) container.appendChild(buildHorizSection(cat.name, noSub));
    } else {
      container.appendChild(buildHorizSection(cat.name, catProds));
    }
  });
}

function buildHorizSection(title, list) {
  const section = document.createElement("div");
  section.className = "horiz-section";
  const head = document.createElement("div");
  head.className = "horiz-section-head";
  head.innerHTML = `<span class="horiz-section-title">${title}</span><span class="horiz-section-count">${list.length} items</span>`;
  section.appendChild(head);
  const row = document.createElement("div");
  row.className = "horiz-row";

  list.forEach((p, i) => {
    const price   = finalPrice(p);
    const inStock = p.inStock !== false;
    const card = document.createElement("div");
    card.className = "horiz-card";
    card.style.animationDelay = (i * 0.04) + "s";
    card.innerHTML = `
      <div class="horiz-card-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        ${!inStock ? '<div class="horiz-card-oos">OUT OF STOCK</div>' : ''}
      </div>
      <div class="horiz-card-info">
        <div class="horiz-card-name">${p.name}</div>
        <div class="horiz-card-price">&#8377;${price}</div>
        <button class="horiz-card-add" ${!inStock ? 'disabled' : ''}>+ Cart</button>
      </div>`;

    card.querySelector(".horiz-card-img-wrap").onclick = () => openProductDetail(p);
    card.querySelector(".horiz-card-name").onclick     = () => openProductDetail(p);
    card.querySelector(".horiz-card-price").onclick    = () => openProductDetail(p);

    if (inStock) {
      card.querySelector(".horiz-card-add").onclick = (e) => {
        e.stopPropagation();
        addToCart(p);
        const btn = e.currentTarget;
        btn.textContent = "\u2713";
        setTimeout(() => { btn.textContent = "+ Cart"; }, 1000);
      };
    }
    row.appendChild(card);
  });
  section.appendChild(row);
  return section;
}

function syncDetailCartBadge() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  $("pdCartCount").textContent = count;
  $("pdCartCount").classList.toggle("hidden", count === 0);
}

/* ════════════════════════════════════
   CART
════════════════════════════════════ */
function addToCart(p) {
  const found = cart.find(i => i.product.id === p.id);
  if (found) found.qty += 1; else cart.push({ product: p, qty: 1 });
  save("knk_cart", cart);
  renderCartCount();
  syncDetailCartBadge();
  renderCart();
  $("cartBtn").style.color = "#C9A84C";
  setTimeout(() => { $("cartBtn").style.color = ""; }, 600);
}

function removeFromCart(id) {
  cart = cart.filter(i => i.product.id !== id);
  save("knk_cart", cart);
  renderCartCount();
  syncDetailCartBadge();
  renderCart();
}

function clearCart() {
  cart = [];
  save("knk_cart", cart);
  renderCartCount();
  syncDetailCartBadge();
  renderCart();
}

function renderCartCount() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  $("cartCount").textContent = count;
  $("cartCount").classList.toggle("hidden", count === 0);
}

function renderCart() {
  const body = $("cartItems"), foot = $("cartFooter");
  if (!cart.length) {
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
        <div class="ci-sub">&#8377;${finalPrice(i.product)} &times; ${i.qty}</div>
      </div>
      <button class="trash">&#128465;&#65039;</button>`;
    el.querySelector(".trash").onclick = () => removeFromCart(i.product.id);
    body.appendChild(el);
  });
  $("cartTotal").textContent = "\u20b9" + cart.reduce((s, i) => s + finalPrice(i.product) * i.qty, 0);
  foot.classList.remove("hidden");
}

$("cartBtn").onclick     = () => { renderCart(); $("cartOverlay").classList.remove("hidden"); };
$("cartClose").onclick   = () => $("cartOverlay").classList.add("hidden");
$("cartOverlay").onclick = e => { if (e.target === $("cartOverlay")) $("cartOverlay").classList.add("hidden"); };
$("clearCartBtn").onclick = clearCart;

$("checkoutBtn").onclick = () => {
  if (!cart.length) return;
  $("cartOverlay").classList.add("hidden");
  openCheckout(null);
};

/* ════════════════════════════════════
   CHECKOUT MODULE
════════════════════════════════════ */
function openCheckout(product) {
  checkoutProduct = product || null;

  // Reset OTP state
  $("otpSection").classList.add("hidden");
  $("mobileVerified").classList.add("hidden");
  $("verifyOtpBtn").disabled = false;
  $("verifyOtpBtn").textContent = "Verify";
  $("otpInput").value = "";

  loadSavedFormData();
  renderOrderSummary();

  $("checkoutOverlay").classList.remove("hidden");
  setTimeout(() => {
    const box = $("checkoutOverlay").querySelector(".checkout-box");
    if (box) box.scrollTop = 0;
  }, 50);
}

function loadSavedFormData() {
  const saved = load("knk_checkout_form", {});
  $("ckFullName").value = saved.fullName  || "";
  $("ckMobile").value   = saved.mobile    || "";
  $("ckState").value    = saved.state     || "";
  $("ckDistrict").value = saved.district  || "";
  $("ckCity").value     = saved.city      || "";
  $("ckLandmark").value = saved.landmark  || "";
}

function saveFormData() {
  save("knk_checkout_form", {
    fullName : $("ckFullName").value.trim(),
    mobile   : $("ckMobile").value.trim(),
    state    : $("ckState").value.trim(),
    district : $("ckDistrict").value.trim(),
    city     : $("ckCity").value.trim(),
    landmark : $("ckLandmark").value.trim(),
  });
}

// Auto-save on every keystroke
["ckFullName","ckMobile","ckState","ckDistrict","ckCity","ckLandmark"].forEach(id => {
  $(id).addEventListener("input", saveFormData);
});

function renderOrderSummary() {
  let items, originalTotal, discountedTotal;

  if (checkoutProduct) {
    // Single product Buy Now
    const p = checkoutProduct;
    items = [{ product: p, qty: 1 }];
    originalTotal   = p.price;
    discountedTotal = finalPrice(p);
  } else {
    // Cart checkout
    items = cart;
    originalTotal   = cart.reduce((s, i) => s + (i.product.price * i.qty), 0);
    discountedTotal = cart.reduce((s, i) => s + finalPrice(i.product) * i.qty, 0);
  }

  const discountApplied = originalTotal - discountedTotal;
  const deliveryCharge  = discountedTotal >= 500 ? 0 : 50;
  const finalTotal      = discountedTotal + deliveryCharge;

  // Render items list
  const itemsEl = $("checkoutItems");
  itemsEl.innerHTML = "";
  items.forEach(i => {
    const el = document.createElement("div");
    el.className = "ck-item";
    el.innerHTML = `
      <img src="${i.product.image}" alt="${i.product.name}" />
      <div class="ck-item-info">
        <div class="ck-item-name">${i.product.name}</div>
        <div class="ck-item-price">&#8377;${finalPrice(i.product)} &times; ${i.qty}</div>
      </div>
      <div class="ck-item-total">&#8377;${finalPrice(i.product) * i.qty}</div>`;
    itemsEl.appendChild(el);
  });

  // Summary numbers
  $("sumOriginal").textContent      = "\u20b9" + originalTotal;
  $("sumDiscount").textContent      = discountApplied > 0 ? "\u2212\u20b9" + discountApplied : "\u2212\u20b90";
  $("sumAfterDiscount").textContent = "\u20b9" + discountedTotal;

  if (deliveryCharge === 0) {
    $("sumDelivery").textContent = "FREE";
    $("sumDelivery").className   = "sum-free";
  } else {
    $("sumDelivery").textContent = "+\u20b9" + deliveryCharge;
    $("sumDelivery").className   = "sum-muted";
  }

  $("sumFinal").textContent    = "\u20b9" + finalTotal;
  $("sumFinal").dataset.amount = finalTotal;
}

// Verify OTP button
$("verifyOtpBtn").onclick = () => {
  const mobile = $("ckMobile").value.trim();
  if (!/^\d{10}$/.test(mobile)) {
    alert("Valid 10-digit mobile number daalein!");
    $("ckMobile").focus();
    return;
  }
  $("otpSection").classList.remove("hidden");
  $("verifyOtpBtn").textContent = "Resend OTP";
  $("otpInput").focus();
};

// Confirm OTP button
$("confirmOtpBtn").onclick = () => {
  const otp = $("otpInput").value.trim();
  if (otp.length < 4) { alert("OTP enter karein!"); $("otpInput").focus(); return; }
  $("otpSection").classList.add("hidden");
  $("mobileVerified").classList.remove("hidden");
  $("verifyOtpBtn").disabled    = true;
  $("verifyOtpBtn").textContent = "Verified ✓";
};

// Close checkout
$("checkoutClose").onclick   = () => $("checkoutOverlay").classList.add("hidden");
$("checkoutOverlay").onclick = e => {
  if (e.target === $("checkoutOverlay")) $("checkoutOverlay").classList.add("hidden");
};

/* ── PAY NOW — UPI Deep Link ── */
$("payNowBtn").onclick = () => {
  const fullName = $("ckFullName").value.trim();
  const mobile   = $("ckMobile").value.trim();
  const state    = $("ckState").value.trim();
  const district = $("ckDistrict").value.trim();

  if (!fullName)                 { alert("Apna pura naam daalein!"); $("ckFullName").focus(); return; }
  if (!/^\d{10}$/.test(mobile)) { alert("Valid 10-digit mobile number daalein!"); $("ckMobile").focus(); return; }
  if (!state)                    { alert("State daalein!"); $("ckState").focus(); return; }
  if (!district)                 { alert("District daalein!"); $("ckDistrict").focus(); return; }

  saveFormData();

  const amount = $("sumFinal").dataset.amount || $("sumFinal").textContent.replace(/[^\d]/g, "");

  // UPI Deep Link
  const upiLink = [
    "upi://pay",
    "?pa="  + encodeURIComponent(UPI_ID),
    "&pn="  + encodeURIComponent(UPI_NAME),
    "&am="  + amount,
    "&tn="  + encodeURIComponent("K_K Fashion Order - " + fullName),
    "&cu=INR"
  ].join("");

  window.location.href = upiLink;

  // Desktop fallback after 2.5s
  setTimeout(() => {
    if (document.visibilityState !== "hidden") {
      if (confirm(
        "UPI app nahi khula?\n\nManually pay karein:\nUPI ID: " + UPI_ID +
        "\nAmount: \u20b9" + amount +
        "\n\nOK dabao toh order confirm ho jayega."
      )) {
        alert("Shukriya! \u20b9" + amount + " UPI ID " + UPI_ID + " par bhejein.\nOrder confirm hone par contact karein.");
        $("checkoutOverlay").classList.add("hidden");
        if (!checkoutProduct) clearCart();
      }
    }
  }, 2500);
};

/* ════════════════════════════════════
   ADMIN PIN
════════════════════════════════════ */
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
  setTimeout(() => $("pinInput").focus(), 100);
}

$("pinClose").onclick   = () => $("adminPin").classList.add("hidden");
$("pinUnlock").onclick  = tryUnlock;
$("pinInput").onkeydown = e => { if (e.key === "Enter") tryUnlock(); };

function tryUnlock() {
  if ($("pinInput").value === ADMIN_PIN) {
    $("adminPin").classList.add("hidden"); openAdmin();
  } else {
    $("pinError").classList.remove("hidden");
    $("pinInput").style.borderColor = "#e05555";
    setTimeout(() => { $("pinInput").style.borderColor = ""; }, 800);
  }
}

/* ════════════════════════════════════
   ADMIN PANEL
════════════════════════════════════ */
function openAdmin() { renderAdmin(); $("adminPanel").classList.remove("hidden"); }
$("adminClose").onclick = () => $("adminPanel").classList.add("hidden");

function saveCategories() {
  if (window.saveCategoriesToFirebase) window.saveCategoriesToFirebase(mainCategories);
}

function renderCatMgmt() {
  const list = $("catMgmtList");
  list.innerHTML = "";
  mainCategories.forEach(cat => {
    const card = document.createElement("div");
    card.className = "cat-mgmt-card";
    card.innerHTML = `
      <div class="cat-mgmt-head">
        <span class="cat-mgmt-name">${cat.name}</span>
        <div class="cat-mgmt-actions">
          <button class="cat-action-btn edit-cat-btn">&#9999; Edit</button>
          <button class="cat-action-btn del del-cat-btn">&#128465; Delete</button>
        </div>
      </div>
      <div class="cat-sub-section">
        <div class="cat-sub-label">SUB-CATEGORIES</div>
        <div class="chips" id="subChips_${cat.id}"></div>
        <div class="inline-row">
          <input class="field" id="subInp_${cat.id}" placeholder="Sub-category naam" style="margin-bottom:0" />
          <button class="sm-btn add-sub-btn" data-id="${cat.id}">+ Add</button>
        </div>
      </div>`;

    const chipsEl = card.querySelector(`#subChips_${cat.id}`);
    (cat.subCategories || []).forEach(sub => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.innerHTML = `${sub}
        <button class="chip-btn edt">&#9999;</button>
        <button class="chip-btn del">&#10005;</button>`;
      chip.querySelector(".edt").onclick = () => {
        const n = prompt(`"${sub}" ka naya naam:`, sub);
        if (!n || !n.trim()) return;
        const idx = cat.subCategories.indexOf(sub);
        if (idx > -1) cat.subCategories[idx] = n.trim().toUpperCase();
        saveCategories(); renderAdmin();
        if (activeMainCatId === cat.id) { activeSubCat = "All"; renderSubCats(); renderProducts(); }
      };
      chip.querySelector(".del").onclick = () => {
        if (!confirm(`"${sub}" delete karein?`)) return;
        cat.subCategories = cat.subCategories.filter(x => x !== sub);
        saveCategories(); renderAdmin();
        if (activeMainCatId === cat.id) { activeSubCat = "All"; renderSubCats(); renderProducts(); }
      };
      chipsEl.appendChild(chip);
    });

    card.querySelector(".add-sub-btn").onclick = () => {
      const inp = card.querySelector(`#subInp_${cat.id}`);
      const v = inp.value.trim().toUpperCase();
      if (!v) return;
      if ((cat.subCategories || []).some(x => x.toUpperCase() === v)) { alert("Pehle se exist karti hai!"); return; }
      cat.subCategories = [...(cat.subCategories || []), v];
      saveCategories(); inp.value = "";
      renderAdmin();
      if (activeMainCatId === cat.id) renderSubCats();
    };
    card.querySelector(".edit-cat-btn").onclick = () => {
      const n = prompt(`"${cat.name}" ka naya naam:`, cat.name);
      if (!n || !n.trim()) return;
      cat.name = n.trim().toUpperCase();
      saveCategories(); renderAdmin(); renderMainCats();
    };
    card.querySelector(".del-cat-btn").onclick = () => {
      if (!confirm(`"${cat.name}" category delete karein?`)) return;
      mainCategories = mainCategories.filter(c => c.id !== cat.id);
      if (activeMainCatId === cat.id) {
        activeMainCatId = mainCategories.length > 0 ? mainCategories[0].id : null;
        activeSubCat = "All";
      }
      saveCategories(); renderAdmin(); renderMainCats(); renderSubCats(); renderProducts();
    };
    list.appendChild(card);
  });
}

$("addCatBtn").onclick = () => {
  const inp = $("newCatName");
  const v = inp.value.trim().toUpperCase();
  if (!v) return;
  if (mainCategories.some(c => c.name.toUpperCase() === v)) { alert("Pehle se exist karti hai!"); return; }
  mainCategories.push({ id: genId(), name: v, subCategories: [] });
  saveCategories(); inp.value = "";
  renderAdmin(); renderMainCats();
};

function syncAddProductDropdowns() {
  const pMainCat = $("pMainCat");
  pMainCat.innerHTML = "";
  mainCategories.forEach(cat => {
    const o = document.createElement("option");
    o.value = cat.id; o.textContent = cat.name;
    pMainCat.appendChild(o);
  });
  onMainCatChange();
}

window.onMainCatChange = function() {
  const cat   = getCat($("pMainCat").value);
  const group = $("subCatGroup");
  const pSub  = $("pSubCat");
  if (!cat || !cat.subCategories || cat.subCategories.length === 0) { group.style.display = "none"; return; }
  group.style.display = "";
  pSub.innerHTML = "";
  cat.subCategories.forEach(s => {
    const o = document.createElement("option"); o.value = s; o.textContent = s; pSub.appendChild(o);
  });
};

$("pInStock").addEventListener("change", function() {
  const lbl = $("pStockLabel");
  lbl.textContent = this.checked ? "In Stock" : "Out of Stock";
  lbl.className   = "stock-label " + (this.checked ? "in" : "out");
});

function syncFilterDropdown() {
  const sel = $("adminFilterCat");
  sel.innerHTML = '<option value="ALL">All Categories</option>';
  mainCategories.forEach(cat => {
    const o = document.createElement("option"); o.value = cat.id; o.textContent = cat.name; sel.appendChild(o);
  });
}

function renderAdminProducts() {
  $("adminProdTitle").textContent = `Products (${products.length})`;
  const filterCat = $("adminFilterCat").value || "ALL";
  const list = $("adminProducts");
  list.innerHTML = "";
  const filtered = filterCat === "ALL" ? products : products.filter(p => p.mainCategoryId === filterCat);
  filtered.forEach(p => {
    const price    = finalPrice(p);
    const inStock  = p.inStock !== false;
    const cat      = getCat(p.mainCategoryId);
    const catName  = cat ? cat.name : "\u2014";
    const subLabel = p.subCategory ? ` \u00b7 ${p.subCategory}` : "";
    const el = document.createElement("div");
    el.className = "admin-prod";
    el.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <div class="ap-info">
        <div class="ap-name">${p.name}</div>
        <div class="ap-sub">${catName}${subLabel}</div>
        <div class="ap-price">&#8377;${price} ${p.discount > 0 ? `(${p.discount}% off)` : ''} &middot; <span style="color:${inStock ? '#4cc968' : '#e05555'}">${inStock ? 'In Stock' : 'Out of Stock'}</span></div>
      </div>
      <div class="ap-actions">
        <button class="edit-btn">&#9999;</button>
        <button class="trash">&#128465;</button>
      </div>`;
    el.querySelector(".edit-btn").onclick = () => openEditModal(p);
    el.querySelector(".trash").onclick    = () => {
      if (!confirm("Delete karein?")) return;
      products = products.filter(x => x.id !== p.id);
      renderProducts(); renderAdmin();
      if (window.deleteProductFromFirebase) window.deleteProductFromFirebase(p.id);
    };
    list.appendChild(el);
  });
}

window.renderAdmin = function() {
  renderCatMgmt();
  syncAddProductDropdowns();
  syncFilterDropdown();
  renderAdminProducts();
};

// Add New Product
$("addProductBtn").onclick = () => {
  const mainCatId = $("pMainCat").value;
  const name      = $("pName").value.trim();
  const image     = $("pImage").value.trim();
  const price     = Number($("pPrice").value);
  const discount  = Number($("pDiscount").value) || 0;
  const extra     = Number($("pExtra").value)    || 0;
  const inStock   = $("pInStock").checked;
  const subCat    = $("subCatGroup").style.display !== "none" ? $("pSubCat").value : "";

  if (!name)               { alert("Product naam daalein!"); $("pName").focus(); return; }
  if (!image)              { alert("Image URL daalein!"); $("pImage").focus(); return; }
  if (!price || price <= 0){ alert("Valid price daalein!"); $("pPrice").focus(); return; }

  const product = { id: genId(), name, image, price, discount, extra, inStock, mainCategoryId: mainCatId, subCategory: subCat };

  if (window.saveProductToFirebase) window.saveProductToFirebase(product);

  $("pName").value = ""; $("pImage").value = "";
  $("pPrice").value = ""; $("pDiscount").value = ""; $("pExtra").value = "";
  $("pInStock").checked = true;
  $("pStockLabel").textContent = "In Stock";
  $("pStockLabel").className   = "stock-label in";
  alert("Product add ho gaya! \u2705");
};

/* ════════════════════════════════════
   EDIT PRODUCT MODAL
════════════════════════════════════ */
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
    products[idx] = { ...products[idx], price: newPrice, discount: newDiscount, extra: newExtra, inStock: newInStock };
    renderProducts(); renderAdmin();
  }
  if (window.updateProductInFirebase) {
    window.updateProductInFirebase(editingProductId, { price: newPrice, discount: newDiscount, extra: newExtra, inStock: newInStock });
  }
  $("editModal").classList.add("hidden");
  editingProductId = null;
};
