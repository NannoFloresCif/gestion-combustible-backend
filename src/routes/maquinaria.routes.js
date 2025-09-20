const express = require('express');
const router = express.Router();
const maquinariaController = require('../controllers/maquinaria.controller.js');
const { verificarToken } = require('../middleware/auth.middleware.js');
const { autorizar } = require('../middleware/autorizacion.middleware.js');

// Ruta para obtener toda la maquinaria (protegida)
// GET /api/maquinaria
router.get('/maquinaria', verificarToken, maquinariaController.obtenerMaquinaria); // logica del controlador decide que mostrar

router.get('/maquinaria/mi-sucursal', verificarToken, maquinariaController.obtenerMaquinariaPorSucursalUsuario);

router.get('/maquinaria/:id', verificarToken, maquinariaController.obtenerMaquinariaPorId);

router.post('/maquinaria', [verificarToken, autorizar([1])], maquinariaController.crearMaquina);

module.exports = router;