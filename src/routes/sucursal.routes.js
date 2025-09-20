const express = require('express');
const router = express.Router();
const sucursalController = require('../controllers/sucursal.controller.js');

// Ruta pública para obtener la lista de sucursales activas
// GET /api/sucursales
router.get('/sucursales', sucursalController.obtenerSucursalesActivas);

module.exports = router;