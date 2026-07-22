const { getProjects, getProjectDetail } = require('./projectRead.controller');
const { createProject, updateProject, deleteProject } = require('./projectWrite.controller');

module.exports = {
  getProjects,
  getProjectDetail,
  createProject,
  updateProject,
  deleteProject
};
