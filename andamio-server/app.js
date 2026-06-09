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

app.get('/api/customers', (req, res) => {
    // IMPORTANTE: Hacemos el JOIN para traer la dirección principal
    const query = `
        SELECT 
            c.id, 
            c.first_name, 
            c.last_name, 
            c.phone, 
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
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error al procesar la visita de evaluación' 
                });
            }
            res.json({ 
                success: true, 
                message: 'Evaluación agendada correctamente', 
                id: result.insertId 
            });
        }
    );
});

app.get('/api/customers', (req, res) => {
    const query = `
        SELECT 
            c.id, 
            c.first_name, 
            c.last_name, 
            c.phone, 
            ca.full_address as address 
        FROM customers c
        LEFT JOIN customer_addresses ca ON c.id = ca.customer_id AND ca.is_primary = 1
        ORDER BY c.id DESC`;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener clientes:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }
        res.json({ success: true, data: results });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de Andamio corriendo en http://localhost:${PORT}`);
});