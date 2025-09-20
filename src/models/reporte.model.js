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

module.exports = {
  generarReporteDesviaciones
};