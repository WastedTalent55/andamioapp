const Board = require('../models/boardModel');

const BoardService = {

    // Reparte las filas del board en las 4 columnas del Kanban.
    // Regla clave: una cotización 'rechazada' no cae en ninguna columna — sigue
    // existiendo en la BD (visible en quote-list / historial del cliente), pero
    // deja de "importar" operativamente, tal como se definió con el usuario.
    getSummary: async (tenantId) => {

        const rows = await Board.getSummary(tenantId);

        const summary = {

            // Sin cotización todavía: la evaluación está pendiente/en curso
            evaluations: rows.filter(r => !r.quote_id),

            // Con cotización, sin proyecto todavía, y no rechazada:
            // cubre 'borrador' (armándose) y 'enviada' (esperando respuesta del cliente)
            quoting: rows.filter(r =>
                r.quote_id &&
                !r.project_id &&
                (r.quote_status === 'borrador' || r.quote_status === 'enviada')
            ),

            // El proyecto ya existe y sigue en curso (activo o pausado)
            active: rows.filter(r =>
                r.project_id &&
                (r.project_status === 'activo' || r.project_status === 'pausado')
            ),

            // El proyecto se cerró, bien o mal
            finished: rows.filter(r =>
                r.project_id &&
                (r.project_status === 'finalizado' || r.project_status === 'cancelado')
            )

            // 'rechazada' sin proyecto: intencionalmente no se agrega a ningún array.

        };

        return summary;
    }

};

module.exports = BoardService;