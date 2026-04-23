document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

/* GLOBAL STATE (Корзина) */
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const API_BASE = 'http://localhost:3001/api';

const CATEGORY_BY_NAME = {
    'CHIPMUNK SOUL': 'soul',
    EXPERIMENTAL: 'experimental',
    GOSPEL: 'gospel',
    COLLABS: 'collab'
};

async function requestJson(url, options = {}) {
    const { headers, auth, ...restOptions } = options;
    const requestHeaders = {
        'Content-Type': 'application/json',
        ...(headers || {})
    };

    if (auth) {
        const token = getAuthToken();
        if (token) {
            requestHeaders.Authorization = `Bearer ${token}`;
        }
    }

    const response = await fetch(url, {
        ...restOptions,
        headers: requestHeaders
    });

    const data = await response.json().catch(() => ({}));

    // Если получена 401 ошибка (Unauthorized), очищаем токен и перенаправляем на логин
    if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = getHomePath();
        throw new Error(data.error || data.message || 'Session expired. Please log in again.');
    }

    if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
}

async function getPromoCodeFromApi(code) {
    return await requestJson(`${API_BASE}/promo-codes/${encodeURIComponent(code)}`);
}

async function getShippingCountriesFromApi() {
    return await requestJson(`${API_BASE}/orders/shipping-countries`);
}

async function getProductsFromApi() {
    const products = await requestJson(`${API_BASE}/products`);
    return Array.isArray(products) ? products.map(normalizeProduct) : [];
}

async function getProductByIdFromApi(id) {
    const product = await requestJson(`${API_BASE}/products/${id}`);
    return normalizeProduct(product);
}

function normalizeTracklist(tracklist) {
    if (Array.isArray(tracklist)) return tracklist;
    if (typeof tracklist !== 'string' || !tracklist.trim()) return [];

    try {
        const parsed = JSON.parse(tracklist);
        if (Array.isArray(parsed)) return parsed;
    } catch {
        // Fallback for legacy non-JSON values.
    }

    return [tracklist];
}

function resolveProductImagePath(imageUrl) {
    // Use a neutral placeholder when an item has no image instead of the CollegeDropout cover
    if (!imageUrl) return '../assets/img/no-image.svg';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    if (imageUrl.startsWith('../') || imageUrl.startsWith('/')) return imageUrl;
    return `../assets/img/${imageUrl}`;
}

function normalizeProduct(raw) {
    const categoryName = String(raw?.category_name || '').toUpperCase();
    const category = raw?.category_slug || raw?.category || CATEGORY_BY_NAME[categoryName] || 'all';
    const imageSource = raw?.img || raw?.image_url;

    return {
        id: Number(raw?.id),
        title: raw?.title || 'UNTITLED',
        price: Number(raw?.price) || 0,
        category,
        year: Number(raw?.year) || 0,
        img: resolveProductImagePath(imageSource),
        tracklist: normalizeTracklist(raw?.tracklist)
    };
}

function setAuthData(data) {
    if (data?.token) {
        localStorage.setItem('auth_token', data.token);
    }

    if (data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
    }
}

function getAuthToken() {
    return localStorage.getItem('auth_token');
}

function getCurrentUser() {
    const raw = localStorage.getItem('user');
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function isAuthenticated() {
    return Boolean(getAuthToken() && getCurrentUser());
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function getPagePath(fileName) {
    return window.location.pathname.includes('/pages/') ? fileName : `pages/${fileName}`;
}

function getHomePath() {
    return window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
}

function getRedirectParam() {
    return new URLSearchParams(window.location.search).get('redirect');
}

function getPostAuthRedirect(defaultPath) {
    return getRedirectParam() || defaultPath;
}

function logoutUser() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = getPagePath('login.html');
}

function initApp() {
    updateCartCounter();

    const pageId = document.body.id;

    if (pageId === 'page-catalog') initCatalog();
    if (pageId === 'page-product') initProductPage();
    if (pageId === 'page-cart') initCartPage();
    if (pageId === 'page-login') initLoginPage();
    if (pageId === 'page-register') initRegisterPage();
    if (pageId === 'page-account') initAccountPage();
    
    const subscribeForm = document.querySelector('.subscribe-form');
    if (subscribeForm) {
        subscribeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('WELCOME TO THE FAMILY.');
            subscribeForm.reset();
        });
    }
}

