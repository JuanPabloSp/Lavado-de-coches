/**
 * Entrada para Vercel (función serverless). Vercel no tiene disco permanente,
 * así que aquí el programa corre en MODO DEMOSTRACIÓN: cada instancia arranca
 * con una BD en memoria y los datos ficticios de NogueraDetailing. Lo que se
 * haga se pierde cuando Vercel recicla la función (y dos instancias a la vez
 * no comparten datos). Para usarlo de verdad: `npm start` en el equipo del
 * local, o una base de datos externa.
 *
 * Los estáticos (public/) los sirve Vercel directamente; aquí solo llega /api/*
 * (ver vercel.json).
 */
const { abrirBaseDatos } = require('../server/db/database');
const { createApp } = require('../server/app');
const { cargarDemo } = require('../server/db/demo');

let app = null;

function obtenerApp() {
  if (!app) {
    const db = abrirBaseDatos(':memory:');
    cargarDemo(db);
    app = createApp(db, { demo: true });
  }
  return app;
}

module.exports = (req, res) => obtenerApp()(req, res);
