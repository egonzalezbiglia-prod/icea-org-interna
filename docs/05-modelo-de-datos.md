# Modelo de datos

Estado inicial documentado: 2026-07-25  
Última actualización: 2026-08-10

## Firestore

Estructura principal:

```txt
teams/{teamId}
  name
  description
  icon
  congressDates
  active
  createdAt
  updatedAt

teams/{teamId}/servers/{serverId}
teams/{teamId}/slots/{slotId}
teams/{teamId}/positions/{positionId}
teams/{teamId}/assignments/{assignmentId}
teams/{teamId}/settings/plan
teams/{teamId}/settings/rules
teams/{teamId}/public/schedule
```

Fallback histórico para `organizacion-interna`:

```txt
servers/{serverId}
slots/{slotId}
positions/{positionId}
assignments/{assignmentId}
settings/plan
```

## `Team`

- `id`: slug del equipo.
- `name`: nombre visible.
- `description`: descripción opcional.
- `icon`: id del catálogo de íconos o `null`.
- `congressDates`: fechas por día en formato `YYYY-MM-DD`.
- `active`: controla si aparece en la home.
- `createdAt`: timestamp.
- `updatedAt`: timestamp.

## `TeamSettings`

- `maxConsecutiveShifts`: número entre 1 y 12.
- `blockAfterMaxConsecutive`: boolean.
- `allowPartialAvailability`: boolean.
- `warnPartialAvailability`: boolean.
- `preventSameSlotDuplicate`: boolean.
- `updatedAt`: timestamp.

## `Server`

- `id`: id Firestore.
- `fullName`: nombre completo.
- `whatsapp`: número limpio.
- `countryCode`: `AR`, `UY`, `PY`, `CL`, `BR` o `BO`.
- `dialCode`: prefijo telefónico.
- `active`: boolean.
- `availability`: lista de rangos.
- `createdAt`: timestamp.
- `updatedAt`: timestamp.

## `AvailabilityRange`

- `id`: id local del rango.
- `dayId`: `jueves`, `viernes` o `sabado`.
- `start`: `HH:MM`.
- `end`: `HH:MM`.

## `Slot`

- `id`: id del horario.
- `dayId`: día.
- `start`: inicio `HH:MM`.
- `end`: fin `HH:MM`.
- `label`: etiqueta visible.
- `idealCoverage`: objetivo ideal de servidores.
- `minimumCoverage`: objetivo mínimo.

## `Position`

- `id`: número positivo.
- `name`: nombre visible.

## `Assignment`

- `id`: `{dayId}__{slotId}__{positionId}`.
- `dayId`: día.
- `slotId`: id del horario.
- `positionId`: número de posición.
- `serverId`: id del servidor o `null`.
- `serverName`: snapshot del nombre o `null`.
- `updatedAt`: timestamp.
- `updatedBy`: actor.

Una asignación con `serverId: null` representa una celda explícitamente vacía y evita que reaparezcan datos históricos por fallback.

## `Plan`

- `imageUrl`: URL o data URL PNG.
- `note`: nota visible.
- `updatedAt`: timestamp.

## Snapshot público de grilla

`teams/{teamId}/public/schedule` guarda una versión preparada de la grilla para consultas públicas de bajo costo.

- `version`: versión del formato del snapshot.
- `updatedAt`: timestamp de la última actualización.
- `payload`: equipo, días, horarios, puestos, asignaciones y metadatos del plano.
- `payload.assignments`: mapa por id de asignación, para actualizar una celda sin releer la grilla completa.

No incluye teléfonos ni disponibilidades de `Server`; la grilla pública solo recibe el nombre ya guardado en cada asignación. El PNG del plano se mantiene fuera del snapshot y se lee al abrir el modal.

## Defaults

Días:

- `jueves`
- `viernes`
- `sabado`

Fechas default ICEA 2026:

- Jueves: `2026-08-13`
- Viernes: `2026-08-14`
- Sábado: `2026-08-15`

Equipos default:

- `organizacion-interna`: Organización Interna, ícono `users`.
- `tecnica`: Técnica, ícono `sliders`.

Horarios default:

- Jueves: `13:00-15:00`, `15:00-18:00`, `18:00-20:00`, `20:00-22:00`.
- Viernes: `08:00-11:00`, `11:00-13:00`, `13:00-15:00`, `15:00-18:00`, `18:00-20:00`, `20:00-23:00`.
- Sábado: `08:00-11:00`, `11:00-13:00`, `13:00-15:00`, `15:00-18:00`, `18:00-20:00`, `20:00-23:00`.

Posiciones default:

- 24 posiciones, `Posicion 1` a `Posicion 24`.

Cobertura default:

- Ideal: 40.
- Mínima: 30.

Reglas default:

- `maxConsecutiveShifts`: 2.
- `blockAfterMaxConsecutive`: `true`.
- `allowPartialAvailability`: `true`.
- `warnPartialAvailability`: `true`.
- `preventSameSlotDuplicate`: `true`.

## Migraciones

- 2026-07-25: modelo multi-equipo bajo `teams/{teamId}`.
- 2026-07-25: fallback a colecciones root antiguas para `organizacion-interna`.
- 2026-07-25: campo `icon` en `Team`.
- 2026-07-25: campo `congressDates` en `Team`.
- 2026-07-26: desasignación conserva documento vacío con `serverId: null`.
- 2026-08-10: documentación sincronizada con repo actual.
- 2026-08-11: snapshot público por equipo en `teams/{teamId}/public/schedule` para reducir lecturas de la grilla.