/* 3. LOGIC: CATALOG */
async function initCatalog() {
    const grid = document.getElementById('product-grid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (!grid) return;

    let products = [];

    grid.innerHTML = '<div class="empty-msg">LOADING CATALOG...</div>';

    try {
        products = await getProductsFromApi();
    } catch (error) {
        grid.innerHTML = `<div class="empty-msg">${error.message || 'FAILED TO LOAD CATALOG.'}</div>`;
        return;
    }

    function render(category = 'all') {
        grid.innerHTML = '';
        
        const filtered = category === 'all' 
            ? products
            : products.filter(p => p.category === category);

        if (filtered.length === 0) {
            grid.innerHTML = '<div class="empty-msg">NO ITEMS FOUND IN THIS ERA.</div>';
            return;
        }

        filtered.forEach(product => {
            const card = document.createElement('article');
            card.className = 'product-card';
            card.innerHTML = `
                <a href="product.html?id=${product.id}" class="card-link">
                    <div class="img-wrapper">
                        <img src="${product.img}" alt="${product.title}" loading="lazy">
                    </div>
                    <div class="card-info">
                        <h3>${product.title}</h3>
                        <div class="card-bottom">
                            <span>$${product.price}</span>
                        </div>
                    </div>
                </a>
            `;
            grid.appendChild(card);
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.getAttribute('data-filter');
            render(category);
        });
    });

    render('all');
}

/* 4. LOGIC: PRODUCT DETAILS */
async function initProductPage() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));

    if (!id) {
        document.querySelector('.product-container').innerHTML = `<h1>ITEM NOT FOUND</h1><a href="${getPagePath('catalog.html')}">BACK</a>`;
        return;
    }

    let product;

    try {
        product = await getProductByIdFromApi(id);
    } catch {
        product = null;
    }

    if (!product) {
        document.querySelector('.product-container').innerHTML = `<h1>ITEM NOT FOUND</h1><a href="${getPagePath('catalog.html')}">BACK</a>`;
        return;
    }

    document.getElementById('breadcrumb-title').innerText = product.title;
    document.getElementById('product-title').innerText = product.title;
    document.getElementById('product-price').innerText = `$${product.price}`;
    document.getElementById('main-product-img').src = product.img;
    
    document.getElementById('spec-year').innerText = product.year;
    
    const tracklistEl = document.getElementById('product-tracklist');
    tracklistEl.innerHTML = '';
    product.tracklist.forEach(track => {
        const li = document.createElement('li');
        li.innerText = track;
        tracklistEl.appendChild(li);
    });

    const addBtn = document.getElementById('add-to-cart-btn');
    addBtn.onclick = () => addToCart(product);
}

