const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const verifyToken = require('./middleware/auth');
const GOOGLE_CLIENT_ID = '990420064714-v1g3927kpik6bo5tqjuj4qjl86dgd9ff.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

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
// RUTAS PARA TABLERO (BOARD)
// ==========================================
const boardRoutes = require('./src/routes/boardRoutes');

app.use('/api/board', boardRoutes)


// ==========================================
// Ruta para Registrar o Iniciar Sesión con Google
// ==========================================
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: '990420064714-v1g3927kpik6bo5tqjuj4qjl86dgd9ff.apps.googleusercontent.com',
        });
        const payload = ticket.getPayload();
        const { sub: google_id, email, name, picture } = payload;

        // 2. DESESTRUCTURACIÓN: Usamos [rows] para obtener solo los datos
        const [rows] = await db.promise().query('SELECT * FROM users WHERE google_id = ?', [google_id]);

        if (rows.length > 0) {
            const user = rows[0];
            const tokenJWT = jwt.sign({ userId: user.id, tenantId: user.tenant_id }, 'SECRETO_SUPER_SEGURO');
            return res.json({ success: true, token: tokenJWT, user: user });
        }

        // 3. SI ES NUEVO: Creamos la empresa (Tenant)
        // Usamos 'company_name' y 'email' para coincidir con tu tabla profesional
        const [tenantResult] = await db.promise().query(
            'INSERT INTO tenants (company_name, email) VALUES (?, ?)',
            [`Estudio de ${name}`, email]
        );
        const tenant_id = tenantResult.insertId;

        // 4. Creamos al Usuario vinculado a ese Tenant
        const [userResult] = await db.promise().query(
            'INSERT INTO users (tenant_id, google_id, name, email, picture_url, role) VALUES (?, ?, ?, ?, ?, ?)',
            [tenant_id, google_id, name, email, picture, 'admin']
        );

        const tokenJWT = jwt.sign({ userId: userResult.insertId, tenantId: tenant_id }, 'SECRETO_SUPER_SEGURO');

        res.json({
            success: true,
            message: '¡Bienvenido a tu nueva infraestructura!',
            token: tokenJWT,
            tenant_id: tenant_id
        });

    } catch (error) {
        console.error("Falla en la tubería de autenticación:", error);
        res.status(500).json({ success: false, message: 'Error crítico en el servidor' });
    }
});
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