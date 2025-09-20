const pool = require('../config/db.config');

const solicitar = async (traslado) => {
  const { 
    horometro_salida, id_maquina, id_sucursal_origen, 
    id_sucursal_destino, id_usuario_solicita 
  } = traslado;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insertar el nuevo traslado con estado 'Pendiente'
    const insertTrasladoQuery = `
      INSERT INTO traslados (fecha_solicitud, horometro_salida, estado, id_maquina, id_sucursal_origen, id_sucursal_destino, id_usuario_solicita)
      VALUES (NOW(), $1, 'Pendiente', $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [horometro_salida, id_maquina, id_sucursal_origen, id_sucursal_destino, id_usuario_solicita];
    const resultado = await client.query(insertTrasladoQuery, values);

    // 2. Actualizar el estado de la máquina a 'En traslado'
    const updateMaquinaQuery = `
      UPDATE maquinaria SET estado = 'En traslado' WHERE id_maquina = $1
    `;
    await client.query(updateMaquinaQuery, [id_maquina]);

    await client.query('COMMIT');
    return resultado.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const findById = async (id) => {
  const query = 'SELECT * FROM traslados WHERE id_traslado = $1';
  try {
    const resultado = await pool.query(query, [id]);
    return resultado.rows[0];
  } catch (error) {
    throw error;
  }
};

const findPendientesBySucursalDestino = async (sucursalId) => {
  const query = `
    SELECT
      t.id_traslado,
      t.fecha_solicitud,
      t.horometro_salida,
      m.codigo_interno AS maquina_codigo,
      m.modelo AS maquina_modelo,
      s_origen.nombre_sucursal AS sucursal_origen,
      CONCAT(u_solicita.nombre, ' ', u_solicita.apellido) AS usuario_solicita
    FROM traslados t
    JOIN maquinaria m ON t.id_maquina = m.id_maquina
    JOIN sucursales s_origen ON t.id_sucursal_origen = s_origen.id_sucursal
    JOIN usuarios u_solicita ON t.id_usuario_solicita = u_solicita.id_usuario
    WHERE t.id_sucursal_destino = $1 AND t.estado = 'Pendiente'
    ORDER BY t.fecha_solicitud ASC
  `;
  try {
    const resultado = await pool.query(query, [sucursalId]);
    return resultado.rows;
  } catch (error) {
    throw error;
  }
};

const responder = async (idTraslado, respuesta) => {
  const { decision, motivo, idUsuarioRecibe, idMaquina, idSucursalDestino } = respuesta;
  const estadoFinal = decision === 'Aceptado' ? 'Aceptado' : 'Rechazado';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Actualizar el registro de traslado
    const updateTrasladoQuery = `
      UPDATE traslados
      SET estado = $1, fecha_recepcion = NOW(), id_usuario_recibe = $2, motivo_rechazo = $3
      WHERE id_traslado = $4
      RETURNING *
    `;
    const resultado = await client.query(updateTrasladoQuery, [estadoFinal, idUsuarioRecibe, motivo, idTraslado]);

    // 2. Actualizar la máquina
    if (estadoFinal === 'Aceptado') {
      // Si se acepta, la máquina cambia de sucursal y se activa
      await client.query(`
        UPDATE maquinaria SET id_sucursal_actual = $1, estado = 'Activo' WHERE id_maquina = $2
      `, [idSucursalDestino, idMaquina]);
    } else {
      // Si se rechaza, la máquina vuelve a estar 'Activa' en su sucursal de ORIGEN
      await client.query(`
        UPDATE maquinaria SET estado = 'Activo' WHERE id_maquina = $1
      `, [idMaquina]);
    }

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
  solicitar,
  findById,
  findPendientesBySucursalDestino,
  responder
};