# Spec base - Grilla de turnos

Estado inicial documentado: 2026-07-24  
Última actualización: 2026-08-10

## Estado

En desarrollo operativo.

## Objetivo

Organizar posiciones del salón por día y horario, asignando servidores según disponibilidad real, carga ya asignada y restricciones configurables por equipo.

## Usuarios afectados

- Servidores que consultan sus turnos.
- Admins que cargan y ajustan la grilla.
- Master que gestiona equipos.

## Alcance funcional

Incluye:

- Lectura pública de la grilla para cualquier persona que accede por la app.
- Acceso admin con clave compartida.
- Alta, edición, activación, desactivación y eliminación de servidores.
- Nombre completo, WhatsApp, país, estado activo/inactivo y rangos de disponibilidad por día.
- Importación de servidores desde Excel/CSV.
- Descarga de modelo Excel de importación.
- Alta, edición y eliminación de horarios.
- Objetivo ideal y mínimo de cobertura por horario.
- Alta, edición y eliminación de posiciones.
- Asignación y desasignación por posición/turno.
- Vaciar todas las asignaciones de un turno desde la grilla.
- Alertas por disponibilidad parcial, servidor inactivo y turnos consecutivos.
- Bloqueo opcional de tercera asignación consecutiva.
- Bloqueo opcional de doble posición en un mismo turno.
- Sugerencia priorizada de servidores.
- Reporte de cobertura por turno con exportación.
- Plano PNG y nota visible por equipo.

No incluye:

- Login individual.
- Observaciones privadas por servidor.
- Mensajería automática por WhatsApp.
- Storage dedicado para imágenes.

## Reglas principales

- Los servidores cargan rangos libres por día.
- La disponibilidad no necesita coincidir exactamente con los turnos.
- Un servidor aparece como opción normal si cubre todo el turno.
- Un servidor aparece como opción parcial si la regla del equipo lo permite.
- Si no tiene disponibilidad para ese día o turno, no aparece.
- Si está inactivo, no aparece para nuevas asignaciones.
- Si ya estaba asignado y luego queda inactivo, la celda se marca como riesgo.
- Un servidor no puede estar en más de una posición del mismo turno si `preventSameSlotDuplicate` está activo.
- Dos turnos son consecutivos si el fin de uno coincide con el inicio del otro, dentro del mismo día.
- `maxConsecutiveShifts` define el máximo tolerado.
- `blockAfterMaxConsecutive` bloquea opciones que exceden ese máximo.

## Priorización del desplegable

Las opciones se ordenan así:

1. Servidores activos con disponibilidad completa.
2. Menos horas disponibles totales.
3. Menor porcentaje ocupado sobre disponible.
4. Menor cantidad de horas ocupadas.
5. Menor cantidad de turnos asignados.
6. Orden alfabético.
7. Servidores con disponibilidad parcial al final.

## Criterios de aceptación

- La home muestra solo equipos activos.
- La grilla pública carga datos del equipo seleccionado.
- El admin puede modificar solo el equipo indicado por `teamId`.
- La grilla exige clave admin para escribir asignaciones.
- Las opciones respetan disponibilidad, duplicados y consecutivos.
- La desasignación no revive datos históricos por fallback.
- La importación agrega nuevos servidores y omite duplicados por celular o nombre normalizado.
- El reporte de cobertura usa los objetivos ideal y mínimo de cada horario.
- El modo claro/oscuro no altera datos.
