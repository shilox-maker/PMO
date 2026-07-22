const { 
  createInvoice, updateInvoice, deleteInvoice, createScopeChange, updateScopeChange 
} = require('./item/financial.controller');

const { 
  createRisk, updateRisk, createIssue, updateIssue 
} = require('./item/riskIssue.controller');

const { 
  createTask, updateTask, deleteTask, getLessons, createLesson, updateLesson, deleteLesson 
} = require('./item/taskLesson.controller');

const { 
  getProjectComments, createComment, updateComment, deleteComment 
} = require('./item/comment.controller');

module.exports = {
  createInvoice,
  updateInvoice,
  deleteInvoice,
  createScopeChange,
  updateScopeChange,
  createRisk,
  updateRisk,
  createIssue,
  updateIssue,
  createTask,
  updateTask,
  deleteTask,
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  getProjectComments,
  createComment,
  updateComment,
  deleteComment
};