/* 5. LOGIC: CART */
function initCartPage() {
    const wrapper = document.getElementById('cart-items-wrapper');
    const emptyState = document.getElementById('cart-empty-state');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const applyPromoBtn = document.getElementById('apply-promo');
    const shippingSelect = document.getElementById('shipping-select');
    const shippingErrorEl = document.getElementById('shipping-error');
    let appliedPromoCode = '';
    let appliedDiscountPercent = 0;
    let shippingCountries = [];

    function getSelectedShippingCountry() {
        const selectedId = Number(shippingSelect?.value || 0);
        return shippingCountries.find((country) => Number(country.id) === selectedId) || null;
    }

    function getSelectedShippingCost() {
        const country = getSelectedShippingCountry();
        return Number(country?.shipping_cost) || 0;
    }

    function setShippingError(isVisible) {
        if (shippingErrorEl) {
            shippingErrorEl.classList.toggle('hidden', !isVisible);
        }
        if (shippingSelect) {
            shippingSelect.classList.toggle('shipping-select--invalid', isVisible);
        }
    }

    async function loadShippingCountries() {
        if (!shippingSelect) return;

        try {
            const countries = await getShippingCountriesFromApi();
            shippingCountries = Array.isArray(countries) ? countries : [];

            shippingSelect.innerHTML = '<option value="">SELECT REGION...</option>';
            shippingCountries.forEach((country) => {
                const option = document.createElement('option');
                option.value = String(country.id);
                option.textContent = `${country.name} (+$${country.shipping_cost})`;
                shippingSelect.appendChild(option);
            });
        } catch (error) {
            shippingCountries = [];
            shippingSelect.innerHTML = '<option value="">UNABLE TO LOAD REGIONS</option>';
            shippingSelect.disabled = true;
            if (checkoutBtn) checkoutBtn.disabled = true;
            if (shippingErrorEl) {
                shippingErrorEl.textContent = error.message || 'FAILED TO LOAD SHIPPING REGIONS.';
                shippingErrorEl.classList.remove('hidden');
            }
        }
    }

    function renderCart() {
        if (!wrapper) return;
        wrapper.innerHTML = '';
        
        if (cart.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            const summary = document.querySelector('.cart-summary-section');
            if (summary) {
                summary.style.opacity = '0.5';
                summary.style.pointerEvents = 'none';
            }
            if (subtotalEl) subtotalEl.innerText = `$0`;
            if (totalEl) totalEl.innerText = `$0`;
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        const summary = document.querySelector('.cart-summary-section');
        if (summary) {
            summary.style.opacity = '1';
            summary.style.pointerEvents = 'auto';
        }

        let itemsTotal = 0;
        
        const groupedCart = {};
        cart.forEach(item => {
            itemsTotal += item.price; 
            if (!groupedCart[item.id]) {
                groupedCart[item.id] = { ...item, quantity: 1 };
            } else {
                groupedCart[item.id].quantity += 1;
            }
        });

        Object.values(groupedCart).forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.style.display = 'flex';
            itemEl.style.gap = '1rem';
            itemEl.style.marginBottom = '1.5rem';
            itemEl.style.borderBottom = '1px solid #eee';
            itemEl.style.paddingBottom = '1rem';

            const quantityText = item.quantity > 1 ? `<span style="color: #666; font-size: 0.9rem;">(x${item.quantity})</span>` : '';
            const priceText = item.quantity > 1 ? `$${item.price * item.quantity} <span style="font-size:0.8rem; color:#888;">($${item.price} each)</span>` : `$${item.price}`;

            const actionsHTML = item.quantity > 1
                ? `<button onclick="removeOneFromCart(${item.id})" style="background:none; border:none; text-decoration:underline; cursor:pointer; font-family: var(--font-heading), sans-serif; font-size: 0.8rem; margin-right: 15px;">REMOVE 1</button>
                   <button onclick="removeAllFromCart(${item.id})" style="background:none; border:none; text-decoration:underline; cursor:pointer; font-family: var(--font-heading), sans-serif; font-size: 0.8rem;">REMOVE ALL</button>`
                : `<button onclick="removeAllFromCart(${item.id})" style="background:none; border:none; text-decoration:underline; cursor:pointer; font-family: var(--font-heading), sans-serif; font-size: 0.8rem;">REMOVE</button>`;

            itemEl.innerHTML = `
                <img src="${item.img}" alt="${item.title}" style="width: 120px; height: 120px; object-fit: cover; border: 1px solid #000;">
                <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                    <h4 style="font-family: 'Archivo Black', sans-serif; text-transform: uppercase; font-size: 1.1rem; margin-bottom: 5px;">${item.title} ${quantityText}</h4>
                    <p style="margin: 0 0 10px 0; font-size: 1.1rem;">${priceText}</p>
                    <div>
                        ${actionsHTML}
                    </div>
                </div>
            `;
            wrapper.appendChild(itemEl);
        });

        const discountAmount = Math.floor((itemsTotal * appliedDiscountPercent) / 100);
        if (subtotalEl) subtotalEl.innerText = `$${itemsTotal}`;

        const shippingCost = getSelectedShippingCost();

        if (totalEl) totalEl.innerText = `$${itemsTotal - discountAmount + shippingCost}`;
    }

    if (shippingSelect) {
        shippingSelect.addEventListener('change', () => {
            setShippingError(false);
            renderCart();
        });
    }

    window.removeOneFromCart = (id) => {
        const index = cart.findIndex(item => item.id === id);
        if (index !== -1) {
            cart.splice(index, 1);
            saveCart();
            renderCart();
            updateCartCounter();
        }
    };

    window.removeAllFromCart = (id) => {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        renderCart();
        updateCartCounter();
    };

    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', async () => {
            const promoInput = document.getElementById('promo-input');
            const code = promoInput ? promoInput.value.trim().toUpperCase() : '';

            if (!code) {
                appliedPromoCode = '';
                appliedDiscountPercent = 0;
                alert('ENTER PROMO CODE');
                renderCart();
                return;
            }

            try {
                const promo = await getPromoCodeFromApi(code);
                appliedPromoCode = promo.code;
                appliedDiscountPercent = Number(promo.discount_percent) || 0;
                alert(`PROMO APPLIED: -${appliedDiscountPercent}%`);
            } catch (error) {
                appliedPromoCode = '';
                appliedDiscountPercent = 0;
                alert(error.message || 'INVALID CODE');
            }

            renderCart();
        });
    }

     if (checkoutBtn) {
         checkoutBtn.addEventListener('click', async () => {
             const user = getCurrentUser();
             const token = getAuthToken();

             if (!user || !token) {
                 alert('FOR CHECKOUT, PLEASE LOG IN FIRST.');
                 window.location.href = `${getPagePath('login.html')}?redirect=cart.html`;
                 return;
             }

             if (cart.length === 0) {
                 alert('YOUR BAG IS EMPTY.');
                 return;
             }

             const selectedCountry = getSelectedShippingCountry();
             if (!selectedCountry) {
                 setShippingError(true);
                 return;
             }

             // Открываем модальное окно для ввода адреса доставки
             const modal = document.getElementById('checkout-modal');
             if (modal) {
                 modal.classList.remove('hidden');
                 // Сфокусируем на первом поле
                 document.getElementById('checkout-address').focus();
             }
         });
     }

      // Обработчик отправки формы checkout
      const checkoutForm = document.getElementById('checkout-form');
      if (checkoutForm) {
          checkoutForm.addEventListener('submit', async (e) => {
              e.preventDefault();

              const user = getCurrentUser();
              const token = getAuthToken();

              if (!user || !token) {
                  alert('FOR CHECKOUT, PLEASE LOG IN FIRST.');
                  window.location.href = `${getPagePath('login.html')}?redirect=cart.html`;
                  return;
              }

              if (cart.length === 0) {
                  alert('YOUR BAG IS EMPTY.');
                  return;
              }

              const groupedItems = Object.values(cart.reduce((acc, item) => {
                  if (!acc[item.id]) {
                      acc[item.id] = { id: item.id, price: item.price, quantity: 0 };
                  }
                  acc[item.id].quantity += 1;
                  return acc;
              }, {}));

              const selectedCountry = getSelectedShippingCountry();
              if (!selectedCountry) {
                  setShippingError(true);
                  return;
              }

              const address = document.getElementById('checkout-address')?.value.trim();
              const postal = document.getElementById('checkout-postal')?.value.trim();
              const notes = document.getElementById('checkout-notes')?.value.trim() || null;

              if (!address || !postal) {
                  alert('PLEASE FILL IN REQUIRED FIELDS.');
                  return;
              }

              try {
                  const submitButton = checkoutForm.querySelector('button[type="submit"]');
                  if (submitButton) submitButton.disabled = true;

                  const data = await requestJson(`${API_BASE}/orders`, {
                      method: 'POST',
                      auth: true,
                      body: JSON.stringify({
                          items: groupedItems,
                          shipping_country_id: selectedCountry.id,
                          promo_code: appliedPromoCode || undefined,
                          address: address,
                          postal_code: postal,
                          notes: notes
                      })
                  });

                  alert(`ORDER PLACED. ${data.order_number || 'THANK YOU.'}`);
                  cart = [];
                  appliedPromoCode = '';
                  appliedDiscountPercent = 0;
                  saveCart();
                  renderCart();
                  updateCartCounter();
                  if (shippingSelect) shippingSelect.value = '';
                  setShippingError(false);
                  const promoInput = document.getElementById('promo-input');
                  if (promoInput) promoInput.value = '';

                  // Закрываем модальное окно
                  const modal = document.getElementById('checkout-modal');
                  if (modal) {
                      modal.classList.add('hidden');
                  }
                  // Очищаем форму
                  checkoutForm.reset();
              } catch (error) {
                  alert(error.message || 'UNABLE TO PLACE ORDER.');
              } finally {
                  const submitButton = checkoutForm.querySelector('button[type="submit"]');
                  if (submitButton) submitButton.disabled = false;
              }
          });
      }

     // Обработчик кнопки отмены в модальном окне
     const checkoutCancel = document.getElementById('checkout-cancel');
     if (checkoutCancel) {
         checkoutCancel.addEventListener('click', () => {
             const modal = document.getElementById('checkout-modal');
             if (modal) {
                 modal.classList.add('hidden');
             }
             const checkoutForm = document.getElementById('checkout-form');
             if (checkoutForm) {
                 checkoutForm.reset();
             }
         });
     }

    loadShippingCountries().finally(renderCart);
}

