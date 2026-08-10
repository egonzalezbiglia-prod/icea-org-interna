# Producto

Estado inicial documentado: 2026-07-25  
Última actualización: 2026-08-10

## Nombre

ICEA Org Interna

## Descripción corta

Aplicación web para consultar y administrar grillas de turnos del congreso ICEA 2026, separadas por equipo.

## Problema que resuelve

- Cada equipo necesita cubrir posiciones por día y horario.
- Los servidores necesitan consultar sus turnos rápido desde el celular.
- Los admins necesitan modificar asignaciones, horarios, posiciones, plano y reglas sin tocar código.
- La coordinación necesita información compartida y actualizada por link.

## Usuarios principales

- Servidores: consultan turnos, posiciones y plano.
- Admins de equipo: gestionan servidores, horarios, posiciones, reglas, plano y asignaciones.
- Master: crea y edita equipos independientes.

## Alcance vigente

Incluye:

- Home de selección de equipo en `/`.
- Grilla pública por equipo en `/equipos/{teamId}`.
- Modo admin de asignación dentro de la grilla.
- Admin por equipo en `/equipos/{teamId}/admin`.
- Panel master en `/master`.
- Firestore separado por equipo bajo `teams/{teamId}`.
- Reglas configurables por equipo.
- Fechas configurables del congreso por equipo.
- Íconos configurables por equipo.
- Plano PNG por equipo, guardado como URL o data URL validado.
- Importación de servidores desde `.xlsx`, `.xls` o `.csv`.
- Descarga de modelo Excel para importar servidores.
- Reporte de cobertura y descarga de sugerencia en Excel.
- Modo claro/oscuro persistido por dispositivo.

No incluye por ahora:

- Login por usuario individual.
- Roles personales con permisos granulares.
- Auditoría detallada por acción.
- Notificaciones automáticas.
- Subida de archivos a Firebase Storage.
- Tests automatizados.

## Principios del producto

- Mobile-first para consulta y cambios rápidos.
- Separación real entre equipos.
- Un solo código reutilizable para todos los equipos.
- Admin simple y de baja fricción.
- Diseño sobrio, cálido y alineado a identidad ICEA.
- Las reglas críticas se validan en servidor cuando afectan escritura.
