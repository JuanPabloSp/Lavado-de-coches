/** Trozos de HTML que comparten las vistas. Todo dato de usuario, escapado. */
import { escapeHtml } from '../utils/sanitize.js';
import { METODOS_PAGO } from '../utils/formato.js';

export function chipPago(orden) {
  return orden.pagada
    ? `<span class="chip chip--pagado" title="Venta Nº ${orden.ventaNumero}">Pagado · ${escapeHtml(METODOS_PAGO[orden.metodoPago] || '')}</span>`
    : '<span class="chip chip--sin-cobrar">Sin cobrar</span>';
}

export function detalleVehiculo(orden) {
  return escapeHtml([orden.vehiculo, orden.tamanoNombre].filter(Boolean).join(' · '));
}

export function etiquetasServicios(orden) {
  return orden.servicios.map(s => `<li class="etiqueta-servicio">${escapeHtml(s)}</li>`).join('');
}

export function vacio(texto, enlace = '') {
  return `<div class="vacio"><p>${escapeHtml(texto)}</p>${enlace}</div>`;
}
