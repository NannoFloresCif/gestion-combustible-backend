const pool = require('../config/db.config');

// Modelo para obtener todas las sucursales activas
const obtenerActivas = async () => {
  const query = `
    SELECT id_sucursal, nombre_sucursal 
    FROM sucursales 
    WHERE estado = 'Activa' 
    ORDER BY nombre_sucursal ASC
  `;
  try {
    const resultado = await pool.query(query);
    return resultado.rows;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  obtenerActivas
};