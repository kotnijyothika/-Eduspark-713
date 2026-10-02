const mongoose = require('mongoose');

const quizAttemptItemSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: [String],
  studentAnswer: {
    type: String,
    default: '',
  },
  correctAnswer: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  explanation: {
    type: String,
    default: '',
  },
});

const quizAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    studentName: {
      type: String,
      default: 'Student',
    },
    studentGrade: {
      type: String,
      default: 'Grade 4',
    },
    questionBank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionBank',
      required: false,
    },
    questionBankId: {
      type: String,
      required: true,
    },
    quizTitle: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      default: 'Mathematics',
    },
    topic: {
      type: String,
      default: 'General Topic',
    },
    selectedQuestionIds: [String],
    studentAnswers: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      default: 4,
    },
    percentage: {
      type: Number,
      required: true,
    },
    results: [quizAttemptItemSchema],
    weakConcepts: [String],
    takenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
