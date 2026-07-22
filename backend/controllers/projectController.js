const { 
  getProjects, getProjectDetail, createProject, updateProject, deleteProject 
} = require('./project/projectCrud.controller');

const { 
  exportProjects, addParticipant, removeParticipant 
} = require('./project/projectActions.controller');

module.exports = {
  getProjects,
  getProjectDetail,
  createProject,
  updateProject,
  deleteProject,
  exportProjects,
  addParticipant,
  removeParticipant
};
