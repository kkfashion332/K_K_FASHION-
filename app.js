/* ═══════════════════════════════════════════════════════
   UNIQUE FASHION — CUSTOMER ONLY JS (100% SECURE)
═══════════════════════════════════════════════════════ */

const TELEGRAM_BOT_TOKEN = "8940208467:AAHP26sJGndZ28k8u-osJcSs2PGvLEuP91o"; 
const TELEGRAM_CHAT_ID = "7503426190";

const load = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; } };
const save = (k, v) => { localStorage.setItem(k, JSON.stringify(v)); };
const $ = (id) => { return document.getElementById(id); };
const delay = (ms) => new Promise(r => setTimeout(r, ms));
const addClass = (id, cls) => { const el = $(id); if(el) el.classList.add(cls); };
const removeClass = (id, cls) => { const el = $(id); if(el) el.classList.remove(cls); };

let mainCategories = [];
let products = [];
let shops = [];
let homeBanners = [];
let adminWaNumber = "8976073065"; 
let adminUpiId = "ufstore@nyes"; 
let adminQrCodeUrl = "62673.png";

let likes = load("knk_likes", []); 
let searchHistory = load("uf_search_history", []); 
let currentCheckoutItem = null;    

let activeMainCatId = null;
let activeShopId = null;
let searchQuery = "";
let currentDetailProduct = null;
let currentSelectedSize = null; 
let isAppInitialized = false;
let bannerScrollInterval = null;

let currentTheme = load("knk_app_theme", "dark");
window.setAppTheme = function(t) {
    document.body.className = document.body.className.replace(/theme-\w+/g, '').trim();
    document.body.classList.remove('light-theme'); 
    if(t !== 'dark') document.body.classList.add('theme-' + t);
    currentTheme = t;
    save("knk_app_theme", t);
}
setAppTheme(currentTheme);

const finalPrice = (p) => { return Math.round(p.price - (p.price * (p.discount || 0)) / 100 + (p.extra || 0)); };
const getCat = (id) => { return mainCategories.find((c) => c.id === id); };

