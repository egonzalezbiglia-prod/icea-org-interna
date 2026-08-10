# Especificaciones del Sistema y Reglas del Proyecto

Última actualización: 2026-08-10

## Arquitectura y stack

- Lenguaje: TypeScript estricto.
- Framework: Next.js 15 + React 19 sobre Node.js >= 20.
- Base de datos: Firebase Firestore usando `firebase-admin`.
- Validación: Zod.
- Iconos: `lucide-react`.
- Planillas: `xlsx`.
- Hosting esperado: Vercel.
- Gestor de paquetes obligatorio: `pnpm`.
- Idioma: todo el código, comentarios y documentación del proyecto deben escribirse en español.

## Comandos

- Instalación: `pnpm install`.
- Desarrollo local: `pnpm dev`.
- Build de producción: `pnpm build`.
- Servir build: `pnpm start`.
- Lint: `pnpm lint`.
- Seed legacy/defaults: `pnpm seed`.
- Tests: no hay comando de test configurado actualmente.

## Variables de entorno

Para escritura/lectura real en Firestore:

- `FIREBASE_PROJECT_ID`.
- `FIREBASE_CLIENT_EMAIL`.
- `FIREBASE_PRIVATE_KEY`.

Sin esas variables, las lecturas usan defaults locales cuando aplica y las escrituras fallan con error de Firebase no configurado.

## Estructura vigente

- `app/`: rutas UI, layout, estilos globales y route handlers.
- `components/`: apps cliente de grilla, admin, master, tema e iconos.
- `lib/`: auth, dominio, Firebase, repositorios, tipos y validación.
- `scripts/`: utilidades operativas.
- `docs/`: documentación viva del producto.

## Reglas de mantenimiento

- Antes de cambiar comportamiento, revisar `docs/README.md` y el documento específico afectado.
- Si cambia una regla de asignación, actualizar `docs/04-reglas-de-negocio.md`.
- Si cambia una entidad/campo/colección, actualizar `docs/05-modelo-de-datos.md`.
- Si cambia una ruta, API, middleware o variable de entorno, actualizar `docs/03-arquitectura.md`.
- Si cambia UX, flujo o permisos, actualizar los docs correspondientes.
- Registrar cambios relevantes en `docs/changelog.md` y en `CHANGES.log`.
