const pool = require('../config/db.config');

const generarReporteDesviaciones = async (filtros) => {
  const { sucursalId, fechaInicio, fechaFin } = filtros;

  const query = `
    -- Usamos Common Table Expressions (CTEs) para organizar la lógica
    WITH ConsumosDiarios AS (
      -- 1. Agrupamos los consumos por día y surtidor
      SELECT
        DATE(c.fecha_hora) AS dia,
        c.id_surtidor,
        s.tipo_combustible,
        SUM(c.litros_cargados) AS total_litros_ingresados,
        MAX(c.cuentalitros_surtidor) AS ultimo_cuentalitros_del_dia
      FROM consumos c
      JOIN surtidores s ON c.id_surtidor = s.id_surtidor
      WHERE c.id_sucursal = $1
        AND c.fecha_hora BETWEEN $2 AND $3
        AND c.eliminado = FALSE
      GROUP BY DATE(c.fecha_hora), c.id_surtidor, s.tipo_combustible
    ),
    CalculoCuentalitros AS (
      -- 2. Usamos LAG() para obtener el cuentalitros del día anterior
      SELECT
        dia,
        id_surtidor,
        tipo_combustible,
        total_litros_ingresados,
        ultimo_cuentalitros_del_dia,
        LAG(ultimo_cuentalitros_del_dia, 1, 0) OVER (PARTITION BY id_surtidor ORDER BY dia) AS cuentalitros_dia_anterior
      FROM ConsumosDiarios
    )
    -- 3. Hacemos el cálculo final y agrupamos por día y tipo de combustible
    SELECT
      TO_CHAR(dia, 'YYYY-MM-DD') AS dia,
      tipo_combustible,
      SUM(total_litros_ingresados) AS "totalConsumosIngresados",
      SUM(ultimo_cuentalitros_del_dia - cuentalitros_dia_anterior) AS "totalConsumosCuentalitros",
      SUM(total_litros_ingresados - (ultimo_cuentalitros_del_dia - cuentalitros_dia_anterior)) AS "diferencia"
    FROM CalculoCuentalitros
    GROUP BY dia, tipo_combustible
    ORDER BY dia ASC;
  `;

  try {
    const resultado = await pool.query(query, [sucursalId, fechaInicio, fechaFin]);
    return resultado.rows;
  } catch (error) {
    throw error;
  }
};

const generarReporteStock = async (filtros) => {
  const { sucursalId, fechaInicio, fechaFin } = filtros;

  // Esta consulta es avanzada. Usamos CTEs (WITH) para organizar la lógica.
  const query = `
    -- 1. Unimos las tablas de recepciones y consumos en una sola lista de "movimientos"
    WITH movimientos AS (
      -- Seleccionamos las ENTRADAS de combustible
      SELECT
        r.fecha,
        'Recepción' AS tipo_movimiento,
        r.tipo_combustible,
        r.litros_recepcionados AS litros,
        CONCAT('Factura/Documento: ', r.valor_factura) AS detalle
      FROM recepciones_combustible r
      WHERE r.id_sucursal = $1 AND r.fecha BETWEEN $2 AND $3

      UNION ALL

      -- Seleccionamos las SALIDAS de combustible
      SELECT
        c.fecha_hora AS fecha,
        'Consumo' AS tipo_movimiento,
        m.tipo_combustible,
        -c.litros_cargados AS litros, -- Usamos un valor negativo para las salidas
        CONCAT('Máquina: ', m.codigo_interno, ' (', m.modelo, ')') AS detalle
      FROM consumos c
      JOIN maquinaria m ON c.id_maquina = m.id_maquina
      WHERE c.id_sucursal = $1 AND c.fecha_hora::date BETWEEN $2 AND $3 AND c.eliminado = FALSE
    )
    -- 2. Seleccionamos todos los movimientos y calculamos el saldo acumulado
    SELECT
      fecha,
      tipo_movimiento,
      tipo_combustible,
      detalle,
      litros,
      -- La función de ventana SUM(...) OVER(...) calcula la suma acumulada
      SUM(litros) OVER (PARTITION BY tipo_combustible ORDER BY fecha ASC) AS saldo
    FROM movimientos
    ORDER BY fecha ASC;
  `;
  // Añadimos ' 23:59:59' a la fecha de fin para incluir el día completo
  const values = [sucursalId, fechaInicio, `${fechaFin} 23:59:59`];

  try {
    const resultado = await pool.query(query, values);
    return resultado.rows;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generarReporteDesviaciones,
  generarReporteStock
};