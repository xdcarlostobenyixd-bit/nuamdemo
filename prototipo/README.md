# NUAM — Prototipo DJ1948

Aplicación web estática y funcional que demuestra el flujo de carga, validación, consulta y auditoría de calificaciones tributarias DJ1948.

## Funcionalidades

- Acceso simulado por tres perfiles: Administrador, Analista tributario y Auditor.
- Navegación y permisos diferenciados según el perfil.
- Carga de archivos CSV o XLSX con límite de 50 MB.
- Validación real de columnas obligatorias, RUT, período, monto y duplicados en CSV.
- Lectura XLSX en el navegador mediante SheetJS.
- Barra de progreso y resultados de válidos, advertencias y rechazados.
- Mantenedor con búsqueda por RUT o declaración, filtros por período y estado.
- Detalle completo de cada declaración y impresión de reporte.
- Exportación real de declaraciones y bitácora a archivos CSV.
- Bitácora de acciones generadas durante la sesión.
- Diseño responsive para escritorio, tablet y móvil.

## Ejecución

Requerir Windows con Python 3 y Node.js:

```powershell
cd C:\Users\Seek\Downloads\POO\nuamdemo\prototipo
py -m http.server 3000 --bind 127.0.0.1
```

Abrir `http://127.0.0.1:3000`.

También puede ejecutarse desde esta carpeta con:

```powershell
npm.cmd start
```

## Validación técnica

```powershell
npm.cmd run check
```

## Uso para la demostración

1. Seleccionar Administrador, Analista tributario o Auditor.
2. Ingresar al resumen y recorrer los módulos disponibles.
3. En Carga masiva, seleccionar un CSV con columnas `rut`, `periodo` y `monto`.
4. Iniciar la validación y revisar el resultado.
5. Abrir Mantenedor, aplicar filtros y consultar un detalle.
6. Exportar el listado o imprimir el reporte.
7. Mostrar Auditoría y exportar la bitácora.

Ejemplo mínimo de CSV:

```csv
rut,periodo,monto
12.345.678-9,2026,12450000
98.765.432-1,2026,4850000
```

## Alcance y limitaciones

El prototipo no utiliza backend ni almacenamiento permanente. Los datos referenciales se reinician al recargar. Las integraciones reales de autenticación, repositorio, motor tributario, firma, cifrado y persistencia quedan definidas como evolución productiva.
