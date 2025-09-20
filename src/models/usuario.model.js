const pool = require('../config/db.config');

// Modelo para crear un nuevo usuario
const crear = async (rut, nombre, apellido, passwordHash, idRol, idSucursal) => {
  const query = 'INSERT INTO usuarios (rut, nombre, apellido, password_hash, id_rol, id_sucursal) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *'; // Consultas Parametrizadas
  const values = [rut, nombre, apellido, passwordHash, idRol, idSucursal];

  try {
    const resultado = await pool.query(query, values);
    return resultado.rows[0];
  } catch (error) {
    // Lanzamos el error para que sea manejado por el controlador
    throw error;
  }
};

const findByRut = async (rut) => {
  const query = 'SELECT * FROM usuarios WHERE rut = $1';
  const values = [rut];

  try {
    const resultado = await pool.query(query, values);
    // Devuelve el primer usuario encontrado o undefined si no hay ninguno
    return resultado.rows[0]; 
  } catch (error) {
    throw error;
  }
};

const findById = async (id) => {
  const query = `
    SELECT
      u.id_usuario,
      u.rut,
      u.nombre,
      u.apellido,
      u.estado,
      u.id_rol,
      u.id_sucursal,
      r.nombre_rol,
      s.nombre_sucursal
    FROM usuarios u
    JOIN roles r ON u.id_rol = r.id_rol
    JOIN sucursales s ON u.id_sucursal = s.id_sucursal
    WHERE u.id_usuario = $1
  `;
  try {
    const resultado = await pool.query(query, [id]);
    return resultado.rows[0];
  } catch (error) {
    throw error;
  }
};

const obtenerTodos = async () => {
  const query = `
    SELECT
      u.id_usuario,
      u.rut,
      u.nombre,
      u.apellido,
      u.estado,
      r.nombre_rol,
      s.nombre_sucursal
    FROM usuarios u
    JOIN roles r ON u.id_rol = r.id_rol
    JOIN sucursales s ON u.id_sucursal = s.id_sucursal
    ORDER BY u.apellido, u.nombre ASC;
  `;
  try {
    const resultado = await pool.query(query);
    return resultado.rows;
  } catch (error) {
    throw error;
  }
};

const actualizarEstado = async (id, estado) => {
  // Nos aseguramos de que el estado solo pueda ser 'Activo' o 'Inactivo'
  if (!['Activo', 'Inactivo'].includes(estado)) {
    throw new Error('Estado no válido');
  }
  const query = `
    UPDATE usuarios SET estado = $1 WHERE id_usuario = $2
    RETURNING id_usuario, rut, nombre, estado;
  `;
  try {
    const resultado = await pool.query(query, [estado, id]);
    return resultado.rows[0];
  } catch (error) {
    throw error;
  }
};

const actualizar = async (id, usuario) => {
  const { rut, nombre, apellido, id_rol, id_sucursal } = usuario;
  const query = `
    UPDATE usuarios 
    SET rut = $1, nombre = $2, apellido = $3, id_rol = $4, id_sucursal = $5
    WHERE id_usuario = $6
    RETURNING id_usuario, rut, nombre, apellido, estado, id_rol, id_sucursal;
  `;
  const values = [rut, nombre, apellido, id_rol, id_sucursal, id];
  try {
    const resultado = await pool.query(query, values);
    return resultado.rows[0];
  } catch (error) {
    throw error;
  }
};

module.exports = {
  crear,
  findByRut,
  findById,
  obtenerTodos,
  actualizarEstado,
  actualizar
};
