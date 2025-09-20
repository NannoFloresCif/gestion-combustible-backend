/**
 * Middleware para verificar si el rol del usuario está dentro de una lista de roles permitidos.
 * Es una función de orden superior: recibe un array de roles y devuelve el middleware.
 * @param {number[]} rolesPermitidos - Array de IDs de los roles que tienen permiso.
 */
const autorizar = (rolesPermitidos) => {
  // La función que se devuelve es el middleware real que Express utilizará
  return (req, res, next) => {
    // Obtenemos el rol del usuario desde el objeto req.
    // Este objeto fue previamente adjuntado por el middleware 'verificarToken'.
    const rolUsuario = req.usuario.rol;

    // Comprobamos si el rol del usuario está incluido en la lista de roles permitidos
    if (rolesPermitidos.includes(rolUsuario)) {
      // Si el rol es válido, permitimos que la petición continúe hacia el controlador
      next();
    } else {
      // Si el rol no está permitido, denegamos el acceso con un error 403 Forbidden.
      res.status(403).json({ mensaje: 'Acceso denegado. No tienes los permisos necesarios.' });
    }
  };
};

module.exports = {
  autorizar
};