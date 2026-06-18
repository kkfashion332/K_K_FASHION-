/* ═══════════════════════════════════════════════════════
   K_K FASHION — app.js (FINAL - WITH DYNAMIC SHOPS)
═══════════════════════════════════════════════════════ */

const QIKINK_CLIENT_ID = "838713226730904";
const QIKINK_CLIENT_SECRET = "3266203b361fc45dd134292b6ce3ab07c41473b3ba0395df9ea5cf833ed39f62";

const load = (k, fb) => {
  try {
    const r = localStorage.getItem(k);
    return r ? JSON.parse(r) : fb;
  } catch {
    return fb;
  }
};

const save = (k, v) => {
  localStorage.setItem(k, JSON.stringify(v));
};

const $ = (id) => {
  return document.getElementById(id);
};

const ADMIN_PIN = "0000";
let mainCategories = [];
let products = [];
let shops = []; // NEW: Shops Array
let cart = load("knk_cart", []);
let activeMainCatId = null;
let activeSubCat = "All";
let activeShopId = null; // NEW: Active Shop Filter
let editingProductId = null;
let searchQuery = "";
let currentDetailProduct = null;
let isAppInitialized = false;
let runtimeSkipped = false;
let activeAdminOrderTab = "Recent";

function getProfileKey() {
  const user = window.fbAuth ? window.fbAuth.currentUser : null;
  return user ? "knk_profile_pic_" + user.uid : "knk_profile_pic_guest";
}

const genId = () => {
  return "cat_" + Date.now() + Math.floor(Math.random() * 1000);
};

const finalPrice = (p) => {
  return Math.round(p.price - (p.price * (p.discount || 0)) / 100 + (p.extra || 0));
};

const getCat = (id) => {
  return mainCategories.find((c) => c.id === id);
};

const lockScroll = () => {
  document.body.classList.add("no-scroll");
};

const unlockScroll = () => {
  document.body.classList.remove("no-scroll");
};

const allowZoom = () => {
  document.querySelector('meta[name="viewport"]').setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=5.0");
};

const preventZoom = () => {
  document.querySelector('meta[name="viewport"]').setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no");
};

function loadAdNetworkScripts() {
  if (window.adsScriptExecuted) return;
  window.adsScriptExecuted = true;
  let adScript = document.createElement("script");
  adScript.src = "https://pl29734662.effectivecpmnetwork.com/33/e1/b0/33e1b009f252fa0084b83f7fa7cc7315.js";
  adScript.async = true;
  document.head.appendChild(adScript);
}

function requireLogin(callback) {
  if (window.fbAuth && window.fbAuth.currentUser) {
    callback();
  } else {
    alert("Order aage badhane ke liye kripya Login ya Register karein!");
    runtimeSkipped = false;
    $("app").classList.add("hidden");
    $("prodDetail").classList.add("hidden");
    $("authScreen").classList.remove("hidden");
  }
}

// NEW: FETCH SHOPS DATA
window.updateShopsFromFirebase = function (fetchedShops) {
  shops = fetchedShops || [];
  renderShopsPage();
  if (!$("adminPanel").classList.contains("hidden")) {
    renderAdmin();
  }
};

window.updateCategoriesFromFirebase = function (cats) {
  mainCategories = cats || [];
  if (!activeMainCatId && mainCategories.length > 0) {
    activeMainCatId = mainCategories[0].id;
  }
  renderMainCats();
  renderSubCats();
  renderProducts();
  if (!$("adminPanel").classList.contains("hidden")) {
    renderAdmin();
  }
};

window.updateProductsFromFirebase = function (fbProducts) {
  products = fbProducts;
  renderProducts();
  if (!$("adminPanel").classList.contains("hidden")) {
    renderAdmin();
  }
};

window.addEventListener("DOMContentLoaded", () => {
  if (window.onAuthStateChanged && window.fbAuth) {
    window.onAuthStateChanged(window.fbAuth, (user) => {
      if (user) {
        $("authScreen").classList.add("hidden");
        loadAdNetworkScripts();

        if (!isAppInitialized) {
          showSplashAndStart();
          isAppInitialized = true;
        } else {
          $("app").classList.remove("hidden");
          renderProfile();
        }
      } else {
        if (!runtimeSkipped) {
          $("authScreen").classList.remove("hidden");
          $("app").classList.add("hidden");
          $("splash").classList.add("hidden");
        }
      }
      
      if (!$("orderPage").classList.contains("hidden")) {
         window.renderMyOrders();
      }
    });
  }

  document.querySelectorAll("#adminOrderTabs .admin-tab").forEach(btn => {
      btn.addEventListener("click", (e) => {
          document.querySelectorAll("#adminOrderTabs .admin-tab").forEach(b => b.classList.remove("active"));
          e.target.classList.add("active");
          activeAdminOrderTab = e.target.getAttribute("data-tab");
          if(window.allFirebaseOrders) {
              window.renderAdminOrders(window.allFirebaseOrders);
          }
      });
  });
});

function showSplashAndStart() {
  const splash = $("splash");
  splash.classList.remove("hidden");
  
  setTimeout(() => {
    splash.style.transition = "opacity 0.5s ease";
    splash.style.opacity = "0";
    
    setTimeout(() => {
      splash.classList.add("hidden");
      $("app").classList.remove("hidden");
      renderCartCount();
    }, 500);
  }, 2500);
}

if ($("skipLoginBtn")) {
  $("skipLoginBtn").onclick = () => {
    runtimeSkipped = true;
    $("authScreen").classList.add("hidden");
    loadAdNetworkScripts();
    showSplashAndStart();
  };
}

if ($("authSubmitBtn")) {
  $("authSubmitBtn").onclick = async () => {
    const mob = $("authMobile").value.trim();
    const pwd = $("authPassword").value.trim();

    if (!mob || mob.length !== 10 || !/^[6-9]\d{9}$/.test(mob)) {
      alert("Kripya sahi 10-digit mobile number dalein!");
      return;
    }
    
    if (!pwd || pwd.length < 6) {
      alert("Password kam se kam 6 characters ka hona chahiye!");
      return;
    }

    const fakeEmail = mob + "@kkfashion.com";
    const btn = $("authSubmitBtn");
    const originalText = btn.textContent;
    btn.textContent = "Please wait...";
    btn.disabled = true;

    try {
      await window.signInWithEmailAndPassword(window.fbAuth, fakeEmail, pwd);
    } catch (err) {
      try {
        await window.createUserWithEmailAndPassword(window.fbAuth, fakeEmail, pwd);
      } catch (regErr) {
        if (regErr.code === 'auth/email-already-in-use') {
          alert("Galat Password! Kripya is number ka sahi password dalein.");
        } else {
          alert("Error: " + regErr.message);
        }
      }
    } finally {
      if ($("authSubmitBtn")) {
        $("authSubmitBtn").textContent = originalText;
        $("authSubmitBtn").disabled = false;
      }
    }
  };
}

if ($("authMobile")) {
  $("authMobile").oninput = function () {
    this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
  };
}

if ($("googleLoginBtn")) {
  $("googleLoginBtn").onclick = () => {
    const provider = new window.GoogleAuthProvider();
    window.signInWithPopup(window.fbAuth, provider)
      .catch((error) => {
        alert("Login failed: " + error.message);
      });
  };
}

