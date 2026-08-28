# Aplicación de Gestión Integral — Alexis Jofré Mantenimiento Integral

Quiero crear una aplicación web profesional, moderna, responsive y totalmente funcional para gestionar mi empresa de **mantenimiento integral** (electricidad, plomería, durlock, pintura, albañilería, reparaciones y mantenimiento general).

Se te proporcionan **6 imágenes de referencia y 1 PDF real de un presupuesto**. Cada una cumple un rol distinto — leé la sección "Cómo usar cada referencia" antes de diseñar nada.

---

## 0. CÓMO USAR CADA REFERENCIA (IMPORTANTE — LEER PRIMERO)

Las referencias NO son todas del mismo tipo. Se dividen en dos grupos:

### Grupo A — Identidad de marca real (usar tal cual, es mi negocio)
- **Logo "Alexis Jofré — Mantenimiento Integral"** (imagen 4): usar este logo y este nombre en toda la app (encabezados, presupuestos, configuración).
- **Mockup de 12 pantallas** (imagen 3): esta es la referencia **principal de diseño visual y de producto**. Ya está adaptada a mi rubro (dashboard, clientes, presupuestos por tipo de trabajo —electricidad/durlock/gas/pintura/remodelación—, obras, cobros, agenda, configuración). Replicar su estética: **fondo y sidebar oscuros (azul marino/negro)**, tarjetas oscuras con acentos en azul, tipografía limpia tipo SaaS.
- **PDF de presupuesto real** (Martín Colucci / Pía Leiva): es un presupuesto que efectivamente uso. Tomar de acá la **estructura de datos y campos reales**: datos del emisor (nombre, teléfono, email, ciudad), tabla de cantidad/descripción/precio unitario/total, desglose de subtotal en **Efectivo + Canje**, condiciones de pago al pie, validez de 15 días hábiles.

### Grupo B — Referencia de estructura únicamente (rubro distinto, no copiar su identidad)
- **Modal "Nuevo Cliente y Perro"** (imagen 1) y **ficha de mascota "Abelito"** (imagen 2): son de una app de peluquería canina. Usar **solo la estructura**: modal de alta rápida con campos esenciales arriba, ficha de detalle con foto/avatar, datos clave en tarjetas, sección de bitácora cronológica con formulario de "nueva entrada" abajo. **No usar su paleta morada/violeta clara** — adaptar esa misma estructura a la paleta oscura/azul del Grupo A.
- **Modal "Nuevo Proveedor"** (imagen 5): mismo caso — usar solo la disposición de campos (nombre, rubro, teléfono/email en fila, dirección, notas internas, botón guardar ancho), no su color.

**Regla de color final**: toda la app sigue la paleta oscura/azul de la imagen 3 (marca real). Las imágenes 1, 2 y 5 solo aportan layout de formularios y fichas, reconstruidos con esa paleta oscura.

---

## 1. DISEÑO GENERAL

Identidad visual (basada en imagen 3 y logo):

- Sidebar y fondos de paneles principales en **tonos oscuros** (azul marino/negro tipo `#0F1729` – `#1A2540`).
- Acentos en **azul brillante** para botones primarios, gráficos y estados activos.
- Tarjetas oscuras con bordes sutiles y buen contraste tipográfico (texto blanco/gris claro).
- Colores de estado consistentes: verde (pagado/aceptado/finalizado), amarillo/naranja (pendiente), rojo (vencido/cancelado), azul (en curso).
- Modales y formularios (inspirados en imágenes 1, 2 y 5) pero re-skinados en oscuro: inputs con fondo gris azulado oscuro, bordes redondeados, botón principal azul sólido ancho.

Debe tener: menú lateral fijo, dashboard, tarjetas informativas, tablas profesionales, buscadores, filtros, formularios, modales, botones de acción claros, diseño responsive (compu/tablet/celular).

---

## 2. MENÚ PRINCIPAL

Basado en el sidebar real de la imagen 3, con las secciones adicionales del alcance funcional:

1. Inicio (Dashboard)
2. Agenda
3. Clientes
4. Presupuestos
5. Obras *(nombre real usado en la imagen 3 — no "Trabajos")*
6. Cobros *(incluye Ingresos y Egresos, ver sección 9)*
7. Stock (Productos y Servicios)
8. Proveedores
9. Técnicos
10. Estadísticas / Reportes
11. Configuración

