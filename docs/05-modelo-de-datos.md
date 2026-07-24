# Modelo de datos

Estado inicial documentado: AAAA-MM-DD  
Última actualización: AAAA-MM-DD

## Objetivo

Documentar entidades, campos importantes y relaciones.

## Entidades

### `users`

Descripción.

Campos:

- `id`
- `email`
- `status`
- `created_at`

Relaciones:

- Completar.

### `example_entity`

Descripción.

Campos:

- `id`
- `name`

## Relaciones principales

- `users.id` -> `example_entity.user_id`

## Estados/enums

```txt
status:
- active
- paused
- archived
```

## Datos sensibles

- Dato 1.
- Dato 2.

## Reglas de retención

- Qué se guarda.
- Qué se puede eliminar.
- Qué se anonimiza.

## Migraciones

Registrar cambios relevantes:

- AAAA-MM-DD: descripción.

## Regla de mantenimiento

Cada tabla, campo o relación nueva debe documentarse en este archivo.