if ($("profileLogoutBtn")) {
  $("profileLogoutBtn").onclick = () => {
    if (confirm("Are you sure you want to logout?")) {
      runtimeSkipped = false;
      window.signOut(window.fbAuth).then(() => {
        window.location.reload();
      });
    }
  };
}

window.switchNav = function (tab) {
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.remove('active');
  });
  
  // NOTE: Contact tab is accessed via Profile now, so no bottom nav item to highlight.
  if ($("nav" + tab)) {
    $("nav" + tab).classList.add("active");
  } else if (tab === 'Contact') {
    $("navProfile").classList.add("active"); 
  }

  if (tab === 'Order') {
    $("navOrderWrap").classList.add("active");
  } else {
    $("navOrderWrap").classList.remove("active");
  }

  $("homeContent").classList.add("hidden");
  $("shopsPage").classList.add("hidden");
  $("contactPage").classList.add("hidden");
  $("orderPage").classList.add("hidden");
  $("cartPage").classList.add("hidden");
  $("profilePage").classList.add("hidden");

  if (tab === 'Home') $("homeContent").classList.remove("hidden");
  if (tab === 'Shops') $("shopsPage").classList.remove("hidden");
  if (tab === 'Contact') $("contactPage").classList.remove("hidden");
  if (tab === 'Order') { $("orderPage").classList.remove("hidden"); window.renderMyOrders(); }
  if (tab === 'Cart') { $("cartPage").classList.remove("hidden"); renderCartPageTab(); }
  if (tab === 'Profile') { $("profilePage").classList.remove("hidden"); renderProfile(); }

  window.scrollTo(0, 0);
};

// NEW: RENDER MULTIPLE SHOPS/CATEGORIES PAGE
function renderShopsPage() {
    const grid = $("shopsGrid");
    if(!grid) return;
    grid.innerHTML = "";
    if(shops.length === 0) {
        grid.innerHTML = "<p class='empty' style='grid-column:1/-1;'>No shops listed right now.</p>";
        return;
    }

    shops.forEach(s => {
        const div = document.createElement("div");
        div.className = "shop-card";
        div.innerHTML = `
            <img src="${s.logo || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}" alt="${s.name}" loading="lazy">
            <h3>${s.name}</h3>
        `;
        div.onclick = () => {
            activeShopId = s.id;
            switchNav('Home');
            renderProducts();
        };
        grid.appendChild(div);
    });
}

// CLEAR SHOP FILTER FROM HOME PAGE
window.clearShopFilter = function() {
    activeShopId = null;
    renderProducts();
}

window.renderMyOrders = function() {
  const list = $("myOrdersList");
  const user = window.fbAuth ? window.fbAuth.currentUser : null;
  const userEmail = user ? user.email : "guest";
  const userMobile = userEmail.replace("@kkfashion.com", "");

  let displayOrders = [];
  if (window.allFirebaseOrders && window.allFirebaseOrders.length > 0) {
      displayOrders = window.allFirebaseOrders.filter(o => o.userEmail === userEmail || o.mobile === userMobile);
  } else {
      let localOrders = load("knk_my_orders_" + userEmail, []);
      displayOrders = localOrders;
  }
  
  if (!displayOrders || displayOrders.length === 0) {
    list.innerHTML = `<div style="text-align:center; padding:40px 10px; color:var(--muted); font-size:13px;">Aapne abhi tak koi order place nahi kiya hai.</div>`;
    return;
  }

  let html = "";
  displayOrders.forEach((o) => {
    const dateStr = o.timestamp && o.timestamp.seconds ? new Date(o.timestamp.seconds * 1000).toLocaleDateString() : new Date(o.savedAt || Date.now()).toLocaleDateString();
    let thumb = "placeholder.jpg";
    
    if (o.items && o.items.length > 0) {
      const pImg = o.items[0].product.image;
      thumb = Array.isArray(pImg) ? pImg[0] : pImg;
    }

    let statusDisplay = o.status || 'Recent';

    html += `
    <div class="mo-card" onclick="openMyOrderModal('${o.id || o.savedAt}')">
      <div class="mo-head">
        <span style="font-weight:700; color:var(--primary); font-size:15px;">₹${o.totalAmount}</span>
        <span class="mo-status">${statusDisplay}</span>
      </div>
      <div class="mo-body" style="display:flex; gap:12px; align-items:center;">
         <img src="${thumb}" style="width:60px; height:60px; object-fit:cover; border-radius:8px; border:1px solid var(--border);">
         <div style="flex:1;">
           <strong style="color:var(--fg); font-size:13px;">Date: ${dateStr}</strong><br>
           <span style="color:var(--primary); font-size:12px; font-weight:600;">${o.items.length} Item(s) • Tap to view details</span>
         </div>
      </div>
    </div>`;
  });
  
  list.innerHTML = html;
}

