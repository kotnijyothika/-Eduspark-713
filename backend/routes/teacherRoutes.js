const express = require('express');
const router = express.Router();
const { protect, authorize, requireSubjectOwnership } = require('../middleware/authMiddleware');
const {
  getTeacherStats,
  getTeacherCurriculum,
  getLessons,
  createLesson,
  createVideo,
  updateVideo,
  deleteVideo,
  deleteLesson,
  getHomeworks,
  createHomework,
  gradeSubmission,
  getQuizzes,
  generateAiQuiz,
  regenerateQuestion,
  saveQuiz,
  getStudentAnalytics,
  getWorkingHoursStatus,
  deleteQuiz,
  getAttendance,
  markAttendance,
  getQuestionBanks,
  getQuestionBankById,
  createQuestionBank,
  updateQuestionBank,
  deleteQuestionBank,
  getQuestionBankResults,
  getAllTeacherQuizResults,
} = require('../controllers/teacherController');

// Protect all routes; require role 'teacher' or 'admin'
router.use(protect);
router.use(authorize('teacher', 'admin'));

// Stats & Working Hours
router.get('/stats', getTeacherStats);
router.get('/working-hours', getWorkingHoursStatus);

// Curriculum & Assigned Options
router.get('/curriculum', getTeacherCurriculum);

// Attendance
router.route('/attendance').get(getAttendance).post(markAttendance);

// Video Management (RESTful CRUD)
router.route('/videos').get(getLessons).post(createVideo);
router.route('/videos/:id').put(updateVideo).delete(deleteVideo);

// Lesson Management (Backward Compatibility)
router.route('/lessons').get(getLessons).post(createVideo);
router.route('/lessons/:id').put(updateVideo).delete(deleteLesson);

// Homework Module
router.route('/homeworks').get(getHomeworks).post(requireSubjectOwnership, createHomework);
router.put('/homeworks/:hwId/grade/:subId', gradeSubmission);

// Quiz & AI Quiz Generator (Legacy + AI Option)
router.get('/quizzes', getQuizzes);
router.post('/quizzes/generate-ai', requireSubjectOwnership, generateAiQuiz);
router.post('/quizzes/regenerate-question', regenerateQuestion);
router.post('/quizzes/save', saveQuiz);
router.delete('/quizzes/:id', deleteQuiz);

// Teacher Question Bank System (20 Questions Bank & Random Selection)
router.get('/question-banks', getQuestionBanks);
router.get('/question-banks/results/all', getAllTeacherQuizResults);
router.get('/question-banks/:id', getQuestionBankById);
router.post('/question-banks', createQuestionBank);
router.put('/question-banks/:id', updateQuestionBank);
router.delete('/question-banks/:id', deleteQuestionBank);
router.get('/question-banks/:id/results', getQuestionBankResults);

// Student Analytics
router.get('/analytics', getStudentAnalytics);

module.exports = router;
