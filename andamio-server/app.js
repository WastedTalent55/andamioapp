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
            ca.full_address AS address 
        FROM customers c
        LEFT JOIN customer_addresses ca ON c.id = ca.customer_id AND ca.is_primary = 1
        ORDER BY c.first_name ASC`;
    
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
app.get('/api/board/summary', (req, res) => {
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
        ORDER BY e.scheduled_date ASC`;

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