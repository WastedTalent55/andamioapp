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





const getEvaluationById = async(id)=>{


    const query = `
        SELECT
            e.*,
            c.first_name,
            c.last_name

        FROM evaluations e

        JOIN customers c
        ON e.customer_id = c.id

        WHERE e.id = ?
    `;


    const [rows] = await db.query(query,[id]);

    return rows[0];

};





const updateRequirements = async(id, requirements)=>{


    const query = `
        UPDATE evaluations
        SET requirements = ?
        WHERE id = ?
    `;


    const [result] = await db.query(
        query,
        [
            requirements,
            id
        ]
    );


    return result;

};



module.exports = {

    createEvaluation,
    getEvaluations,
    getEvaluationById,
    updateRequirements

};