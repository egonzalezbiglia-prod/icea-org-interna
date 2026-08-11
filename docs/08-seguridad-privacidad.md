# Seguridad y privacidad

Estado inicial documentado: 2026-07-25  
Última actualización: 2026-08-11

## Objetivo

Definir qué datos protege la app, qué controles existen hoy y qué riesgos quedan abiertos por ser un MVP con claves compartidas.

## Datos personales

La app maneja:

- Nombre completo de servidores.
- WhatsApp.
- País/prefijo telefónico.
- Disponibilidad horaria por día.
- Asignaciones a posiciones y turnos.

No maneja actualmente:

- Email.
- Datos de pago.
- Datos de salud.
- Contraseñas personales.

## Autenticación vigente

- Admin: clave compartida `1icea2026`.
- Master: clave compartida `Ezequiel#1993`.
- Las claves están hardcodeadas en `lib/auth.ts` y duplicadas en componentes cliente para UX.
- La comparación del servidor usa `timingSafeEqual`.
- La sesión de UI se guarda en `sessionStorage`; no hay sesión server-side.

## Autorización vigente

- APIs de escritura de equipo validan clave admin.
- API master valida clave master.
- La lectura de grilla requiere cliente permitido por header/cookie.
- El frontend oculta controles, pero no es fuente de seguridad.

## Controles por API

- `PATCH /api/schedule`: requiere clave admin.
- `PATCH /api/config`: requiere clave admin.
- `PATCH /api/plan`: requiere clave admin.
- `GET /api/master`: requiere clave master.
- `PATCH /api/master`: requiere clave master.
- `GET /api/schedule`: exige `teamId` y header/cookie de cliente permitido.
- `GET /api/public-schedule` y `GET /api/public-plan`: exigen cliente permitido y no exponen teléfonos ni disponibilidades de servidores.

## Validación de datos

- Zod valida payloads de asignación, configuración, plan y master.
- Horarios usan `HH:MM`.
- Fechas usan `YYYY-MM-DD`.
- País debe pertenecer al catálogo permitido.
- Plano como data URL debe ser PNG y tener tamaño limitado.
- Importación limita lote a 500 servidores por request.

## Riesgos conocidos

- Claves compartidas pueden filtrarse o reenviarse.
- Las claves hardcodeadas en cliente no son seguridad robusta.
- No hay identidad personal ni auditoría por usuario.
- Firestore depende de credenciales de Admin SDK en servidor.
- Plano en data URL puede aumentar tamaño de documento.
- Nombres y teléfonos son datos personales y deben compartirse solo con quienes coordinan el servicio.

## Recomendaciones antes de escalar

- Mover claves a variables de entorno o sistema de auth real.
- Implementar login individual y roles.
- Registrar auditoría de cambios con usuario, fecha, equipo y acción.
- Evaluar Firebase Storage para planos.
- Agregar reglas de retención o limpieza de datos personales.
- Revisar exposición de la grilla según necesidad real de privacidad.

## Criterios mínimos

- No publicar credenciales Firebase.
- No confiar solo en ocultar botones.
- Validar permisos en servidor.
- Documentar cualquier dato personal nuevo.
- No usar datos reales en fixtures, capturas o demos públicas.
