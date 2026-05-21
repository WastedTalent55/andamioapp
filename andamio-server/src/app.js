const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const customerRoutes = require('./routes/customerRoutes');

app.use(cors());
app.use(express.json());

// Registrar las rutas de clientes
app.use('/api/customers', customerRoutes);

app.get('/', (req, res) => {
    res.send('El servidor de Andamio está funcionando correctamente 🚀');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});