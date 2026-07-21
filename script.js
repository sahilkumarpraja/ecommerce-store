(function () {
  "use strict";

  const CFG = window.STORE_CONFIG || {};
  const PRODUCTS = window.PRODUCTS || [];
  const CUR = CFG.currency || "₹";
  const STORAGE_KEY = "luxecart_cart_v1";

  /* ---------- State ---------- */
  let cart = loadCart();
  let activeFilter = "all";
  let searchTerm = "";
  let sortBy = "featured";

  /* ---------- Elements ---------- */
  const $ = (sel) => document.querySelector(sel);
  const grid = $("#grid");
  const emptyMsg = $("#empty");
  const searchInput = $("#search");
  const sortSelect = $("#sort");
  const filterRow = $("#filterRow");
  const cartCount = $("#cartCount");
  const cartItemsEl = $("#cartItems");
  const subtotalEl = $("#subtotal");
  const drawer = $("#drawer");
  const overlay = $("#overlay");
  const toast = $("#toast");

  /* ---------- Helpers ---------- */
  function money(n) { return CUR + Number(n).toLocaleString("en-IN"); }

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch (_) { return {}; }
  }
  function saveCart() { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function findProduct(id) { return PRODUCTS.find((p) => p.id === id); }

  /* ---------- Rendering products ---------- */
  function getVisibleProducts() {
    let list = PRODUCTS.filter((p) => {
      const matchCat = activeFilter === "all" || p.category === activeFilter;
      const matchSearch = p.name.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm);
      return matchCat && matchSearch;
    });
    if (sortBy === "low") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "high") list.sort((a, b) => b.price - a.price);
    else if (sortBy === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }

  function renderProducts() {
    const list = getVisibleProducts();
    emptyMsg.hidden = list.length !== 0;
    grid.innerHTML = list.map(productCard).join("");
  }

  function productCard(p) {
    const media = p.image
      ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='grid';" />
         <div class="emoji-fallback" style="display:none">${p.emoji || "🛍️"}</div>`
      : `<div class="emoji-fallback">${p.emoji || "🛍️"}</div>`;
    const tag = p.tag ? `<span class="tag">${escapeHtml(p.tag)}</span>` : "";
    return `
      <article class="card">
        <div class="card-media">${tag}${media}</div>
        <div class="card-body">
          <span class="card-cat">${escapeHtml(p.category)}</span>
          <h3 class="card-name">${escapeHtml(p.name)}</h3>
          <div class="card-rating">★ ${p.rating.toFixed(1)}</div>
          <div class="card-foot">
            <span class="price">${money(p.price)}</span>
            <button class="add-btn" data-add="${p.id}">Add to cart</button>
          </div>
        </div>
      </article>`;
  }

  /* ---------- Cart operations ---------- */
  function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    updateCartUI();
    const p = findProduct(id);
    showToast(`${p ? p.name : "Item"} added to cart`);
  }
  function changeQty(id, delta) {
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    saveCart();
    updateCartUI();
  }
  function removeItem(id) { delete cart[id]; saveCart(); updateCartUI(); }

  function cartEntries() {
    return Object.keys(cart)
      .map((id) => ({ product: findProduct(Number(id)), qty: cart[id] }))
      .filter((e) => e.product);
  }
  function cartTotalItems() { return Object.values(cart).reduce((a, b) => a + b, 0); }
  function cartSubtotal() { return cartEntries().reduce((s, e) => s + e.product.price * e.qty, 0); }

  function updateCartUI() {
    const entries = cartEntries();
    cartCount.textContent = cartTotalItems();

    if (entries.length === 0) {
      cartItemsEl.innerHTML = `<p class="cart-empty">Your cart is empty.<br/>Add some products to get started 🛒</p>`;
    } else {
      cartItemsEl.innerHTML = entries.map(({ product: p, qty }) => {
        const media = p.image
          ? `<img src="${escapeHtml(p.image)}" alt="" onerror="this.replaceWith(document.createTextNode('${p.emoji || "🛍️"}'))" />`
          : (p.emoji || "🛍️");
        return `
          <div class="cart-item">
            <div class="ci-media">${media}</div>
            <div>
              <div class="ci-name">${escapeHtml(p.name)}</div>
              <div class="ci-price">${money(p.price)}</div>
              <div class="qty">
                <button data-dec="${p.id}" aria-label="Decrease">−</button>
                <span>${qty}</span>
                <button data-inc="${p.id}" aria-label="Increase">+</button>
              </div>
            </div>
            <button class="ci-remove" data-remove="${p.id}">Remove</button>
          </div>`;
      }).join("");
    }
    subtotalEl.textContent = money(cartSubtotal());
  }

  /* ---------- WhatsApp checkout ---------- */
  function checkout() {
    const entries = cartEntries();
    if (entries.length === 0) { showToast("Your cart is empty"); return; }
    if (!CFG.whatsappNumber) { showToast("WhatsApp number not configured"); return; }

    let msg = `Hi ${CFG.storeName || "there"}! 👋 I'd like to place an order:\n\n`;
    entries.forEach((e, i) => {
      msg += `${i + 1}. ${e.product.name} × ${e.qty} — ${money(e.product.price * e.qty)}\n`;
    });
    msg += `\n*Subtotal: ${money(cartSubtotal())}*\n\n`;
    msg += `Please confirm availability, delivery charges and final total. Thank you!`;

    const url = `https://wa.me/${CFG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener");
  }

  /* ---------- Drawer ---------- */
  function openDrawer() {
    drawer.classList.add("open");
    overlay.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    overlay.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
  }

  /* ---------- Wire up social links ---------- */
  function initLinks() {
    const insta = CFG.instagramHandle
      ? `https://instagram.com/${CFG.instagramHandle}` : "#";
    const wa = CFG.whatsappNumber
      ? `https://wa.me/${CFG.whatsappNumber}` : "#";
    const setHref = (sel, href) => { const el = $(sel); if (el) el.href = href; };
    setHref("#instaLink", insta);
    setHref("#instaFooter", insta);
    setHref("#waFooter", wa);
    const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- Event delegation ---------- */
  function initEvents() {
    // Add-to-cart (products) + cart item controls
    document.body.addEventListener("click", (e) => {
      const t = e.target.closest("[data-add],[data-inc],[data-dec],[data-remove]");
      if (!t) return;
      if (t.dataset.add) addToCart(Number(t.dataset.add));
      else if (t.dataset.inc) changeQty(Number(t.dataset.inc), +1);
      else if (t.dataset.dec) changeQty(Number(t.dataset.dec), -1);
      else if (t.dataset.remove) removeItem(Number(t.dataset.remove));
    });

    // Filters (chips)
    filterRow.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      filterRow.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      activeFilter = chip.dataset.filter;
      renderProducts();
    });

    // Nav filter links
    document.querySelectorAll(".nav a[data-filter]").forEach((a) => {
      a.addEventListener("click", () => {
        const f = a.dataset.filter;
        activeFilter = f;
        filterRow.querySelectorAll(".chip").forEach((c) =>
          c.classList.toggle("active", c.dataset.filter === f));
        renderProducts();
      });
    });

    // Search
    searchInput.addEventListener("input", (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      renderProducts();
    });

    // Sort
    sortSelect.addEventListener("change", (e) => { sortBy = e.target.value; renderProducts(); });

    // Drawer
    $("#cartToggle").addEventListener("click", openDrawer);
    $("#cartClose").addEventListener("click", closeDrawer);
    overlay.addEventListener("click", closeDrawer);
    $("#checkout").addEventListener("click", checkout);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

    // Header shadow on scroll
    const header = $("#header");
    window.addEventListener("scroll", () => {
      header.classList.toggle("scrolled", window.scrollY > 10);
    });
  }

  /* ---------- Init ---------- */
  initLinks();
  initEvents();
  renderProducts();
  updateCartUI();
})();
