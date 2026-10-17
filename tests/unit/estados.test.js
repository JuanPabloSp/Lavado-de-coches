const { puedePasar, TRANSICIONES, ABIERTOS } = require('../../server/domain/estados');

describe('ciclo de vida de una orden', () => {
  test('el camino normal es espera → lavando → listo → entregada', () => {
    expect(puedePasar('en_espera', 'lavando')).toBe(true);
    expect(puedePasar('lavando', 'listo')).toBe(true);
    expect(puedePasar('listo', 'entregada')).toBe(true);
  });

  test('un lavado se puede devolver a la cola, pero no saltarse pasos', () => {
    expect(puedePasar('lavando', 'en_espera')).toBe(true);
    expect(puedePasar('en_espera', 'listo')).toBe(false);
    expect(puedePasar('en_espera', 'entregada')).toBe(false);
    expect(puedePasar('lavando', 'entregada')).toBe(false);
  });

  test('entregada y cancelada son finales', () => {
    for (const destino of Object.keys(TRANSICIONES)) {
      expect(puedePasar('entregada', destino)).toBe(false);
      expect(puedePasar('cancelada', destino)).toBe(false);
    }
  });

  test('un estado desconocido no pasa a ningún sitio', () => {
    expect(puedePasar('inventado', 'lavando')).toBe(false);
  });

  test('los estados abiertos son los que siguen en el lavadero', () => {
    expect(ABIERTOS).toEqual(['en_espera', 'lavando', 'listo']);
  });
});
