import express from 'express';
import { getPromoCodeByCode } from '../models/PromoCode.js';

const router = express.Router();

// GET промокод по коду
router.get('/:code', async (req, res) => {
    try {
        const code = String(req.params.code || '').trim().toUpperCase();

        if (!code) {
            return res.status(400).json({ error: 'Promo code is required' });
        }

        const promo = await getPromoCodeByCode(code);

        if (!promo) {
            return res.status(404).json({ error: 'Promo code not found or inactive' });
        }

        res.json({
            id: promo.id,
            code: promo.code,
            discount_percent: promo.discount_percent,
            max_uses: promo.max_uses,
            times_used: promo.times_used,
            valid_from: promo.valid_from,
            valid_until: promo.valid_until
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export { router };

