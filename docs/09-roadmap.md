# Roadmap

Estado inicial documentado: 2026-07-25  
Última actualización: 2026-08-10

## Objetivo

Separar lo necesario para operar ICEA 2026 de mejoras futuras. Nada de este documento se implementa automáticamente: antes de construirlo hay que convertirlo en spec o actualizar el documento correspondiente.

## Prioridad alta

- Reemplazar claves hardcodeadas por variables de entorno o auth real.
- Agregar auditoría mínima de cambios de asignaciones, servidores, horarios, posiciones, reglas y equipos.
- Definir política de privacidad para nombres, teléfonos y disponibilidad.
- Verificar visualmente mobile y desktop antes del evento.
- Confirmar límites reales de tamaño para plano PNG en Firestore.

## Prioridad media

- Agregar tests automatizados para reglas de disponibilidad, consecutivos, duplicados e importación.
- Agregar tests de API para validación de claves y payloads.
- Exportar grilla completa a Excel/PDF.
- Mejorar importación con vista previa y resumen de omitidos.
- Permitir editar o fusionar duplicados en importación.
- Agregar búsqueda por teléfono.
- Agregar estado de publicación por equipo.

## Prioridad baja / futuro

- Login individual por usuario.
- Roles granulares por equipo.
- Notificaciones por WhatsApp o enlaces de mensaje asistido.
- Firebase Storage para planos y archivos.
- Historial visual de cambios por celda.
- Panel global de cobertura entre equipos.
- Modo impresión para horarios y puestos.

## Deuda técnica

- Claves duplicadas entre cliente y servidor.
- `scripts/seed.ts` todavía escribe defaults en colecciones root, útil para legado pero no como seed multi-equipo principal.
- Sin tests configurados.
- Warnings conocidos: dependencia `refresh` en `useEffect` y uso de `<img>` para plano en `components/congress-app.tsx`.
- Falta normalizar completamente textos antiguos sin tilde en código heredado.

## Deuda de producto

- Definir si la grilla debe ser pública para todo visitante con link o restringida.
- Definir cuánto tiempo conservar datos personales después del evento.
- Definir si Master también debería poder editar datos internos de equipos.
- Definir si los equipos inactivos deben seguir accesibles por URL directa.

## Criterio

Priorizar primero lo que reduce riesgo operativo durante el congreso: seguridad, auditoría, estabilidad, legibilidad mobile y recuperación ante errores.
