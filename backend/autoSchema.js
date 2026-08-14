'use strict';
const logger = require('./config/logger');

async function ensureSchemaConsistency(sequelize) {
  const isMssql = sequelize.options.dialect === 'mssql' || process.env.DB_DIALECT === 'mssql';
  const schema = process.env.DB_SCHEMA || sequelize.options.define?.schema;

  if (!isMssql || !schema) {
    return;
  }

  try {
    logger.info(`🔍 [Auto-Schema] Verificando consistencia de tablas y restricciones en esquema [${schema}]...`);

    // 1. Asegurar tabla [Planes_Comunicacion]
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Planes_Comunicacion' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          CREATE TABLE [${schema}].[Planes_Comunicacion] (
              [id] INT IDENTITY(1,1) PRIMARY KEY,
              [id_proyecto] VARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [${schema}].[Proyectos]([id_proyecto]) ON DELETE CASCADE,
              [titulo] NVARCHAR(255) NOT NULL,
              [finalidad] NVARCHAR(MAX) NULL,
              [periodicidad] NVARCHAR(20) NOT NULL DEFAULT 'SEMANAL',
              [intervalo] INT NOT NULL DEFAULT 1,
              [dia_semana] INT NULL,
              [dia_mes] INT NULL,
              [activo] BIT NOT NULL DEFAULT 1,
              [createdAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
      END;
    `);

    // 2. Asegurar tabla [Plan_Comunicacion_Contacto]
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Plan_Comunicacion_Contacto' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          CREATE TABLE [${schema}].[Plan_Comunicacion_Contacto] (
              [id] INT IDENTITY(1,1) PRIMARY KEY,
              [id_plan_comunicacion] INT NOT NULL FOREIGN KEY REFERENCES [${schema}].[Planes_Comunicacion]([id]) ON DELETE CASCADE,
              [id_contacto] INT NOT NULL FOREIGN KEY REFERENCES [${schema}].[Contactos_Proveedor]([id_contacto]) ON DELETE CASCADE,
              [createdAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
      END;
    `);

    // 3. Asegurar tabla [Plan_Comunicacion_Log]
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Plan_Comunicacion_Log' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          CREATE TABLE [${schema}].[Plan_Comunicacion_Log] (
              [id] INT IDENTITY(1,1) PRIMARY KEY,
              [id_plan_comunicacion] INT NULL FOREIGN KEY REFERENCES [${schema}].[Planes_Comunicacion]([id]) ON DELETE SET NULL,
              [id_proyecto] VARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [${schema}].[Proyectos]([id_proyecto]) ON DELETE CASCADE,
              [id_usuario] INT NULL FOREIGN KEY REFERENCES [${schema}].[Usuarios]([id_usuario]) ON DELETE SET NULL,
              [fecha_envio] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [destinatarios] NVARCHAR(MAX) NULL,
              [observaciones] NVARCHAR(MAX) NULL,
              [createdAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
      END;
    `);

    // 4. Corregir y sincronizar CHECK/DEFAULT constraints de estado en [Tareas]
    await sequelize.query(`
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Tareas' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          DECLARE @chkName NVARCHAR(256);
          DECLARE curChk CURSOR FOR
              SELECT cc.name 
              FROM sys.check_constraints cc
              INNER JOIN sys.tables t ON cc.parent_object_id = t.object_id
              INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
              INNER JOIN sys.columns c ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
              WHERE s.name = '${schema}' AND t.name = 'Tareas' AND c.name = 'estado';

          OPEN curChk;
          FETCH NEXT FROM curChk INTO @chkName;
          WHILE @@FETCH_STATUS = 0
          BEGIN
              EXEC('ALTER TABLE [${schema}].[Tareas] DROP CONSTRAINT [' + @chkName + ']');
              FETCH NEXT FROM curChk INTO @chkName;
          END;
          CLOSE curChk;
          DEALLOCATE curChk;

          DECLARE @dfName NVARCHAR(256);
          DECLARE curDf CURSOR FOR
              SELECT df.name 
              FROM sys.default_constraints df
              INNER JOIN sys.tables t ON df.parent_object_id = t.object_id
              INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
              INNER JOIN sys.columns c ON df.parent_object_id = c.object_id AND df.parent_column_id = c.column_id
              WHERE s.name = '${schema}' AND t.name = 'Tareas' AND c.name = 'estado';

          OPEN curDf;
          FETCH NEXT FROM curDf INTO @dfName;
          WHILE @@FETCH_STATUS = 0
          BEGIN
              EXEC('ALTER TABLE [${schema}].[Tareas] DROP CONSTRAINT [' + @dfName + ']');
              FETCH NEXT FROM curDf INTO @dfName;
          END;
          CLOSE curDf;
          DEALLOCATE curDf;

          ALTER TABLE [${schema}].[Tareas] ALTER COLUMN [estado] NVARCHAR(50) NOT NULL;

          UPDATE [${schema}].[Tareas] SET [estado] = 'SIN INICIAR' WHERE UPPER([estado]) = 'PENDIENTE';

          ALTER TABLE [${schema}].[Tareas] ADD CONSTRAINT DF_Tareas_estado_${schema} DEFAULT 'SIN INICIAR' FOR [estado];
          ALTER TABLE [${schema}].[Tareas] ADD CONSTRAINT CK_Tareas_estado_${schema} CHECK ([estado] IN ('SIN INICIAR', 'EN CURSO', 'COMPLETADA'));
      END;
    `);

    logger.info(`✅ [Auto-Schema] Esquema [${schema}] sincronizado y restricciones actualizadas.`);
  } catch (err) {
    logger.warn(`⚠️ [Auto-Schema] Advertencia sincronizando restricciones en Azure SQL: ${err.message}`);
  }
}

module.exports = {
  ensureSchemaConsistency
};
