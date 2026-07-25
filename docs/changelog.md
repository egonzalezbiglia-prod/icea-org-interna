# Changelog

Este archivo registra cambios importantes. No reemplaza Git ni debe incluir cada detalle menor.

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
