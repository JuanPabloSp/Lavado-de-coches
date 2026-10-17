/**
 * Configuración del local: datos del negocio (tabla `config`) y plazas.
 */
const { businessError } = require('../utils/httpErrors');

/** Claves de `config` editables desde la interfaz → nombre en la API. */
const CAMPOS_LOCAL = {
  nombre_local: 'nombreLocal',
  razon_social: 'razonSocial',
  ruc: 'ruc',
  direccion: 'direccion',
  ciudad: 'ciudad',
  telefono: 'telefono'
};

function _log(db, accion, detalles) {
  db.prepare('INSERT INTO logs (accion, detalles, created_at) VALUES (?, ?, ?)').run(accion, detalles, Date.now());
}

function leerConfiguracion(db) {
  const config = Object.fromEntries(db.prepare('SELECT key, value FROM config').all().map(c => [c.key, c.value]));
  const local = {};
  for (const [clave, campo] of Object.entries(CAMPOS_LOCAL)) local[campo] = config[clave] || '';
  if (!local.nombreLocal) local.nombreLocal = 'Mi lavadero';

  const plazas = db.prepare(`
    SELECT p.id, p.nombre, p.orden, p.activa,
           (SELECT matricula FROM ordenes o WHERE o.plaza_id = p.id AND o.estado = 'lavando') AS ocupada_por
    FROM plazas p ORDER BY p.orden, p.id
  `).all().map(p => ({ id: p.id, nombre: p.nombre, activa: !!p.activa, ocupadaPor: p.ocupada_por }));

  return { local, plazas };
}

function guardarDatosLocal(db, datos) {
  db.transaction(() => {
    const upsert = db.prepare('INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    for (const [clave, campo] of Object.entries(CAMPOS_LOCAL)) {
      if (datos[campo] !== undefined) upsert.run(clave, datos[campo]);
    }
    _log(db, 'config_local', 'Datos del local actualizados');
  }).immediate();
}

function _nombreLibre(db, nombre, exceptoId = 0) {
  const repetida = db.prepare('SELECT id FROM plazas WHERE lower(nombre) = lower(?) AND id <> ?').get(nombre, exceptoId);
  if (repetida) throw businessError(`Ya hay una plaza llamada "${nombre}".`, 409);
}

function crearPlaza(db, nombre) {
  return db.transaction(() => {
    const { siguiente, n } = db.prepare('SELECT COALESCE(MAX(orden), 0) + 1 AS siguiente, COUNT(*) + 1 AS n FROM plazas').get();
    const nombreFinal = nombre || `Plaza ${n}`;
    _nombreLibre(db, nombreFinal);
    const { lastInsertRowid } = db.prepare('INSERT INTO plazas (nombre, orden, activa) VALUES (?, ?, 1)').run(nombreFinal, siguiente);
    _log(db, 'crear_plaza', nombreFinal);
    return Number(lastInsertRowid);
  }).immediate();
}

/**
 * Renombrar o activar/desactivar una plaza. No se borran: las órdenes pasadas
 * siguen apuntando a ellas. Una plaza con un vehículo dentro no se desactiva,
 * y siempre tiene que quedar al menos una activa.
 */
function editarPlaza(db, plazaId, { nombre, activa }) {
  db.transaction(() => {
    const plaza = db.prepare('SELECT * FROM plazas WHERE id = ?').get(plazaId);
    if (!plaza) throw businessError('La plaza no existe.', 404);

    if (nombre !== undefined) {
      _nombreLibre(db, nombre, plazaId);
      db.prepare('UPDATE plazas SET nombre = ? WHERE id = ?').run(nombre, plazaId);
    }

    if (activa === false && plaza.activa) {
      const dentro = db.prepare("SELECT matricula FROM ordenes WHERE plaza_id = ? AND estado = 'lavando'").get(plazaId);
      if (dentro) throw businessError(`${plaza.nombre} tiene dentro ${dentro.matricula}: termina o devuelve ese vehículo antes de desactivarla.`, 409);
      const { activas } = db.prepare('SELECT COUNT(*) AS activas FROM plazas WHERE activa = 1').get();
      if (activas <= 1) throw businessError('Tiene que quedar al menos una plaza activa.', 409);
    }
    if (activa !== undefined) db.prepare('UPDATE plazas SET activa = ? WHERE id = ?').run(activa ? 1 : 0, plazaId);

    _log(db, 'editar_plaza', `Plaza ${plazaId}: ${JSON.stringify({ nombre, activa })}`);
  }).immediate();
}

module.exports = { leerConfiguracion, guardarDatosLocal, crearPlaza, editarPlaza };
