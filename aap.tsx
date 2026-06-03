import { useState, useEffect, useRef, useCallback } from "react";

const WHATSAPP_NUMBER = "9950701758";
const ADMIN_PIN = "8619";

const DEFAULT_CATEGORIES = ["Combos", "T-Shirt", "Shirt", "Pant"];
const SAMPLE_PRODUCTS = [
  { id: "p1", name: "Classic White T-Shirt", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80", price: 599, discount: 20, extra: 0, category: "T-Shirt" },
  { id: "p2", name: "Denim Casual Shirt", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80", price: 1299, discount: 15, extra: 49, category: "Shirt" },
  { id: "p3", name: "Slim Fit Pant", image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80", price: 999, discount: 10, extra: 0, category: "Pant" },
  { id: "p4", name: "Shirt + Pant Combo", image: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=600&q=80", price: 1999, discount: 25, extra: 99, category: "Combos" },
  { id: "p5", name: "Black Polo T-Shirt", image: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=600&q=80", price: 799, discount: 10, extra: 0, category: "T-Shirt" },
  { id: "p6", name: "Formal Linen Shirt", image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80", price: 1499, discount: 20, extra: 49, category: "Shirt" },
];

interface Product {
  id: string; name: string; image: string;
  price: number; discount: number; extra: number; category: string;
}
interface CartItem { product: Product; qty: number; }

function load<T>(k: string, fb: T): T {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; }
}
function save<T>(k: string, v: T) { localStorage.setItem(k, JSON.stringify(v)); }
const finalPrice = (p: Product) => Math.round(p.price - (p.price * p.discount) / 100 + p.extra);
const uid = () => "p" + Date.now() + Math.floor(Math.random() * 1000);

interface Particle {
  id: number; x: number; y: number; angle: number; speed: number;
  size: number; opacity: number; color: string; life: number; maxLife: number;
}
const SPARK_COLORS = ["#f5e090","#C9A84C","#e8d08a","#ffe4a0","#d4a843","#ffd060","#c8a050","#f0d070","#b8901a","#ffc840","#e8c858"];

function useParticles(active: boolean) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextId = useRef(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    if (!active) { setParticles([]); return; }
    let lastSpawn = 0;
    const tick = (now: number) => {
      setParticles((prev) => {
        let next = prev.map((p) => ({ ...p, life: p.life - 16, x: p.x + Math.cos(p.angle) * p.speed, y: p.y + Math.sin(p.angle) * p.speed, opacity: p.opacity * 0.97, speed: p.speed * 0.97 })).filter((p) => p.life > 0 && p.opacity > 0.01);
        if (now - lastSpawn > 40) {
          lastSpawn = now;
          const count = Math.floor(Math.random() * 3) + 2;
          for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 60 + Math.random() * 40;
            next = [...next, { id: nextId.current++, x: 100 + Math.cos(angle) * dist, y: 100 + Math.sin(angle) * dist, angle: angle + (Math.random() - 0.5) * 1.2, speed: 0.8 + Math.random() * 2.2, size: 1 + Math.random() * 3.5, opacity: 0.6 + Math.random() * 0.4, color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)], life: 500 + Math.random() * 700, maxLife: 1200 }];
          }
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);
  return particles;
}

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"welcome" | "promise" | "fade">("welcome");
  const particles = useParticles(phase !== "fade");
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("promise"), 2000);
    const t2 = setTimeout(() => setPhase("fade"), 3600);
    const t3 = setTimeout(onDone, 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);
  const basePath = import.meta.env.BASE_URL;
  const logoSrc = basePath.endsWith("/") ? basePath + "kk-logo.png" : basePath + "/kk-logo.png";
  return (
    <div className="splash-root" style={{ opacity: phase === "fade" ? 0 : 1, transition: "opacity 0.6s ease" }}>
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:400, height:400, pointerEvents:"none", zIndex:1, overflow:"visible" }}>
        <svg width="400" height="400" viewBox="0 0 400 400" overflow="visible" style={{ display:"block" }}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {particles.map((p) => <circle key={p.id} cx={p.x+100} cy={p.y+100} r={p.size} fill={p.color} opacity={p.opacity} filter="url(#glow)"/>)}
        </svg>
      </div>
      <div className="splash-content">
        <div className="splash-phase" style={{ opacity: phase==="welcome"?1:0, transform: phase==="welcome"?"translateY(0)":"translateY(-24px)", transition:"opacity 0.5s ease, transform 0.5s ease", pointerEvents:"none" }}>
          <p className="splash-welcome">Welcome</p>
          <div className="splash-logo-wrap">
            <div className="splash-logo-ring"/>
            <img src={logoSrc} alt="K_K Fashion" className="splash-logo-img" width={200} height={200}/>
          </div>
          <p className="splash-tagline-sub">Trustable Fashion</p>
        </div>
        <div className="splash-phase splash-phase-promise" style={{ opacity: phase==="promise"?1:0, transform: phase==="promise"?"translateY(0) scale(1)":"translateY(30px) scale(0.93)", transition:"opacity 0.55s ease, transform 0.55s cubic-bezier(0.16,1,0.3,1)", pointerEvents:"none" }}>
          <div className="splash-promise-line"/>
          <p className="splash-promise">Your Style,</p>
          <p className="splash-promise splash-promise-2">Our Promise</p>
          <div className="splash-promise-line"/>
        </div>
      </div>
    </div>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [categories, setCategories] = useState<string[]>(() => load("knk_categories", DEFAULT_CATEGORIES));
  const [products, setProducts] = useState<Product[]>(() => load("knk_products", SAMPLE_PRODUCTS));
  const [cart, setCart] = useState<CartItem[]>(() => load("knk_cart", []));
  const [activeCat, setActiveCat] = useState("All");
  const [cartOpen, setCartOpen] = useState(false);
  const [adminPinOpen, setAdminPinOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [newCat, setNewCat] = useState("");
  const [pName, setPName] = useState(""); const [pImage, setPImage] = useState("");
  const [pPrice, setPPrice] = useState(""); const [pDiscount, setPDiscount] = useState("");
  const [pExtra, setPExtra] = useState(""); const [pCategory, setPCategory] = useState("");
  const [cartGlow, setCartGlow] = useState(false);

  useEffect(() => { save("knk_categories", categories); }, [categories]);
  useEffect(() => { save("knk_products", products); }, [products]);
  useEffect(() => { save("knk_cart", cart); }, [cart]);

  const addToCart = useCallback((p: Product) => {
    setCart((prev) => { const found = prev.find((i) => i.product.id === p.id); if (found) return prev.map((i) => i.product.id === p.id ? { ...i, qty: i.qty+1 } : i); return [...prev, { product: p, qty: 1 }]; });
    setCartGlow(true); setTimeout(() => setCartGlow(false), 600);
  }, []);
  const removeFromCart = useCallback((id: string) => { setCart((prev) => prev.filter((i) => i.product.id !== id)); }, []);
  const clearCart = useCallback(() => setCart([]), []);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + finalPrice(i.product) * i.qty, 0);
  const filteredProducts = activeCat === "All" ? products : products.filter((p) => p.category === activeCat);

  const handleLogoTap = () => {
    tapCount.current++;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 7) { tapCount.current = 0; setAdminPinOpen(true); }
    else { tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 1200); }
  };
  const tryUnlock = () => {
    if (pin === ADMIN_PIN) { setAdminPinOpen(false); setPin(""); setPinError(false); setAdminOpen(true); }
    else { setPinError(true); setTimeout(() => setPinError(false), 800); }
  };
  const addCategory = () => {
    const v = newCat.trim(); if (!v) return;
    if (!categories.some((x) => x.toLowerCase() === v.toLowerCase())) setCategories((prev) => [...prev, v]);
    setNewCat("");
  };
  const addProduct = () => {
    const name = pName.trim(); const image = pImage.trim(); const price = Number(pPrice);
    if (!name || !image || !price) return;
    setProducts((prev) => [{ id: uid(), name, image, price, discount: Number(pDiscount)||0, extra: Number(pExtra)||0, category: pCategory||categories[0]||"Other" }, ...prev]);
    setPName(""); setPImage(""); setPPrice(""); setPDiscount(""); setPExtra("");
  };
  const checkoutWhatsApp = () => {
    if (cart.length === 0) return;
    const lines = cart.map((i) => `${i.product.name} x${i.qty} = ₹${finalPrice(i.product)*i.qty}`).join("%0A");
    window.open(`https://wa.me/91${WHATSAPP_NUMBER}?text=Hello! My order:%0A${lines}%0A%0ATotal: ₹${cartTotal}`, "_blank");
  };
  const buyNow = (p: Product) => {
    const text = encodeURIComponent(`Hello! I want to buy: ${p.name} - ₹${finalPrice(p)}`);
    window.open(`https://wa.me/91${WHATSAPP_NUMBER}?text=${text}`, "_blank");
  };

  const basePath = import.meta.env.BASE_URL;
  const logoSrc = basePath.endsWith("/") ? basePath + "kk-logo.png" : basePath + "/kk-logo.png";

  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)}/>}
      <div className={`app-root ${splashDone ? "app-visible" : "app-hidden"}`}>
        <header className="header">
          <button className="logo-btn" onClick={handleLogoTap} aria-label="Store logo">
            <span className="brand-mark">K_K</span>
            <span className="brand-name">Fashion</span>
          </button>
          <button className="icon-btn cart-btn" onClick={() => setCartOpen(true)} aria-label="Open cart" style={{ color: cartGlow ? "#C9A84C" : undefined, transition:"color 0.3s" }}>
            <CartIcon/>
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </button>
        </header>
        <div className="cats-wrap">
          <div className="cats">
            {["All", ...categories].map((c, i) => (
              <button key={c} className={`cat${c===activeCat?" active":""}`} style={{ animationDelay:`${i*0.06}s` }} onClick={() => setActiveCat(c)}>{c}</button>
            ))}
          </div>
        </div>
        <main className="main-content">
          <h2 className="section-title">{activeCat}</h2>
          {filteredProducts.length === 0 ? <p className="empty">No products here yet.</p> : (
            <div className="grid">
              {filteredProducts.map((p, i) => (
                <div key={p.id} className="product-card" style={{ animationDelay:`${i*0.07}s` }}>
                  <img src={p.image} alt={p.name} loading="lazy"/>
                  <div className="card-info">
                    <div className="card-name">{p.name}</div>
                    <div className="price-row">
                      <span className="price">&#8377;{finalPrice(p)}</span>
                      {p.discount > 0 && <><span className="strike">&#8377;{p.price}</span><span className="off">{p.discount}% off</span></>}
                    </div>
                    <div className="btn-row">
                      <button className="btn-outline" onClick={() => addToCart(p)}>🛒 Cart</button>
                      <button className="btn-primary" onClick={() => buyNow(p)}>💬 Buy</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {cartOpen && (
        <div className="overlay" onClick={(e) => { if (e.target===e.currentTarget) setCartOpen(false); }}>
          <div className="drawer">
            <div className="drawer-head"><h2>Your Cart</h2><button className="icon-btn" onClick={() => setCartOpen(false)}>✕</button></div>
            <div className="drawer-body">
              {cart.length === 0 ? <p className="empty">Cart is empty</p> : cart.map((i) => (
                <div key={i.product.id} className="cart-item">
                  <img src={i.product.image} alt={i.product.name}/>
                  <div className="ci-info"><div className="ci-name">{i.product.name}</div><div className="ci-sub">&#8377;{finalPrice(i.product)} × {i.qty}</div></div>
                  <button className="trash" onClick={() => removeFromCart(i.product.id)}>🗑️</button>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="drawer-foot">
                <div className="total"><span>Total</span><span>&#8377;{cartTotal}</span></div>
                <button className="btn-primary full" onClick={checkoutWhatsApp}>Order on WhatsApp</button>
                <button className="link-btn" onClick={clearCart}>Clear cart</button>
              </div>
            )}
          </div>
        </div>
      )}

      {adminPinOpen && (
        <div className="overlay center">
          <div className="pin-box">
            <button className="icon-btn close-abs" onClick={() => { setAdminPinOpen(false); setPin(""); setPinError(false); }}>✕</button>
            <div className="lock-icon">🔒</div>
            <h2>Admin Login</h2><p>Enter PIN to continue</p>
            <input type="password" inputMode="numeric" placeholder="••••" className={`pin-input${pinError?" pin-error":""}`} value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => { if (e.key==="Enter") tryUnlock(); }} autoFocus/>
            {pinError && <p className="error-msg">Wrong PIN</p>}
            <button className="btn-primary" style={{ width:160, marginTop:16 }} onClick={tryUnlock}>Unlock</button>
          </div>
        </div>
      )}

      {adminOpen && (
        <div className="admin-panel">
          <div className="admin-inner">
            <div className="drawer-head"><h2>Admin Panel</h2><button className="icon-btn" onClick={() => setAdminOpen(false)}>✕</button></div>
            <section className="admin-card">
              <h3>Categories</h3>
              <div className="chips">
                {categories.map((c) => (
                  <span key={c} className="chip">{c}<button onClick={() => { setCategories((prev) => prev.filter((x) => x!==c)); setProducts((prev) => prev.filter((p) => p.category!==c)); }}>🗑️</button></span>
                ))}
              </div>
              <div className="row"><input className="field" placeholder="New category" value={newCat} onChange={(e) => setNewCat(e.target.value)}/><button className="btn-primary" onClick={addCategory}>+ Add</button></div>
            </section>
            <section className="admin-card">
              <h3>Add Product</h3>
              <input className="field" placeholder="Product name" value={pName} onChange={(e) => setPName(e.target.value)}/>
              <input className="field" placeholder="Image URL" value={pImage} onChange={(e) => setPImage(e.target.value)}/>
              <div className="row3">
                <input className="field" type="number" placeholder="Price" value={pPrice} onChange={(e) => setPPrice(e.target.value)}/>
                <input className="field" type="number" placeholder="Discount %" value={pDiscount} onChange={(e) => setPDiscount(e.target.value)}/>
                <input className="field" type="number" placeholder="Extra ₹" value={pExtra} onChange={(e) => setPExtra(e.target.value)}/>
              </div>
              <select className="field" value={pCategory} onChange={(e) => setPCategory(e.target.value)}>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select>
              <button className="btn-primary full" onClick={addProduct}>Add Product</button>
            </section>
            <section className="admin-card">
              <h3>Products ({products.length})</h3>
              {products.map((p) => (
                <div key={p.id} className="admin-prod">
                  <img src={p.image} alt={p.name}/>
                  <div className="ap-info"><div className="ap-name">{p.name}</div><div className="ap-sub">{p.category} · &#8377;{p.price}</div></div>
                  <button className="trash" onClick={() => setProducts((prev) => prev.filter((x) => x.id!==p.id))}>🗑️</button>
                </div>
              ))}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
