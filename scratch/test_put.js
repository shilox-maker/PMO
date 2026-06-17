const { Proyectos } = require('../backend/models/index');

async function main() {
  try {
    const id_proyecto = 'PRJ-2026-001';
    const project = await Proyectos.findByPk(id_proyecto);
    if (!project) {
      console.log("Project not found!");
      process.exit(1);
    }
    
    console.log("Updating project...");
    await project.update({ alcance_por_que: "Test value <b>hello</b>" });
    console.log("Updated project successfully:", project.toJSON().alcance_por_que);
  } catch (error) {
    console.error("Error caught:", error);
  }
  process.exit(0);
}

main();
