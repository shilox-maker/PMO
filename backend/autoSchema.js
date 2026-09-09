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

    // 0. Sincronizar nombres singulares/plurales de tablas (renombrar sufijos 's' si existen)
    await sequelize.query(`
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Contactos_Proveedors' AND schema_id = SCHEMA_ID('${schema}'))
         AND NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Contactos_Proveedor' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          EXEC sp_rename '[${schema}].[Contactos_Proveedors]', 'Contactos_Proveedor';
      END;

      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Cambios_Alcances' AND schema_id = SCHEMA_ID('${schema}'))
         AND NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Cambios_Alcance' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          EXEC sp_rename '[${schema}].[Cambios_Alcances]', 'Cambios_Alcance';
      END;

      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Comentarios_Proyectos' AND schema_id = SCHEMA_ID('${schema}'))
         AND NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Comentarios_Proyecto' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          EXEC sp_rename '[${schema}].[Comentarios_Proyectos]', 'Comentarios_Proyecto';
      END;

      -- 0.0 Asegurar nulabilidad de teléfono en contactos y proveedores
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Contactos_Proveedor' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Contactos_Proveedor]') AND name = 'telefono' AND is_nullable = 0)
          BEGIN
              ALTER TABLE [${schema}].[Contactos_Proveedor] ALTER COLUMN [telefono] NVARCHAR(255) NULL;
          END;
      END;

      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Proveedores' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Proveedores]') AND name = 'telefono_general' AND is_nullable = 0)
          BEGIN
              ALTER TABLE [${schema}].[Proveedores] ALTER COLUMN [telefono_general] NVARCHAR(255) NULL;
          END;
      END;

      -- 0.00 Asegurar columna uuid_v7 en TODAS las tablas existentes del esquema
      DECLARE @allTblName NVARCHAR(128);
      DECLARE @alterSql NVARCHAR(MAX);
      DECLARE curAllTables CURSOR FOR 
          SELECT t.name 
          FROM sys.tables t 
          INNER JOIN sys.schemas s ON t.schema_id = s.schema_id 
          WHERE s.name = '${schema}';

      OPEN curAllTables;
      FETCH NEXT FROM curAllTables INTO @allTblName;
      WHILE @@FETCH_STATUS = 0
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM sys.columns c 
              INNER JOIN sys.tables t ON c.object_id = t.object_id 
              INNER JOIN sys.schemas s ON t.schema_id = s.schema_id 
              WHERE s.name = '${schema}' AND t.name = @allTblName AND c.name = 'uuid_v7'
          )
          BEGIN
              SET @alterSql = 'ALTER TABLE [' + '${schema}' + '].[' + @allTblName + '] ADD [uuid_v7] UNIQUEIDENTIFIER NULL';
              EXEC(@alterSql);
          END;
          FETCH NEXT FROM curAllTables INTO @allTblName;
      END;
      CLOSE curAllTables;
      DEALLOCATE curAllTables;

      -- 0.1 Asegurar tabla [Tipos_Factura]
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tipos_Factura' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          CREATE TABLE [${schema}].[Tipos_Factura] (
              [id_tipo_factura] INT IDENTITY(1,1) PRIMARY KEY,
              [nombre] NVARCHAR(255) NOT NULL UNIQUE,
              [orden] INT NOT NULL DEFAULT 0,
              [code] NVARCHAR(50) NULL,
              [createdAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
      END;

      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Tipos_Factura' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Tipos_Factura]') AND name = 'orden')
          BEGIN
              ALTER TABLE [${schema}].[Tipos_Factura] ADD [orden] INT NOT NULL CONSTRAINT DF_TiposFactura_orden_${schema} DEFAULT 0;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Tipos_Factura]') AND name = 'code')
          BEGIN
              ALTER TABLE [${schema}].[Tipos_Factura] ADD [code] NVARCHAR(50) NULL;
          END;

          IF NOT EXISTS (SELECT 1 FROM [${schema}].[Tipos_Factura])
          BEGIN
              INSERT INTO [${schema}].[Tipos_Factura] (nombre, orden, code, createdAt, updatedAt)
              VALUES
                ('Consultoría Externa', 1, 'CONSULTORIA', GETDATE(), GETDATE()),
                ('Licencias de Software', 2, 'LICENCIAS', GETDATE(), GETDATE()),
                ('Desarrollos e Integraciones', 3, 'DESARROLLOS', GETDATE(), GETDATE()),
                ('Infraestructura Tecnológica', 4, 'INFRAESTRUCTURA', GETDATE(), GETDATE()),
                ('Migración y Calidad de Datos', 5, 'MIGRACION', GETDATE(), GETDATE()),
                ('Viajes y Desplazamientos', 6, 'VIAJES', GETDATE(), GETDATE()),
                ('Alojamiento', 7, 'ALOJAMIENTO', GETDATE(), GETDATE()),
                ('Dietas y Comidas', 8, 'DIETAS', GETDATE(), GETDATE()),
                ('Formación', 9, 'FORMACION', GETDATE(), GETDATE()),
                ('Hardware y Equipamiento', 10, 'HARDWARE', GETDATE(), GETDATE()),
                ('Recursos Internos', 11, 'INTERNOS', GETDATE(), GETDATE()),
                ('Otros Gastos', 12, 'OTROS', GETDATE(), GETDATE());
          END;
      END;

      -- 0.2 Asegurar columna id_tipo_factura en [Facturas]
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Facturas' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Facturas]') AND name = 'id_tipo_factura')
          BEGIN
              ALTER TABLE [${schema}].[Facturas] ADD [id_tipo_factura] INT NULL;
          END;

          IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Facturas_TiposFactura_${schema}')
             AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Tipos_Factura' AND schema_id = SCHEMA_ID('${schema}'))
          BEGIN
              ALTER TABLE [${schema}].[Facturas] ADD CONSTRAINT FK_Facturas_TiposFactura_${schema}
              FOREIGN KEY ([id_tipo_factura]) REFERENCES [${schema}].[Tipos_Factura]([id_tipo_factura]);
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Facturas]') AND name = 'PO')
          BEGIN
              ALTER TABLE [${schema}].[Facturas] ADD [PO] NVARCHAR(255) NULL;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Facturas]') AND name = 'createdBy')
          BEGIN
              ALTER TABLE [${schema}].[Facturas] ADD [createdBy] INT NULL;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Facturas]') AND name = 'modifiedBy')
          BEGIN
              ALTER TABLE [${schema}].[Facturas] ADD [modifiedBy] INT NULL;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Facturas]') AND name = 'uuid_v7')
          BEGIN
              ALTER TABLE [${schema}].[Facturas] ADD [uuid_v7] UNIQUEIDENTIFIER NULL;
          END;
      END;

      -- 0.3 Asegurar tabla [Estado_Tareas_Plantilla]
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Estado_Tareas_Plantilla' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          CREATE TABLE [${schema}].[Estado_Tareas_Plantilla] (
              [id] INT IDENTITY(1,1) PRIMARY KEY,
              [id_estado] INT NOT NULL FOREIGN KEY REFERENCES [${schema}].[Estados_Proyecto]([id_estado]) ON DELETE CASCADE,
              [nombre_tarea] NVARCHAR(255) NOT NULL,
              [descripcion] NVARCHAR(MAX) NULL,
              [es_hito] BIT NOT NULL DEFAULT 0,
              [orden] INT NOT NULL DEFAULT 0,
              [createdAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
      END;
    `);

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

    // 4. Corregir y sincronizar CHECK/DEFAULT constraints de estado en [Tareas] y columnas faltantes
    await sequelize.query(`
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Tareas' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Tareas]') AND name = 'es_hito')
          BEGIN
              ALTER TABLE [${schema}].[Tareas] ADD [es_hito] BIT NOT NULL CONSTRAINT DF_Tareas_es_hito_${schema} DEFAULT 0;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Tareas]') AND name = 'orden')
          BEGIN
              ALTER TABLE [${schema}].[Tareas] ADD [orden] INT NOT NULL CONSTRAINT DF_Tareas_orden_${schema} DEFAULT 0;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Tareas]') AND name = 'id_responsable')
          BEGIN
              ALTER TABLE [${schema}].[Tareas] ADD [id_responsable] INT NULL;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Tareas]') AND name = 'uuid_v7')
          BEGIN
              ALTER TABLE [${schema}].[Tareas] ADD [uuid_v7] UNIQUEIDENTIFIER NULL;
          END;

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

      -- 5. Asegurar columnas en [Proyectos]
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Proyectos' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Proyectos]') AND name = 'avance_porcentaje')
          BEGIN
              ALTER TABLE [${schema}].[Proyectos] ADD [avance_porcentaje] INT NOT NULL CONSTRAINT DF_Proyectos_avance_${schema} DEFAULT 0;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Proyectos]') AND name = 'url_sharepoint')
          BEGIN
              ALTER TABLE [${schema}].[Proyectos] ADD [url_sharepoint] NVARCHAR(MAX) NULL;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Proyectos]') AND name = 'es_iniciativa_ligera')
          BEGIN
              ALTER TABLE [${schema}].[Proyectos] ADD [es_iniciativa_ligera] BIT NOT NULL CONSTRAINT DF_Proyectos_iniciativa_${schema} DEFAULT 0;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Proyectos]') AND name = 'portfolio_id')
          BEGIN
              ALTER TABLE [${schema}].[Proyectos] ADD [portfolio_id] INT NULL;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Proyectos]') AND name = 'id_ambito')
          BEGIN
              ALTER TABLE [${schema}].[Proyectos] ADD [id_ambito] INT NULL;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Proyectos]') AND name = 'id_workflow')
          BEGIN
              ALTER TABLE [${schema}].[Proyectos] ADD [id_workflow] INT NULL;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Proyectos]') AND name = 'id_tipo_capex')
          BEGIN
              ALTER TABLE [${schema}].[Proyectos] ADD [id_tipo_capex] INT NULL;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Proyectos]') AND name = 'id_subtipo_capex')
          BEGIN
              ALTER TABLE [${schema}].[Proyectos] ADD [id_subtipo_capex] INT NULL;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Proyectos]') AND name = 'codigo_capex')
          BEGIN
              ALTER TABLE [${schema}].[Proyectos] ADD [codigo_capex] NVARCHAR(100) NULL;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Proyectos]') AND name = 'uuid_v7')
          BEGIN
              ALTER TABLE [${schema}].[Proyectos] ADD [uuid_v7] UNIQUEIDENTIFIER NULL;
          END;
      END;

      -- 6. Asegurar columnas y CHECK constraint para [Usuarios]
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Usuarios' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Usuarios]') AND name = 'idioma')
          BEGIN
              ALTER TABLE [${schema}].[Usuarios] ADD [idioma] NVARCHAR(10) NOT NULL CONSTRAINT DF_Usuarios_idioma_${schema} DEFAULT 'es';
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Usuarios]') AND name = 'uuid_v7')
          BEGIN
              ALTER TABLE [${schema}].[Usuarios] ADD [uuid_v7] UNIQUEIDENTIFIER NULL;
          END;

          DECLARE @chkUserPerfil NVARCHAR(256);
          DECLARE curUserChk CURSOR FOR
              SELECT cc.name 
              FROM sys.check_constraints cc
              INNER JOIN sys.tables t ON cc.parent_object_id = t.object_id
              INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
              INNER JOIN sys.columns c ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
              WHERE s.name = '${schema}' AND t.name = 'Usuarios' AND c.name = 'perfil';

          OPEN curUserChk;
          FETCH NEXT FROM curUserChk INTO @chkUserPerfil;
          WHILE @@FETCH_STATUS = 0
          BEGIN
              EXEC('ALTER TABLE [${schema}].[Usuarios] DROP CONSTRAINT [' + @chkUserPerfil + ']');
              FETCH NEXT FROM curUserChk INTO @chkUserPerfil;
          END;
          CLOSE curUserChk;
          DEALLOCATE curUserChk;

          ALTER TABLE [${schema}].[Usuarios] ADD CONSTRAINT CK_Usuarios_perfil_${schema} CHECK ([perfil] IN ('ADMINISTRADOR', 'PM', 'DIRECTOR', 'SOLO_LECTURA'));
      END;

      -- 7. Asegurar columnas en [Riesgos] e [Incidencias]
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Riesgos' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Riesgos]') AND name = 'id_tarea')
          BEGIN
              ALTER TABLE [${schema}].[Riesgos] ADD [id_tarea] VARCHAR(50) NULL;
          END;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Riesgos]') AND name = 'uuid_v7')
          BEGIN
              ALTER TABLE [${schema}].[Riesgos] ADD [uuid_v7] UNIQUEIDENTIFIER NULL;
          END;
      END;

      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Incidencias' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Incidencias]') AND name = 'id_tarea')
          BEGIN
              ALTER TABLE [${schema}].[Incidencias] ADD [id_tarea] VARCHAR(50) NULL;
          END;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Incidencias]') AND name = 'uuid_v7')
          BEGIN
              ALTER TABLE [${schema}].[Incidencias] ADD [uuid_v7] UNIQUEIDENTIFIER NULL;
          END;
      END;

      -- 8. Asegurar columnas en [Comentarios_Proyecto], [Comentarios_Direccion], [Cambios_Alcance], [Lecciones_Aprendidas]
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Comentarios_Proyecto' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Comentarios_Proyecto]') AND name = 'para_direccion')
          BEGIN
              ALTER TABLE [${schema}].[Comentarios_Proyecto] ADD [para_direccion] BIT NOT NULL CONSTRAINT DF_Comentarios_paradirection_${schema} DEFAULT 0;
          END;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Comentarios_Proyecto]') AND name = 'es_importante')
          BEGIN
              ALTER TABLE [${schema}].[Comentarios_Proyecto] ADD [es_importante] BIT NOT NULL CONSTRAINT DF_Comentarios_importante_${schema} DEFAULT 0;
          END;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Comentarios_Proyecto]') AND name = 'editado')
          BEGIN
              ALTER TABLE [${schema}].[Comentarios_Proyecto] ADD [editado] BIT NOT NULL CONSTRAINT DF_Comentarios_editado_${schema} DEFAULT 0;
          END;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Comentarios_Proyecto]') AND name = 'id_usuario_modificacion')
          BEGIN
              ALTER TABLE [${schema}].[Comentarios_Proyecto] ADD [id_usuario_modificacion] INT NULL;
          END;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Comentarios_Proyecto]') AND name = 'fecha_modificacion')
          BEGIN
              ALTER TABLE [${schema}].[Comentarios_Proyecto] ADD [fecha_modificacion] DATETIMEOFFSET NULL;
          END;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Comentarios_Proyecto]') AND name = 'uuid_v7')
          BEGIN
              ALTER TABLE [${schema}].[Comentarios_Proyecto] ADD [uuid_v7] UNIQUEIDENTIFIER NULL;
          END;
      END;

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Comentarios_Direccion' AND schema_id = SCHEMA_ID('${schema}'))
         AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Proyectos' AND schema_id = SCHEMA_ID('${schema}'))
         AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Usuarios' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          CREATE TABLE [${schema}].[Comentarios_Direccion] (
              [id_comentario] INT IDENTITY(1,1) PRIMARY KEY,
              [uuid_v7] UNIQUEIDENTIFIER NULL,
              [id_proyecto] VARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [${schema}].[Proyectos]([id_proyecto]) ON DELETE CASCADE,
              [id_usuario] INT NOT NULL FOREIGN KEY REFERENCES [${schema}].[Usuarios]([id_usuario]),
              [texto_comentario] NVARCHAR(MAX) NOT NULL,
              [es_importante] BIT NOT NULL DEFAULT 0,
              [fecha_registro] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [editado] BIT NOT NULL DEFAULT 0,
              [id_usuario_modificacion] INT NULL FOREIGN KEY REFERENCES [${schema}].[Usuarios]([id_usuario]),
              [fecha_modificacion] DATETIMEOFFSET NULL,
              [createdAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
      END;

      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Comentarios_Direccion' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Comentarios_Direccion]') AND name = 'uuid_v7')
          BEGIN
              ALTER TABLE [${schema}].[Comentarios_Direccion] ADD [uuid_v7] UNIQUEIDENTIFIER NULL;
          END;
      END;

      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Cambios_Alcance' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Cambios_Alcance]') AND name = 'uuid_v7')
          BEGIN
              ALTER TABLE [${schema}].[Cambios_Alcance] ADD [uuid_v7] UNIQUEIDENTIFIER NULL;
          END;
      END;

      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Lecciones_Aprendidas' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Lecciones_Aprendidas]') AND name = 'uuid_v7')
          BEGIN
              ALTER TABLE [${schema}].[Lecciones_Aprendidas] ADD [uuid_v7] UNIQUEIDENTIFIER NULL;
          END;
      END;

      -- 9. Asegurar columnas en [Proveedores]
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Proveedores' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Proveedores]') AND name = 'id_ambito')
          BEGIN
              ALTER TABLE [${schema}].[Proveedores] ADD [id_ambito] INT NULL;
          END;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Proveedores]') AND name = 'tipo_partner')
          BEGIN
              ALTER TABLE [${schema}].[Proveedores] ADD [tipo_partner] NVARCHAR(50) NOT NULL CONSTRAINT DF_Proveedores_tipo_${schema} DEFAULT 'INTEGRADOR_SOFTWARE';
          END;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Proveedores]') AND name = 'uuid_v7')
          BEGIN
              ALTER TABLE [${schema}].[Proveedores] ADD [uuid_v7] UNIQUEIDENTIFIER NULL;
          END;
      END;

      -- 10. Asegurar columnas macro_etapa y descripcion, y CHECK constraint en [Estados_Proyecto]
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Estados_Proyecto' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Estados_Proyecto]') AND name = 'macro_etapa')
          BEGIN
              ALTER TABLE [${schema}].[Estados_Proyecto] ADD [macro_etapa] NVARCHAR(50) NOT NULL CONSTRAINT DF_Estados_macro_${schema} DEFAULT 'EJECUCION';
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Estados_Proyecto]') AND name = 'descripcion')
          BEGIN
              ALTER TABLE [${schema}].[Estados_Proyecto] ADD [descripcion] NVARCHAR(MAX) NULL;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Estados_Proyecto]') AND name = 'code')
          BEGIN
              ALTER TABLE [${schema}].[Estados_Proyecto] ADD [code] NVARCHAR(50) NULL;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Estados_Proyecto]') AND name = 'pasos')
          BEGIN
              ALTER TABLE [${schema}].[Estados_Proyecto] ADD [pasos] NVARCHAR(MAX) NULL;
          END;

          DECLARE @chkMacroEtapa NVARCHAR(256);
          DECLARE curMacroChk CURSOR FOR
              SELECT cc.name 
              FROM sys.check_constraints cc
              INNER JOIN sys.tables t ON cc.parent_object_id = t.object_id
              INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
              INNER JOIN sys.columns c ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
              WHERE s.name = '${schema}' AND t.name = 'Estados_Proyecto' AND c.name = 'macro_etapa';

          OPEN curMacroChk;
          FETCH NEXT FROM curMacroChk INTO @chkMacroEtapa;
          WHILE @@FETCH_STATUS = 0
          BEGIN
              EXEC('ALTER TABLE [${schema}].[Estados_Proyecto] DROP CONSTRAINT [' + @chkMacroEtapa + ']');
              FETCH NEXT FROM curMacroChk INTO @chkMacroEtapa;
          END;
          CLOSE curMacroChk;
          DEALLOCATE curMacroChk;

          ALTER TABLE [${schema}].[Estados_Proyecto] ADD CONSTRAINT CK_Estados_macro_${schema} CHECK ([macro_etapa] IN ('INICIATIVA', 'PLANIFICACION', 'EJECUCION', 'PAUSA', 'CIERRE'));
      END;

      -- 11. Asegurar 13 Estados_Proyecto estándar si la tabla está vacía
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Estados_Proyecto' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM [${schema}].[Estados_Proyecto])
          BEGIN
              INSERT INTO [${schema}].[Estados_Proyecto] (nombre_estado, code, macro_etapa, icono, orden, proyecto_cerrado, pasos)
              VALUES
                ('Petición', 'PETICION', 'INICIATIVA', N'📩', 1, 0, 'Fase inicial en la que se registra la solicitud o idea de proyecto para su evaluación.'),
                ('Estudio de viabilidad', 'ESTUDIO_DE_VIABILIDAD', 'INICIATIVA', N'📋', 2, 0, 'Análisis detallado de los requisitos, costes, beneficios y viabilidad técnica del proyecto.'),
                ('Buscar propuestas', 'BUSCAR_PROPUESTAS', 'INICIATIVA', N'🔍', 3, 0, 'Fase de solicitud y recepción de ofertas o propuestas de proveedores y partners tecnológicos.'),
                ('Tener aprobación', 'TENER_APROBACION', 'PLANIFICACION', N'⏳', 4, 0, 'Período de espera para la revisión y aprobación formal del proyecto por parte del comité de dirección o sponsor.'),
                ('Planificar', 'PLANIFICAR', 'PLANIFICACION', N'📅', 5, 0, 'Elaboración del cronograma detallado, asignación de recursos y definición de entregables del proyecto.'),
                ('Kickoff', 'KICKOFF', 'PLANIFICACION', N'🚀', 6, 0, 'Reunión de lanzamiento oficial del proyecto con todos los stakeholders y el equipo de trabajo.'),
                ('Ejecución', 'EJECUCION', 'EJECUCION', N'🛠️', 7, 0, 'Fase de desarrollo, construcción e implementación de las soluciones definidas en la planificación.'),
                ('Pausado', 'PAUSADO', 'PAUSA', N'⏸️', 8, 0, 'El proyecto se encuentra temporalmente detenido por decisión de la dirección o causas externas.'),
                ('Go Live', 'GO_LIVE', 'EJECUCION', N'📦', 9, 0, 'Puesta en producción de la solución técnica o despliegue final a los usuarios finales.'),
                ('Estabilización', 'ESTABILIZACION', 'EJECUCION', N'🛡️', 10, 0, 'Período de soporte y resolución de incidencias iniciales tras la salida a producción.'),
                ('Cierre', 'CIERRE', 'CIERRE', N'🏁', 11, 1, 'Formalización de la entrega, evaluación de resultados y cierre administrativo del proyecto.'),
                ('Descartado', 'DESCARTADO', 'CIERRE', N'🗑️', 12, 1, 'Proyectos que tras el estudio de viabilidad o análisis inicial no se consideran viables o necesarios.'),
                ('Cancelado', 'CANCELADO', 'CIERRE', N'❌', 13, 1, 'Proyectos iniciados que se interrumpen y finalizan definitivamente antes de su conclusión planificada.');
          END;
      END;

      -- 12. Asegurar Sedes si la tabla está vacía y columnas code/orden
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Sedes' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Sedes]') AND name = 'orden')
          BEGIN
              ALTER TABLE [${schema}].[Sedes] ADD [orden] INT NOT NULL CONSTRAINT DF_Sedes_orden_${schema} DEFAULT 0;
          END;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Sedes]') AND name = 'code')
          BEGIN
              ALTER TABLE [${schema}].[Sedes] ADD [code] NVARCHAR(50) NULL;
          END;

          IF NOT EXISTS (SELECT 1 FROM [${schema}].[Sedes])
          BEGIN
              INSERT INTO [${schema}].[Sedes] (nombre_sede, code, orden, createdAt, updatedAt)
              VALUES
                ('Corporate', 'CORPORATE', 1, GETDATE(), GETDATE()),
                ('UK', 'UK', 2, GETDATE(), GETDATE()),
                ('Sevilla', 'SEVILLA', 3, GETDATE(), GETDATE()),
                ('Valencia', 'VALENCIA', 4, GETDATE(), GETDATE()),
                ('Portugal', 'PORTUGAL', 5, GETDATE(), GETDATE()),
                ('Molendum', 'MOLENDUM', 6, GETDATE(), GETDATE()),
                ('Polonia', 'POLONIA', 7, GETDATE(), GETDATE()),
                ('Ucrania', 'UCRANIA', 8, GETDATE(), GETDATE());
          END;
      END;

      -- 13. Asegurar tabla [Ambitos]
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Ambitos' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          CREATE TABLE [${schema}].[Ambitos] (
              [id_ambito] INT IDENTITY(1,1) PRIMARY KEY,
              [uuid_v7] UNIQUEIDENTIFIER NULL,
              [nombre] NVARCHAR(255) NOT NULL,
              [code] NVARCHAR(50) NOT NULL UNIQUE,
              [descripcion] NVARCHAR(MAX) NULL,
              [icono] NVARCHAR(50) NULL,
              [color] NVARCHAR(50) NULL,
              [activo] BIT NOT NULL DEFAULT 1,
              [createdAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
      END;

      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Ambitos' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM [${schema}].[Ambitos])
          BEGIN
              INSERT INTO [${schema}].[Ambitos] (nombre, code, descripcion, icono, color, activo, createdAt, updatedAt)
              VALUES ('IT Global', 'IT_GLOBAL', 'Ámbito tecnológico corporativo', 'Laptop', '#10B981', 1, GETDATE(), GETDATE());
          END;
      END;

      -- 13.1 Asegurar tabla [Portfolios] y [Portfolio_Budgets]
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Portfolios' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          CREATE TABLE [${schema}].[Portfolios] (
              [id] INT IDENTITY(1,1) PRIMARY KEY,
              [uuid_v7] UNIQUEIDENTIFIER NULL,
              [id_ambito] INT NULL,
              [nombre] NVARCHAR(255) NOT NULL UNIQUE,
              [descripcion] NVARCHAR(MAX) NULL,
              [code] NVARCHAR(50) NULL,
              [color] NVARCHAR(50) NULL,
              [createdAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
      END;

      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Portfolios' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Portfolios]') AND name = 'uuid_v7')
          BEGIN
              ALTER TABLE [${schema}].[Portfolios] ADD [uuid_v7] UNIQUEIDENTIFIER NULL;
          END;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Portfolios]') AND name = 'id_ambito')
          BEGIN
              ALTER TABLE [${schema}].[Portfolios] ADD [id_ambito] INT NULL;
          END;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Portfolios]') AND name = 'code')
          BEGIN
              ALTER TABLE [${schema}].[Portfolios] ADD [code] NVARCHAR(50) NULL;
          END;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Portfolios]') AND name = 'color')
          BEGIN
              ALTER TABLE [${schema}].[Portfolios] ADD [color] NVARCHAR(50) NULL;
          END;
      END;

      -- 14. Asegurar tabla [Workflows]
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Workflows' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          CREATE TABLE [${schema}].[Workflows] (
              [id] INT IDENTITY(1,1) PRIMARY KEY,
              [uuid_v7] UNIQUEIDENTIFIER NULL,
              [nombre] NVARCHAR(255) NOT NULL,
              [code] NVARCHAR(50) NOT NULL UNIQUE,
              [descripcion] NVARCHAR(MAX) NULL,
              [id_ambito] INT NULL,
              [is_default] BIT NOT NULL DEFAULT 0,
              [activo] BIT NOT NULL DEFAULT 1,
              [createdAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
      END;

      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Workflows' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM [${schema}].[Workflows])
          BEGIN
              INSERT INTO [${schema}].[Workflows] (nombre, code, descripcion, is_default, activo, createdAt, updatedAt)
              VALUES ('Flujo Estándar', 'FLUJO_ESTANDAR', 'Ciclo de vida estándar de 13 fases PMO', 1, 1, GETDATE(), GETDATE());
          END;
      END;

      -- 15. Asegurar tabla [Workflow_Estados]
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Workflow_Estados' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          CREATE TABLE [${schema}].[Workflow_Estados] (
              [id] INT IDENTITY(1,1) PRIMARY KEY,
              [id_workflow] INT NOT NULL FOREIGN KEY REFERENCES [${schema}].[Workflows]([id]) ON DELETE CASCADE,
              [id_estado] INT NOT NULL FOREIGN KEY REFERENCES [${schema}].[Estados_Proyecto]([id_estado]) ON DELETE CASCADE,
              [orden] INT NOT NULL DEFAULT 0,
              [createdAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
      END;

      -- 16. Asegurar enlaces en Workflow_Estados para Flujo Estándar si está vacío
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Workflow_Estados' AND schema_id = SCHEMA_ID('${schema}'))
         AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Workflows' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM [${schema}].[Workflow_Estados])
          BEGIN
              DECLARE @defaultWfId INT;
              SELECT TOP 1 @defaultWfId = id FROM [${schema}].[Workflows] WHERE nombre = 'Flujo Estándar' OR is_default = 1;
              IF @defaultWfId IS NOT NULL
              BEGIN
                  INSERT INTO [${schema}].[Workflow_Estados] (id_workflow, id_estado, orden)
                  SELECT @defaultWfId, id_estado, orden
                  FROM [${schema}].[Estados_Proyecto];
              END;
          END;
      END;

      -- 17. Asegurar tablas [Portfolios], [Tags], [Proyecto_Tags]
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Portfolios' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          CREATE TABLE [${schema}].[Portfolios] (
              [id] INT IDENTITY(1,1) PRIMARY KEY,
              [uuid_v7] UNIQUEIDENTIFIER NULL,
              [nombre] NVARCHAR(255) NOT NULL,
              [descripcion] NVARCHAR(MAX) NULL,
              [id_responsable] INT NULL,
              [id_ambito] INT NULL,
              [color] NVARCHAR(50) NULL,
              [activo] BIT NOT NULL DEFAULT 1,
              [createdAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
      END;

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tags' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          CREATE TABLE [${schema}].[Tags] (
              [id] INT IDENTITY(1,1) PRIMARY KEY,
              [nombre] NVARCHAR(100) NOT NULL UNIQUE,
              [color] NVARCHAR(50) NULL,
              [id_ambito] INT NULL,
              [createdAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
      END;

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Proyecto_Tags' AND schema_id = SCHEMA_ID('${schema}'))
         AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Proyectos' AND schema_id = SCHEMA_ID('${schema}'))
         AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Tags' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          CREATE TABLE [${schema}].[Proyecto_Tags] (
              [id_proyecto] VARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [${schema}].[Proyectos]([id_proyecto]) ON DELETE CASCADE,
              [id_tag] INT NOT NULL FOREIGN KEY REFERENCES [${schema}].[Tags]([id]) ON DELETE CASCADE,
              [createdAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY ([id_proyecto], [id_tag])
          );
      END;

      -- 18. Asegurar tablas [Tipos_Capex], [Subtipos_Capex]
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tipos_Capex' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          CREATE TABLE [${schema}].[Tipos_Capex] (
              [id] INT IDENTITY(1,1) PRIMARY KEY,
              [uuid_v7] UNIQUEIDENTIFIER NULL,
              [nombre] NVARCHAR(255) NOT NULL,
              [descripcion] NVARCHAR(MAX) NULL,
              [code] NVARCHAR(50) NULL,
              [id_ambito] INT NULL,
              [activo] BIT NOT NULL DEFAULT 1,
              [createdAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
      END;

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Subtipos_Capex' AND schema_id = SCHEMA_ID('${schema}'))
         AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Tipos_Capex' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          CREATE TABLE [${schema}].[Subtipos_Capex] (
              [id] INT IDENTITY(1,1) PRIMARY KEY,
              [uuid_v7] UNIQUEIDENTIFIER NULL,
              [id_tipo_capex] INT NOT NULL FOREIGN KEY REFERENCES [${schema}].[Tipos_Capex]([id]) ON DELETE CASCADE,
              [nombre] NVARCHAR(255) NOT NULL,
              [descripcion] NVARCHAR(MAX) NULL,
              [code] NVARCHAR(50) NULL,
              [activo] BIT NOT NULL DEFAULT 1,
              [createdAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
      END;

      -- 19. Asegurar tablas [Encuestas_Calidad], [System_Config], [Kpi_Snapshots]
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Encuestas_Calidad' AND schema_id = SCHEMA_ID('${schema}'))
         AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Proyectos' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          CREATE TABLE [${schema}].[Encuestas_Calidad] (
              [id] INT IDENTITY(1,1) PRIMARY KEY,
              [uuid_v7] UNIQUEIDENTIFIER NULL,
              [id_proyecto] VARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [${schema}].[Proyectos]([id_proyecto]) ON DELETE CASCADE,
              [puntuacion_general] INT NOT NULL DEFAULT 5,
              [puntuacion_calidad] INT NOT NULL DEFAULT 5,
              [puntuacion_plazos] INT NOT NULL DEFAULT 5,
              [puntuacion_comunicacion] INT NOT NULL DEFAULT 5,
              [comentarios] NVARCHAR(MAX) NULL,
              [evaluador_nombre] NVARCHAR(255) NULL,
              [evaluador_cargo] NVARCHAR(255) NULL,
              [fecha_encuesta] DATE NOT NULL DEFAULT CAST(CURRENT_TIMESTAMP AS DATE),
              [createdAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
      END;

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'System_Config' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          CREATE TABLE [${schema}].[System_Config] (
              [id] INT IDENTITY(1,1) PRIMARY KEY,
              [clave] NVARCHAR(100) NOT NULL UNIQUE,
              [valor] NVARCHAR(MAX) NOT NULL,
              [descripcion] NVARCHAR(MAX) NULL,
              [tipo] NVARCHAR(50) NOT NULL DEFAULT 'STRING',
              [categoria] NVARCHAR(50) NOT NULL DEFAULT 'GENERAL',
              [createdAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
      END;

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Kpi_Snapshots' AND schema_id = SCHEMA_ID('${schema}'))
      BEGIN
          CREATE TABLE [${schema}].[Kpi_Snapshots] (
              [id] INT IDENTITY(1,1) PRIMARY KEY,
              [fecha] DATE NOT NULL,
              [ambito] NVARCHAR(50) NOT NULL DEFAULT 'GLOBAL',
              [metricas] NVARCHAR(MAX) NOT NULL,
              [createdAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
              [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
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