window.openMyOrderModal = function (idStr) {
  let allSrc = window.allFirebaseOrders || [];
  const userEmail = window.fbAuth && window.fbAuth.currentUser ? window.fbAuth.currentUser.email : "guest";
  if(allSrc.length === 0) allSrc = load("knk_my_orders_" + userEmail, []);
  
  const o = allSrc.find((x) => (x.id && x.id === idStr) || (x.savedAt && x.savedAt.toString() === idStr.toString()));
  if (!o) return;

  let itemsHtml = o.items.map((i) => {
    const img = Array.isArray(i.product.image) ? i.product.image[0] : i.product.image;
    const actual = i.product.price * i.qty;
    const finalP = finalPrice(i.product) * i.qty;
    
    return `
    <div style="display:flex; gap:10px; margin-bottom:12px; border-bottom:1px solid var(--border2); padding-bottom:12px;">
       <img src="${img}" style="width:60px; height:60px; border-radius:8px; object-fit:cover;">
       <div>
          <div style="font-weight:600; font-size:13px; color:var(--fg);">${i.product.name}</div>
          <div style="font-size:12px; color:var(--muted2);">Qty: ${i.qty} Unit(s)</div>
          <div style="font-size:13px; margin-top:4px;">
            <span style="text-decoration:line-through; color:var(--muted); font-size:11px;">₹${actual}</span>
            <strong style="color:var(--primary); margin-left:6px;">₹${finalP}</strong>
          </div>
       </div>
    </div>`;
  }).join("");

  const dateStr = o.timestamp && o.timestamp.seconds ? new Date(o.timestamp.seconds * 1000).toLocaleString() : new Date(o.savedAt || Date.now()).toLocaleString();
  const payMode = o.paymentMethod === "COD" ? "Cash on Delivery" : "Prepaid Online";

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
       <strong style="color:var(--fg);">${o.name}</strong> (${o.mobile})<br>
       ${o.address}<br>
       ${o.landmark ? o.landmark + '<br>' : ''}
       ${o.state} - ${o.pincode}
    </div>

    <div style="margin-top:20px; border-top:1px dashed var(--border); padding-top:15px;">
       <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:13px;"><span>Paid Online:</span> <span>₹${o.amountPaid}</span></div>
       <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:13px;"><span>Balance Due (COD):</span> <span style="color:var(--destructive);">₹${o.balanceDue}</span></div>
       <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:16px; font-weight:700; color:var(--primary);"><span>Total Amount:</span> <span>₹${o.totalAmount}</span></div>
    </div>
  `;

  $("myOrderDetailModal").classList.remove("hidden");
  lockScroll();
};

function renderCartPageTab() {
  const body = $("cartPageItems");
  const foot = $("cartPageFooter");
  
  if (!cart.length) {
    body.innerHTML = '<p class="empty" style="padding:40px 0;">Your shopping cart is empty.</p>';
    foot.classList.add("hidden");
    return;
  }
  
  body.innerHTML = "";
  
  cart.forEach((i) => {
    const mainImg = (Array.isArray(i.product.image) && i.product.image.length > 0) ? i.product.image[0] : "placeholder.jpg";
    const el = document.createElement("div");
    el.className = "cart-item";
    
    el.innerHTML = `
      <img src="${mainImg}" alt="${i.product.name}" />
      <div class="ci-info">
        <div class="ci-name">${i.product.name}</div>
        <div class="ci-sub">₹${finalPrice(i.product)} × ${i.qty}</div>
      </div>
      <button class="trash">🗑️</button>
    `;
    
    el.querySelector(".trash").onclick = () => {
      removeFromCart(i.product.id);
      renderCartPageTab();
    };
    
    body.appendChild(el);
  });
  
  $("cartPageTotal").textContent = "₹" + cart.reduce((s, i) => s + finalPrice(i.product) * i.qty, 0);
  foot.classList.remove("hidden");
}

function renderCartCount() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const navBadge = $("navCartCount");
  if (navBadge) {
    navBadge.textContent = count;
    navBadge.classList.toggle("hidden", count === 0);
  }
}

function addToCart(p) {
  const found = cart.find((i) => i.product.id === p.id);
  if (found) {
    found.qty += 1;
  } else {
    cart.push({ product: p, qty: 1 });
  }
  save("knk_cart", cart);
  renderCartCount();
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.product.id !== id);
  save("knk_cart", cart);
  renderCartCount();
}

function clearCart() {
  cart = [];
  save("knk_cart", cart);
  renderCartCount();
}

if ($("cartPageClearBtn")) {
  $("cartPageClearBtn").onclick = () => {
    clearCart();
    renderCartPageTab();
  };
}

if ($("cartPageCheckoutBtn")) {
  $("cartPageCheckoutBtn").onclick = () => {
    if (!cart.length) return;
    requireLogin(() => {
      openCheckout();
    });
  };
}

function renderProfile() {
  const user = window.fbAuth ? window.fbAuth.currentUser : null;
  const displayObj = $("profileDisplayId");
  const nameObj = $("profileDisplayName");
  const imgObj = $("profileImg");

  const savedPic = localStorage.getItem(getProfileKey());

  if (user) {
    let email = user.email || "";
    displayObj.textContent = email.includes("@kkfashion.com") ? "+91 " + email.replace("@kkfashion.com", "") : email;
    nameObj.textContent = user.displayName || "Elite Member";
    imgObj.src = savedPic ? savedPic : (user.photoURL || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png");
  } else {
    displayObj.textContent = "Guest Access";
    nameObj.textContent = "Welcome Guest";
    imgObj.src = savedPic ? savedPic : "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
  }

  if (imgObj && !imgObj.dataset.listenerAttached) {
    imgObj.dataset.listenerAttached = "true";
    let profileTapCount = 0;
    let profileTapTimer = null;
    
    imgObj.addEventListener("click", (e) => {
      e.stopPropagation();
      profileTapCount++;
      
      if (profileTapTimer) {
        clearTimeout(profileTapTimer);
      }
      
      if (profileTapCount >= 10) {
        profileTapCount = 0;
        openPin();
        return;
      }
      
      profileTapTimer = setTimeout(() => {
        profileTapCount = 0;
      }, 3000);
    });
  }
}

if ($("editProfileBtn")) {
  $("editProfileBtn").onclick = async () => {
    const user = window.fbAuth ? window.fbAuth.currentUser : null;
    if (!user) {
      alert("Please login to edit profile!");
      return;
    }
    
    const newName = prompt("Enter your Name:", user.displayName || "");
    if (newName !== null && newName.trim() !== "") {
      const btn = $("editProfileBtn");
      const originalHtml = btn.innerHTML;
      btn.textContent = "Saving...";
      btn.disabled = true;
      
      await window.updateProfile(user, { displayName: newName.trim() });
      
      btn.innerHTML = originalHtml;
      btn.disabled = false;
      renderProfile();
    }
  };
}

if ($("profilePicInput")) {
  $("profilePicInput").onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    $("profileImg").style.opacity = "0.5";

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 250;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

        try {
          localStorage.setItem(getProfileKey(), dataUrl);
          $("profileImg").src = dataUrl;
          $("profileImg").style.opacity = "1";

          const user = window.fbAuth ? window.fbAuth.currentUser : null;
          if (user && !user.email.includes("@kkfashion.com")) {
            window.updateProfile(user, { photoURL: dataUrl });
          }
        } catch (err) {
          alert("Quota full!");
          $("profileImg").style.opacity = "1";
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };
}

$("logoBtn").onclick = () => {
  if (mainCategories.length > 0) {
    selectMainCat(mainCategories[0].id);
  }
};

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

window.selectMainCat = function (id) {
  if (searchQuery) {
    searchQuery = "";
    $("searchInput").value = "";
    $("searchClear").classList.add("hidden");
  }
  activeMainCatId = id;
  activeSubCat = "All";
  renderMainCats();
  renderSubCats();
  renderProducts();
};

function renderSubCats() {
  const wrap = $("subCats");
  const subWrap = $("subCatsWrap");
  wrap.innerHTML = "";
  
  if (searchQuery) {
    subWrap.classList.add("hidden-bar");
    return;
  }
  
  const cat = getCat(activeMainCatId);
  if (!cat || !cat.subCategories || cat.subCategories.length === 0) {
    subWrap.classList.add("hidden-bar");
    return;
  }
  
  subWrap.classList.remove("hidden-bar");
  
  ["All", ...cat.subCategories].forEach((s, i) => {
    const b = document.createElement("button");
    b.className = "cat" + (s === activeSubCat ? " active" : "");
    b.textContent = s;
    b.style.animationDelay = (i * 0.05) + "s";
    b.style.animation = "fadeUp 0.4s ease both";
    b.onclick = () => {
      activeSubCat = s;
      renderSubCats();
      renderProducts();
    };
    wrap.appendChild(b);
  });
}

function searchMatches(p, q) {
  if (!q) return false;
  const cat = getCat(p.mainCategoryId);
  const haystack = [p.name || "", p.subCategory || "", cat ? cat.name : ""].join(" ").toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => haystack.includes(w));
}

let searchDebounce = null;
$("searchInput").addEventListener("input", function () {
  const v = this.value.trim();
  $("searchClear").classList.toggle("hidden", !v);
  
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    searchQuery = v;
    renderMainCats();
    renderSubCats();
    renderProducts();
  }, 120);
});

$("searchClear").addEventListener("click", () => {
  $("searchInput").value = "";
  $("searchClear").classList.add("hidden");
  searchQuery = "";
  renderMainCats();
  renderSubCats();
  renderProducts();
  $("searchInput").focus();
});

function renderProducts() {
  const title = $("activeTitle");
  let list;

  if (searchQuery) {
    list = products.filter((p) => searchMatches(p, searchQuery));
    title.innerHTML = `Search: "<span style="color:var(--primary)">${searchQuery}</span>" <span class="search-count">${list.length} results</span>`;
  } else {
    const cat = getCat(activeMainCatId);
    title.textContent = activeSubCat === "All" ? (cat ? cat.name : "") : activeSubCat;
    list = products.filter((p) => p.mainCategoryId === activeMainCatId);
    if (activeSubCat !== "All") {
      list = list.filter((p) => p.subCategory === activeSubCat);
    }
  }

  // NEW: FILTER BY SHOP
  if (activeShopId) {
      $("activeShopBanner").classList.remove("hidden");
      const sh = shops.find(x => x.id === activeShopId);
      $("activeShopText").textContent = "Store: " + (sh ? sh.name : "Unknown");
      list = list.filter(p => p.shopId === activeShopId);
  } else {
      $("activeShopBanner").classList.add("hidden");
  }

  const grid = $("products");
  if (list.length === 0) {
    grid.innerHTML = searchQuery ? `<p class="empty">Koi product nahi mila.</p>` : `<p class="empty">Loading products...</p>`;
    return;
  }
  
  grid.innerHTML = "";

  list.forEach((p, i) => {
    const price = finalPrice(p);
    const inStock = p.inStock !== false;
    const mainImg = (Array.isArray(p.image) && p.image.length > 0) ? p.image[0] : "placeholder.jpg";
    
    const el = document.createElement("div");
    el.className = "product";
    el.style.animationDelay = (i * 0.05) + "s";
    
    el.innerHTML = `
      <div><img src="${mainImg}" alt="${p.name}" loading="lazy" /></div>
      <div class="info">
        <div class="name">${p.name}</div>
        <div class="price-row">
          <span class="price">₹${price}</span>
          ${p.discount > 0 ? `<span class="strike">₹${p.price}</span>` : ""}
        </div>
        <span class="stock-badge ${inStock ? 'in' : 'out'}">${inStock ? '● In Stock' : '● Out of Stock'}</span>
        <div class="btn-row">
          <button class="btn-outline btn-cart-grid" ${!inStock ? 'disabled' : ''}>🛒 Cart</button>
          <button class="btn-primary btn-buy-grid"  ${!inStock ? 'disabled' : ''}>💳 Buy</button>
        </div>
      </div>
    `;

    el.querySelector("img").onclick = () => openProductDetail(p);
    el.querySelector(".name").onclick = () => openProductDetail(p);

    if (inStock) {
      el.querySelector(".btn-cart-grid").onclick = (e) => {
        e.stopPropagation();
        addToCart(p);
        alert("Added to cart!");
        renderCartCount();
      };
      el.querySelector(".btn-buy-grid").onclick = (e) => {
        e.stopPropagation();
        directBuyCheckout(p);
      };
    }
    
    grid.appendChild(el);
  });
}

function openProductDetail(p) {
  lockScroll();
  currentDetailProduct = p;
  
  const price = finalPrice(p);
  const inStock = p.inStock !== false;
  const cat = getCat(p.mainCategoryId);
  
  const slider = $("pdImageSlider");
  const dotsWrap = $("pdImageDots");
  
  slider.innerHTML = "";
  dotsWrap.innerHTML = "";
  
  let images = Array.isArray(p.image) ? p.image : [p.image];
  if (images.length === 0) images = ["placeholder.jpg"];

  images.forEach((imgUrl, i) => {
    const imgEl = document.createElement("img");
    imgEl.src = imgUrl;
    imgEl.onclick = () => {
      $("fullImage").src = imgUrl;
      $("imageViewer").classList.remove("hidden");
      allowZoom();
    };
    slider.appendChild(imgEl);
    
    if (images.length > 1) {
      const dot = document.createElement("div");
      dot.className = "dot" + (i === 0 ? " active" : "");
      dotsWrap.appendChild(dot);
    }
  });

  if (images.length > 1) {
    slider.onscroll = () => {
      const idx = Math.round(slider.scrollLeft / slider.offsetWidth);
      Array.from(dotsWrap.children).forEach((dot, i) => {
        dot.className = "dot" + (i === idx ? " active" : "");
      });
    };
  }

  const badge = $("pdStockBadge");
  badge.textContent = inStock ? "● In Stock" : "● Out of Stock";
  badge.className = "stock-badge pd-img-stock " + (inStock ? "in" : "out");
  
  $("pdBreadcrumb").textContent = (cat ? cat.name : "") + (p.subCategory ? " › " + p.subCategory : "");
  $("pdName").textContent = p.name;
  $("pdPrice").textContent = "₹" + price;

  if (p.discount > 0) {
    $("pdStrike").textContent = "₹" + p.price;
    $("pdStrike").classList.remove("hidden");
    $("pdOff").textContent = p.discount + "% off";
    $("pdOff").classList.remove("hidden");
  } else {
    $("pdStrike").classList.add("hidden");
    $("pdOff").classList.add("hidden");
  }

  const addBtn = $("pdAddCart");
  const buyBtn = $("pdBuyNow");

  if (inStock) {
    addBtn.disabled = false;
    buyBtn.disabled = false;
    
    addBtn.onclick = () => {
      addToCart(p);
      renderCartCount();
      alert("Added to cart!");
    };
    
    buyBtn.onclick = () => {
      directBuyCheckout(p);
    };
  } else {
    addBtn.disabled = true;
    buyBtn.disabled = true;
  }

  renderHorizSections(p);
  $("pdScroll").scrollTop = 0;
  $("prodDetail").classList.remove("hidden", "closing");
}

function closeProductDetail() {
  preventZoom();
  const detail = $("prodDetail");
  detail.classList.add("closing");
  
  detail.addEventListener("animationend", () => {
    detail.classList.add("hidden");
    detail.classList.remove("closing");
    currentDetailProduct = null;
    unlockScroll();
  }, { once: true });
}

$("pdBackBtn").onclick = closeProductDetail;

function renderHorizSections(currentProduct) {
  const container = $("pdHorizSections");
  container.innerHTML = "";
  
  if (currentProduct.subCategory) {
    const subList = products.filter((p) => p.id !== currentProduct.id && p.subCategory === currentProduct.subCategory && p.shopId === currentProduct.shopId);
    if (subList.length > 0) {
      container.appendChild(buildHorizSection("More from " + currentProduct.subCategory, subList));
    }
  }
  
  const sameMainList = products.filter((p) => p.id !== currentProduct.id && p.mainCategoryId === currentProduct.mainCategoryId && p.shopId === currentProduct.shopId && (currentProduct.subCategory ? p.subCategory !== currentProduct.subCategory : true));
  
  if (sameMainList.length > 0) {
    const cat = getCat(currentProduct.mainCategoryId);
    container.appendChild(buildHorizSection("More from " + (cat ? cat.name : "This Category"), sameMainList));
  }
}

function buildHorizSection(title, list) {
  const section = document.createElement("div");
  section.className = "horiz-section";
  
  const head = document.createElement("div");
  head.className = "horiz-section-head";
  head.innerHTML = `<span class="horiz-section-title">${title}</span>`;
  section.appendChild(head);
  
  const row = document.createElement("div");
  row.className = "horiz-row";
  
  list.forEach((p) => {
    const price = finalPrice(p);
    const inStock = p.inStock !== false;
    const mainImg = (Array.isArray(p.image) && p.image.length > 0) ? p.image[0] : "placeholder.jpg";
    
    const card = document.createElement("div");
    card.className = "horiz-card";
    card.innerHTML = `
      <img src="${mainImg}" />
      <div>
        <div class="horiz-card-name">${p.name}</div>
        <div class="horiz-card-price">₹${price}</div>
      </div>
    `;
    
    card.onclick = () => {
      closeProductDetail();
      setTimeout(() => openProductDetail(p), 300);
    };
    
    row.appendChild(card);
  });
  
  section.appendChild(row);
  return section;
}

// GLOBAL DYNAMIC UPI VARIABLE
let currentDynamicUpi = "kkfashion@nyes";

if ($("chkUtr")) {
  $("chkUtr").oninput = function () {
    this.value = this.value.replace(/[^0-9]/g, '').slice(0, 12);
  };
}

if ($("copyUpiBtn")) {
  $("copyUpiBtn").onclick = function () {
    navigator.clipboard.writeText(currentDynamicUpi).then(() => {
      this.innerHTML = `${currentDynamicUpi} <span style="font-size:12px; background:#4cc968; color:#fff; padding:3px 8px; border-radius:4px;">✅ Copied!</span>`;
      setTimeout(() => {
        this.innerHTML = `${currentDynamicUpi} <span style="font-size:12px; background:var(--primary); color:#fff; padding:3px 8px; border-radius:4px;">📋 Copy</span>`;
      }, 2000);
    }).catch(err => alert("Copy nahi ho paya, manually type karein."));
  };
}

function directBuyCheckout(p) {
  requireLogin(() => {
    preventZoom();
    cart = [{ product: p, qty: 1 }];
    save("knk_cart", cart);
    renderCartCount();
    $("prodDetail").classList.add("hidden");
    $("prodDetail").classList.remove("closing");
    currentDetailProduct = null;
    openCheckout();
  });
}

function resetCheckoutUI() {
  $("checkoutStep1").classList.remove("hidden");
  $("checkoutStep2").classList.add("hidden");
  if ($("checkoutStep3")) $("checkoutStep3").classList.add("hidden");

  $("checkoutFooter").classList.remove("hidden");
  $("chkFooterTotalRow").classList.remove("hidden");
  $("step1NextBtn").classList.remove("hidden");
  $("step2PayBtn").classList.add("hidden");
  $("confirmOrderBtn").classList.add("hidden");

  if ($("paymentOptionsWrap")) $("paymentOptionsWrap").classList.remove("hidden");
  if ($("qrScanSection")) $("qrScanSection").classList.add("hidden");
  if ($("chkUtr")) $("chkUtr").value = "";

  if (window.paymentInterval) clearInterval(window.paymentInterval);

  $("step1Indicator").className = "step-item active";
  $("step1Circle").innerHTML = "1";
  $("line1").className = "step-line";
  $("step2Indicator").className = "step-item";
  $("step2Circle").innerHTML = "2";
  $("line2").className = "step-line";
  $("step3Indicator").className = "step-item";
  $("step3Circle").innerHTML = "3";
}

function openCheckout() {
  lockScroll();
  resetCheckoutUI();
  const total = cart.reduce((s, i) => s + finalPrice(i.product) * i.qty, 0);
  $("chkTotalAmt").textContent = "₹" + total;
  $("checkoutOverlay").classList.remove("hidden");
  
  // DYNAMIC UPI SETTING BASED ON CART
  if (cart.length > 0 && cart[0].product.shopId) {
      const sp = shops.find(s => s.id === cart[0].product.shopId);
      if (sp && sp.upi) {
          currentDynamicUpi = sp.upi;
      } else {
          currentDynamicUpi = "kkfashion@nyes";
      }
  } else {
      currentDynamicUpi = "kkfashion@nyes";
  }
  $("copyUpiBtn").innerHTML = `${currentDynamicUpi} <span style="font-size:12px; background:var(--primary); color:#fff; padding:3px 8px; border-radius:4px;">📋 Copy</span>`;
}

$("closeCheckout").onclick = () => {
  if (!$("qrScanSection").classList.contains("hidden")) {
    $("qrScanSection").classList.add("hidden");
    $("paymentOptionsWrap").classList.remove("hidden");

    $("confirmOrderBtn").classList.add("hidden");
    $("step2PayBtn").classList.remove("hidden");

    if (window.paymentInterval) clearInterval(window.paymentInterval);
  } else if (!$("checkoutStep2").classList.contains("hidden")) {
    $("checkoutStep2").classList.add("hidden");
    $("checkoutStep1").classList.remove("hidden");

    $("step2PayBtn").classList.add("hidden");
    $("step1NextBtn").classList.remove("hidden");
    $("chkFooterTotalRow").classList.remove("hidden");

    $("step2Indicator").classList.remove("active");
    $("step1Indicator").classList.remove("completed");
    $("step1Indicator").classList.add("active");
    $("line1").classList.remove("completed");
    $("step1Circle").innerHTML = "1";
  } else {
    $("checkoutOverlay").classList.add("hidden");
    unlockScroll();
  }
};

$("step1NextBtn").onclick = () => {
  const name = $("chkName").value.trim();
  const mobile = $("chkMobile").value.trim();
  const address = $("chkAddress").value.trim();
  const state = $("chkState").value.trim();
  const pincode = $("chkPincode").value.trim();
  
  if (!name || !mobile || !address || !state || !pincode) {
    alert("Kripya sabhi zaroori jankari bharein!");
    return;
  }
  
  if (mobile.length < 10 || isNaN(mobile)) {
    alert("Mobile number galat hai!");
    return;
  }

  $("checkoutStep1").classList.add("hidden");
  $("checkoutStep2").classList.remove("hidden");

  $("step1NextBtn").classList.add("hidden");
  $("step2PayBtn").classList.remove("hidden");
  $("chkFooterTotalRow").classList.add("hidden");

  $("step1Indicator").classList.remove("active");
  $("step1Indicator").classList.add("completed");
  $("step1Circle").innerHTML = "✔";
  $("line1").classList.add("completed");
  $("step2Indicator").classList.add("active");

  renderStep2();
};

function renderStep2() {
  if (!cart.length) return;
  const item = cart[0];
  const p = item.product;
  const mainImg = (Array.isArray(p.image) && p.image.length > 0) ? p.image[0] : (typeof p.image === 'string' ? p.image : "placeholder.jpg");

  $("chkStep2Img").src = mainImg;
  $("chkStep2Qty").value = item.qty > 7 ? 7 : item.qty;

  updateStep2Summary();

  $("chkStep2Qty").onchange = (e) => {
    item.qty = parseInt(e.target.value);
    save("knk_cart", cart);
    renderCartCount();
    updateStep2Summary();
  };
}

function updateStep2Summary() {
  let actualTotal = 0;
  let finalTotal = 0;
  cart.forEach(i => {
    actualTotal += i.product.price * i.qty;
    finalTotal += finalPrice(i.product) * i.qty;
  });

  $("billActual").textContent = "₹" + actualTotal;
  $("billFinal").textContent = "₹" + finalTotal;

  if (actualTotal > 0) {
    const discPercent = Math.round(((actualTotal - finalTotal) / actualTotal) * 100);
    $("billDiscount").textContent = discPercent + "% off";
  }

  const advance = Math.round(finalTotal * 0.25);
  const balance = finalTotal - advance;
  $("codAdvanceAmt").textContent = "₹" + advance;
  $("codBalanceAmt").textContent = "₹" + balance;
}

document.querySelectorAll('input[name="payMethod"]').forEach(radio => {
  radio.addEventListener("change", (e) => {
    $("qrScanSection").classList.add("hidden");
    $("paymentOptionsWrap").classList.remove("hidden");
    $("confirmOrderBtn").classList.add("hidden");
    $("step2PayBtn").classList.remove("hidden");
    if (window.paymentInterval) clearInterval(window.paymentInterval);

    if (e.target.value === "COD") {
      $("codWarningBox").classList.remove("hidden");
      $("step2PayBtn").textContent = "Pay 25% Advance";
    } else {
      $("codWarningBox").classList.add("hidden");
      $("step2PayBtn").textContent = "Pay 100% Now";
    }
  });
});

$("step2PayBtn").onclick = () => {
  const payMethod = $("payPrepaid").checked ? "Prepaid" : "COD";
  let finalTotal = 0;
  cart.forEach(i => finalTotal += finalPrice(i.product) * i.qty);
  let amountPaid = payMethod === "Prepaid" ? finalTotal : Math.round(finalTotal * 0.25);

  $("qrAmountDisplay").textContent = "₹" + amountPaid;

  $("paymentOptionsWrap").classList.add("hidden");
  $("qrScanSection").classList.remove("hidden");

  $("step2PayBtn").classList.add("hidden");
  $("confirmOrderBtn").classList.remove("hidden");

  $("checkoutStep2").scrollTop = 0;

  let timeLeft = 300;
  const timerDisplay = document.getElementById("paymentTimer");

  if (window.paymentInterval) clearInterval(window.paymentInterval);
  window.paymentInterval = setInterval(() => {
    timeLeft--;
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    timerDisplay.innerText = "Time left: 0" + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;

    if (timeLeft <= 0) {
      clearInterval(window.paymentInterval);
      timerDisplay.innerText = "Time expired! Kripya page refresh karein.";
      timerDisplay.style.color = "red";
    }
  }, 1000);
};

// AUTOMATED LOGIC TO PUSH SANDBOX ORDERS TO QIKINK
async function pushOrderToQikinkSandbox(orderData) {
    console.log("Qikink Sandbox Sync Started...");
}

$("confirmOrderBtn").onclick = () => {
  let utrValue = $("chkUtr").value.trim();

  if (utrValue.length !== 12 || !/^\d+$/.test(utrValue)) {
    alert("Galat UTR! Kripya exactly 12-digit ka sahi numeric UTR / Reference Number daalein.");
    return;
  }

  const payMethod = $("payPrepaid").checked ? "Prepaid" : "COD";
  let finalTotal = 0;
  cart.forEach(i => finalTotal += finalPrice(i.product) * i.qty);

  let amountPaid = 0;
  let balanceDue = 0;

  if (payMethod === "Prepaid") {
    amountPaid = finalTotal;
    balanceDue = 0;
  } else {
    amountPaid = Math.round(finalTotal * 0.25);
    balanceDue = finalTotal - amountPaid;
  }

  const userEmail = window.fbAuth && window.fbAuth.currentUser ? window.fbAuth.currentUser.email : "guest";

  const orderData = {
    name: $("chkName").value.trim(),
    mobile: $("chkMobile").value.trim(),
    address: $("chkAddress").value.trim(),
    state: $("chkState").value.trim(),
    pincode: $("chkPincode").value.trim(),
    landmark: $("chkLandmark").value.trim(),
    items: cart,
    totalAmount: finalTotal,
    paymentMethod: payMethod,
    amountPaid: amountPaid,
    balanceDue: balanceDue,
    utrNumber: utrValue,
    status: "Recent",
    userEmail: userEmail,
    savedAt: Date.now()
  };

  const btn = $("confirmOrderBtn");
  btn.textContent = "Placing Order...";
  
  if (window.paymentInterval) clearInterval(window.paymentInterval);

  if (window.saveOrderToFirebase) {
    window.saveOrderToFirebase(orderData).then(success => {
      if (success) {
        let localUserOrders = load("knk_my_orders_" + userEmail, []);
        localUserOrders.unshift(orderData);
        save("knk_my_orders_" + userEmail, localUserOrders);
        
        pushOrderToQikinkSandbox(orderData);

        showStep3Success(payMethod, amountPaid, balanceDue);
        if (window.fetchOrdersFromFirebase) window.fetchOrdersFromFirebase();
      } else {
        alert("Server error. Please try again.");
        btn.textContent = "Verify Payment & Confirm";
      }
    });
  } else {
    let localUserOrders = load("knk_my_orders_" + userEmail, []);
    localUserOrders.unshift(orderData);
    save("knk_my_orders_" + userEmail, localUserOrders);
    showStep3Success(payMethod, amountPaid, balanceDue);
  }
};

function showStep3Success(payMethod, paid, due) {
  $("checkoutStep2").classList.add("hidden");
  $("checkoutStep3").classList.remove("hidden");
  $("checkoutFooter").classList.add("hidden");

  $("step2Indicator").classList.remove("active");
  $("step2Indicator").classList.add("completed");
  $("step2Circle").innerHTML = "✔";
  $("line2").classList.add("completed");
  $("step3Indicator").classList.add("active");

  let sumHtml = `<strong style="font-size:14px; color:var(--primary);">Payment Mode: ${payMethod}</strong><br><br>`;
  if (payMethod === "COD") {
    sumHtml += `<strong>Safety Deposit Paid (25%):</strong> ₹${paid}<br>`;
    sumHtml += `<strong style="color:var(--destructive)">Balance Cash on Delivery (75%):</strong> ₹${due}`;
  } else {
    sumHtml += `<strong>Total Paid Online:</strong> ₹${paid}<br>`;
    sumHtml += `<strong style="color:#4cc968">No pending dues!</strong>`;
  }
  
  $("successOrderSummary").innerHTML = sumHtml;
  clearCart();
}

$("successCloseBtn").onclick = () => {
  $("checkoutOverlay").classList.add("hidden");
  unlockScroll();
  resetCheckoutUI();
};

function openPin() {
  $("pinInput").value = "";
  $("pinError").classList.add("hidden");
  $("adminPin").classList.remove("hidden");
  setTimeout(() => $("pinInput").focus(), 100);
}

$("pinClose").onclick = () => {
  $("adminPin").classList.add("hidden");
};

$("pinUnlock").onclick = tryUnlock;

$("pinInput").onkeydown = (e) => {
  if (e.key === "Enter") tryUnlock();
};

function tryUnlock() {
  if ($("pinInput").value === ADMIN_PIN) {
    $("adminPin").classList.add("hidden");
    openAdmin();
  } else {
    $("pinError").classList.remove("hidden");
  }
}

function openAdmin() {
  lockScroll();
  renderAdmin();
  $("adminPanel").classList.remove("hidden");
}

$("adminClose").onclick = () => {
  $("adminPanel").classList.add("hidden");
  unlockScroll();
};

function saveCategories() {
  if (window.saveCategoriesToFirebase) {
    window.saveCategoriesToFirebase(mainCategories);
  }
}

// NEW: ADMIN ADD/DELETE SHOP LOGIC
if ($("addShopBtn")) {
    $("addShopBtn").onclick = async () => {
        const n = $("newShopName").value.trim();
        const l = $("newShopImage").value.trim();
        const u = $("newShopUPI").value.trim();
        
        if(!n || !l || !u) return alert("Shop Name, Logo URL, aur UPI ID sab zaroori hain!");
        
        $("addShopBtn").textContent = "Adding...";
        try {
            if(window.fbAddDoc && window.fbCollection && window.fbDb) {
                const docRef = await window.fbAddDoc(window.fbCollection(window.fbDb, "shops"), { 
                    name: n, logo: l, upi: u, timestamp: new Date() 
                });
                shops.push({ id: docRef.id, name: n, logo: l, upi: u });
                $("newShopName").value = ""; $("newShopImage").value = ""; $("newShopUPI").value = "";
                renderAdmin();
                renderShopsPage();
                alert("Nai dukaan add ho gayi!");
            }
        } catch(e) { console.error(e); alert("Error adding shop!"); }
        $("addShopBtn").textContent = "+ Add Shop";
    };
}

function renderCatMgmt() {
  const list = $("catMgmtList");
  list.innerHTML = "";
  
  mainCategories.forEach((cat) => {
    const card = document.createElement("div");
    card.className = "cat-mgmt-card";
    
    card.innerHTML = `
      <div class="cat-mgmt-head">
        <span>${cat.name}</span>
        <div><button class="edit-cat-btn">Edit</button></div>
      </div>
      <div class="cat-sub-section">
        <div class="cat-sub-label">SUB-CATEGORIES</div>
        <div class="chips" id="subChips_${cat.id}"></div>
        <div class="inline-row">
          <input class="field sub-inp" id="subInp_${cat.id}" placeholder="Sub-category naam" />
          <button class="btn-primary sm-btn auth-submit" data-id="${cat.id}">+ Add</button>
        </div>
      </div>
    `;
    
    const chipsEl = card.querySelector(`#subChips_${cat.id}`);
    
    (cat.subCategories || []).forEach(sub => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.innerHTML = `${sub}<button class="chip-btn edt">✏️</button><button class="chip-btn del">✕</button>`;
      
      chip.querySelector(".edt").onclick = () => {
        const n = prompt(`"${sub}" ka naya naam:`, sub);
        if (!n || !n.trim()) return;
        const idx = cat.subCategories.indexOf(sub);
        if (idx > -1) {
          cat.subCategories[idx] = n.trim().toUpperCase();
        }
        saveCategories();
        renderAdmin();
        if (activeMainCatId === cat.id) {
          activeSubCat = "All";
          renderSubCats();
          renderProducts();
        }
      };
      
      chip.querySelector(".del").onclick = () => {
        if (!confirm(`"${sub}" delete karein?`)) return;
        cat.subCategories = cat.subCategories.filter(x => x !== sub);
        saveCategories();
        renderAdmin();
        if (activeMainCatId === cat.id) {
          activeSubCat = "All";
          renderSubCats();
          renderProducts();
        }
      };
      
      chipsEl.appendChild(chip);
    });
    
    card.querySelector(".btn-primary").onclick = () => {
      const inp = card.querySelector(`#subInp_${cat.id}`);
      const v = inp.value.trim().toUpperCase();
      if (!v) return;
      if ((cat.subCategories || []).some(x => x.toUpperCase() === v)) {
        alert("Sub-category exists!");
        return;
      }
      cat.subCategories = [...(cat.subCategories || []), v];
      saveCategories();
      inp.value = "";
      renderAdmin();
      if (activeMainCatId === cat.id) renderSubCats();
    };
    
    card.querySelector(".edit-cat-btn").onclick = () => {
      const n = prompt(`"${cat.name}" ka naya naam:`, cat.name);
      if (!n || !n.trim()) return;
      cat.name = n.trim().toUpperCase();
      saveCategories();
      renderAdmin();
      renderMainCats();
    };
    
    list.appendChild(card);
  });
}

