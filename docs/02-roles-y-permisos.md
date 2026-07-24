# Roles y permisos

Estado inicial documentado: AAAA-MM-DD  
Última actualización: AAAA-MM-DD

## Objetivo

Definir quién usa el sistema y qué puede hacer cada rol.

## Roles

### Visitante

Puede:

- Completar.

No puede:

- Completar.

### Usuario registrado

Puede:

- Completar.

No puede:

- Completar.

### Admin

Puede:

- Completar.

No puede:

- Completar.

## Matriz de permisos

| Acción | Visitante | Usuario | Admin |
|---|---:|---:|---:|
| Ver landing | Sí | Sí | Sí |
| Crear cuenta | Sí/No | No | Sí/No |
| Ver dashboard | No | Sí | Sí/No |
| Editar contenido | No | No | Sí |
| Eliminar datos | No | No | Sí |

## Reglas de acceso

- Completar.
- Completar.

## Estados de usuario

- Activo.
- Pausado.
- Pendiente.
- Bloqueado.
- Eliminado.

## Criterios

- Un rol no debe poder acceder a pantallas fuera de su permiso.
- Las URLs directas deben validar permisos.
- El frontend no reemplaza validaciones del backend.
