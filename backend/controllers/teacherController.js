const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const Homework = require('../models/Homework');
const Quiz = require('../models/Quiz');
const QuestionBank = require('../models/QuestionBank');
const QuizAttempt = require('../models/QuizAttempt');
const Attendance = require('../models/Attendance');
const memoryStore = require('../utils/memoryStore');
const aiService = require('../services/aiService');
const { validateYouTubeUrl, extractYouTubeVideoId } = require('../utils/youtubeValidator');
const { getTeacherCurriculumOptions, validateTeacherCurriculumSelection, normalizeGrade } = require('../utils/curriculumData');

// @desc    Get Teacher Overview Stats & Alerts
// @route   GET /api/teacher/stats
// @access  Private (Teacher)
exports.getTeacherStats = async (req, res) => {
  try {
    let lessonsCount = 0;
    let homeworksCount = 0;
    let quizzesCount = 0;

    const teacherId = req.user?._id || req.user?.id;
    const isTeacher = req.user?.role === 'teacher';
    const teacherFilter = isTeacher && teacherId ? { $or: [{ teacherId }, { teacherName: req.user?.name }] } : {};

    try {
      lessonsCount = await Lesson.countDocuments(teacherFilter);
      homeworksCount = await Homework.countDocuments(teacherFilter);
      quizzesCount = await Quiz.countDocuments();
    } catch (e) {
      lessonsCount = memoryStore.lessons.length;
      homeworksCount = memoryStore.homeworks.length;
      quizzesCount = memoryStore.quizzes.length;
    }

    const announcements = [
      { id: 1, title: 'Science Fair Project Due', date: '2026-07-30', target: 'Grade 4 & 5' },
      { id: 2, title: 'Parent-Teacher Meeting Window', date: '2026-08-05', target: 'All Parents' },
    ];

    const alerts = [
      { id: 1, type: 'warning', text: 'Oliver Smith has missed 2 consecutive fraction assignments.' },
      { id: 2, type: 'info', text: 'Maya Lin requested AI hints for decimal division.' },
    ];

    res.status(200).json({
      success: true,
      stats: {
        todaysClassesCount: 4,
        pendingHomeworksCount: 2,
        lessonsCount: lessonsCount || memoryStore.lessons.length,
        quizzesCount: quizzesCount || memoryStore.quizzes.length,
        weeklyProgress: 88,
      },
      announcements,
      alerts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch teacher stats.' });
  }
};

/* ==========================================
   CURRICULUM & ASSIGNMENTS
   ========================================== */
exports.getTeacherCurriculum = async (req, res) => {
  try {
    const options = getTeacherCurriculumOptions(req.user);
    res.status(200).json({ success: true, ...options });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch curriculum options.' });
  }
};

/* ==========================================
   LESSON & VIDEO MANAGEMENT
   ========================================== */
exports.getLessons = async (req, res) => {
  try {
    let lessonsList = [];
    const teacherId = req.user?._id || req.user?.id;
    const isTeacher = req.user?.role === 'teacher';

    try {
      const query = isTeacher && teacherId
        ? {
            $or: [
              { teacherId: teacherId },
              { teacherName: req.user?.name },
              { subject: { $in: req.user?.subjects || [req.user?.subject || 'Mathematics'] } }
            ]
          }
        : {};
      lessonsList = await Lesson.find(query).sort({ createdAt: -1 });
    } catch (e) {
      lessonsList = memoryStore.lessons;
    }
    if (!lessonsList.length && !isTeacher) lessonsList = memoryStore.lessons;

    // Ensure all lessons have videoId and thumbnail populated if youtubeUrl exists
    const normalized = lessonsList.map((item) => {
      const doc = item.toObject ? item.toObject() : { ...item };
      if (doc.youtubeUrl && !doc.youtubeVideoId) {
        doc.youtubeVideoId = extractYouTubeVideoId(doc.youtubeUrl);
      }
      if (doc.youtubeVideoId && !doc.thumbnail) {
        doc.thumbnail = `https://img.youtube.com/vi/${doc.youtubeVideoId}/hqdefault.jpg`;
      }
      return doc;
    });

    res.status(200).json({ success: true, count: normalized.length, data: normalized });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch lessons.' });
  }
};

exports.createVideo = async (req, res) => {
  try {
    const {
      title,
      description,
      youtube_url,
      youtubeUrl,
      class_id,
      className,
      grade,
      subject_id,
      subject,
      chapter_id,
      chapter,
      topic_id,
      topic,
      contentType,
      category,
    } = req.body;

    const rawUrl = youtube_url || youtubeUrl;
    const reqClass = className || class_id || grade || req.user?.assignedClass || 'Grade 4 - Alpha';
    const reqGrade = normalizeGrade(reqClass);
    const reqSubject = subject || subject_id || (req.user?.subjects && req.user.subjects[0]) || 'Mathematics';
    const reqChapter = chapter || chapter_id;
    const reqTopic = topic || topic_id;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Video title is required.' });
    }

    if (!rawUrl || !rawUrl.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter a valid YouTube video URL.' });
    }

    // 1. Validate YouTube URL
    const ytValidation = validateYouTubeUrl(rawUrl);
    if (!ytValidation.isValid) {
      return res.status(400).json({ success: false, message: 'Please enter a valid YouTube video URL.' });
    }

    // 2. Validate Teacher Authorization (Hierarchy: Teacher -> Assigned Class -> Assigned Subject -> Valid Chapter -> Valid Topic)
    const authCheck = validateTeacherCurriculumSelection(req.user, {
      className: reqClass,
      grade: reqGrade,
      subject: reqSubject,
      chapter: reqChapter,
      topic: reqTopic,
    });

    if (!authCheck.isValid) {
      return res.status(authCheck.status || 403).json({
        success: false,
        message: authCheck.message,
      });
    }

    const teacherId = req.user?._id || req.user?.id;
    const teacherName = req.user?.name || 'Prof. John Keating';

    // 3. Duplicate Prevention (Class + Subject + Chapter + Topic + same YouTube video)
    let isDuplicate = false;
    try {
      const existing = await Lesson.findOne({
        youtubeVideoId: ytValidation.videoId,
        subject: reqSubject,
        chapter: reqChapter,
        topic: reqTopic,
        $or: [{ className: reqClass }, { grade: reqGrade }],
      });
      if (existing) isDuplicate = true;
    } catch (dbErr) {
      // check memoryStore
      const memExisting = (memoryStore.lessons || []).find((l) => {
        const matchVideo = l.youtubeVideoId === ytValidation.videoId;
        const matchClass = (l.className || l.grade || '').toLowerCase() === reqClass.toLowerCase() || (l.grade || '').toLowerCase() === reqGrade.toLowerCase();
        const matchSubj = (l.subject || '').toLowerCase() === reqSubject.toLowerCase();
        const matchChap = (l.chapter || '').toLowerCase() === (reqChapter || '').toLowerCase();
        const matchTop = (l.topic || '').toLowerCase() === (reqTopic || '').toLowerCase();
        return matchVideo && matchClass && matchSubj && matchChap && matchTop;
      });
      if (memExisting) isDuplicate = true;
    }

    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: 'This YouTube video has already been added to this topic.',
      });
    }

    // 4. Save Video Record
    const videoPayload = {
      title: title.trim(),
      description: (description || '').trim(),
      grade: reqGrade,
      className: reqClass,
      classId: class_id || '',
      subject: reqSubject,
      subjectId: subject_id || '',
      chapter: reqChapter,
      chapterId: chapter_id || '',
      topic: reqTopic,
      topicId: topic_id || '',
      contentType: contentType || 'video',
      category: category || 'daily',
      youtubeUrl: ytValidation.embedUrl,
      youtubeVideoId: ytValidation.videoId,
      thumbnail: ytValidation.thumbnailUrl,
      teacherId,
      teacherName,
    };

    try {
      const savedLesson = await Lesson.create(videoPayload);
      return res.status(201).json({
        success: true,
        message: 'YouTube video added successfully!',
        data: savedLesson,
      });
    } catch (dbErr) {
      try {
        const memLesson = memoryStore.saveLesson(videoPayload);
        return res.status(201).json({
          success: true,
          message: 'YouTube video added successfully!',
          data: memLesson,
        });
      } catch (memErr) {
        if (memErr.code === 'DUPLICATE_VIDEO') {
          return res.status(400).json({
            success: false,
            message: 'This YouTube video has already been added to this topic.',
          });
        }
        throw memErr;
      }
    }
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ success: false, message: error.message || 'Error creating video.' });
  }
};

