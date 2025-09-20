const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporte.controller.js');
const { verificarToken } = require('../middleware/auth.middleware.js');
const { autorizar } = require('../middleware/autorizacion.middleware.js');

// GET /api/reportes/desviaciones
router.get(
  '/reportes/desviaciones',
  [verificarToken, autorizar([1, 2, 3])], // Permitimos SU, Gerencia y Jefes
  reporteController.obtenerReporteDesviaciones
);

module.exports = router;