# UX/UI

Estado inicial documentado: 2026-07-25  
Última actualización: 2026-08-13

## Personalidad visual

- Sobria.
- Cálida.
- Operativa.
- Mobile-first.
- Con identidad ICEA sin volverse decorativa.

## Tono de voz

El producto habla claro, directo y en español rioplatense/neutro:

- "Seleccioná tu equipo".
- "Buscar servidor por nombre".
- "Guardar reglas".
- "No hay turnos asignados para esa búsqueda".

Evitar:

- Textos técnicos innecesarios para usuarios de consulta.
- Explicaciones largas dentro de la interfaz.
- Mensajes que culpen al usuario.

## Identidad visual

- Tipografía de títulos: Fraunces vía `next/font`.
- Tipografía de cuerpo: Hanken Grotesk vía `next/font`.
- Paleta: pino, esmeralda y lima sobre papel cálido.
- Bordes: radio bajo, alrededor de 8 px.
- Íconos: `lucide-react`.
- Versículo visible en home y pie de grilla.

## Tema claro/oscuro

- La app arranca en modo oscuro si no hay preferencia guardada.
- La preferencia se guarda en `localStorage` con `icea-theme`.
- El script de tema corre en `app/layout.tsx` antes de renderizar children.
- `ThemeToggle` alterna `document.documentElement.dataset.theme`.
- El modo oscuro cubre home, grilla, admin, master, botones, buscador, tabs, tablas y estados.

## Home

- La home lista solo equipos activos.
- Cada fila muestra ícono o inicial, nombre, descripción y chevron.
- El Panel Master está disponible desde el header.
- El selector de equipo debe sentirse rápido, no como landing comercial.

## Grilla

- Header con acciones principales: Plano, Actualizar y menú.
- Menú de más opciones: Inicio si corresponde, Tema, Admin y Salir admin.
- Buscador destacado para que cada servidor encuentre sus turnos.
- Resultados agrupados por día.
- Tarjeta "Tu servicio" para el día activo.
- Riel de días con fecha corta.
- Tabla horizontal con posiciones como filas y turnos como columnas.
- Franja "ahora" resaltada si la fecha/hora del dispositivo cae dentro del congreso.
- Alertas compactas dentro de la celda: inactivo, parcial, consecutivos.
- En modo Admin, las celdas sin asignar se resaltan con rosa suave para detectar faltantes rápidamente.

## Admin

- Login simple por clave.
- Header alineado con la grilla.
- En mobile, el menú de secciones funciona como drawer superpuesto.
- Secciones: Servidores, Horarios, Posiciones y Reglas.
- Servidores muestra capacidad, disponibilidad por día, WhatsApp, edición y eliminación.
- Reporte de cobertura usa modal con tabla densa.
- Horarios permite copiar imagen compartible.

## Master

- Permite crear y editar equipos en una pantalla operativa.
- Campos por equipo: nombre, descripción, activo, ícono y fechas del congreso.
- Accesos rápidos a grilla y admin.

## Accesibilidad

- Botones iconográficos tienen `aria-label` cuando no tienen texto suficiente.
- Inputs relevantes tienen labels o `aria-label`.
- No depender solo del color: las alertas también muestran texto.
- Mantener contraste suficiente en ambos temas.
- Las acciones destructivas piden confirmación.

## Criterio

Si una pantalla empieza a sentirse más compleja que la tarea que resuelve, debe simplificarse o dividirse.
