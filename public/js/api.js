/**
 * Cliente de la API. Todas las llamadas devuelven el JSON o lanzan un Error
 * con el mensaje del servidor, listo para enseñarlo en un aviso.
 */
async function pedir(metodo, url, cuerpo) {
  let res;
  try {
    res = await fetch(url, {
      method: metodo,
      headers: cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined
    });
  } catch {
    throw new Error('No hay conexión con el servidor del lavadero. ¿Está encendido?');
  }

  let datos = null;
  try { datos = await res.json(); } catch { /* respuesta sin cuerpo JSON */ }
  if (!res.ok) throw new Error(datos?.error || `El servidor respondió con un error (${res.status}).`);
  return datos;
}

const api = {
  estado: () => pedir('GET', '/api/estado'),
  catalogo: () => pedir('GET', '/api/catalogo'),
  crearOrden: (datos) => pedir('POST', '/api/ordenes', datos),
  iniciar: (ordenId, plazaId) => pedir('POST', `/api/ordenes/${ordenId}/iniciar`, { plazaId }),
  siguiente: (plazaId) => pedir('POST', `/api/plazas/${plazaId}/siguiente`),
  terminar: (ordenId) => pedir('POST', `/api/ordenes/${ordenId}/terminar`),
  devolver: (ordenId) => pedir('POST', `/api/ordenes/${ordenId}/devolver`),
  cancelar: (ordenId, motivo) => pedir('POST', `/api/ordenes/${ordenId}/cancelar`, { motivo }),
  entregar: (ordenId) => pedir('POST', `/api/ordenes/${ordenId}/entregar`),
  cobrar: (ordenId, datos) => pedir('POST', `/api/ordenes/${ordenId}/cobrar`, datos)
};

export default api;
