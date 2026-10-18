/**
 * Lecturas para la interfaz. Devuelven objetos en camelCase listos para
 * pintar; la forma de las tablas no sale de aquí.
 */
const { ABIERTOS } = require('../domain/estados');

const EN_ABIERTOS = `(${ABIERTOS.map(() => '?').join(', ')})`;

function _mapearOrden(fila, items) {
  return {
    id: fila.id,
    matricula: fila.matricula,
    vehiculo: fila.vehiculo,
    tamanoId: fila.tamano_id,
    tamanoNombre: fila.tamano_nombre,
    clienteNombre: fila.cliente_nombre,
    clienteTelefono: fila.cliente_telefono,
    notas: fila.notas,
    estado: fila.estado,
    plazaId: fila.plaza_id,
    plazaNombre: fila.plaza_nombre,
    total: fila.total,
    servicios: items.map(i => i.nombre),
    duracionMin: items.reduce((suma, i) => suma + i.duracion_min, 0),
    creadaAt: fila.creada_at,
    inicioAt: fila.inicio_at,
    finAt: fila.fin_at,
    pagada: fila.venta_numero != null,
    ventaNumero: fila.venta_numero,
    metodoPago: fila.metodo_pago
  };
}

/**
 * Todo lo que necesitan las dos pantallas (plazas y fuera) en una sola
 * lectura, para que las dos cuenten siempre la misma historia.
 */
function leerEstado(db) {
  const filas = db.prepare(`
    SELECT o.*, t.nombre AS tamano_nombre, p.nombre AS plaza_nombre,
           v.numero AS venta_numero, v.metodo_pago
    FROM ordenes o
    JOIN tamanos t ON t.id = o.tamano_id
    LEFT JOIN plazas p ON p.id = o.plaza_id
    LEFT JOIN ventas v ON v.orden_id = o.id
    WHERE o.estado IN ${EN_ABIERTOS}
    ORDER BY o.creada_at, o.id
  `).all(...ABIERTOS);

  const items = db.prepare(`
    SELECT oi.orden_id, oi.nombre, oi.duracion_min
    FROM orden_items oi
    JOIN ordenes o ON o.id = oi.orden_id
    WHERE o.estado IN ${EN_ABIERTOS}
    ORDER BY oi.id
  `).all(...ABIERTOS);

  const itemsPorOrden = new Map();
  for (const item of items) {
    if (!itemsPorOrden.has(item.orden_id)) itemsPorOrden.set(item.orden_id, []);
    itemsPorOrden.get(item.orden_id).push(item);
  }
  const ordenes = filas.map(f => _mapearOrden(f, itemsPorOrden.get(f.id) || []));

  const plazas = db.prepare('SELECT id, nombre FROM plazas WHERE activa = 1 ORDER BY orden, id').all()
    .map(p => ({
      id: p.id,
      nombre: p.nombre,
      orden: ordenes.find(o => o.estado === 'lavando' && o.plazaId === p.id) || null
    }));

  return {
    plazas,
    espera: ordenes.filter(o => o.estado === 'en_espera'),
    listos: ordenes.filter(o => o.estado === 'listo').sort((a, b) => a.finAt - b.finAt),
    ahora: Date.now()
  };
}

function leerCatalogo(db) {
  const tamanos = db.prepare('SELECT id, nombre FROM tamanos ORDER BY orden, id').all();
  const precios = db.prepare('SELECT servicio_id, tamano_id, precio FROM servicio_precios').all();
  const servicios = db.prepare('SELECT id, nombre, duracion_min, categoria FROM servicios WHERE activo = 1 ORDER BY orden, id').all()
    .map(s => ({
      id: s.id,
      nombre: s.nombre,
      duracionMin: s.duracion_min,
      categoria: s.categoria,
      precios: Object.fromEntries(precios.filter(p => p.servicio_id === s.id).map(p => [p.tamano_id, p.precio]))
    }));
  const plazas = db.prepare('SELECT id, nombre FROM plazas WHERE activa = 1 ORDER BY orden, id').all();
  const config = Object.fromEntries(db.prepare('SELECT key, value FROM config').all().map(c => [c.key, c.value]));

  return { tamanos, servicios, plazas, nombreLocal: config.nombre_local || 'Mi lavadero' };
}

module.exports = { leerEstado, leerCatalogo };
