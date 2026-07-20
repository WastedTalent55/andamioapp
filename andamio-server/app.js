require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ================================
// ROUTES
// ================================

app.use('/api/auth', require('./src/routes/authRoutes'));

app.use('/api/customers', require('./src/routes/customerRoutes'));

app.use('/api/evaluations', require('./src/routes/evaluationRoutes'));

app.use('/api/quotes', require('./src/routes/quoteRoutes'));

app.use('/api/board', require('./src/routes/boardRoutes'));

app.use('/api/tenants', require('./src/routes/tenantRoutes'));

app.use('/api/test-auth', require('./src/routes/testRoutes'));

// ================================
// SERVER
// ================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(
        `🚀 Servidor de Andamio corriendo en http://localhost:${PORT}`
    );
});