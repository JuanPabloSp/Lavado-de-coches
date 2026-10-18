const Database = require('better-sqlite3');
const { abrirBaseDatos } = require('../../server/db/database');
const { runMigrations, ultimaVersionConocida } = require('../../server/db/migrations');
const { sembrarSiVacia, sembrarDetailing } = require('../../server/db/seed');

beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => {}));
afterAll(() => console.log.mockRestore());

describe('arranque de la base de datos', () => {
  test('desde cero migra a la última versión y siembra con las claves foráneas activas', () => {
    const db = abrirBaseDatos(':memory:');
    expect(db.pragma('user_version', { simple: true })).toBe(ultimaVersionConocida());
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(db.prepare('SELECT COUNT(*) AS n FROM plazas').get().n).toBe(2);
    // 5 lavados + 12 de detailing, cada uno con precio para los 3 tamaños.
    expect(db.prepare('SELECT COUNT(*) AS n FROM servicio_precios').get().n).toBe(51);
    expect(db.prepare("SELECT COUNT(*) AS n FROM servicios WHERE categoria = 'detailing'").get().n).toBe(12);
    expect(db.prepare("SELECT valor FROM contadores WHERE nombre = 'venta'").get().valor).toBe(0);
    db.close();
  });

  test('sembrar dos veces no duplica ni pisa nada', () => {
    const db = abrirBaseDatos(':memory:');
    db.prepare("UPDATE servicio_precios SET precio = 12345 WHERE servicio_id = 1 AND tamano_id = 'auto'").run();
    expect(sembrarSiVacia(db)).toBe(false);
    expect(db.prepare('SELECT COUNT(*) AS n FROM plazas').get().n).toBe(2);
    expect(db.prepare("SELECT precio FROM servicio_precios WHERE servicio_id = 1 AND tamano_id = 'auto'").get().precio).toBe(12345);
    db.close();
  });

  test('si la BD es más nueva que el código, se niega a arrancar sin tocarla', () => {
    const db = new Database(':memory:');
    db.exec('CREATE TABLE testigo (x INTEGER); INSERT INTO testigo VALUES (7);');
    db.pragma(`user_version = ${ultimaVersionConocida() + 1}`);

    expect(() => runMigrations(db)).toThrow(/MÁS VIEJO que la base de datos/);
    expect(db.pragma('user_version', { simple: true })).toBe(ultimaVersionConocida() + 1);
    expect(db.prepare('SELECT x FROM testigo').get().x).toBe(7);
    db.close();
  });

  test('los importes rechazan decimales: los guaraníes son enteros', () => {
    const db = abrirBaseDatos(':memory:');
    expect(() => db.prepare("UPDATE servicio_precios SET precio = 30000.5 WHERE servicio_id = 1 AND tamano_id = 'auto'").run())
      .toThrow(/CHECK constraint failed/);
    db.close();
  });

  test('el detailing se añade una sola vez: si el dueño desactiva uno, no vuelve', () => {
    const db = abrirBaseDatos(':memory:');
    db.prepare("UPDATE servicios SET activo = 0 WHERE nombre = 'Tratamiento cerámico'").run();
    expect(sembrarDetailing(db)).toBe(false);
    expect(db.prepare("SELECT COUNT(*) AS n FROM servicios WHERE nombre = 'Tratamiento cerámico'").get().n).toBe(1);
    db.close();
  });

  test('una BD que ya existía (versión 1, con datos) recibe la categoría y el detailing', () => {
    const { migrations } = require('../../server/db/migrations');
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    // Solo la migración 1 y sus datos: como un lavadero instalado antes del cambio.
    migrations[0].up(db);
    db.pragma('user_version = 1');
    sembrarSiVacia(db);

    runMigrations(db);
    expect(db.pragma('user_version', { simple: true })).toBe(ultimaVersionConocida());
    expect(db.prepare("SELECT COUNT(*) AS n FROM servicios WHERE categoria = 'lavado'").get().n).toBe(5);

    expect(sembrarDetailing(db)).toBe(true);
    expect(db.prepare("SELECT COUNT(*) AS n FROM servicios WHERE categoria = 'detailing'").get().n).toBe(12);
    expect(sembrarDetailing(db)).toBe(false);
    db.close();
  });
});
