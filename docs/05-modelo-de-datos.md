# Modelo de datos

Estado inicial documentado: 2026-07-25  
Última actualización: 2026-07-25

## Firestore

Estructura principal:

```txt
teams/{teamId}
  name
  description
  icon
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
- `icon`: id de icono elegible desde Panel Master (catálogo en `lib/domain.ts` / `components/team-icon.tsx`). `null` = la home usa la inicial del nombre.
- `congressDates`: fechas editables del congreso por día (`jueves`, `viernes`, `sabado`) en formato `YYYY-MM-DD`.
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
- 2026-07-25: se agrega el campo `icon` a `Team` (id del catálogo de íconos; `null` cae a la inicial). Docs antiguos sin el campo se leen como `null`, salvo los equipos por defecto que mantienen su ícono.
- 2026-07-25: se agrega `congressDates` a `Team` para configurar desde Panel Master las fechas usadas por el riel de días y la franja "ahora".
