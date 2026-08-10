# Instrucciones para Claude Code

Última actualización: 2026-08-10

## Configuración compartida

- Revisa siempre `AGENTS.md` antes de escribir código.
- Usa `pnpm` para todos los comandos del proyecto.
- Mantén código, comentarios y documentación en español.
- Respeta el stack actual: Next.js 15, React 19, TypeScript, Firebase Admin, Zod, `lucide-react` y `xlsx`.

## Documentación viva

- La documentación del producto está en `docs/`.
- Si una tarea cambia comportamiento, permisos, datos, UX, arquitectura o seguridad, actualiza el documento correspondiente.
- Registra cambios relevantes en `docs/changelog.md`.

## Directrices de trabajo y relevo

- No dupliques funciones; revisa `components/` y `lib/` antes de crear helpers nuevos.
- Evita refactors no pedidos.
- Al terminar una tarea, agrega una línea al final de `CHANGES.log` con el formato:
  `- [CLAUDE] Breve descripción de la tarea realizada`.
- Si queda algo pendiente para Codex, escríbelo claramente en `CHANGES.log`.
- Al terminar, detén tu ejecución para cederle el turno a Codex.
