/* ========================================================================
   YZY VNYL — CORE LOGIC
   ======================================================================== */

   document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

/* --- 1. DATABASE (Имитация базы данных) --- */
const productsDB = [
    {
        id: 1,
        title: "THE COLLEGE DROPOUT",
        price: 70,
        category: "soul",
        year: 2004,
        img: "img/CollegeDropout.jpg",
        tracklist: ["We Don't Care", "All Falls Down", "Jesus Walks", "Through the Wire"]
    },
    {
        id: 2,
        title: "LATE REGISTRATION",
        price: 80,
        category: "soul",
        year: 2005,
        img: "img/LateReg.jpg",
        tracklist: ["Heard 'Em Say", "Touch the Sky", "Gold Digger", "Diamonds from Sierra Leone"]
    },
    {
        id: 3, 
        title: "GRADUATION",
        price: 85,
        category: "soul", 
        year: 2007,
        img: "img/Graduation.jpg",
        tracklist: ["Good Morning", "Stronger", "I Wonder", "Can't Tell Me Nothing", "Flashing Lights"]
    },
    {
        id: 4,
        title: "808s & HEARTBREAK",
        price: 70,
        category: "experimental",
        year: 2008,
        img: "img/808s.jpg",
        tracklist: ["Say You Will", "Heartless", "Love Lockdown", "Street Lights"]
    },
    {
        id: 5,
        title: "MY BEAUTIFUL DARK TWISTED FANTASY",
        price: 100,
        category: "experimental",
        year: 2010,
        img: "img/MBDTF.jpg",
        tracklist: ["Dark Fantasy", "Power", "Runaway", "All of the Lights"]
    },
    {
        id: 6,
        title: "YEEZUS",
        price: 90,
        category: "experimental",
        year: 2013,
        img: "img/Yeezus.jpg",
        tracklist: ["On Sight", "Black Skinhead", "New Slaves", "Bound 2"]
    },
    {
        id: 7,
        title: "THE LIFE OF PABLO",
        price: 80,
        category: "gospel",
        year: 2016,
        img: "img/TLOP.jpg",
        tracklist: ["Ultralight Beam", "Father Stretch My Hands", "Famous", "Wolves"]
    },
    {
        id: 8,
        title: "JESUS IS KING",
        price: 65,
        category: "gospel",
        year: 2019,
        img: "img/JIK.jpg",
        tracklist: ["Every Hour", "Selah", "Follow God", "Use This Gospel"]
    },
    {
        id: 9,
        title: "VULTURES 1",
        price: 70,
        category: "collab",
        year: 2024,
        img: "img/V1.jpg",
        tracklist: ["Stars", "Back to Me", "Carnival", "Beg Forgiveness"]
    }
];

/* --- 2. GLOBAL STATE (Корзина) --- */
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function initApp() {
    updateCartCounter();

    // Роутинг: смотрим ID у <body> и запускаем нужную логику
    const pageId = document.body.id;

    if (pageId === 'page-catalog') initCatalog();
    if (pageId === 'page-product') initProductPage();
    if (pageId === 'page-cart') initCartPage();
    
    // Для главной страницы логика минимальная (только подписка на рассылку)
    const subscribeForm = document.querySelector('.subscribe-form');
    if (subscribeForm) {
        subscribeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('WELCOME TO THE FAMILY.');
            subscribeForm.reset();
        });
    }
}

/* --- 3. LOGIC: CATALOG --- */
function initCatalog() {
    const grid = document.getElementById('product-grid');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Функция рендера
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

    // Слушатели фильтров
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // UI Update
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Logic Update
            const category = btn.getAttribute('data-filter');
            render(category);
        });
    });

    // Первый рендер
    render('all');
}

