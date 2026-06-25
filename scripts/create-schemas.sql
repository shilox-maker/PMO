-- ==============================================================================
-- Crear Esquemas y Usuarios para PMO en Azure SQL
-- Ejecutar desde Azure Portal (Query Editor) o SSMS conectado como admin.
-- ==============================================================================

-- 1. Crear esquemas
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'PREPMO')
    EXEC('CREATE SCHEMA PREPMO');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'PROPMO')
    EXEC('CREATE SCHEMA PROPMO');
GO

-- 2. Crear usuario para PRE (cambiar contraseña)
-- NOTA: En Azure SQL, los usuarios se crean en la base de datos, no en el servidor.
CREATE USER pmo_pre_user WITH PASSWORD = 'CAMBIAR_ESTA_PASSWORD_PRE_2026!';
GO

-- Permisos PRE: solo sobre su esquema
ALTER ROLE db_datareader ADD MEMBER pmo_pre_user;
ALTER ROLE db_datawriter ADD MEMBER pmo_pre_user;
GRANT ALTER ON SCHEMA::PREPMO TO pmo_pre_user;
GRANT CREATE TABLE TO pmo_pre_user;
GRANT REFERENCES ON SCHEMA::PREPMO TO pmo_pre_user;
GO

-- 3. Crear usuario para PRO (cambiar contraseña)
CREATE USER pmo_pro_user WITH PASSWORD = 'CAMBIAR_ESTA_PASSWORD_PRO_2026!';
GO

-- Permisos PRO: solo sobre su esquema
ALTER ROLE db_datareader ADD MEMBER pmo_pro_user;
ALTER ROLE db_datawriter ADD MEMBER pmo_pro_user;
GRANT ALTER ON SCHEMA::PROPMO TO pmo_pro_user;
GRANT CREATE TABLE TO pmo_pro_user;
GRANT REFERENCES ON SCHEMA::PROPMO TO pmo_pro_user;
GO

-- ==============================================================================
-- IMPORTANTE: Después de ejecutar este script:
-- 1. Cambiar las contraseñas por unas seguras
-- 2. Anotar las credenciales para los .env del servidor
-- 3. Whitelistear la IP del Windows Server en:
--    Azure Portal → SQL Server → Networking → Add client IP
-- ==============================================================================
