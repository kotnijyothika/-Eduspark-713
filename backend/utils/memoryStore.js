const bcrypt = require('bcryptjs');

const memoryUsers = [];
const memoryClasses = [
  {
    _id: 'class-001',
    id: 'class-001',
    name: 'Grade 4 - Alpha',
    grade: 'Grade 4',
    section: 'A',
    room: 'Room 101',
    teacherName: 'Prof. John Keating',
    capacity: 30,
    studentsCount: 24,
  },
];

const memoryLessons = [
  {
    _id: 'lesson-001',
    id: 'lesson-001',
    title: 'Understanding Equivalent Fractions',
    description: 'Learn how to visualize and calculate equivalent fractions with fun pie diagrams.',
    grade: 'Grade 4',
    className: 'Grade 4 - Alpha',
    classId: 'class-001',
    subject: 'Mathematics',
    subjectId: 'subj-1',
    chapter: 'Chapter 1: Fractions & Decimals',
    chapterId: 'ch-1',
    topic: 'Equivalent Fractions',
    topicId: 'top-1',
    category: 'daily',
    contentType: 'video',
    youtubeUrl: 'https://www.youtube.com/watch?v=CA9XLJpQp3c',
    youtubeVideoId: 'CA9XLJpQp3c',
    thumbnail: 'https://img.youtube.com/vi/CA9XLJpQp3c/hqdefault.jpg',
    teacherName: 'Prof. John Keating',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'lesson-002',
    id: 'lesson-002',
    title: 'Photosynthesis & Plant Life Cycle',
    description: 'Weekly concept covering how green plants produce oxygen and food from sunlight.',
    grade: 'Grade 4',
    className: 'Grade 4 - Alpha',
    classId: 'class-001',
    subject: 'Science',
    subjectId: 'subj-2',
    chapter: 'Chapter 1: Plants and Their Parts',
    chapterId: 'ch-sci-1',
    topic: 'Photosynthesis and Chlorophyll',
    topicId: 'top-sci-1',
    category: 'weekly',
    contentType: 'video',
    youtubeUrl: 'https://www.youtube.com/watch?v=EstPeBt9CyU',
    youtubeVideoId: 'EstPeBt9CyU',
    thumbnail: 'https://img.youtube.com/vi/EstPeBt9CyU/hqdefault.jpg',
    teacherName: 'Prof. John Keating',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'lesson-003',
    id: 'lesson-003',
    title: 'Exploring the Solar System & Planets',
    description: 'Discover the sun, planets, and orbits in our solar system.',
    grade: 'Grade 4',
    className: 'Grade 4 - Alpha',
    classId: 'class-001',
    subject: 'Science',
    subjectId: 'subj-3',
    chapter: 'Chapter 2: Earth & Space',
    chapterId: 'ch-sci-2',
    topic: 'Solar System & Orbits',
    topicId: 'top-sci-2',
    category: 'daily',
    contentType: 'video',
    youtubeUrl: 'https://www.youtube.com/watch?v=libKVRa01L8',
    youtubeVideoId: 'libKVRa01L8',
    thumbnail: 'https://img.youtube.com/vi/libKVRa01L8/hqdefault.jpg',
    teacherName: 'Prof. John Keating',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const memoryHomeworks = [
  {
    _id: 'hw-001',
    id: 'hw-001',
    title: 'Fractions Practice Sheet #3',
    description: 'Solve problems 1 through 10 on page 42 of your workbook or upload your notebook picture.',
    grade: 'Grade 4',
    subject: 'Mathematics',
    dueDate: '2026-07-28',
    totalMarks: 100,
    teacherName: 'Prof. John Keating',
    submissions: [
      {
        _id: 'sub-001',
        id: 'sub-001',
        studentId: 'demo-student-id-004',
        studentName: 'Leo Vance',
        content: 'I completed all 10 problems on equivalent fractions. 1/2 = 2/4 = 4/8.',
        submittedAt: new Date(),
        marksObtained: 95,
        feedback: 'Excellent work Leo! Very clear steps.',
        status: 'graded',
      },
    ],
  },
];

const memoryQuizzes = [
  {
    _id: 'quiz-001',
    id: 'quiz-001',
    title: 'Grade 4 Math - Fractions & Decimals Quiz',
    grade: 'Grade 4',
    subject: 'Mathematics',
    topic: 'Fractions & Decimals',
    difficulty: 'Medium',
    questions: [
      {
        question: 'Which of the following is equivalent to 1/2?',
        type: 'mcq',
        options: ['2/4', '3/8', '1/3', '4/5'],
        correctAnswer: '2/4',
        explanation: 'Multiply both numerator and denominator by 2.',
      },
      {
        question: 'True or False: 0.5 is equal to 1/2.',
        type: 'true_false',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: '0.5 expressed as a fraction is 5/10 which simplifies to 1/2.',
      },
      {
        question: 'What is 3/4 + 1/4?',
        type: 'fill_blank',
        options: [],
        correctAnswer: '1',
        explanation: '3/4 + 1/4 = 4/4 = 1.',
      },
    ],
    isPublished: true,
  },
];

const memoryQuestionBanks = [
  {
    _id: 'qb-001',
    id: 'qb-001',
    title: 'Grade 4 Math - Operations & Fractions Master Bank',
    grade: 'Grade 4',
    subject: 'Mathematics',
    topic: 'Fractions & Arithmetic',
    difficulty: 'Medium',
    teacher: 'demo-teacher-id-002',
    teacherName: 'Prof. John Keating',
    totalQuestionsCount: 20,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    questions: [
      { _id: 'qb-q1', question: 'What is 5 + 3?', options: ['6', '7', '8', '9'], correctAnswer: '8', explanation: '5 + 3 equals 8.', difficulty: 'Easy' },
      { _id: 'qb-q2', question: 'What is 12 - 4?', options: ['6', '8', '10', '7'], correctAnswer: '8', explanation: '12 minus 4 is 8.', difficulty: 'Easy' },
      { _id: 'qb-q3', question: 'Which fraction is equivalent to 1/2?', options: ['2/4', '3/8', '1/3', '4/5'], correctAnswer: '2/4', explanation: 'Multiply top and bottom by 2.', difficulty: 'Medium' },
      { _id: 'qb-q4', question: 'What is 3/4 + 1/4?', options: ['4/8', '1', '2/4', '3/8'], correctAnswer: '1', explanation: '3/4 + 1/4 = 4/4 = 1.', difficulty: 'Medium' },
      { _id: 'qb-q5', question: 'What is 7 x 6?', options: ['36', '42', '48', '54'], correctAnswer: '42', explanation: '7 multiplied by 6 is 42.', difficulty: 'Medium' },
      { _id: 'qb-q6', question: 'What is 45 ÷ 5?', options: ['8', '9', '7', '6'], correctAnswer: '9', explanation: '45 divided by 5 is 9.', difficulty: 'Easy' },
      { _id: 'qb-q7', question: 'Which of the following is an even number?', options: ['13', '21', '28', '35'], correctAnswer: '28', explanation: '28 is divisible by 2.', difficulty: 'Easy' },
      { _id: 'qb-q8', question: 'What is the value of the digit 7 in 472?', options: ['7', '70', '700', '7000'], correctAnswer: '70', explanation: '7 is in the tens place so its value is 70.', difficulty: 'Medium' },
      { _id: 'qb-q9', question: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], correctAnswer: '6', explanation: 'A hexagon has 6 sides.', difficulty: 'Easy' },
      { _id: 'qb-q10', question: 'What is 15 + 28?', options: ['33', '42', '43', '45'], correctAnswer: '43', explanation: '15 + 28 = 43.', difficulty: 'Medium' },
      { _id: 'qb-q11', question: 'What is 100 - 37?', options: ['63', '73', '67', '53'], correctAnswer: '63', explanation: '100 - 37 = 63.', difficulty: 'Medium' },
      { _id: 'qb-q12', question: 'Which fraction is greater than 1/2?', options: ['1/3', '1/4', '3/4', '2/5'], correctAnswer: '3/4', explanation: '3/4 is 0.75, which is greater than 0.5.', difficulty: 'Medium' },
      { _id: 'qb-q13', question: 'What is the perimeter of a square with side length 5 cm?', options: ['10 cm', '15 cm', '20 cm', '25 cm'], correctAnswer: '20 cm', explanation: 'Perimeter = 4 x side = 4 x 5 = 20 cm.', difficulty: 'Hard' },
      { _id: 'qb-q14', question: 'How many minutes are in 2 hours?', options: ['60', '100', '120', '180'], correctAnswer: '120', explanation: '1 hour = 60 minutes, 2 hours = 120 minutes.', difficulty: 'Easy' },
      { _id: 'qb-q15', question: 'What is 8 x 9?', options: ['72', '64', '81', '76'], correctAnswer: '72', explanation: '8 x 9 = 72.', difficulty: 'Medium' },
      { _id: 'qb-q16', question: 'What is 5/6 - 2/6?', options: ['3/6', '7/6', '1/6', '3/12'], correctAnswer: '3/6', explanation: '5/6 - 2/6 = 3/6.', difficulty: 'Medium' },
      { _id: 'qb-q17', question: 'What is 50 x 4?', options: ['150', '200', '250', '300'], correctAnswer: '200', explanation: '50 multiplied by 4 is 200.', difficulty: 'Easy' },
      { _id: 'qb-q18', question: 'How many centimeters are in 1 meter?', options: ['10', '100', '1000', '10000'], correctAnswer: '100', explanation: '1 meter = 100 centimeters.', difficulty: 'Easy' },
      { _id: 'qb-q19', question: 'What is the next number in the pattern: 4, 8, 12, 16, __?', options: ['18', '20', '22', '24'], correctAnswer: '20', explanation: 'The pattern adds 4 each step.', difficulty: 'Easy' },
      { _id: 'qb-q20', question: 'What is 64 ÷ 8?', options: ['6', '7', '8', '9'], correctAnswer: '8', explanation: '8 x 8 = 64, so 64 ÷ 8 = 8.', difficulty: 'Easy' },
    ],
  },
];

const memoryQuizAttempts = [
  {
    _id: 'attempt-001',
    student: 'demo-student-id-004',
    studentName: 'Leo Vance',
    studentGrade: 'Grade 4',
    questionBankId: 'qb-001',
    quizTitle: 'Grade 4 Math - Operations & Fractions Master Bank',
    subject: 'Mathematics',
    topic: 'Fractions & Arithmetic',
    selectedQuestionIds: ['qb-q1', 'qb-q3', 'qb-q6', 'qb-q15'],
    score: 4,
    totalQuestions: 4,
    percentage: 100,
    results: [
      { questionId: 'qb-q1', question: 'What is 5 + 3?', studentAnswer: '8', correctAnswer: '8', isCorrect: true, explanation: '5 + 3 equals 8.' },
      { questionId: 'qb-q3', question: 'Which fraction is equivalent to 1/2?', studentAnswer: '2/4', correctAnswer: '2/4', isCorrect: true, explanation: 'Multiply top and bottom by 2.' },
      { questionId: 'qb-q6', question: 'What is 45 ÷ 5?', studentAnswer: '9', correctAnswer: '9', isCorrect: true, explanation: '45 divided by 5 is 9.' },
      { questionId: 'qb-q15', question: 'What is 8 x 9?', studentAnswer: '72', correctAnswer: '72', isCorrect: true, explanation: '8 x 9 = 72.' },
    ],
    weakConcepts: [],
    takenAt: new Date(Date.now() - 3600000),
  },
];

const memoryAchievements = [
  { id: 'ach-1', title: '5-Day Streak Master', description: 'Logged in and completed learning 5 days in a row!', icon: '🔥', starsReward: 50, coinsReward: 100, unlocked: true },
  { id: 'ach-2', title: 'Fraction Explorer', description: 'Scored over 90% on Fractions & Decimals Quiz', icon: '⭐', starsReward: 30, coinsReward: 60, unlocked: true },
  { id: 'ach-3', title: 'Bookworm Junior', description: 'Bookmarked and completed 5 core subject lessons', icon: '📚', starsReward: 20, coinsReward: 40, unlocked: true },
  { id: 'ach-4', title: 'AI Curiosity Star', description: 'Asked 3 guided questions to the AI Tutor', icon: '🤖', starsReward: 25, coinsReward: 50, unlocked: false },
];

const memoryBookmarks = ['lesson-001'];

const initDemoUsers = () => {
  const defaultPasswordHash = bcrypt.hashSync('password123', 10);

  const demoAccounts = [
    {
      _id: 'demo-admin-id-001',
      id: 'demo-admin-id-001',
      name: 'Dr. Sarah Connor',
      email: 'admin@eduspark.ai',
      password: defaultPasswordHash,
      role: 'admin',
      isVerified: true,
    },
    {
      _id: 'demo-teacher-id-002',
      id: 'demo-teacher-id-002',
      name: 'Prof. John Keating',
      email: 'teacher@eduspark.ai',
      password: defaultPasswordHash,
      role: 'teacher',
      isVerified: true,
      subject: 'Mathematics',
      subjects: ['Mathematics', 'Science'],
      grade: 'Grade 4',
      grades: ['Grade 4', 'Grade 5'],
      assignedClass: 'Grade 4 - Alpha',
    },
    {
      _id: 'demo-parent-id-003',
      id: 'demo-parent-id-003',
      name: 'Eleanor Vance',
      email: 'parent@eduspark.ai',
      password: defaultPasswordHash,
      role: 'parent',
      isVerified: true,
    },
    {
      _id: 'demo-student-id-004',
      id: 'demo-student-id-004',
      name: 'Leo Vance',
      email: 'student@eduspark.ai',
      password: defaultPasswordHash,
      role: 'student',
      isVerified: true,
      grade: 'Grade 4',
      stars: 140,
      coins: 250,
      streak: 5,
    },
  ];

  demoAccounts.forEach((acc) => {
    if (!memoryUsers.find((u) => u.email === acc.email)) {
      memoryUsers.push(acc);
    }
  });
};

initDemoUsers();

module.exports = {
  users: memoryUsers,
  classes: memoryClasses,
  lessons: memoryLessons,
  homeworks: memoryHomeworks,
  quizzes: memoryQuizzes,
  achievements: memoryAchievements,
  bookmarks: memoryBookmarks,
  findByEmail: (email) => memoryUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()),
  findById: (id) => memoryUsers.find((u) => u.id === id || u._id === id),
  findByRole: (role) => memoryUsers.filter((u) => u.role === role),
  findByResetToken: (token) => memoryUsers.find((u) => u.resetPasswordToken === token && (!u.resetPasswordExpires || u.resetPasswordExpires > Date.now())),
  findByVerifyToken: (token) => memoryUsers.find((u) => u.verificationToken === token),
  saveUser: (userData) => {
    const existingIndex = memoryUsers.findIndex((u) => (userData.id && u.id === userData.id) || u.email === userData.email);
    if (existingIndex >= 0) {
      memoryUsers[existingIndex] = { ...memoryUsers[existingIndex], ...userData };
      return memoryUsers[existingIndex];
    }
    const id = userData.id || 'mem-' + Date.now();
    const newUser = { _id: id, id, ...userData };
    memoryUsers.push(newUser);
    return newUser;
  },
  deleteUser: (id) => {
    const index = memoryUsers.findIndex((u) => u.id === id || u._id === id);
    if (index >= 0) return memoryUsers.splice(index, 1)[0];
    return null;
  },
  toggleBookmark: (lessonId) => {
    const index = memoryBookmarks.indexOf(lessonId);
    if (index >= 0) {
      memoryBookmarks.splice(index, 1);
      return false; // unbookmarked
    } else {
      memoryBookmarks.push(lessonId);
      return true; // bookmarked
    }
  },
  addHomeworkSubmission: (hwId, submissionData) => {
    const hw = memoryHomeworks.find((h) => h.id === hwId || h._id === hwId);
    if (hw) {
      const newSub = {
        _id: 'sub-' + Date.now(),
        id: 'sub-' + Date.now(),
        submittedAt: new Date(),
        status: 'submitted',
        marksObtained: 0,
        feedback: '',
        ...submissionData,
      };
      hw.submissions = hw.submissions || [];
      hw.submissions.push(newSub);
      return newSub;
    }
    return null;
  },
  saveLesson: (lessonData) => {
    // Prevent duplicate YouTube videos for same Class + Subject + Chapter + Topic
    if (lessonData.youtubeVideoId) {
      const isDuplicate = memoryLessons.some((l) => {
        const matchVideo = l.youtubeVideoId === lessonData.youtubeVideoId;
        const matchClass = (l.className || l.grade || '').toLowerCase() === (lessonData.className || lessonData.grade || '').toLowerCase();
        const matchSubj = (l.subject || '').toLowerCase() === (lessonData.subject || '').toLowerCase();
        const matchChap = (l.chapter || '').toLowerCase() === (lessonData.chapter || '').toLowerCase();
        const matchTop = (l.topic || '').toLowerCase() === (lessonData.topic || '').toLowerCase();
        return matchVideo && matchClass && matchSubj && matchChap && matchTop;
      });
      if (isDuplicate) {
        const error = new Error('This YouTube video has already been added to this topic.');
        error.code = 'DUPLICATE_VIDEO';
        throw error;
      }
    }

    const id = lessonData.id || lessonData._id || 'lesson-' + Date.now();
    const newLesson = {
      _id: id,
      id,
      className: lessonData.className || lessonData.grade || 'Grade 4 - Alpha',
      classId: lessonData.classId || 'class-001',
      subject: lessonData.subject || 'Mathematics',
      subjectId: lessonData.subjectId || 'subj-1',
      chapter: lessonData.chapter || 'Chapter 1: Fractions & Decimals',
      chapterId: lessonData.chapterId || 'ch-1',
      topic: lessonData.topic || 'Basic Fractions',
      topicId: lessonData.topicId || 'top-1',
      youtubeVideoId: lessonData.youtubeVideoId || '',
      thumbnail: lessonData.thumbnail || (lessonData.youtubeVideoId ? `https://img.youtube.com/vi/${lessonData.youtubeVideoId}/hqdefault.jpg` : ''),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...lessonData,
    };
    memoryLessons.unshift(newLesson);
    return newLesson;
  },
  updateLesson: (id, updateData) => {
    const idx = memoryLessons.findIndex((l) => l.id === id || l._id === id);
    if (idx >= 0) {
      memoryLessons[idx] = {
        ...memoryLessons[idx],
        ...updateData,
        updatedAt: new Date(),
      };
      return memoryLessons[idx];
    }
    return null;
  },
  deleteLesson: (id) => {
    const idx = memoryLessons.findIndex((l) => l.id === id || l._id === id);
    if (idx >= 0) {
      const removed = memoryLessons.splice(idx, 1)[0];
      const bmIdx = memoryBookmarks.indexOf(id);
      if (bmIdx >= 0) memoryBookmarks.splice(bmIdx, 1);
      return removed;
    }
    return null;
  },
  saveHomework: (hwData) => {
    const id = hwData.id || hwData._id || 'hw-' + Date.now();
    const newHw = {
      _id: id,
      id,
      createdAt: new Date(),
      submissions: [],
      ...hwData,
    };
    memoryHomeworks.unshift(newHw);
    return newHw;
  },
  gradeSubmission: (hwId, subId, marksObtained, feedback) => {
    const hw = memoryHomeworks.find((h) => h.id === hwId || h._id === hwId);
    if (hw && hw.submissions) {
      const sub = hw.submissions.find((s) => s.id === subId || s._id === subId);
      if (sub) {
        sub.marksObtained = marksObtained;
        sub.feedback = feedback || '';
        sub.status = 'graded';
        return sub;
      }
    }
    return null;
  },
  saveQuiz: (quizData) => {
    const id = quizData.id || quizData._id || 'quiz-' + Date.now();
    const newQuiz = {
      _id: id,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      chapter: quizData.chapter || 'Chapter 1',
      questionType: quizData.questionType || 'mixed',
      totalMarks: quizData.totalMarks || (quizData.questions ? quizData.questions.length * 2 : 10),
      sourceMaterialName: quizData.sourceMaterialName || '',
      ...quizData,
    };
    memoryQuizzes.unshift(newQuiz);
    return newQuiz;
  },
  updateQuiz: (id, quizData) => {
    const idx = memoryQuizzes.findIndex((q) => q.id === id || q._id === id);
    if (idx >= 0) {
      memoryQuizzes[idx] = { ...memoryQuizzes[idx], ...quizData, updatedAt: new Date() };
      return memoryQuizzes[idx];
    }
    return null;
  },
  saveClass: (classData) => {
    const id = classData.id || classData._id || 'class-' + Date.now();
    const existingIdx = memoryClasses.findIndex((c) => c.id === id || c._id === id);
    if (existingIdx >= 0) {
      memoryClasses[existingIdx] = { ...memoryClasses[existingIdx], ...classData };
      return memoryClasses[existingIdx];
    }
    const newClass = {
      _id: id,
      id,
      studentsCount: 0,
      capacity: 30,
      room: 'Main Building',
      teacherName: 'Unassigned',
      ...classData,
    };
    memoryClasses.push(newClass);
    return newClass;
  },
  deleteClass: (id) => {
    const idx = memoryClasses.findIndex((c) => c.id === id || c._id === id);
    if (idx >= 0) return memoryClasses.splice(idx, 1)[0];
    return null;
  },
  teacherMessages: [
    {
      id: 1,
      sender: 'Prof. John Keating (Teacher)',
      text: 'Hello! Leo did fantastic on his equivalent fractions exercise today.',
      timestamp: '10:30 AM',
      isTeacher: true,
      parentId: 'demo-parent-id-003',
    },
  ],
  saveTeacherMessage: (msg) => {
    const newMsg = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...msg,
    };
    module.exports.teacherMessages.push(newMsg);
    return newMsg;
  },
  questionBanks: memoryQuestionBanks,
  quizAttempts: memoryQuizAttempts,
  saveQuestionBank: (bankData) => {
    const id = bankData.id || bankData._id || 'qb-' + Date.now();
    const newBank = {
      _id: id,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalQuestionsCount: bankData.questions ? bankData.questions.length : 20,
      isPublished: true,
      ...bankData,
    };
    // Ensure every question has an _id
    if (Array.isArray(newBank.questions)) {
      newBank.questions = newBank.questions.map((q, idx) => ({
        _id: q._id || q.id || `qb-q-${Date.now()}-${idx}`,
        ...q,
      }));
    }
    memoryQuestionBanks.unshift(newBank);
    return newBank;
  },
  updateQuestionBank: (id, bankData) => {
    const idx = memoryQuestionBanks.findIndex((b) => b.id === id || b._id === id);
    if (idx >= 0) {
      if (Array.isArray(bankData.questions)) {
        bankData.questions = bankData.questions.map((q, qIdx) => ({
          _id: q._id || q.id || `qb-q-${Date.now()}-${qIdx}`,
          ...q,
        }));
      }
      memoryQuestionBanks[idx] = {
        ...memoryQuestionBanks[idx],
        ...bankData,
        totalQuestionsCount: bankData.questions ? bankData.questions.length : memoryQuestionBanks[idx].totalQuestionsCount,
        updatedAt: new Date(),
      };
      return memoryQuestionBanks[idx];
    }
    return null;
  },
  deleteQuestionBank: (id) => {
    const idx = memoryQuestionBanks.findIndex((b) => b.id === id || b._id === id);
    if (idx >= 0) return memoryQuestionBanks.splice(idx, 1)[0];
    return null;
  },
  saveQuizAttempt: (attemptData) => {
    const id = attemptData.id || attemptData._id || 'attempt-' + Date.now();
    const newAttempt = {
      _id: id,
      id,
      takenAt: new Date(),
      createdAt: new Date(),
      ...attemptData,
    };
    memoryQuizAttempts.unshift(newAttempt);
    return newAttempt;
  },
};
