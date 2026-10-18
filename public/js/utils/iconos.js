/**
 * Iconos SVG en línea (trazo, heredan el color con currentColor).
 * Sin emojis a propósito: en el comandero hizo falta autoalojar una fuente de
 * emojis porque cada terminal los pintaba distinto o no los pintaba.
 */
const svg = (contenido, tam = 22) =>
  `<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${contenido}</svg>`;

export const iconos = {
  gota: (t) => svg('<path d="M12 3c-3.5 4.6-6 7.9-6 11a6 6 0 0 0 12 0c0-3.1-2.5-6.4-6-11z"/>', t),
  efectivo: (t) => svg('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>', t),
  tarjeta: (t) => svg('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>', t),
  qr: (t) => svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>', t),
  transferencia: (t) => svg('<path d="M4 8h14l-4-4M20 16H6l4 4"/>', t),
  check: (t) => svg('<path d="M5 12l5 5L20 7"/>', t),
  x: (t) => svg('<path d="M6 6l12 12M18 6L6 18"/>', t),
  alerta: (t) => svg('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>', t),
  info: (t) => svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', t),
  mas: (t) => svg('<path d="M12 5v14M5 12h14"/>', t),
  sol: (t) => svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', t),
  luna: (t) => svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>', t),
  ajustes: (t) => svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>', t),
  // Auto de frente, relleno (no de trazo): parabrisas y faros calados con
  // evenodd. Es el único icono relleno: se lee mejor a 16px dentro de un chip.
  auto: (t = 22) => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path fill-rule="evenodd" d="M7.3 3.5h9.4c.8 0 1.5.5 1.8 1.2L20.4 9.5h-1.9L16.9 5.4H7.1L5.5 9.5H3.6l1.9-4.8c.3-.7 1-1.2 1.8-1.2z"/>
    <rect x="1" y="7.6" width="3.6" height="2.6" rx="1.1"/>
    <rect x="19.4" y="7.6" width="3.6" height="2.6" rx="1.1"/>
    <path fill-rule="evenodd" d="M4.6 9.5h14.8c.9 0 1.6.7 1.6 1.6v5.3c0 .5-.4.9-.9.9H3.9a.9.9 0 0 1-.9-.9v-5.3c0-.9.7-1.6 1.6-1.6zm1.2 2.6a.9.9 0 0 0 0 1.8h2.6a.9.9 0 0 0 0-1.8H5.8zm9.8 0a.9.9 0 0 0 0 1.8h2.6a.9.9 0 0 0 0-1.8h-2.6z"/>
    <rect x="3.6" y="16.4" width="3.4" height="4.1" rx="0.8"/>
    <rect x="17" y="16.4" width="3.4" height="4.1" rx="0.8"/>
  </svg>`,
  cobrar: (t) => svg('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>', t)
};

export const ICONO_METODO = {
  efectivo: iconos.efectivo,
  tarjeta: iconos.tarjeta,
  qr: iconos.qr,
  transferencia: iconos.transferencia
};
