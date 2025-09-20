const maquinariaModel = require('../models/maquinaria.model');

// Controlador para obtener toda la maquinaria
const obtenerMaquinaria = async (req, res) => {
  try {
    // Obtenemos el rol y la sucursal del usuario desde el token (inyectado por el middleware)
    const { rol, sucursal } = req.usuario;

    // IDs de roles con acceso global (Super Usuario y Gerencia)
    const rolesConAccesoGlobal = [1, 2];

    let maquinaria;

    if (rolesConAccesoGlobal.includes(rol)) {
      // Si el rol del usuario es 1 o 2, obtiene TODA la maquinaria
      console.log(`Usuario con rol ${rol} solicitando vista global de maquinaria.`);
      maquinaria = await maquinariaModel.obtenerTodas();
    } else {
      // Para cualquier otro rol, filtra por la sucursal del usuario
      console.log(`Usuario con rol ${rol} solicitando maquinaria de sucursal ${sucursal}.`);
      maquinaria = await maquinariaModel.findBySucursalId(sucursal);
    }

    res.status(200).json(maquinaria);
  } catch (error) {
    console.error("Error al obtener maquinaria:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor al obtener la maquinaria.' });
  }
};

// Controlador para obtener maquinaria de la sucursal del usuario logueado
const obtenerMaquinariaPorSucursalUsuario = async (req, res) => {
  try {
    // Gracias al middleware verificarToken, tenemos los datos del usuario en req.usuario
    const idSucursalUsuario = req.usuario.sucursal;

    const maquinaria = await maquinariaModel.findBySucursalId(idSucursalUsuario);
    res.status(200).json(maquinaria);

  } catch (error) {
    console.error("Error al obtener maquinaria por sucursal:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

const obtenerMaquinariaPorId = async (req, res) => {
  try {
    const { id } = req.params; // Obtenemos el ID de los parámetros de la ruta
    const maquina = await maquinariaModel.findById(id);

    if (!maquina) {
      // Si el modelo no devuelve ninguna máquina, enviamos un error 404
      return res.status(404).json({ mensaje: 'Máquina no encontrada.' });
    }

    res.status(200).json(maquina);
  } catch (error) {
    console.error("Error al obtener máquina por ID:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};



const crearMaquina = async (req, res) => {
  // Si la petición llega aquí, ya sabemos que es un Super Usuario gracias al middleware.
  const { codigo_interno, marca, modelo, tipo_combustible, id_sucursal_actual } = req.body;

  try {
    // Validación de datos básicos
    if (!codigo_interno || !tipo_combustible || !id_sucursal_actual) {
      return res.status(400).json({ mensaje: 'Código interno, tipo de combustible y sucursal son obligatorios.' });
    }

    const datosNuevaMaquina = {
      ...req.body,
      estado: 'Activo', // Por defecto, una máquina nueva está activa
      ultimo_horometro_registrado: 0 // Por defecto, el horómetro inicial es 0
    };

    const nuevaMaquina = await maquinariaModel.crear(datosNuevaMaquina);
    res.status(201).json({ mensaje: 'Máquina creada exitosamente.', maquina: nuevaMaquina });

  } catch (error) {
    // Manejo de error para código interno duplicado
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Error: El código interno ya existe.' });
    }
    console.error("Error al crear máquina:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};


const actualizarMaquina = async (req, res) => {
  try {
    const { id } = req.params;
    const maquinaActualizada = await maquinariaModel.actualizar(id, req.body);
    if (!maquinaActualizada) {
      return res.status(404).json({ mensaje: 'Máquina no encontrada.' });
    }
    res.status(200).json({ mensaje: 'Máquina actualizada exitosamente.', maquina: maquinaActualizada });
  } catch (error) {
    // Manejo de error para código interno duplicado
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Error: El código interno ya existe.' });
    }
    console.error("Error al actualizar máquina:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};


module.exports = {
  obtenerMaquinaria,
  obtenerMaquinariaPorId,
  obtenerMaquinariaPorSucursalUsuario,
  crearMaquina,
  actualizarMaquina
};