# Modelo de datos

Estado inicial documentado: 2026-07-25  
Última actualización: 2026-07-25

## Firestore

Estructura principal:

```txt
teams/{teamId}
  name
  description
  active
  createdAt
  updatedAt

teams/{teamId}/servers/{serverId}
teams/{teamId}/slots/{slotId}
teams/{teamId}/positions/{positionId}
teams/{teamId}/assignments/{assignmentId}
teams/{teamId}/settings/plan
teams/{teamId}/settings/rules
```

## Entidades

### `Team`

Campos:

- `id`
- `name`
- `description`
- `active`
- `createdAt`
- `updatedAt`

### `Server`

Campos:

- `id`
- `fullName`
- `whatsapp`
- `countryCode`
- `dialCode`
- `active`
- `availability[]`
- `createdAt`
- `updatedAt`

### `AvailabilityRange`

Campos:

- `id`
- `dayId`: `jueves`, `viernes`, `sabado`
- `start`: HH:MM
- `end`: HH:MM

### `Slot`

Campos:

- `id`
- `dayId`
- `start`
- `end`
- `label`

### `Position`

Campos:

- `id`
- `name`

### `Assignment`

Campos:

- `id`: `{dayId}__{slotId}__{positionId}`
- `dayId`
- `slotId`
- `positionId`
- `serverId`
- `serverName`
- `updatedAt`
- `updatedBy`

### `TeamSettings`

Campos:

- `maxConsecutiveShifts`
- `blockAfterMaxConsecutive`
- `allowPartialAvailability`
- `warnPartialAvailability`
- `preventSameSlotDuplicate`
- `updatedAt`

### `Plan`

Campos:

- `imageUrl`
- `note`
- `updatedAt`

## Defaults

Equipos iniciales:

- `organizacion-interna`: Organización Interna.
- `tecnica`: Técnica.

Reglas iniciales:

- `maxConsecutiveShifts`: 2
- `blockAfterMaxConsecutive`: true
- `allowPartialAvailability`: true
- `warnPartialAvailability`: true
- `preventSameSlotDuplicate`: true

## Migraciones

- 2026-07-25: se agrega modelo multi-equipo con `teams/{teamId}`.
- 2026-07-25: Organización Interna mantiene fallback a colecciones root antiguas: `servers`, `slots`, `positions`, `assignments`, `settings/plan`.
