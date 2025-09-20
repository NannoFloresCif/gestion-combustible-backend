const surtidorModel = require('../models/surtidor.model');

const obtenerSurtidoresPorSucursalUsuario = async (req, res) => {
  try {
    const idSucursalUsuario = req.usuario.sucursal;
    const surtidores = await surtidorModel.findBySucursalId(idSucursalUsuario);
    res.status(200).json(surtidores);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

module.exports = { obtenerSurtidoresPorSucursalUsuario };