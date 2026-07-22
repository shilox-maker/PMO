## Contexto del Proyecto
- **Descripción:** PMO Control Tower
- **Stack:** Backend (/backend): Core: Node.js con Express. SQLite/Azure SQL Server con ORM:Sequelize. Frontend (/frontend): React 19 (con Vite). Estilos: CSS puro / Diseño limpio, denso y con glassmorphic dark mode para un feeling premium. Componentes Custom: Buscador agrupado autocomplete (Combobox) y Editor WYSIWYG personalizado.

## Reglas Arquitectónicas (KISS & Modularidad)
- **Filosofía KISS:** Prioriza la solución más simple, legible y directa. Evita sobre-ingeniería o abstracciones innecesarias.
- **Tamaño de Archivos:** Mantén un límite estricto de **máximo 300 líneas en frontend y 200 líneas en backend por fichero**. Si una funcionalidad hace que un archivo supere este límite, detente y propón separar la lógica en un nuevo módulo.
- **Responsabilidad Única (SRP):** Desacopla la lógica de negocio, las utilidades y las interfaces/tipos en archivos independientes. No crees "God Files".

## Restricciones de Comportamiento (Control de Tokens)
- **Respuestas Directas:** Sé quirúrgico y conciso. Ve al grano, al código o a la solución sin introducciones ni explicaciones teóricas.
- **Edición Incremental:** Modifica solo las líneas estrictamente necesarias. Prohibido reescribir archivos enteros para cambios menores.
- **Límite de Bucles:** Si un comando de consola (build/test/run) falla 2 veces seguidas, **detén tu ejecución de inmediato** y pide ayuda. No intentes corregirlo a ciegas.
- **Exploración Acotada:** No escanees directorios ni leas archivos fuera del scope de la tarea actual. Usa el índice vectorial del codebase; si dudas, pregunta.
- **Flujo Single-Agent:** No delegues tareas a subagentes ni levantes arquitecturas en paralelo (Swarm) sin orden explícita.

## 🔄 Protocolo de Gestión de Features (Flujo Roadmap)
Tú eres el encargado de mantener la trazabilidad del proyecto utilizando el archivo `docs/roadmap.md`. Sigue estrictamente estas reglas operativas según mis comandos:

1. **Comando: "Analiza la IDEA-XX"**
   - Ve a `docs/roadmap.md`, busca la idea en la sección "1. Bandeja de Entrada".
   - Analiza el código fuente actual del proyecto para evaluar la viabilidad.
   - **Acción:** Mueve el bloque de la idea a la sección "2. En Análisis / Especificación". Añade allí tu análisis técnico detallado, los archivos que se verán afectados y el impacto estimado. *No programes nada aún.*

2. **Comando: "Aprobada la FEATURE-XX" o "Da el OK a FEATURE-XX"** (o "IDEA-XX es OK")
   - **Acción:** Mueve la funcionalidad de la sección "2. En Análisis / Especificación" a la sección "3. Listas para Codificar (Tú les has dado el OK)". Ajusta el formato de los checks correspondientes.

3. **Comando: "Implementa la FEATURE-XX"**
   - Lee la especificación aprobada en la sección "3. Listas para Codificar".
   - Prográmala de forma incremental en el código fuente (siguiendo la norma KISS).
   - **Acción:** Una vez terminada la codificación, mueve la feature a la sección "4. Implementadas" y añade la fecha actual.

4. **Al finalizar la programación de una feature:**
   - Mueve la tarea de la sección "4. Implementadas" a la sección "5. En Testeo / Pruebas".
   - Si la tarea incluye pruebas automatizadas, ejecútalas en la terminal del IDE. Si fallan 2 veces, detén la ejecución y pide intervención humana.

5. **Comando: "Test OK para FEATURE-XX"**
   - Mueve la feature de "5. En Testeo / Pruebas" a "6. Pendiente de Subir (Listo para Git)".

6. **Comando: "Subido FEATURE-XX" (o si el agente tiene permiso para hacer git push):**
   - Mueve la feature a la sección "7. Completado e Integrado (Historial)", marca el check `[x]` y añade la fecha actual.