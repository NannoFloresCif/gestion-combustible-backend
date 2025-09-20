const pool = require('../config/db.config');

const crear = async (consumo) => {
  const { 
    horometro, litros_cargados, cuentalitros_surtidor, 
    id_maquina, id_usuario_registro, id_surtidor, id_sucursal 
  } = consumo;

  // Obtenemos un cliente del pool para manejar la transacción
  const client = await pool.connect();

  try {
    // Iniciamos la transacción
    await client.query('BEGIN');

    // 1. Insertar el nuevo registro de consumo
    const insertConsumoQuery = `
      INSERT INTO consumos (fecha_hora, horometro, litros_cargados, cuentalitros_surtidor, id_maquina, id_usuario_registro, id_surtidor, id_sucursal)
      VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const insertConsumoValues = [horometro, litros_cargados, cuentalitros_surtidor, id_maquina, id_usuario_registro, id_surtidor, id_sucursal];
    const resultado = await client.query(insertConsumoQuery, insertConsumoValues);

    // 2. Actualizar la tabla de maquinaria con el último horómetro y fecha
    const updateMaquinariaQuery = `
      UPDATE maquinaria 
      SET ultimo_horometro_registrado = $1, fecha_ultimo_horometro = NOW()
      WHERE id_maquina = $2
    `;
    await client.query(updateMaquinariaQuery, [horometro, id_maquina]);

    // 3. (Opcional pero recomendado) Actualizar el cuentalitros del surtidor
    const updateSurtidorQuery = 'UPDATE surtidores SET cuentalitros_actual = $1 WHERE id_surtidor = $2';
    await client.query(updateSurtidorQuery, [cuentalitros_surtidor, id_surtidor]);

    // Si todo fue exitoso, confirmamos la transacción
    await client.query('COMMIT');

    return resultado.rows[0];
  } catch (error) {
    // Si algo falla, revertimos todos los cambios
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // En cualquier caso (éxito o fallo), liberamos el cliente de vuelta al pool
    client.release();
  }
};

const obtener = async (filtros) => {
  // Base de la consulta con todos los JOINs necesarios

  const { sucursalId, fechaInicio, fechaFin } = filtros;

  let query = `
    SELECT
      c.id_consumo,
      c.fecha_hora,
      c.horometro,
      c.litros_cargados,
      c.cuentalitros_surtidor,
      m.codigo_interno AS maquina_codigo,
      m.modelo AS maquina_modelo,
      CONCAT(u.nombre, ' ', u.apellido) AS usuario_registro,
      s.nombre_sucursal,
      sur.nombre_surtidor
    FROM consumos c
    JOIN maquinaria m ON c.id_maquina = m.id_maquina
    JOIN usuarios u ON c.id_usuario_registro = u.id_usuario
    JOIN sucursales s ON c.id_sucursal = s.id_sucursal
    JOIN surtidores sur ON c.id_surtidor = sur.id_surtidor
    WHERE c.eliminado = FALSE
  `;
  const values = [];
  let paramIndex = 1;

  // Añadir filtros dinámicamente
  //if (filtros.sucursalId) {
  //  values.push(filtros.sucursalId);
  //  query += ` AND c.id_sucursal = $${values.length}`;
  //}

  // Añadir ordenamiento
  //query += ' ORDER BY c.fecha_hora DESC';

  // Añadir filtros dinámicamente
  if (sucursalId) {
    query += ` AND c.id_sucursal = $${paramIndex++}`;
    values.push(sucursalId);
  }
  if (fechaInicio) {
    query += ` AND c.fecha_hora >= $${paramIndex++}`;
    values.push(fechaInicio);
  }
  if (fechaFin) {
    // Añadimos ' 23:59:59' para incluir todo el día de la fecha de fin
    query += ` AND c.fecha_hora <= $${paramIndex++}`;
    values.push(`${fechaFin} 23:59:59`);
  }

  query += ' ORDER BY c.fecha_hora DESC';

  try {
    const resultado = await pool.query(query, values);
    return resultado.rows;
  } catch (error) {
    throw error;
  }
};

// Modelo para buscar un consumo por su ID
const findById = async (id) => {
  const query = 'SELECT * FROM consumos WHERE id_consumo = $1';
  try {
    const resultado = await pool.query(query, [id]);
    return resultado.rows[0];
  } catch (error) {
    throw error;
  }
};

// Modelo para marcar un consumo como eliminado (soft delete)
const softDeleteById = async (idConsumo, idSurtidor) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Marcar el consumo como eliminado
    const updateConsumoQuery = 'UPDATE consumos SET eliminado = TRUE WHERE id_consumo = $1 RETURNING *';
    const resultado = await client.query(updateConsumoQuery, [idConsumo]);

    // 2. Encontrar el último cuentalitros VÁLIDO para ese surtidor (excluyendo los eliminados)
    const findLastReadingQuery = `
      SELECT cuentalitros_surtidor 
      FROM consumos 
      WHERE id_surtidor = $1 AND eliminado = FALSE 
      ORDER BY fecha_hora DESC 
      LIMIT 1
    `;
    const lastReadingResult = await client.query(findLastReadingQuery, [idSurtidor]);

    // 3. Determinar el nuevo valor para el cuentalitros del surtidor
    const nuevoCuentalitros = lastReadingResult.rows.length > 0 
      ? lastReadingResult.rows[0].cuentalitros_surtidor 
      : 0; // Si no quedan consumos, lo reseteamos a 0

    // 4. Actualizar la tabla de surtidores con el valor revertido
    const updateSurtidorQuery = 'UPDATE surtidores SET cuentalitros_actual = $1 WHERE id_surtidor = $2';
    await client.query(updateSurtidorQuery, [nuevoCuentalitros, idSurtidor]);

    await client.query('COMMIT');
    return resultado.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  crear,
  obtener,
  findById,
  softDeleteById
};