const lockScroll = () => { document.body.classList.add("no-scroll"); };
const unlockScroll = () => { document.body.classList.remove("no-scroll"); };
const allowZoom = () => { document.querySelector('meta[name="viewport"]').setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=5.0"); };
const preventZoom = () => { document.querySelector('meta[name="viewport"]').setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"); };

function pushModalState() { history.pushState({ modal: true }, "", window.location.href); }

// BACK BUTTON LOGIC
window.addEventListener('popstate', (e) => {
  if ($("imageViewer") && !$("imageViewer").classList.contains("hidden")) {
    $("imageViewer").classList.add("hidden"); preventZoom();
  } else if ($("checkoutOverlay") && !$("checkoutOverlay").classList.contains("hidden")) {
    $("checkoutOverlay").classList.add("hidden"); unlockScroll(); 
  } else if ($("prodDetail") && !$("prodDetail").classList.contains("hidden")) {
    closeProductDetail();
  } else if ($("myOrderDetailModal") && !$("myOrderDetailModal").classList.contains("hidden")) {
    $("myOrderDetailModal").classList.add("hidden"); unlockScroll();
  }
});

// Update data from Firebase
window.updateBannersFromFirebase = function (fetchedBanners) { homeBanners = fetchedBanners || []; renderHomeBanners(); }
window.updateShopsFromFirebase = function (fetchedShops) { shops = fetchedShops || []; };
window.updateCategoriesFromFirebase = function (cats) { 
    mainCategories = cats || []; 
    renderCategoryBubbles(); 
    renderSearchCategories();
    renderHomeProducts(); 
};
window.updateProductsFromFirebase = function (fbProducts) { products = fbProducts; renderHomeProducts(); };
window.updateWaNumberFromFirebase = function (waNum) { adminWaNumber = waNum || "8976073065"; };
window.updateAdminPaymentDetails = function(upi, qr) {
    if(upi) adminUpiId = upi;
    if(qr) adminQrCodeUrl = qr;
};

window.addEventListener("DOMContentLoaded", () => {
  if (!isAppInitialized) { showSplashAndStart(); isAppInitialized = true; }
});

async function showSplashAndStart() {
  const splash = $("splash"); 
  if(!splash) return;
  splash.classList.remove("hidden");
  splash.style.opacity = "1";

  const box = $("particles");
  if (box && box.children.length === 0) {
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('div'); p.className = 'particle';
      const sz = (2 + Math.random() * 3).toFixed(1) + 'px';
      p.style.cssText = ['left:'+(Math.random()*100).toFixed(1)+'%','bottom:'+(Math.random()*8).toFixed(1)+'%','width:'+sz,'height:'+sz,'animation-duration:'+(2+Math.random()*3).toFixed(2)+'s','animation-delay:'+(Math.random()*3).toFixed(2)+'s'].join(';');
      box.appendChild(p);
    }
  }

  const audio = $("bg-audio"); if (audio) audio.play().catch(() => {});

  await delay(100); addClass('coin-scene', 'appear');
  await delay(200); addClass('coin-scene', 'spinning');
  await delay(800); removeClass('coin-scene', 'spinning'); addClass('coin-scene', 'stopping');
  await delay(300); addClass('flash', 'pop'); addClass('s1', 'fire'); addClass('s2', 'fire'); addClass('s3', 'fire');
  await delay(60); addClass('wave1', 'blast'); addClass('wave2', 'blast'); addClass('logo-glow', 'on');
  await delay(200); removeClass('coin-scene', 'stopping');
  await delay(300); addClass('coin-scene', 'move-up');
  await delay(150); addClass('welcome', 'show'); addClass('welcome-line', 'show');
  await delay(1000); addClass('welcome', 'hide'); removeClass('welcome-line', 'show');
  await delay(400); removeClass('welcome', 'show');
  if($('welcome')) $('welcome').style.display = 'none'; if($('welcome-line')) $('welcome-line').style.display = 'none';
  await delay(100); addClass('shield-glow', 'show'); addClass('trusted', 'show');
  await delay(1000); addClass('outro-overlay', 'show'); addClass('trusted', 'hide'); removeClass('shield-glow', 'show');
  await delay(600); addClass('outro-overlay', 'fadeout');
  await delay(400);

  splash.style.transition = "opacity 0.4s ease"; 
  splash.style.opacity = "0";
  setTimeout(() => { splash.classList.add("hidden"); $("app").classList.remove("hidden"); renderLikesCount(); initBannerAutoScroll(); }, 400);
}

window.switchNav = function (tab) {
  document.querySelectorAll('.nav-item, .nav-fab-wrap').forEach((el) => { el.classList.remove('active'); });
  
  if (tab === 'Search') {
      if ($("navSearchWrap")) $("navSearchWrap").classList.add("active"); 
  } else {
      if ($("nav" + tab)) $("nav" + tab).classList.add("active");
  }

  ["homeContent", "searchPage", "newPage", "orderPage", "likesPage"].forEach(id => {
      if($(id)) $(id).classList.add("hidden");
  });

  if (tab === 'Home') { $("homeContent").classList.remove("hidden"); initBannerAutoScroll(); renderCategoryBubbles(); renderHomeProducts(); }
  if (tab === 'Search') { 
      $("searchPage").classList.remove("hidden"); 
      renderSearchHistory(); 
      $("searchResults").innerHTML = ""; 
      $("searchInput").value = ""; 
      $("searchClear").classList.add("hidden"); 
      setTimeout(() => $("searchInput").focus(), 100); 
  }
  if (tab === 'New') { $("newPage").classList.remove("hidden"); renderNewCollection(); }
  if (tab === 'Order') { $("orderPage").classList.remove("hidden"); window.renderMyOrders(); }
  if (tab === 'Likes') { $("likesPage").classList.remove("hidden"); renderLikesPageTab(); }
  
  window.scrollTo(0, 0);
};

window.clearShopFilterAndGoHome = function() {
    activeShopId = null; activeMainCatId = null; searchQuery = "";
    if($("searchInput")) $("searchInput").value = "";
    switchNav('Home'); 
}

if ($("logoBtn")) {
  $("logoBtn").onclick = () => { clearShopFilterAndGoHome(); };
}

function renderHomeBanners() {
    const wrap = $("homeBannersWrap"); const slider = $("homeBannersSlider");
    if(!wrap || !slider) return;
    if (homeBanners.length === 0) { wrap.classList.add("hidden"); return; }
    
    wrap.classList.remove("hidden"); slider.innerHTML = "";
    homeBanners.forEach(b => {
        const div = document.createElement("div"); div.className = "banner-slide";
        div.innerHTML = `<img src="${b.image}" alt="Banner" loading="lazy" />`;
        if (b.link) div.onclick = () => window.open(b.link, '_blank');
        slider.appendChild(div);
    });
    initBannerAutoScroll();
}

function initBannerAutoScroll() {
    clearInterval(bannerScrollInterval); const slider = $("homeBannersSlider");
    if(!slider || homeBanners.length <= 1) return;
    bannerScrollInterval = setInterval(() => {
        const scrollAmt = slider.offsetWidth;
        if (slider.scrollLeft + scrollAmt >= slider.scrollWidth - 10) { slider.scrollTo({ left: 0, behavior: 'smooth' }); } 
        else { slider.scrollBy({ left: scrollAmt, behavior: 'smooth' }); }
    }, 3000);
}

// 🌟 DYNAMIC CATEGORY BUBBLES 🌟
function renderCategoryBubbles() {
    const wrap = $("imageCategoryWrap");
    if(!wrap) return;
    wrap.innerHTML = "";
    if(mainCategories.length === 0) { wrap.classList.add("hidden"); return; }
    wrap.classList.remove("hidden");
    
    mainCategories.forEach(cat => {
        const catImg = cat.image || "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=150&q=80";
        const box = document.createElement("div");
        box.className = "img-cat-box" + (cat.id === activeMainCatId ? " active" : "");
        box.onclick = () => { selectMainCat(cat.id); };
        box.innerHTML = `<img src="${catImg}" alt="${cat.name}"><span>${cat.name}</span>`;
        wrap.appendChild(box);
    });
}

function renderSearchCategories() {
    const wrap = $("searchCategoriesWrap");
    if(!wrap) return;
    wrap.innerHTML = "";
    if(mainCategories.length === 0) { wrap.style.display = "none"; return; }
    wrap.style.display = "flex";
    
    mainCategories.forEach(cat => {
        const catImg = cat.image || "https://via.placeholder.com/150";
        const box = document.createElement("div");
        box.className = "search-cat-item";
        box.onclick = () => {
            $("searchInput").value = cat.name;
            $("searchClear").classList.remove("hidden");
            performSearch(cat.name, true);
        };
        box.innerHTML = `<img src="${catImg}" class="search-cat-img" alt="${cat.name}"><span class="search-cat-name">${cat.name}</span>`;
        wrap.appendChild(box);
    });
}

window.selectMainCat = function (id) {
    if (activeMainCatId === id) activeMainCatId = null; 
    else activeMainCatId = id; 
    renderCategoryBubbles(); 
    renderHomeProducts();
};

function shuffleArray(array) {
    let curId = array.length;
    while (0 !== curId) {
        let randId = Math.floor(Math.random() * curId);
        curId -= 1;
        let tmp = array[curId];
        array[curId] = array[randId];
        array[randId] = tmp;
    }
    return array;
}

// 🌟 RECENTLY UPLOADED / CATEGORY PRODUCTS 🌟
function renderHomeProducts() {
    const grid = document.querySelector("#homeContent .grid");
    if(!grid) return;
    grid.innerHTML = "";
    
    let list = [...products];
    
    if (activeMainCatId) {
        list = list.filter(p => p.mainCategoryId === activeMainCatId);
        const cat = getCat(activeMainCatId);
        document.querySelector("#homeContent .section-title").textContent = cat ? cat.name.toUpperCase() : "COLLECTIONS";
    } else {
        list = shuffleArray(list);
        document.querySelector("#homeContent .section-title").textContent = "RECOMMENDED";
    }
    
    if(list.length === 0) { grid.innerHTML = "<p class='empty' style='grid-column: 1/-1;'>No products found.</p>"; return; }
    
    list.forEach((p, i) => {
        grid.appendChild(createProductCard(p, i));
    });
}

// 🌟 PRODUCT CARD CREATOR 🌟
function createProductCard(p, i) {
    const price = finalPrice(p); 
    const inStock = p.inStock !== false; 
    const mainImg = (Array.isArray(p.image) && p.image.length > 0) ? p.image[0] : "placeholder.jpg";
    const isLiked = likes.some(l => l.id === p.id);
    const freeDel = p.freeDelivery !== false ? '<div style="color:#388e3c; font-size:10px; font-weight:800; letter-spacing:0.05em; margin-top:3px; text-transform:uppercase;">FREE Delivery</div>' : '';

    const el = document.createElement("div"); 
    el.className = "product"; 
    el.style.animationDelay = (i * 0.05) + "s";
    el.innerHTML = `
      <div style="position:relative;">
          <img src="${mainImg}" alt="${p.name}" loading="lazy" />
          <button class="like-btn-grid" onclick="event.stopPropagation(); toggleLike('${p.id}')" style="position:absolute; top:8px; right:8px; background:rgba(255,255,255,0.85); border:none; border-radius:50%; width:30px; height:30px; font-size:14px; box-shadow:0 2px 6px rgba(0,0,0,0.3); z-index:5; cursor:pointer;">${isLiked ? '❤️' : '🤍'}</button>
      </div>
      <div class="info">
        <div class="name">${p.name}</div>
        <div class="price-row"><span class="price">₹${price}</span>${p.discount > 0 ? `<span class="strike">₹${p.price}</span>` : ""}</div>
        ${freeDel}
        <span class="stock-badge ${inStock ? 'in' : 'out'}">${inStock ? '● In Stock' : '● Out of Stock'}</span>
        <div class="btn-row"><button class="btn-primary btn-buy-grid full" ${!inStock ? 'disabled' : ''} style="grid-column: 1 / -1;">💳 Buy Now</button></div>
      </div>`;
    el.querySelector("img").onclick = () => openProductDetail(p); 
    el.querySelector(".name").onclick = () => openProductDetail(p);
    if (inStock) { el.querySelector(".btn-buy-grid").onclick = (e) => { e.stopPropagation(); openProductDetail(p); }; }
    return el;
}

// 🌟 PREMIUM SEARCH LOGIC WITH HISTORY 🌟
let searchDebounce = null;
if($("searchInput")) {
  $("searchInput").addEventListener("input", function () {
    const v = this.value.trim(); 
    $("searchClear").classList.toggle("hidden", !v);
    
    if(!v) {
        $("searchHistoryWrap").classList.remove("hidden");
        $("searchCategoriesWrap").style.display = "flex";
        $("searchResults").innerHTML = "";
        return;
    }
    
    $("searchHistoryWrap").classList.add("hidden");
    $("searchCategoriesWrap").style.display = "none";
    
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => { performSearch(v, false); }, 300);
  });
  
  $("searchInput").addEventListener("keypress", function (e) {
      if(e.key === 'Enter') {
          const v = this.value.trim();
          if(v) {
              $("searchInput").blur();
              performSearch(v, true);
          }
      }
  });
}

