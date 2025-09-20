const sucursalModel = require('../models/sucursal.model');

const obtenerSucursalesActivas = async (req, res) => {
  try {
    const sucursales = await sucursalModel.obtenerActivas();
    res.status(200).json(sucursales);
  } catch (error) {
    console.error("Error al obtener sucursales:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

module.exports = {
  obtenerSucursalesActivas
};