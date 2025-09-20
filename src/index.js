const express = require('express');
const cors = require('cors');
const usuarioRoutes = require('./routes/usuario.routes.js');
const maquinariaRoutes = require('./routes/maquinaria.routes.js');
const consumoRoutes = require('./routes/consumo.routes.js');
const trasladoRoutes = require('./routes/traslado.routes.js');
const reporteRoutes = require('./routes/reporte.routes.js');
const sucursalRoutes = require('./routes/sucursal.routes.js');
const surtidorRoutes = require('./routes/surtidor.routes.js');
const rolRoutes = require('./routes/rol.routes.js');
const recepcionRoutes = require('./routes/recepcion.routes.js');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api', usuarioRoutes);
app.use('/api', maquinariaRoutes);
app.use('/api', consumoRoutes);
app.use('/api', trasladoRoutes);
app.use('/api', reporteRoutes);
app.use('/api', sucursalRoutes);
app.use('/api', surtidorRoutes);
app.use('/api', rolRoutes);
app.use('/api', recepcionRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo exitosamente en el puerto http://localhost:${PORT}`);
});