if($("searchClear")) {
  $("searchClear").addEventListener("click", () => {
    $("searchInput").value = ""; 
    $("searchClear").classList.add("hidden"); 
    $("searchHistoryWrap").classList.remove("hidden");
    $("searchCategoriesWrap").style.display = "flex";
    $("searchResults").innerHTML = "";
    $("searchInput").focus();
  });
}

if($("clearHistoryBtn")) {
    $("clearHistoryBtn").onclick = () => {
        searchHistory = [];
        save("uf_search_history", searchHistory);
        renderSearchHistory();
    };
}

function renderSearchHistory() {
    const list = $("searchHistoryList");
    if(!list) return;
    list.innerHTML = "";
    
    let validHistory = searchHistory.filter(h => h.trim() !== "");
    
    if(validHistory.length === 0) {
        list.innerHTML = "<span style='color:var(--muted); font-size:12px;'>No recent searches</span>";
        return;
    }
    validHistory.forEach(h => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `🕒 ${h}`;
        item.onclick = () => {
            $("searchInput").value = h;
            $("searchClear").classList.remove("hidden");
            performSearch(h, false);
        };
        list.appendChild(item);
    });
}

function performSearch(query, saveHistory = true) {
    if(!query.trim()) return;
    
    if(saveHistory) {
        searchHistory = searchHistory.filter(h => h.toLowerCase() !== query.toLowerCase());
        searchHistory.unshift(query);
        if(searchHistory.length > 10) searchHistory.pop();
        save("uf_search_history", searchHistory);
        renderSearchHistory();
    }
    
    $("searchHistoryWrap").classList.add("hidden");
    $("searchCategoriesWrap").style.display = "none";
    const grid = $("searchResults");
    
    let list = products.filter(p => {
        const cat = getCat(p.mainCategoryId); 
        const haystack = [p.name || "", cat ? cat.name : "", p.source || ""].join(" ").toLowerCase();
        return query.toLowerCase().split(/\s+/).filter(Boolean).every((w) => haystack.includes(w));
    });
    
    if(list.length === 0) {
        grid.innerHTML = "<p class='empty' style='grid-column: 1/-1;'>Koi product nahi mila.</p>";
        return;
    }
    
    grid.innerHTML = "";
    list.forEach((p, i) => { grid.appendChild(createProductCard(p, i)); });
}

