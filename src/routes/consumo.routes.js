const express = require('express');
const router = express.Router();
const consumoController = require('../controllers/consumo.controller.js');
const { verificarToken } = require('../middleware/auth.middleware.js');
const { autorizar } = require('../middleware/autorizacion.middleware.js');

// Ruta para registrar un nuevo consumo (protegida)
// POST /api/consumos
router.post('/consumos', verificarToken, consumoController.registrarConsumo);
router.get('/consumos', verificarToken, [autorizar([1, 2, 3, 4])], consumoController.obtenerConsumos);
router.patch('/consumos/:id/eliminar', [verificarToken, autorizar([1, 3, 4])], consumoController.eliminarConsumo);

module.exports = router;