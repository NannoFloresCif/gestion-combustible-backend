const reporteModel = require('../models/reporte.model');

const obtenerReporteDesviaciones = async (req, res) => {
  try {
    // Obtenemos los filtros de la URL, ej: ?fecha_inicio=2025-09-10&fecha_fin=2025-09-12
    const { fecha_inicio, fecha_fin } = req.query;
    // Obtenemos los datos del usuario del token
    const { rol, sucursal } = req.usuario;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ mensaje: 'Los parámetros de fecha de inicio y fin son obligatorios.' });
    }

    // Por ahora, la lógica de autorización es simple: Jefes y superiores pueden ver el reporte de su sucursal.
    // Podríamos expandirla para que Gerencia/SU puedan elegir sucursal.
    const idSucursalParaReporte = sucursal;

    const filtros = {
      sucursalId: idSucursalParaReporte,
      fechaInicio: fecha_inicio,
      fechaFin: fecha_fin
    };

    const reporte = await reporteModel.generarReporteDesviaciones(filtros);
    res.status(200).json(reporte);

  } catch (error) {
    console.error("Error al generar reporte de desviaciones:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

module.exports = {
  obtenerReporteDesviaciones
};