exports.createLesson = exports.createVideo;

exports.updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      youtube_url,
      youtubeUrl,
      class_id,
      className,
      grade,
      subject_id,
      subject,
      chapter_id,
      chapter,
      topic_id,
      topic,
    } = req.body;

    let target = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      try {
        target = await Lesson.findById(id);
      } catch (e) {}
    }
    if (!target) {
      target = (memoryStore.lessons || []).find((l) => l.id === id || l._id === id);
    }

    if (!target) {
      return res.status(404).json({ success: false, message: 'Video not found.' });
    }

    // Ownership check
    if (req.user && req.user.role !== 'admin') {
      const isOwner =
        (target.teacherId && String(target.teacherId) === String(req.user._id || req.user.id)) ||
        target.teacherName === req.user.name;
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Not authorized to edit this video.' });
      }
    }

    const updates = {};
    if (title) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (className) updates.className = className;
    if (grade) updates.grade = normalizeGrade(grade);
    if (subject) updates.subject = subject;
    if (chapter) updates.chapter = chapter;
    if (topic) updates.topic = topic;

    const rawUrl = youtube_url || youtubeUrl;
    if (rawUrl) {
      const ytVal = validateYouTubeUrl(rawUrl);
      if (!ytVal.isValid) {
        return res.status(400).json({ success: false, message: 'Please enter a valid YouTube video URL.' });
      }
      updates.youtubeUrl = ytVal.embedUrl;
      updates.youtubeVideoId = ytVal.videoId;
      updates.thumbnail = ytVal.thumbnailUrl;
    }

    let updated = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      try {
        updated = await Lesson.findByIdAndUpdate(id, updates, { new: true });
      } catch (e) {}
    }
    if (!updated) {
      updated = memoryStore.updateLesson(id, updates);
    }

    return res.status(200).json({
      success: true,
      message: 'Video updated successfully.',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating video.' });
  }
};

