const request = require('supertest');
const { abrirBaseDatos } = require('../../server/db/database');
const { createApp } = require('../../server/app');

let db;
let app;

beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => {}));
afterAll(() => console.log.mockRestore());

// BD nueva en memoria para cada test: ninguno depende de lo que dejó otro
// (en el comandero un test dejaba una mesa ocupada y hacía fallar al siguiente).
beforeEach(() => {
  db = abrirBaseDatos(':memory:');
  app = createApp(db);
});
afterEach(() => db.close());

// Precios del seed: 1 = Lavado exterior (auto 30.000), 3 = Aspirado (auto 25.000).
function crear(datos = {}) {
  return request(app).post('/api/ordenes').send({
    matricula: 'ABCD 123',
    tamanoId: 'auto',
    servicioIds: [1, 3],
    ...datos
  });
}

const estado = async () => (await request(app).get('/api/estado')).body;

describe('crear órdenes', () => {
  test('el total lo calcula el servidor con los precios de la BD, no los del cliente', async () => {
    const res = await crear({ total: 1, precio: 1, servicioIds: [1, 3] });
    expect(res.status).toBe(201);

    const { espera } = await estado();
    expect(espera).toHaveLength(1);
    expect(espera[0]).toMatchObject({ matricula: 'ABCD123', total: 55000, pagada: false });
    expect(espera[0].servicios).toEqual(['Lavado exterior', 'Aspirado interior']);
  });

  test('el precio depende del tamaño del vehículo', async () => {
    await crear({ tamanoId: 'camioneta', servicioIds: [1] });
    expect((await estado()).espera[0].total).toBe(50000);
  });

  test('los campos opcionales aceptan null', async () => {
    const res = await crear({ vehiculo: null, clienteNombre: null, clienteTelefono: null, notas: null });
    expect(res.status).toBe(201);
  });

  test('la misma matrícula no puede tener dos órdenes abiertas, aunque se escriba distinto', async () => {
    await crear({ matricula: 'abcd-123' });
    const res = await crear({ matricula: 'ABCD 123' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/ya tiene una orden abierta/);
  });

  test('un servicio inexistente o sin servicios se rechaza', async () => {
    expect((await crear({ servicioIds: [999] })).status).toBe(400);
    expect((await crear({ servicioIds: [] })).status).toBe(400);
    expect((await crear({ tamanoId: 'tractor' })).status).toBe(400);
  });
});

describe('plazas', () => {
  test('"meter siguiente" toma el primero que llegó', async () => {
    const a = (await crear({ matricula: 'AAA111' })).body.id;
    await crear({ matricula: 'BBB222' });

    const res = await request(app).post('/api/plazas/1/siguiente');
    expect(res.body.ordenId).toBe(a);

    const e = await estado();
    expect(e.plazas[0].orden.matricula).toBe('AAA111');
    expect(e.plazas[1].orden).toBeNull();
    expect(e.espera.map(o => o.matricula)).toEqual(['BBB222']);
  });

  test('una plaza ocupada no admite otro vehículo', async () => {
    await crear({ matricula: 'AAA111' });
    const b = (await crear({ matricula: 'BBB222' })).body.id;
    await request(app).post('/api/plazas/1/siguiente');

    const res = await request(app).post(`/api/ordenes/${b}/iniciar`).send({ plazaId: 1 });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Plaza 1 está ocupada por AAA111/);
  });

  test('sin vehículos en la cola, "meter siguiente" lo dice', async () => {
    const res = await request(app).post('/api/plazas/1/siguiente');
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('No hay vehículos esperando.');
  });

  test('devolver a la cola libera la plaza', async () => {
    const a = (await crear()).body.id;
    await request(app).post(`/api/ordenes/${a}/iniciar`).send({ plazaId: 2 });
    await request(app).post(`/api/ordenes/${a}/devolver`);

    const e = await estado();
    expect(e.plazas[1].orden).toBeNull();
    expect(e.espera[0]).toMatchObject({ id: a, plazaId: null });
  });

  test('no se puede saltar de la espera a listo', async () => {
    const a = (await crear()).body.id;
    expect((await request(app).post(`/api/ordenes/${a}/terminar`)).status).toBe(409);
  });
});

