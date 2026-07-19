require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const verifyToken = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: 'Valentina$12',      
    database: 'andamio_db' 
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('✅ Conectado exitosamente a la base de datos MySQL');
});

// ==========================================
// CLIENTXS (CUSTOMERS)
// ==========================================
const customerRoutes = require('./src/routes/customerRoutes');

app.use('/api/customers', customerRoutes);

// ==========================================
// EVALUACIONES (EVALUATIONS)
// ==========================================
const evaluationRoutes = require('./src/routes/evaluationRoutes');

app.use('/api/evaluations', evaluationRoutes);

// ==========================================
// COTIZACIONES (QUOTES)
// ==========================================
const quoteRoutes = require('./src/routes/quoteRoutes');

app.use('/api/quotes', quoteRoutes);

// ==========================================
// TABLERO (BOARD)
// ==========================================
const boardRoutes = require('./src/routes/boardRoutes');

app.use('/api/board', boardRoutes)


// ==========================================
// Ruta para Registrar o Iniciar Sesión con Google
// ==========================================
const authRoutes = require('./src/routes/authRoutes');

app.use('/api/auth', authRoutes);

// ==========================================
// Ruta para guardar informacion del tenant
// ==========================================
app.put('/api/tenants/:id', (req, res) => {
        const { id } = req.params;
        const { company_name, owner_name, email, phone, address, bank_name, bank_account, bank_clabe, logo_base64 } = req.body;


        const query = `
          UPDATE tenants SET 
          company_name = ?, owner_name = ?, email = ?, phone = ?, 
          address = ?, bank_name = ?, bank_account = ?, bank_clabe = ?, logo = ?
          WHERE id = ?
        `;


        db.query(query, [company_name, owner_name, email, phone, address, bank_name, bank_account, bank_clabe, logo_base64, id], (err) => {
          if (err) return res.status(500).json({ success: false, error: err });
          res.json({ success: true, message: 'Infraestructura de empresa actualizada' });
        });
});

        
app.post('/api/tenants/update', (req, res) => {
    const { tenant_id, company_name, owner_name, email, phone, address, bank_name, bank_account, bank_clabe, logo_base64 } = req.body;

    // Aquí usamos el tenant_id para asegurar que solo actualices TU empresa [4]
    const query = `
        UPDATE tenants SET 
        company_name = ?, owner_name = ?, email = ?, phone = ?, 
        address = ?, bank_name = ?, bank_account = ?, bank_clabe = ?, logo = ?
        WHERE id = ?`; // El ID vendría de tu sesión de usuario




    db.query(query, [company_name, owner_name, email, phone, address, bank_name, bank_account, bank_clabe, logo_base64, tenant_id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, message: 'Datos actualizados' });
    });
});

app.get('/api/tenants/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM tenants WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        // MySQL devuelve un array, enviamos el primer objeto
        res.json({ success: true, data: results }); 
    });
});


app.get('/api/test-auth', verifyToken, (req, res) => {

    res.json({
        success: true,
        message: 'Token válido',
        user: req.user
    });

});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de Andamio corriendo en http://localhost:${PORT}`);
});