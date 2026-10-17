/**
 * Acciones compartidas por las vistas. Cada una llama a la API, enseña el
 * resultado en un aviso (también los errores: nada falla en silencio) y vuelve
 * a leer el estado del servidor.
 */
import api from './api.js';
import store from './store.js';
import { showToast } from './components/toast.js';
import { abrirCobro } from './components/cobroModal.js';
import { pedirConfirmacion } from './components/modal.js';

/**
 * @param {HTMLButtonElement|null} boton  se desactiva mientras dura la llamada
 *        (evita el doble toque, que en el comandero llegó a sumar dos unidades)
 */
export async function ejecutar(boton, llamada, mensajeOk) {
  if (boton) boton.disabled = true;
  try {
    await llamada();
    if (mensajeOk) showToast(mensajeOk, 'success');
  } catch (err) {
    showToast(err.message, 'error', 5000);
  } finally {
    await store.recargar().catch(() => {});
    if (boton?.isConnected) boton.disabled = false;
  }
}

export async function cobrar(orden, opciones) {
  const resultado = await abrirCobro(orden, opciones);
  if (resultado) await store.recargar().catch(() => {});
  return resultado;
}

export async function cancelar(orden) {
  const { confirmado, motivo } = await pedirConfirmacion({
    titulo: `Cancelar la orden de ${orden.matricula}`,
    mensaje: 'El vehículo sale de la lista sin cobrarse. No se puede deshacer.',
    textoConfirmar: 'Cancelar orden',
    peligro: true,
    conMotivo: true
  });
  if (!confirmado) return;
  await ejecutar(null, () => api.cancelar(orden.id, motivo), `Orden de ${orden.matricula} cancelada`);
}

/** Lee el id numérico de un botón con data-id y busca su orden. */
export function ordenDeBoton(boton) {
  return store.orden(Number(boton.dataset.id));
}
