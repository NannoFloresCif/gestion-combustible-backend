const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rol.controller.js');
const { verificarToken } = require('../middleware/auth.middleware.js');

router.get('/roles', verificarToken, rolController.obtenerRoles);

module.exports = router;