function renderNewCollection() {
    const list = $("newCollectionList"); if(!list) return; list.innerHTML = "";
    if(products.length === 0) { list.innerHTML = "<p class='empty'>No new collection yet.</p>"; return; }
    const sorted = [...products].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); 
    
    sorted.forEach(p => {
        const price = finalPrice(p); const inStock = p.inStock !== false;
        const mainImg = (Array.isArray(p.image) && p.image.length > 0) ? p.image[0] : "placeholder.jpg";
        const freeDel = p.freeDelivery !== false ? '<div style="color:#388e3c; font-size:12px; font-weight:800; letter-spacing:0.05em; margin-top:5px; text-transform:uppercase;">FREE Delivery</div>' : '';
        const isLiked = likes.some(l => l.id === p.id);

        const el = document.createElement("div"); el.style.cssText = "background: var(--card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; position: relative; animation: fadeUp 0.4s ease both;";
        el.innerHTML = `
          <div style="position:relative;">
            <img src="${mainImg}" style="width: 100%; height: 380px; object-fit: cover; display: block; background: var(--card2);" />
            <button onclick="event.stopPropagation(); toggleLike('${p.id}')" style="position:absolute; top:12px; right:12px; background:rgba(255,255,255,0.9); border:none; border-radius:50%; width:40px; height:40px; font-size:20px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.3); z-index: 5; cursor:pointer;">${isLiked ? '❤️' : '🤍'}</button>
            <span class="stock-badge ${inStock ? 'in' : 'out'}" style="position:absolute; bottom:12px; left:12px; font-size:12px; padding: 4px 12px;">${inStock ? '● In Stock' : '● Out of Stock'}</span>
          </div>
          <div style="padding: 16px;">
             <h3 style="font-size:17px; color:var(--fg); margin-bottom:8px; font-family:var(--font-body); font-weight:600;">${p.name}</h3>
             <div style="display:flex; align-items:baseline; gap:8px;"><span style="font-size:22px; font-weight:700; color:var(--primary);">₹${price}</span>${p.discount > 0 ? `<span style="font-size:15px; text-decoration:line-through; color:var(--muted);">₹${p.price}</span>` : ''}</div>
             ${freeDel}
             <button class="btn-primary full" style="margin-top:14px; padding:12px; font-size:15px;" ${!inStock ? 'disabled' : ''}>💳 Buy Now</button>
          </div>`;
        el.onclick = () => openProductDetail(p);
        if(inStock) el.querySelector(".btn-primary").onclick = (e) => { e.stopPropagation(); openProductDetail(p); };
        list.appendChild(el);
    });
}

window.openProductDetailById = function(id) {
    const p = products.find(x => x.id === id);
    if(p) { if (!$("prodDetail").classList.contains("hidden")) { closeProductDetail(); setTimeout(() => openProductDetail(p), 300); } else { openProductDetail(p); } }
}

function updateDetailLikeBtn() {
    if(!currentDetailProduct) return;
    const isLiked = likes.some(l => l.id === currentDetailProduct.id);
    const btn = $("pdLikeBtn");
    if(btn) btn.innerHTML = isLiked ? '❤️' : '🤍';
}

window.toggleLikeFromDetail = function() {
    if(!currentDetailProduct) return;
    toggleLike(currentDetailProduct.id);
    updateDetailLikeBtn();
}

function openProductDetail(p) {
  pushModalState();
  lockScroll(); 
  currentDetailProduct = p; 
  currentSelectedSize = null; 
  
  updateDetailLikeBtn(); 

  const price = finalPrice(p); const inStock = p.inStock !== false; const cat = getCat(p.mainCategoryId);
  const slider = $("pdImageSlider"); const dotsWrap = $("pdImageDots");
  slider.innerHTML = ""; dotsWrap.innerHTML = "";
  let images = Array.isArray(p.image) ? p.image : [p.image]; if (images.length === 0) images = ["placeholder.jpg"];

  images.forEach((imgUrl, i) => {
    const imgEl = document.createElement("img"); imgEl.src = imgUrl;
    imgEl.onclick = () => { pushModalState(); $("fullImage").src = imgUrl; $("imageViewer").classList.remove("hidden"); allowZoom(); };
    slider.appendChild(imgEl);
    if (images.length > 1) { const dot = document.createElement("div"); dot.className = "dot" + (i === 0 ? " active" : ""); dotsWrap.appendChild(dot); }
  });

  if (images.length > 1) { slider.onscroll = () => { const idx = Math.round(slider.scrollLeft / slider.offsetWidth); Array.from(dotsWrap.children).forEach((dot, i) => { dot.className = "dot" + (i === idx ? " active" : ""); }); }; }

  const badge = $("pdStockBadge"); badge.textContent = inStock ? "● In Stock" : "● Out of Stock"; badge.className = "stock-badge pd-img-stock " + (inStock ? "in" : "out");
  $("pdBreadcrumb").textContent = (cat ? cat.name : ""); $("pdName").textContent = p.name; $("pdPrice").textContent = "₹" + price;

  const freeDelObj = p.freeDelivery !== false ? '<div style="color:#388e3c; font-size:12px; font-weight:800; letter-spacing:0.05em; margin-top:8px; text-transform:uppercase;">FREE Delivery</div>' : '';
  
  if (p.discount > 0) { $("pdStrike").textContent = "₹" + p.price; $("pdStrike").classList.remove("hidden"); $("pdOff").textContent = p.discount + "% off"; $("pdOff").classList.remove("hidden"); } 
  else { $("pdStrike").classList.add("hidden"); $("pdOff").classList.add("hidden"); }
  
  const existFreeDel = document.getElementById("pdFreeDelText"); if(existFreeDel) existFreeDel.remove();
  if(p.freeDelivery !== false) { const d = document.createElement('div'); d.id = "pdFreeDelText"; d.innerHTML = freeDelObj; $("pdName").parentNode.insertBefore(d, $("pdColorsWrap")); }

  const sizesIn = p.sizesIn ? p.sizesIn.split(',').map(s=>s.trim()).filter(Boolean) : [];
  const sizesOut = p.sizesOut ? p.sizesOut.split(',').map(s=>s.trim()).filter(Boolean) : [];

  if(sizesIn.length > 0 || sizesOut.length > 0) {
      let html = '<div class="field-label" style="margin-bottom:10px; margin-top:10px; font-size:13px; font-weight:600; color:var(--fg);">Select Size</div><div style="display:flex;gap:10px;flex-wrap:wrap;">';
      sizesIn.forEach(s => { html += `<button class="size-box in" data-size="${s}">${s}</button>`; });
      sizesOut.forEach(s => { html += `<button class="size-box out" disabled>${s}</button>`; });
      html += '</div>'; $("pdSizesWrap").innerHTML = html; $("pdSizesWrap").classList.remove("hidden");

      const btns = $("pdSizesWrap").querySelectorAll('.size-box.in');
      btns.forEach(b => {
          b.onclick = () => { btns.forEach(x => x.classList.remove('active')); b.classList.add('active'); currentSelectedSize = b.getAttribute('data-size'); }
      });
  } else { $("pdSizesWrap").classList.add("hidden"); currentSelectedSize = "Default"; }

  const buyBtn = $("pdBuyNow");
  if (inStock) {
    buyBtn.disabled = false;
    buyBtn.onclick = () => { 
        if(sizesIn.length > 0 && !currentSelectedSize) { 
            alert("Please select a size before buying!"); 
            $("pdSizesWrap").style.border = "2px dashed #C9A84C";
            $("pdSizesWrap").style.padding = "5px";
            $("pdSizesWrap").style.borderRadius = "8px";
            setTimeout(() => { $("pdSizesWrap").style.border = "none"; $("pdSizesWrap").style.padding = "0"; }, 2000);
            return; 
        }
        directBuyCheckout(p, currentSelectedSize); 
    };
  } else { buyBtn.disabled = true; }

  renderHorizSections(p); $("pdScroll").scrollTop = 0; $("prodDetail").classList.remove("hidden", "closing");
}

