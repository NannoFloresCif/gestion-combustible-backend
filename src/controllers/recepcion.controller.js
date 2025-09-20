const recepcionModel = require('../models/recepcion.model');

const registrarRecepcion = async (req, res) => {
  // Los datos del usuario vienen del token (gracias al middleware)
  const { id: id_usuario_registro, sucursal: id_sucursal } = req.usuario;
  // Los datos del formulario vienen del body
  const { fecha, tipo_combustible, litros_recepcionados, valor_factura } = req.body;

  try {
    const datosRecepcion = { 
      fecha, 
      tipo_combustible, 
      litros_recepcionados, 
      valor_factura, 
      id_sucursal, // <-- Tomado del token, no del formulario
      id_usuario_registro // <-- Tomado del token
    };

    const nuevaRecepcion = await recepcionModel.crear(datosRecepcion);
    res.status(201).json({ mensaje: 'Recepción registrada exitosamente.', recepcion: nuevaRecepcion });

  } catch (error) {
    console.error("Error al registrar recepción:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

module.exports = { registrarRecepcion };