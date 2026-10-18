/**
 * Ciclo de vida de una orden de lavado. Funciones puras, sin BD, para poder
 * testearlas aisladas.
 *
 *   en_espera ──► lavando ──► listo ──► entregada
 *       │  ◄──────┘  │  ◄───────┘ │      (listo vuelve atrás: "Volver a lavar")
 *       └──────────► cancelada ◄──┘
 *
 * El cobro NO es un estado: una orden está pagada si tiene venta, y se puede
 * cobrar en cualquier estado abierto (al dejar el coche o al retirarlo).
 */

const TRANSICIONES = {
  en_espera: ['lavando', 'cancelada'],
  lavando: ['listo', 'en_espera', 'cancelada'],
  // listo → lavando / en_espera: deshacer un "Terminado" pulsado sin querer.
  listo: ['entregada', 'cancelada', 'lavando', 'en_espera'],
  entregada: [],
  cancelada: []
};

const ETIQUETAS = {
  en_espera: 'En espera',
  lavando: 'Lavando',
  listo: 'Listo para retirar',
  entregada: 'Entregada',
  cancelada: 'Cancelada'
};

/** Estados en los que la orden sigue en el lavadero (y se puede cobrar). */
const ABIERTOS = ['en_espera', 'lavando', 'listo'];

function puedePasar(de, a) {
  return (TRANSICIONES[de] || []).includes(a);
}

function mensajeTransicion(de, a) {
  return `No se puede pasar de "${ETIQUETAS[de] || de}" a "${ETIQUETAS[a] || a}".`;
}

module.exports = { TRANSICIONES, ETIQUETAS, ABIERTOS, puedePasar, mensajeTransicion };
