# Documentación del producto

Estado inicial documentado: 2026-07-25  
Última actualización: 2026-08-10

## Objetivo

Esta carpeta describe el comportamiento vigente de ICEA Org Interna: producto, roles, arquitectura, datos, reglas, flujos, seguridad y evolución esperada.

No reemplaza al código ni a Git. Sirve como referencia operativa para cambiar el sistema sin perder contexto.

## Índice

- `00-producto.md`: visión, usuarios, alcance y estado actual.
- `01-spec-base.md`: especificación funcional vigente de la grilla de turnos.
- `02-roles-y-permisos.md`: permisos, claves y rutas por rol.
- `03-arquitectura.md`: stack, estructura, APIs, persistencia y configuración.
- `04-reglas-de-negocio.md`: reglas de asignación, disponibilidad y cobertura.
- `05-modelo-de-datos.md`: entidades, colecciones, defaults y migraciones.
- `06-ux-ui.md`: lineamientos visuales, tono, temas y componentes.
- `07-flujos-principales.md`: recorridos principales y checklist manual.
- `08-seguridad-privacidad.md`: datos sensibles, controles y riesgos.
- `09-roadmap.md`: prioridades, deuda y decisiones pendientes.
- `changelog.md`: cambios relevantes por fecha.

## Cómo mantenerla

- Actualizar el documento afectado en el mismo cambio que modifica comportamiento.
- Registrar en `changelog.md` los cambios de producto, permisos, datos, reglas, UX o despliegue.
- Mantener las claves, rutas, endpoints y nombres de campos sincronizados con el código.
- Evitar documentos de intención que contradigan el estado real del repo.

## Fuente de verdad técnica

- Tipos: `lib/types.ts`.
- Defaults y reglas de dominio: `lib/domain.ts`.
- Acceso a Firestore: `lib/repositories.ts`.
- Validación de payloads: `lib/validation.ts`.
- APIs: `app/api/*/route.ts`.
- Pantallas principales: `app/page.tsx`, `app/equipos/[teamId]/page.tsx`, `app/equipos/[teamId]/admin/page.tsx`, `app/master/page.tsx`.