function closeProductDetail() {
  preventZoom(); const detail = $("prodDetail"); detail.classList.add("closing");
  detail.addEventListener("animationend", () => { detail.classList.add("hidden"); detail.classList.remove("closing"); currentDetailProduct = null; unlockScroll(); }, { once: true });
}

$("pdBackBtn").onclick = () => { history.back(); }; 

function renderHorizSections(currentProduct) {
  const container = $("pdHorizSections"); container.innerHTML = "";
  const vContainer = $("pdVerticalSections"); if(vContainer) vContainer.innerHTML = "";
  
  const sameMainList = products.filter((p) => {
      if (p.id === currentProduct.id) return false;
      if (p.mainCategoryId !== currentProduct.mainCategoryId) return false;
      return true;
  });
  
  if (sameMainList.length > 0) {
    container.appendChild(buildHorizSection("Similar Products", sameMainList));
    
    if(vContainer) {
       const vList = sameMainList.slice(0, 10);
       vList.forEach((p, i) => {
          const price = finalPrice(p); const inStock = p.inStock !== false; const mainImg = (Array.isArray(p.image) && p.image.length > 0) ? p.image[0] : "placeholder.jpg";
          const freeDel = p.freeDelivery !== false ? '<div style="color:#388e3c; font-size:10px; font-weight:800; text-transform:uppercase; margin-top:2px;">Free Delivery</div>' : '';
          const el = document.createElement("div"); el.className = "product";
          el.innerHTML = `
            <div><img src="${mainImg}" alt="${p.name}" loading="lazy" /></div>
            <div class="info"><div class="name">${p.name}</div><div class="price-row"><span class="price">₹${price}</span>${p.discount > 0 ? `<span class="strike">₹${p.price}</span>` : ""}</div>${freeDel}<span class="stock-badge ${inStock ? 'in' : 'out'}">${inStock ? '● In Stock' : '● Out of Stock'}</span></div>
          `;
          el.onclick = () => openProductDetail(p); vContainer.appendChild(el);
       });
    }
  }
}

function buildHorizSection(title, list) {
  const section = document.createElement("div"); section.className = "horiz-section";
  const head = document.createElement("div"); head.className = "horiz-section-head"; head.innerHTML = `<span class="horiz-section-title">${title}</span>`; section.appendChild(head);
  const row = document.createElement("div"); row.className = "horiz-row";
  list.forEach((p) => {
    const price = finalPrice(p); const mainImg = (Array.isArray(p.image) && p.image.length > 0) ? p.image[0] : "placeholder.jpg";
    const card = document.createElement("div"); card.className = "horiz-card";
    card.innerHTML = `<img src="${mainImg}" /><div><div class="horiz-card-name">${p.name}</div><div class="horiz-card-price">₹${price}</div></div>`;
    card.onclick = () => { closeProductDetail(); setTimeout(() => openProductDetail(p), 300); }; row.appendChild(card);
  });
  section.appendChild(row); return section;
}

// ----------------------------------------------------
// CHECKOUT & PAYMENTS (Prepaid Only)
// ----------------------------------------------------

if ($("copyUpiBtn")) {
  $("copyUpiBtn").onclick = function () {
    navigator.clipboard.writeText(adminUpiId).then(() => {
      this.innerHTML = `${adminUpiId} <span style="font-size:12px; background:#4cc968; color:#fff; padding:3px 8px; border-radius:4px;">✅ Copied!</span>`;
      setTimeout(() => { this.innerHTML = `${adminUpiId} <span style="font-size:12px; background:var(--primary); color:#000; padding:4px 8px; border-radius:4px;">📋 Copy</span>`; }, 2000);
    }).catch(err => alert("Copy nahi ho paya, manually type karein."));
  };
}