function initAccountPage() {
    const user = getCurrentUser();
    const loginUrl = `${getPagePath('login.html')}?redirect=account.html`;

    if (!isAuthenticated()) {
        window.location.href = loginUrl;
        return;
    }

    const nameEl = document.getElementById('account-username');
    const emailEl = document.getElementById('account-email');
    const phoneEl = document.getElementById('account-phone');
    const cityEl = document.getElementById('account-city');
    const countryEl = document.getElementById('account-country');
    const ordersEl = document.getElementById('orders-list');
    const emptyEl = document.getElementById('orders-empty');
    const logoutBtn = document.getElementById('logout-btn');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const editProfileForm = document.getElementById('edit-profile-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const profileSection = document.getElementById('account-profile');

    if (nameEl) nameEl.innerText = user.username || 'USER';
    if (emailEl) emailEl.innerText = user.email || '';

    function displayProfile(profile) {
        if (phoneEl) phoneEl.innerText = profile.phone || 'Не указано';
        if (cityEl) cityEl.innerText = profile.city || 'Не указано';
        if (countryEl) countryEl.innerText = profile.country || 'Не указано';
    }

    // Загрузить полные данные профиля
    async function loadFullProfile() {
        try {
            const profile = await requestJson(`${API_BASE}/users/profile/${user.id}`, { auth: true });
            displayProfile(profile);
            return profile;
        } catch (error) {
            console.error('Failed to load profile:', error);
            return user;
        }
    }

    // Загрузить профиль при загрузке страницы
    loadFullProfile();

    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', async () => {
            const fullProfile = await loadFullProfile();
            document.getElementById('edit-username').value = fullProfile.username || '';
            document.getElementById('edit-phone').value = fullProfile.phone || '';
            document.getElementById('edit-city').value = fullProfile.city || '';
            document.getElementById('edit-country').value = fullProfile.country || '';

            profileSection.style.display = 'none';
            editProfileForm.classList.remove('hidden');
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            profileSection.style.display = 'block';
            editProfileForm.classList.add('hidden');
        });
    }

     if (editProfileForm) {
        const form = editProfileForm.querySelector('form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const username = document.getElementById('edit-username').value.trim() || null;
                const phone = document.getElementById('edit-phone').value.trim() || null;
                const city = document.getElementById('edit-city').value.trim() || null;
                const country = document.getElementById('edit-country').value.trim() || null;

                try {
                    const submitButton = form.querySelector('button[type="submit"]');
                    if (submitButton) submitButton.disabled = true;

                    await requestJson(`${API_BASE}/users/profile/${user.id}`, {
                        method: 'PUT',
                        auth: true,
                        body: JSON.stringify({ username, phone, city, country })
                    });

                    alert('PROFILE UPDATED SUCCESSFULLY.');
                    // Обновляем отображение username в профиле
                    if (nameEl) nameEl.innerText = username || user.username || 'USER';
                    displayProfile({ username, phone, city, country });
                    profileSection.style.display = 'block';
                    editProfileForm.classList.add('hidden');
                } catch (error) {
                    alert(error.message || 'FAILED TO UPDATE PROFILE.');
                } finally {
                    const submitButton = form.querySelector('button[type="submit"]');
                    if (submitButton) submitButton.disabled = false;
                }
            });
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }

    if (!ordersEl) return;

    ordersEl.innerHTML = '<p class="loading-text">LOADING ORDERS...</p>';

    requestJson(`${API_BASE}/orders/user/${user.id}`, { auth: true })
        .then((orders) => {
            if (!Array.isArray(orders) || orders.length === 0) {
                if (emptyEl) emptyEl.classList.remove('hidden');
                ordersEl.innerHTML = '';
                return;
            }

            if (emptyEl) emptyEl.classList.add('hidden');

            ordersEl.innerHTML = orders.map(order => `
                <article class="order-card">
                    <div class="order-card__top">
                        <div>
                            <h3>${order.order_number}</h3>
                            <p>STATUS: ${order.status}</p>
                        </div>
                        <strong>$${order.total_amount}</strong>
                    </div>
                    <div class="order-card__meta">
                        <span>ITEMS: ${order.items_count}</span>
                        <span>DATE: ${order.created_at ? new Date(order.created_at).toLocaleDateString('ru-RU') : '—'}</span>
                    </div>
                </article>
            `).join('');
        })
        .catch((error) => {
            ordersEl.innerHTML = `<p class="empty-msg">${error.message || 'FAILED TO LOAD ORDERS.'}</p>`;
        });
}

