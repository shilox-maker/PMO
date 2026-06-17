const { ProyectoKeyUsers, Proyectos } = require('../backend/models/index');

async function main() {
  try {
    const id_proyecto = 'PRJ-2026-001';
    const id_ku = 1;
    const rol = 'PM local';
    const raci = 'RA';
    
    console.log("Testing findOrCreate...");
    const [association, created] = await ProyectoKeyUsers.findOrCreate({
      where: { id_proyecto, id_ku },
      defaults: { rol, raci }
    });
    console.log("Result findOrCreate:", { created });
    if (!created) {
      console.log("Updating association...");
      await association.update({ rol, raci });
      console.log("Updated association:", association.toJSON());
    }
  } catch (error) {
    console.error("Error caught:", error);
  }
  process.exit(0);
}

main();
