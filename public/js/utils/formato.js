const formatoPY = new Intl.NumberFormat('es-PY');

/** 30000 → "Gs. 30.000". Los importes son siempre enteros (no hay céntimos). */
export function formatGs(importe) {
  return `Gs. ${formatoPY.format(Math.round(Number(importe) || 0))}`;
}

/** 30000 → "30.000", para los botones de billetes. */
export function formatMiles(importe) {
  return formatoPY.format(importe);
}

/** Minutos enteros transcurridos desde un instante (epoch ms). */
export function minutosDesde(instante, ahora = Date.now()) {
  if (!instante) return 0;
  return Math.max(0, Math.floor((ahora - instante) / 60000));
}

/** 5 → "5 min", 70 → "1 h 10 min". */
export function textoMinutos(minutos) {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export const METODOS_PAGO = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  qr: 'QR',
  transferencia: 'Transferencia'
};
