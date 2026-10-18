/**
 * Marcas y modelos para el autocompletado de "Nuevo vehículo". Local, sin
 * internet. Pensado para el parque automotor de Paraguay:
 *  - modelos de concesionario (mercado Mercosur, Corea, China) y
 *  - los japoneses usados importados, muy comunes en el país (Allion, Premio,
 *    Vitz, Ractis, Spacio, Wish, Demio, AD...).
 * Dentro de cada marca, los más frecuentes van primero: salen antes en las
 * sugerencias. Ampliar a mano cuando aparezca uno que falte.
 *
 * Cada modelo lleva el tamaño con el que se cobra (ids de la tabla `tamanos`):
 * al elegirlo se marca solo el tamaño. Es una sugerencia: se puede cambiar.
 *   auto      = turismos, hatchbacks, sedanes, peruas/wagon pequeñas
 *   suv       = SUV, crossovers, monovolúmenes
 *   camioneta = pick-ups, furgones y utilitarios grandes
 */
const A = 'auto';
const S = 'suv';
const C = 'camioneta';

export const MARCAS = [
  { marca: 'Toyota', modelos: [
    ['Hilux', C], ['Corolla', A], ['Allion', A], ['Premio', A], ['Vitz', A], ['Yaris', A], ['Etios', A], ['Fortuner', S],
    ['SW4', S], ['RAV4', S], ['Land Cruiser Prado', S], ['Land Cruiser', S], ['Land Cruiser 70', C], ['Corolla Cross', S],
    ['Ractis', A], ['Spacio', S], ['Corolla Fielder', A], ['Runx', A], ['Allex', A], ['Belta', A], ['Platz', A], ['Passo', A],
    ['Ist', A], ['bB', A], ['Funcargo', A], ['Probox', A], ['Succeed', A], ['Wish', S], ['Sienta', S], ['Noah', S],
    ['Voxy', S], ['Estima', S], ['Ipsum', S], ['Nadia', S], ['Gaia', S], ['Caldina', A], ['Corona', A], ['Carina', A],
    ['Camry', A], ['Mark II', A], ['Crown', A], ['Harrier', S], ['Kluger', S], ['Hilux Surf', S], ['4Runner', S],
    ['Rush', S], ['Raize', S], ['Avanza', S], ['C-HR', S], ['Prius', A], ['Aqua', A], ['Hiace', C], ['Dyna', C], ['Tacoma', C], ['Tundra', C]
  ] },
  { marca: 'Kia', modelos: [
    ['Picanto', A], ['Rio', A], ['Soluto', A], ['Sportage', S], ['Sorento', S], ['Cerato', A], ['Seltos', S], ['Sonet', S],
    ['Stonic', S], ['Carens', S], ['Carnival', S], ['Morning', A], ['Soul', S], ['K3', A], ['Optima', A], ['Mohave', S],
    ['Bongo', C], ['K2500', C], ['K2700', C], ['Frontier', C], ['Pregio', C]
  ] },
  { marca: 'Hyundai', modelos: [
    ['HB20', A], ['Accent', A], ['Grand i10', A], ['i10', A], ['Tucson', S], ['Creta', S], ['Santa Fe', S], ['Elantra', A],
    ['Kona', S], ['Venue', S], ['Atos', A], ['Getz', A], ['i20', A], ['i30', A], ['Verna', A], ['Sonata', A], ['ix35', S],
    ['Galloper', S], ['Terracan', S], ['Palisade', S], ['Staria', C], ['H-1', C], ['H100', C], ['Porter', C], ['HD65', C]
  ] },
  { marca: 'Chevrolet', modelos: [
    ['Onix', A], ['Onix Plus', A], ['Prisma', A], ['Joy', A], ['Spark', A], ['Celta', A], ['Classic', A], ['Corsa', A],
    ['Agile', A], ['Cobalt', A], ['Sail', A], ['Aveo', A], ['Cruze', A], ['Vectra', A], ['Astra', A], ['Tracker', S],
    ['Captiva', S], ['Equinox', S], ['Trailblazer', S], ['Blazer', S], ['Spin', S], ['Zafira', S], ['Groove', S],
    ['S10', C], ['Montana', C], ['D-Max', C], ['Silverado', C], ['N300', C]
  ] },
  { marca: 'Nissan', modelos: [
    ['Frontier', C], ['March', A], ['Versa', A], ['Sentra', A], ['Tiida', A], ['Note', A], ['Kicks', S], ['X-Trail', S],
    ['AD', A], ['Wingroad', A], ['Sunny', A], ['Bluebird Sylphy', A], ['Lucino', A], ['Primera', A], ['Cube', A],
    ['Juke', S], ['Qashqai', S], ['Murano', S], ['Pathfinder', S], ['Terrano', S], ['Patrol', S], ['Serena', S],
    ['Navara', C], ['NP300', C], ['Urvan', C]
  ] },
  { marca: 'Volkswagen', modelos: [
    ['Gol', A], ['Voyage', A], ['Polo', A], ['Virtus', A], ['Fox', A], ['Up', A], ['Suran', A], ['Golf', A], ['Vento', A],
    ['Bora', A], ['Jetta', A], ['Passat', A], ['Escarabajo', A], ['T-Cross', S], ['Nivus', S], ['Taos', S], ['Tiguan', S],
    ['Touareg', S], ['CrossFox', S], ['Amarok', C], ['Saveiro', C], ['Kombi', C], ['Transporter', C]
  ] },
  { marca: 'Ford', modelos: [
    ['Ranger', C], ['Ka', A], ['Fiesta', A], ['Focus', A], ['Fusion', A], ['Escort', A], ['EcoSport', S], ['Territory', S],
    ['Bronco Sport', S], ['Bronco', S], ['Everest', S], ['Explorer', S], ['Edge', S], ['Escape', S], ['Kuga', S],
    ['Maverick', C], ['F-100', C], ['F-150', C], ['F-250', C], ['F-4000', C], ['Transit', C]
  ] },
  { marca: 'Suzuki', modelos: [
    ['Swift', A], ['Alto', A], ['Celerio', A], ['Dzire', A], ['Baleno', A], ['Ciaz', A], ['S-Presso', A], ['Wagon R', A],
    ['Every', A], ['Ignis', S], ['Vitara', S], ['Grand Vitara', S], ['Escudo', S], ['Jimny', S], ['Ertiga', S], ['XL7', S],
    ['S-Cross', S], ['Carry', C], ['APV', C]
  ] },
  { marca: 'Honda', modelos: [
    ['Fit', A], ['City', A], ['Civic', A], ['Accord', A], ['Insight', A], ['Airwave', A], ['WR-V', S], ['HR-V', S],
    ['CR-V', S], ['Pilot', S], ['Freed', S], ['Stream', S], ['Odyssey', S], ['Mobilio', S]
  ] },
  { marca: 'Mitsubishi', modelos: [
    ['L200', C], ['Montero', S], ['Montero Sport', S], ['Pajero', S], ['Pajero io', S], ['Pajero Sport', S], ['Outlander', S],
    ['ASX', S], ['RVR', S], ['Eclipse Cross', S], ['Lancer', A], ['Galant', A], ['Mirage', A], ['Colt', A], ['Space Wagon', S],
    ['Delica', S], ['Canter', C], ['L300', C]
  ] },
  { marca: 'Mazda', modelos: [
    ['Demio', A], ['Mazda2', A], ['Mazda3', A], ['Axela', A], ['Familia', A], ['Mazda6', A], ['Atenza', A], ['Premacy', S],
    ['MPV', S], ['Tribute', S], ['CX-3', S], ['CX-30', S], ['CX-5', S], ['CX-7', S], ['CX-9', S], ['BT-50', C], ['B2500', C]
  ] },
  { marca: 'Renault', modelos: [
    ['Kwid', A], ['Sandero', A], ['Logan', A], ['Clio', A], ['Stepway', A], ['Symbol', A], ['Fluence', A], ['Megane', A],
    ['Duster', S], ['Captur', S], ['Koleos', S], ['Oroch', C], ['Alaskan', C], ['Kangoo', C], ['Master', C], ['Trafic', C]
  ] },
  { marca: 'Fiat', modelos: [
    ['Strada', C], ['Toro', C], ['Mobi', A], ['Uno', A], ['Argo', A], ['Cronos', A], ['Palio', A], ['Siena', A], ['Grand Siena', A],
    ['Punto', A], ['Idea', S], ['Pulse', S], ['Fastback', S], ['Fiorino', C], ['Ducato', C]
  ] },
  { marca: 'Peugeot', modelos: [
    ['208', A], ['207', A], ['206', A], ['301', A], ['308', A], ['408', A], ['2008', S], ['3008', S], ['5008', S],
    ['Partner', C], ['Expert', C], ['Boxer', C], ['Landtrek', C]
  ] },
  { marca: 'Citroën', modelos: [
    ['C3', A], ['C3 Aircross', S], ['C4', A], ['C4 Cactus', S], ['C4 Lounge', A], ['C5 Aircross', S], ['Berlingo', C], ['Jumper', C]
  ] },
  { marca: 'Isuzu', modelos: [['D-Max', C], ['MU-X', S], ['Trooper', S], ['Rodeo', S], ['NPR', C], ['NKR', C]] },
  { marca: 'Subaru', modelos: [['Impreza', A], ['Legacy', A], ['XV', S], ['Crosstrek', S], ['Forester', S], ['Outback', S]] },
  { marca: 'Daihatsu', modelos: [['Terios', S], ['Charade', A], ['Sirion', A], ['Cuore', A], ['Move', A], ['Hijet', C]] },
  { marca: 'Jeep', modelos: [['Renegade', S], ['Compass', S], ['Commander', S], ['Cherokee', S], ['Grand Cherokee', S], ['Wrangler', S], ['Gladiator', C]] },
  { marca: 'RAM', modelos: [['Rampage', C], ['700', C], ['1000', C], ['1500', C], ['2500', C]] },
  { marca: 'Dodge', modelos: [['Journey', S], ['Durango', S], ['Dakota', C]] },

  // ---- Marcas chinas (muy presentes en concesionarios paraguayos) ----
  { marca: 'Chery', modelos: [['Tiggo 2', S], ['Tiggo 3', S], ['Tiggo 4', S], ['Tiggo 5', S], ['Tiggo 7', S], ['Tiggo 8', S], ['QQ', A], ['Arrizo 5', A], ['Fulwin', A], ['Celer', A]] },
  { marca: 'JAC', modelos: [['S2', S], ['S3', S], ['JS2', S], ['JS4', S], ['S5', S], ['T6', C], ['T8', C], ['T9', C], ['J2', A], ['Sunray', C]] },
  { marca: 'Haval', modelos: [['Jolion', S], ['H6', S], ['H2', S], ['Dargo', S]] },
  { marca: 'Great Wall', modelos: [['Wingle', C], ['Poer', C], ['Hover', S], ['Voleex', A]] },
  { marca: 'Changan', modelos: [['CS15', S], ['CS35', S], ['CS35 Plus', S], ['CS55', S], ['UNI-T', S], ['Alsvin', A], ['Hunter', C], ['MD201', C]] },
  { marca: 'Geely', modelos: [['Coolray', S], ['Azkarra', S], ['Okavango', S], ['Emgrand', A], ['GX3', S]] },
  { marca: 'BYD', modelos: [['Dolphin', A], ['Dolphin Mini', A], ['Seal', A], ['Yuan Plus', S], ['Song Plus', S], ['Song Pro', S], ['Tang', S], ['Shark', C], ['F0', A], ['F3', A]] },
  { marca: 'JETOUR', modelos: [['X70', S], ['X70 Plus', S], ['Dashing', S], ['T2', S]] },
  { marca: 'Kaiyi', modelos: [['X3', S], ['X3 Pro', S], ['E5', A]] },
  { marca: 'GAC', modelos: [['GS3', S], ['GS4', S], ['GS8', S], ['Emkoo', S]] },
  { marca: 'MG', modelos: [['ZS', S], ['ZX', S], ['HS', S], ['MG3', A], ['MG5', A], ['RX5', S]] },
  { marca: 'BAIC', modelos: [['X35', S], ['X55', S], ['BJ40', S], ['D20', A]] },
  { marca: 'Dongfeng', modelos: [['Rich', C], ['AX7', S], ['Glory', S]] },
  { marca: 'DFSK', modelos: [['Glory 500', S], ['Glory 580', S], ['C31', C], ['C35', C], ['K01', C]] },
  { marca: 'Maxus', modelos: [['T60', C], ['T90', C], ['D60', S], ['G10', C], ['V80', C]] },
  { marca: 'Foton', modelos: [['Tunland', C], ['View', C], ['Gratour', C]] },
  { marca: 'Jinbei', modelos: [['Haise', C], ['Grand Haise', C]] },
  { marca: 'Lifan', modelos: [['X60', S], ['X70', S], ['320', A], ['520', A]] },
  { marca: 'Zotye', modelos: [['T600', S], ['Z100', A]] },
  { marca: 'Soueast', modelos: [['DX3', S], ['DX7', S]] },
  { marca: 'Mahindra', modelos: [['Pik Up', C], ['Scorpio', C], ['XUV500', S], ['XUV300', S]] },

  // ---- Premium y otras ----
  { marca: 'Mercedes-Benz', modelos: [['Clase A', A], ['Clase C', A], ['Clase E', A], ['GLA', S], ['GLB', S], ['GLC', S], ['GLE', S], ['ML', S], ['Sprinter', C], ['Vito', C]] },
  { marca: 'BMW', modelos: [['Serie 1', A], ['Serie 3', A], ['Serie 5', A], ['X1', S], ['X2', S], ['X3', S], ['X5', S], ['X6', S]] },
  { marca: 'Audi', modelos: [['A1', A], ['A3', A], ['A4', A], ['A6', A], ['Q2', S], ['Q3', S], ['Q5', S], ['Q7', S]] },
  { marca: 'Lexus', modelos: [['IS', A], ['ES', A], ['UX', S], ['NX', S], ['RX', S], ['GX', S], ['LX', S]] },
  { marca: 'Volvo', modelos: [['XC40', S], ['XC60', S], ['XC90', S], ['S60', A]] },
  { marca: 'Land Rover', modelos: [['Defender', S], ['Discovery', S], ['Discovery Sport', S], ['Range Rover', S], ['Range Rover Evoque', S], ['Range Rover Sport', S], ['Range Rover Velar', S]] },
  { marca: 'Porsche', modelos: [['Cayenne', S], ['Macan', S], ['911', A]] },
  { marca: 'Mini', modelos: [['Cooper', A], ['Countryman', S]] },
  { marca: 'Chrysler', modelos: [['PT Cruiser', A], ['Town & Country', S]] },
  { marca: 'SsangYong', modelos: [['Actyon', S], ['Actyon Sports', C], ['Rexton', S], ['Korando', S], ['Musso', C], ['Tivoli', S]] },
  { marca: 'Tesla', modelos: [['Model 3', A], ['Model Y', S]] }
];

