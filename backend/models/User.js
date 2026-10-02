const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'parent', 'student'],
      default: 'student',
    },
    grade: {
      type: String,
      default: '',
    },
    grades: [{
      type: String,
    }],
    subject: {
      type: String,
      default: '',
    },
    subjects: [{
      type: String,
    }],
    department: {
      type: String,
      default: '',
    },
    teacherId: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    assignedClass: {
      type: String,
      default: '',
    },
    parentName: {
      type: String,
      default: '',
    },
    linkedStudent: {
      type: String,
      default: '',
    },
    linkedStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    stars: {
      type: Number,
      default: 100,
    },
    coins: {
      type: Number,
      default: 200,
    },
    streak: {
      type: Number,
      default: 1,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    quizResults: [
      {
        quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
        quizTitle: String,
        subject: String,
        score: Number, // Percentage score
        correctCount: Number,
        totalQuestions: Number,
        weakConcepts: [String],
        takenAt: { type: Date, default: Date.now }
      }
    ],
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
