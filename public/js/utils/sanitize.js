/**
 * Escapado de HTML para datos escritos por personas (matrícula, notas, nombre
 * del cliente...) que se interpolan en template literals para innerHTML.
 * Copiado del comandero (js/utils/sanitize.js): sin esto, una nota como
 * `<img src=x onerror=...>` se ejecutaría al pintarla. Cubre también el
 * contexto de atributo (`value="${...}"`).
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
