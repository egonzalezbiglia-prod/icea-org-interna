# Arquitectura

Estado inicial documentado: 2026-07-25  
Última actualización: 2026-07-25

## Stack

- Frontend: Next.js App Router + React + CSS global.
- Backend: API routes de Next.js.
- Base de datos: Firebase Firestore usando Firebase Admin SDK.
- Hosting: Vercel.
- Auth: claves hardcodeadas MVP para admin y master.

## Rutas principales

### Público

- `/`: home para seleccionar equipo.
- `/equipos/{teamId}`: grilla pública del equipo.

### Admin

- `/equipos/{teamId}/admin`: admin del equipo.
- `/admin`: redirige a `/equipos/organizacion-interna/admin` por compatibilidad.

### Master

- `/master`: panel para crear y editar equipos.

### API

- `GET /api/schedule?teamId={teamId}`: obtiene grilla del equipo.
- `PATCH /api/schedule`: asigna/desasigna servidor.
- `PATCH /api/config`: modifica servidores, horarios, posiciones y reglas.
- `PATCH /api/plan`: modifica plano del equipo.
- `GET /api/master?masterKey=...`: lista equipos.
- `PATCH /api/master`: crea/edita equipos.

## Estructura de carpetas

```txt
app/
  page.tsx
  equipos/[teamId]/page.tsx
  equipos/[teamId]/admin/page.tsx
  master/page.tsx
  api/
components/
  congress-app.tsx
  admin-app.tsx
  master-app.tsx
lib/
  repositories.ts
  validation.ts
  domain.ts
  auth.ts
docs/
```

## Decisiones técnicas

- 2026-07-25: se migra de una app mono-equipo a multi-equipo con `teams/{teamId}`.
- 2026-07-25: Organización Interna queda como equipo default `organizacion-interna`.
- 2026-07-25: se mantiene fallback a colecciones viejas para no perder datos cargados antes de la migración.
- 2026-07-25: reglas operativas pasan a `settings/rules` por equipo.

## Riesgos técnicos

- Las claves están hardcodeadas por decisión MVP; no es auth robusta.
- Si se elimina una posición, horario o servidor se limpian asignaciones relacionadas del mismo equipo.
- Mientras exista fallback a colecciones viejas, Organización Interna puede leer datos históricos aunque no estén copiados a `teams/organizacion-interna`.
