/* ═══════════════════════════════════════════════════════
   K_K FASHION — app.js (FINAL - FULL NAVIGATION & SHIPROCKET TRACKING)
   (Expanded & Properly Formatted Version)
═══════════════════════════════════════════════════════ */

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

const ADMIN_PIN = "0000"; // SECURITY ADMIN ACCESS LOGIC PIN
let mainCategories = [];
let products = [];
let cart = load("knk_cart", []);
let myOrders = load("knk_my_orders", []);
let activeMainCatId = null;
let activeSubCat = "All";
let editingProductId = null;
let searchQuery = "";
let currentDetailProduct = null;
let isAppInitialized = false;
let runtimeSkipped = false;

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
    });
  }
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
  
  if ($("nav" + tab)) {
    $("nav" + tab).classList.add("active");
  }

  if (tab === 'Order') {
    $("navOrderWrap").classList.add("active");
  } else {
    $("navOrderWrap").classList.remove("active");
  }

  $("homeContent").classList.add("hidden");
  $("contactPage").classList.add("hidden");
  $("orderPage").classList.add("hidden");
  $("cartPage").classList.add("hidden");
  $("profilePage").classList.add("hidden");

  if (tab === 'Home') $("homeContent").classList.remove("hidden");
  if (tab === 'Contact') $("contactPage").classList.remove("hidden");
  if (tab === 'Order') {
    $("orderPage").classList.remove("hidden");
    renderMyOrders();
  }
  if (tab === 'Cart') {
    $("cartPage").classList.remove("hidden");
    renderCartPageTab();
  }
  if (tab === 'Profile') {
    $("profilePage").classList.remove("hidden");
    renderProfile();
  }

  window.scrollTo(0, 0);
};

// USER ORDERS LIST (WITH SHIPROCKET Live REDIRECT DETECT)
function renderMyOrders() {
  const list = $("myOrdersList");
  if (!myOrders || myOrders.length === 0) {
    list.innerHTML = `<div style="text-align:center; padding:40px 10px; color:var(--muted); font-size:13px;">Aapne abhi tak koi order place nahi kiya hai.</div>`;
    return;
  }

  let html = "";
  myOrders.forEach((o) => {
    const dateStr = new Date(o.savedAt || Date.now()).toLocaleDateString();
    let thumb = "placeholder.jpg";
    if (o.items && o.items.length > 0) {
      const pImg = o.items[0].product.image;
      thumb = Array.isArray(pImg) ? pImg[0] : pImg;
    }

    html += `
    <div class="mo-card" onclick="openMyOrderModal('${o.savedAt}')">
      <div class="mo-head">
        <span style="font-weight:700; color:var(--primary); font-size:15px;">₹${o.totalAmount}</span>
        <span class="mo-status">${o.status || 'Processing'}</span>
      </div>
      <div class="mo-body" style="display:flex; gap:12px; align-items:center;">
         <img src="${thumb}" style="width:60px; height:60px; object-fit:cover; border-radius:8px; border:1px solid var(--border);">
         <div style="flex:1;">
           <strong style="color:var(--fg); font-size:13px;">Date: ${dateStr}</strong><br>
           <span style="color:var(--primary); font-size:12px; font-weight:600;">${o.items.length} Item(s) • Tap to view tracking</span>
         </div>
      </div>
    </div>`;
  });
  list.innerHTML = html;
}

