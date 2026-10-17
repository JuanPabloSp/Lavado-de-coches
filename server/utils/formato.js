const formatoPY = new Intl.NumberFormat('es-PY');

/** 30000 → "Gs. 30.000". Solo para mensajes; los importes viajan como enteros. */
function formatGs(importe) {
  return `Gs. ${formatoPY.format(importe)}`;
}

/**
 * Matrícula como clave: mayúsculas y sin espacios ni guiones. Así "abcd 123",
 * "ABCD-123" y "ABCD123" son el mismo vehículo para el control de órdenes
 * duplicadas.
 */
function normalizarMatricula(matricula) {
  return String(matricula || '').toUpperCase().replace(/[^A-Z0-9Ñ]/g, '');
}

module.exports = { formatGs, normalizarMatricula };
