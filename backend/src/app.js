require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const dashboardRoutes = require('./routes/dashboard');
const warehouseRoutes = require('./routes/warehouses');
const categoryRoutes = require('./routes/categories');
const receiptRoutes = require('./routes/receipts');
const deliveryRoutes = require('./routes/deliveries');
const transferRoutes = require('./routes/transfers');
const adjustmentRoutes = require('./routes/adjustments');
const moveHistoryRoutes = require('./routes/moveHistory');
const alertRoutes = require('./routes/alerts');

const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(morgan('dev'));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/warehouses', warehouseRoutes);
app.use('/categories', categoryRoutes);
app.use('/receipts', receiptRoutes);
app.use('/deliveries', deliveryRoutes);
app.use('/transfers', transferRoutes);
app.use('/adjustments', adjustmentRoutes);
app.use('/move-history', moveHistoryRoutes);
app.use('/alerts', alertRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
