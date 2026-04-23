import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import productsRouter from './routes/products.js';
import usersRouter from './routes/users.js';
import ordersRouter from './routes/orders.js';
import { router as promoCodesRouter } from './routes/promoCodes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Логирование запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/users', usersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/promo-codes', promoCodesRouter);

// Frontend entry point
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Обработка 404
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Обработка ошибок
app.use((err, req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
    console.log(`🎵 YZY VNYL Server running on http://localhost:${PORT}`);
    console.log(`📊 API Documentation:`);
    console.log(`   GET  /api/health - Server health check`);
    console.log(`   GET  /api/products - Get all products`);
    console.log(`   GET  /api/products/:id - Get product by ID`);
    console.log(`   POST /api/users/register - Register new user`);
    console.log(`   POST /api/users/login - Login user`);
    console.log(`   POST /api/orders - Create order`);
    console.log(`   GET  /api/promo-codes/:code - Validate promo code`);
});


