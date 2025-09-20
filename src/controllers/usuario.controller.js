const usuarioModel = require('../models/usuario.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 

// Controlador para registrar un nuevo usuario
const registrarUsuario = async (req, res) => {
  const { rut, nombre, apellido, password, id_rol, id_sucursal } = req.body;

  try {
    // Validaciones básicas (se pueden expandir)
    if (!rut || !nombre || !password || !id_rol || !id_sucursal) {
      return res.status(400).json({ mensaje: 'Faltan datos obligatorios.' });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Llamar al modelo para crear el usuario
    const nuevoUsuario = await usuarioModel.crear(rut, nombre, apellido, passwordHash, id_rol, id_sucursal);

    // Omitir el password_hash en la respuesta por seguridad
    const usuarioParaResponder = { ...nuevoUsuario };
    delete usuarioParaResponder.password_hash;

    res.status(201).json({ mensaje: 'Usuario registrado exitosamente.', usuario: usuarioParaResponder });

  } catch (error) {
    // El manejo de errores tampoco cambia
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Error: El RUT ya existe.' });
    }
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor al registrar el usuario.', error: error.message });
  }
};


const iniciarSesion = async (req, res) => {
  const { rut, password, id_sucursal } = req.body;

     try {
    // NUEVO: Validación para asegurar que los tres campos vienen en la petición
    if (!rut || !password || !id_sucursal) {
      return res.status(400).json({ mensaje: 'RUT, contraseña y sucursal son obligatorios.' });
    }

    // 1. Verificar si el usuario existe (sin cambios)
    const usuario = await usuarioModel.findByRut(rut);
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    }

    // NUEVO: 2. Verificar que la sucursal de la petición coincide con la del usuario en la BD
    if (usuario.id_sucursal !== parseInt(id_sucursal)) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    }

    // 3. Comparar la contraseña (sin cambios, ahora es el paso 3)
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    }

    // 4. Generar el JWT (sin cambios)
    const payload = {
      id: usuario.id_usuario,
      rol: usuario.id_rol,
      sucursal: usuario.id_sucursal
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // 5. Enviar la respuesta (sin cambios)
    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso.',
      token: token
    });

  } catch (error) {
    console.error("Error en inicio de sesión:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor.', error: error.message });
  }
};

const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    // Usamos la nueva función que incluye los JOINs
    const usuario = await usuarioModel.findById(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }
    res.status(200).json(usuario);
  } catch (error) {
    console.error("Error al obtener usuario por ID:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};


const obtenerPerfil = async (req, res) => {
  // El middleware 'verificarToken' ya hizo el trabajo pesado.
  // Ya sabemos que el usuario es válido y tenemos su info en req.usuario.
  const usuarioId = req.usuario.id;

  try {
    const usuario = await usuarioModel.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }
    res.status(200).json(usuario);
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await usuarioModel.obtenerTodos();
    res.status(200).json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

const actualizarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Validación simple
    if (!estado) {
      return res.status(400).json({ mensaje: 'El campo "estado" es obligatorio.' });
    }

    const usuario = await usuarioModel.actualizarEstado(id, estado);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }
    res.status(200).json({ mensaje: `Usuario ${estado.toLowerCase()} exitosamente.`, usuario });
  } catch (error) {
    // Manejo del error personalizado del modelo
    if (error.message === 'Estado no válido') {
      return res.status(400).json({ mensaje: 'El estado solo puede ser "Activo" o "Inactivo".' });
    }
    console.error("Error al cambiar estado de usuario:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioActualizado = await usuarioModel.actualizar(id, req.body);
    if (!usuarioActualizado) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }
    res.status(200).json({ mensaje: 'Usuario actualizado exitosamente.', usuario: usuarioActualizado });
  } catch (error) {
    if (error.code === '23505') { // Error de RUT duplicado
      return res.status(409).json({ mensaje: 'Error: El RUT ya existe.' });
    }
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};


module.exports = {
  registrarUsuario,
  iniciarSesion,
  obtenerPerfil,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarEstadoUsuario,
  actualizarUsuario
};