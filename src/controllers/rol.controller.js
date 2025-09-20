const rolModel = require('../models/rol.model');

const obtenerRoles = async (req, res) => {
  try {
    const roles = await rolModel.obtenerTodos();
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

module.exports = { obtenerRoles };