window.openMyOrderModal = function (idStr) {
  const o = myOrders.find((x) => x.savedAt.toString() === idStr.toString());
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

  const dateStr = new Date(o.savedAt || Date.now()).toLocaleString();
  const payMode = o.paymentMethod === "COD" ? "Cash on Delivery" : "Prepaid Online";

  // SHIPROCKET LIVE TRACK BUTTON INJECTION LOGIC
  let trackingButtonHtml = "";
  if (o.trackingLink && o.trackingLink.trim() !== "") {
    trackingButtonHtml = `
      <a href="${o.trackingLink.trim()}" target="_blank" class="btn-primary full" style="background:#25D366; color:#000; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px; text-decoration:none; margin-top:15px; padding:12px; border-radius:10px; font-size:14px; box-shadow: 0 4px 12px rgba(37,211,102,0.2);">
        🚚 Track Live Order (Shiprocket)
      </a>`;
  }

  $("myOrderDetailBody").innerHTML = `
    <div style="margin-bottom:15px; background:var(--bg2); padding:12px; border-radius:10px; border:1px solid var(--border);">
       <div style="color:var(--primary); font-weight:700; margin-bottom:6px; font-size:14px;">Status: ${o.status || 'Processing'}</div>
       <div style="font-size:12px; color:var(--muted2);">Order Date: ${dateStr}</div>
       <div style="font-size:12px; color:var(--muted2); margin-top:4px;">Payment: ${payMode}</div>
    </div>
    
    <h3 style="font-size:14px; margin-bottom:10px; color:var(--fg); font-family:var(--font-body); font-weight:600;">Items Details</h3>
    ${itemsHtml}

    <h3 style="font-size:14px; margin:15px 0 10px; color:var(--fg); font-family:var(--font-body); font-weight:600;">Delivery Address</h3>
    <div style="font-size:13px; color:var(--muted); line-height:1.5; background:var(--bg2); padding:10px; border-radius:8px;">
       <strong style="color:var(--fg);">${o.name}</strong> (${o.mobile})<br>
       ${o.address}<br>
       ${o.state} - ${o.pincode}
    </div>

    ${trackingButtonHtml}

    <div style="margin-top:20px; border-top:1px dashed var(--border); padding-top:15px;">
       <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:13px;"><span>Paid Online:</span> <span>₹${o.amountPaid}</span></div>
       <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:13px;"><span>Balance Due (COD):</span> <span style="color:var(--destructive);">₹${o.balanceDue}</span></div>
       <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:16px; font-weight:700; color:var(--primary);"><span>Total Amount:</span> <span>₹${o.totalAmount}</span></div>
    </div>
  `;

  $("myOrderDetailModal").classList.remove("hidden");
  lockScroll();
};

/* ════════════════════════════════════
   CART PAGE TAB CONSOLE ACTIONS
════════════════════════════════════ */
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

/* ════════════════════════════════════
   PROFILE TAB & SECURE AVATAR TRIGGER
════════════════════════════════════ */
function renderProfile() {
  const user = window.fbAuth ? window.fbAuth.currentUser : null;
  const displayObj = $("profileDisplayId");
  const nameObj = $("profileDisplayName");
  const imgObj = $("profileImg");

  const savedPic = localStorage.getItem("knk_profile_pic");

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

  // SECURE TRIGGERS ON PROFILE PHOTO AVATAR TO OPEN MANAGEMENT CONSOLE
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
          localStorage.setItem("knk_profile_pic", dataUrl);
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
    const subList = products.filter((p) => p.id !== currentProduct.id && p.subCategory === currentProduct.subCategory);
    if (subList.length > 0) {
      container.appendChild(buildHorizSection("More from " + currentProduct.subCategory, subList));
    }
  }
  
  const sameMainList = products.filter((p) => p.id !== currentProduct.id && p.mainCategoryId === currentProduct.mainCategoryId && (currentProduct.subCategory ? p.subCategory !== currentProduct.subCategory : true));
  
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
    `;
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
}

// SHIPROCKET LOGIC INTEGRATION IN ADMIN CARD VIEW LIST
window.renderAdminOrders = function (orders) {
  const list = $("adminOrdersList");
  if (!list) return;
  
  list.innerHTML = "";
  
  orders.forEach((o) => {
    const div = document.createElement("div");
    div.className = "admin-order-card";
    div.innerHTML = `
      <div class="order-head">
        <span>Name: ${o.name} (${o.mobile})</span>
        <strong>₹${o.totalAmount}</strong>
      </div>
      <div style="font-size:12px; color:var(--muted2); margin:5px 0;">
        Address: ${o.address}
      </div>
      <div class="order-actions" style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
        <input type="text" id="trackInp_${o.id}" class="field" style="margin-bottom:0; padding:6px; font-size:12px;" placeholder="Paste Shiprocket Tracking URL" value="${o.trackingLink || ''}">
        <div style="display:flex; gap:10px;">
          <button class="btn-primary sm-btn save-track-btn" style="padding:6px 12px; font-size:12px;" data-id="${o.id}">Save Tracking</button>
          <select class="field small-field status-select" data-id="${o.id}" style="padding:4px;">
            <option value="Recent" ${o.status === 'Recent' ? 'selected' : ''}>Recent</option>
            <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Completed" ${o.status === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>
        </div>
      </div>
    `;
    
    div.querySelector(".save-track-btn").onclick = () => {
      const linkVal = $("trackInp_" + o.id).value.trim();
      if (window.updateOrderTrackingInFirebase) {
        window.updateOrderTrackingInFirebase(o.id, linkVal);
      }
    };
    
    list.appendChild(div);
  });
};

function openEditModal(p) {
  editingProductId = p.id;
  $("editModal").classList.remove("hidden");
}

$("editClose").onclick = () => {
  $("editModal").classList.add("hidden");
};

$("closeViewerBtn").onclick = () => {
  $("imageViewer").classList.add("hidden");
  preventZoom();
};

preventZoom();
renderCartCount();
