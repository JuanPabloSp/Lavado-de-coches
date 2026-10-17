const request = require('supertest');
const { abrirBaseDatos } = require('../../server/db/database');
const { createApp } = require('../../server/app');

let db;
let app;

beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => {}));
afterAll(() => console.log.mockRestore());
beforeEach(() => {
  db = abrirBaseDatos(':memory:');
  app = createApp(db);
});
afterEach(() => db.close());

const config = async () => (await request(app).get('/api/configuracion')).body;

describe('datos del local', () => {
  test('se guardan y salen en el catálogo (nombre en la cabecera)', async () => {
    const res = await request(app).put('/api/configuracion/local').send({
      nombreLocal: 'Lavadero Central', razonSocial: 'Central S.A.', ruc: '80012345-6',
      direccion: 'Av. Mcal. López 1234', ciudad: 'Asunción', telefono: null
    });
    expect(res.status).toBe(200);
    expect(res.body.local).toMatchObject({ nombreLocal: 'Lavadero Central', ruc: '80012345-6', telefono: '' });
    expect((await request(app).get('/api/catalogo')).body.nombreLocal).toBe('Lavadero Central');
  });

  test('el nombre es obligatorio y el RUC lleva dígito verificador', async () => {
    expect((await request(app).put('/api/configuracion/local').send({ nombreLocal: '' })).status).toBe(400);
    const res = await request(app).put('/api/configuracion/local').send({ nombreLocal: 'X', ruc: '80012345' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/dígito verificador/);
  });
});

describe('plazas', () => {
  test('se añade una plaza con nombre automático y aparece en el estado', async () => {
    const res = await request(app).post('/api/plazas').send({});
    expect(res.status).toBe(201);
    const { plazas } = (await request(app).get('/api/estado')).body;
    expect(plazas.map(p => p.nombre)).toEqual(['Plaza 1', 'Plaza 2', 'Plaza 3']);
  });

  test('no se repiten nombres', async () => {
    const res = await request(app).post('/api/plazas').send({ nombre: 'plaza 1' });
    expect(res.status).toBe(409);
  });

  test('renombrar y desactivar; desactivada no sale en el estado', async () => {
    await request(app).patch('/api/plazas/2').send({ nombre: 'Box techado' });
    await request(app).patch('/api/plazas/1').send({ activa: false });
    const { plazas } = (await request(app).get('/api/estado')).body;
    expect(plazas.map(p => p.nombre)).toEqual(['Box techado']);
    expect((await config()).plazas.find(p => p.id === 1).activa).toBe(false);
  });

  test('no se desactiva una plaza ocupada ni la última activa', async () => {
    await request(app).post('/api/ordenes').send({ matricula: 'AAA111', tamanoId: 'auto', servicioIds: [1] });
    await request(app).post('/api/plazas/1/siguiente');
    const ocupada = await request(app).patch('/api/plazas/1').send({ activa: false });
    expect(ocupada.status).toBe(409);
    expect(ocupada.body.error).toMatch(/AAA111/);

    await request(app).patch('/api/plazas/1').send({}).expect(400);
    const ultima = await request(app).patch('/api/plazas/2').send({ activa: false });
    expect(ultima.status).toBe(200);
    // Plaza 1 sigue activa (ocupada), así que la 2 sí se pudo desactivar; ahora
    // termina el lavado e intenta dejar 0 activas.
    await request(app).post('/api/ordenes/1/terminar');
    const sinNinguna = await request(app).patch('/api/plazas/1').send({ activa: false });
    expect(sinNinguna.status).toBe(409);
    expect(sinNinguna.body.error).toMatch(/al menos una plaza activa/);
  });
});
