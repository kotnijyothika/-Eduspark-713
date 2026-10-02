const express = require('express');

const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');

const {
  getStudentDashboardData,
  aiHomeworkHelper,
  aiVoiceTutor,
  ocrScanNotebook,
  submitHomework,
  submitQuiz,
  toggleBookmark,
  getStudentAiForecast,
  startQuestionBankQuiz,
  submitQuestionBankQuiz,
  getStudentQuizResults,
} = require('../controllers/studentController');

// AI Homework Helper - TEMPORARY PUBLIC TEST ROUTE
router.post('/ai-helper', aiHomeworkHelper);

// All other student routes require authentication
router.use(protect);
router.use(authorize('student', 'admin'));

router.get('/dashboard', getStudentDashboardData);

router.post('/voice-tutor', aiVoiceTutor);

router.post('/ocr-scan', ocrScanNotebook);

router.post('/homework/:hwId/submit', submitHomework);

router.post('/quiz/:quizId/submit', submitQuiz);

router.get('/quiz/bank/:bankId/start', startQuestionBankQuiz);

router.post('/quiz/bank/:bankId/submit', submitQuestionBankQuiz);

router.get('/quiz/my-results', getStudentQuizResults);

router.post('/bookmark/:lessonId', toggleBookmark);

router.get('/ai-forecast', getStudentAiForecast);

module.exports = router;