function addToCart(product) {
    cart.push(product);
    saveCart();
    updateCartCounter();
    
    const btn = document.getElementById('add-to-cart-btn');
    if (btn) {
        const originalText = btn.innerText;
        btn.innerText = "ADDED TO BAG";
        btn.style.background = "#fff";
        btn.style.color = "#000";
        btn.style.border = "2px solid #000";
        
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = "";
            btn.style.color = "";
            btn.style.border = "";
        }, 1500);
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCounter() {
    const countSpan = document.getElementById('cart-count');
    if (countSpan) {
        countSpan.innerText = cart.length; 
    }
}

function initLoginPage() {
    const loginForm = document.querySelector('.auth-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email')?.value.trim();
            const password = document.getElementById('password')?.value;
            const submitButton = loginForm.querySelector('button[type="submit"]');

            if (!email || !password) {
                alert('ENTER EMAIL AND PASSWORD.');
                return;
            }

            try {
                if (submitButton) submitButton.disabled = true;

                const data = await requestJson(`${API_BASE}/users/login`, {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });

                setAuthData(data);
                alert(data.message || 'WELCOME BACK.');
                window.location.href = getPostAuthRedirect(getHomePath());
            } catch (error) {
                alert(error.message || 'LOGIN FAILED.');
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        });
    }
}