> Nota de naming: en toda la app usar **"Obras"** en lugar de "Trabajos/Servicios", y **"Cobros"** como sección madre que contiene Ingresos y Egresos como pestañas — así queda alineado con el mockup real (imagen 3) en vez de tener nombres duplicados o contradictorios.

---

## 3. DASHBOARD (INICIO)

Replicar la estructura del panel 1 de la imagen 3: saludo personalizado ("Hola, Alexis"), tarjetas resumen arriba (Presupuestos del mes, Obras en curso, Cobros pendientes, Obras finalizadas), gráfico de barras de facturación vs. cobrado, lista de próximos eventos de agenda.

Además, ampliar con:

**Indicadores principales**
- Ingresos y egresos del período, ganancia.
- Presupuestos pendientes / aceptados.
- Clientes activos, proveedores.
- Productos con stock bajo.

**Gráficos**
- Ingresos/egresos por período, ganancia, evolución de obras realizadas, presupuestos aceptados vs. rechazados.

**Selector de período**: Hoy / Esta semana / Este mes / Mes anterior / Este año / Personalizado.

---

## 4. CLIENTES

**Listado** (estructura del panel 2 de la imagen 3, con buscador arriba y botón "+ Nuevo Cliente"):
nombre, empresa, teléfono, dirección, último presupuesto/obra, estado — con ícono de WhatsApp junto al teléfono (abre WhatsApp con ese número) e ícono de Google Maps junto a la dirección (abre Maps con esa dirección).

**Modal "Nuevo Cliente"** (estructura de imagen 1, re-skinado oscuro, adaptado de "dueño y perro" a solo datos de cliente):
Nombre completo, Empresa, DNI, CUIT, Teléfono, WhatsApp, Email, Dirección (con ícono de mapa), Localidad, Provincia, Notas.

**Ficha del cliente** (estructura del panel 3, combinada con la lógica de bitácora de imagen 2):
- Encabezado: nombre, empresa, DNI/CUIT, teléfono, WhatsApp, email, dirección con botón Maps, fecha de alta, estado.
- Pestañas: Resumen / Presupuestos / Obras / Cobros / Notas (igual que panel 3).
- Información económica: total facturado, pagado, pendiente, cantidad de presupuestos, aceptados, obras realizadas.
- **Bitácora** (adaptando el bloque de "Bitácora de Lavado y Cortes" de imagen 2 a mantenimiento): formulario para registrar nueva entrada (fecha + descripción + adjuntar foto opcional) y debajo el historial cronológico editable. Tipos de entrada: visita técnica, llamada, WhatsApp, pago, presupuesto enviado, cambio de estado de obra, nota manual.
- Botón "Eliminar ficha completa" con confirmación (como en imagen 2), con estilo de alerta (rojo).

---

## 5. PRESUPUESTOS

Listado con buscador, filtros y estados: Borrador, Enviado, Pendiente, Aceptado, Rechazado, Vencido, Convertido en obra.

**Nuevo presupuesto** (flujo de 3 pasos igual al panel 4 de la imagen 3):
1. Seleccionar cliente (existente o nuevo) y tipo de trabajo (Electricidad, Durlock, Gas, Pintura, Remodelación, Otro — como en panel 4).
2. Detalle: según el panel 5 (ejemplo "Presupuesto Electricidad"), permitir agregar ítems con cantidad editable por campo (bocas de luz, tomas, llaves térmicas, disyuntores, metros de caño/cable, etc. — catálogo configurable por tipo de trabajo) y también productos/servicios/mano de obra/materiales sueltos con: descripción, cantidad, precio unitario, descuento, subtotal.
3. Resumen (panel 6): tabla final con cantidad, descripción, precio unitario, total por ítem, y total general — igual a la estructura del PDF real (columnas: Cantidad, Descripción, Precio por unidad, Total).

**Cálculo automático**: subtotal, descuentos, impuestos si corresponde, total.

**Formas de pago del desglose final** (tomado del PDF real, no solo lo genérico): permitir dividir el total en **Efectivo + Canje**, además de Transferencia, Tarjeta y Mercado Pago como formas configurables.