exports.deleteVideo = async (req, res) => {
  return exports.deleteLesson(req, res);
};

exports.deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID is required for deletion.' });
    }

    let deletedFromDb = false;
    let targetLesson = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      try {
        targetLesson = await Lesson.findById(id);
        if (targetLesson) {
          if (req.user && req.user.role !== 'admin') {
            const userSubjects = req.user.subjects || (req.user.subject ? [req.user.subject] : []);
            const isOwner =
              (targetLesson.teacherId && String(targetLesson.teacherId) === String(req.user._id || req.user.id)) ||
              targetLesson.teacherName === req.user.name ||
              userSubjects.includes(targetLesson.subject);
            if (!isOwner) {
              return res.status(403).json({ success: false, message: 'Not authorized to delete this video.' });
            }
          }

          if (targetLesson.fileUrl && typeof targetLesson.fileUrl === 'string' && !targetLesson.fileUrl.startsWith('http')) {
            const localFilePath = path.join(__dirname, '..', targetLesson.fileUrl);
            if (fs.existsSync(localFilePath)) {
              try {
                fs.unlinkSync(localFilePath);
              } catch (unlinkErr) {}
            }
          }

          await Lesson.findByIdAndDelete(id);
          deletedFromDb = true;
        }
      } catch (dbErr) {}
    }

    const memoryDeleted = memoryStore.deleteLesson(id);

    if (deletedFromDb || memoryDeleted) {
      return res.status(200).json({
        success: true,
        message: 'Video deleted successfully.',
        deletedId: id,
      });
    }

    const fallbackIdx = (memoryStore.lessons || []).findIndex((l) => (l._id || l.id) === id);
    if (fallbackIdx !== -1) {
      memoryStore.lessons.splice(fallbackIdx, 1);
      return res.status(200).json({
        success: true,
        message: 'Video deleted successfully.',
        deletedId: id,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Video deleted successfully.',
      deletedId: id,
    });
  } catch (error) {
    console.error('Error in deleteLesson controller:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete video.' });
  }
};

/* ==========================================
   HOMEWORK MODULE
   ========================================== */
exports.getHomeworks = async (req, res) => {
  try {
    let homeworksList = [];
    const teacherId = req.user?._id || req.user?.id;
    const isTeacher = req.user?.role === 'teacher';

    try {
      const query = isTeacher && teacherId
        ? {
            $or: [
              { teacherId: teacherId },
              { teacherName: req.user?.name },
              { subject: { $in: req.user?.subjects || [req.user?.subject || 'Mathematics'] } }
            ]
          }
        : {};
      homeworksList = await Homework.find(query).sort({ createdAt: -1 });
    } catch (e) {
      homeworksList = memoryStore.homeworks;
    }
    if (!homeworksList.length && !isTeacher) homeworksList = memoryStore.homeworks;
    res.status(200).json({ success: true, count: homeworksList.length, data: homeworksList });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch homework assignments.' });
  }
};

