// Controlador para el mensaje de bienvenida
const obtenerMensajeBienvenida = (req, res) => {
  res.send('¡Hola Mundo! Nuestra API con arquitectura MVC está funcionando.');
};

module.exports = {
  obtenerMensajeBienvenida
};