function syncAddProductDropdowns() {
  const pMainCat = $("pMainCat");
  pMainCat.innerHTML = "";
  
  mainCategories.forEach((cat) => {
    const o = document.createElement("option");
    o.value = cat.id;
    o.textContent = cat.name;
    pMainCat.appendChild(o);
  });

  // SYNC SHOP DROPDOWN IN ADMIN PRODUCT ADD
  const pShop = $("pShop");
  if(pShop) {
      pShop.innerHTML = '<option value="">K_K Fashion (Default Store)</option>';
      shops.forEach(s => {
          const o = document.createElement("option");
          o.value = s.id;
          o.textContent = s.name;
          pShop.appendChild(o);
      });
  }
}

window.renderAdminOrders = function (orders) {
  const list = $("adminOrdersList");
  if (!list) return;
  
  list.innerHTML = "";

  const filteredOrders = orders.filter(o => (o.status || 'Recent') === activeAdminOrderTab);

  if (filteredOrders.length === 0) {
      list.innerHTML = `<p class="empty" style="padding: 20px;">No ${activeAdminOrderTab} orders found.</p>`;
      return;
  }
  
  filteredOrders.forEach((o) => {
    const div = document.createElement("div");
    div.className = "admin-order-card";

    let itemsHtml = (o.items || []).map(i => {
       const img = Array.isArray(i.product.image) ? i.product.image[0] : i.product.image;
       return `<div class="order-item-row" style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                 <img src="${img}" style="width:40px; height:40px; border-radius:6px; object-fit:cover; border:1px solid var(--border);">
                 <div style="font-size:12px; color:var(--fg);">${i.product.name} <strong style="color:var(--primary);">(x${i.qty})</strong></div>
               </div>`;
    }).join("");
    
    div.innerHTML = `
      <div class="order-head">
        <span>Name: ${o.name} (${o.mobile})</span>
        <strong>₹${o.totalAmount}</strong>
      </div>
      <div style="font-size:12px; color:var(--muted2); margin:8px 0; line-height:1.5;">
        <strong>Address:</strong> ${o.address}<br>
        ${o.landmark ? '<strong>Landmark:</strong> ' + o.landmark + '<br>' : ''}
        <strong>State & Pincode:</strong> ${o.state} - ${o.pincode}
      </div>
      
      <div class="order-items" style="background:var(--card); padding:10px; border-radius:8px; margin-bottom:10px;">
        ${itemsHtml}
      </div>

      <div class="order-actions" style="display:flex; justify-content: space-between; align-items: center; margin-top:10px; border-top:1px solid var(--border); padding-top:10px;">
        <select class="field small-field status-select" data-id="${o.id}" style="padding:6px; margin-bottom:0;">
          <option value="Recent" ${o.status === 'Recent' ? 'selected' : ''}>Recent</option>
          <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Completed" ${o.status === 'Completed' ? 'selected' : ''}>Completed</option>
        </select>
        
        <button class="del-order-btn" data-id="${o.id}">🗑️ Delete Order</button>
      </div>
    `;
    
    div.querySelector(".status-select").onchange = async (e) => {
      const newStatus = e.target.value;
      if (window.updateOrderStatusInFirebase) {
        await window.updateOrderStatusInFirebase(o.id, newStatus);
        o.status = newStatus;
        window.renderAdminOrders(window.allFirebaseOrders);
      }
    };
    
    div.querySelector(".del-order-btn").onclick = async () => {
      if(confirm("Are you sure you want to permanently delete this order?")) {
          if (window.deleteOrderFromFirebase) {
              await window.deleteOrderFromFirebase(o.id);
              window.allFirebaseOrders = window.allFirebaseOrders.filter(x => x.id !== o.id);
              window.renderAdminOrders(window.allFirebaseOrders);
          }
      }
    };
    
    list.appendChild(div);
  });
};