exports.createHomework = async (req, res) => {
  try {
    const { title, description, grade, subject, dueDate, totalMarks } = req.body;
    if (!title || !description || !dueDate) {
      return res.status(400).json({ success: false, message: 'Title, description, and due date required.' });
    }

    try {
      const homework = await Homework.create({
        title,
        description,
        grade: grade || 'Grade 4',
        subject: subject || 'Mathematics',
        dueDate,
        totalMarks: totalMarks || 100,
        teacherId: req.user?._id || req.user?.id,
        teacherName: req.user?.name || 'Prof. John Keating',
        submissions: [],
      });
      return res.status(201).json({ success: true, message: 'Homework created!', data: homework });
    } catch (dbErr) {
      const memHw = memoryStore.saveHomework({
        title,
        description,
        grade: grade || 'Grade 4',
        subject: subject || 'Mathematics',
        dueDate,
        totalMarks: totalMarks || 100,
        teacherId: req.user?._id || req.user?.id,
        teacherName: req.user?.name || 'Prof. John Keating',
      });
      return res.status(201).json({ success: true, message: 'Homework created (Demo mode)!', data: memHw });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating homework.' });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { hwId, subId } = req.params;
    const { marksObtained, feedback } = req.body;

    try {
      const hw = await Homework.findById(hwId);
      if (hw) {
        const sub = hw.submissions.id(subId);
        if (sub) {
          sub.marksObtained = Number(marksObtained);
          sub.feedback = feedback || '';
          sub.status = 'graded';
          await hw.save();
          return res.status(200).json({ success: true, message: 'Submission graded successfully!', data: sub });
        }
      }
    } catch (e) {}

    const graded = memoryStore.gradeSubmission(hwId, subId, Number(marksObtained), feedback);
    res.status(200).json({ success: true, message: 'Submission graded!', data: graded });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to grade submission.' });
  }
};

/* ==========================================
   AI QUIZ GENERATOR & QUIZZES (POWERED BY AI SERVICE)
   ========================================== */
exports.getQuizzes = async (req, res) => {
  try {
    let quizList = [];
    try {
      quizList = await Quiz.find().sort({ createdAt: -1 });
    } catch (e) {
      quizList = memoryStore.quizzes;
    }
    if (!quizList.length) quizList = memoryStore.quizzes;
    res.status(200).json({ success: true, count: quizList.length, data: quizList });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch quizzes.' });
  }
};

exports.generateAiQuiz = async (req, res) => {
  try {
    const {
      grade,
      subject,
      chapter,
      topic,
      difficulty,
      questionType,
      numberOfQuestions,
      totalMarks,
      sourceMaterialText,
      sourceMaterialName,
      saveImmediately,
    } = req.body;

    if (!topic || !subject) {
      return res.status(400).json({ success: false, message: 'Subject and Topic are required for AI Quiz Generator.' });
    }

    const count = Number(numberOfQuestions) || 4;
    const targetGrade = grade || 'Grade 4';
    const targetSubject = subject || 'Mathematics';
    const targetChapter = chapter || 'Chapter 1';
    const targetTopic = topic;
    const targetDiff = difficulty || 'Medium';
    const targetType = questionType || 'mixed';
    const calculatedTotalMarks = Number(totalMarks) || count * 2;

    const quizService = require('../services/gemini/quizGeneratorService');
    const generatedQuiz = await quizService.generateQuiz({
      class: targetGrade,
      subject: targetSubject,
      chapter: targetChapter,
      topic: targetTopic,
      difficulty: targetDiff,
      questionType: targetType,
      numberOfQuestions: count,
      sourceMaterialText: sourceMaterialText || '',
      sourceMaterialName: sourceMaterialName || '',
    });
    
    generatedQuiz.isPublished = saveImmediately ? true : false;

    // the generatedQuiz is already complete from the service

    if (saveImmediately) {
      try {
        const savedQuiz = await Quiz.create({ ...generatedQuiz, isPublished: true });
        return res.status(201).json({
          success: true,
          message: '✨ AI Quiz generated and published successfully!',
          data: savedQuiz,
        });
      } catch (dbErr) {
        const memQuiz = memoryStore.saveQuiz({ ...generatedQuiz, isPublished: true });
        return res.status(201).json({
          success: true,
          message: '✨ AI Quiz generated (Demo mode)!',
          data: memQuiz,
        });
      }
    }

    // Return preview without publishing immediately
    return res.status(200).json({
      success: true,
      message: '✨ AI Quiz preview generated successfully! Review and edit before publishing.',
      data: generatedQuiz,
    });
  } catch (error) {
    console.error('generateAiQuiz error:', error);
    res.status(500).json({ success: false, message: 'AI Quiz Generation failed.' });
  }
};

exports.regenerateQuestion = async (req, res) => {
  try {
    const { grade, subject, chapter, topic, difficulty, questionType, existingQuestions, sourceMaterialText } = req.body;

    const newQuestion = await aiService.regenerateSingleQuestion(
      grade || 'Grade 4',
      subject || 'Mathematics',
      chapter || 'Chapter 1',
      topic || 'General Topic',
      difficulty || 'Medium',
      questionType || 'mixed',
      existingQuestions || [],
      sourceMaterialText || ''
    );

    return res.status(200).json({
      success: true,
      message: 'Question regenerated successfully!',
      data: newQuestion,
    });
  } catch (error) {
    console.error('regenerateQuestion error:', error);
    res.status(500).json({ success: false, message: 'Failed to regenerate question.' });
  }
};

exports.saveQuiz = async (req, res) => {
  try {
    const quizData = req.body;
    if (!quizData || !quizData.title || !quizData.questions || !quizData.questions.length) {
      return res.status(400).json({ success: false, message: 'Invalid quiz payload.' });
    }

    quizData.isPublished = true;

    try {
      if (quizData._id || quizData.id) {
        let existing = null;
        try {
          existing = await Quiz.findById(quizData._id || quizData.id);
        } catch (e) {}

        if (existing) {
          Object.assign(existing, quizData);
          await existing.save();
          return res.status(200).json({ success: true, message: 'Quiz published successfully!', data: existing });
        }
      }
      const savedQuiz = await Quiz.create(quizData);
      return res.status(201).json({ success: true, message: 'Quiz published successfully!', data: savedQuiz });
    } catch (dbErr) {
      const memQuiz = memoryStore.saveQuiz(quizData);
      return res.status(201).json({ success: true, message: 'Quiz published (Demo mode)!', data: memQuiz });
    }
  } catch (error) {
    console.error('saveQuiz error:', error);
    res.status(500).json({ success: false, message: 'Failed to publish quiz.' });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    try {
      const deleted = await Quiz.findByIdAndDelete(quizId);
      if (deleted) {
        return res.status(200).json({ success: true, message: 'Quiz deleted successfully.' });
      }
    } catch (e) {}
    
    // Fallback to memoryStore
    const index = memoryStore.quizzes.findIndex((q) => q.id === quizId || q._id === quizId);
    if (index !== -1) {
      memoryStore.quizzes.splice(index, 1);
      return res.status(200).json({ success: true, message: 'Quiz deleted from demo storage.' });
    }
    
    res.status(404).json({ success: false, message: 'Quiz not found.' });
  } catch (error) {
    console.error('deleteQuiz error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete quiz.' });
  }
};

