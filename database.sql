PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    description TEXT,
    image_url TEXT,
    tracklist TEXT,
    stock_quantity INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT,
    city TEXT,
    country TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL,
     order_number TEXT NOT NULL UNIQUE,
     status TEXT DEFAULT 'pending',
     subtotal DECIMAL(10, 2) NOT NULL,
     shipping_cost DECIMAL(10, 2) DEFAULT 0,
     promo_code TEXT,
     discount_amount DECIMAL(10, 2) DEFAULT 0,
     total_amount DECIMAL(10, 2) NOT NULL,
     address TEXT,
     postal_code TEXT,
     notes TEXT,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
 );

CREATE TABLE IF NOT EXISTS shipping_countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    shipping_cost DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS promo_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    discount_percent INTEGER NOT NULL,
    max_uses INTEGER DEFAULT -1,
    times_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    valid_from DATE,
    valid_until DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO categories (id, name, slug) VALUES
(1, 'CHIPMUNK SOUL', 'soul'),
(2, 'EXPERIMENTAL', 'experimental'),
(3, 'GOSPEL', 'gospel'),
(4, 'COLLABS', 'collab');

INSERT OR IGNORE INTO products (title, price, category_id, year, description, image_url, tracklist) VALUES
('THE COLLEGE DROPOUT', 70, 1, 2004, 'Дебютный альбом Kanye West', 'CollegeDropout.jpg', '["We Don''t Care", "All Falls Down", "Jesus Walks", "Through the Wire"]'),
('LATE REGISTRATION', 80, 1, 2005, 'Второй студийный альбом', 'LateReg.jpg', '["Heard ''Em Say", "Touch the Sky", "Gold Digger", "Diamonds from Sierra Leone"]'),
('GRADUATION', 85, 1, 2007, 'Третий студийный альбом', 'Graduation.jpg', '["Good Morning", "Stronger", "I Wonder", "Can''t Tell Me Nothing", "Flashing Lights"]'),
('808s & HEARTBREAK', 70, 2, 2008, 'Экспериментальный альбом', '808s.jpg', '["Say You Will", "Heartless", "Love Lockdown", "Street Lights"]'),
('MY BEAUTIFUL DARK TWISTED FANTASY', 100, 2, 2010, 'Шедевр электронной музыки', 'MBDTF.jpg', '["Dark Fantasy", "Power", "Runaway", "All of the Lights"]'),
('YEEZUS', 90, 2, 2013, 'Промышленный рок альбом', 'Yeezus.jpg', '["On Sight", "Black Skinhead", "New Slaves", "Bound 2"]'),
('THE LIFE OF PABLO', 80, 3, 2016, 'Духовный альбом', 'TLOP.jpg', '["Ultralight Beam", "Father Stretch My Hands", "Famous", "Wolves"]'),
('JESUS IS KING', 65, 3, 2019, 'Евангельский альбом', 'JIK.jpg', '["Every Hour", "Selah", "Follow God", "Use This Gospel"]'),
('VULTURES 1', 70, 4, 2024, 'Совместный проект', 'V1.jpg', '["Stars", "Back to Me", "Carnival", "Beg Forgiveness"]');

INSERT OR IGNORE INTO shipping_countries (code, name, shipping_cost, is_active, sort_order) VALUES
('US', 'USA', 15, 1, 1),
('EU', 'EUROPE', 25, 1, 2),
('AS', 'ASIA', 35, 1, 3);

INSERT OR IGNORE INTO promo_codes (code, discount_percent, is_active, valid_from, valid_until) VALUES
('YZY', 10, 1, '2026-01-01', '2026-12-31'),
('SUMMER2026', 15, 1, '2026-01-01', '2026-12-31'),
('WELCOME', 5, 1, '2026-01-01', '2026-12-31');

CREATE INDEX IF NOT EXISTS idx_product_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_order_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_shipping_countries_active ON shipping_countries(is_active, sort_order);
