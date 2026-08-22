const Activity = require('../models/activityModel');

// Etiqueta y color de cada tipo de evento — vive aquí (no en el frontend)
// porque es una regla de negocio: qué tan "importante" es cada estatus.
const QUOTE_LABELS = {
    borrador: { title: 'Cotización creada', color: 'blue' },
    enviada: { title: 'Cotización enviada', color: 'yellow' },
    aceptada: { title: 'Cotización aceptada', color: 'green' },
    rechazada: { title: 'Cotización rechazada', color: 'red' }
};

const ActivityService = {

    // Trae lo más reciente de evaluaciones/cotizaciones/proyectos, las mezcla
    // y regresa solo las `limit` más recientes en total — no por tabla.
    getRecent: async (tenantId, limit = 6) => {

        const [evaluations, quotes, projects] = await Promise.all([
            Activity.getRecentEvaluations(tenantId, limit),
            Activity.getRecentQuotes(tenantId, limit),
            Activity.getRecentProjects(tenantId, limit)
        ]);

        const items = [];

        evaluations.forEach(e => {
            items.push({
                type: 'evaluation',
                title: 'Evaluación creada',
                subtitle: e.requested_work || e.customer_name,
                color: 'blue',
                created_at: e.created_at
            });
        });

        quotes.forEach(q => {
            const label = QUOTE_LABELS[q.status] || QUOTE_LABELS.borrador;
            items.push({
                type: 'quote',
                title: label.title,
                subtitle: `${q.customer_name} · Folio #${q.quote_folio}`,
                color: label.color,
                created_at: q.created_at
            });
        });

        projects.forEach(p => {
            items.push({
                type: 'project',
                title: 'Proyecto iniciado',
                subtitle: p.project_name,
                color: 'green',
                created_at: p.created_at
            });
        });

        items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return items.slice(0, limit);
    }

};

module.exports = ActivityService;