/* --- 4. LOGIC: PRODUCT DETAILS --- */
function initProductPage() {
    // Получаем ID из URL (например, product.html?id=1)
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));
    
    const product = productsDB.find(p => p.id === id);

    if (!product) {
        document.querySelector('.product-container').innerHTML = '<h1>ITEM NOT FOUND</h1><a href="catalog.html">BACK</a>';
        return;
    }

    // Заполняем данными HTML
    document.getElementById('breadcrumb-title').innerText = product.title;
    document.getElementById('product-title').innerText = product.title;
    document.getElementById('product-price').innerText = `$${product.price}`;
    document.getElementById('main-product-img').src = product.img;
    
    // Спецификации
    document.getElementById('spec-year').innerText = product.year;
    
    // Треклист
    const tracklistEl = document.getElementById('product-tracklist');
    tracklistEl.innerHTML = '';
    product.tracklist.forEach(track => {
        const li = document.createElement('li');
        li.innerText = track;
        tracklistEl.appendChild(li);
    });

    // Кнопка добавления в корзину
    const addBtn = document.getElementById('add-to-cart-btn');
    addBtn.onclick = () => addToCart(product);
}

/* --- 5. LOGIC: CART --- */
function initCartPage() {
    const wrapper = document.getElementById('cart-items-wrapper');
    const emptyState = document.getElementById('cart-empty-state');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    function renderCart() {
        wrapper.innerHTML = '';
        
        if (cart.length === 0) {
            emptyState.classList.remove('hidden');
            document.querySelector('.cart-summary-section').style.opacity = '0.5';
            document.querySelector('.cart-summary-section').style.pointerEvents = 'none';
            subtotalEl.innerText = `$${total}`;
            totalEl.innerText = `$${total}`;
            return;
        }

        emptyState.classList.add('hidden');
        document.querySelector('.cart-summary-section').style.opacity = '1';
        document.querySelector('.cart-summary-section').style.pointerEvents = 'auto';

        let total = 0;

        cart.forEach((item, index) => {
            total += item.price;
            
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            // В CSS нужно будет добавить стиль .cart-item (flex row)
            itemEl.style.display = 'flex';
            itemEl.style.gap = '1rem';
            itemEl.style.marginBottom = '1.5rem';
            itemEl.style.borderBottom = '1px solid #eee';
            itemEl.style.paddingBottom = '1rem';

            itemEl.innerHTML = `
                <img src="${item.img}" style="width: 80px; height: 80px; object-fit: cover; border: 1px solid #000;">
                <div style="flex: 1;">
                    <h4 style="font-family: 'Archivo Black'; text-transform: uppercase;">${item.title}</h4>
                    <p>$${item.price}</p>
                </div>
                <button onclick="removeFromCart(${index})" style="background:none; border:none; text-decoration:underline; cursor:pointer;">REMOVE</button>
            `;
            wrapper.appendChild(itemEl);
        });

        subtotalEl.innerText = `$${total}`;
        totalEl.innerText = `$${total}`;
    }

    // Удаление из корзины (нужно сделать глобальной функцией, чтобы onclick в HTML видел её)
    window.removeFromCart = (index) => {
        cart.splice(index, 1);
        saveCart();
        renderCart();
        updateCartCounter();
    };

    // Промокод
    document.getElementById('apply-promo').addEventListener('click', () => {
        const code = document.getElementById('promo-input').value.toUpperCase();
        if (code === 'YZY') {
            alert('PROMO APPLIED: -10%');
            // Логика скидки (визуальная)
            let currentTotal = parseInt(totalEl.innerText);
            totalEl.innerText = `${Math.floor(currentTotal * 0.9)} ₽`;
        } else {
            alert('INVALID CODE');
        }
    });

    checkoutBtn.addEventListener('click', () => {
        alert('ORDER PLACED. THANK YOU.');
        cart = [];
        saveCart();
        renderCart();
        updateCartCounter();
    });

    renderCart();
}

/* --- 6. SHARED FUNCTIONS --- */

function addToCart(product) {
    cart.push(product);
    saveCart();
    updateCartCounter();
    
    // Визуальный эффект на кнопке
    const btn = document.getElementById('add-to-cart-btn');
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

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCounter() {
    const countSpan = document.getElementById('cart-count');
    if (countSpan) {
        countSpan.innerText = cart.length;
    }
}