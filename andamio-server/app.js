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
// RUTAS PARA EVALUACIONES (EVALUATIONS)
// ==========================================
const evaluationRoutes = require('./src/routes/evaluationRoutes');

app.use('/api/evaluations', evaluationRoutes);

// ==========================================
// RUTAS PARA COTIZACIONES (QUOTES)
// ==========================================
app.post('/api/quotes', (req, res) => {
    const { 
        evaluation_id, 
        customer_id, 
        delivery_time, 
        total_amount, 
        version_number, 
        items,
        evaluation_discount
    } = req.body;

    const quoteQuery = `
        INSERT INTO quotes (evaluation_id, customer_id, delivery_time, evaluation_discount, total_amount, version_number, status)
        VALUES (?, ?, ?, ?, ?, ?, 'borrador')`;
    db.query(quoteQuery, [evaluation_id, customer_id, delivery_time, evaluation_discount, total_amount, version_number || 1], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        
        const quoteId = result.insertId;
        
        if (items && items.length > 0) {
            const itemQuery = `
                INSERT INTO quote_items (quote_id, type, description, unit_price, quantity, unit, total_price)
                VALUES ?`;
                
            const itemValues = items.map(item => [
                quoteId, 
                item.type, 
                item.description, 
                item.unit_price, 
                item.quantity, 
                item.unit, 
                item.total_price
            ]);

                db.query(itemQuery, [itemValues], (err) => {
                    if (err) return res.status(500).json({ success: false, error: err });
                    res.json({ success: true, quoteId });
                });
            } else {
                res.json({ success: true, quoteId });
            }
        });
});


app.get('/api/quotes', (req, res) => {
    const query = `
        SELECT q.*, CONCAT(c.first_name, ' ', c.last_name) as customer_name 
        FROM quotes q
        JOIN customers c ON q.customer_id = c.id
        ORDER BY q.id DESC`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener cotizaciones:', err);
            return res.status(500).json({ success: false, error: err });
        }
        res.json({ success: true, data: results });
    });
});    

app.post('/api/quotes/items', (req, res) => {
    const { quote_id, type, description, unit_price, quantity, unit } = req.body;
    const total_price = unit_price * quantity;

    const query = `
        INSERT INTO quote_items (quote_id, type, description, unit_price, quantity, unit, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [quote_id, type, description, unit_price, quantity, unit, total_price], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, itemId: result.insertId });
    });
});

app.get('/api/quotes/:id', (req, res) => {
    const { id } = req.params;
    const quoteQuery = "SELECT * FROM quotes WHERE id = ?";
    const itemsQuery = "SELECT * FROM quote_items WHERE quote_id = ?";

    db.query(quoteQuery, [id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ success: false });
        
        db.query(itemsQuery, [id], (err, items) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true, data: { ...results, items: items } }); 
        });
    });
});

app.put('/api/quotes/:id', (req, res) => {
    const { id } = req.params;
    const { delivery_time, total_amount, items, evaluation_discount } = req.body;

    const updateQuoteQuery = "UPDATE quotes SET delivery_time = ?, evaluation_discount = ?, total_amount = ? WHERE id = ?";
    
    db.query(updateQuoteQuery, [delivery_time, evaluation_discount, total_amount, id], (err) => {
        if (err) {
            console.error('❌ Error al actualizar tabla quotes:', err);
            return res.status(500).json({ success: false, error: err });
        }

        const deleteItemsQuery = "DELETE FROM quote_items WHERE quote_id = ?";
        db.query(deleteItemsQuery, [id], (err) => {
            if (err) {
                console.error('❌ Error al refrescar ítems:', err);
                return res.status(500).json({ success: false, error: err });
            }

            if (items && items.length > 0) {
                const itemQuery = `
                    INSERT INTO quote_items (quote_id, type, description, unit_price, quantity, unit, total_price)
                    VALUES ?`;
                
                const itemValues = items.map(item => [
                    id,
                    item.type,
                    item.description,
                    item.unit_price,
                    item.quantity,
                    item.unit,
                    item.total_price
                ]);

                db.query(itemQuery, [itemValues], (err) => {
                    if (err) {
                        console.error('❌ Error al insertar nuevos ítems:', err);
                        return res.status(500).json({ success: false, error: err });
                    }
                    res.json({ success: true, message: '✅ Cotización e ítems actualizados con éxito' });
                });
            } else {
                res.json({ success: true, message: '✅ Cotización actualizada (sin ítems nuevos)' });
            }
        });
    });
});

app.get('/api/quotes/evaluation/:evaluationId', (req, res) => {
    const { evaluationId } = req.params;
    const query = `
        SELECT q.id as quote_id, e.requirements, q.status, q.total_amount, q.evaluation_discount
        FROM evaluations e
        LEFT JOIN quotes q ON q.evaluation_id = e.id
        WHERE e.id = ?
        ORDER BY q.id DESC LIMIT 1`; 

    db.query(query, [evaluationId], (err, results) => {
        if (err || results.length === 0) return res.json({ success: true, data: { items: [] } });
        
        const quoteData = results[0];
        const itemsQuery = "SELECT * FROM quote_items WHERE quote_id = ?";
        db.query(itemsQuery, [quoteData.quote_id], (err, items) => {
            res.json({ success: true, data: { ...quoteData, items: items } });
        });
    });
});

// ==========================================
// RUTAS PARA TABLERO (BOARD)
// ==========================================
app.get('/api/board/summary', verifyToken, (req, res) => {
    const tenantId = req.user.tenantId;

    const query = `
        SELECT 
            e.id as eval_id, 
            e.scheduled_date as eval_date, 
            c.phone,
            e.requirements,
            CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) as customer_name, 
            ca.full_address as customer_address,
            q.id as quote_id,
            q.total_amount,
            q.status as quote_status,
            q.version_number
        FROM evaluations e
        JOIN customers c ON e.customer_id = c.id
        LEFT JOIN customer_addresses ca ON e.address_id = ca.id
        LEFT JOIN quotes q ON e.id = q.evaluation_id
        WHERE e.tenant_id = ?
        ORDER BY e.scheduled_date ASC`;

    db.query(query, [tenantId], (err, results) => {
        if (err) {
            console.error("❌ Error SQL:", err);
            return res.status(500).json({ success: false, error: err.message });
        }

        const data = results || [];
        const summary = {
            evaluations: data.filter(r => !r.quote_id),
            quoting: data.filter(r => r.quote_id && r.quote_status === 'borrador'),
            active: data.filter(r => r.quote_status === 'aceptada'),
            finished: data.filter(r => r.quote_status === 'finalizada')
        };
        
        res.json({ success: true, data: summary });
    });
});


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