/* ==========================================
   TEACHER QUESTION BANK MODULE (20 QUESTIONS)
   ========================================== */

/**
 * Validate a Question Bank payload before creating or updating
 */
const validateQuestionBankPayload = (body) => {
  const { title, grade, subject, topic, questions } = body;
  if (!title || !title.trim()) {
    return 'Question bank title is required.';
  }
  if (!grade || !grade.trim()) {
    return 'Class/Grade is required.';
  }
  if (!subject || !subject.trim()) {
    return 'Subject is required.';
  }
  if (!topic || !topic.trim()) {
    return 'Topic is required.';
  }
  if (!Array.isArray(questions) || questions.length !== 20) {
    return `A complete question bank requires exactly 20 questions. Provided: ${Array.isArray(questions) ? questions.length : 0} questions.`;
  }

  const seenQuestions = new Set();
  for (let i = 0; i < 20; i++) {
    const q = questions[i];
    if (!q || !q.question || !q.question.trim()) {
      return `Question #${i + 1} is missing the question text.`;
    }

    const qTextTrimmed = q.question.trim().toLowerCase();
    if (seenQuestions.has(qTextTrimmed)) {
      return `Duplicate question detected at Question #${i + 1}. Each of the 20 questions must be unique.`;
    }
    seenQuestions.add(qTextTrimmed);

    if (!Array.isArray(q.options) || q.options.length !== 4) {
      return `Question #${i + 1} must have exactly 4 options (A, B, C, D).`;
    }

    for (let optIdx = 0; optIdx < 4; optIdx++) {
      const opt = q.options[optIdx];
      if (opt === undefined || opt === null || (typeof opt === 'string' && !opt.trim())) {
        const letters = ['A', 'B', 'C', 'D'];
        return `Question #${i + 1} is missing Option ${letters[optIdx]}.`;
      }
    }

    if (!q.correctAnswer || (typeof q.correctAnswer === 'string' && !q.correctAnswer.trim())) {
      return `Question #${i + 1} must have a correct answer selected.`;
    }
  }

  return null; // Valid
};

// @desc    Get all question banks for teacher
// @route   GET /api/teacher/question-banks
// @access  Private (Teacher, Admin)
exports.getQuestionBanks = async (req, res) => {
  try {
    const teacherId = req.user?._id || req.user?.id;
    const isTeacher = req.user?.role === 'teacher';
    const filter = isTeacher && teacherId ? { $or: [{ teacher: teacherId }, { teacherName: req.user?.name }] } : {};

    let banks = [];
    try {
      banks = await QuestionBank.find(filter).sort({ createdAt: -1 });
    } catch (e) {
      banks = memoryStore.questionBanks || [];
    }
    if (!banks.length && memoryStore.questionBanks) {
      banks = memoryStore.questionBanks;
    }

    // Attach attempt count statistics
    let attempts = [];
    try {
      attempts = await QuizAttempt.find().lean();
    } catch (e) {
      attempts = memoryStore.quizAttempts || [];
    }

    const banksWithStats = banks.map((b) => {
      const doc = b.toObject ? b.toObject() : { ...b };
      const bankId = (doc._id || doc.id).toString();
      const bankAttempts = attempts.filter((a) => (a.questionBankId || a.questionBank)?.toString() === bankId);
      const attemptCount = bankAttempts.length;
      const averageScore = attemptCount > 0
        ? Math.round(bankAttempts.reduce((acc, a) => acc + (a.percentage || (a.score / a.totalQuestions) * 100), 0) / attemptCount)
        : 0;

      return {
        ...doc,
        availableQuestionsCount: doc.questions ? doc.questions.length : 20,
        attemptCount,
        averageScore,
      };
    });

    res.status(200).json({
      success: true,
      count: banksWithStats.length,
      data: banksWithStats,
    });
  } catch (error) {
    console.error('getQuestionBanks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch question banks.' });
  }
};

