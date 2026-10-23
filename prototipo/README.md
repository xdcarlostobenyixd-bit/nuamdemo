# Prototipo NUAM 

Prototipo frontend estático y responsive, sin backend ni persistencia real. Simula los flujos de login por rol, dashboard, carga masiva, validación, mantenedor, filtros, detalle, exportaciones y auditoría.

## Ejecución local

Requiere Python 3. Ejecutar desde esta carpeta:

py -m http.server 3000


Luego abrir `http://localhost:3000`.

El proyecto también puede servirse con cualquier servidor estático. Los datos son referenciales y se reinician al recargar la página.

## Perfiles disponibles

- Administrador: resumen, carga, mantenedor y auditoría.
- Analista tributario: resumen, carga y mantenedor.
- Auditor: resumen, mantenedor y auditoría.

## Evidencia de la rúbrica

El prototipo permite seleccionar un perfil, recorrer navegación diferenciada, simular selección o drag-and-drop de archivo, observar progreso, consultar estados con semáforo, filtrar declaraciones, abrir detalle y ejecutar exportaciones simuladas.
