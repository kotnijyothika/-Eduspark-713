const mongoose = require('mongoose');

const questionItemSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  options: {
    type: [String],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length === 4;
      },
      message: 'Question must have exactly 4 options (A, B, C, D)',
    },
    required: true,
  },
  correctAnswer: {
    type: String,
    required: [true, 'Correct answer is required'],
    trim: true,
  },
  explanation: {
    type: String,
    default: '',
    trim: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
  },
});

const questionBankSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    teacherName: {
      type: String,
      default: 'Teacher',
    },
    title: {
      type: String,
      required: [true, 'Please add a question bank title'],
      trim: true,
    },
    grade: {
      type: String,
      required: [true, 'Please specify the class/grade'],
      default: 'Grade 4',
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Please specify the subject'],
      default: 'Mathematics',
      trim: true,
    },
    topic: {
      type: String,
      required: [true, 'Please specify the topic'],
      default: 'General Topic',
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    totalQuestionsCount: {
      type: Number,
      default: 20,
    },
    questions: {
      type: [questionItemSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 1;
        },
        message: 'A Question Bank must contain at least 1 question',
      },
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('QuestionBank', questionBankSchema);
