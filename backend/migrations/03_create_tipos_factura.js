'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';

    const originalCreateTable = queryInterface.createTable.bind(queryInterface);

    const createTable = async (tableName, attributes, options) => {
      if (isSqlite) {
        return originalCreateTable(tableName, attributes, options);
      }
      const targetTable = { tableName, schema };
      const qualifiedAttributes = { ...attributes };
      for (const key in qualifiedAttributes) {
        const attribute = qualifiedAttributes[key];
        if (attribute && attribute.references && typeof attribute.references.model === 'string') {
          attribute.references.model = {
            tableName: attribute.references.model,
            schema
          };
        }
      }
      return originalCreateTable(targetTable, qualifiedAttributes, options);
    };

    // 1. Crear tabla Tipos_Factura si no existe
    let exists = false;
    try {
      const tableInfo = await queryInterface.describeTable('Tipos_Factura');
      if (tableInfo && Object.keys(tableInfo).length > 0) exists = true;
    } catch (e) {
      exists = false;
    }

    if (!exists) {
      await createTable('Tipos_Factura', {
        id_tipo_factura: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        nombre: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      // Sembrar datos iniciales
      const defaultData = [
        'Consultoría Externa', 'Licencias de Software', 'Desarrollos e Integraciones',
        'Infraestructura Tecnológica', 'Migración y Calidad de Datos', 'Viajes y Desplazamientos',
        'Alojamiento', 'Dietas y Comidas', 'Formación', 'Hardware y Equipamiento',
        'Recursos Internos', 'Otros Gastos'
      ].map(nombre => ({
        nombre,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      if (isSqlite) {
        await queryInterface.bulkInsert('Tipos_Factura', defaultData);
      } else {
        await queryInterface.bulkInsert({ tableName: 'Tipos_Factura', schema }, defaultData);
      }
    }

    // 2. Añadir columna id_tipo_factura a tabla Facturas si no existe
    try {
      const facturasInfo = await queryInterface.describeTable('Facturas');
      if (facturasInfo && !facturasInfo.id_tipo_factura) {
        await queryInterface.addColumn(
          isSqlite ? 'Facturas' : { tableName: 'Facturas', schema },
          'id_tipo_factura',
          {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: isSqlite ? 'Tipos_Factura' : { tableName: 'Tipos_Factura', schema },
              key: 'id_tipo_factura'
            }
          }
        );
      }
    } catch (e) {
      console.warn('Advertencia comprobando columna id_tipo_factura en Facturas:', e.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';

    try {
      await queryInterface.removeColumn(
        isSqlite ? 'Facturas' : { tableName: 'Facturas', schema },
        'id_tipo_factura'
      );
    } catch (e) {}

    try {
      await queryInterface.dropTable(
        isSqlite ? 'Tipos_Factura' : { tableName: 'Tipos_Factura', schema }
      );
    } catch (e) {}
  }
};