function renderAdminProducts() {
  $("adminProdTitle").textContent = `Products (${products.length})`;
  const filterCat = $("adminFilterCat").value || "ALL";
  const list = $("adminProducts");
  list.innerHTML = "";
  
  const filtered = filterCat === "ALL" ? products : products.filter(p => p.mainCategoryId === filterCat);
  
  filtered.forEach(p => {
    const price = finalPrice(p);
    const inStock = p.inStock !== false;
    const cat = getCat(p.mainCategoryId);
    const catName = cat ? cat.name : "—";
    const subLabel = p.subCategory ? ` · ${p.subCategory}` : "";
    const mainImg = (Array.isArray(p.image) && p.image.length > 0) ? p.image[0] : "placeholder.jpg";
    
    const el = document.createElement("div");
    el.className = "admin-prod";
    
    el.innerHTML = `
      <img src="${mainImg}" alt="${p.name}" />
      <div class="ap-info">
        <div class="ap-name">${p.name}</div>
        <div class="ap-sub">${catName}${subLabel}</div>
        <div class="ap-price">₹${price} ${p.discount > 0 ? `(${p.discount}% off)` : ''} · <span style="color:${inStock ? '#4cc968' : '#e05555'}">${inStock ? 'In Stock' : 'Out of Stock'}</span></div>
      </div>
      <div class="ap-actions">
        <button class="edit-btn">✏️</button>
        <button class="trash">🗑️</button>
      </div>
    `;
    
    el.querySelector(".edit-btn").onclick = () => openEditModal(p);
    
    el.querySelector(".trash").onclick = () => {
      if (!confirm("Delete this product?")) return;
      products = products.filter(x => x.id !== p.id);
      renderProducts();
      renderAdmin();
      if (window.deleteProductFromFirebase) {
        window.deleteProductFromFirebase(p.id);
      }
    };
    
    list.appendChild(el);
  });
}

