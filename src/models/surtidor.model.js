const pool = require('../config/db.config');

const findBySucursalId = async (sucursalId) => {
  const query = `
    SELECT id_surtidor, nombre_surtidor 
    FROM surtidores 
    WHERE id_sucursal = $1 AND estado = 'Activo'
    ORDER BY nombre_surtidor;
  `;
  try {
    const resultado = await pool.query(query, [sucursalId]);
    return resultado.rows;
  } catch (error) {
    throw error;
  }
};

module.exports = { findBySucursalId };