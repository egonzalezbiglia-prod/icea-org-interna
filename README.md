# ICEA Org Interna

Aplicación web para consultar y administrar grillas de turnos por equipo para ICEA 2026.

## Estado actual

- Stack: Next.js 15, React 19, TypeScript estricto y Firebase Firestore con `firebase-admin`.
- Gestor de paquetes: `pnpm`.
- App multi-equipo con datos aislados bajo `teams/{teamId}`.
- Equipo por defecto: `organizacion-interna`.
- Equipos iniciales: Organización Interna y Técnica.
- Autenticación MVP por claves compartidas hardcodeadas.
- Sin suite de tests automatizados configurada.

## Funcionalidades

- Home `/` con listado de equipos activos.
- Grilla pública por equipo en `/equipos/{teamId}`.
- Modo admin en la grilla para asignar o desasignar servidores.
- Admin por equipo en `/equipos/{teamId}/admin`.
- Panel master en `/master` para crear, editar, activar o desactivar equipos.
- Gestión de servidores, horarios, posiciones, reglas, plano e importación Excel/CSV.
- Reporte de cobertura con descarga de sugerencia de asignación.
- Tema claro/oscuro persistido en `localStorage`.
- Franja "ahora" basada en fechas configurables por equipo.

## Comandos

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm seed
```

## Variables de entorno

Para persistir datos en Firestore se requieren:

```bash
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Si Firebase no está configurado, la app puede renderizar con defaults locales, pero las acciones de escritura fallan.

## Documentación

La documentación viva está en `docs/`:

- `docs/00-producto.md`: visión y alcance.
- `docs/01-spec-base.md`: especificación funcional vigente.
- `docs/02-roles-y-permisos.md`: roles, claves y rutas.
- `docs/03-arquitectura.md`: stack, rutas, APIs y estructura.
- `docs/04-reglas-de-negocio.md`: reglas operativas.
- `docs/05-modelo-de-datos.md`: entidades Firestore y defaults.
- `docs/06-ux-ui.md`: lineamientos visuales e interacción.
- `docs/07-flujos-principales.md`: recorridos manuales.
- `docs/08-seguridad-privacidad.md`: datos sensibles y riesgos.
- `docs/09-roadmap.md`: pendientes y deuda.
- `docs/changelog.md`: cambios importantes por fecha.
