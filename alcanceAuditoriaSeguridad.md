# Alcance: Política Estricta de Contraseñas (Password Strength)

## 1. Objetivo
Garantizar un alto nivel de seguridad en el acceso a la plataforma estableciendo una política de contraseñas robusta. Se exigirá obligatoriamente que cualquier contraseña nueva cumpla con criterios de longitud mínima y complejidad tipográfica (mayúsculas, minúsculas, números y caracteres especiales).

## 2. Impacto y Conflictos
*   **Modifica:** Reemplaza y [DEPRECA] el "Escenario 2" del documento `alcanceAuditoriaSeguridad.md`.
*   **Backend (Node.js/Express):** Modificación del middleware o controlador que gestiona la creación de usuarios y el restablecimiento de contraseñas para incluir una validación mediante Expresión Regular (RegEx) estricta antes de aplicar el algoritmo de encriptación SHA-256.
*   **Frontend (React 19):** Los formularios de gestión de usuarios (exclusivos para el perfil ADMINISTRADOR) deben incluir validación en tiempo real e informar al usuario si la contraseña no cumple con la nueva política.

## 3. Modelo de Datos / Estructura
*   **Sin impacto en BBDD:** La entidad `Usuarios` en SQLite continuará almacenando únicamente el `password_hash` y el `password_salt`. Esta mejora es puramente de lógica de validación (Business Logic).

## 4. Criterios de Aceptación (BDD)

**Escenario 1: Validación visual en el Frontend (React 19)**
*   **Dado que** un usuario Administrador está escribiendo una nueva contraseña en el formulario...
*   **Cuando** el valor ingresado no cumpla con: longitud mínima de 10 caracteres, al menos una letra mayúscula, al menos una letra minúscula, al menos un número y al menos un carácter especial (ej. !@#$%^&*)...
*   **Entonces** el formulario debe mostrar un mensaje de error claro listando los requisitos faltantes y el botón de "Guardar/Crear" debe permanecer deshabilitado.

**Escenario 2: Rechazo de contraseña débil en el Backend (Protección de API)**
*   **Dado que** se envía una petición (POST/PUT) al backend de Express para guardar una contraseña...
*   **Cuando** el payload contiene una contraseña que no cumple con la política estricta de complejidad (10 caracteres, mayúscula, minúscula, número, especial)...
*   **Entonces** el backend debe abortar el proceso de encriptación (SHA-256) y devolver un código HTTP 400 (Bad Request) con el mensaje de error: "La contraseña no cumple con la política de seguridad requerida".

**Escenario 3: Aceptación y Encriptación**
*   **Dado que** se recibe una petición con una contraseña válida según las nuevas reglas...
*   **Cuando** pasa la validación estricta...
*   **Entonces** el backend procederá a generar el `password_salt`, concatenarlo, generar el `password_hash` y almacenarlo en la base de datos de forma segura.