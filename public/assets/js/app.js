(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const i18n = () => window.KazeI18n;
  const t = key => i18n()?.t(key) || key;
  const productData = [
    {id:'KZ-001',key:'tee',nameKey:'product_tee',descKey:'desc_tee',category:'tees',categoryKey:'cat_tees',price:420,oldPrice:null,image:'assets/images/tee.svg',colors:['white','black','green'],sizes:['S','M','L','XL'],date:6,badge:'new_badge',gender:'unisex'},
    {id:'KZ-002',key:'pants',nameKey:'product_pants',descKey:'desc_pants',category:'pants',categoryKey:'cat_pants',price:690,oldPrice:820,image:'assets/images/pants.svg',colors:['black','beige','navy'],sizes:['S','M','L','XL'],date:5,badge:'sale_badge',gender:'men'},
    {id:'KZ-003',key:'sport',nameKey:'product_sport',descKey:'desc_sport',category:'sports',categoryKey:'cat_sports',price:480,oldPrice:null,image:'assets/images/sport.svg',colors:['black','green','grey'],sizes:['S','M','L','XL'],date:4,badge:'new_badge',gender:'sports'},
    {id:'KZ-004',key:'hoodie',nameKey:'product_hoodie',descKey:'desc_hoodie',category:'hoodies',categoryKey:'cat_hoodies',price:890,oldPrice:990,image:'assets/images/hoodie.svg',colors:['green','black','grey'],sizes:['M','L','XL'],date:3,badge:'sale_badge',gender:'unisex'},
    {id:'KZ-005',key:'shirt',nameKey:'product_shirt',descKey:'desc_shirt',category:'shirts',categoryKey:'cat_shirts',price:640,oldPrice:null,image:'assets/images/shirt.svg',colors:['white','beige','navy'],sizes:['S','M','L','XL'],date:2,badge:'new_badge',gender:'men'},
    {id:'KZ-006',key:'jacket',nameKey:'product_jacket',descKey:'desc_jacket',category:'jackets',categoryKey:'cat_jackets',price:1150,oldPrice:1290,image:'assets/images/jacket.svg',colors:['black','green','beige'],sizes:['M','L','XL'],date:1,badge:'sale_badge',gender:'women'}
  ];
  const colorKeys = {black:'color_black',white:'color_white',green:'color_green',beige:'color_beige',navy:'color_navy',grey:'color_grey'};
  const state = { category:'all', size:'all', color:'all', sort:'featured', maxPrice:1500, query:'', favorites:new Set(), cart:[], currentProduct:null, selectedSize:'', selectedColor:'', quantity:1 };
  const formatPrice = value => new Intl.NumberFormat(i18n()?.getLanguage() === 'ar' ? 'ar-EG' : 'en-EG',{style:'currency',currency:'EGP',maximumFractionDigits:0}).format(value);
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const productName = p => t(p.nameKey);
  const productDescription = p => t(p.descKey);
  const colorName = key => t(colorKeys[key] || key);
  const categoryName = p => t(p.categoryKey);
  function toast(message) {
    const el = $('#toast'); if (!el) return;
    el.textContent = message; el.classList.add('show');
    clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2500);
  }
  function productCard(p) {
    const favorite = state.favorites.has(p.id);
    const badge = p.badge ? `<span class="product-badge ${p.oldPrice ? 'sale' : ''}">${escapeHTML(t(p.badge))}</span>` : '';
    const dots = p.colors.map(c => `<span class="color-dot ${c}" title="${escapeHTML(colorName(c))}" aria-label="${escapeHTML(colorName(c))}"></span>`).join('');
    return `<article class="product-card" data-product-id="${p.id}"><div class="product-visual">${badge}<img src="${p.image}" alt="${escapeHTML(productName(p))}" loading="lazy"><button class="favorite-toggle ${favorite?'is-favorite':''}" type="button" data-action="favorite" data-id="${p.id}" aria-label="${escapeHTML(t(favorite?'remove_favorite':'add_favorite'))}" title="${escapeHTML(t(favorite?'remove_favorite':'add_favorite'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 8.8c0 5.2-8.4 10.3-8.4 10.3S3.6 14 3.6 8.8A4.4 4.4 0 0 1 12 6.7a4.4 4.4 0 0 1 8.4 2.1Z"/></svg></button><button class="quick-add" type="button" data-action="details" data-id="${p.id}"><span>＋</span>${escapeHTML(t('add_to_cart'))}</button></div><div class="product-info"><div class="product-meta"><span class="product-category">${escapeHTML(categoryName(p))}</span><span>${escapeHTML(p.id)}</span></div><div class="product-name-row"><h3 class="product-name">${escapeHTML(productName(p))}</h3><span class="product-code">K / 26</span></div><p class="product-description">${escapeHTML(productDescription(p))}</p><div class="product-price-row"><span class="product-price">${formatPrice(p.price)}</span>${p.oldPrice ? `<span class="product-old-price">${formatPrice(p.oldPrice)}</span>` : ''}</div><div class="product-color-dots" aria-label="${escapeHTML(t('colors'))}">${dots}</div><div class="product-size-note">${escapeHTML(t('sizes'))}: ${p.sizes.join(' · ')}</div></div></article>`;
  }
  function renderProducts() {
    const grid = $('#productGrid'); if (!grid) return;
    const lang = i18n()?.getLanguage() || 'ar';
    const normalizedQuery = state.query.trim().toLocaleLowerCase(lang === 'ar' ? 'ar-EG' : 'en-US');
    let results = productData.filter(p => {
      const searchText = `${productName(p)} ${productDescription(p)} ${p.id} ${categoryName(p)}`.toLocaleLowerCase(lang === 'ar' ? 'ar-EG' : 'en-US');
      return (state.category === 'all' || p.category === state.category) &&
        (state.size === 'all' || p.sizes.includes(state.size)) &&
        (state.color === 'all' || p.colors.includes(state.color)) && p.price <= state.maxPrice &&
        (!normalizedQuery || searchText.includes(normalizedQuery));
    });
    if (state.sort === 'low') results.sort((a,b) => a.price - b.price);
    else if (state.sort === 'high') results.sort((a,b) => b.price - a.price);
    else if (state.sort === 'newest') results.sort((a,b) => b.date - a.date);
    else if (state.sort === 'name') results.sort((a,b) => productName(a).localeCompare(productName(b),lang === 'ar' ? 'ar' : 'en'));
    grid.innerHTML = results.map(productCard).join('');
    $('#resultCount').textContent = String(results.length);
    $('#emptyState').classList.toggle('hidden', results.length > 0);
    grid.classList.toggle('hidden', results.length === 0);
    $('#priceValue').textContent = formatPrice(state.maxPrice);
    updateCounts();
  }
  function updateCounts() {
    $('#cartCount').textContent = String(state.cart.reduce((sum,item)=>sum+item.quantity,0));
    $('#favoriteCount').textContent = String(state.favorites.size);
    $('#cartTotal').textContent = formatPrice(state.cart.reduce((sum,item)=>sum+item.price*item.quantity,0));
  }
  function setCategory(category) {
    state.category = category;
    $$('[data-filter-category]').forEach(b => b.classList.toggle('active', b.dataset.filterCategory === category));
    renderProducts();
    $('#shop')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function resetFilters() {
    state.category='all'; state.size='all'; state.color='all'; state.sort='featured'; state.maxPrice=1500; state.query='';
    $('#searchInput').value=''; $('#sizeFilter').value='all'; $('#colorFilter').value='all'; $('#sortFilter').value='featured'; $('#priceFilter').value='1500';
    $$('[data-filter-category]').forEach(b => b.classList.toggle('active',b.dataset.filterCategory==='all'));
    renderProducts();
  }
  function toggleFavorite(id) {
    if (state.favorites.has(id)) { state.favorites.delete(id); toast(t('removed_from_favorites')); }
    else { state.favorites.add(id); toast(t('added_to_favorites')); }
    renderProducts();
  }
  function openProduct(id) {
    const p=productData.find(item=>item.id===id); if (!p) return;
    state.currentProduct=p; state.selectedSize=''; state.selectedColor=p.colors[0]; state.quantity=1;
    renderModal();
    $('#productModal').classList.remove('hidden');
    document.body.classList.add('modal-open');
    $('#closeModal').focus();
  }
  function renderModal() {
    const p=state.currentProduct; if (!p) return;
    $('#modalContent').innerHTML=`<div class="modal-product-layout"><img class="modal-product-image" src="${p.image}" alt="${escapeHTML(productName(p))}"><div class="modal-product-info"><span class="section-kicker">${escapeHTML(p.id)} / KAZE PREVIEW</span><h2 id="modalProductName">${escapeHTML(productName(p))}</h2><p>${escapeHTML(productDescription(p))}</p><p class="modal-price">${formatPrice(p.price)} ${p.oldPrice?`<del class="product-old-price">${formatPrice(p.oldPrice)}</del>`:''}</p><p class="modal-stock">${escapeHTML(t('stock_demo'))}</p><label class="option-label">${escapeHTML(t('size_label'))}</label><div class="size-options">${p.sizes.map(size=>`<button type="button" class="size-option ${state.selectedSize===size?'selected':''}" data-size="${size}">${size}</button>`).join('')}</div><label class="option-label">${escapeHTML(t('color_label'))}</label><div class="color-options">${p.colors.map(c=>`<button type="button" class="color-option ${state.selectedColor===c?'selected':''}" data-color="${c}"><span class="color-dot ${c}"></span>${escapeHTML(colorName(c))}</button>`).join('')}</div><div class="modal-quantity"><label class="option-label" for="modalQuantity">${escapeHTML(t('quantity'))}</label><input id="modalQuantity" type="number" min="1" max="10" value="1" inputmode="numeric"></div><button class="button button-dark modal-add" id="addDemoCart" type="button">${escapeHTML(t('confirm_demo_add'))}<span>↗</span></button></div></div>`;
    $$('[data-size]', $('#modalContent')).forEach(btn=>btn.addEventListener('click',()=>{state.selectedSize=btn.dataset.size;$$('[data-size]', $('#modalContent')).forEach(x=>x.classList.toggle('selected',x===btn));}));
    $$('[data-color]', $('#modalContent')).forEach(btn=>btn.addEventListener('click',()=>{state.selectedColor=btn.dataset.color;$$('[data-color]', $('#modalContent')).forEach(x=>x.classList.toggle('selected',x===btn));}));
    $('#modalQuantity').addEventListener('change',e=>{state.quantity=Math.max(1,Math.min(10,Number(e.target.value)||1));e.target.value=state.quantity;});
    $('#addDemoCart').addEventListener('click',addCurrentToCart);
  }
  function addCurrentToCart() {
    const p=state.currentProduct; if (!p) return;
    if (!state.selectedSize) { toast(t('size_label')); $$('.size-option', $('#modalContent'))[0]?.focus(); return; }
    const qty=Math.max(1,Math.min(10,Number($('#modalQuantity')?.value)||1));
    const existing=state.cart.find(x=>x.id===p.id && x.size===state.selectedSize && x.color===state.selectedColor);
    if (existing) existing.quantity=Math.min(10,existing.quantity+qty);
    else state.cart.push({id:p.id,size:state.selectedSize,color:state.selectedColor,quantity:qty,price:p.price,nameKey:p.nameKey,image:p.image});
    closeModal(); renderCart(); updateCounts(); toast(t('added_to_cart')); openCart();
  }
  function renderCart() {
    const el=$('#cartItems');
    if (!state.cart.length) {el.innerHTML=`<div class="cart-empty"><div class="empty-icon">♧</div><h3>${escapeHTML(t('cart_empty'))}</h3><p>${escapeHTML(t('cart_empty_hint'))}</p></div>`;updateCounts();return;}
    el.innerHTML=state.cart.map((item,index)=>`<div class="cart-item"><img src="${item.image}" alt="${escapeHTML(t(item.nameKey))}"><div><h3 class="cart-item-title">${escapeHTML(t(item.nameKey))}</h3><p class="cart-item-detail">${escapeHTML(t('size_label'))}: ${item.size} · ${escapeHTML(colorName(item.color))}</p><div class="cart-item-price">${formatPrice(item.price*item.quantity)}</div><div class="cart-item-controls"><button class="qty-control" data-qty="minus" data-index="${index}" type="button" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button class="qty-control" data-qty="plus" data-index="${index}" type="button" aria-label="Increase quantity">+</button></div></div><button class="cart-item-remove" type="button" data-remove-cart="${index}" aria-label="${escapeHTML(t('remove'))}">×</button></div>`).join('');
    $$('[data-qty]',el).forEach(btn=>btn.addEventListener('click',()=>{const item=state.cart[Number(btn.dataset.index)];if(!item)return;if(btn.dataset.qty==='plus')item.quantity=Math.min(10,item.quantity+1);else item.quantity-=1;if(item.quantity<=0)state.cart.splice(Number(btn.dataset.index),1);renderCart();}));
    $$('[data-remove-cart]',el).forEach(btn=>btn.addEventListener('click',()=>{state.cart.splice(Number(btn.dataset.removeCart),1);renderCart();}));
    updateCounts();
  }
  function openCart() {$('#overlay').classList.remove('hidden');$('#cartDrawer').classList.add('open');$('#cartDrawer').setAttribute('aria-hidden','false');document.body.classList.add('drawer-open');$('#closeCart').focus();}
  function closeCart() {$('#overlay').classList.add('hidden');$('#cartDrawer').classList.remove('open');$('#cartDrawer').setAttribute('aria-hidden','true');document.body.classList.remove('drawer-open');}
  function closeModal() {$('#productModal').classList.add('hidden');document.body.classList.remove('modal-open');state.currentProduct=null;}
  function showFavorites() {
    const ids=[...state.favorites]; if (!ids.length) {toast(t('favorites_empty'));return;}
    state.query='';$('#searchInput').value='';state.category='all';state.size='all';state.color='all';state.maxPrice=1500;$('#sizeFilter').value='all';$('#colorFilter').value='all';$('#priceFilter').value='1500';$$('[data-filter-category]').forEach(b=>b.classList.toggle('active',b.dataset.filterCategory==='all'));
    renderProducts();$('#productGrid').innerHTML=productData.filter(p=>state.favorites.has(p.id)).map(productCard).join('');$('#resultCount').textContent=String(ids.length);$('#emptyState').classList.add('hidden');$('#productGrid').classList.remove('hidden');$('#shop').scrollIntoView({behavior:'smooth'});
  }
  function initTheme() {
    const saved=localStorage.getItem('kaze-theme');
    if(saved==='dark')document.body.classList.add('dark-theme');
    $('#themeToggle').addEventListener('click',()=>{document.body.classList.toggle('dark-theme');localStorage.setItem('kaze-theme',document.body.classList.contains('dark-theme')?'dark':'light');});
  }
  function initEvents() {
    $('#searchForm').addEventListener('submit',e=>{e.preventDefault();state.query=$('#searchInput').value;renderProducts();$('#shop').scrollIntoView({behavior:'smooth'});});
    $('#searchInput').addEventListener('input',e=>{state.query=e.target.value;renderProducts();});
    $('#sizeFilter').addEventListener('change',e=>{state.size=e.target.value;renderProducts();});
    $('#colorFilter').addEventListener('change',e=>{state.color=e.target.value;renderProducts();});
    $('#sortFilter').addEventListener('change',e=>{state.sort=e.target.value;renderProducts();});
    $('#priceFilter').addEventListener('input',e=>{state.maxPrice=Number(e.target.value);renderProducts();});
    $('#clearFilters').addEventListener('click',resetFilters);$('#resetEmpty').addEventListener('click',resetFilters);
    $$('[data-filter-category]').forEach(btn=>btn.addEventListener('click',()=>setCategory(btn.dataset.filterCategory)));
    $$('[data-category]').forEach(btn=>btn.addEventListener('click',()=>setCategory(btn.dataset.category)));
    $('#productGrid').addEventListener('click',e=>{const btn=e.target.closest('[data-action]');if(!btn)return;if(btn.dataset.action==='favorite')toggleFavorite(btn.dataset.id);if(btn.dataset.action==='details')openProduct(btn.dataset.id);});
    $('#favoritesButton').addEventListener('click',showFavorites);
    $('#cartButton').addEventListener('click',()=>{renderCart();openCart();});$('#closeCart').addEventListener('click',closeCart);$('#continueShopping').addEventListener('click',closeCart);$('#overlay').addEventListener('click',closeCart);
    $('#closeModal').addEventListener('click',closeModal);$('#productModal').addEventListener('click',e=>{if(e.target===$('#productModal'))closeModal();});
    const switchLanguage=()=>i18n().setLanguage(i18n().getLanguage()==='ar'?'en':'ar');$('#languageToggle').addEventListener('click',switchLanguage);$('#footerLanguage').addEventListener('click',switchLanguage);
    document.addEventListener('kaze:languagechange',()=>{renderProducts();renderCart();if(state.currentProduct)renderModal();$('#priceValue').textContent=formatPrice(state.maxPrice);});
    $$('[data-footer-note]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();toast(t('footer_contact_note'));}));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCart();closeModal();}if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();$('#searchInput').focus();}});
  }
  async function init() { if (i18n()?.ready) { try { await i18n().ready; } catch (_) {} } initTheme(); initEvents(); renderProducts(); renderCart(); }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
