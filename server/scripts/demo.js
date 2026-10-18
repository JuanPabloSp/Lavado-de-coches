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
try {
  for (const sufijo of ['', '-wal', '-shm']) fs.rmSync(RUTA + sufijo, { force: true });
} catch (error) {
  if (error.code !== 'EBUSY') throw error;
  console.error('[Demo] data/demo.db está en uso: hay otro servidor del lavadero abierto. Ciérralo y vuelve a ejecutar npm run demo.');
  process.exit(1);
}

const db = abrirBaseDatos(RUTA);
const configuracion = require('../services/configuracion');
const MIN = 60 * 1000;
const ahora = Date.now();

// ---- El local (datos ficticios para la demostración) ----
configuracion.guardarDatosLocal(db, {
  nombreLocal: 'NogueraDetailing',
  razonSocial: 'Noguera Detailing (demo)',
  ruc: '80000000-0',
  direccion: 'Av. Ejemplo 1234',
  ciudad: 'Asunción',
  telefono: '0981 000 000'
});
// Tercera plaza, dedicada a los trabajos largos de detailing.
configuracion.crearPlaza(db, 'Box detailing');

// Los servicios se buscan por nombre: los ids del detailing no son fijos.
const SERVICIO = Object.fromEntries(db.prepare('SELECT id, nombre FROM servicios').all().map(s => [s.nombre, s.id]));
const S = (...nombres) => nombres.map(n => {
  if (!SERVICIO[n]) throw new Error(`[Demo] No existe el servicio "${n}"`);
  return SERVICIO[n];
});

const VEHICULOS = [
  // En las plazas
  { matricula: 'AAEK 452', vehiculo: 'Toyota Hilux blanca', tamanoId: 'camioneta', servicioIds: S('Lavado completo', 'Encerado'), clienteNombre: 'Carlos Benítez', clienteTelefono: '0981 234 567', hace: 50, plaza: 1, lavando: 35 },
  { matricula: 'ABCF 118', vehiculo: 'Kia Picanto rojo', tamanoId: 'auto', servicioIds: S('Lavado exterior'), clienteNombre: 'Lucía Giménez', hace: 30, plaza: 2, lavando: 12, cobro: 'qr' },
  { matricula: 'AAXS 610', vehiculo: 'Toyota Land Cruiser Prado negro', tamanoId: 'suv', servicioIds: S('Descontaminado de pintura', 'Pulido de carrocería', 'Tratamiento cerámico'), clienteNombre: 'Martín Rojas', clienteTelefono: '0983 777 650', hace: 200, plaza: 3, lavando: 180, cobro: 'transferencia', notas: 'Cerámico de 2 capas. Entregar mañana a las 10:00' },
  // Listos para retirar
  { matricula: 'AAZP 903', vehiculo: 'Hyundai Tucson gris', tamanoId: 'suv', servicioIds: S('Limpieza interior completa', 'Sanitizado con ozono'), clienteNombre: 'Ramón Ortiz', clienteTelefono: '0972 888 101', hace: 260, listo: 20, cobro: 'tarjeta' },
  { matricula: 'ADGH 271', vehiculo: 'Volkswagen Gol negro', tamanoId: 'auto', servicioIds: S('Lavado exterior', 'Aspirado interior'), hace: 80, listo: 8 },
  { matricula: 'ABRT 640', vehiculo: 'Nissan Frontier azul', tamanoId: 'camioneta', servicioIds: S('Lavado exterior', 'Lavado de chasis', 'Lavado de motor'), clienteNombre: 'Transportes Itá', hace: 120, listo: 45 },
  // En espera
  { matricula: 'AAMN 327', vehiculo: 'Chevrolet Onix plata', tamanoId: 'auto', servicioIds: S('Lavado completo', 'Pulido de faros (par)'), clienteNombre: 'Sofía Duarte', clienteTelefono: '0985 445 210', hace: 25 },
  { matricula: 'ACDE 815', vehiculo: 'Toyota RAV4 blanca', tamanoId: 'suv', servicioIds: S('Lavado de tapizados con extracción', 'Revividor de plásticos'), hace: 18, cobro: 'efectivo', notas: 'Silla de bebé atrás, no sacarla' },
  { matricula: 'ABJK 559', vehiculo: 'Suzuki Swift amarillo', tamanoId: 'auto', servicioIds: S('Lavado exterior'), hace: 11 },
  { matricula: 'AAPQ 204', vehiculo: 'Ford Ranger gris', tamanoId: 'camioneta', servicioIds: S('Lavado completo', 'Lavado de chasis'), clienteNombre: 'Agro San Pedro', clienteTelefono: '0991 300 400', hace: 6, notas: 'Mucho barro en los bajos' },
  { matricula: 'ACWX 772', vehiculo: 'Honda HR-V roja', tamanoId: 'suv', servicioIds: S('Hidratación de cuero', 'Sellado acrílico'), clienteNombre: 'Ana Villalba', hace: 2 },
  { matricula: 'ADKM 095', vehiculo: 'BMW X3 blanco', tamanoId: 'suv', servicioIds: S('Corrección de pintura (2 pasos)', 'Sellado acrílico'), clienteNombre: 'Diego Cáceres', clienteTelefono: '0994 120 330', hace: 1 }
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