// @desc    Get single question bank by ID
// @route   GET /api/teacher/question-banks/:id
// @access  Private (Teacher, Admin)
exports.getQuestionBankById = async (req, res) => {
  try {
    const { id } = req.params;
    let bank = null;

    try {
      bank = await QuestionBank.findById(id);
    } catch (e) {}

    if (!bank) {
      bank = (memoryStore.questionBanks || []).find((b) => b.id === id || b._id === id);
    }

    if (!bank) {
      return res.status(404).json({ success: false, message: 'Question bank not found.' });
    }

    res.status(200).json({
      success: true,
      data: bank,
    });
  } catch (error) {
    console.error('getQuestionBankById error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch question bank details.' });
  }
};

// @desc    Create a 20-question Question Bank
// @route   POST /api/teacher/question-banks
// @access  Private (Teacher, Admin)
exports.createQuestionBank = async (req, res) => {
  try {
    const validationError = validateQuestionBankPayload(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    if (!req.user?._id || !mongoose.Types.ObjectId.isValid(req.user._id.toString())) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authenticated user ID',
      });
    }

    console.log(`[AUTH] QuestionBank teacher ID: ${req.user._id}`);

    const { title, grade, subject, topic, difficulty, questions } = req.body;
    const teacherId = req.user._id;
    const teacherName = req.user?.name || 'Teacher';

    const bankPayload = {
      teacher: teacherId,
      teacherName,
      title: title.trim(),
      grade: grade.trim(),
      subject: subject.trim(),
      topic: topic.trim(),
      difficulty: difficulty || 'Medium',
      totalQuestionsCount: 20,
      questions: questions.map((q, idx) => ({
        question: q.question.trim(),
        options: q.options.map((opt) => opt.toString().trim()),
        correctAnswer: q.correctAnswer.toString().trim(),
        explanation: (q.explanation || '').trim(),
        difficulty: q.difficulty || difficulty || 'Medium',
      })),
      isPublished: true,
    };

    if (mongoose.connection.readyState !== 1) {
      console.error('[QuestionBank] MongoDB is not connected (readyState !== 1)');
      return res.status(503).json({
        success: false,
        message: 'Database is unavailable. Please try again later.',
      });
    }

    try {
      const createdBank = await QuestionBank.create(bankPayload);
      return res.status(201).json({
        success: true,
        message: '🎉 Question Bank with 20 questions published successfully!',
        data: createdBank,
      });
    } catch (dbErr) {
      console.error('[QuestionBank] MongoDB write failed:', dbErr);
      return res.status(500).json({
        success: false,
        message: 'Failed to create question bank in database.',
        error: process.env.NODE_ENV === 'production' ? undefined : dbErr.message,
      });
    }
  } catch (error) {
    console.error('createQuestionBank error:', error);
    res.status(500).json({ success: false, message: 'Failed to create question bank.' });
  }
};

// @desc    Update an existing Question Bank
// @route   PUT /api/teacher/question-banks/:id
// @access  Private (Teacher, Admin)
exports.updateQuestionBank = async (req, res) => {
  try {
    const { id } = req.params;
    const validationError = validateQuestionBankPayload(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const { title, grade, subject, topic, difficulty, questions } = req.body;

    const updatePayload = {
      title: title.trim(),
      grade: grade.trim(),
      subject: subject.trim(),
      topic: topic.trim(),
      difficulty: difficulty || 'Medium',
      totalQuestionsCount: 20,
      questions: questions.map((q, idx) => ({
        _id: q._id || q.id || undefined,
        question: q.question.trim(),
        options: q.options.map((opt) => opt.toString().trim()),
        correctAnswer: q.correctAnswer.toString().trim(),
        explanation: (q.explanation || '').trim(),
        difficulty: q.difficulty || difficulty || 'Medium',
      })),
      isPublished: true,
    };

    try {
      const updated = await QuestionBank.findByIdAndUpdate(id, updatePayload, { new: true });
      if (updated) {
        return res.status(200).json({
          success: true,
          message: 'Question Bank updated successfully!',
          data: updated,
        });
      }
    } catch (dbErr) {}

    const memUpdated = memoryStore.updateQuestionBank(id, updatePayload);
    if (memUpdated) {
      return res.status(200).json({
        success: true,
        message: 'Question Bank updated (Demo Mode)!',
        data: memUpdated,
      });
    }

    res.status(404).json({ success: false, message: 'Question bank not found.' });
  } catch (error) {
    console.error('updateQuestionBank error:', error);
    res.status(500).json({ success: false, message: 'Failed to update question bank.' });
  }
};

// @desc    Delete a Question Bank
// @route   DELETE /api/teacher/question-banks/:id
// @access  Private (Teacher, Admin)
exports.deleteQuestionBank = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      const deleted = await QuestionBank.findByIdAndDelete(id);
      if (deleted) {
        return res.status(200).json({ success: true, message: 'Question bank deleted successfully.' });
      }
    } catch (e) {}

    const memDeleted = memoryStore.deleteQuestionBank(id);
    if (memDeleted) {
      return res.status(200).json({ success: true, message: 'Question bank deleted from demo storage.' });
    }

    res.status(404).json({ success: false, message: 'Question bank not found.' });
  } catch (error) {
    console.error('deleteQuestionBank error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete question bank.' });
  }
};

