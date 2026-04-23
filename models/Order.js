import { query } from '../config/database.js';

// Получить активные регионы доставки
export async function getActiveShippingCountries() {
    return await query(`
        SELECT id, code, name, shipping_cost
        FROM shipping_countries
        WHERE is_active = 1
        ORDER BY sort_order ASC, name ASC
    `, []);
}

// Получить регион доставки по ID
export async function getShippingCountryById(id) {
    const results = await query(`
        SELECT id, code, name, shipping_cost
        FROM shipping_countries
        WHERE id = ? AND is_active = 1
    `, [id]);

    return results[0] || null;
}

// Создать заказ
export async function createOrder(user_id, items, subtotal, shipping_cost, promo_code, discount_amount = 0, total_amount, address = null, postal_code = null, notes = null) {
    const order_number = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Получаем ID заказа после вставки
    const result = await query(`
        INSERT INTO orders (user_id, order_number, subtotal, shipping_cost, promo_code, discount_amount, total_amount, address, postal_code, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [user_id, order_number, subtotal, shipping_cost, promo_code, discount_amount, total_amount, address, postal_code, notes]);

    const orderId = result.insertId;

    // Вставляем товары в заказ
    for (const item of items) {
        await query(`
            INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES (?, ?, ?, ?)
        `, [orderId, item.id, item.quantity, item.price]);
    }

    return { orderId, order_number };
}

// Получить заказ по ID
export async function getOrderById(id) {
    const order = await query(`
        SELECT o.*, u.username, u.email 
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
    `, [id]);

    if (!order[0]) return null;

    const items = await query(`
        SELECT oi.*, p.title, p.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
    `, [id]);

    return { ...order[0], items };
}

// Получить все заказы пользователя
export async function getUserOrders(user_id) {
    return await query(`
        SELECT o.id, o.user_id, o.order_number, o.status, o.subtotal, o.shipping_cost, 
               o.promo_code, o.discount_amount, o.total_amount, o.address, o.postal_code, 
               o.notes, o.created_at, o.updated_at, COUNT(oi.id) as items_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `, [user_id]);
}

// Получить все заказы (для администратора)
export async function getAllOrders() {
    return await query(`
        SELECT o.id, o.user_id, o.order_number, o.status, o.subtotal, o.shipping_cost, 
               o.promo_code, o.discount_amount, o.total_amount, o.address, o.postal_code, 
               o.notes, o.created_at, o.updated_at, u.username, u.email, COUNT(oi.id) as items_count
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `, []);
}

// Обновить статус заказа
export async function updateOrderStatus(id, status) {
    await query(`UPDATE orders SET status = ? WHERE id = ?`, [status, id]);
}

// Отменить заказ
export async function cancelOrder(id) {
    await query(`UPDATE orders SET status = 'cancelled' WHERE id = ?`, [id]);
}

// Получить товары заказа
export async function getOrderItems(orderId) {
    return await query(`
        SELECT oi.*, p.title, p.image_url, p.price as original_price
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
    `, [orderId]);
}
