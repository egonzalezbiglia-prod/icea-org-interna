# Seguridad y privacidad

Estado inicial documentado: AAAA-MM-DD  
Última actualización: AAAA-MM-DD

## Objetivo

Definir qué datos se protegen, quién puede verlos y qué riesgos deben evitarse.

## Datos sensibles

- Nombre.
- Email.
- Teléfono.
- Datos de pago.
- Datos de salud.
- Datos personales.
- Otros.

## Permisos

- Qué valida frontend.
- Qué valida backend.
- Qué valida base de datos.

## Autenticación

- Método:
- Recuperación:
- Cambio de contraseña:
- Sesiones:

## Autorización

Reglas:

- Completar.

## Eliminación de datos

- Qué puede eliminar el usuario.
- Qué puede eliminar admin.
- Qué queda en logs.
- Qué se anonimiza.

## Logs y auditoría

- Qué acciones se registran.
- Quién puede ver logs.
- Cuánto tiempo se conservan.

## Riesgos

- Acceso por URL directa.
- Duplicación de datos.
- Exposición accidental.
- Permisos mal definidos.
- Secretos en frontend.

## Criterios mínimos

- Nunca confiar solo en ocultar botones.
- Validar permisos en servidor.
- No publicar secretos en el cliente.
- Documentar todo dato sensible nuevo.