// @desc    Get student results / attempts for a specific question bank
// @route   GET /api/teacher/question-banks/:id/results
// @access  Private (Teacher, Admin)
exports.getQuestionBankResults = async (req, res) => {
  try {
    const { id } = req.params;
    let attempts = [];

    try {
      attempts = await QuizAttempt.find({
        $or: [{ questionBank: id }, { questionBankId: id }],
      }).sort({ takenAt: -1 });
    } catch (e) {
      attempts = (memoryStore.quizAttempts || []).filter((a) => (a.questionBankId || a.questionBank)?.toString() === id.toString());
    }

    res.status(200).json({
      success: true,
      count: attempts.length,
      data: attempts,
    });
  } catch (error) {
    console.error('getQuestionBankResults error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student quiz attempts.' });
  }
};

// @desc    Get all student quiz attempts for teacher
// @route   GET /api/teacher/question-banks-results
// @access  Private (Teacher, Admin)
exports.getAllTeacherQuizResults = async (req, res) => {
  try {
    let attempts = [];
    try {
      attempts = await QuizAttempt.find().sort({ takenAt: -1 });
    } catch (e) {
      attempts = memoryStore.quizAttempts || [];
    }

    res.status(200).json({
      success: true,
      count: attempts.length,
      data: attempts,
    });
  } catch (error) {
    console.error('getAllTeacherQuizResults error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch teacher quiz results.' });
  }
};

/* ==========================================
   STUDENT ANALYTICS
   ========================================== */
exports.getStudentAnalytics = async (req, res) => {
  try {
    let students = [];
    let homeworks = [];

    const teacherGrades = req.user?.grades && req.user.grades.length > 0
      ? req.user.grades
      : (req.user?.grade ? [req.user.grade] : ['Grade 4']);
    const studentQuery = req.user?.role === 'admin'
      ? { role: 'student' }
      : { role: 'student', grade: { $in: teacherGrades } };
    
    try {
      students = await User.find(studentQuery).lean();
      homeworks = await Homework.find().lean();
    } catch (dbErr) {
      console.warn('[Teacher Controller] MongoDB unavailable, falling back to memoryStore for analytics:', dbErr.message);
      students = memoryStore.users.filter((u) => u.role === 'student' && (req.user?.role === 'admin' || teacherGrades.includes(u.grade)));
      homeworks = memoryStore.homeworks;
    }
    
    const analyticsData = [];
    
    for (const student of students) {
      // Calculate homework completion
      let completedHws = 0;
      homeworks.forEach((hw) => {
        const submitted = hw.submissions?.some(
          (sub) => sub.studentId === (student._id || student.id).toString()
        );
        if (submitted) {
          completedHws++;
        }
      });
      
      const totalHws = homeworks.length;
      const homeworkCompletion = totalHws > 0 ? Math.round((completedHws / totalHws) * 100) : 100;
      
      // Calculate quiz average
      const quizResults = student.quizResults || [];
      const totalQuizzesTaken = quizResults.length;
      const quizAvg = totalQuizzesTaken > 0
        ? Math.round(quizResults.reduce((acc, q) => acc + q.score, 0) / totalQuizzesTaken)
        : 85; // Default average if no quizzes taken
      
      // Gather weak concepts from failed questions/quizzes
      const weakTopicsSet = new Set();
      quizResults.forEach((r) => {
        if (r.score < 75 && r.weakConcepts) {
          r.weakConcepts.forEach((c) => weakTopicsSet.add(c));
        }
      });
      const weakTopics = Array.from(weakTopicsSet).slice(0, 3);
      if (weakTopics.length === 0) {
        weakTopics.push('None detected yet');
      }
      
      // Gather strong concepts
      const strongTopicsSet = new Set();
      quizResults.forEach((r) => {
        if (r.score >= 80) {
          strongTopicsSet.add(r.quizTitle || 'Core Concepts');
        }
      });
      const strongTopics = Array.from(strongTopicsSet).slice(0, 3);
      if (strongTopics.length === 0) {
        strongTopics.push('Basic Concepts');
      }
      
      // Risk level
      let riskLevel = 'low';
      if (quizAvg < 60 || homeworkCompletion < 50) {
        riskLevel = 'high';
      } else if (quizAvg < 75 || homeworkCompletion < 70) {
        riskLevel = 'medium';
      }
      
      // Personalized recommendation
      let aiRecommendation = '';
      if (riskLevel === 'high') {
        aiRecommendation = `Schedule 1-on-1 conceptual review on ${weakTopics[0] || 'core topics'} and notify parent.`;
      } else if (riskLevel === 'medium') {
        aiRecommendation = `Recommend guided practice exercises on ${weakTopics[0] || 'foundations'} to strengthen mastery.`;
      } else {
        aiRecommendation = `Demonstrating strong pace in ${strongTopics[0] || 'core concepts'}. Assign extension challenges.`;
      }
      
      analyticsData.push({
        studentId: (student._id || student.id).toString(),
        studentName: student.name,
        riskLevel,
        grade: student.grade || teacherGrades[0] || 'Grade 4',
        learningSpeed: quizAvg >= 85 ? 'Fast' : quizAvg >= 70 ? 'Moderate' : 'Needs Support',
        attendance: 96,
        homeworkCompletion,
        quizAverage: quizAvg,
        weakTopics,
        strongTopics,
        aiRecommendation,
      });
    }
    
    res.status(200).json({
      success: true,
      data: analyticsData,
    });
  } catch (error) {
    console.error('getStudentAnalytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student analytics.' });
  }
};

