import express from 'express';
import * as Product from '../models/Product.js';

const router = express.Router();

// GET все товары
router.get('/', async (req, res) => {
    try {
        const products = await Product.getAllProducts();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET товары по категории
router.get('/category/:slug', async (req, res) => {
    try {
        const products = await Product.getProductsByCategory(req.params.slug);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET товар по ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST создать новый товар (требуется авторизация администратора)
router.post('/', async (req, res) => {
    try {
        const { title, price, category_id, year, description, image_url, tracklist } = req.body;

        if (!title || !price || !category_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        await Product.createProduct(req.body);
        res.status(201).json({ message: 'Product created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT обновить товар
router.put('/:id', async (req, res) => {
    try {
        await Product.updateProduct(req.params.id, req.body);
        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE удалить товар
router.delete('/:id', async (req, res) => {
    try {
        await Product.deleteProduct(req.params.id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

