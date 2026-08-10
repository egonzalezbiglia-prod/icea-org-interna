# Flujos principales

Estado inicial documentado: 2026-07-25  
Última actualización: 2026-08-10

## Elegir equipo

Rol: visitante.

1. Entrar a `/`.
2. Ver equipos activos.
3. Seleccionar un equipo.
4. Entrar a `/equipos/{teamId}`.

Resultado esperado:

- Se muestra la grilla pública del equipo seleccionado.

## Consultar turnos

Rol: visitante o servidor.

1. Entrar a `/equipos/{teamId}`.
2. Buscar por nombre.
3. Ver la tarjeta del día activo si tiene turnos ese día.
4. Revisar otros días si corresponde.
5. Abrir el plano si necesita ubicar posiciones.

Resultado esperado:

- La persona encuentra sus turnos sin recorrer toda la grilla.

## Asignar desde la grilla

Rol: admin de equipo.

1. Entrar a `/equipos/{teamId}`.
2. Abrir Admin desde el menú.
3. Ingresar clave admin.
4. Elegir día.
5. Seleccionar servidor en una celda.
6. Guardar automáticamente por API.

Resultado esperado:

- La asignación queda guardada en el equipo correcto.

## Vaciar un turno

Rol: admin de equipo.

1. Activar modo admin en la grilla.
2. Presionar el botón de vaciar en el encabezado del turno.
3. Confirmar acción.

Resultado esperado:

- Todas las posiciones asignadas de ese turno quedan vacías.
- No reaparecen asignaciones históricas al actualizar.

## Administrar equipo

Rol: admin de equipo.

1. Entrar a `/equipos/{teamId}/admin`.
2. Ingresar clave admin.
3. Usar secciones: Servidores, Horarios, Posiciones o Reglas.
4. Guardar cambios.
5. Refrescar grilla si necesita confirmar.

Resultado esperado:

- Los cambios afectan solo al equipo actual.

## Importar servidores

Rol: admin de equipo.

1. Entrar al admin del equipo.
2. Abrir Servidores.
3. Descargar el Modelo si necesita la estructura.
4. Presionar Importar.
5. Seleccionar archivo `.xlsx`, `.xls` o `.csv`.

Resultado esperado:

- Se agregan servidores nuevos.
- Los existentes por celular o nombre normalizado se omiten.

## Revisar cobertura

Rol: admin de equipo.

1. Entrar a Servidores.
2. Abrir Reporte.
3. Revisar ideal, mínimo, full bruto, netos y estados.
4. Descargar sugerencia si necesita planilla.
5. Copiar mensaje de turno si corresponde.

Resultado esperado:

- El admin entiende faltantes de cobertura por turno.

## Crear o editar equipo

Rol: master.

1. Entrar a `/master`.
2. Ingresar clave master.
3. Crear equipo o editar uno existente.
4. Configurar nombre, descripción, activo, ícono y fechas.
5. Guardar.
6. Abrir grilla o admin desde el panel.

Resultado esperado:

- El equipo queda disponible si está activo.
- Las fechas impactan el riel de días y la franja "ahora".

## Validación manual antes de deploy

- [ ] `pnpm build` pasa.
- [ ] `pnpm lint` pasa o solo deja warnings conocidos.
- [ ] Home lista equipos activos.
- [ ] Grilla carga por `teamId`.
- [ ] Botón Actualizar funciona desde `/equipos/{teamId}`.
- [ ] Búsqueda muestra turnos por día.
- [ ] Plano abre y, con admin, permite guardar PNG/nota.
- [ ] Modo admin asigna y desasigna.
- [ ] Vaciar turno no revive fallback histórico.
- [ ] Admin guarda servidores, horarios, posiciones y reglas.
- [ ] Importación Excel/CSV agrega nuevos y omite duplicados.
- [ ] Reporte de cobertura abre y descarga sugerencia.
- [ ] Master crea/edita equipo, ícono, activo y fechas.
- [ ] Mobile admin usa drawer lateral.
- [ ] Tema claro/oscuro se ve consistente.
