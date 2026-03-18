document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

/*  DATABASE */
const productsDB = [
    {
        id: 1,
        title: "THE COLLEGE DROPOUT",
        price: 70,
        category: "soul",
        year: 2004,
        img: "../assets/img/CollegeDropout.jpg", 
        tracklist: ["We Don't Care", "All Falls Down", "Jesus Walks", "Through the Wire"]
    },
    {
        id: 2,
        title: "LATE REGISTRATION",
        price: 80,
        category: "soul",
        year: 2005,
        img: "../assets/img/LateReg.jpg",
        tracklist: ["Heard 'Em Say", "Touch the Sky", "Gold Digger", "Diamonds from Sierra Leone"]
    },
    {
        id: 3, 
        title: "GRADUATION",
        price: 85,
        category: "soul", 
        year: 2007,
        img: "../assets/img/Graduation.jpg",
        tracklist: ["Good Morning", "Stronger", "I Wonder", "Can't Tell Me Nothing", "Flashing Lights"]
    },
    {
        id: 4,
        title: "808s & HEARTBREAK",
        price: 70,
        category: "experimental",
        year: 2008,
        img: "../assets/img/808s.jpg",
        tracklist: ["Say You Will", "Heartless", "Love Lockdown", "Street Lights"]
    },
    {
        id: 5,
        title: "MY BEAUTIFUL DARK TWISTED FANTASY",
        price: 100,
        category: "experimental",
        year: 2010,
        img: "../assets/img/MBDTF.jpg",
        tracklist: ["Dark Fantasy", "Power", "Runaway", "All of the Lights"]
    },
    {
        id: 6,
        title: "YEEZUS",
        price: 90,
        category: "experimental",
        year: 2013,
        img: "../assets/img/Yeezus.jpg",
        tracklist: ["On Sight", "Black Skinhead", "New Slaves", "Bound 2"]
    },
    {
        id: 7,
        title: "THE LIFE OF PABLO",
        price: 80,
        category: "gospel",
        year: 2016,
        img: "../assets/img/TLOP.jpg",
        tracklist: ["Ultralight Beam", "Father Stretch My Hands", "Famous", "Wolves"]
    },
    {
        id: 8,
        title: "JESUS IS KING",
        price: 65,
        category: "gospel",
        year: 2019,
        img: "../assets/img/JIK.jpg",
        tracklist: ["Every Hour", "Selah", "Follow God", "Use This Gospel"]
    },
    {
        id: 9,
        title: "VULTURES 1",
        price: 70,
        category: "collab",
        year: 2024,
        img: "../assets/img/V1.jpg",
        tracklist: ["Stars", "Back to Me", "Carnival", "Beg Forgiveness"]
    }
];

/* GLOBAL STATE (Корзина) */
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function initApp() {
    updateCartCounter();

    const pageId = document.body.id;

    if (pageId === 'page-catalog') initCatalog();
    if (pageId === 'page-product') initProductPage();
    if (pageId === 'page-cart') initCartPage();
    
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
function initCatalog() {
    const grid = document.getElementById('product-grid');
    const filterBtns = document.querySelectorAll('.filter-btn');

    function render(category = 'all') {
        grid.innerHTML = '';
        
        const filtered = category === 'all' 
            ? productsDB 
            : productsDB.filter(p => p.category === category);

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
function initProductPage() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));
    
    const product = productsDB.find(p => p.id === id);

    if (!product) {
        document.querySelector('.product-container').innerHTML = '<h1>ITEM NOT FOUND</h1><a href="catalog.html">BACK</a>';
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
                ? `<button onclick="removeOneFromCart(${item.id})" style="background:none; border:none; text-decoration:underline; cursor:pointer; font-family: var(--font-heading); font-size: 0.8rem; margin-right: 15px;">REMOVE 1</button>
                   <button onclick="removeAllFromCart(${item.id})" style="background:none; border:none; text-decoration:underline; cursor:pointer; font-family: var(--font-heading); font-size: 0.8rem;">REMOVE ALL</button>`
                : `<button onclick="removeAllFromCart(${item.id})" style="background:none; border:none; text-decoration:underline; cursor:pointer; font-family: var(--font-heading); font-size: 0.8rem;">REMOVE</button>`;

            itemEl.innerHTML = `
                <img src="${item.img}" style="width: 120px; height: 120px; object-fit: cover; border: 1px solid #000;">
                <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                    <h4 style="font-family: 'Archivo Black'; text-transform: uppercase; font-size: 1.1rem; margin-bottom: 5px;">${item.title} ${quantityText}</h4>
                    <p style="margin: 0 0 10px 0; font-size: 1.1rem;">${priceText}</p>
                    <div>
                        ${actionsHTML}
                    </div>
                </div>
            `;
            wrapper.appendChild(itemEl);
        });

        if (subtotalEl) subtotalEl.innerText = `$${itemsTotal}`;

        let shippingCost = 0;
        if (shippingSelect) {
            shippingCost = parseInt(shippingSelect.value) || 0;
        }

        if (totalEl) totalEl.innerText = `$${itemsTotal + shippingCost}`;
    }

    if (shippingSelect) {
        shippingSelect.addEventListener('change', renderCart);
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
        applyPromoBtn.addEventListener('click', () => {
            const promoInput = document.getElementById('promo-input');
            const code = promoInput ? promoInput.value.toUpperCase() : '';
            if (code === 'YZY') {
                alert('PROMO APPLIED: -10%');
                if (totalEl) {
                    let currentTotal = parseInt(totalEl.innerText.replace('$', ''));
                    totalEl.innerText = `$${Math.floor(currentTotal * 0.9)}`;
                }
            } else {
                alert('INVALID CODE');
            }
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            alert('ORDER PLACED. THANK YOU.');
            cart = [];
            saveCart();
            renderCart();
            updateCartCounter();
            if (shippingSelect) shippingSelect.value = "0"; 
        });
    }

    renderCart();
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