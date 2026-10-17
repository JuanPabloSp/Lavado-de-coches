/**
 * Motor de sugerencias para el campo "Vehículo": marca → modelo → color.
 * Funciones puras sobre el catálogo local (datos/vehiculos.js).
 *
 * Ejemplos:
 *   "toy"            → Toyota (marca)
 *   "hilu"           → Toyota Hilux (modelo, aunque no se escriba la marca)
 *   "toyota h"       → Toyota Hilux, Toyota Hiace
 *   "toyota hilux g" → Toyota Hilux gris (color)
 */
import { MARCAS, COLORES } from '../datos/vehiculos.js';

const MAX = 8;

/** Minúsculas, sin tildes y con un solo espacio: "Citroën" y "citroen" casan. */
export function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trimStart();
}

const CATALOGO = MARCAS.map(m => ({
  marca: m.marca,
  clave: normalizar(m.marca),
  modelos: m.modelos.map(([nombre, tamano]) => ({ nombre, tamano, clave: normalizar(nombre) }))
}));

// "corolla" no debe confundirse con "corolla cross": se prueban los más largos primero.
const empiezaPor = (texto, prefijo) => texto === prefijo || texto.startsWith(prefijo + ' ');
const casaPalabra = (clave, buscado) => clave.startsWith(buscado) || clave.split(/[ -]/).some(p => p.startsWith(buscado));

/**
 * @returns {{tipo:'marca'|'modelo'|'color', texto:string, valor:string, detalle?:string, tamano?:string}[]}
 */
export function sugerir(entrada) {
  const n = normalizar(entrada);
  if (!n.trim()) return [];

  // ¿Empieza por una marca conocida seguida de espacio? Entonces buscamos modelo.
  const marca = CATALOGO
    .filter(m => n.startsWith(m.clave + ' '))
    .sort((a, b) => b.clave.length - a.clave.length)[0];

  if (marca) {
    const resto = n.slice(marca.clave.length + 1);
    const modelo = [...marca.modelos]
      .sort((a, b) => b.clave.length - a.clave.length)
      .find(m => empiezaPor(resto, m.clave) && resto.length > m.clave.length);

    // "toyota land cruiser " todavía puede seguir a "Land Cruiser Prado" o "70":
    // mientras haya modelos más largos que empiecen así, se ofrecen esos.
    const continuaciones = modelo
      ? marca.modelos.filter(m => m.clave.startsWith(resto.trimEnd() + ' ') || m === modelo)
      : [];
    if (modelo && continuaciones.length > 1 && resto.trimEnd() === modelo.clave) {
      return continuaciones
        .slice(0, MAX)
        .map(m => ({ tipo: 'modelo', texto: `${marca.marca} ${m.nombre}`, valor: `${marca.marca} ${m.nombre}`, tamano: m.tamano }));
    }

    if (modelo) {
      // Marca y modelo completos: ahora el color.
      const color = resto.slice(modelo.clave.length + 1).trim();
      const base = `${marca.marca} ${modelo.nombre}`;
      // "land cruiser p" puede ser "Land Cruiser Prado" o el color plata:
      // primero el modelo más largo que encaje, luego los colores.
      const masLargos = marca.modelos
        .filter(m => m.clave.length > modelo.clave.length && m.clave.startsWith(resto.trim()))
        .map(m => ({ tipo: 'modelo', texto: `${marca.marca} ${m.nombre}`, valor: `${marca.marca} ${m.nombre}`, tamano: m.tamano }));
      return masLargos.concat(COLORES
        .filter(c => normalizar(c).startsWith(color))
        .filter(c => normalizar(c) !== color)
        .map(c => ({ tipo: 'color', texto: c, valor: `${base} ${c}` }))).slice(0, MAX);
    }

    return marca.modelos
      .filter(m => !resto.trim() || casaPalabra(m.clave, resto.trim()))
      .slice(0, MAX)
      .map(m => ({ tipo: 'modelo', texto: `${marca.marca} ${m.nombre}`, valor: `${marca.marca} ${m.nombre}`, tamano: m.tamano }));
  }

  // Sin marca completa: marcas que empiezan así, y modelos de cualquier marca.
  const buscado = n.trim();
  const marcas = CATALOGO
    .filter(m => casaPalabra(m.clave, buscado))
    .map(m => ({ tipo: 'marca', texto: m.marca, valor: m.marca, detalle: `${m.modelos.length} modelos` }));
  const modelos = CATALOGO.flatMap(m => m.modelos
    .filter(mo => casaPalabra(mo.clave, buscado))
    .map(mo => ({ tipo: 'modelo', texto: `${m.marca} ${mo.nombre}`, valor: `${m.marca} ${mo.nombre}`, tamano: mo.tamano })));

  return [...marcas, ...modelos].slice(0, MAX);
}
