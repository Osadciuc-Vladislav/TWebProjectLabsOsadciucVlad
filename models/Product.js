import { query } from '../config/database.js';

// Получить все товары
export async function getAllProducts() {
    return await query(`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        JOIN categories c ON p.category_id = c.id
        ORDER BY p.created_at DESC
    `, []);
}

// Получить товары по категории
export async function getProductsByCategory(categorySlug) {
    return await query(`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE c.slug = ?
        ORDER BY p.created_at DESC
    `, [categorySlug]);
}

// Получить товар по ID
export async function getProductById(id) {
    const results = await query(`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
    `, [id]);

    return results[0] || null;
}

// Создать новый товар
export async function createProduct(data) {
    const { title, price, category_id, year, description, image_url, tracklist } = data;

    await query(`
        INSERT INTO products (title, price, category_id, year, description, image_url, tracklist)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [title, price, category_id, year, description, image_url, JSON.stringify(tracklist)]);
}

// Обновить товар
export async function updateProduct(id, data) {
    const { title, price, category_id, year, description, image_url, tracklist, stock_quantity } = data;

    await query(`
        UPDATE products 
        SET title = ?, price = ?, category_id = ?, year = ?, description = ?, image_url = ?, tracklist = ?, stock_quantity = ?
        WHERE id = ?
    `, [title, price, category_id, year, description, image_url, JSON.stringify(tracklist), stock_quantity, id]);
}

// Удалить товар
export async function deleteProduct(id) {
    await query(`DELETE FROM products WHERE id = ?`, [id]);
}

// Получить все категории
export async function getAllCategories() {
    return await query(`SELECT * FROM categories ORDER BY name ASC`, []);
}

// Получить категорию по ID
export async function getCategoryById(id) {
    const results = await query(`SELECT * FROM categories WHERE id = ?`, [id]);
    return results[0] || null;
}

// Получить остаток товара
export async function getProductStock(id) {
    const results = await query(`SELECT stock_quantity FROM products WHERE id = ?`, [id]);
    return results[0]?.stock_quantity || 0;
}

// Обновить остаток товара
export async function updateProductStock(id, quantity) {
    await query(`UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`, [quantity, id]);
}

