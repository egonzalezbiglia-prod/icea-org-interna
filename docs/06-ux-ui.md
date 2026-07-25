# UX/UI

Estado inicial documentado: AAAA-MM-DD  
Última actualización: AAAA-MM-DD

## Personalidad visual

Completar:

- Sobria.
- Cálida.
- Técnica.
- Editorial.
- Comercial.
- Operativa.
- Otra.

## Tono de voz

Cómo habla el producto:

- Completar.

Cómo no debe hablar:

- Completar.

## Principios de interfaz

- Claridad antes que decoración.
- Mobile-first si aplica.
- Acciones principales visibles.
- Estados vacíos útiles.
- Errores con explicación accionable.

## Navegación

Describir:

- Menú principal.
- Header.
- Sidebar.
- Footer.
- Mobile.

## Componentes esperados

- Botones.
- Inputs.
- Cards.
- Tablas.
- Modales.
- Badges.
- Toasts/alertas.

## Accesibilidad

- Contraste suficiente.
- Estados focus.
- Labels en formularios.
- No depender solo del color.

## Decisiones visuales

- Tipografía:
- Paleta:
- Iconos:
- Espaciado:
- Bordes:

## Criterio

Si una pantalla empieza a sentirse más compleja que la tarea que resuelve, debe simplificarse.


## Drawer mobile del admin

Última actualización: 2026-07-25

- En mobile, el menú de secciones del admin debe comportarse como shell/drawer lateral superpuesto.
- El menú no debe empujar el contenido ni ocupar un bloque grande dentro del flujo de la página.
- El drawer debe tener backdrop para cerrar tocando fuera y botón de cierre interno.
- Las filas editables de horarios en mobile deben compactar día, inicio y fin para evitar controles excesivamente anchos.


## Home de selección de equipo

Última actualización: 2026-07-25

- La home inicial debe priorizar una selección simple, centrada y con identidad propia.
- La home usa modo oscuro por defecto para separar la selección inicial del resto de la app operativa.
- El título principal vive dentro del bloque de selección, no en el topbar.
- Los equipos se presentan en lista vertical, no en grilla de tarjetas.
- La acción de crear equipos no aparece en la home; vive solo en Panel Master.
- Cada fila de equipo usa icono, nombre, descripción opcional y chevron.
- Las filas de equipo deben mantenerse compactas para funcionar como selección rápida, no como tarjetas hero.


## Modo claro/oscuro

Última actualización: 2026-07-25

- La app permite elegir modo claro u oscuro desde los headers principales.
- La preferencia se guarda por dispositivo en `localStorage` con la clave `icea-theme`.
- Si no existe preferencia guardada, la app inicia en modo oscuro para respetar la identidad visual de la home.
- El cambio de tema no modifica datos de Firestore ni sesiones de admin/master.

## Dark mode de grilla

Última actualización: 2026-07-25

- La grilla debe usar tokens semánticos (`--grid-*`) para encabezados, celdas, columna de puestos, alertas y franja "ahora".
- En modo claro mantiene lectura tipo papel.
- En modo oscuro no debe conservar fondos blancos hardcodeados: tabla, selectores, estados y resultados deben integrarse con la paleta oscura.
- El dark mode incluye header, botones, buscador y tabs; no debe quedar una banda clara aislada sobre la grilla oscura.
- Los estados de alerta deben seguir siendo distinguibles sin depender solo del color, usando texto/puntos/contraste.