window.renderAdmin = function () {
  renderCatMgmt();
  syncAddProductDropdowns();
  
  if ($("adminFilterCat")) {
    const sel = $("adminFilterCat");
    sel.innerHTML = '<option value="ALL">All Categories</option>';
    mainCategories.forEach(cat => {
      const o = document.createElement("option");
      o.value = cat.id;
      o.textContent = cat.name;
      sel.appendChild(o);
    });
  }

  // NEW: RENDER SHOPS LIST IN ADMIN
  const slist = $("adminShopsList");
  if(slist) {
      slist.innerHTML = "";
      shops.forEach(s => {
          const d = document.createElement("div");
          d.className = "admin-prod";
          d.innerHTML = `
              <img src="${s.logo || 'placeholder.jpg'}" alt="${s.name}" />
              <div class="ap-info">
                  <div class="ap-name">${s.name}</div>
                  <div class="ap-sub" style="color:var(--primary); font-size:10px;">UPI: ${s.upi}</div>
              </div>
              <div class="ap-actions">
                  <button class="trash del-shop" data-id="${s.id}">🗑️</button>
              </div>
          `;
          d.querySelector('.del-shop').onclick = async () => {
              if(confirm("Delete this Shop completely?")) {
                  if(window.fbDeleteDoc && window.fbDoc && window.fbDb) {
                      await window.fbDeleteDoc(window.fbDoc(window.fbDb, "shops", s.id));
                      shops = shops.filter(x => x.id !== s.id);
                      renderAdmin();
                      renderShopsPage();
                  }
              }
          };
          slist.appendChild(d);
      });
  }
  
  renderAdminProducts();
  
  if ($("updatePinBtn")) {
    $("updatePinBtn").onclick = () => {
      alert("PIN change option is securely hardcoded to 0000 for elite security.");
    };
  }
  
  if (window.fetchOrdersFromFirebase) {
    window.fetchOrdersFromFirebase();
  }
};