**Vista previa / PDF** (panel 7): documento con logo real de Alexis Jofré, datos del emisor (nombre, ciudad, teléfono, email — igual al PDF real), datos del cliente, tabla de ítems, subtotal y desglose de forma de pago, condiciones ("Presupuesto de acuerdo con render recibido, válido por 15 días hábiles. No incluye materiales" como texto editable de ejemplo), firma. Usar formato de moneda argentino (`$1.234.567`, punto como separador de miles, sin decimales).

Botones: Guardar, Enviar (WhatsApp), Generar/Descargar PDF, Imprimir, Editar, Duplicar.

Al aceptar un presupuesto → convertir directamente en Obra.

---

## 6. OBRAS

(Antes llamado "Trabajos" — usar "Obras" en toda la app, según imagen 3)

Listado con buscador y botón "+ Nueva Obra" (panel 8). Cada obra: número, cliente, dirección, teléfono, tipo de trabajo, descripción, técnico asignado, fecha, hora, estado, materiales, mano de obra, presupuesto asociado, importe, forma de pago, observaciones.

Estados: Pendiente, Programado, En proceso, Pausado, Finalizado, Cancelado.

**Detalle de obra** (panel 9): pestañas Resumen / Fotos / Notas / Materiales / Pagos, barra de progreso (%), total presupuesto / pagado / pendiente, y **bitácora automática** (creación, cambios de estado, materiales agregados, pagos, visitas, observaciones) con misma lógica cronológica que la ficha de cliente.

---

## 7. COBROS (Ingresos y Egresos)

Sección única "Cobros" (panel 10) con dos pestañas internas:

**Ingresos**: registrar cobros de obras, presupuestos, anticipos, venta de productos. Campos: fecha, cliente, concepto, obra/presupuesto asociado, importe, forma de pago (efectivo, transferencia, tarjeta, Mercado Pago, canje, otro), observaciones. Totales por día/semana/mes/año.

**Egresos**: compra de materiales, pago a proveedores, combustible, herramientas, gastos administrativos, sueldos. Campos: fecha, proveedor, categoría, concepto, importe, forma de pago, comprobante (adjuntar imagen/PDF), observaciones.

Botón "+ Nuevo Cobro" (como en panel 10).

---

## 8. STOCK

Dos catálogos independientes:

**Productos**: código, código de barras, nombre, categoría, marca, descripción, proveedor, costo, precio de venta, stock actual, stock mínimo, unidad de medida, ubicación, estado. Alta/edición/eliminación/búsqueda/filtros/ajuste de stock. Alerta visual de stock bajo.

**Servicios** (catálogo usado en presupuestos y obras): nombre, categoría (electricidad, plomería, durlock, pintura, albañilería, mantenimiento general, instalaciones), descripción, precio base, unidad, duración estimada, costo de mano de obra, estado.

Al usar un producto en una obra, descontar automáticamente del stock.

---

## 9. PROVEEDORES

Listado + botón "+ Nuevo Proveedor".

**Modal "Nuevo Proveedor"** (estructura exacta de imagen 5, re-skinado oscuro): Nombre, Rubro, Teléfono, Email (en fila), Dirección, Notas internas — agregar además WhatsApp, CUIT y Contacto (no están en la imagen pero sí en el alcance funcional).

**Ficha del proveedor**: información general, contacto, productos comprados, historial de compras, pagos, saldos, presupuestos/cotizaciones recibidas, y una sección amplia de **notas internas editables** (precios de materiales, condiciones de pago, descuentos, días de entrega, qué conviene comprarle).

---

## 10. AGENDA

Vista mensual (calendario) y vista diaria (horario con cliente, dirección, obra, técnico, estado, duración) — igual a panel 11 de la imagen 3, con botón flotante "+" para nuevo evento.

Alta de evento: cliente, obra, servicio, técnico, fecha, hora, duración, dirección, notas. Clic en evento → abre su ficha. Vinculada con clientes, obras y presupuestos.

---

## 11. TÉCNICOS

Nombre, apellido, DNI, teléfono, especialidad (electricidad, plomería, durlock, pintura, albañilería, mantenimiento, otras), email, estado, notas. Asignables a obras y eventos de agenda.

---

