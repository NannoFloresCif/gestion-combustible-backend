const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  // 1. Obtener el token del header de autorización
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    // Si no hay header de autorización, el acceso es prohibido
    return res.status(403).json({ mensaje: 'Acceso prohibido. Se requiere un token.' });
  }

  // El header tiene el formato "Bearer <token>"
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ mensaje: 'Formato de token inválido.' });
  }

  // 2. Verificar el token
  try {
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Si el token es válido, adjuntamos el payload a la petición
    req.usuario = decodificado;
    
    // 4. Continuar con la siguiente función (el controlador)
    next();
  } catch (error) {
    // Si el token no es válido (firma incorrecta, expirado, etc.)
    return res.status(401).json({ mensaje: 'Token inválido o expirado.' });
  }
};

module.exports = {
  verificarToken
};