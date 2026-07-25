# Producto

Estado inicial documentado: 2026-07-25  
Última actualización: 2026-07-25

## Nombre del producto

ICEA 2026 - Grilla de turnos por equipo

## Descripción corta

Aplicación web para consultar y administrar grillas de turnos del congreso ICEA 2026, separadas por equipo.

## Problema que resuelve

- Cada equipo necesita cubrir posiciones por día y horario.
- Los servidores necesitan consultar rápido sus turnos desde el celular.
- Los admins necesitan modificar asignaciones, horarios, posiciones y reglas sin tocar código.
- La información debe estar actualizada para todos los que acceden al link.

## Usuarios principales

- Servidores: consultan turnos y posiciones.
- Admins de equipo: gestionan servidores, horarios, posiciones, plano y reglas.
- Master: crea y edita equipos independientes.

## Alcance actual

Incluye:

- Home de selección de equipo.
- Grilla pública por equipo.
- Admin por equipo con clave común.
- Panel Master para crear y editar equipos.
- Reglas configurables por equipo.
- Firestore separado por equipo.

No incluye por ahora:

- Autenticación por usuario individual.
- Auditoría detallada por admin.
- Notificaciones automáticas.
- Importación/exportación masiva.

## Principios del producto

- Mobile-first para consulta y cambios rápidos.
- Separación real entre equipos.
- Un solo código reutilizable para todos los equipos.
- Admin simple, rápido y con baja fricción.
- Diseño sobrio, cálido y alineado a identidad ICEA.
