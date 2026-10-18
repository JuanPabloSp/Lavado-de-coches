/**
 * Migraciones de esquema versionadas con PRAGMA user_version.
 *
 * A diferencia del comandero, aquí NO hay schema.sql: la migración 1 crea todo
 * y las siguientes se añaden al final. Tener dos fuentes del esquema (el .sql y
 * las migraciones) es lo que rompió el arranque desde cero en el comandero
 * (registro, entrada 33): una sola fuente, un solo orden de ejecución.
 *
 * Reglas:
 *  - Las migraciones se AÑADEN al final; nunca se editan ni se reordenan una
 *    vez que han corrido en el lavadero.
 *  - Cada una corre en una transacción junto con el incremento de user_version.
 *  - Importes en guaraníes ENTEROS. El CHECK con typeof() impide que un REAL se
 *    cuele por error (el comandero arrastraba restos de coma flotante).
 */

const IMPORTE = (col) => `${col} INTEGER NOT NULL CHECK(typeof(${col}) = 'integer' AND ${col} >= 0)`;

const migrations = [
  {
    version: 1,
    name: 'esquema_inicial',
    up(db) {
      db.exec(`
        CREATE TABLE config (
          key   TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        -- Numeraciones que solo suben (ver utils/contadores.js).
        CREATE TABLE contadores (
          nombre TEXT PRIMARY KEY,
          valor  INTEGER NOT NULL DEFAULT 0
        );

        -- Zonas de trabajo. Su estado (libre/ocupada) NO se guarda: se deriva
        -- de si hay una orden 'lavando' en ella. En el comandero mesas.estado
        -- se desincronizaba de las comandas (registro, entradas 26 y 27).
        CREATE TABLE plazas (
          id     INTEGER PRIMARY KEY,
          nombre TEXT NOT NULL,
          orden  INTEGER NOT NULL DEFAULT 0,
          activa INTEGER NOT NULL DEFAULT 1 CHECK(activa IN (0, 1))
        );

        CREATE TABLE tamanos (
          id     TEXT PRIMARY KEY,
          nombre TEXT NOT NULL,
          orden  INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE servicios (
          id           INTEGER PRIMARY KEY,
          nombre       TEXT NOT NULL,
          duracion_min INTEGER NOT NULL DEFAULT 30 CHECK(duracion_min > 0),
          activo       INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1)),
          orden        INTEGER NOT NULL DEFAULT 0
        );

        -- Precio de cada servicio según el tamaño del vehículo.
        CREATE TABLE servicio_precios (
          servicio_id INTEGER NOT NULL REFERENCES servicios(id),
          tamano_id   TEXT NOT NULL REFERENCES tamanos(id),
          ${IMPORTE('precio')},
          PRIMARY KEY (servicio_id, tamano_id)
        );

        -- Sin uso en la interfaz todavía: llega con el login por PIN.
        CREATE TABLE empleados (
          id     INTEGER PRIMARY KEY,
          nombre TEXT NOT NULL,
          activo INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1))
        );

        CREATE TABLE ordenes (
          id               INTEGER PRIMARY KEY,
          matricula        TEXT NOT NULL,
          vehiculo         TEXT NOT NULL DEFAULT '',
          tamano_id        TEXT NOT NULL REFERENCES tamanos(id),
          cliente_nombre   TEXT NOT NULL DEFAULT '',
          cliente_telefono TEXT NOT NULL DEFAULT '',
          notas            TEXT NOT NULL DEFAULT '',
          estado           TEXT NOT NULL DEFAULT 'en_espera'
                           CHECK(estado IN ('en_espera', 'lavando', 'listo', 'entregada', 'cancelada')),
          plaza_id         INTEGER REFERENCES plazas(id),
          empleado_id      INTEGER REFERENCES empleados(id),
          ${IMPORTE('total')},
          creada_at        INTEGER NOT NULL,
          inicio_at        INTEGER,
          fin_at           INTEGER,
          entregada_at     INTEGER,
          cancelada_at     INTEGER,
          cancelada_motivo TEXT NOT NULL DEFAULT '',
          CHECK (estado <> 'lavando' OR plaza_id IS NOT NULL)
        );

        -- Última línea de defensa: aunque una ruta olvidara comprobarlo, la BD
        -- no admite dos coches lavándose en la misma plaza ni dos órdenes
        -- abiertas para la misma matrícula.
        CREATE UNIQUE INDEX idx_ordenes_plaza_ocupada ON ordenes(plaza_id) WHERE estado = 'lavando';
        CREATE UNIQUE INDEX idx_ordenes_matricula_abierta ON ordenes(matricula)
          WHERE estado IN ('en_espera', 'lavando', 'listo');
        CREATE INDEX idx_ordenes_estado ON ordenes(estado, creada_at);

        -- Copia de lo contratado al crear la orden: si luego cambia el precio
        -- del catálogo, la orden conserva el suyo.
        CREATE TABLE orden_items (
          id           INTEGER PRIMARY KEY,
          orden_id     INTEGER NOT NULL REFERENCES ordenes(id),
          servicio_id  INTEGER NOT NULL REFERENCES servicios(id),
          nombre       TEXT NOT NULL,
          ${IMPORTE('precio')},
          duracion_min INTEGER NOT NULL
        );
        CREATE INDEX idx_orden_items_orden ON orden_items(orden_id);

        -- Cobros. Una orden se cobra una sola vez (orden_id UNIQUE) y una venta
        -- no se borra nunca: anular será un registro aparte, con rastro, como
        -- hace el comandero desde la entrada 114.
        CREATE TABLE ventas (
          id               INTEGER PRIMARY KEY,
          numero           INTEGER NOT NULL UNIQUE,
          orden_id         INTEGER NOT NULL UNIQUE REFERENCES ordenes(id),
          ${IMPORTE('total')},
          metodo_pago      TEXT NOT NULL CHECK(metodo_pago IN ('efectivo', 'tarjeta', 'qr', 'transferencia')),
          ${IMPORTE('importe_recibido')},
          ${IMPORTE('vuelto')},
          cliente_ruc      TEXT NOT NULL DEFAULT '',
          cliente_nombre   TEXT NOT NULL DEFAULT '',
          creada_at        INTEGER NOT NULL
        );
        CREATE INDEX idx_ventas_fecha ON ventas(creada_at);

        CREATE TABLE venta_items (
          id          INTEGER PRIMARY KEY,
          venta_id    INTEGER NOT NULL REFERENCES ventas(id) ON DELETE RESTRICT,
          servicio_id INTEGER NOT NULL,
          nombre      TEXT NOT NULL,
          ${IMPORTE('precio')}
        );
        CREATE INDEX idx_venta_items_venta ON venta_items(venta_id);

        CREATE TABLE logs (
          id         INTEGER PRIMARY KEY,
          accion     TEXT NOT NULL,
          detalles   TEXT NOT NULL DEFAULT '',
          created_at INTEGER NOT NULL
        );
        CREATE INDEX idx_logs_fecha ON logs(created_at);

        INSERT INTO contadores (nombre, valor) VALUES ('venta', 0);
      `);
    }
  },
  {
    version: 2,
    name: 'categoria_servicio',
    // Separa los lavados de los servicios de detailing para agruparlos en la
    // pantalla. Los servicios existentes son todos lavados.
    up(db) {
      db.exec(`ALTER TABLE servicios ADD COLUMN categoria TEXT NOT NULL DEFAULT 'lavado'
               CHECK(categoria IN ('lavado', 'detailing'))`);
    }
  }
];

