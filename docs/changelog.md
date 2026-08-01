# Changelog

Este archivo registra cambios importantes. No reemplaza Git ni debe incluir cada detalle menor.

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
