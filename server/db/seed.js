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

module.exports = { sembrarSiVacia };
