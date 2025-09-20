const express = require('express');
const router = express.Router();
const trasladoController = require('../controllers/traslado.controller.js');
const { verificarToken } = require('../middleware/auth.middleware.js');
const { autorizar } = require('../middleware/autorizacion.middleware.js');

// Ruta para solicitar un nuevo traslado (protegida y autorizada)
// POST /api/traslados
router.post(
  '/traslados', 
  [verificarToken, autorizar([1, 3, 4])], // Permitimos SU, Jefe y Admin
  trasladoController.solicitarTraslado
);
router.get(
  '/traslados/pendientes',
  [verificarToken, autorizar([3])], // Solo Jefes de Sucursal
  trasladoController.obtenerTrasladosPendientes
);
router.patch(
  '/traslados/:id/respuesta',
  [verificarToken, autorizar([3])], // Solo Jefes de Sucursal
  trasladoController.responderTraslado
);

module.exports = router;