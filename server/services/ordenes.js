/**
 * Operaciones sobre órdenes de lavado. Toda la lógica de negocio vive aquí;
 * las rutas solo validan la entrada y llaman a estas funciones.
 *
 * Cada operación pública corre en UNA transacción inmediata. Los helpers con
 * prefijo `_` no abren transacción: se componen dentro de una (p. ej.
 * "meter siguiente" reutiliza `_iniciar`).
 */
const { businessError } = require('../utils/httpErrors');
const { siguienteContador } = require('../utils/contadores');
const { formatGs, normalizarMatricula } = require('../utils/formato');
const { ABIERTOS, puedePasar, mensajeTransicion } = require('../domain/estados');

const EN_ABIERTOS = `(${ABIERTOS.map(() => '?').join(', ')})`;

function _log(db, accion, detalles) {
  db.prepare('INSERT INTO logs (accion, detalles, created_at) VALUES (?, ?, ?)')
    .run(accion, detalles, Date.now());
}

function _orden(db, ordenId) {
  const orden = db.prepare('SELECT * FROM ordenes WHERE id = ?').get(ordenId);
  if (!orden) throw businessError('La orden no existe.', 404);
  return orden;
}

function _exigirTransicion(orden, a) {
  if (!puedePasar(orden.estado, a)) throw businessError(mensajeTransicion(orden.estado, a), 409);
}

function _venta(db, ordenId) {
  return db.prepare('SELECT id, numero FROM ventas WHERE orden_id = ?').get(ordenId);
}

/**
 * Crea una orden en espera. El precio SIEMPRE sale de la base de datos: el
 * cliente solo manda ids. En el comandero el servidor llegó a fiarse del precio
 * o de la cantidad que enviaba el navegador (reportes/backend_bugs.md, 1 y 3).
 */
