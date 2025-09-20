const consumoModel = require('../models/consumo.model');
const maquinariaModel = require('../models/maquinaria.model'); // Necesitamos este modelo para validaciones

const registrarConsumo = async (req, res) => {
  // Obtenemos los datos del usuario desde el token
  const { id: id_usuario_registro, rol } = req.usuario;
  // Obtenemos los datos del consumo desde el body
  const { id_maquina, horometro, litros_cargados, cuentalitros_surtidor, id_surtidor } = req.body;

  try {
    // --- VALIDACIONES ---
    // 1. Obtener la máquina para validar
    const maquina = await maquinariaModel.findById(id_maquina);
    if (!maquina) {
      return res.status(404).json({ mensaje: 'La máquina especificada no existe.' });
    }
    // --- INICIO DE DEPURACIÓN ---
    // Estas líneas nos mostrarán en la terminal los valores exactos que se están comparando.
    //console.log('--- Iniciando Depuración de Permisos de Consumo ---');
    //console.log('Rol del Usuario (del token):', rol, '(Tipo:', typeof rol, ')');
    //console.log('Sucursal del Usuario (del token):', req.usuario.sucursal, '(Tipo:', typeof req.usuario.sucursal, ')');
    //console.log('Sucursal Actual de la Máquina (de la BD):', maquina.id_sucursal_actual, '(Tipo:', typeof maquina.id_sucursal_actual, ')');
    //console.log('--- Fin de Depuración ---');
    // --- FIN DE DEPURACIÓN ---

    // 2. Regla de autorización: Super Usuario puede cargar en cualquier sucursal, los demás no.
    if (rol !== 1 && maquina.id_sucursal_actual !== req.usuario.sucursal) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No tienes permiso para registrar consumos en esta sucursal.' });
    }

    // 3. Regla de negocio: El horómetro debe ser mayor o igual al último registrado.
    if (parseFloat(horometro) < parseFloat(maquina.ultimo_horometro_registrado)) {
      return res.status(409).json({ mensaje: `Error: El horómetro (${horometro}) no puede ser menor al último registrado (${maquina.ultimo_horometro_registrado}).` });
    }

    // --- CREACIÓN ---
    const datosConsumo = { 
      horometro, litros_cargados, cuentalitros_surtidor, 
      id_maquina, id_surtidor, 
      id_usuario_registro, 
      id_sucursal: maquina.id_sucursal_actual // La sucursal del consumo es la de la máquina
    };

    const nuevoConsumo = await consumoModel.crear(datosConsumo);
    res.status(201).json({ mensaje: 'Consumo registrado exitosamente.', consumo: nuevoConsumo });

  } catch (error) {
    console.error("Error al registrar consumo:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

const obtenerConsumos = async (req, res) => {
  try {
    const { rol, sucursal } = req.usuario; // Del token
    const { sucursal_id, fecha_inicio, fecha_fin } = req.query; // De los query params (?sucursal_id=5)

    const rolesConAccesoGlobal = [1, 2]; // Super Usuario y Gerencia
    const filtros = {
      fechaInicio: fecha_inicio,
      fechaFin: fecha_fin
    };

    if (rolesConAccesoGlobal.includes(rol)) {
      // Si es un rol global, puede filtrar por cualquier sucursal si se le pasa el query param
      if (sucursal_id) {
        filtros.sucursalId = sucursal_id;
      }
    } else {
      // Si es un rol de sucursal, se le fuerza a ver solo su propia sucursal
      filtros.sucursalId = sucursal;
    }

    const consumos = await consumoModel.obtener(filtros);
    res.status(200).json(consumos);
  } catch (error) {
    console.error("Error al obtener consumos:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

const eliminarConsumo = async (req, res) => {
  try {
    const { id } = req.params; // ID del consumo a eliminar
    const { rol, sucursal } = req.usuario; // Datos del usuario del token

    // 1. Verificar que el consumo existe
    const consumo = await consumoModel.findById(id);
    if (!consumo) {
      return res.status(404).json({ mensaje: 'Consumo no encontrado.' });
    }

    // 2. Regla de autorización: Un usuario solo puede eliminar consumos de su propia sucursal
    //    (a menos que sea Super Usuario, rol 1)
    if (rol !== 1 && consumo.id_sucursal !== sucursal) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No puedes eliminar consumos de otra sucursal.' });
    }

    // 3. Realizar el borrado lógico
    const consumoEliminado = await consumoModel.softDeleteById(id, consumo.id_surtidor);
    res.status(200).json({ mensaje: 'Consumo eliminado exitosamente.', consumo: consumoEliminado });

  } catch (error) {
    console.error("Error al eliminar consumo:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

module.exports = {
  registrarConsumo,
  obtenerConsumos,
  eliminarConsumo
};