if ($("waScreenshotBtn")) {
    $("waScreenshotBtn").onclick = () => {
        let amountPaid = $("qrAmountDisplay").textContent;
        let pName = currentCheckoutItem ? currentCheckoutItem.product.name : "Products";
        let message = `Hello Unique Fashion! \nHere is my payment screenshot for the order of *${pName}*. \nAmount Paid: *${amountPaid}*`;
        let waUrl = `https://wa.me/91${adminWaNumber}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    };
}

function directBuyCheckout(p, size) { 
    preventZoom(); 
    const s = size || "Default"; 
    currentCheckoutItem = { product: p, qty: 1, size: s }; 
    $("prodDetail").classList.add("hidden"); 
    $("prodDetail").classList.remove("closing"); 
    currentDetailProduct = null; 
    pushModalState(); 
    openCheckout(); 
}

function resetCheckoutUI() {
  $("checkoutStep1").classList.remove("hidden"); $("checkoutStep2").classList.add("hidden"); if ($("checkoutStep3")) $("checkoutStep3").classList.add("hidden");
  $("checkoutFooter").classList.remove("hidden"); $("chkFooterTotalRow").classList.remove("hidden");
  $("step1NextBtn").classList.remove("hidden"); $("step2PayBtn").classList.add("hidden"); $("confirmOrderBtn").classList.add("hidden");
  if ($("paymentOptionsWrap")) $("paymentOptionsWrap").classList.remove("hidden");
  if ($("qrScanSection")) $("qrScanSection").classList.add("hidden");
  if (window.paymentInterval) clearInterval(window.paymentInterval);
  $("step1Indicator").className = "step-item active"; $("step1Circle").innerHTML = "1"; $("line1").className = "step-line";
  $("step2Indicator").className = "step-item"; $("step2Circle").innerHTML = "2"; $("line2").className = "step-line";
  $("step3Indicator").className = "step-item"; $("step3Circle").innerHTML = "3";
}

function openCheckout() {
  lockScroll(); resetCheckoutUI();
  if(!currentCheckoutItem) return;
  
  $("checkoutOverlay").classList.remove("hidden");
  
  $("chkQrImage").src = adminQrCodeUrl;
  $("copyUpiBtn").innerHTML = `${adminUpiId} <span style="font-size:12px; background:var(--primary); color:#000; padding:4px 8px; border-radius:4px;">📋 Copy</span>`;
}

$("closeCheckout").onclick = () => { history.back(); }; 

$("step1NextBtn").onclick = () => {
  const name = $("chkName").value.trim(); 
  const mobile = $("chkMobile").value.trim(); 
  const address = $("chkAddress").value.trim();
  
  if (!name || !mobile || !address) return alert("Kripya sabhi zaroori jankari bharein!");
  if (mobile.length < 10 || isNaN(mobile)) return alert("Mobile number galat hai!");
  
  $("checkoutStep1").classList.add("hidden"); $("checkoutStep2").classList.remove("hidden");
  $("step1NextBtn").classList.add("hidden"); $("step2PayBtn").classList.remove("hidden"); $("chkFooterTotalRow").classList.add("hidden");
  $("step1Indicator").classList.remove("active"); $("step1Indicator").classList.add("completed"); $("step1Circle").innerHTML = "✔";
  $("line1").classList.add("completed"); $("step2Indicator").classList.add("active");
  renderStep2();
};

function renderStep2() {
  if (!currentCheckoutItem) return;
  
  const p = currentCheckoutItem.product;
  const mainImg = (Array.isArray(p.image) && p.image.length > 0) ? p.image[0] : (typeof p.image === 'string' ? p.image : "placeholder.jpg");
  $("chkStep2Img").src = mainImg; 
  $("chkStep2Qty").value = currentCheckoutItem.qty > 7 ? 7 : currentCheckoutItem.qty;
  
  updateStep2Summary();
  
  $("chkStep2Qty").onchange = (e) => { 
      currentCheckoutItem.qty = parseInt(e.target.value); 
      updateStep2Summary(); 
  };
}

function updateStep2Summary() {
  if (!currentCheckoutItem) return;
  
  let actualTotal = currentCheckoutItem.product.price * currentCheckoutItem.qty; 
  let finalTotal = finalPrice(currentCheckoutItem.product) * currentCheckoutItem.qty;
  
  $("billActual").textContent = "₹" + actualTotal; 
  $("billFinal").textContent = "₹" + finalTotal;
  $("chkTotalAmt").textContent = "₹" + finalTotal;
}

$("step2PayBtn").onclick = () => {
  if(!currentCheckoutItem) return;
  let finalTotal = finalPrice(currentCheckoutItem.product) * currentCheckoutItem.qty;
  let amountPaid = finalTotal;
  
  $("qrAmountDisplay").textContent = "₹" + amountPaid;
  $("paymentOptionsWrap").classList.add("hidden"); $("qrScanSection").classList.remove("hidden");
  $("step2PayBtn").classList.add("hidden"); $("confirmOrderBtn").classList.remove("hidden");
  $("checkoutStep2").scrollTop = 0;

  let timeLeft = 300; const timerDisplay = document.getElementById("paymentTimer");
  if (window.paymentInterval) clearInterval(window.paymentInterval);
  window.paymentInterval = setInterval(() => {
    timeLeft--; let minutes = Math.floor(timeLeft / 60); let seconds = timeLeft % 60;
    timerDisplay.innerText = "Time left: 0" + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    if (timeLeft <= 0) { clearInterval(window.paymentInterval); timerDisplay.innerText = "Time expired! Kripya page refresh karein."; timerDisplay.style.color = "red"; }
  }, 1000);
};

async function sendTelegramAlert(orderData) {
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === "YOUR_TELEGRAM_BOT_TOKEN_HERE") return;
    let itemsList = "";
    if (orderData.items && orderData.items.length > 0) {
        itemsList = orderData.items.map(i => `${i.product.name} (x${i.qty}) ${i.size && i.size !== 'Default' ? '['+i.size+']' : ''}`).join(', ');
    } else { itemsList = "Unknown Items"; }

    let text = `🛍️ *NEW ELITE ORDER ALERT!* 🛍️\n\n👤 *Name:* ${orderData.name}\n📱 *Mobile:* ${orderData.mobile}\n\n🏠 *FULL DELIVERY ADDRESS:*\n${orderData.address}\n`;
    text += `\n📦 *Items:* ${itemsList}\n🛒 *Store:* ${orderData.shopName}\n💰 *Total Amount:* ₹${orderData.totalAmount}\n💳 *Payment Mode:* ${orderData.paymentMethod}\n`;
    text += `🧾 *WhatsApp Screenshot Expected*\n`;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try { await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text, parse_mode: "Markdown" }) }); } catch(e) {}
}

$("confirmOrderBtn").onclick = async () => {
  if(!currentCheckoutItem) return;
  
  let finalTotal = finalPrice(currentCheckoutItem.product) * currentCheckoutItem.qty;
  let amountPaid = finalTotal;
  let balanceDue = 0;
  let payMethod = "Prepaid";
  let utrValue = "WA_SCREENSHOT";
  
  const btn = $("confirmOrderBtn"); btn.textContent = "Placing Order..."; btn.disabled = true;
  if (window.paymentInterval) clearInterval(window.paymentInterval);

  const chkMobile = $("chkMobile").value.trim();
  const autoEmail = chkMobile + "@genzstore.com";
  const autoPass = "genzstore" + chkMobile;

  try { if(window.signInWithEmailAndPassword && window.fbAuth) { await window.signInWithEmailAndPassword(window.fbAuth, autoEmail, autoPass); } } 
  catch(e) { try { if(window.createUserWithEmailAndPassword && window.fbAuth) { await window.createUserWithEmailAndPassword(window.fbAuth, autoEmail, autoPass); if(window.fbAuth.currentUser) { await window.updateProfile(window.fbAuth.currentUser, { displayName: $("chkName").value.trim() }); } } } catch(err2) {} }
  
  const userEmail = window.fbAuth && window.fbAuth.currentUser ? window.fbAuth.currentUser.email : autoEmail;

  const orderData = { 
      name: $("chkName").value.trim(), 
      mobile: chkMobile, 
      address: $("chkAddress").value.trim(), 
      items: [currentCheckoutItem], 
      totalAmount: finalTotal, 
      paymentMethod: payMethod, 
      amountPaid: amountPaid, 
      balanceDue: balanceDue, 
      utrNumber: utrValue, 
      status: "Recent", 
      userEmail: userEmail, 
      shopName: "Unique Fashion", 
      savedAt: Date.now() 
  };

  if (window.saveOrderToFirebase) {
    window.saveOrderToFirebase(orderData).then(success => {
      btn.disabled = false;
      if (success) {
        let localUserOrders = load("knk_my_orders_" + userEmail, []); localUserOrders.unshift(orderData); save("knk_my_orders_" + userEmail, localUserOrders);
        sendTelegramAlert(orderData); showStep3Success(payMethod, amountPaid, balanceDue);
      } else { alert("Server error. Please try again."); btn.textContent = "Verify Payment & Confirm"; }
    });
  } else {
    btn.disabled = false;
    let localUserOrders = load("knk_my_orders_" + userEmail, []); localUserOrders.unshift(orderData); save("knk_my_orders_" + userEmail, localUserOrders);
    sendTelegramAlert(orderData); showStep3Success(payMethod, amountPaid, balanceDue);
  }
};

function showStep3Success(payMethod, paid, due) {
  $("checkoutStep2").classList.add("hidden"); $("checkoutStep3").classList.remove("hidden"); $("checkoutFooter").classList.add("hidden");
  $("step2Indicator").classList.remove("active"); $("step2Indicator").classList.add("completed"); $("step2Circle").innerHTML = "✔";
  $("line2").classList.add("completed"); $("step3Indicator").classList.add("active");
  let sumHtml = `<strong style="font-size:14px; color:var(--primary);">Payment Mode: ${payMethod}</strong><br><br>`;
  sumHtml += `<strong>Total Paid Online:</strong> ₹${paid}<br><strong style="color:#4cc968">No pending dues!</strong>`;
  $("successOrderSummary").innerHTML = sumHtml;
}

$("successCloseBtn").onclick = () => { history.back(); };

window.renderMyOrders = function() {
  const list = $("myOrdersList"); const user = window.fbAuth ? window.fbAuth.currentUser : null;
  const userEmail = user ? user.email : "guest"; const userMobile = userEmail.replace("@genzstore.com", "");
  let displayOrders = [];
  if (window.allFirebaseOrders && window.allFirebaseOrders.length > 0) { displayOrders = window.allFirebaseOrders.filter(o => o.userEmail === userEmail || o.mobile === userMobile); } 
  else { displayOrders = load("knk_my_orders_" + userEmail, []); }
  
  if (!displayOrders || displayOrders.length === 0) { list.innerHTML = `<div style="text-align:center; padding:40px 10px; color:var(--muted); font-size:13px;">Aapne abhi tak koi order place nahi kiya hai.</div>`; return; }

  let html = "";
  displayOrders.forEach((o) => {
    const dateStr = o.timestamp && o.timestamp.seconds ? new Date(o.timestamp.seconds * 1000).toLocaleDateString() : new Date(o.savedAt || Date.now()).toLocaleDateString();
    let thumb = "placeholder.jpg";
    if (o.items && o.items.length > 0) { const pImg = o.items[0].product.image; thumb = Array.isArray(pImg) ? pImg[0] : pImg; }
    let statusDisplay = o.status || 'Recent';

    html += `
    <div class="mo-card" onclick="pushModalState(); openMyOrderModal('${o.id || o.savedAt}')">
      <div class="mo-head">
        <span style="font-weight:700; color:var(--primary); font-size:15px;">₹${o.totalAmount}</span>
        <span class="mo-status">${statusDisplay}</span>
      </div>
      <div class="mo-body" style="display:flex; gap:12px; align-items:center;">
         <img src="${thumb}" style="width:60px; height:60px; object-fit:cover; border-radius:8px; border:1px solid var(--border);">
         <div style="flex:1;"><strong style="color:var(--fg); font-size:13px;">Date: ${dateStr}</strong><br><span style="color:var(--primary); font-size:12px; font-weight:600;">${o.items.length} Item(s) • Tap to view details</span></div>
      </div>
    </div>`;
  });
  list.innerHTML = html;
}

window.openMyOrderModal = function (idStr) {
  let allSrc = window.allFirebaseOrders || []; const userEmail = window.fbAuth && window.fbAuth.currentUser ? window.fbAuth.currentUser.email : "guest";
  if(allSrc.length === 0) allSrc = load("knk_my_orders_" + userEmail, []);
  const o = allSrc.find((x) => (x.id && x.id === idStr) || (x.savedAt && x.savedAt.toString() === idStr.toString()));
  if (!o) return;

  let itemsHtml = o.items.map((i) => {
    const img = Array.isArray(i.product.image) ? i.product.image[0] : i.product.image;
    const actual = i.product.price * i.qty; const finalP = finalPrice(i.product) * i.qty;
    const sizeDisplay = i.size && i.size !== "Default" ? `<div style="font-size:11px; color:var(--primary); font-weight:700;">Size: ${i.size}</div>` : '';
    return `
    <div style="display:flex; gap:10px; margin-bottom:12px; border-bottom:1px solid var(--border2); padding-bottom:12px;">
       <img src="${img}" style="width:60px; height:60px; border-radius:8px; object-fit:cover;">
       <div><div style="font-weight:600; font-size:13px; color:var(--fg);">${i.product.name}</div><div style="font-size:12px; color:var(--muted2);">Qty: ${i.qty} Unit(s)</div>${sizeDisplay}<div style="font-size:13px; margin-top:4px;"><span style="text-decoration:line-through; color:var(--muted); font-size:11px;">₹${actual}</span><strong style="color:var(--primary); margin-left:6px;">₹${finalP}</strong></div></div>
    </div>`;
  }).join("");

  const dateStr = o.timestamp && o.timestamp.seconds ? new Date(o.timestamp.seconds * 1000).toLocaleString() : new Date(o.savedAt || Date.now()).toLocaleString();
  const payMode = "Prepaid Online";

  $("myOrderDetailBody").innerHTML = `
    <div style="margin-bottom:15px; background:var(--bg2); padding:12px; border-radius:10px; border:1px solid var(--border);">
       <div style="color:var(--primary); font-weight:700; margin-bottom:6px; font-size:14px;">Order Status: ${o.status || 'Recent'}</div>
       <div style="font-size:12px; color:var(--muted2);">Order Date: ${dateStr}</div>
       <div style="font-size:12px; color:var(--muted2); margin-top:4px;">Payment: ${payMode}</div>
    </div>
    <h3 style="font-size:14px; margin-bottom:10px; color:var(--fg); font-family:var(--font-body); font-weight:600;">Items Details</h3>
    ${itemsHtml}
    <h3 style="font-size:14px; margin:15px 0 10px; color:var(--fg); font-family:var(--font-body); font-weight:600;">Delivery Address</h3>
    <div style="font-size:13px; color:var(--muted); line-height:1.5; background:var(--bg2); padding:10px; border-radius:8px;">
       <strong style="color:var(--fg);">${o.name}</strong> (${o.mobile})<br>${o.address}
    </div>
    <div style="margin-top:20px; border-top:1px dashed var(--border); padding-top:15px;">
       <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:13px;"><span>Paid Online:</span> <span>₹${o.amountPaid}</span></div>
       <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:16px; font-weight:700; color:var(--primary);"><span>Total Amount:</span> <span>₹${o.totalAmount}</span></div>
    </div>
  `;
  $("myOrderDetailModal").classList.remove("hidden"); lockScroll();
};

window.toggleLike = function(pid) {
    const p = products.find(x => x.id === pid); if(!p) return;
    const idx = likes.findIndex(l => l.id === pid);
    if(idx > -1) { likes.splice(idx, 1); } else { likes.push(p); }
    save("knk_likes", likes); renderLikesCount(); renderHomeProducts(); 
    if($("newPage") && !$("newPage").classList.contains("hidden")) renderNewCollection();
    if($("likesPage") && !$("likesPage").classList.contains("hidden")) renderLikesPageTab();
}

function renderLikesCount() { const b = $("navLikesCount"); if (b) { b.textContent = likes.length; b.classList.toggle("hidden", likes.length === 0); } }

function renderLikesPageTab() {
  const body = $("likesPageItems"); if(!body) return;
  if (!likes.length) { body.innerHTML = '<p class="empty" style="padding:40px 0;">Aapne abhi tak koi product Like nahi kiya hai.</p>'; return; }
  body.innerHTML = "";
  likes.forEach((p) => {
    const mainImg = (Array.isArray(p.image) && p.image.length > 0) ? p.image[0] : "placeholder.jpg";
    const el = document.createElement("div"); el.className = "cart-item"; el.style.cursor = "pointer";
    el.innerHTML = `<img src="${mainImg}" alt="${p.name}" /><div class="ci-info"><div class="ci-name">${p.name}</div><div class="ci-sub">₹${finalPrice(p)}</div></div><button class="trash" style="font-size: 20px;" onclick="event.stopPropagation(); toggleLike('${p.id}')">❌</button>`;
    el.onclick = () => { openProductDetail(p); }; body.appendChild(el);
  });
}

$("closeViewerBtn").onclick = () => { history.back(); };
$("imageViewer").onclick = (e) => { if (e.target === $("imageViewer") || e.target === $("fullImage")) { history.back(); } };
preventZoom(); renderLikesCount();
