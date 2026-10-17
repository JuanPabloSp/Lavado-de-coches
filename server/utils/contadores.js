/**
 * Contadores que SOLO SUBEN, para numeraciones que no pueden repetirse nunca
 * (copiado del comandero, registro entrada 114).
 *
 * Sacar el número de `MAX(numero) + 1` hace que, si una fila desaparece, el
 * siguiente cobro reutilice su número. Un contador aparte no depende de qué
 * filas existan.
 *
 * IMPORTANTE: llamarlo SIEMPRE dentro de la transacción de la operación que
 * consume el número. Si se llama fuera, se puede reservar un número para una
 * operación que luego falle y dejar un hueco.
 */
function siguienteContador(db, nombre) {
  db.prepare('UPDATE contadores SET valor = valor + 1 WHERE nombre = ?').run(nombre);
  const fila = db.prepare('SELECT valor FROM contadores WHERE nombre = ?').get(nombre);
  if (!fila || !fila.valor) {
    // Los contadores los crea la migración 1. Si no están, la BD no arrancó
    // bien: mejor parar que emitir un cobro sin número fiable.
    const err = new Error(`No se pudo asignar el número de la serie "${nombre}". Avise al administrador.`);
    err.status = 500;
    throw err;
  }
  return fila.valor;
}

module.exports = { siguienteContador };
