/**
 * Marcas y modelos para el autocompletado de "Nuevo vehículo". Local, sin
 * internet. Centrado en lo que más circula en Paraguay; ampliar a mano.
 *
 * Cada modelo lleva el tamaño con el que se cobra (ids de la tabla `tamanos`):
 * al elegirlo se marca solo el tamaño. Es una sugerencia: se puede cambiar.
 */
const A = 'auto';
const S = 'suv';
const C = 'camioneta';

export const MARCAS = [
  { marca: 'Toyota', modelos: [['Hilux', C], ['Corolla', A], ['Corolla Cross', S], ['Yaris', A], ['Etios', A], ['Vitz', A], ['RAV4', S], ['Fortuner', S], ['SW4', S], ['Land Cruiser', S], ['Land Cruiser Prado', S], ['Rush', S], ['Raize', S], ['Allion', A], ['Premio', A], ['Belta', A], ['Ist', A], ['Probox', A], ['Hiace', C], ['Avanza', S]] },
  { marca: 'Kia', modelos: [['Picanto', A], ['Rio', A], ['Soluto', A], ['Cerato', A], ['Sportage', S], ['Sorento', S], ['Seltos', S], ['Sonet', S], ['Stonic', S], ['Carnival', S], ['K2500', C]] },
  { marca: 'Hyundai', modelos: [['HB20', A], ['Accent', A], ['Elantra', A], ['Grand i10', A], ['i10', A], ['Creta', S], ['Tucson', S], ['Santa Fe', S], ['Kona', S], ['Venue', S], ['H-1', C], ['H100', C]] },
  { marca: 'Chevrolet', modelos: [['Onix', A], ['Onix Plus', A], ['Prisma', A], ['Joy', A], ['Spark', A], ['Cruze', A], ['Tracker', S], ['Captiva', S], ['Equinox', S], ['Trailblazer', S], ['Spin', S], ['S10', C], ['Montana', C]] },
  { marca: 'Nissan', modelos: [['March', A], ['Versa', A], ['Sentra', A], ['Tiida', A], ['Note', A], ['Kicks', S], ['X-Trail', S], ['Qashqai', S], ['Pathfinder', S], ['Frontier', C], ['Navara', C], ['NP300', C]] },
  { marca: 'Volkswagen', modelos: [['Gol', A], ['Voyage', A], ['Polo', A], ['Virtus', A], ['Fox', A], ['Up', A], ['Golf', A], ['Vento', A], ['T-Cross', S], ['Nivus', S], ['Taos', S], ['Tiguan', S], ['Amarok', C], ['Saveiro', C]] },
  { marca: 'Ford', modelos: [['Ka', A], ['Fiesta', A], ['Focus', A], ['EcoSport', S], ['Territory', S], ['Bronco Sport', S], ['Everest', S], ['Explorer', S], ['Ranger', C], ['Maverick', C], ['F-150', C]] },
  { marca: 'Suzuki', modelos: [['Alto', A], ['Celerio', A], ['Swift', A], ['Dzire', A], ['Baleno', A], ['Ciaz', A], ['Ignis', S], ['S-Presso', A], ['Vitara', S], ['Grand Vitara', S], ['Jimny', S], ['Ertiga', S]] },
  { marca: 'Honda', modelos: [['Fit', A], ['City', A], ['Civic', A], ['Accord', A], ['WR-V', S], ['HR-V', S], ['CR-V', S], ['Pilot', S]] },
  { marca: 'Mitsubishi', modelos: [['Mirage', A], ['Lancer', A], ['ASX', S], ['Outlander', S], ['Montero', S], ['Montero Sport', S], ['Pajero', S], ['L200', C]] },
  { marca: 'Renault', modelos: [['Kwid', A], ['Sandero', A], ['Logan', A], ['Clio', A], ['Stepway', A], ['Duster', S], ['Captur', S], ['Koleos', S], ['Oroch', C], ['Alaskan', C], ['Kangoo', C], ['Master', C]] },
  { marca: 'Fiat', modelos: [['Mobi', A], ['Uno', A], ['Argo', A], ['Cronos', A], ['Palio', A], ['Siena', A], ['Pulse', S], ['Fastback', S], ['Strada', C], ['Toro', C], ['Fiorino', C]] },
  { marca: 'Peugeot', modelos: [['208', A], ['301', A], ['308', A], ['2008', S], ['3008', S], ['5008', S], ['Partner', C], ['Landtrek', C]] },
  { marca: 'Mazda', modelos: [['Mazda2', A], ['Mazda3', A], ['CX-3', S], ['CX-30', S], ['CX-5', S], ['CX-9', S], ['BT-50', C]] },
  { marca: 'Chery', modelos: [['QQ', A], ['Arrizo 5', A], ['Tiggo 2', S], ['Tiggo 3', S], ['Tiggo 4', S], ['Tiggo 7', S], ['Tiggo 8', S]] },
  { marca: 'JAC', modelos: [['S2', S], ['S3', S], ['JS4', S], ['T6', C], ['T8', C], ['T9', C]] },
  { marca: 'Great Wall', modelos: [['Wingle', C], ['Poer', C]] },
  { marca: 'Haval', modelos: [['Jolion', S], ['H6', S], ['Dargo', S]] },
  { marca: 'Changan', modelos: [['Alsvin', A], ['CS15', S], ['CS35', S], ['CS55', S], ['Hunter', C]] },
  { marca: 'Geely', modelos: [['Emgrand', A], ['Coolray', S], ['Azkarra', S]] },
  { marca: 'BYD', modelos: [['Dolphin', A], ['Dolphin Mini', A], ['Seal', A], ['Yuan Plus', S], ['Song Plus', S], ['Tang', S], ['Shark', C]] },
  { marca: 'Jeep', modelos: [['Renegade', S], ['Compass', S], ['Commander', S], ['Cherokee', S], ['Grand Cherokee', S], ['Wrangler', S], ['Gladiator', C]] },
  { marca: 'RAM', modelos: [['700', C], ['1000', C], ['1500', C], ['2500', C]] },
  { marca: 'Isuzu', modelos: [['D-Max', C], ['MU-X', S]] },
  { marca: 'Subaru', modelos: [['Impreza', A], ['XV', S], ['Forester', S], ['Outback', S]] },
  { marca: 'Citroën', modelos: [['C3', A], ['C4 Cactus', S], ['C5 Aircross', S], ['Berlingo', C]] },
  { marca: 'Mercedes-Benz', modelos: [['Clase A', A], ['Clase C', A], ['Clase E', A], ['GLA', S], ['GLC', S], ['GLE', S], ['Sprinter', C]] },
  { marca: 'BMW', modelos: [['Serie 1', A], ['Serie 3', A], ['Serie 5', A], ['X1', S], ['X3', S], ['X5', S]] },
  { marca: 'Audi', modelos: [['A3', A], ['A4', A], ['Q2', S], ['Q3', S], ['Q5', S]] },
  { marca: 'Lexus', modelos: [['IS', A], ['NX', S], ['RX', S], ['LX', S]] },
  { marca: 'Volvo', modelos: [['XC40', S], ['XC60', S], ['XC90', S]] },
  { marca: 'Dodge', modelos: [['Journey', S], ['Durango', S]] },
  { marca: 'Land Rover', modelos: [['Defender', S], ['Discovery', S], ['Range Rover Evoque', S], ['Range Rover Sport', S]] },
  { marca: 'Mahindra', modelos: [['Scorpio', C], ['Pik Up', C], ['XUV500', S]] },
  { marca: 'Foton', modelos: [['Tunland', C], ['View', C]] },
  { marca: 'DFSK', modelos: [['Glory 580', S], ['C31', C], ['K01', C]] }
];

export const COLORES = ['blanco', 'negro', 'gris', 'plata', 'rojo', 'azul', 'verde', 'beige', 'marrón', 'bordó', 'amarillo', 'naranja', 'dorado', 'celeste'];
