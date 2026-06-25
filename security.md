# 🔒 Seguridad en PMO Control Tower

Este documento detalla las directivas, mecanismos y características de seguridad implementadas en la plataforma **PMO Control Tower** para garantizar la integridad, confidencialidad y disponibilidad de la información en entornos locales y corporativos.

---

## 🛡️ 1. Control de Accesos y Autenticación (JWT)

* **Sesiones sin Estado**: Se utiliza **JSON Web Tokens (JWT)** para la gestión y autorización de sesiones en la API.
* **Expiración de Tokens**: Los tokens generados expiran automáticamente a las **24 horas** de su emisión.
* **Protección Global Activa**: El middleware de autenticación (`verifyToken`) se ejecuta globalmente antes de cargar las rutas de la API, bloqueando por defecto cualquier endpoint no autorizado (excepto `/api/login`).
* **Roles y Permisos (RBAC)**: El acceso a las funciones de administración y configuración del sistema está estrictamente restringido a usuarios con el perfil `ADMINISTRADOR` mediante el middleware `restrictToAdmin`.
* **Control de Cuentas Activas**: Si un usuario es marcado como inactivo (`activo = false`), sus peticiones son denegadas inmediatamente incluso si presenta un token temporal válido.

---

## 🔑 2. Políticas y Hashing de Contraseñas

* **Algoritmo de Hashing Seguro**: Las contraseñas se almacenan cifradas utilizando **Bcrypt** con generación automática de salt, impidiendo su recuperación en texto plano en caso de filtración de la base de datos.
* **Migración Automática**: El backend migra de manera silenciosa las contraseñas heredadas que utilizaban algoritmos SHA-256 a Bcrypt en el momento en que el usuario realiza un login válido.
* **Directivas de Complejidad**: Se valida en el registro y cambio de credenciales una longitud mínima de **10 caracteres**, que combine obligatoriamente mayúsculas, minúsculas, números y caracteres especiales.

---

## 🌐 3. Protección de la API y Mitigación de Ataques

* **Helmet (Cabeceras HTTP Seguras)**: El servidor implementa `helmet()` para configurar cabeceras de respuesta que previenen vulnerabilidades del lado del navegador como:
  * Cross-Site Scripting (XSS).
  * Clickjacking.
  * MIME Sniffing.
* **Limitador de Tasa (Anti-Brute Force)**: El endpoint de autenticación `/api/login` limita el tráfico a un máximo de **10 peticiones cada 15 minutos por dirección IP**.
* **CORS Acotado**: Las solicitudes externas están limitadas exclusivamente a la URL definida en `FRONTEND_URL` y localhost durante desarrollo, previniendo solicitudes de scripts no autorizados (Cross-Origin).
* **Proxy de Confianza**: Configurado de forma segura (`app.set('trust proxy', 1)`) para permitir el correcto análisis de la dirección IP cliente detrás de un balanceador de carga o un proxy inverso (como IIS o Cloudflare).

---

## 🗄️ 4. Seguridad de Datos e Inyecciones

* **Consultas Parametrizadas (ORM)**: Toda la interacción con la base de datos se realiza a través de **Sequelize ORM**, el cual utiliza sentencias preparadas y consultas parametrizadas, neutralizando por completo ataques de **Inyección SQL**.
* **Sanitización de Datos de Salida**: Las consultas de usuarios omiten de forma explícita del payload de respuesta la contraseña encriptada y el salt de seguridad.

---

## 💾 5. Seguridad en Operaciones (Despliegues y Backups)

* **Aislamiento en Azure SQL**: Los entornos de Preproducción (`PREPMO`) y Producción (`PROPMO`) operan en esquemas independientes y con credenciales de usuario diferenciadas en Azure SQL Server.
* **Exclusión de Secretos y Volcados**: El archivo `.gitignore` está configurado para evitar la subida de:
  * Archivos de entorno y credenciales (`.env`).
  * Bases de datos locales de desarrollo (`*.db`, `*.sqlite`).
  * Carpetas de snapshots/copias de seguridad de base de datos (`backups/`).
* **Restauración Transaccional**: La utilidad de backup y restauración ante fallos de despliegue envuelve las escrituras dentro de una transacción SQL integral; cualquier fallo aborta la operación completa para evitar corrupción de datos.
