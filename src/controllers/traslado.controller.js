const trasladoModel = require('../models/traslado.model');
const maquinariaModel = require('../models/maquinaria.model');

const solicitarTraslado = async (req, res) => {
  // Datos del usuario que solicita (del token)
  const { id: id_usuario_solicita, rol, sucursal: id_sucursal_origen } = req.usuario;
  // Datos del traslado (del body)
  const { id_maquina, horometro_salida, id_sucursal_destino } = req.body;

  try {
    // --- VALIDACIONES ---
    const maquina = await maquinariaModel.findById(id_maquina);
    if (!maquina) {
      return res.status(404).json({ mensaje: 'Máquina no encontrada.' });
    }

    if (maquina.estado !== 'Activo') {
      return res.status(409).json({ mensaje: `La máquina no puede ser trasladada porque su estado actual es '${maquina.estado}'.` });
    }

    if (rol !== 1 && maquina.id_sucursal_actual !== id_sucursal_origen) {
      return res.status(403).json({ mensaje: 'No tienes permiso para trasladar máquinas de esta sucursal.' });
    }

    // ✔️ CORRECCIÓN: Usar 'horometro_salida' en lugar de 'horometro'
    if (parseFloat(horometro_salida) <= parseFloat(maquina.ultimo_horometro_registrado)) {
      return res.status(409).json({ mensaje: `Error: El horómetro de salida (${horometro_salida}) no puede ser menor o igual al último registrado (${maquina.ultimo_horometro_registrado}).` });
    }

    if (maquina.id_sucursal_actual === parseInt(id_sucursal_destino)) {
      return res.status(400).json({ mensaje: 'La sucursal de destino no puede ser la misma que la sucursal de origen.' });
    }

    // --- CREACIÓN ---
    const datosTraslado = {
      horometro_salida, id_maquina,
      id_sucursal_origen, id_sucursal_destino,
      id_usuario_solicita
    };

    const nuevoTraslado = await trasladoModel.solicitar(datosTraslado);
    res.status(201).json({ mensaje: 'Solicitud de traslado creada exitosamente.', traslado: nuevoTraslado });
  } catch (error) {
    console.error("Error al solicitar traslado:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

const obtenerTrasladosPendientes = async (req, res) => {
  try {
    // Obtenemos la sucursal del Jefe de Sucursal desde su token
    const { sucursal: idSucursalDestino } = req.usuario;
    const traslados = await trasladoModel.findPendientesBySucursalDestino(idSucursalDestino);
    res.status(200).json(traslados);
  } catch (error) {
    console.error("Error al obtener traslados pendientes:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

const responderTraslado = async (req, res) => {
  try {
    const { id: idTraslado } = req.params;
    const { id: idUsuarioRecibe, sucursal: idSucursalUsuario } = req.usuario; // Datos del usuario que responde
    const { decision, motivo_rechazo } = req.body;

    // --- VALIDACIONES Y AUTORIZACIÓN ---
    // 1. Verificar que el traslado exista y esté pendiente
    const traslado = await trasladoModel.findById(idTraslado);
    if (!traslado) {
      return res.status(404).json({ mensaje: 'Traslado no encontrado.' });
    }
    if (traslado.estado !== 'Pendiente') {
      return res.status(409).json({ mensaje: `Este traslado ya fue gestionado (estado: ${traslado.estado}).` });
    }

    // 2. Autorización: El usuario que responde debe pertenecer a la sucursal de DESTINO del traslado
    if (traslado.id_sucursal_destino !== idSucursalUsuario) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No tienes permiso para gestionar traslados de otra sucursal.' });
    }

    // --- PROCESAR RESPUESTA ---
    const datosRespuesta = {
      decision,
      motivo: motivo_rechazo || null, // Si no viene motivo, se guarda NULL
      idUsuarioRecibe,
      idMaquina: traslado.id_maquina,
      idSucursalDestino: traslado.id_sucursal_destino
    };

    const trasladoActualizado = await trasladoModel.responder(idTraslado, datosRespuesta);
    res.status(200).json({ mensaje: `Traslado ${decision.toLowerCase()} exitosamente.`, traslado: trasladoActualizado });
  } catch (error) {
    console.error("Error al responder traslado:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

module.exports = {
  solicitarTraslado,
  obtenerTrasladosPendientes,
  responderTraslado
};