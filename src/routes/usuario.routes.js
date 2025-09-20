const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller.js');
const { verificarToken } = require('../middleware/auth.middleware.js');
const { autorizar } = require('../middleware/autorizacion.middleware.js');

// Ruta para registrar un nuevo usuario
// POST /api/usuarios
router.post('/usuarios', usuarioController.registrarUsuario);
router.post('/login', usuarioController.iniciarSesion);

router.get('/perfil', verificarToken, usuarioController.obtenerPerfil);
                            // ^^^
                            // Aquí está la magia. Express ejecutará 'verificarToken' PRIMERO.
                            // Si 'verificarToken' llama a next(), entonces se ejecutará 'obtenerPerfil'.
                            // Si no, la petición terminará en el middleware con un error.

router.get('/usuarios',[verificarToken, autorizar([1])], usuarioController.obtenerUsuarios);

router.get('/usuarios/:id', [verificarToken, autorizar([1])], usuarioController.obtenerUsuarioPorId);

router.patch('/usuarios/:id/estado',[verificarToken, autorizar([1])],usuarioController.actualizarEstadoUsuario);

router.put('/usuarios/:id', [verificarToken, autorizar([1])], usuarioController.actualizarUsuario);

module.exports = router;