import api from './api.js';

/**
 * Estado compartido por las vistas: la foto del lavadero (/api/estado) y el
 * catálogo. Un solo dispositivo, así que no hay sincronización ni cola
 * offline: tras cada acción se vuelve a leer el estado del servidor, que es
 * la fuente de verdad.
 */
class Store {
  constructor() {
    this.estado = null;
    this.catalogo = null;
    this.online = true;
    this._subs = new Set();
  }

  on(fn) {
    this._subs.add(fn);
    return () => this._subs.delete(fn);
  }

  _emit() {
    for (const fn of this._subs) fn();
  }

  async cargarCatalogo() {
    this.catalogo = await api.catalogo();
  }

  async recargar() {
    try {
      this.estado = await api.estado();
      this.online = true;
    } catch (err) {
      this.online = false;
      this._emit();
      throw err;
    }
    this._emit();
  }

  /** Busca una orden abierta por id en la última foto del estado. */
  orden(id) {
    const e = this.estado;
    if (!e) return null;
    return [...e.espera, ...e.listos, ...e.plazas.map(p => p.orden).filter(Boolean)].find(o => o.id === id) || null;
  }
}

const store = new Store();
export default store;
