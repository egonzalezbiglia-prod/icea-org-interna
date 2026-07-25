# Reglas de negocio

Estado inicial documentado: 2026-07-25  
Última actualización: 2026-07-25

## Separación por equipo

Cada equipo tiene datos independientes:

- Servidores.
- Horarios.
- Posiciones.
- Asignaciones.
- Plano.
- Reglas.

La app debe reutilizar el mismo código, pero nunca mezclar datos entre equipos.

## Disponibilidad

- Cada servidor declara rangos libres por día.
- La disponibilidad no está atada a turnos exactos.
- Un servidor aparece en un desplegable si tiene disponibilidad completa o parcial, según reglas del equipo.
- Si no tiene disponibilidad para el día/turno, no debe aparecer.

## Turnos consecutivos

Configurable por equipo:

- `maxConsecutiveShifts`: cantidad máxima de turnos consecutivos.
- `blockAfterMaxConsecutive`: si está activo, bloquea opciones que superan el máximo.

Default actual:

- Máximo 2 turnos consecutivos.
- Bloquea el tercero.

## Disponibilidad parcial

Configurable por equipo:

- `allowPartialAvailability`: permite seleccionar personas con cobertura parcial.
- `warnPartialAvailability`: muestra alerta visual en celda si la disponibilidad es parcial.

La alerta indica si falta cobertura al inicio, al final o en ambos lados del turno.

## Duplicados en mismo turno

Configurable por equipo:

- `preventSameSlotDuplicate`: evita que una persona cubra más de una posición en el mismo turno.

## Priorización del desplegable

Las opciones se ordenan para sugerir primero:

- Personas con disponibilidad completa antes que parcial.
- Personas con menor disponibilidad total.
- Personas con menor porcentaje ocupado.
- Personas con menos horas/turnos asignados.
- Orden alfabético como desempate.

## Servidores activos/inactivos

- Un servidor inactivo no debe aparecer como opción nueva.
- Si ya estaba asignado, la celda debe marcarse como riesgo.
