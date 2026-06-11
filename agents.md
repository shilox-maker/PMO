## Contexto del Proyecto
- **Descripción:** [Ej: Aplicación RAG local para indexar PDFs de la asociación]
- **Stack:** [Ej: Python, LangChain, Ollama]

## Restricciones de Comportamiento (Control de Tokens)
- **Respuestas directas:** Sé extremadamente conciso. Ve directo al grano, al código o a la solución sin dar explicaciones teóricas ni introducciones detalladas.
- **Edición incremental:** Modifica únicamente las líneas de código estrictamente necesarias. Evita reescribir archivos completos si el cambio es menor.
- **Límite de bucles autónomos:** Si una tarea o comando de consola (build/test) falla 2 veces seguidas, detén tu ejecución de inmediato y pide intervención humana. No intentes corregirlo a ciegas en bucles infinitos.
- **Contexto acotado:** No escanees directorios ni leas archivos que no estén directamente relacionados con el archivo objetivo o la directiva actual. Si dudas, pregunta antes de explorar.
- **Flujo Single-Agent:** No delegues tareas a subagentes ni levantes arquitecturas en paralelo (Swarm) a menos que te lo ordene explícitamente.