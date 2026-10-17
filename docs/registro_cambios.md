# Registro de cambios — Lavadero

## 1. Primera versión: plazas, vehículos fuera y cobro con la estética del comandero (18/10/2026)

* **Qué es:** un programa local para un lavadero de autos en Paraguay que se usa desde un solo dispositivo. Tiene dos pantallas:
  * **Plazas**: las 2 zonas de trabajo, con el vehículo que se está lavando, el tiempo previsto y las acciones *Terminado*, *Cobrar* y *Devolver a la cola*.
  * **Fuera**: la cola de espera y los vehículos listos para retirar.
* **Nuevo vehículo:** matrícula, modelo, tamaño (auto, SUV o camioneta), servicios con su precio según el tamaño, cliente y notas. Se puede guardar en la cola o guardar y cobrar en el momento.
* **Cobro, al dejar el vehículo o al retirarlo:**
  * Se cobra una sola vez.
  * Para entregar un vehículo tiene que estar pagado.
  * «Cobrar y entregar» hace las dos cosas en una sola transacción.
  * Métodos: efectivo, tarjeta, QR y transferencia.
* **Pantalla de cobro** copiada del modal del TPV del comandero (entrada 115 de su registro):
  * Tres cajas de importe (A cobrar / Entregado / Vuelto o **Faltan**).
  * Billetes en guaraníes que **suman**, teclado siempre visible con tecla `000` y **Exacto**.
  * El modal de **vuelto a devolver**.
  * Cambios respecto al original:
    * Todo va en clases CSS, con variante clara.
    * La cifra se ajusta al ancho real de su caja (unidades `cqi`), porque las cifras en guaraníes son el doble de largas.
    * El aviso de cobro sale después del vuelto, para no tapar la cifra.
* **Errores del comandero evitados desde el diseño:**
  * Importes enteros (`CHECK typeof='integer'`).
  * El estado de la plaza se deriva de las órdenes, con índice único parcial.
  * El precio lo pone siempre el servidor.
  * `nullish()` en los campos opcionales.
  * Solo migraciones (sin `schema.sql`) y la guarda «código más viejo que la BD».
  * Fábricas `abrirBaseDatos` / `createApp`, para que los tests usen BD en memoria.
  * Contador de ventas dentro de la transacción y sin borrado de ventas.
  * El contenedor de avisos se crea bajo demanda y el texto va con `textContent`.
  * `escapeHtml` en todo dato interpolado.
  * Listeners delegados.
  * Solo se sirve `public/`.
  * El servidor escucha solo en `127.0.0.1`.
* **Tests:** 31 en verde (estados, migraciones y flujo completo por API).
* **Verificado en el navegador** (tema oscuro y claro), con una BD de prueba que luego se borró:
  * Alta con validación.
  * Nota con `<img onerror>`, que se muestra como texto.
  * Cobro en efectivo con +50.000 +50.000 +10.000, que da un vuelto de 5.000.
  * Meter en plaza, «meter siguiente», terminado, entregar, y cobrar y entregar con tarjeta.
  * Sin errores en consola.
* **Precios de ejemplo** en `server/db/seed.js`: hay que ajustarlos a la lista real.

## 2. Colores de la pantalla de kiosko del TPV (18/10/2026)

* **Qué cambia:** el tema por defecto pasa a ser el **kiosko** del TPV del comandero (`tpv.html`). Usa estos colores:
  * Fondo gris `#eef0f3`.
  * Tarjetas blancas con borde `#d1d5db`.
  * Textos `#111827` / `#374151` / `#6b7280`.
  * Cabecera en pizarra `#1e293b`, como la barra superior y la lateral del TPV.
  * Acento naranja `#E94D1B`.
* **El cobro sigue en cristal oscuro**, como en el TPV, aunque la pantalla de detrás sea clara. Lo consiguen unos tokens oscuros acotados a `.cobro-card`.
* El tema oscuro se mantiene como alternativa con el botón de la cabecera.
* La preferencia se guarda en una clave nueva (`lavadero_tema`), para que una elección anterior del tema oscuro no tape el nuevo tema por defecto.

## 3. Datos de demostración y autocompletado de marca, modelo y color (18/10/2026)

* **`npm run demo`** (`server/scripts/demo.js`): carga 10 vehículos ficticios con matrículas paraguayas y arranca el servidor con ellos.
  * Los vehículos quedan repartidos así: 2 en plazas, 5 en espera y 3 listos para retirar, unos cobrados y otros no, y con tiempos de espera realistas.
  * Usa `data/demo.db`, que se borra y se vuelve a crear en cada ejecución. **Nunca toca `data/lavadero.db`.**
* **Autocompletado en «Vehículo»** (`components/autocompletarVehiculo.js` + `utils/sugerencias.js`):
  * Propone la marca, luego sus modelos y luego el color.
  * También acierta un modelo sin escribir la marca: «corol» propone Toyota Corolla.
  * No distingue mayúsculas ni tildes.
  * Teclado: ↑/↓ para moverse, Enter o Tab para aceptar, Escape para cerrar. Enter no envía el formulario mientras hay sugerencias abiertas.
  * Elegir el modelo **marca el tamaño** que le corresponde (Frontier → Camioneta). Se puede cambiar a mano.
  * El campo sigue siendo texto libre.
* **Catálogo local** en `public/js/datos/vehiculos.js`: 36 marcas habituales en Paraguay, sus modelos con su tamaño, y colores. Se amplía a mano. Es la base para añadir después los logos.