## 12. CATEGORÍAS Y FORMAS DE PAGO (configurables)

Categorías administrables para: productos, servicios, gastos, ingresos, proveedores, obras.

Formas de pago administrables: Efectivo, Transferencia, Tarjeta, Mercado Pago, **Canje** (usado realmente en mis presupuestos, ver PDF), Cuenta corriente, Otro.

---

## 13. BUSCADOR GLOBAL

Buscador único para clientes, proveedores, presupuestos, obras, productos, servicios — resultados agrupados por tipo.

---

## 14. RELACIÓN ENTRE MÓDULOS

- Cliente → Presupuesto → Obra → Agenda → Cobro → Historial del cliente.
- Proveedor → Compra → Producto → Stock → Egreso.
- Un pago registrado en Cobros se refleja automáticamente en: ficha del cliente, obra, presupuesto y dashboard.
- Un producto usado en una obra descuenta automáticamente del stock.

---

## 15. FICHA Y BITÁCORA UNIVERSAL

Clientes, proveedores y obras comparten la misma lógica de ficha: visualizar, editar, agregar notas, ver historial, registrar actividad, ver información relacionada. Cada entrada de bitácora muestra **fecha + hora + tipo + descripción + usuario**, en orden cronológico (más reciente arriba), con formulario simple de carga rápida abajo o arriba del historial (como en la ficha de "Abelito").

---

## 16. CONFIGURACIÓN

Panel 12 de la imagen 3 como base: Datos de la empresa (usar el logo y datos reales: Alexis Jofré, Mantenimiento Integral, Ciudad de Mendoza, teléfono, email), Valores y precios, Plantillas de presupuesto, Impuestos, Métodos de pago, Usuarios, Copia de seguridad, Cerrar sesión.

Agregar además (del alcance funcional original): numeración de presupuestos/obras, categorías, permisos.

Los datos de la empresa deben aparecer automáticamente en presupuestos y documentos generados (igual que en el PDF real).

---

## 17. NOTIFICACIONES Y ALERTAS

Stock bajo, presupuestos próximos a vencer, obras pendientes, pagos pendientes, saldos de clientes y proveedores pendientes, obras programadas para hoy.

---

## 18. RESPONSIVE

Debe funcionar en compu, notebook, tablet y celular. En celular, tablas → tarjetas apiladas. Los botones de WhatsApp y Google Maps deben abrir la app nativa correspondiente en móvil.

---

## 19. DATOS Y PERSISTENCIA

Todos los datos deben persistir realmente (no solo visual/mock): clientes, proveedores, productos, servicios, stock, presupuestos, obras, agenda, cobros (ingresos/egresos), técnicos, bitácoras, notas. Arquitectura de datos organizada y escalable.

---

## 20. REPORTES / ESTADÍSTICAS

Sección "Estadísticas" (nombre real del sidebar en imagen 3): ingresos, egresos, ganancias, obras, servicios más realizados, productos más utilizados, clientes con mayor facturación, proveedores, stock, presupuestos aceptados/rechazados. Filtros por período.

---

## 21. LIBERTAD DE DISEÑO DONDE NO HAY REFERENCIA

Las siguientes secciones **no tienen imagen de referencia directa**: Stock (parte de Servicios), Técnicos, Categorías, Notificaciones, Reportes detallados, Configuración de usuarios/permisos. Para estas, usar criterio propio de diseño, manteniendo coherencia total con la paleta oscura/azul y el lenguaje visual de tarjetas/tablas ya establecido en el resto de la app (imagen 3). No es necesario inventar una referencia — sí es obligatorio mantener consistencia visual con el resto.

---

## 22. REGLA FUNDAMENTAL

El resultado debe sentirse como un **ERP/CRM profesional real para "Alexis Jofré — Mantenimiento Integral"**, con la estética oscura y de marca de la imagen 3 como base visual principal, la lógica de fichas/bitácora de las imágenes 1 y 2 adaptada al rubro, la estructura de formularios de la imagen 5, y el formato de presupuesto real reflejado en el PDF adjunto. Toda la gestión del negocio (Clientes + Proveedores + Presupuestos + Obras + Agenda + Stock + Cobros + Dashboard + Bitácora) debe poder realizarse desde esta única aplicación.
