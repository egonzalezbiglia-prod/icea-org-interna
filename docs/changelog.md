# Changelog

Este archivo registra cambios importantes. No reemplaza Git ni debe incluir cada detalle menor.

## 2026-08-13 · Asignaciones de grilla de bajo costo

### Técnico

- La validación de una persona por turno pasó de consultar todos los puestos del horario a usar una reserva única `slotId + serverId` dentro de una transacción.
- Se agregó el comando `pnpm rebuild:reservations {teamId}` para migrar asignaciones existentes y se limpian las reservas al eliminar servidor, horario o posición.

## 2026-08-13 · Vacíos destacados en grilla Admin

### UX

- Las celdas sin asignar se muestran con fondo rosa suave en modo Admin para ubicar faltantes de cobertura más rápido.

## 2026-08-13 · Protección de cambios pendientes en grilla

### Corrección

- La grilla evita abrir Admin, actualizar o cerrar/recargar sin aviso mientras una asignación está guardándose. Previene que una vista nueva lea el estado anterior antes de completarse el cambio.

## 2026-08-13 · Carga completa automática para Admin

### Corrección

- Al volver a la grilla con sesión Admin, se carga automáticamente el detalle de servidores antes de mostrar selectores. Evita que el snapshot público parezca una grilla sin asignaciones.

## 2026-08-11 · Actualización automática de grilla pública

### Técnico

- La grilla muestra el cache local de inmediato y consulta el snapshot público en segundo plano al entrar o volver a la pestaña. Se limita a una comprobación cada cinco minutos por navegador para evitar lecturas repetidas.

## 2026-08-11 · Búsqueda por persona seleccionada

### UX

- El buscador de grilla ahora muestra sugerencias de nombre completo y requiere seleccionar una persona antes de mostrar sus turnos. Evita mezclar asignaciones de nombres con coincidencias parciales.

## 2026-08-11 · Bloqueo de duplicados por turno

### Reglas de negocio

- La API rechaza que la misma persona quede asignada en dos puestos del mismo turno, incluso si la grilla del navegador estaba desactualizada.

## 2026-08-11 · Snapshot público de grilla

### Técnico

- La grilla pública pasó a leer un snapshot preparado en `teams/{teamId}/public/schedule` en vez de consultar todas las colecciones del equipo.
- El snapshot se actualiza al asignar, cambiar configuración, plano o datos de equipo; las asignaciones individuales se actualizan sin releer toda la grilla.
- El snapshot público excluye teléfonos, disponibilidad de servidores y el PNG del plano; este último se lee solo cuando se abre el modal. La vista Admin conserva la lectura completa.

## 2026-08-10 · Documentación sincronizada con repo actual

### Documentación

- README raíz actualizado para describir ICEA Org Interna como aplicación real, no como plantilla.
- `docs/README.md` actualizado como índice vivo de producto y fuente de verdad técnica.
- Producto, spec, roles, arquitectura, reglas, modelo de datos, UX, flujos, seguridad y roadmap sincronizados contra rutas, APIs, tipos, repositorios y componentes actuales.
- `AGENTS.md` y `CLAUDE.md` actualizados con stack, comandos, variables de entorno, estructura vigente y reglas de mantenimiento documental.

### Estado relevado

- App multi-equipo con Firestore bajo `teams/{teamId}` y fallback histórico para `organizacion-interna`.
- `GET /api/schedule` documentado con requisito de `teamId` y cliente permitido por header/cookie.
- Importación Excel/CSV, reporte de cobertura, objetivos ideal/mínimo por horario, plano PNG, fechas configurables e íconos por equipo documentados.

## 2026-07-25 · Rediseño «Programa de servicio»

### UX/UI

