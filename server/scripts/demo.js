/**
 * Llena una base de datos de DEMOSTRACIÓN con vehículos ficticios y arranca el
 * servidor con ella. Nunca toca la BD real (data/lavadero.db): usa
 * data/demo.db, que se borra y se vuelve a crear en cada ejecución.
 *
 *   npm run demo
 */
const path = require('path');
const fs = require('fs');
const { abrirBaseDatos } = require('../db/database');
const ordenes = require('../services/ordenes');

const RUTA = path.resolve(__dirname, '..', '..', 'data', 'demo.db');
for (const sufijo of ['', '-wal', '-shm']) fs.rmSync(RUTA + sufijo, { force: true });

const db = abrirBaseDatos(RUTA);
const MIN = 60 * 1000;
const ahora = Date.now();

// Servicios del seed: 1 exterior, 2 completo, 3 aspirado, 4 encerado, 5 motor.
const VEHICULOS = [
  // En la plaza
  { matricula: 'AAEK 452', vehiculo: 'Toyota Hilux blanca', tamanoId: 'camioneta', servicioIds: [2, 4], clienteNombre: 'Carlos Benítez', clienteTelefono: '0981 234 567', hace: 50, plaza: 1, lavando: 35 },
  { matricula: 'ABCF 118', vehiculo: 'Kia Picanto rojo', tamanoId: 'auto', servicioIds: [1], clienteNombre: 'Lucía Giménez', hace: 30, plaza: 2, lavando: 12, cobro: 'qr' },
  // Listos para retirar
  { matricula: 'AAZP 903', vehiculo: 'Hyundai Tucson gris', tamanoId: 'suv', servicioIds: [2], clienteNombre: 'Ramón Ortiz', clienteTelefono: '0972 888 101', hace: 95, listo: 20, cobro: 'tarjeta' },
  { matricula: 'ADGH 271', vehiculo: 'Volkswagen Gol negro', tamanoId: 'auto', servicioIds: [1, 3], hace: 80, listo: 8 },
  { matricula: 'ABRT 640', vehiculo: 'Nissan Frontier azul', tamanoId: 'camioneta', servicioIds: [1, 5], clienteNombre: 'Transportes Itá', hace: 120, listo: 45 },
  // En espera
  { matricula: 'AAMN 327', vehiculo: 'Chevrolet Onix plata', tamanoId: 'auto', servicioIds: [2], clienteNombre: 'Sofía Duarte', clienteTelefono: '0985 445 210', hace: 25 },
  { matricula: 'ACDE 815', vehiculo: 'Toyota RAV4 blanca', tamanoId: 'suv', servicioIds: [2, 3, 4], hace: 18, cobro: 'efectivo', notas: 'Silla de bebé atrás, no sacarla' },
  { matricula: 'ABJK 559', vehiculo: 'Suzuki Swift amarillo', tamanoId: 'auto', servicioIds: [1], hace: 11 },
  { matricula: 'AAPQ 204', vehiculo: 'Ford Ranger gris', tamanoId: 'camioneta', servicioIds: [2, 5], clienteNombre: 'Agro San Pedro', clienteTelefono: '0991 300 400', hace: 6, notas: 'Mucho barro en los bajos' },
  { matricula: 'ACWX 772', vehiculo: 'Honda HR-V roja', tamanoId: 'suv', servicioIds: [1, 3], hace: 2 }
];

// Los "listos" primero: pasan por una plaza y la dejan libre antes de que
// entren los que se quedan lavando.
const orden = [...VEHICULOS.filter(v => v.listo), ...VEHICULOS.filter(v => !v.listo)];
for (const v of orden) {
  const id = ordenes.crearOrden(db, { vehiculo: '', clienteNombre: '', clienteTelefono: '', notas: '', ...v });
  db.prepare('UPDATE ordenes SET creada_at = ? WHERE id = ?').run(ahora - v.hace * MIN, id);

  if (v.cobro) ordenes.cobrarOrden(db, id, { metodoPago: v.cobro, importeRecibido: null, clienteRuc: '', clienteNombre: v.clienteNombre || '' });

  if (v.plaza) {
    ordenes.iniciarLavado(db, id, v.plaza);
    db.prepare('UPDATE ordenes SET inicio_at = ? WHERE id = ?').run(ahora - v.lavando * MIN, id);
  } else if (v.listo) {
    const plazaLibre = db.prepare("SELECT id FROM plazas WHERE id NOT IN (SELECT plaza_id FROM ordenes WHERE estado = 'lavando') LIMIT 1").get();
    ordenes.iniciarLavado(db, id, plazaLibre.id);
    ordenes.terminarLavado(db, id);
    db.prepare('UPDATE ordenes SET inicio_at = ?, fin_at = ? WHERE id = ?')
      .run(ahora - (v.listo + 40) * MIN, ahora - v.listo * MIN, id);
  }
}

console.log(`[Demo] ${VEHICULOS.length} vehículos ficticios cargados en ${RUTA}`);
db.close();

process.env.DB_PATH = './data/demo.db';
require('../index');
