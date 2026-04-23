import express from 'express';
import jwt from 'jsonwebtoken';
import * as Order from '../models/Order.js';
import * as PromoCode from '../models/PromoCode.js';
import * as Product from '../models/Product.js';
import * as User from '../models/User.js';

const router = express.Router();

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const [, token] = authHeader.split(' ');

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// POST создать заказ
router.post('/', requireAuth, async (req, res) => {
    try {
        const { items, shipping_country_id, promo_code, address, postal_code, notes } = req.body;
        const user_id = req.user.userId;

        // Проверить существование пользователя
        const user = await User.getUserById(user_id);
        if (!user) {
            return res.status(401).json({ error: 'User not found. Please log in again.' });
        }

        if (!user_id || !items || items.length === 0 || !shipping_country_id || !address || !postal_code) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const shippingCountry = await Order.getShippingCountryById(Number(shipping_country_id));
        if (!shippingCountry) {
            return res.status(400).json({ error: 'Invalid shipping country' });
        }

        const shipping_cost = Number(shippingCountry.shipping_cost) || 0;

        let subtotal = 0;
        let discountAmount = 0;
        const normalizedItems = [];

        // Рассчитать сумму
        for (const item of items) {
            const product = await Product.getProductById(item.id);
            if (!product) {
                return res.status(400).json({ error: `Product not found: ${item.id}` });
            }

            const quantity = Number(item.quantity) || 1;
            const price = Number(item.price ?? product.price);

            subtotal += price * quantity;
            normalizedItems.push({ id: product.id, quantity, price });
        }

        // Проверить промокод
        if (promo_code) {
            const promo = await PromoCode.applyPromoCode(promo_code);
            if (promo) {
                discountAmount = Math.floor(subtotal * (promo.discount_percent / 100));
            }
        }

        const totalAmount = subtotal - discountAmount + shipping_cost;

        const { orderId, order_number } = await Order.createOrder(
            user_id,
            normalizedItems,
            subtotal,
            shipping_cost,
            promo_code,
            discountAmount,
            totalAmount,
            address,
            postal_code,
            notes
        );

        res.status(201).json({
            message: 'Order created successfully',
            orderId,
            order_number,
            totalAmount,
            shipping_country: shippingCountry.name,
            shipping_cost
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET список активных регионов доставки
router.get('/shipping-countries', async (req, res) => {
    try {
        const countries = await Order.getActiveShippingCountries();
        res.json(countries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET заказ по ID
router.get('/user/:user_id', requireAuth, async (req, res) => {
    try {
        const requestedUserId = Number(req.params.user_id);
        if (req.user.userId !== requestedUserId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const orders = await Order.getUserOrders(req.params.user_id);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET заказ по ID
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.getOrderById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT обновить статус заказа
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await Order.updateOrderStatus(req.params.id, status);
        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST отменить заказ
router.post('/:id/cancel', async (req, res) => {
    try {
        await Order.cancelOrder(req.params.id);
        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
