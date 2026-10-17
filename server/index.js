const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { abrirBaseDatos } = require('./db/database');
const { createApp } = require('./app');

const PORT = Number(process.env.PORT) || 3100;
// Un solo dispositivo: por defecto solo escucha en esta máquina. Para abrirlo a
// la red local habría que poner HOST=0.0.0.0 en el .env (y añadir login antes).
const HOST = process.env.HOST || '127.0.0.1';
const DB_PATH = path.resolve(__dirname, '..', process.env.DB_PATH || './data/lavadero.db');

let db;
try {
  db = abrirBaseDatos(DB_PATH);
  console.log(`[Database] Base de datos lista en ${DB_PATH}`);
} catch (error) {
  console.error('[Arranque] No se pudo abrir la base de datos:', error.message);
  process.exit(1);
}

const server = createApp(db).listen(PORT, HOST, () => {
  console.log(`[Servidor] Lavadero en http://localhost:${PORT}`);
});

// Puerto ocupado (otra instancia abierta): avisar claro y salir, en vez de
// quedarse a medias (el comandero lo aprendió en la entrada 30).
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[Servidor] El puerto ${PORT} ya está en uso. ¿Hay otra ventana del lavadero abierta?`);
  } else {
    console.error('[Servidor] Error al arrancar:', error);
  }
  db.close();
  process.exit(1);
});

function cerrar() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
