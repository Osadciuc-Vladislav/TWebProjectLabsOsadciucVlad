import express from 'express';
import jwt from 'jsonwebtoken';
import * as User from '../models/User.js';

const router = express.Router();

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

// POST регистрация
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, confirmPassword, phone, city, country } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        // Проверить, существует ли пользователь
        const existingUser = await User.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const existingUsername = await User.getUserByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        await User.createUser(username, email, password, phone, city, country);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST вход
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const user = await User.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isPasswordValid = await User.verifyPassword(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Создать JWT токен
        const token = jwt.sign(
            { userId: user.id, email: user.email, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                city: user.city,
                country: user.country
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET профиль пользователя
router.get('/profile/:id', async (req, res) => {
    try {
        const user = await User.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            city: user.city,
            country: user.country,
            created_at: user.created_at
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT обновить профиль
router.put('/profile/:id', async (req, res) => {
    try {
        const user = await User.getUserById(req.params.id);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        await User.updateUserProfile(req.params.id, req.body);
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST изменить пароль
router.post('/change-password/:id', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.getUserById(req.params.id);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const isValid = await User.verifyPassword(currentPassword, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        await User.changePassword(req.params.id, newPassword);
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

