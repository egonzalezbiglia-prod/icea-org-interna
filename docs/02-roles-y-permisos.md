# Roles y permisos

Estado inicial documentado: 2026-07-25  
Última actualización: 2026-08-10

## Visitante

Puede:

- Ver la home de equipos activos.
- Entrar a la grilla pública de un equipo.
- Buscar turnos por nombre.
- Ver plano y nota del plano si existen.
- Cambiar tema claro/oscuro en su dispositivo.

No puede:

- Editar asignaciones.
- Crear, editar o eliminar servidores, horarios, posiciones o equipos.
- Modificar reglas o plano.

## Admin de equipo

Clave actual: `1icea2026`.

Puede dentro del equipo actual:

- Entrar al modo admin de la grilla.
- Asignar, desasignar y vaciar turnos.
- Cargar o actualizar el plano PNG y su nota.
- Entrar al admin por equipo.
- Crear, editar, activar/desactivar, importar y eliminar servidores.
- Descargar modelo de importación y sugerencia de asignación.
- Consultar reporte de cobertura.
- Crear, editar y eliminar horarios.
- Definir cobertura ideal y mínima por horario.
- Crear, editar y eliminar posiciones.
- Configurar reglas del equipo.

No puede:

- Crear equipos nuevos.
- Editar otros equipos desde su panel.
- Acceder al Panel Master sin clave master.

## Master

Clave actual: `Ezequiel#1993`.

Puede:

- Entrar al Panel Master.
- Crear equipos.
- Editar nombre, descripción, ícono, fechas del congreso y estado activo.
- Acceder a la grilla y al admin de cada equipo desde el panel.

No puede por sí solo:

- Reemplazar las validaciones de clave admin en APIs de equipo.

## Rutas

| Rol | Ruta | Clave |
|---|---|---|
| Visitante | `/` | No |
| Visitante | `/equipos/{teamId}` | No |
| Admin | `/equipos/{teamId}` | `1icea2026` para escribir |
| Admin | `/equipos/{teamId}/admin` | `1icea2026` |
| Master | `/master` | `Ezequiel#1993` |
| Compatibilidad | `/admin` | Redirige a `/equipos/organizacion-interna/admin` |

## Sesiones locales

- El admin guarda estado de sesión en `sessionStorage` con clave `icea-admin-ok:{teamId}`.
- El master guarda estado de sesión en `sessionStorage` con clave `icea-master-ok`.
- El tema se guarda en `localStorage` con clave `icea-theme`.

## Validación

- Las pantallas ocultan controles según rol, pero las APIs vuelven a validar clave.
- Las claves pueden viajar en body o headers: `editKey` / `x-edit-key`, `masterKey` / `x-master-key`.
- El actor de asignaciones puede viajar como `actorName` / `x-actor-name`; default: `Organizacion`.
