# Documentación de Progreso — GestorCompras

Este archivo documenta los cambios realizados, las decisiones de diseño tomadas y el estado actual del proyecto **GestorCompras** para garantizar el profesionalismo, la trazabilidad y la continuidad del desarrollo.

---

## 1. ¿Qué estamos haciendo? (Cambios Realizados en la Fase 1)

Hemos completado la **Fase 1** del plan de implementación en la rama de desarrollo `desarrollo-roadmap`. El objetivo principal de esta fase fue sentar las bases visuales y funcionales del frontend, y habilitar el historial de compras personales para los usuarios.

### Archivos Creados e Implementados:
1. **[utils.js](file:///d:/Proyectos/Sistema-de-Transporte_Gestor-de-Compras/SISTEMA-DE-TRANSPORTE-FINAL/lib/utils.js) (Core Utilities):** Funciones centralizadas para formatear importes en Bolivianos (`fmt`) y fechas al estándar local `DD/MM/YYYY HH:MM` (`fmtDate`).
2. **[Badge.jsx](file:///d:/Proyectos/Sistema-de-Transporte_Gestor-de-Compras/SISTEMA-DE-TRANSPORTE-FINAL/components/ui/Badge.jsx) (UI):** Componente para representar estados de forma consistente (ej: Facturado, Efectivo, QR, Devuelto).
3. **[StatCard.jsx](file:///d:/Proyectos/Sistema-de-Transporte_Gestor-de-Compras/SISTEMA-DE-TRANSPORTE-FINAL/components/ui/StatCard.jsx) (UI):** Tarjetas dinámicas para los resúmenes de dinero y conteo de compras.
4. **[Toast.jsx](file:///d:/Proyectos/Sistema-de-Transporte_Gestor-de-Compras/SISTEMA-DE-TRANSPORTE-FINAL/components/ui/Toast.jsx) (UI):** Notificaciones flotantes temporales con animación que informan sobre el éxito o error de las operaciones.
5. **[UploadZone.jsx](file:///d:/Proyectos/Sistema-de-Transporte_Gestor-de-Compras/SISTEMA-DE-TRANSPORTE-FINAL/components/forms/UploadZone.jsx) (UI/Forms):** Zona interactiva de arrastre y carga de imágenes que valida que el archivo sea una imagen y no supere los 5 MB, convirtiéndola automáticamente a Base64 en el cliente.
6. **[TablaCompras.jsx](file:///d:/Proyectos/Sistema-de-Transporte_Gestor-de-Compras/SISTEMA-DE-TRANSPORTE-FINAL/components/tables/TablaCompras.jsx) (UI/Tables):** Componente de tabla que formatea filas de compras de manera limpia, adaptando el renderizado si la vista es del usuario o del administrador.
7. **[ModalDetalle.jsx](file:///d:/Proyectos/Sistema-de-Transporte_Gestor-de-Compras/SISTEMA-DE-TRANSPORTE-FINAL/components/modals/ModalDetalle.jsx) (UI/Modals):** Ventana modal para visualizar el desglose de una compra, adjuntos cargados y detalles de devolución si los hubiera.
8. **[route.js](file:///d:/Proyectos/Sistema-de-Transporte_Gestor-de-Compras/SISTEMA-DE-TRANSPORTE-FINAL/app/api/compras/[id]/route.js) (API):** Endpoint dinámico que une la compra con su respectiva devolución (`LEFT JOIN`) y valida los permisos de acceso del usuario según su rol.
9. **[mis-compras/page.jsx](file:///d:/Proyectos/Sistema-de-Transporte_Gestor-de-Compras/SISTEMA-DE-TRANSPORTE-FINAL/app/(app)/mis-compras/page.jsx) (Páginas):** Implementación completa del historial de compras personales del usuario, con soporte para pestañas de filtrado de tiempo (Hoy, Semana, Mes, Todo), cálculo inmediato de estadísticas e integración de la tabla y modal de detalles.
10. **[Sidebar.jsx](file:///d:/Proyectos/Sistema-de-Transporte_Gestor-de-Compras/SISTEMA-DE-TRANSPORTE-FINAL/components/nav/Sidebar.jsx) y [MobileHeader.jsx](file:///d:/Proyectos/Sistema-de-Transporte_Gestor-de-Compras/SISTEMA-DE-TRANSPORTE-FINAL/components/nav/MobileHeader.jsx) (Navegación):** Estructura del menú lateral y de cabecera móvil responsiva con control de rutas activas mediante React/Next hooks.

### Archivos Refactorizados / Modificados:
1. **[nueva-compra/page.jsx](file:///d:/Proyectos/Sistema-de-Transporte_Gestor-de-Compras/SISTEMA-DE-TRANSPORTE-FINAL/app/(app)/nueva-compra/page.jsx):** Se sustituyeron los inputs de archivos nativos por el componente `UploadZone` y las alertas HTML por el componente `Toast`.
2. **[layout.jsx](file:///d:/Proyectos/Sistema-de-Transporte_Gestor-de-Compras/SISTEMA-DE-TRANSPORTE-FINAL/app/(app)/layout.jsx):** Se adaptó para renderizar el `Sidebar` en pantallas medianas/grandes y el `MobileHeader` en pantallas móviles de forma transparente para el usuario.
3. **[layout.js](file:///d:/Proyectos/Sistema-de-Transporte_Gestor-de-Compras/SISTEMA-DE-TRANSPORTE-FINAL/app/layout.js) (Raíz):** Configuración de idioma (`es`) y metadata descriptiva para el SEO de la aplicación.
4. **[globals.css](file:///d:/Proyectos/Sistema-de-Transporte_Gestor-de-Compras/SISTEMA-DE-TRANSPORTE-FINAL/app/globals.css):** Se agregaron animaciones clave para las transiciones CSS y directivas `@media print` para desactivar elementos innecesarios al imprimir reportes.
5. **[gastos-choferes/page.jsx](file:///d:/Proyectos/Sistema-de-Transporte_Gestor-de-Compras/SISTEMA-DE-TRANSPORTE-FINAL/app/(app)/gastos-choferes/page.jsx):** Se añadió un export básico de React para evitar que el compilador de Next.js falle por archivos vacíos (0 bytes) durante la fase de prerenderizado.

---

## 2. ¿Por qué lo hicimos de esta manera? (Decisiones de Ingeniería)

* **Next.js 16 - Breaking Changes:** La de documentación interna del proyecto destaca que en Next.js 16 el objeto `params` es una Promise asíncrona. Por ende, en la ruta de API `api/compras/[id]` implementamos `const { id } = await params;` para evitar excepciones en producción.
* **Componentización Temprana:** Al iniciar el desarrollo separando componentes reutilizables como `Badge`, `StatCard` y `UploadZone`, evitamos duplicar lógica de estilos Tailwind y validaciones de carga de archivos (que ahora se centralizan en la zona de subida).
* **Seguridad en API Detalle:** La API `/api/compras/[id]` valida activamente si la compra solicitada pertenece al usuario autenticado. Esto previene ataques de enumeración de recursos (ID harvesting), garantizando que un usuario no pueda husmear las compras de otros cambiando el UUID en la petición.
* **Base64 para Imágenes:** Se mantiene la estrategia de almacenar Base64 directo en Postgres para simplificar el hosting. El control estricto de 5MB en `UploadZone` previene que la base de datos se sature rápidamente.

---

## 3. ¿Dónde estamos en el proyecto? (Estado Actual)

* **Compilación:** Exitosa. Ejecutamos el comando `npx next build` y el proyecto compila al 100% de manera estática y dinámica sin advertencias ni errores en ninguna ruta.
* **Control de Versiones:** Los cambios de la Fase 1 han sido confirmados localmente (committed) en la rama `desarrollo-roadmap` para que la rama `main` permanezca intacta y segura.
* **Siguiente Paso (Fase 2):** Implementación del flujo de Devoluciones (API `api/devoluciones` y página `/devoluciones`) y el alta/gestión de Choferes (API `/api/choferes` y página `/choferes`).
