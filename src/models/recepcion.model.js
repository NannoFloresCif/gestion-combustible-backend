const pool = require('../config/db.config');

const crear = async (recepcion) => {
  const { fecha, tipo_combustible, litros_recepcionados, valor_factura, id_sucursal, id_usuario_registro } = recepcion;
  const query = `
    INSERT INTO recepciones_combustible (fecha, tipo_combustible, litros_recepcionados, valor_factura, id_sucursal, id_usuario_registro)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [fecha, tipo_combustible, litros_recepcionados, valor_factura, id_sucursal, id_usuario_registro];
  try {
    const resultado = await pool.query(query, values);
    return resultado.rows[0];
  } catch (error) {
    throw error;
  }
};

module.exports = { crear };