function initRegisterPage() {
    const registerForm = document.querySelector('.auth-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const password = document.getElementById('password')?.value;
            const confirmPassword = document.getElementById('confirmPassword')?.value;
            const phone = document.getElementById('phone')?.value.trim() || null;
            const city = document.getElementById('city')?.value.trim() || null;
            const country = document.getElementById('country')?.value.trim() || null;
            const submitButton = registerForm.querySelector('button[type="submit"]');

            if (!username || !email || !password || !confirmPassword) {
                alert('FILL IN ALL FIELDS.');
                return;
            }

            if (!isValidEmail(email)) {
                alert('ENTER VALID EMAIL ADDRESS.');
                return;
            }

            if (password !== confirmPassword) {
                alert('PASSWORDS DO NOT MATCH.');
                return;
            }

            try {
                if (submitButton) submitButton.disabled = true;

                const data = await requestJson(`${API_BASE}/users/register`, {
                    method: 'POST',
                    body: JSON.stringify({ username, email, password, confirmPassword, phone, city, country })
                });

                alert(data.message || 'ACCOUNT CREATED. PROCEED TO LOGIN.');
                registerForm.reset();
                window.location.href = 'login.html';
            } catch (error) {
                alert(error.message || 'REGISTRATION FAILED.');
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        });
    }
}