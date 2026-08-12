# Reglas de negocio

Estado inicial documentado: 2026-07-25  
Última actualización: 2026-08-10

## Separación por equipo

Cada equipo tiene datos independientes:

- Servidores.
- Horarios.
- Posiciones.
- Asignaciones.
- Plano.
- Reglas.
- Fechas del congreso.

La app reutiliza componentes y APIs, pero toda operación debe resolverse con `teamId`.

## Disponibilidad

- Cada servidor declara rangos libres por día.
- Los días válidos son `jueves`, `viernes` y `sabado`.
- Los horarios usan formato `HH:MM`.
- La disponibilidad puede cubrir todo el turno o cruzarse parcialmente.
- Sin cruce de disponibilidad, el servidor no aparece como opción.
- Si el equipo no permite disponibilidad parcial, los parciales no aparecen.

## Disponibilidad parcial

Configurable por equipo:

- `allowPartialAvailability`: permite seleccionar servidores con cobertura parcial.
- `warnPartialAvailability`: muestra alerta visual si el servidor asignado cubre solo parte del turno.

La alerta indica:

- `llega tarde` si falta cobertura al inicio.
- `se va antes` si falta cobertura al final.
- `parcial` si faltan ambos extremos.

## Turnos consecutivos

Configurable por equipo:

- `maxConsecutiveShifts`: máximo de turnos consecutivos.
- `blockAfterMaxConsecutive`: bloquea opciones que exceden el máximo.

Default:

- Máximo 2 turnos consecutivos.
- Bloquea el tercero.

Dos turnos son consecutivos si pertenecen al mismo día y el fin de uno coincide con el inicio del otro.

## Duplicados en mismo turno

Configurable por equipo:

- `preventSameSlotDuplicate`: evita que una persona cubra más de una posición en el mismo turno.
- La API valida la misma regla para impedir duplicados aunque la grilla del navegador estuviera desactualizada.

## Servidores activos/inactivos

- Un servidor inactivo no aparece como nueva opción.
- Si ya estaba asignado, sigue visible y la celda queda marcada como riesgo.
- Eliminar un servidor borra sus asignaciones del equipo.
- Para `organizacion-interna`, también se limpian asignaciones root históricas relacionadas.

## Horarios y posiciones

- Crear un horario sin `id` genera `dayId-HHMM`.
- Cada horario tiene cobertura ideal y mínima.
- La cobertura mínima no puede superar a la ideal.
- Eliminar un horario borra sus asignaciones del equipo.
- Crear una posición sin `id` usa el siguiente número disponible.
- Eliminar una posición borra sus asignaciones del equipo.

## Priorización de opciones

Las opciones del desplegable se ordenan para sugerir primero:

1. Disponibilidad completa.
2. Menor disponibilidad total.
3. Menor porcentaje ocupado sobre disponible.
4. Menos horas ocupadas.
5. Menos turnos asignados.
6. Nombre alfabético.
7. Disponibilidad parcial.

## Importación de servidores

- Formatos aceptados: `.xlsx`, `.xls`, `.csv`.
- Columnas esperadas: `Nombre completo`, `celular`, `franja jueves`, `franja viernes`, `franja sábado`.
- Se importan hasta 500 filas por payload.
- Se omiten duplicados por celular limpio o por nombre normalizado.
- Se agregan registros nuevos; no se actualizan existentes.
- País default: Argentina.

## Plano

- El plano acepta URL o data URL PNG.
- El PNG en data URL se valida con tamaño máximo aproximado de 900.000 caracteres.
- Desde la UI se comprime/redimensiona antes de enviar.
