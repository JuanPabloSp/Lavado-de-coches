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
