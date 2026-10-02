const Lesson = require('../models/Lesson');
const User = require('../models/User');
const Homework = require('../models/Homework');
const Quiz = require('../models/Quiz');
const QuestionBank = require('../models/QuestionBank');
const QuizAttempt = require('../models/QuizAttempt');
const memoryStore = require('../utils/memoryStore');
const aiService = require('../services/aiService');
const ocrService = require('../services/ocrService');

const homeworkHelper = require('../services/gemini/homeworkHelperService');
const { extractYouTubeVideoId } = require('../utils/youtubeValidator');

// @desc    Get Student Dashboard Overview & Gamification Data
// @route   GET /api/student/dashboard
// @access  Private (Student)
exports.getStudentDashboardData = async (req, res) => {
  try {
    let lessonsList = [];
    let hwList = [];
    let quizList = [];
    let questionBankList = [];
    const studentGrade = req.user?.grade || 'Grade 4';
    const studentClass = req.user?.assignedClass || 'Grade 4 - Alpha';
    const gradeMatch = studentGrade.match(/Grade\s*\d+/i) || studentClass.match(/Grade\s*\d+/i);
    const normalizedGrade = gradeMatch ? gradeMatch[0].replace(/\s+/g, ' ') : studentGrade;

    const gradeVariants = Array.from(
      new Set([studentGrade, studentClass, normalizedGrade].filter(Boolean))
    );

    const lessonFilter = {
      $or: [
        { grade: { $in: gradeVariants } },
        { className: { $in: gradeVariants } },
      ],
    };

    const quizFilter = {
      $or: [
        { grade: { $in: gradeVariants } },
        { className: { $in: gradeVariants } },
      ],
      isPublished: { $ne: false },
    };

    const questionBankFilter = {
      $or: [
        { grade: { $in: gradeVariants } },
        { className: { $in: gradeVariants } },
      ],
      isPublished: true,
    };

    const matchesStudentGrade = (item) => {
      if (!item) return false;
      const itemGrade = (item.grade || '').toLowerCase();
      const itemClass = (item.className || '').toLowerCase();
      return gradeVariants.some((v) => {
        const vLow = v.toLowerCase();
        return (
          itemGrade === vLow ||
          itemClass === vLow ||
          itemGrade.includes(vLow) ||
          vLow.includes(itemGrade)
        );
      });
    };

    try {
      lessonsList = await Lesson.find(lessonFilter).sort({ createdAt: -1 });
      hwList = await Homework.find({ grade: { $in: gradeVariants } }).sort({ createdAt: -1 });
      quizList = await Quiz.find(quizFilter).sort({ createdAt: -1 });
      questionBankList = await QuestionBank.find(questionBankFilter).sort({ createdAt: -1 });
    } catch (e) {
      lessonsList = (memoryStore.lessons || []).filter(matchesStudentGrade);
      hwList = (memoryStore.homeworks || []).filter(matchesStudentGrade);
      quizList = (memoryStore.quizzes || []).filter((q) => matchesStudentGrade(q) && q.isPublished !== false);
      questionBankList = (memoryStore.questionBanks || []).filter(
        (b) => matchesStudentGrade(b) && b.isPublished
      );
    }

    if (!lessonsList.length) {
      lessonsList = (memoryStore.lessons || []).filter(matchesStudentGrade);
    }
    if (!hwList.length) hwList = (memoryStore.homeworks || []).filter(matchesStudentGrade);
    if (!quizList.length) quizList = (memoryStore.quizzes || []).filter((q) => matchesStudentGrade(q) && q.isPublished !== false);
    if (!questionBankList.length && memoryStore.questionBanks) {
      questionBankList = (memoryStore.questionBanks || []).filter(
        (b) => matchesStudentGrade(b) && b.isPublished
      );
    }

    // Format teacher question banks as available 4-question quizzes
    const formattedBanks = questionBankList.map((b) => {
      const doc = b.toObject ? b.toObject() : { ...b };
      return {
        _id: doc._id || doc.id,
        id: doc.id || doc._id,
        title: doc.title,
        grade: doc.grade,
        subject: doc.subject,
        topic: doc.topic,
        difficulty: doc.difficulty || 'Medium',
        quizType: 'teacher_bank',
        isTeacherBank: true,
        questionsCount: 4,
        totalMarks: 4,
        teacherName: doc.teacherName || 'Teacher',
        availablePoolCount: doc.questions ? doc.questions.length : 20,
      };
    });

    const combinedQuizzes = [...quizList, ...formattedBanks];

    // Normalize lessons with videoId and thumbnail
    const normalizedLessons = lessonsList.map((item) => {
      const doc = item.toObject ? item.toObject() : { ...item };
      if (doc.youtubeUrl && !doc.youtubeVideoId) {
        doc.youtubeVideoId = extractYouTubeVideoId(doc.youtubeUrl);
      }
      if (doc.youtubeVideoId && !doc.thumbnail) {
        doc.thumbnail = `https://img.youtube.com/vi/${doc.youtubeVideoId}/hqdefault.jpg`;
      }
      return doc;
    });

    let attendanceLog = [];
    try {
      const Attendance = require('../models/Attendance');
      attendanceLog = await Attendance.find({ student: req.user?._id || req.user?.id }).sort({ date: -1 }).limit(10);
    } catch (e) {}

    const studentProfile = {
      name: req.user?.name || 'Aarav Sharma',
      grade: studentGrade,
      assignedClass: studentClass,
      streak: req.user?.streak || 5,
      stars: req.user?.stars || 140,
      coins: req.user?.coins || 320,
      dailyMotivation: '🌟 "Small steps every day lead to big achievements! Keep up the great learning!"',
    };

    res.status(200).json({
      success: true,
      profile: studentProfile,
      lessons: normalizedLessons,
      homeworks: hwList,
      quizzes: combinedQuizzes,
      attendance: attendanceLog,
      achievements: memoryStore.achievements,
      bookmarks: memoryStore.bookmarks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load student dashboard.' });
  }
};

// @desc    AI Homework Helper (Educational Step-by-Step Guidance with Conversational Context)
// @route   POST /api/student/ai-helper
// @access  Private (Student)
exports.aiHomeworkHelper = async (req, res) => {
  try {
    const { question, grade, history, previousContext, subject } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your homework question.' });
    }

    const targetGrade = grade || req.user?.grade || 'Grade 4';
    const targetSubject = subject || 'Mathematics';

    const result = await homeworkHelper.solveHomework({
      questionText: question.trim(),
      studentClass: targetGrade,
      subject: targetSubject,
      history: Array.isArray(history) ? history : [],
      previousContext: previousContext || '',
    });

    res.status(200).json({
      success: true,
      question,
      data: result,
      aiResponse: {
        understandTheQuestion: result.understandTheQuestion,
        steps: result.steps || result.stepByStepSolution,
        stepByStepSolution: result.stepByStepSolution || result.steps,
        finalAnswer: result.finalAnswer,
        quickTip: result.quickTip,
        explanation: result.explanation,
        provider: result.provider,
        ruleEnforced: 'AI Tutor gives structured step-by-step guidance!',
      },
    });
  } catch (error) {
    console.error('AI Homework Helper error:', error);
    res.status(500).json({ success: false, message: 'AI Homework Helper error: ' + error.message });
  }
};

// @desc    AI Voice Tutor (Speech-to-Text & Gemini Child-Friendly Response)
// @route   POST /api/student/voice-tutor
// @access  Private (Student)
exports.aiVoiceTutor = async (req, res) => {
  try {
    const { voiceQuestion, grade } = req.body;

    if (!voiceQuestion) {
      return res.status(400).json({ success: false, message: 'Voice input not received.' });
    }

    const aiVoice = await aiService.generateVoiceTutorResponse(voiceQuestion, grade || req.user?.grade || 'Grade 4');

    res.status(200).json({
      success: true,
      voiceQuestion,
      spokenResponse: aiVoice.spokenText,
      provider: aiVoice.provider,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Voice Tutor error.' });
  }
};

// @desc    OCR Homework Scanner (Powered by Gemini Multimodal Vision / Google Vision)
// @route   POST /api/student/ocr-scan
// @access  Private (Student)
exports.ocrScanNotebook = async (req, res) => {
  try {
    let imageInput = req.body.imageDataBase64 || req.body.imageUrl || '';
    const mimeType = req.body.mimeType || 'image/jpeg';

    if (req.file) {
      imageInput = req.file.buffer;
    }

    const ocrResult = await ocrService.extractHandwrittenText(imageInput, mimeType);

    // Automatically solve extracted question using Homework Helper
    let solution = null;
    if (ocrResult.extractedText && ocrResult.extractedText !== 'No text detected.') {
      try {
        solution = await homeworkHelper.solveHomework({
          questionText: ocrResult.extractedText,
          studentClass: req.user?.grade || 'Grade 4',
        });
      } catch (e) {}
    }

    res.status(200).json({
      success: true,
      ocrResult,
      extractedText: ocrResult.extractedText,
      solution,
    });
  } catch (error) {
    console.error('OCR scan error:', error);
    res.status(500).json({ success: false, message: 'OCR scan error: ' + error.message });
  }
};

// @desc    Submit Homework
// @route   POST /api/student/homework/:hwId/submit
// @access  Private (Student)
exports.submitHomework = async (req, res) => {
  try {
    const { hwId } = req.params;
    const { content, fileUrl, ocrText } = req.body;

    const subData = {
      studentId: req.user?._id || req.user?.id || 'demo-student-id-004',
      studentName: req.user?.name || 'Leo Vance',
      content: ocrText ? `[OCR Scanned Notebook Handwriting]:\n${ocrText}` : (content || 'Homework submitted.'),
      fileUrl: fileUrl || '',
      submittedAt: new Date(),
      status: 'submitted',
    };

    try {
      const hw = await Homework.findById(hwId);
      if (hw) {
        hw.submissions.push(subData);
        await hw.save();
        return res.status(200).json({ success: true, message: 'Homework notebook submission uploaded & saved for teacher review!' });
      }
    } catch (e) {}

    memoryStore.addHomeworkSubmission(hwId, subData);
    res.status(200).json({ success: true, message: 'Homework notebook submission uploaded & saved for teacher review (Demo Mode)!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit homework.' });
  }
};

// @desc    Submit Quiz & Evaluate Results
// @route   POST /api/student/quiz/:quizId/submit
// @access  Private (Student)
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;

    let quiz = null;
    try {
      quiz = await Quiz.findById(quizId);
    } catch (e) {
      quiz = memoryStore.quizzes.find((q) => q.id === quizId || q._id === quizId);
    }
    if (!quiz) {
      quiz = memoryStore.quizzes.find((q) => q.id === quizId || q._id === quizId);
    }

    if (!quiz || !quiz.questions) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;
    const weakTopics = [];

    quiz.questions.forEach((q, idx) => {
      const userAns = answers ? answers[idx] : '';
      if (userAns && userAns.toString().trim().toLowerCase() === q.correctAnswer.toString().trim().toLowerCase()) {
        correctCount++;
      } else {
        weakTopics.push(q.question);
      }
    });

    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    // Save to student's quizResults in MongoDB
    if (req.user && req.user._id) {
      try {
        const student = await User.findById(req.user._id);
        if (student) {
          student.quizResults = student.quizResults || [];
          student.quizResults.push({
            quizId: quiz._id || quiz.id,
            quizTitle: quiz.title,
            subject: quiz.subject,
            score: scorePercentage,
            correctCount,
            totalQuestions,
            weakConcepts: weakTopics.length ? weakTopics : []
          });
          await student.save();
        }
      } catch (saveErr) {
        console.error('Error saving student quiz results:', saveErr.message);
      }
    }

    const weaknessAnalysis = await aiService.detectWeakTopicsAndGaps({ quizAverage: scorePercentage });
    const forecast = await aiService.predictPerformanceAndTrend({ quizAverage: scorePercentage });

    res.status(200).json({
      success: true,
      quizTitle: quiz.title,
      score: scorePercentage,
      correctCount,
      totalQuestions,
      weakConcepts: weakTopics.length ? weakTopics : ['None! Perfect score!'],
      recommendedRevision: scorePercentage >= 80 ? 'You mastered this topic! Try the advanced practice.' : 'Revise fractions diagrams and practice 10 mins daily.',
      starsEarned: 20,
      coinsEarned: 50,
      aiAnalysis: {
        riskLevel: weaknessAnalysis.riskLevel,
        predictedExamScore: forecast.predictedExamScore,
        learningTrend: forecast.learningTrend,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit quiz.' });
  }
};

// @desc    Toggle Bookmark Lesson
// @route   POST /api/student/bookmark/:lessonId
// @access  Private (Student)
exports.toggleBookmark = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const isBookmarked = memoryStore.toggleBookmark(lessonId);

    res.status(200).json({
      success: true,
      isBookmarked,
      message: isBookmarked ? 'Lesson bookmarked!' : 'Lesson removed from bookmarks.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle bookmark.' });
  }
};

// @desc    Get AI Performance Forecast & Weak Topic Detection
// @route   GET /api/student/ai-forecast
// @access  Private (Student)
exports.getStudentAiForecast = async (req, res) => {
  try {
    const quizResults = req.user?.quizResults || [];
    const quizAvg = quizResults.length > 0
      ? Math.round(quizResults.reduce((acc, q) => acc + (q.score || 0), 0) / quizResults.length)
      : 88;

    const history = {
      quizAverage: quizAvg,
      homeworkCompletion: 92,
      studentName: req.user?.name || 'Student',
      studentId: req.user?._id || req.user?.id,
    };
    const forecast = await aiService.predictPerformanceAndTrend(history);
    const weakness = await aiService.detectWeakTopicsAndGaps(history);

    res.status(200).json({
      success: true,
      forecast,
      weakness,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch AI forecast.' });
  }
};

/* ==========================================
   TEACHER QUESTION BANK - STUDENT QUIZ ATTEMPT & EVALUATION
   ========================================== */

// @desc    Start Teacher-Created Question Bank Quiz (Select 4 Random Questions securely)
// @route   GET /api/student/quiz/bank/:bankId/start
// @access  Private (Student)
exports.startQuestionBankQuiz = async (req, res) => {
  try {
    const { bankId } = req.params;
    let bank = null;

    try {
      bank = await QuestionBank.findById(bankId);
    } catch (e) {}

    if (!bank) {
      bank = (memoryStore.questionBanks || []).find((b) => b.id === bankId || b._id === bankId);
    }

    if (!bank || !bank.questions || bank.questions.length === 0) {
      return res.status(404).json({ success: false, message: 'Question Bank not found or has no questions.' });
    }

    const allQuestions = bank.questions;

    // Pick EXACTLY 4 random UNIQUE questions without replacement (Fisher-Yates style shuffle)
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const countToPick = Math.min(4, shuffled.length);
    const selected = shuffled.slice(0, countToPick);

    // Randomize the order of the selected questions as well
    const randomizedSelected = selected.sort(() => 0.5 - Math.random());

    // SECURITY: DO NOT SEND correctAnswer or explanation before submission!
    const sanitizedQuestions = randomizedSelected.map((q, idx) => {
      const qDoc = q.toObject ? q.toObject() : { ...q };
      const qId = (qDoc._id || qDoc.id || `q-${idx}`).toString();
      return {
        _id: qId,
        id: qId,
        question: qDoc.question,
        options: qDoc.options || [],
        difficulty: qDoc.difficulty || bank.difficulty || 'Medium',
      };
    });

    res.status(200).json({
      success: true,
      bankId: (bank._id || bank.id).toString(),
      quizTitle: bank.title,
      subject: bank.subject,
      topic: bank.topic,
      grade: bank.grade,
      quizType: 'teacher_bank',
      totalQuestions: sanitizedQuestions.length,
      questions: sanitizedQuestions,
    });
  } catch (error) {
    console.error('startQuestionBankQuiz error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate random quiz attempt.' });
  }
};

// @desc    Submit Teacher Question Bank Quiz Answers & Evaluate
// @route   POST /api/student/quiz/bank/:bankId/submit
// @access  Private (Student)
exports.submitQuestionBankQuiz = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { answers, selectedQuestionIds } = req.body;

    let bank = null;
    try {
      bank = await QuestionBank.findById(bankId);
    } catch (e) {}

    if (!bank) {
      bank = (memoryStore.questionBanks || []).find((b) => b.id === bankId || b._id === bankId);
    }

    if (!bank || !bank.questions) {
      return res.status(404).json({ success: false, message: 'Question Bank not found.' });
    }

    // Helper function to compare student answer with correct answer
    const checkIsCorrect = (userAns, correctAns, options) => {
      if (userAns === undefined || userAns === null || correctAns === undefined || correctAns === null) return false;
      const normUser = userAns.toString().trim().toLowerCase();
      const normCorrect = correctAns.toString().trim().toLowerCase();
      if (normUser === normCorrect) return true;

      // Check letter mapping: A=0, B=1, C=2, D=3
      const letterIndexMap = { a: 0, b: 1, c: 2, d: 3 };
      if (letterIndexMap[normCorrect] !== undefined && options && options[letterIndexMap[normCorrect]]) {
        if (normUser === options[letterIndexMap[normCorrect]].toString().trim().toLowerCase()) return true;
      }
      if (letterIndexMap[normUser] !== undefined && options && options[letterIndexMap[normUser]]) {
        if (options[letterIndexMap[normUser]].toString().trim().toLowerCase() === normCorrect) return true;
      }
      return false;
    };

    // Find the 4 questions that were selected for this attempt
    let questionItems = [];
    if (Array.isArray(selectedQuestionIds) && selectedQuestionIds.length > 0) {
      questionItems = selectedQuestionIds.map((qId) => {
        return bank.questions.find((q) => (q._id || q.id)?.toString() === qId.toString()) || null;
      }).filter(Boolean);
    }

    if (questionItems.length === 0 && answers && typeof answers === 'object') {
      const keys = Object.keys(answers);
      questionItems = keys.map((k) => {
        if (!isNaN(k)) {
          return bank.questions[parseInt(k, 10)];
        }
        return bank.questions.find((q) => (q._id || q.id)?.toString() === k.toString());
      }).filter(Boolean);
    }

    if (questionItems.length === 0) {
      questionItems = bank.questions.slice(0, 4);
    }

    let correctCount = 0;
    const results = [];
    const weakConcepts = [];

    questionItems.forEach((q, idx) => {
      const qId = (q._id || q.id || `q-${idx}`).toString();
      let userAns = '';
      if (answers && answers[qId] !== undefined) {
        userAns = answers[qId];
      } else if (answers && answers[idx] !== undefined) {
        userAns = answers[idx];
      } else if (Array.isArray(answers) && answers[idx] !== undefined) {
        userAns = answers[idx];
      }

      const isCorrect = checkIsCorrect(userAns, q.correctAnswer, q.options);
      if (isCorrect) {
        correctCount++;
      } else {
        weakConcepts.push(q.question);
      }

      results.push({
        questionId: qId,
        question: q.question,
        options: q.options || [],
        studentAnswer: userAns || 'No answer selected',
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation || '',
      });
    });

    const totalQuestions = questionItems.length || 4;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    const attemptPayload = {
      student: req.user?._id || req.user?.id,
      studentName: req.user?.name || 'Student',
      studentGrade: req.user?.grade || bank.grade || 'Grade 4',
      questionBank: bank._id,
      questionBankId: (bank._id || bank.id).toString(),
      quizTitle: bank.title,
      subject: bank.subject,
      topic: bank.topic,
      selectedQuestionIds: questionItems.map((q) => (q._id || q.id || '').toString()),
      studentAnswers: answers || {},
      score: correctCount,
      totalQuestions,
      percentage,
      results,
      weakConcepts,
      takenAt: new Date(),
    };

    try {
      await QuizAttempt.create(attemptPayload);
    } catch (dbErr) {
      memoryStore.saveQuizAttempt(attemptPayload);
    }

    // Update student's user profile with quiz result
    if (req.user && req.user._id) {
      try {
        const student = await User.findById(req.user._id);
        if (student) {
          student.quizResults = student.quizResults || [];
          student.quizResults.push({
            quizId: bank._id,
            quizTitle: bank.title,
            subject: bank.subject,
            score: percentage,
            correctCount,
            totalQuestions,
            weakConcepts,
            takenAt: new Date(),
          });
          student.stars = (student.stars || 0) + 20;
          student.coins = (student.coins || 0) + 50;
          await student.save();
        }
      } catch (e) {}
    }

    res.status(200).json({
      success: true,
      quizTitle: bank.title,
      subject: bank.subject,
      topic: bank.topic,
      score: correctCount,
      totalQuestions,
      percentage,
      correctCount,
      results,
      weakConcepts: weakConcepts.length ? weakConcepts : ['Perfect Score! Excellent Work!'],
      starsEarned: 20,
      coinsEarned: 50,
      message: `You scored ${correctCount}/${totalQuestions} (${percentage}%)!`,
    });
  } catch (error) {
    console.error('submitQuestionBankQuiz error:', error);
    res.status(500).json({ success: false, message: 'Failed to evaluate quiz answers.' });
  }
};

// @desc    Get current student's quiz attempts history
// @route   GET /api/student/quiz/my-results
// @access  Private (Student)
exports.getStudentQuizResults = async (req, res) => {
  try {
    const studentId = req.user?._id || req.user?.id;
    let attempts = [];

    try {
      attempts = await QuizAttempt.find({ student: studentId }).sort({ takenAt: -1 });
    } catch (e) {
      attempts = (memoryStore.quizAttempts || []).filter((a) => (a.student || a.studentId)?.toString() === studentId?.toString());
    }

    res.status(200).json({
      success: true,
      count: attempts.length,
      data: attempts,
    });
  } catch (error) {
    console.error('getStudentQuizResults error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student quiz results.',
      error: error.message,
    });
  }
};