- Se agregó descarga de modelo Excel para importación de servidores.
- Se agregó importación de servidores desde Excel/CSV en el admin, agregando nuevos registros sin pisar existentes.
- Se alineó la alerta de celda junto al nombre/select para que en mobile no tape el servidor asignado.
- Nueva dirección visual: serif (Fraunces) para títulos y versículo, sans (Hanken Grotesk) para el cuerpo, y paleta pino/esmeralda/lima sobre papel cálido, en modo claro y oscuro.
- Grilla rediseñada como "tablero de servicio": horarios en columnas tabulares, franja del turno en curso ("ahora") resaltada en lima, puestos con nombre opcional o número, y alertas como puntos de color.
- Buscador con tarjeta "Tu servicio" del día activo, manteniendo la agenda de los demás días.
- Header de la grilla con solo Plano y Actualizar visibles; Inicio, Tema y Admin pasan a un menú "⋯".
- Home con versículo al pie y contador de equipos en lima.
- Admin por equipo con modo oscuro real: superficies de panel, header de tabla y pills de disponibilidad/estado pasan a tokens theme-aware (antes tenían fondos claros hardcodeados que se veían lavados en oscuro).
- Admin unificado con la grilla: header con menú "⋯" (Inicio · Grilla · Tema · Salir admin) en lugar de botones sueltos, y tabla de servidores con más aire y jerarquía (nombre prominente, teléfono secundario, hover de fila).

### Datos

- Se corrigió la desasignación de turnos para que no reaparezcan asignaciones históricas al actualizar.
- Se agrega el campo `icon` a `Team`, elegible desde un selector visual en Panel Master (fallback: inicial del nombre).
- Se agrega el campo `congressDates` a `Team` para editar fechas del congreso desde Panel Master.

### Técnico

- Nueva dependencia `xlsx` para leer planillas Excel desde el navegador.
- ESLint ahora ignora salidas generadas (`.next`, `out`, `dist`) y `next-env.d.ts` para que `pnpm lint` revise solo código fuente.
- Fuentes vía `next/font`: Fraunces + Hanken Grotesk (reemplazan Outfit + Figtree).
- `lib/domain.ts`: fechas por defecto del congreso (13/14/15-08-2026) y helpers `fechaCortaDia`/`slotEnCurso` ahora aceptan fechas configurables por equipo.
- Nuevo módulo `components/team-icon.tsx` (catálogo de íconos + glifo).

## 2026-07-25

### Producto

- Se convirtió la app en multi-equipo.
- Se agregó home para seleccionar equipo.
- Se agregaron equipos iniciales: Organización Interna y Técnica.
- Se agregó Panel Master para crear y gestionar equipos.

### Reglas de negocio

- Las reglas de asignación pasan a ser configurables por equipo.
- Se agregó menú Reglas en el admin de cada equipo.

### Datos

- Firestore pasa a estructura `teams/{teamId}/...`.
- Se mantiene fallback para datos antiguos de Organización Interna en colecciones root.

### UX/UI

- Se rediseñó la home inicial de equipos como bloque centrado con lista vertical y sin acceso directo para crear equipos.
- Se ajustó la home inicial a una pantalla oscura exclusiva con filas grandes e iconos por equipo.
- Se agregó botón Equipos/Home en grilla y admin para no depender del back del navegador.
- Admin mobile tiene menú hamburguesa para secciones.
- Admin mobile usa drawer lateral superpuesto para navegar secciones sin empujar contenido.
- Horarios en mobile compacta día, inicio y fin para reducir ancho excesivo de controles.
- Resultados de búsqueda se agrupan como agenda por día.
- Se agregó selector de modo claro/oscuro con preferencia local por dispositivo.
- Se implementó dark mode real en la grilla usando tokens `--grid-*` para celdas, encabezados y alertas.
- Se corrigió el contraste del header, botones, buscador y tabs en dark mode para evitar bandas claras aisladas.
- Se compactaron las filas de equipo en la home para reducir peso visual.

### Técnico

- Nuevas rutas: `/equipos/{teamId}`, `/equipos/{teamId}/admin`, `/master`.
- Nuevas APIs: `/api/master` y APIs existentes con `teamId`.

## Qué registrar

- Nuevas funcionalidades importantes.
- Cambios de permisos.
- Cambios de modelo de datos.
- Cambios en reglas de negocio.
- Migraciones.
- Cambios de UX relevantes.
- Decisiones técnicas que afecten el futuro.