describe('cobro y entrega', () => {
  async function ordenLista() {
    const id = (await crear()).body.id;
    await request(app).post(`/api/ordenes/${id}/iniciar`).send({ plazaId: 1 });
    await request(app).post(`/api/ordenes/${id}/terminar`);
    return id;
  }

  test('en efectivo calcula el vuelto y numera las ventas correlativas', async () => {
    const a = await ordenLista();
    const res = await request(app).post(`/api/ordenes/${a}/cobrar`).send({ metodoPago: 'efectivo', importeRecibido: 60000 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ numero: 1, total: 55000, recibido: 60000, vuelto: 5000 });

    const b = (await crear({ matricula: 'ZZZ999' })).body.id;
    const res2 = await request(app).post(`/api/ordenes/${b}/cobrar`).send({ metodoPago: 'qr' });
    expect(res2.body).toMatchObject({ numero: 2, recibido: 55000, vuelto: 0 });
  });

  test('en efectivo, si falta dinero, no cobra y dice cuánto falta', async () => {
    const a = await ordenLista();
    const res = await request(app).post(`/api/ordenes/${a}/cobrar`).send({ metodoPago: 'efectivo', importeRecibido: 50000 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Faltan Gs. 5.000.');
    expect(db.prepare('SELECT COUNT(*) AS n FROM ventas').get().n).toBe(0);
  });

  test('los importes con decimales se rechazan', async () => {
    const a = await ordenLista();
    const res = await request(app).post(`/api/ordenes/${a}/cobrar`).send({ metodoPago: 'efectivo', importeRecibido: 60000.5 });
    expect(res.status).toBe(400);
  });

  test('una orden no se cobra dos veces', async () => {
    const a = await ordenLista();
    await request(app).post(`/api/ordenes/${a}/cobrar`).send({ metodoPago: 'tarjeta' });
    const res = await request(app).post(`/api/ordenes/${a}/cobrar`).send({ metodoPago: 'tarjeta' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/ya está cobrada \(venta Nº 1\)/);
  });

  test('se puede cobrar por adelantado, con el vehículo aún en espera', async () => {
    const a = (await crear()).body.id;
    const res = await request(app).post(`/api/ordenes/${a}/cobrar`).send({ metodoPago: 'transferencia', clienteRuc: '80012345-6' });
    expect(res.status).toBe(201);
    expect((await estado()).espera[0]).toMatchObject({ pagada: true, ventaNumero: 1, metodoPago: 'transferencia' });
  });

  test('no se entrega un vehículo sin cobrar', async () => {
    const a = await ordenLista();
    const res = await request(app).post(`/api/ordenes/${a}/entregar`);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Falta cobrar/);
  });

  test('"cobrar y entregar" hace las dos cosas a la vez', async () => {
    const a = await ordenLista();
    const res = await request(app).post(`/api/ordenes/${a}/cobrar`).send({ metodoPago: 'efectivo', entregar: true });
    expect(res.body).toMatchObject({ entregada: true, vuelto: 0 });
    const e = await estado();
    expect(e.listos).toHaveLength(0);
    expect(db.prepare('SELECT estado FROM ordenes WHERE id = ?').get(a).estado).toBe('entregada');
  });

  test('"cobrar y entregar" de un vehículo que aún se lava no cobra nada', async () => {
    const a = (await crear()).body.id;
    await request(app).post(`/api/ordenes/${a}/iniciar`).send({ plazaId: 1 });
    const res = await request(app).post(`/api/ordenes/${a}/cobrar`).send({ metodoPago: 'efectivo', entregar: true });
    expect(res.status).toBe(409);
    // La transacción entera se deshace: ni venta ni número consumido.
    expect(db.prepare('SELECT COUNT(*) AS n FROM ventas').get().n).toBe(0);
    expect(db.prepare("SELECT valor FROM contadores WHERE nombre = 'venta'").get().valor).toBe(0);
  });

  test('una orden cobrada no se puede cancelar; una sin cobrar sí', async () => {
    const a = (await crear({ matricula: 'AAA111' })).body.id;
    const b = (await crear({ matricula: 'BBB222' })).body.id;
    await request(app).post(`/api/ordenes/${a}/cobrar`).send({ metodoPago: 'tarjeta' });

    expect((await request(app).post(`/api/ordenes/${a}/cancelar`).send({ motivo: 'se fue' })).status).toBe(409);
    expect((await request(app).post(`/api/ordenes/${b}/cancelar`).send({ motivo: null })).status).toBe(200);
    expect((await estado()).espera.map(o => o.matricula)).toEqual(['AAA111']);
  });
});

describe('errores', () => {
  test('una orden inexistente da 404 y un id no numérico 400', async () => {
    expect((await request(app).post('/api/ordenes/999/terminar')).status).toBe(404);
    expect((await request(app).post('/api/ordenes/abc/terminar')).status).toBe(400);
  });

  test('un JSON roto da 400 con mensaje claro', async () => {
    const res = await request(app).post('/api/ordenes').set('Content-Type', 'application/json').send('{"roto":');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/JSON válido/);
  });

  test('server/ y .env no se sirven como estáticos', async () => {
    expect((await request(app).get('/server/app.js')).status).toBe(404);
    expect((await request(app).get('/.env')).status).toBe(404);
  });
});

describe('volver a lavar un vehículo marcado como listo', () => {
  async function lista(matricula = 'AAA111', plazaId = 1) {
    const id = (await crear({ matricula })).body.id;
    await request(app).post(`/api/ordenes/${id}/iniciar`).send({ plazaId });
    await request(app).post(`/api/ordenes/${id}/terminar`);
    return id;
  }

  test('vuelve a su plaza si sigue libre, con el cronómetro de antes', async () => {
    const id = await lista();
    const inicio = db.prepare('SELECT inicio_at FROM ordenes WHERE id = ?').get(id).inicio_at;
    const res = await request(app).post(`/api/ordenes/${id}/reactivar`);
    expect(res.body).toEqual({ estado: 'lavando', plazaNombre: 'Plaza 1' });
    const e = await estado();
    expect(e.listos).toHaveLength(0);
    expect(e.plazas[0].orden).toMatchObject({ id, inicioAt: inicio, finAt: null });
  });

  test('si su plaza ya está ocupada, vuelve a la cola', async () => {
    const id = await lista();
    await crear({ matricula: 'BBB222' });
    await request(app).post('/api/plazas/1/siguiente');
    const res = await request(app).post(`/api/ordenes/${id}/reactivar`);
    expect(res.body).toEqual({ estado: 'en_espera', plazaNombre: null });
    expect((await estado()).espera.map(o => o.matricula)).toEqual(['AAA111']);
  });

  test('solo desde listo; y /iniciar no sirve para reactivar', async () => {
    const enCola = (await crear({ matricula: 'CCC333' })).body.id;
    expect((await request(app).post(`/api/ordenes/${enCola}/reactivar`)).status).toBe(409);
    const id = await lista('DDD444', 2);
    expect((await request(app).post(`/api/ordenes/${id}/iniciar`).send({ plazaId: 1 })).status).toBe(409);
    expect((await request(app).post(`/api/ordenes/${id}/devolver`)).status).toBe(409);
  });

  test('una orden ya cobrada mantiene su cobro al reactivarla', async () => {
    const id = await lista();
    await request(app).post(`/api/ordenes/${id}/cobrar`).send({ metodoPago: 'qr' });
    await request(app).post(`/api/ordenes/${id}/reactivar`);
    expect((await estado()).plazas[0].orden).toMatchObject({ pagada: true, ventaNumero: 1 });
  });
});
