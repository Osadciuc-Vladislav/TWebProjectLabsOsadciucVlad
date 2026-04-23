import { query } from '../config/database.js';

// Получить промокод по коду
export async function getPromoCodeByCode(code) {
    const normalizedCode = String(code || '').trim().toUpperCase();

    const results = await query(`
        SELECT * FROM promo_codes 
        WHERE code = ? AND is_active = 1
        AND (max_uses = -1 OR times_used < max_uses)
        AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
        AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
    `, [normalizedCode]);

    return results[0] || null;
}

// Применить промокод
export async function applyPromoCode(code) {
    const promo = await getPromoCodeByCode(code);

    if (!promo) return null;

    if (promo.max_uses !== -1 && promo.times_used >= promo.max_uses) {
        return null; // Лимит использований достигнут
    }

    // Увеличить количество использований
    await query(`UPDATE promo_codes SET times_used = times_used + 1 WHERE id = ?`, [promo.id]);

    return promo;
}

// Получить все промокоды
export async function getAllPromoCodes() {
    return await query(`SELECT * FROM promo_codes ORDER BY created_at DESC`, []);
}

// Создать промокод
export async function createPromoCode(code, discount_percent, max_uses, valid_from, valid_until) {
    await query(`
        INSERT INTO promo_codes (code, discount_percent, max_uses, valid_from, valid_until)
        VALUES (?, ?, ?, ?, ?)
    `, [code, discount_percent, max_uses, valid_from, valid_until]);
}

// Удалить промокод
export async function deletePromoCode(id) {
    await query(`DELETE FROM promo_codes WHERE id = ?`, [id]);
}

// Деактивировать промокод
export async function deactivatePromoCode(id) {
    await query(`UPDATE promo_codes SET is_active = FALSE WHERE id = ?`, [id]);
}

