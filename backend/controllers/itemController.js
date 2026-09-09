const { 
  createInvoice, createBatchInvoices, updateInvoice, deleteInvoice, createScopeChange, updateScopeChange, deleteScopeChange 
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

const {
  getProjectDirectionComments, createDirectionComment, updateDirectionComment, deleteDirectionComment
} = require('./item/directionComment.controller');

module.exports = {
  createInvoice,
  createBatchInvoices,
  updateInvoice,

  deleteInvoice,
  createScopeChange,
  updateScopeChange,
  deleteScopeChange,
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
  deleteComment,
  getProjectDirectionComments,
  createDirectionComment,
  updateDirectionComment,
  deleteDirectionComment
};
