/**
 * Reconoce la marca al principio del texto del vehículo ("Toyota Hilux
 * blanca" → Toyota) y devuelve su logo. El campo sigue siendo texto libre:
 * si no empieza por una marca conocida, no hay logo.
 */
import { MARCAS, LOGOS } from '../datos/vehiculos.js';
import { normalizar } from './sugerencias.js';
import { escapeHtml } from './sanitize.js';

// Las más largas primero: "Land Rover" antes que una hipotética "Land".
const CLAVES = MARCAS
  .map(m => ({ marca: m.marca, clave: normalizar(m.marca) }))
  .sort((a, b) => b.clave.length - a.clave.length);

export function detectarMarca(texto) {
  const n = normalizar(texto).trim();
  if (!n) return null;
  return CLAVES.find(c => n === c.clave || n.startsWith(c.clave + ' '))?.marca || null;
}

/** HTML del logo de una marca, o '' si no se conoce. Tamaño en px. */
export function logoDeMarca(marca, tam = 28) {
  if (!marca) return '';
  const slug = LOGOS[marca];
  if (slug) {
    return `<img class="logo-marca" src="img/marcas/${slug}.png" alt="${escapeHtml(marca)}" title="${escapeHtml(marca)}" width="${tam}" height="${tam}" loading="lazy">`;
  }
  // Sin imagen: la inicial en un círculo, para no dejar el hueco vacío.
  return `<span class="logo-marca logo-marca--inicial" style="--tam:${tam}px" title="${escapeHtml(marca)}" aria-label="${escapeHtml(marca)}">${escapeHtml(marca[0])}</span>`;
}

/** Atajo: logo a partir del texto libre del vehículo. */
export function logoVehiculo(texto, tam) {
  return logoDeMarca(detectarMarca(texto), tam);
}
