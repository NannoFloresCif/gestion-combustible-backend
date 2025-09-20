const pool = require('../config/db.config');

const obtenerTodos = async () => {
  try {
    const resultado = await pool.query('SELECT * FROM roles ORDER BY id_rol');
    return resultado.rows;
  } catch (error) {
    throw error;
  }
};

module.exports = { obtenerTodos };