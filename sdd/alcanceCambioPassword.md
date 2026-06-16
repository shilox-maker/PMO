# Alcance: Funcionalidad de Cambio de Contraseña por el Usuario

## 1. Objetivo
Dotar a cualquier usuario logueado (independientemente de su perfil: PM, DIRECTOR o ADMINISTRADOR) de la capacidad de cambiar su propia contraseña directamente desde la interfaz de usuario. La acción estará accesible en el menú del perfil situado en la esquina superior derecha y requerirá la validación de la contraseña actual del usuario.

## 2. Impacto y Conflictos
*   **Extiende:** El documento `alcanceAuditoriaSeguridad.md`. El nuevo formulario debe heredar obligatoriamente las validaciones de complejidad de contraseña estricta allí definidas.
*   **Frontend (React 19):** Modificación del componente de navegación principal (Header / Navbar) en la zona superior derecha para incluir un menú desplegable en el icono/avatar del usuario. Creación de un nuevo componente modal `ChangePasswordModal`.
*   **Backend (Node.js/Express):** Creación de un nuevo endpoint privado (ej. `PUT /api/users/me/change-password`) protegido por el middleware de autenticación de sesión actual.

## 3. Modelo de Datos / Estructura
*   **Sin impacto estructural en BBDD (SQLite):** Se sigue operando sobre la entidad `Usuarios`, actualizando los campos `password_hash` y `password_salt` existentes en la arquitectura de seguridad.

## 4. Criterios de Aceptación (BDD)

**Escenario 1: Acceso a la funcionalidad desde la UI**
*   **Dado que** un usuario ha iniciado sesión y visualiza el Dashboard de la PMO...
*   **Cuando** hace clic en su nombre/perfil en la esquina superior derecha...
*   **Entonces** se despliega un menú con la opción "Cambiar Contraseña". Al pulsarla, se abre un modal con tres campos: "Contraseña Actual", "Nueva Contraseña" y "Confirmar Nueva Contraseña".

**Escenario 2: Validación de nueva contraseña (Frontend)**
*   **Dado que** el usuario está rellenando el modal de cambio de contraseña...
*   **Cuando** la "Nueva Contraseña" no cumple con la política estricta (10 caracteres, mayúscula, minúscula, número, especial) o el campo "Confirmar Nueva Contraseña" no coincide...
*   **Entonces** el botón de "Actualizar" se mantiene deshabilitado y se muestra un mensaje de error detallando la regla infringida o la discrepancia.

**Escenario 3: Validación de la contraseña actual (Backend)**
*   **Dado que** el usuario envía el formulario con datos válidos...
*   **Cuando** el backend procesa la petición...
*   **Entonces** extrae la "Contraseña Actual" en texto plano, la concatena con el `password_salt` almacenado del usuario en la base de datos y le aplica el algoritmo SHA-256. Si el resultado no coincide con el `password_hash` guardado, rechaza la operación con un HTTP 401 (Unauthorized) y el mensaje "La contraseña actual es incorrecta".

**Escenario 4: Actualización exitosa y regeneración de seguridad**
*   **Dado que** el backend verifica que la contraseña actual es correcta...
*   **Cuando** se procede a guardar la nueva contraseña...
*   **Entonces** el sistema debe generar un **NUEVO** `password_salt` aleatorio, aplicarlo a la nueva contraseña junto con el algoritmo SHA-256 para generar un nuevo `password_hash`, guardar ambos valores en la base de datos SQLite y devolver un HTTP 200 (OK) con un mensaje de éxito para que el frontend cierre el modal y notifique al usuario.