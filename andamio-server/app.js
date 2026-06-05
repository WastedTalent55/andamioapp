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
    const query = 'SELECT * FROM customers';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener clientes:', err);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor al obtener clientes'
            });
        }
        
        res.json({
            success: true,
            data: results
        });
    });
});

app.post('/api/customers', (req, res) => {
    const { first_name, last_name, email, phone } = req.body;
    const query = 'INSERT INTO customers (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)';
    
    db.query(query, [first_name, last_name, email, phone], (err, result) => {
        if (err) {
            console.error('Error al insertar cliente:', err);
            return res.status(500).json({ success: false, message: 'Error al guardar el cliente' });
        }
        res.json({ success: true, message: 'Cliente registrado con éxito', id: result.insertId });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de Andamio corriendo en http://localhost:${PORT}`);
});