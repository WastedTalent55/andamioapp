const mysql = require('mysql2');
require('dotenv').config();
const buildMysqlOptions = require('./mysqlOptions');

const pool = mysql.createPool(buildMysqlOptions());

// Prueba de conexión

pool.promise()
    .query('SELECT 1')
    .then(() => {
        console.log('✅ Conectado exitosamente a MySQL');
    })
    .catch(err => {
        console.error('❌ Error conectando a MySQL:', err);
    });



module.exports = pool.promise();
