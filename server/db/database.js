const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { runMigrations } = require('./migrations');
const { sembrarSiVacia } = require('./seed');

/**
 * Abre (o crea) la base de datos, aplica las migraciones y siembra los datos de
 * partida si está vacía.
 *
 * Es una fábrica a propósito: en el comandero la BD era un singleton con la
 * ruta fija y los tests e2e acababan escribiendo en la base de datos real
 * (registro, entrada 29). Aquí los tests abren ':memory:'.
 */
function abrirBaseDatos(ruta) {
  const enMemoria = ruta === ':memory:';
  if (!enMemoria) fs.mkdirSync(path.dirname(ruta), { recursive: true });

  const db = new Database(ruta);
  db.pragma('foreign_keys = ON');
  if (!enMemoria) db.pragma('journal_mode = WAL');
  db.pragma('synchronous = FULL');

  runMigrations(db);
  sembrarSiVacia(db);
  return db;
}

module.exports = { abrirBaseDatos };
