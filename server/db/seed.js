/**
 * Datos de partida para una instalación nueva. Corre DESPUÉS de las
 * migraciones y solo si no hay plazas: nunca borra ni pisa nada.
 *
 * En el comandero el seed hacía DELETE + INSERT y se comía valores que una
 * migración acababa de poner (registro, entrada 119). Aquí cada fila lleva
 * todos sus valores explícitos y no se borra nada.
 *
 * Los precios son de EJEMPLO, en guaraníes. Hay que ajustarlos a la lista real
 * del lavadero.
 */

const PLAZAS = [
  { id: 1, nombre: 'Plaza 1', orden: 1 },
  { id: 2, nombre: 'Plaza 2', orden: 2 }
];

const TAMANOS = [
  { id: 'auto', nombre: 'Auto', orden: 1 },
  { id: 'suv', nombre: 'SUV', orden: 2 },
  { id: 'camioneta', nombre: 'Camioneta', orden: 3 }
];

// precios: [auto, suv, camioneta]
const SERVICIOS = [
  { id: 1, nombre: 'Lavado exterior', duracionMin: 20, orden: 1, precios: [30000, 40000, 50000] },
  { id: 2, nombre: 'Lavado completo', duracionMin: 45, orden: 2, precios: [60000, 75000, 90000] },
  { id: 3, nombre: 'Aspirado interior', duracionMin: 15, orden: 3, precios: [25000, 30000, 35000] },
  { id: 4, nombre: 'Encerado', duracionMin: 30, orden: 4, precios: [40000, 50000, 60000] },
  { id: 5, nombre: 'Lavado de motor', duracionMin: 20, orden: 5, precios: [35000, 40000, 45000] }
];

/**
 * Servicios de detailing habituales en Paraguay. Precios de EJEMPLO: no hay
 * listas publicadas; salen de anuncios sueltos (pulido de faros 100.000-150.000
 * Gs el par, limpieza interior completa ~140.000 Gs) y de proporciones entre
 * servicios. Duraciones orientativas, en minutos.
 */
const DETAILING = [
  { nombre: 'Limpieza interior completa', duracionMin: 180, precios: [150000, 180000, 220000] },
  { nombre: 'Lavado de tapizados con extracción', duracionMin: 240, precios: [250000, 300000, 350000] },
  { nombre: 'Hidratación de cuero', duracionMin: 90, precios: [120000, 150000, 180000] },
  { nombre: 'Revividor de plásticos', duracionMin: 45, precios: [50000, 60000, 70000] },
  { nombre: 'Sanitizado con ozono', duracionMin: 40, precios: [60000, 70000, 80000] },
  { nombre: 'Pulido de faros (par)', duracionMin: 60, precios: [100000, 100000, 120000] },
  { nombre: 'Descontaminado de pintura', duracionMin: 90, precios: [120000, 150000, 180000] },
  { nombre: 'Pulido de carrocería', duracionMin: 240, precios: [350000, 420000, 500000] },
  { nombre: 'Corrección de pintura (2 pasos)', duracionMin: 480, precios: [600000, 750000, 900000] },
  { nombre: 'Sellado acrílico', duracionMin: 120, precios: [200000, 250000, 300000] },
  { nombre: 'Tratamiento cerámico', duracionMin: 480, precios: [1500000, 1800000, 2200000] },
  { nombre: 'Lavado de chasis', duracionMin: 30, precios: [60000, 80000, 100000] }
];

/**
 * Añade los servicios de detailing UNA sola vez por base de datos (marca en
 * `config`), también en instalaciones que ya existían. Si luego el dueño
 * desactiva o cambia alguno, no se vuelve a tocar.
 */
function sembrarDetailing(db) {
  const hecho = db.prepare("SELECT value FROM config WHERE key = 'detailing_sembrado'").get();
  if (hecho) return false;

  db.transaction(() => {
    const tamanos = db.prepare('SELECT id FROM tamanos ORDER BY orden, id').all().map(t => t.id);
    let orden = db.prepare('SELECT COALESCE(MAX(orden), 0) AS o FROM servicios').get().o;
    const existe = db.prepare('SELECT 1 FROM servicios WHERE lower(nombre) = lower(?)');
    const insServicio = db.prepare("INSERT INTO servicios (nombre, duracion_min, activo, orden, categoria) VALUES (?, ?, 1, ?, 'detailing')");
    const insPrecio = db.prepare('INSERT INTO servicio_precios (servicio_id, tamano_id, precio) VALUES (?, ?, ?)');
    const PRECIO_POR_TAMANO = { auto: 0, suv: 1, camioneta: 2 };

    for (const s of DETAILING) {
      if (existe.get(s.nombre)) continue;
      const { lastInsertRowid } = insServicio.run(s.nombre, s.duracionMin, ++orden);
      for (const t of tamanos) {
        // Un tamaño que no sea de los tres de partida toma el precio más alto.
        insPrecio.run(lastInsertRowid, t, s.precios[PRECIO_POR_TAMANO[t] ?? 2]);
      }
    }
    db.prepare("INSERT INTO config (key, value) VALUES ('detailing_sembrado', '1')").run();
  })();

  console.log('[Database] Servicios de detailing de ejemplo añadidos.');
  return true;
}

function sembrarSiVacia(db) {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM plazas').get();
  if (n > 0) return false;

  db.transaction(() => {
    const insPlaza = db.prepare('INSERT INTO plazas (id, nombre, orden, activa) VALUES (?, ?, ?, 1)');
    for (const p of PLAZAS) insPlaza.run(p.id, p.nombre, p.orden);

    const insTamano = db.prepare('INSERT INTO tamanos (id, nombre, orden) VALUES (?, ?, ?)');
    for (const t of TAMANOS) insTamano.run(t.id, t.nombre, t.orden);

    const insServicio = db.prepare('INSERT INTO servicios (id, nombre, duracion_min, activo, orden) VALUES (?, ?, ?, 1, ?)');
    const insPrecio = db.prepare('INSERT INTO servicio_precios (servicio_id, tamano_id, precio) VALUES (?, ?, ?)');
    for (const s of SERVICIOS) {
      insServicio.run(s.id, s.nombre, s.duracionMin, s.orden);
      TAMANOS.forEach((t, i) => insPrecio.run(s.id, t.id, s.precios[i]));
    }

    db.prepare("INSERT OR IGNORE INTO config (key, value) VALUES ('nombre_local', 'Mi lavadero')").run();
  })();

  console.log('[Database] Datos de partida creados (plazas, tamaños y servicios de ejemplo).');
  return true;
}

module.exports = { sembrarSiVacia, sembrarDetailing };
