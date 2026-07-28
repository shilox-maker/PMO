const { 
  getProjects, getProjectDetail, createProject, updateProject, deleteProject 
} = require('./project/projectCrud.controller');

const { 
  exportProjects, addParticipant, removeParticipant, applyStateTasks
} = require('./project/projectActions.controller');

const {
  getCommunicationPlans,
  createCommunicationPlan,
  updateCommunicationPlan,
  deleteCommunicationPlan,
  createCommunicationLog,
  getCommunicationLogs
} = require('./project/projectCommunication.controller');

const {
  getProjectSurveys,
  createProjectSurvey,
  updateProjectSurvey,
  deleteProjectSurvey
} = require('./project/projectSurvey.controller');

module.exports = {
  getProjects,
  getProjectDetail,
  createProject,
  updateProject,
  deleteProject,
  exportProjects,
  addParticipant,
  removeParticipant,
  applyStateTasks,
  getCommunicationPlans,
  createCommunicationPlan,
  updateCommunicationPlan,
  deleteCommunicationPlan,
  createCommunicationLog,
  getCommunicationLogs,
  getProjectSurveys,
  createProjectSurvey,
  updateProjectSurvey,
  deleteProjectSurvey
};



