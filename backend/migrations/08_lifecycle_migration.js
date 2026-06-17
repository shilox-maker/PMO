'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add date columns to Proyectos table
    const columnsToAdd = [
      'fecha_peticion',
      'fecha_alcance_definido',
      'fecha_aprobacion',
      'fecha_planificacion',
      'fecha_kickoff',
      'fecha_go_live',
      'fecha_cierre'
    ];

    const tableInfo = await queryInterface.describeTable('Proyectos');
    for (const col of columnsToAdd) {
      if (!tableInfo[col]) {
        await queryInterface.addColumn('Proyectos', col, {
          type: DataTypes.DATEONLY,
          allowNull: true
        });
      }
    }

    // 2. Clear old state tables or insert new ones
    // We will insert the 12 new states. Emojis and orders matching our design.
    const newStates = [
      { nombre_estado: 'Petición', icono: '📩', orden: 1, proyecto_cerrado: false },
      { nombre_estado: 'Estudio de viabilidad', icono: '📋', orden: 2, proyecto_cerrado: false },
      { nombre_estado: 'Buscar propuestas', icono: '🔍', orden: 3, proyecto_cerrado: false },
      { nombre_estado: 'Tener aprobación', icono: '⏳', orden: 4, proyecto_cerrado: false },
      { nombre_estado: 'Planificar', icono: '📅', orden: 5, proyecto_cerrado: false },
      { nombre_estado: 'Kickoff', icono: '🚀', orden: 6, proyecto_cerrado: false },
      { nombre_estado: 'Ejecución', icono: '🛠️', orden: 7, proyecto_cerrado: false },
      { nombre_estado: 'Go Live', icono: '📦', orden: 8, proyecto_cerrado: false },
      { nombre_estado: 'Estabilización', icono: '🛡️', orden: 9, proyecto_cerrado: false },
      { nombre_estado: 'Cierre', icono: '🏁', orden: 10, proyecto_cerrado: true },
      { nombre_estado: 'Descartado', icono: '🗑️', orden: 11, proyecto_cerrado: true },
      { nombre_estado: 'Cancelado', icono: '❌', orden: 12, proyecto_cerrado: true }
    ];

    // Read current states in database to map projects
    const [oldStatesRows] = await queryInterface.sequelize.query('SELECT id_estado, nombre_estado FROM Estados_Proyecto');
    
    // Insert new states
    for (const s of newStates) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id_estado FROM Estados_Proyecto WHERE nombre_estado = ?`,
        { replacements: [s.nombre_estado], type: Sequelize.QueryTypes.SELECT }
      );
      if (!existing) {
        await queryInterface.sequelize.query(
          `INSERT INTO Estados_Proyecto (nombre_estado, icono, orden, proyecto_cerrado) VALUES (?, ?, ?, ?)`,
          { replacements: [s.nombre_estado, s.icono, s.orden, s.proyecto_cerrado ? 1 : 0] }
        );
      } else {
        await queryInterface.sequelize.query(
          `UPDATE Estados_Proyecto SET icono = ?, orden = ?, proyecto_cerrado = ? WHERE id_estado = ?`,
          { replacements: [s.icono, s.orden, s.proyecto_cerrado ? 1 : 0, existing.id_estado] }
        );
      }
    }

    // Read updated/new states to get their IDs
    const [newStatesRows] = await queryInterface.sequelize.query('SELECT id_estado, nombre_estado FROM Estados_Proyecto');
    const stateMap = {};
    newStatesRows.forEach(s => {
      stateMap[s.nombre_estado] = s.id_estado;
    });

    // Map projects from old state IDs to new state IDs
    const mapping = {
      'Kickoff': 'Kickoff',
      'Análisis de Viabilidad': 'Estudio de viabilidad',
      'Aprobación de Arquitectura': 'Tener aprobación',
      'Diseño Conceptual': 'Estudio de viabilidad',
      'Planificación': 'Planificar',
      'Validación Técnica': 'Planificar',
      'Desarrollo': 'Ejecución',
      'Pruebas QA': 'Ejecución',
      'UAT (Pruebas de Usuario)': 'Ejecución',
      'Despliegue': 'Go Live',
      'Estabilización': 'Estabilización',
      'Cierre': 'Cierre',
      'Pausado': 'Ejecución',
      'Cancelado': 'Cancelado',
      'En Revisión Financiera': 'Estudio de viabilidad',
      'Pendiente de Aprobación': 'Tener aprobación'
    };

    // Update each project's id_estado based on mapping
    for (const oldState of oldStatesRows) {
      const mappedStateName = mapping[oldState.nombre_estado];
      if (mappedStateName && stateMap[mappedStateName]) {
        const targetStateId = stateMap[mappedStateName];
        await queryInterface.sequelize.query(
          `UPDATE Proyectos SET id_estado = ? WHERE id_estado = ?`,
          { replacements: [targetStateId, oldState.id_estado] }
        );
      }
    }

    // Delete old states that are no longer part of the new 12 states
    const newStateNames = newStates.map(s => s.nombre_estado);
    const placeholders = newStateNames.map(() => '?').join(',');
    await queryInterface.sequelize.query(
      `DELETE FROM Estados_Proyecto WHERE nombre_estado NOT IN (${placeholders})`,
      { replacements: newStateNames }
    );

    // Initialize default date values on existing projects based on their current stage to prevent empty Gantt/Timeline bars
    // If project is Execution/Go Live/Estabilización/Cierre (IDs corresponding to new states >= Kickoff)
    // We can fetch projects and set kickoff/go_live.
    const [projects] = await queryInterface.sequelize.query(
      `SELECT p.id_proyecto, p.fecha_inicio, p.fecha_fin_inicial, ep.nombre_estado 
       FROM Proyectos p 
       JOIN Estados_Proyecto ep ON p.id_estado = ep.id_estado`
    );

    for (const p of projects) {
      let kickoff = null;
      let goLive = null;
      
      const inKickoffOrLater = [
        'Kickoff', 'Ejecución', 'Go Live', 'Estabilización', 'Cierre'
      ].includes(p.nombre_estado);
      
      const inGoLiveOrLater = [
        'Go Live', 'Estabilización', 'Cierre'
      ].includes(p.nombre_estado);

      if (inKickoffOrLater) {
        kickoff = p.fecha_inicio;
      }
      if (inGoLiveOrLater) {
        goLive = p.fecha_fin_inicial;
      }

      await queryInterface.sequelize.query(
        `UPDATE Proyectos 
         SET fecha_peticion = ?,
             fecha_kickoff = COALESCE(fecha_kickoff, ?), 
             fecha_go_live = COALESCE(fecha_go_live, ?) 
         WHERE id_proyecto = ?`,
        { replacements: [p.fecha_inicio, kickoff, goLive, p.id_proyecto] }
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Revert columns if needed
    const columnsToRemove = [
      'fecha_peticion',
      'fecha_alcance_definido',
      'fecha_aprobacion',
      'fecha_planificacion',
      'fecha_kickoff',
      'fecha_go_live',
      'fecha_cierre'
    ];
    for (const col of columnsToRemove) {
      try {
        await queryInterface.removeColumn('Proyectos', col);
      } catch (e) {
        console.log(`Error removing column ${col}:`, e.message);
      }
    }
  }
};