/* ==========================================
   PARENT COMMUNICATION & WORKING HOURS
   ========================================== */
exports.getWorkingHoursStatus = async (req, res) => {
  const now = new Date();
  const currentHour = now.getHours();
  const isWorkingHours = currentHour >= 9 && currentHour < 16;

  res.status(200).json({
    success: true,
    isWorkingHours,
    workingHours: '9:00 AM – 4:00 PM',
    message: isWorkingHours
      ? 'Teacher is currently available for parent communication.'
      : 'Teacher is currently unavailable. Working hours are 9 AM – 4 PM.',
  });
};

/* ==========================================
   ATTENDANCE MANAGEMENT
   ========================================== */
exports.getAttendance = async (req, res) => {
  try {
    const { grade, date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const teacherGrades = req.user?.grades && req.user.grades.length > 0
      ? req.user.grades
      : (req.user?.grade ? [req.user.grade] : ['Grade 4']);
    const targetGrade = grade || teacherGrades[0];

    let attendanceRecords = [];
    try {
      attendanceRecords = await Attendance.find({ grade: targetGrade, date: targetDate });
    } catch (e) {}

    let students = [];
    try {
      students = await User.find({ role: 'student', grade: targetGrade }).select('name grade');
    } catch (e) {
      students = memoryStore.findByRole('student').filter((s) => s.grade === targetGrade);
    }

    const formattedRecords = students.map((st) => {
      const existing = attendanceRecords.find((a) => a.student?.toString() === (st._id || st.id).toString());
      return {
        studentId: st._id || st.id,
        studentName: st.name,
        grade: st.grade,
        status: existing ? existing.status : 'On Time',
        time: existing ? existing.time : '08:45 AM',
        date: targetDate,
      };
    });

    res.status(200).json({
      success: true,
      date: targetDate,
      grade: targetGrade,
      data: formattedRecords,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance.' });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { studentId, date, status, time, notes } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID required.' });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    let student = null;
    try {
      student = await User.findById(studentId);
    } catch (e) {
      student = memoryStore.findById(studentId);
    }

    const studentName = student ? student.name : 'Student';
    const studentGrade = student ? (student.grade || 'Grade 4') : 'Grade 4';

    try {
      let record = await Attendance.findOne({ student: studentId, date: targetDate });
      if (record) {
        record.status = status || 'On Time';
        record.time = time || record.time;
        record.notes = notes || record.notes;
        record.markedBy = req.user?._id;
        await record.save();
      } else {
        record = await Attendance.create({
          student: studentId,
          studentName,
          grade: studentGrade,
          date: targetDate,
          status: status || 'On Time',
          time: time || '08:45 AM',
          markedBy: req.user?._id,
          notes: notes || '',
        });
      }
      return res.status(200).json({
        success: true,
        message: `Attendance marked for ${studentName} as ${status || 'On Time'}`,
        data: record,
      });
    } catch (dbErr) {
      return res.status(200).json({
        success: true,
        message: `Attendance recorded for ${studentName} as ${status || 'On Time'} (Demo Mode)`,
        data: { studentId, studentName, grade: studentGrade, date: targetDate, status: status || 'On Time' },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record attendance.' });
  }
};