function crearOrden(db, datos) {
  return db.transaction(() => {
    const matricula = normalizarMatricula(datos.matricula);
    if (!matricula) throw businessError('La matrícula no puede quedar vacía.');

    const tamano = db.prepare('SELECT id FROM tamanos WHERE id = ?').get(datos.tamanoId);
    if (!tamano) throw businessError('El tamaño de vehículo no existe.');

    const ids = [...new Set(datos.servicioIds)];
    const servicios = db.prepare(`
      SELECT s.id, s.nombre, s.duracion_min, sp.precio
      FROM servicios s
      JOIN servicio_precios sp ON sp.servicio_id = s.id AND sp.tamano_id = ?
      WHERE s.activo = 1 AND s.id IN (${ids.map(() => '?').join(', ')})
      ORDER BY s.orden, s.id
    `).all(datos.tamanoId, ...ids);
    if (servicios.length !== ids.length) {
      throw businessError('Algún servicio no existe, está desactivado o no tiene precio para ese tamaño.');
    }

    const abierta = db.prepare(`SELECT id FROM ordenes WHERE matricula = ? AND estado IN ${EN_ABIERTOS}`)
      .get(matricula, ...ABIERTOS);
    if (abierta) throw businessError(`El vehículo ${matricula} ya tiene una orden abierta (Nº ${abierta.id}).`, 409);

    const total = servicios.reduce((suma, s) => suma + s.precio, 0);
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO ordenes (matricula, vehiculo, tamano_id, cliente_nombre, cliente_telefono, notas, total, creada_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(matricula, datos.vehiculo, datos.tamanoId, datos.clienteNombre, datos.clienteTelefono, datos.notas, total, Date.now());
    const ordenId = Number(lastInsertRowid);

    const insItem = db.prepare('INSERT INTO orden_items (orden_id, servicio_id, nombre, precio, duracion_min) VALUES (?, ?, ?, ?, ?)');
    for (const s of servicios) insItem.run(ordenId, s.id, s.nombre, s.precio, s.duracion_min);

    _log(db, 'crear_orden', `Orden ${ordenId} (${matricula}), ${formatGs(total)}`);
    return ordenId;
  }).immediate();
}

function _iniciar(db, orden, plazaId) {
  // Solo desde la cola: volver a lavar un "listo" es reactivarOrden().
  if (orden.estado !== 'en_espera') throw businessError(mensajeTransicion(orden.estado, 'lavando'), 409);
  const plaza = db.prepare('SELECT id, nombre FROM plazas WHERE id = ? AND activa = 1').get(plazaId);
  if (!plaza) throw businessError('La plaza no existe.', 404);

  // Se mira la tabla de órdenes, que es la fuente de verdad, no un campo
  // "estado" de la plaza que pueda haberse quedado atrás.
  const ocupada = db.prepare("SELECT matricula FROM ordenes WHERE plaza_id = ? AND estado = 'lavando'").get(plazaId);
  if (ocupada) throw businessError(`${plaza.nombre} está ocupada por ${ocupada.matricula}.`, 409);

  db.prepare("UPDATE ordenes SET estado = 'lavando', plaza_id = ?, inicio_at = ? WHERE id = ?")
    .run(plazaId, Date.now(), orden.id);
  _log(db, 'iniciar_lavado', `Orden ${orden.id} (${orden.matricula}) en ${plaza.nombre}`);
}

/** El encargado elige un vehículo concreto de la cola para una plaza. */
function iniciarLavado(db, ordenId, plazaId) {
  db.transaction(() => _iniciar(db, _orden(db, ordenId), plazaId)).immediate();
}

/** "Meter siguiente": el primero que llegó entra en la plaza. */
function meterSiguiente(db, plazaId) {
  return db.transaction(() => {
    const primero = db.prepare("SELECT * FROM ordenes WHERE estado = 'en_espera' ORDER BY creada_at, id LIMIT 1").get();
    if (!primero) throw businessError('No hay vehículos esperando.', 409);
    _iniciar(db, primero, plazaId);
    return primero.id;
  }).immediate();
}

function terminarLavado(db, ordenId) {
  db.transaction(() => {
    const orden = _orden(db, ordenId);
    _exigirTransicion(orden, 'listo');
    db.prepare("UPDATE ordenes SET estado = 'listo', fin_at = ? WHERE id = ?").run(Date.now(), ordenId);
    _log(db, 'terminar_lavado', `Orden ${ordenId} (${orden.matricula}) lista`);
  }).immediate();
}

/** Deshacer "meter en plaza": el vehículo vuelve a la cola con su turno de llegada. */
function devolverAEspera(db, ordenId) {
  db.transaction(() => {
    const orden = _orden(db, ordenId);
    if (orden.estado !== 'lavando') throw businessError(mensajeTransicion(orden.estado, 'en_espera'), 409);
    db.prepare("UPDATE ordenes SET estado = 'en_espera', plaza_id = NULL, inicio_at = NULL WHERE id = ?").run(ordenId);
    _log(db, 'devolver_espera', `Orden ${ordenId} (${orden.matricula}) vuelve a la cola`);
  }).immediate();
}

/**
 * Deshacer un "Terminado": el vehículo vuelve a su plaza si sigue libre, y el
 * cronómetro continúa desde su inicio. Si la plaza ya la ocupa otro, vuelve a
 * la cola en su turno de llegada. Devuelve dónde quedó.
 */
function reactivarOrden(db, ordenId) {
  return db.transaction(() => {
    const orden = _orden(db, ordenId);
    if (orden.estado !== 'listo') throw businessError('Solo se puede volver a lavar un vehículo que está listo.', 409);

    const plaza = orden.plaza_id
      ? db.prepare('SELECT id, nombre FROM plazas WHERE id = ? AND activa = 1').get(orden.plaza_id)
      : null;
    const ocupada = plaza
      ? db.prepare("SELECT 1 FROM ordenes WHERE plaza_id = ? AND estado = 'lavando'").get(plaza.id)
      : true;

    if (plaza && !ocupada) {
      db.prepare("UPDATE ordenes SET estado = 'lavando', fin_at = NULL WHERE id = ?").run(ordenId);
      _log(db, 'reactivar_orden', `Orden ${ordenId} (${orden.matricula}) vuelve a ${plaza.nombre}`);
      return { estado: 'lavando', plazaNombre: plaza.nombre };
    }
    db.prepare("UPDATE ordenes SET estado = 'en_espera', plaza_id = NULL, inicio_at = NULL, fin_at = NULL WHERE id = ?").run(ordenId);
    _log(db, 'reactivar_orden', `Orden ${ordenId} (${orden.matricula}) vuelve a la cola`);
    return { estado: 'en_espera', plazaNombre: null };
  }).immediate();
}

function cancelarOrden(db, ordenId, motivo) {
  db.transaction(() => {
    const orden = _orden(db, ordenId);
    _exigirTransicion(orden, 'cancelada');
    const venta = _venta(db, ordenId);
    if (venta) {
      // Cancelar algo cobrado exige anular el cobro con rastro (como la
      // rectificativa del comandero, entrada 114). Hasta tenerlo, no se permite.
      throw businessError(`Esta orden ya está cobrada (venta Nº ${venta.numero}). Anular cobros todavía no está disponible.`, 409);
    }
    db.prepare("UPDATE ordenes SET estado = 'cancelada', cancelada_at = ?, cancelada_motivo = ? WHERE id = ?")
      .run(Date.now(), motivo, ordenId);
    _log(db, 'cancelar_orden', `Orden ${ordenId} (${orden.matricula})${motivo ? `: ${motivo}` : ''}`);
  }).immediate();
}

function _entregar(db, orden) {
  _exigirTransicion(orden, 'entregada');
  if (!_venta(db, orden.id)) throw businessError('Falta cobrar este vehículo antes de entregarlo.', 409);
  db.prepare("UPDATE ordenes SET estado = 'entregada', entregada_at = ? WHERE id = ?").run(Date.now(), orden.id);
  _log(db, 'entregar_orden', `Orden ${orden.id} (${orden.matricula}) entregada`);
}

function entregarOrden(db, ordenId) {
  db.transaction(() => _entregar(db, _orden(db, ordenId))).immediate();
}

/**
 * Cobra una orden abierta, en cualquier estado (al dejar el coche o al
 * retirarlo). Con `entregar`, cobro y entrega van en la misma transacción:
 * o pasan las dos cosas o ninguna.
 */
function cobrarOrden(db, ordenId, { metodoPago, importeRecibido, clienteRuc, clienteNombre, entregar }) {
  return db.transaction(() => {
    const orden = _orden(db, ordenId);
    if (!ABIERTOS.includes(orden.estado)) throw businessError('Solo se pueden cobrar órdenes abiertas.', 409);

    const previa = _venta(db, ordenId);
    if (previa) throw businessError(`Esta orden ya está cobrada (venta Nº ${previa.numero}).`, 409);

    let recibido = orden.total;
    if (metodoPago === 'efectivo' && importeRecibido != null) {
      recibido = importeRecibido;
      if (recibido < orden.total) throw businessError(`Faltan ${formatGs(orden.total - recibido)}.`);
    }
    const vuelto = recibido - orden.total;

    const numero = siguienteContador(db, 'venta');
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO ventas (numero, orden_id, total, metodo_pago, importe_recibido, vuelto, cliente_ruc, cliente_nombre, creada_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(numero, ordenId, orden.total, metodoPago, recibido, vuelto, clienteRuc, clienteNombre, Date.now());
    const ventaId = Number(lastInsertRowid);

    db.prepare(`
      INSERT INTO venta_items (venta_id, servicio_id, nombre, precio)
      SELECT ?, servicio_id, nombre, precio FROM orden_items WHERE orden_id = ? ORDER BY id
    `).run(ventaId, ordenId);
    _log(db, 'cobrar_orden', `Venta Nº ${numero}: orden ${ordenId} (${orden.matricula}), ${formatGs(orden.total)} en ${metodoPago}`);

    if (entregar) _entregar(db, orden);

    return { ventaId, numero, total: orden.total, recibido, vuelto, entregada: !!entregar };
  }).immediate();
}

module.exports = {
  crearOrden,
  iniciarLavado,
  meterSiguiente,
  terminarLavado,
  devolverAEspera,
  reactivarOrden,
  cancelarOrden,
  entregarOrden,
  cobrarOrden
};
