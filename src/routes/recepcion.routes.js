const express = require('express');
const router = express.Router();
const recepcionController = require('../controllers/recepcion.controller.js');
const { verificarToken } = require('../middleware/auth.middleware.js');
const { autorizar } = require('../middleware/autorizacion.middleware.js');

// Roles: 3 (Jefe Sucursal), 4 (Administrativo)
router.post('/recepciones', [verificarToken, autorizar([3, 4])], recepcionController.registrarRecepcion);

module.exports = router;