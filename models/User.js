import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

// Создать нового пользователя с дополнительными полями
export async function createUser(username, email, password, phone = null, city = null, country = null) {
    const passwordHash = await bcrypt.hash(password, 10);
    await query(
        'INSERT INTO users (username, email, password_hash, phone, city, country) VALUES (?, ?, ?, ?, ?, ?)',
        [username, email, passwordHash, phone, city, country]
    );
}

// Получить пользователя по email
export async function getUserByEmail(email) {
    const results = await query('SELECT * FROM users WHERE email = ?', [email]);
    return results[0] || null;
}

// Получить пользователя по ID
export async function getUserById(id) {
    const results = await query('SELECT * FROM users WHERE id = ?', [id]);
    return results[0] || null;
}

// Получить пользователя по username
export async function getUserByUsername(username) {
    const results = await query('SELECT * FROM users WHERE username = ?', [username]);
    return results[0] || null;
}

// Проверить пароль
export async function verifyPassword(password, passwordHash) {
    return await bcrypt.compare(password, passwordHash);
}

// Обновить профиль пользователя
export async function updateUserProfile(id, userData) {
    const allowedFields = ['username', 'email', 'phone', 'city', 'country', 'is_active'];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
        if (userData[field] !== undefined) {
            updates.push(`${field} = ?`);
            values.push(userData[field]);
        }
    }

    if (updates.length === 0) {
        return { changes: 0 };
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    return await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
    );
}

// Изменить пароль пользователя
export async function changePassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    return await query(
        'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [passwordHash, id]
    );
}