function ultimaVersionConocida() {
  return Math.max(0, ...migrations.map(m => m.version));
}

function runMigrations(db) {
  const current = db.pragma('user_version', { simple: true });
  const ultimaConocida = ultimaVersionConocida();

  // CÓDIGO MÁS VIEJO QUE LA BASE DE DATOS: no arrancar. Copiado del comandero
  // (registro, entrada 122): al restaurar un backup con un commit anterior, no
  // había migraciones "pendientes" y el servidor arrancaba en silencio con una
  // lógica que no conoce el esquema. Mejor un fallo ruidoso al instalar.
  // Se comprueba antes de tocar nada.
  if (current > ultimaConocida) {
    throw new Error(
      `La base de datos está en la versión de esquema ${current}, pero este código solo conoce ` +
      `hasta la ${ultimaConocida}: el código es MÁS VIEJO que la base de datos. Despliega el mismo ` +
      `commit con el que se generó esta BD, o uno posterior, y vuelve a arrancar. ` +
      `La base de datos no se ha modificado.`
    );
  }

  for (const migration of migrations.filter(m => m.version > current)) {
    db.transaction(() => {
      migration.up(db);
      db.pragma(`user_version = ${migration.version}`);
    })();
    console.log(`[Database] Migración ${migration.version} (${migration.name}) aplicada.`);
  }

  return db.pragma('user_version', { simple: true });
}

module.exports = { runMigrations, ultimaVersionConocida, migrations };
