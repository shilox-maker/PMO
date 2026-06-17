## Contexto del Proyecto
- **Descripción:** [Ej: Aplicación RAG local para indexar PDFs de la asociación]
- **Stack:** [Ej: Python, LangChain, Ollama]

## Reglas Arquitectónicas (KISS & Modularidad)
- **Filosofía KISS:** Prioriza la solución más simple, legible y directa. Evita sobre-ingeniería o abstracciones innecesarias.
- **Tamaño de Archivos:** Mantén un límite estricto de **máximo 150-200 líneas por fichero**. Si una funcionalidad hace que un archivo supere este límite, detente y propón separar la lógica en un nuevo módulo.
- **Responsabilidad Única (SRP):** Desacopla la lógica de negocio, las utilidades y las interfaces/tipos en archivos independientes. No crees "God Files".

## Restricciones de Comportamiento (Control de Tokens)
- **Respuestas Directas:** Sé quirúrgico y conciso. Ve al grano, al código o a la solución sin introducciones ni explicaciones teóricas.
- **Edición Incremental:** Modifica solo las líneas estrictamente necesarias. Prohibido reescribir archivos enteros para cambios menores.
- **Límite de Bucles:** Si un comando de consola (build/test/run) falla 2 veces seguidas, **detén tu ejecución de inmediato** y pide ayuda. No intentes corregirlo a ciegas.
- **Exploración Acotada:** No escanees directorios ni leas archivos fuera del scope de la tarea actual. Usa el índice vectorial del codebase; si dudas, pregunta.
- **Flujo Single-Agent:** No delegues tareas a subagentes ni levantes arquitecturas en paralelo (Swarm) sin orden explícita.