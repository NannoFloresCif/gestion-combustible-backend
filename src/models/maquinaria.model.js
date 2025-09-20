const pool = require('../config/db.config');

// Modelo para obtener toda la maquinaria
const obtenerTodas = async () => {
  // Hacemos un JOIN con la tabla sucursales para obtener el nombre de la sucursal,
  // lo cual es más útil para el frontend que solo el ID.
  const query = `
    SELECT 
      m.id_maquina, 
      m.codigo_interno, 
      m.marca, 
      m.modelo, 
      m.tipo_combustible, 
      m.estado,
      m.id_sucursal_actual,
      m.ultimo_horometro_registrado,
      s.nombre_sucursal AS sucursal_actual
    FROM maquinaria m
    JOIN sucursales s ON m.id_sucursal_actual = s.id_sucursal
    ORDER BY m.codigo_interno ASC
  `;

  try {
    const resultado = await pool.query(query);
    return resultado.rows;
  } catch (error) {
    throw error;
  }
};

const findById = async (id) => {
  const query = `
    SELECT 
      m.id_maquina, 
      m.codigo_interno, 
      m.marca, 
      m.modelo, 
      m.tipo_combustible, 
      m.estado,
      m.id_sucursal_actual,
      m.ultimo_horometro_registrado,
      s.nombre_sucursal AS sucursal_actual
    FROM maquinaria m
    JOIN sucursales s ON m.id_sucursal_actual = s.id_sucursal
    WHERE m.id_maquina = $1
  `;
  try {
    const resultado = await pool.query(query, [id]);
    return resultado.rows[0]; // Devuelve la máquina encontrada o undefined
  } catch (error) {
    throw error;
  }
};

// Modelo para obtener maquinaria por ID de sucursal
const findBySucursalId = async (sucursalId) => {
  const query = `
    SELECT 
      m.id_maquina, 
      m.codigo_interno, 
      m.marca, 
      m.modelo,
      m.id_sucursal_actual
    FROM maquinaria m
    WHERE m.id_sucursal_actual = $1
    ORDER BY m.codigo_interno ASC
  `;
  // Nota: Simplificamos los datos devueltos para una lista desplegable.

  try {
    const resultado = await pool.query(query, [sucursalId]);
    return resultado.rows;
  } catch (error) {
    throw error;
  }
};

const crear = async (maquina) => {
  const { codigo_interno, marca, modelo, tipo_combustible, estado, id_sucursal_actual, ultimo_horometro_registrado } = maquina;
  const query = `
    INSERT INTO maquinaria (codigo_interno, marca, modelo, tipo_combustible, estado, id_sucursal_actual, ultimo_horometro_registrado)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const values = [codigo_interno, marca, modelo, tipo_combustible, estado, id_sucursal_actual, ultimo_horometro_registrado];

  try {
    const resultado = await pool.query(query, values);
    return resultado.rows[0];
  } catch (error) {
    throw error;
  }
};


module.exports = {
  obtenerTodas,
  findById,
  findBySucursalId,
  crear
};