# Flujos principales

Estado inicial documentado: 2026-07-25  
Última actualización: 2026-07-25

## Flujo: elegir equipo

Rol: visitante.

Pasos:

1. Entrar a `/`.
2. Ver lista de equipos activos.
3. Seleccionar un equipo.
4. Entrar a `/equipos/{teamId}`.
5. Usar el botón Equipos para volver a la home sin depender del back del navegador.

Resultado esperado:

- Se muestra la grilla pública del equipo seleccionado.

## Flujo: consultar turnos

Rol: visitante o servidor.

Pasos:

1. Entrar a la grilla del equipo.
2. Buscar por nombre.
3. Ver turnos agrupados por día.
4. Revisar horario y posición.

Resultado esperado:

- La persona ve sus turnos sin recorrer toda la grilla.

## Flujo: administrar equipo

Rol: admin de equipo.

Pasos:

1. Entrar a `/equipos/{teamId}/admin`.
2. Ingresar clave admin.
3. Usar menú: Servidores, Horarios, Posiciones o Reglas.
4. Guardar cambios.
5. Volver a la grilla o a Equipos desde los botones del header.

Resultado esperado:

- Los cambios afectan solo al equipo actual.

## Flujo: crear equipo

Rol: master.

Pasos:

1. Entrar a `/master`.
2. Ingresar clave master.
3. Crear equipo con nombre, descripción y estado activo.
4. Abrir grilla o admin del equipo creado.

Resultado esperado:

- El equipo queda disponible en la home y con datos iniciales por defecto.

## Validación manual antes de deploy

- [ ] Home lista equipos activos.
- [ ] Cada grilla y admin permite volver a Equipos sin usar back del navegador.
- [ ] Organización Interna abre en `/equipos/organizacion-interna`.
- [ ] Técnica abre en `/equipos/tecnica`.
- [ ] Admin por equipo guarda cambios aislados.
- [ ] Reglas por equipo afectan desplegables.
- [ ] Panel Master crea un equipo nuevo.
- [ ] Mobile admin abre secciones en drawer lateral sin empujar contenido.

## Importar servidores

Última actualización: 2026-07-26

1. Entrar al admin del equipo.
2. Abrir la sección Servidores.
3. Opcionalmente, descargar el archivo Modelo para usar la estructura correcta.
4. Presionar Importar.
5. Seleccionar un archivo Excel o CSV con columnas: Nombre completo, celular, franja jueves, franja viernes, franja sábado.
6. El sistema agrega solo servidores nuevos; no pisa ni edita los ya cargados.
