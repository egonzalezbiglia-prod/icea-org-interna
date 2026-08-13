# Arquitectura

Estado inicial documentado: 2026-07-25  
Última actualización: 2026-08-10

## Stack

- Frontend: Next.js App Router, React 19, TypeScript y CSS global.
- Backend: Route Handlers de Next.js.
- Base de datos: Firebase Firestore con Firebase Admin SDK.
- Validación: Zod.
- Iconos: `lucide-react`.
- Excel/CSV: `xlsx`.
- Hosting esperado: Vercel.
- Gestor: `pnpm`.

## Rutas de UI

- `/`: home con equipos activos.
- `/equipos/{teamId}`: grilla pública y modo admin de asignaciones.
- `/equipos/{teamId}/admin`: panel admin del equipo.
- `/admin`: redirección a `/equipos/organizacion-interna/admin`.
- `/master`: panel master.

## APIs

| Método | Endpoint | Uso | Validación |
|---|---|---|---|
| `GET` | `/api/public-schedule?teamId={teamId}` | Lee el snapshot liviano de la grilla pública | Requiere cliente permitido |
| `GET` | `/api/public-plan?teamId={teamId}` | Lee el plano público cuando se abre el modal | Requiere cliente permitido |
| `GET` | `/api/schedule?teamId={teamId}` | Lee la grilla completa para administración | Requiere `teamId` y cliente permitido |
| `PATCH` | `/api/schedule` | Asigna o desasigna una celda | Clave admin |
| `PATCH` | `/api/config` | Cambia servidores, horarios, posiciones, reglas e importación | Clave admin |
| `PATCH` | `/api/plan` | Guarda plano y nota | Clave admin |
| `GET` | `/api/master?masterKey=...` | Lista equipos | Clave master |
| `PATCH` | `/api/master` | Crea o edita equipos | Clave master |
| `POST/DELETE` | `/api/auth/gate` | Endpoint neutro de compatibilidad | Sin estado real |

## Lectura de grilla

Las APIs de lectura de grilla no son públicas abiertas. Aceptan lectura si:

- Recibe header `x-icea-schedule-client: schedule-ui`, o
- Recibe cookie `icea_schedule_client=1`.

El middleware setea esa cookie para rutas `/equipos/:path*`, con path `/api`, `sameSite: lax`, `secure: true` y vida de 12 horas.

La grilla común consulta `GET /api/public-schedule`. Lee `teams/{teamId}/public/schedule`, un snapshot actualizado por cambios de Admin y sin teléfonos, disponibilidad ni datos privados de servidores. La primera consulta de un equipo sin snapshot lo genera desde la grilla completa; las siguientes leen un documento. El PNG del plano se lee por separado solo al abrirlo, para no acercar el snapshot al límite de tamaño de Firestore. La grilla de Admin sigue leyendo `/api/schedule` con el detalle completo.

## Estructura

```txt
app/
  page.tsx
  layout.tsx
  globals.css
  equipos/[teamId]/page.tsx
  equipos/[teamId]/admin/page.tsx
  master/page.tsx
  admin/page.tsx
  api/
components/
  congress-app.tsx
  admin-app.tsx
  master-app.tsx
  theme-toggle.tsx
  team-icon.tsx
lib/
  auth.ts
  domain.ts
  firebase-admin.ts
  repositories.ts
  types.ts
  validation.ts
scripts/
  seed.ts
docs/
```

## Módulos clave

- `lib/domain.ts`: días, horarios default, posiciones default, equipos default, países, fechas, helpers y catálogo de íconos.
- `lib/types.ts`: tipos compartidos de payload y entidades.
- `lib/repositories.ts`: lectura/escritura en Firestore, defaults y fallback histórico.
- `lib/validation.ts`: schemas Zod de asignaciones, plan, config y master.
- `lib/auth.ts`: claves MVP y comparación con `timingSafeEqual`.
- `middleware.ts`: cookie de cliente permitido para lectura de schedule.

## Configuración

- `package.json`: scripts `dev`, `build`, `start`, `lint`, `seed`.
- `eslint.config.mjs`: ignora `.next`, `node_modules`, `out`, `dist` y `next-env.d.ts`.
- `firebase.json`: usa `firestore.indexes.json`.
- `firestore.indexes.json`: sin índices custom.
- `vercel.json`: framework Next.js.

## Decisiones técnicas

- Datos multi-equipo bajo `teams/{teamId}`.
- `organizacion-interna` conserva fallback a colecciones root antiguas.
- Al desasignar se guarda documento con `serverId: null` para bloquear fallback histórico.
- Si Firebase no está configurado, las lecturas devuelven defaults locales y las escrituras fallan.
- Las páginas principales son dinámicas (`force-dynamic`) para leer datos frescos.
- El navegador conserva una copia local de la última grilla pública y consulta el snapshot compartido en segundo plano al entrar o al volver a la pestaña, con una ventana mínima de cinco minutos entre comprobaciones.
- Si hay una sesión Admin activa, la grilla carga automáticamente el detalle completo antes de habilitar los selectores de asignación. Esto evita que el snapshot público, que no trae la lista privada de servidores, parezca una grilla vacía.
- Cada cambio de persona en grilla usa una transacción que lee la asignación actual, el servidor elegido y su reserva de turno; no consulta todos los puestos del horario.
