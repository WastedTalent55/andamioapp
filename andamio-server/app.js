const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

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
// RUTAS PARA CLIENTXS (CUSTOMERS)
// ==========================================
app.get('/api/customers', (req, res) => {
    const query = `
        SELECT 
            c.id, 
            c.first_name, 
            c.last_name, 
            c.phone, 
            ca.id AS address_id,
            ca.full_address AS address -- Aquí creamos el rubro 'address' que Angular espera
        FROM customers c
        LEFT JOIN customer_addresses ca ON c.id = ca.customer_id AND ca.is_primary = 1
        ORDER BY c.id DESC`;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener clientes con dirección:', err);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor al obtener la lista completa'
            });
        }
        
        res.json({
            success: true,
            data: results
        });
    });
});

app.post('/api/customers', (req, res) => {
    const { first_name, last_name, phone, address } = req.body;

    const customerQuery = 'INSERT INTO customers (first_name, last_name, phone) VALUES (?, ?, ?)';
    
    db.query(customerQuery, [first_name, last_name, phone], (err, result) => {
        if (err) {
            console.error('Error al insertar cliente:', err);
            return res.status(500).json({ success: false, message: 'Error al guardar el cliente' });
        }

        const customerId = result.insertId;

        const addressQuery = 'INSERT INTO customer_addresses (customer_id, address_label, full_address, is_primary) VALUES (?, ?, ?, ?)';
        
        db.query(addressQuery, [customerId, 'Principal', address, 1], (err) => {
            if (err) {
                console.error('Error al insertar dirección:', err);
                return res.status(201).json({ 
                    success: true, 
                    message: 'Cliente creado pero hubo un error al guardar la dirección', 
                    id: customerId 
                });
            }
            
            res.json({ 
                success: true, 
                message: 'Cliente y dirección registrados con éxito', 
                id: customerId 
            });
        });
    });
});

// ==========================================
// RUTAS PARA EVALUACIONES (EVALUATIONS)
// ==========================================
app.post('/api/evaluations', (req, res) => {
    const { 
        customer_id, 
        address_id,      
        scheduled_date, 
        evaluation_cost, 
        requested_work,  
        requirements 
    } = req.body;

    const query = `
        INSERT INTO evaluations 
        (customer_id, address_id, scheduled_date, evaluation_cost, requested_work, requirements) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        query, 
        [customer_id, address_id, scheduled_date, evaluation_cost || 0, requested_work, requirements], 
        (err, result) => {
            if (err) {
                console.error('Error al agendar evaluación:', err);
                return res.status(500).json({ success: false, message: 'Error en el servidor' });
            }
            res.json({ success: true, message: 'Evaluación agendada correctamente', id: result.insertId });
        }
    );
});

app.get('/api/evaluations', (req, res) => {
    const query = `
        SELECT 
            e.id, 
            e.scheduled_date,
            e.requested_work, 
            e.evaluation_cost, 
            e.status,
            c.first_name, 
            c.last_name, 
            c.phone, 
            ca.full_address AS address
        FROM evaluations e
        LEFT JOIN customers c ON e.customer_id = c.id
        LEFT JOIN customer_addresses ca ON e.address_id = ca.id 
        ORDER BY e.id DESC`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al consultar MySQL:', err);
            return res.status(500).json({ success: false, error: err });
        }
        console.log("Resultados enviados al frontend:", results.length, "filas");
        res.json({ success: true, data: results });
    });
});

app.put('/api/evaluations/:id', (req, res) => {
    const { id } = req.params;
    const { requirements } = req.body; 

    const query = 'UPDATE evaluations SET requirements = ? WHERE id = ?';

    db.query(query, [requirements, id], (err, result) => {
        if (err) {
            console.error('Error al guardar notas:', err);
            return res.status(500).json({ success: false });
        }
        res.json({ success: true, message: 'Notas vinculadas con éxito' });
    });
});

app.get('/api/evaluations/:id', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT 
            e.*, 
            c.first_name, 
            c.last_name 
        FROM evaluations e
        JOIN customers c ON e.customer_id = c.id
        WHERE e.id = ?
    `;
    
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length > 0) {
            res.json(results[0]); 
        } else {
            res.status(404).json({ message: "Evaluación no encontrada" });
        }
    });
});

// ==========================================
// RUTAS PARA COTIZACIONES (QUOTES)
// ==========================================
app.post('/api/quotes', (req, res) => {
    const { evaluation_id, customer_id, delivery_time } = req.body;

    const getEvalCost = "SELECT evaluation_cost FROM evaluations WHERE id = ?";
    
    db.query(getEvalCost, [evaluation_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        
        const discount = results?.evaluation_cost || 0;
        const query = `
            INSERT INTO quotes (evaluation_id, customer_id, delivery_time, evaluation_discount, status)
            VALUES (?, ?, ?, ?, 'borrador')`;

        db.query(query, [evaluation_id, customer_id, delivery_time || '2 DIAS', discount], (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err });
            res.json({ success: true, quoteId: result.insertId, applied_discount: discount });
        });
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

    db.query(quoteQuery, [id], (err, quote) => {
        if (err) return res.status(500).json({ success: false });
        
        db.query(itemsQuery, [id], (err, items) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true, quote: quote, items: items });
        });
    });
});

// ==========================================
// RUTAS PARA TABLERO (BOARD)
// ==========================================
app.get('/api/board/summary', (req, res) => {
    const query = `
        SELECT 
            e.id as eval_id, 
            e.scheduled_date as eval_date, 
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
    `;

    db.query(query, (err, results) => {
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



const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de Andamio corriendo en http://localhost:${PORT}`);
});