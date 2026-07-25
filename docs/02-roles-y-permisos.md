# Roles y permisos

Estado inicial documentado: 2026-07-25  
Última actualización: 2026-07-25

## Roles

### Visitante

Puede:

- Ver la home de equipos.
- Entrar a la grilla pública de un equipo.
- Buscar turnos por nombre.
- Ver plano y posiciones si están cargados.

No puede:

- Editar asignaciones.
- Crear servidores, horarios, posiciones o equipos.
- Modificar reglas.

### Admin de equipo

Clave actual: `1icea2026`.

Puede dentro de su equipo:

- Asignar servidores en la grilla.
- Crear, editar, activar/desactivar y eliminar servidores.
- Editar horarios.
- Editar posiciones.
- Cargar plano.
- Configurar reglas del equipo.

No puede:

- Crear equipos nuevos.
- Editar otros equipos desde su panel.

### Master

Clave actual: `Ezequiel#1993`.

Puede:

- Entrar al Panel Master.
- Crear nuevos equipos.
- Editar nombre, descripción y estado activo de equipos.
- Acceder a la grilla/admin de cada equipo desde el panel.

## Rutas de acceso

| Rol | Ruta | Clave |
|---|---|---|
| Visitante | `/`, `/equipos/{teamId}` | No |
| Admin | `/equipos/{teamId}/admin` | `1icea2026` |
| Master | `/master` | `Ezequiel#1993` |

## Criterios

- El frontend puede ocultar controles, pero las APIs también validan clave.
- La clave admin habilita acciones solo en el equipo indicado por `teamId`.
- La clave master no reemplaza al admin de equipo; gestiona equipos.
