/**
 * Llena una base de datos de DEMOSTRACIÓN con vehículos ficticios y arranca el
 * servidor con ella. Nunca toca la BD real (data/lavadero.db): usa
 * data/demo.db, que se borra y se vuelve a crear en cada ejecución.
 *
 *   npm run demo
 */
const path = require('path');
const fs = require('fs');
const { abrirBaseDatos } = require('../db/database');
const { cargarDemo } = require('../db/demo');

const RUTA = path.resolve(__dirname, '..', '..', 'data', 'demo.db');
try {
  for (const sufijo of ['', '-wal', '-shm']) fs.rmSync(RUTA + sufijo, { force: true });
} catch (error) {
  if (error.code !== 'EBUSY') throw error;
  console.error('[Demo] data/demo.db está en uso: hay otro servidor del lavadero abierto. Ciérralo y vuelve a ejecutar npm run demo.');
  process.exit(1);
}

const db = abrirBaseDatos(RUTA);
const cantidad = cargarDemo(db);
console.log(`[Demo] ${cantidad} vehículos ficticios cargados en ${RUTA}`);
db.close();

process.env.DB_PATH = './data/demo.db';
require('../index');
