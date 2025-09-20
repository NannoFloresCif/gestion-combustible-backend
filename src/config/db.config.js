// Carga las variables de entorno desde el archivo .env
require('dotenv').config();

const { Pool } = require('pg');

// Crea un "pool" de conexiones a la base de datos
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Exportamos el pool para poder usarlo en otras partes de la aplicación
module.exports = pool;