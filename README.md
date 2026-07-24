# Plantilla de documentación para nuevos productos

Esta carpeta sirve como punto de partida para documentar productos nuevos desde el inicio.

La idea no es escribir documentos largos por burocracia, sino crear una base clara para que cada decisión futura tenga contexto, reglas y criterios de aceptación.

## Cómo usarla

1. Copiar la carpeta `docs/` dentro del nuevo proyecto.
2. Completar primero:
   - `00-producto.md`
   - `01-spec-base.md`
   - `02-roles-y-permisos.md`
   - `03-arquitectura.md`
   - `04-reglas-de-negocio.md`
   - `changelog.md`
3. Antes de implementar una funcionalidad nueva, crear o actualizar su spec.
4. Después de implementar, actualizar el changelog y los documentos afectados.

## Principio

No documentar todo por adelantado. Documentar lo suficiente para:

- evitar contradicciones,
- tomar mejores decisiones,
- entender el sistema después de varias semanas,
- reducir errores al cambiar código,
- y construir mejores productos con menos improvisación.

## Estructura sugerida

```txt
docs/
  README.md
  00-producto.md
  01-spec-base.md
  02-roles-y-permisos.md
  03-arquitectura.md
  04-reglas-de-negocio.md
  05-modelo-de-datos.md
  06-ux-ui.md
  07-flujos-principales.md
  08-seguridad-privacidad.md
  09-roadmap.md
  changelog.md
```

## Regla de oro

Si una decisión afecta cómo funciona el producto, quién puede hacer algo, qué datos se guardan o cómo se valida una acción, debe quedar documentada.