export const COLORES = ['blanco', 'negro', 'gris', 'plata', 'rojo', 'azul', 'verde', 'beige', 'marrón', 'bordó', 'amarillo', 'naranja', 'dorado', 'celeste', 'champagne', 'perla', 'grafito', 'violeta'];

/**
 * Logo de cada marca: archivo en public/img/marcas/<slug>.png.
 * Miniaturas de car-logos-dataset (github.com/filippofilip95/car-logos-dataset,
 * MIT para la recopilación; cada logo es propiedad de su marca). Se sirven en
 * local para no depender de internet. Las marcas sin entrada (Kaiyi, DFSK,
 * Jinbei: no están en el dataset) muestran su inicial.
 */
export const LOGOS = {
  'Toyota': 'toyota', 'Kia': 'kia', 'Hyundai': 'hyundai', 'Chevrolet': 'chevrolet', 'Nissan': 'nissan',
  'Volkswagen': 'volkswagen', 'Ford': 'ford', 'Suzuki': 'suzuki', 'Honda': 'honda', 'Mitsubishi': 'mitsubishi',
  'Mazda': 'mazda', 'Renault': 'renault', 'Fiat': 'fiat', 'Peugeot': 'peugeot', 'Citroën': 'citroen',
  'Isuzu': 'isuzu', 'Subaru': 'subaru', 'Daihatsu': 'daihatsu', 'Jeep': 'jeep', 'RAM': 'ram', 'Dodge': 'dodge',
  'Chery': 'chery', 'JAC': 'jac', 'Haval': 'haval', 'Great Wall': 'great-wall', 'Changan': 'changan',
  'Geely': 'geely', 'BYD': 'byd', 'JETOUR': 'jetour', 'GAC': 'gac-group', 'MG': 'mg', 'BAIC': 'baic-motor',
  'Dongfeng': 'dongfeng', 'Maxus': 'maxus', 'Foton': 'foton', 'Lifan': 'lifan', 'Zotye': 'zotye',
  'Soueast': 'soueast', 'Mahindra': 'mahindra', 'Mercedes-Benz': 'mercedes-benz', 'BMW': 'bmw', 'Audi': 'audi',
  'Lexus': 'lexus', 'Volvo': 'volvo', 'Land Rover': 'land-rover', 'Porsche': 'porsche', 'Mini': 'mini',
  'Chrysler': 'chrysler', 'SsangYong': 'ssangyong', 'Tesla': 'tesla'
};