function openEditModal(p) {
  editingProductId = p.id;
  $("editPName").textContent = p.name;
  
  let imgArray = Array.isArray(p.image) ? p.image : [p.image];
  $("editPImage").value = imgArray.join(", ");
  
  $("editPPrice").value = p.price;
  $("editPDiscount").value = p.discount || 0;
  $("editPExtra").value = p.extra || 0;
  
  const inStock = p.inStock !== false;
  $("editInStock").checked = inStock;
  
  const lbl = $("editStockLabel");
  lbl.textContent = inStock ? "In Stock" : "Out of Stock";
  lbl.className = "stock-label " + (inStock ? "in" : "out");
  
  $("editModal").classList.remove("hidden");
}

if ($("editInStock")) {
  $("editInStock").addEventListener("change", function () {
    const lbl = $("editStockLabel");
    lbl.textContent = this.checked ? "In Stock" : "Out of Stock";
    lbl.className = "stock-label " + (this.checked ? "in" : "out");
  });
}

if ($("editClose")) {
  $("editClose").onclick = () => {
    $("editModal").classList.add("hidden");
    editingProductId = null;
  };
}

if ($("saveEditBtn")) {
  $("saveEditBtn").onclick = () => {
    if (!editingProductId) return;
    
    const newPrice = Number($("editPPrice").value);
    const newDiscount = Number($("editPDiscount").value) || 0;
    const newExtra = Number($("editPExtra").value) || 0;
    const newInStock = $("editInStock").checked;
    const rawImage = $("editPImage").value.trim();
    const newImgArray = rawImage.split(",").map(s => s.trim()).filter(Boolean);
    
    if (!newPrice || newPrice <= 0 || newImgArray.length === 0) {
      alert("Sahi Image aur Price daalein!");
      return;
    }
    
    const idx = products.findIndex(p => p.id === editingProductId);
    
    if (idx > -1) {
      products[idx] = {
        ...products[idx],
        image: newImgArray,
        price: newPrice,
        discount: newDiscount,
        extra: newExtra,
        inStock: newInStock
        // SHOP ID PRESERVED AS IS
      };
      renderProducts();
      renderAdmin();
    }
    
    if (window.updateProductInFirebase) {
      window.updateProductInFirebase(editingProductId, {
        imageUrl: newImgArray,
        price: newPrice,
        discount: newDiscount,
        extra: newExtra,
        inStock: newInStock
      });
    }
    
    $("editModal").classList.add("hidden");
    editingProductId = null;
  };
}

$("closeViewerBtn").onclick = () => {
  $("imageViewer").classList.add("hidden");
  preventZoom();
};

$("imageViewer").onclick = (e) => {
  if (e.target === $("imageViewer") || e.target === $("fullImage")) {
    $("imageViewer").classList.add("hidden");
    preventZoom();
  }
};

preventZoom();
renderCartCount();
