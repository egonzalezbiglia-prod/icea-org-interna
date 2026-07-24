# Documentación del producto

Estado inicial documentado: AAAA-MM-DD  
Última actualización: AAAA-MM-DD

## Objetivo de esta documentación

Esta carpeta define cómo funciona el producto, qué decisiones ya fueron tomadas y qué reglas deben respetarse al construir nuevas funcionalidades.

No reemplaza a Git ni al código. Sirve como contrato de producto y referencia para trabajar con más precisión.

## Índice

- `00-producto.md`: visión, problema, usuarios y alcance.
- `01-spec-base.md`: plantilla para definir features o módulos nuevos.
- `02-roles-y-permisos.md`: quiénes usan el sistema y qué puede hacer cada rol.
- `03-arquitectura.md`: stack, rutas, servicios y estructura técnica.
- `04-reglas-de-negocio.md`: reglas centrales que gobiernan el producto.
- `05-modelo-de-datos.md`: entidades, campos y relaciones.
- `06-ux-ui.md`: lineamientos visuales, tono e interacción.
- `07-flujos-principales.md`: recorridos clave de usuario.
- `08-seguridad-privacidad.md`: datos sensibles, permisos y riesgos.
- `09-roadmap.md`: prioridades, pendientes y evolución.
- `changelog.md`: cambios importantes por fecha.

## Cómo mantenerla

- Cada cambio importante debe actualizar el documento correspondiente.
- Si se agrega una regla, debe ir en `04-reglas-de-negocio.md`.
- Si se agrega una entidad o campo, debe ir en `05-modelo-de-datos.md`.
- Si se cambia una pantalla principal o flujo, debe ir en `07-flujos-principales.md`.
- Si se cambia una decisión visual importante, debe ir en `06-ux-ui.md`.
- Si el cambio impacta producción, registrarlo en `changelog.md`.

## Qué no documentar

- Microcambios de copy sin impacto funcional.
- Refactors internos que no cambian comportamiento.
- Ideas vagas que todavía no fueron decididas.

Para ideas futuras usar `09-roadmap.md`.
