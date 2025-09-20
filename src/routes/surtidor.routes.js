const express = require('express');
const router = express.Router();
const surtidorController = require('../controllers/surtidor.controller.js');
const { verificarToken } = require('../middleware/auth.middleware.js');

router.get('/surtidores/mi-sucursal', verificarToken, surtidorController.obtenerSurtidoresPorSucursalUsuario);

module.exports = router;