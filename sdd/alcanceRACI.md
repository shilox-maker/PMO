## 1. Objetivo
Evolucionar la asignación de "Key Users" en los proyectos hacia un sistema de Gobernanza avanzado mediante una Matriz RACI (Responsible, Accountable, Consulted, Informed). Se permitirá asignar a cada persona un Rol funcional específico y su nivel de responsabilidad en el proyecto, mejorando la claridad organizativa y la rendición de cuentas.

## 2. Impacto y Conflictos
*   **Modifica (BBDD):** La tabla intermedia que relaciona `Proyectos` y `Key_Users` (ej. `Proyecto_KeyUsers`). Pasa de ser una relación simple a una relación con metadatos.
*   **Modifica (UI):** La sección de "Key Users involucrados" dentro del detalle del proyecto. El componente de asignación (Combobox predictivo) requerirá pasos adicionales (formulario).
*   **Añade (Migración):** Un script de Sequelize (`umzug`) que altere la tabla intermedia existente. A los Key Users ya asignados históricamente se les asignará por defecto el rol "Key User Local" y el RACI "C" (Consulted) para no romper la aplicación.

## 3. Modelo de Datos / Estructura (SQLite)
Se debe definir explícitamente el modelo de la tabla intermedia `Proyecto_KeyUsers` en Sequelize con los siguientes atributos:
*   `proyecto_id` (FK -> Proyectos)
*   `key_user_id` (FK -> Key_Users)
*   `rol` (STRING/ENUM): Valores permitidos estrictos: `Key User Local`, `Key User Corporativo`, `PM principal`, `PM partner`, `PM local`, `Sponsor`, `PMO`, `BRM`, `Especialista IT`, `Usuario funcional`.
*   `raci` (STRING): Cadena de texto que almacena las siglas seleccionadas (ej. `R`, `RA`, `RACI`, `I`, `C`).

## 4. Criterios de Aceptación (BDD)

**Escenario 1: Asignación de un participante con Matriz RACI**
*   **Dado que** un Project Manager está en la ficha de un Proyecto y busca a un usuario en el "Buscador predictivo Combobox"...
*   **Cuando** selecciona a una persona (ej. "Ana Gámez")...
*   **Entonces** el sistema no la guarda inmediatamente, sino que despliega un pequeño formulario en línea o modal que exige seleccionar un "Rol" (de la lista de 10 roles definidos) y permite marcar 4 checkboxes independientes: [R]esponsible, [A]ccountable, [C]onsulted, [I]nformed.
*   **Y Cuando** el PM guarda la selección...
*   **Entonces** el backend registra la asociación y la interfaz se actualiza mostrando la nueva asignación con su nomenclatura RACI.

**Escenario 2: Visualización de la Matriz en el Proyecto**
*   **Dado que** el proyecto tiene varios participantes asignados...
*   **Cuando** el PM revisa la sección de Participantes/Key Users...
*   **Entonces** el diseño visual muestra una lista clara o tabla estructurada con el formato: `[Avatar/Nombre] --> [Rol] --> [Etiquetas RACI]`. 
*   *(Ejemplo visual: Juan López --> Key User Principal --> RACI).*

**Escenario 3: Edición y Actualización de Roles**
*   **Dado que** las responsabilidades de un proyecto pueden cambiar...
*   **Cuando** el PM hace clic sobre un participante ya asignado en la matriz...
*   **Entonces** puede editar rápidamente su Rol o modificar los checkboxes RACI, actualizando la base de datos sin necesidad de eliminar y volver a añadir a la persona.

**Escenario 4: Protección de Datos Históricos (Migración)**
*   **Dado que** se ejecuta `npm run migrate` para aplicar este cambio en el servidor...
*   **Cuando** el sistema actualiza la base de datos...
*   **Entonces** todos los proyectos que ya tenían Key Users asignados previamente conservan a sus participantes, inyectando automáticamente el rol "Usuario funcional" y el valor RACI "I" para mantener la consistencia de los datos.