/**
 * Crea un Error con `.status` HTTP explícito (copiado del comandero). Distingue
 * un rechazo de NEGOCIO esperado (plaza ocupada, orden ya cobrada...) de un
 * fallo INESPERADO: solo el primero responde 400/404/409 con su mensaje; el
 * segundo responde 500 sin exponer detalles (ver el manejador en app.js).
 */
function businessError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { businessError };
