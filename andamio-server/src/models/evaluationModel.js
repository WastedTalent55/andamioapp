const db = require('../config/db');


const createEvaluation = async (data) => {

    const {
        tenant_id,
        customer_id,
        address_id,
        scheduled_date,
        evaluation_cost,
        requested_work,
        requirements
    } = data;


    const query = `
        INSERT INTO evaluations
        (
            tenant_id,
            customer_id,
            address_id,
            scheduled_date,
            evaluation_cost,
            requested_work,
            requirements
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;


    const [result] = await db.query(
        query,
        [
            tenant_id,
            customer_id,
            address_id,
            scheduled_date,
            evaluation_cost,
            requested_work,
            requirements
        ]
    );


    return result;

};

const getEvaluations = async (tenant_id)=>{


    const query = `
        SELECT 
            e.*,
            c.first_name,
            c.last_name,
            c.phone,
            ca.full_address AS address

        FROM evaluations e

        INNER JOIN customers c
        ON e.customer_id = c.id

        LEFT JOIN customer_addresses ca
        ON e.address_id = ca.id

        WHERE e.tenant_id = ?

        ORDER BY e.scheduled_date DESC
    `;


    const [rows] = await db.query(query,[tenant_id]);

    return rows;

};

const getEvaluationById = async(id, tenant_id)=>{


    const query = `
        SELECT
            e.*,
            c.first_name,
            c.last_name,
            c.phone,
            ca.full_address AS address

        FROM evaluations e

        JOIN customers c
        ON e.customer_id = c.id

        LEFT JOIN customer_addresses ca
        ON e.address_id = ca.id

        WHERE e.id = ?
        AND e.tenant_id = ?
    `;


    const [rows] = await db.query(query,[id, tenant_id]);

    return rows[0];

};

const updateRequirements = async(id, tenant_id, requirements)=>{


    const query = `
        UPDATE evaluations
        SET requirements = ?
        WHERE id = ?
        AND tenant_id = ?
    `;


    const [result] = await db.query(
        query,
        [
            requirements,
            id,
            tenant_id
        ]
    );


    return result;

};

const updateStatus = async (id, tenant_id, status) => {
    const query = `
        UPDATE evaluations 
        SET status = ? 
        WHERE id = ?
        AND tenant_id = ?
    `;
    const [result] = await db.query(query, [status, id, tenant_id]);
    return result;
};

const syncCancelledStatus = async (tenant_id) => {
    const query = `
        UPDATE evaluations 
        SET status = 'cancelada' 
        WHERE tenant_id = ? 
        AND status = 'pendiente' 
        AND scheduled_date < NOW() 
        AND (requirements IS NULL OR requirements = '')
    `;
    const [result] = await db.query(query, [tenant_id]);
    return result;
};

// 🆕 Conteo agregado en SQL (antes se traían TODAS las evaluaciones del tenant
// a memoria del servidor solo para contarlas con .filter() en el controller)
const getStats = async (tenant_id) => {
    const query = `
        SELECT
            COUNT(*) AS total,
            SUM(status = 'pendiente') AS pendiente,
            SUM(status = 'realizada') AS realizada,
            SUM(status = 'cancelada') AS cancelada
        FROM evaluations
        WHERE tenant_id = ?
    `;

    const [rows] = await db.query(query, [tenant_id]);
    const stats = rows[0];

    return {
        total: Number(stats.total) || 0,
        pendiente: Number(stats.pendiente) || 0,
        realizada: Number(stats.realizada) || 0,
        cancelada: Number(stats.cancelada) || 0
    };
};

module.exports = {

    createEvaluation,
    getEvaluations,
    getEvaluationById,
    updateRequirements,
    updateStatus, 
    syncCancelledStatus,
    getStats

};