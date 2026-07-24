# Spec base - Asignacion de Servidores

Estado inicial documentado: 2026-07-24
Ultima actualizacion: 2026-07-24

## Nombre de la funcionalidad

Grilla inteligente de turnos para Servidores de congreso.

## Estado

- En desarrollo

## Objetivo

Organizar posiciones del salon por dia y horario, asignando Servidores segun disponibilidad real, carga ya asignada y restricciones operativas.

## Usuarios afectados

- Organizacion interna/admin.
- Servidores que consultan sus turnos.

## Alcance

Incluye:

- Lectura publica de la grilla para cualquier persona con link.
- Acceso admin con clave `1icea2026`.
- Alta y edicion de Servidores.
- Nombre completo, WhatsApp, pais, estado activo/inactivo y rangos de disponibilidad por dia.
- Asignacion por posicion/turno usando desplegable validado.
- Alertas por disponibilidad parcial, servidor inactivo y dos turnos consecutivos.
- Bloqueo de tercera asignacion consecutiva.
- Bloqueo de doble posicion en un mismo turno.
- Sugerencia priorizada de Servidores con menor disponibilidad/carga.

No incluye por ahora:

- Roles/perfiles con login individual.
- Observaciones por Servidor.
- Subida real de imagen a Storage.
- Envio automatico de WhatsApp.

## Reglas de negocio

- Los Servidores pasan rangos libres por dia, no necesariamente alineados a turnos.
- Un Servidor aparece como opcion normal si su disponibilidad cubre el turno completo.
- Un Servidor aparece al final con alerta si cubre parcialmente el turno.
- Si la disponibilidad empieza despues del inicio del turno, la alerta indica faltante al inicio.
- Si la disponibilidad termina antes del final del turno, la alerta indica faltante al final.
- Si no tiene disponibilidad para ese dia, no aparece en el desplegable.
- Si esta inactivo, no aparece para nuevas asignaciones.
- Si ya estaba asignado y luego se desactiva, queda visible en la celda con alerta roja.
- Un Servidor no puede estar en mas de una posicion en el mismo turno.
- Dos turnos son consecutivos si el fin de uno coincide con el inicio del otro, dentro del mismo dia.
- Un Servidor puede tener como maximo dos turnos consecutivos.
- Si ya tiene dos turnos consecutivos, esa condicion se resalta como aviso.
- No debe aparecer para un tercer turno consecutivo.
- Las opciones se ordenan priorizando:
  1. Servidores activos con disponibilidad completa.
  2. Menos horas disponibles totales.
  3. Menor porcentaje ocupado sobre disponible.
  4. Menor cantidad de horas ocupadas.
  5. Menor cantidad de turnos asignados.
  6. Orden alfabetico.
  7. Servidores con disponibilidad parcial al final, con alerta.

## Datos necesarios

Servidor:

- Nombre completo.
- WhatsApp.
- Pais/prefijo: Argentina por defecto; Uruguay, Paraguay, Chile, Brasil y Bolivia como opciones.
- Activo/inactivo.
- Rangos de disponibilidad por dia.

Turno:

- Dia.
- Hora inicio.
- Hora fin.

Asignacion:

- Dia.
- Turno.
- Posicion.
- Servidor asignado.

## Criterios de aceptacion

- [ ] La grilla permite asignar solo Servidores disponibles completos o parciales.
- [ ] Los parciales aparecen con alerta y al final del desplegable.
- [ ] Un Servidor no aparece si ya esta en otra posicion del mismo turno.
- [ ] Un Servidor no aparece si la asignacion generaria tercer turno consecutivo.
- [ ] Dos turnos consecutivos asignados quedan resaltados.
- [ ] Un Servidor inactivo asignado queda en rojo en la grilla.
- [ ] Admin puede activar/desactivar Servidores sin borrarlos.
- [ ] Admin puede ver horas disponibles, horas ocupadas y porcentaje ocupado.
- [ ] Admin tiene boton WhatsApp por Servidor.
