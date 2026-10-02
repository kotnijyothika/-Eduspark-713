const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ClassModel = require('../models/Class');
const memoryStore = require('../utils/memoryStore');

// @desc    Get Admin Dashboard Stats & Chart Analytics
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getAdminStats = async (req, res) => {
  try {
    let teachersCount = 0;
    let studentsCount = 0;
    let parentsCount = 0;
    let classesCount = 0;

    try {
      teachersCount = await User.countDocuments({ role: 'teacher' });
      studentsCount = await User.countDocuments({ role: 'student' });
      parentsCount = await User.countDocuments({ role: 'parent' });
      classesCount = await ClassModel.countDocuments();
    } catch (e) {
      teachersCount = memoryStore.findByRole('teacher').length;
      studentsCount = memoryStore.findByRole('student').length;
      parentsCount = memoryStore.findByRole('parent').length;
      classesCount = memoryStore.classes.length;
    }

    // Chart analytics mock data tailored for primary school monitoring
    const attendanceTrend = [
      { month: 'Jan', attendance: 94.2, homework: 88, quizzes: 82 },
      { month: 'Feb', attendance: 95.8, homework: 91, quizzes: 85 },
      { month: 'Mar', attendance: 93.5, homework: 86, quizzes: 80 },
      { month: 'Apr', attendance: 96.7, homework: 94, quizzes: 89 },
      { month: 'May', attendance: 97.1, homework: 95, quizzes: 91 },
      { month: 'Jun', attendance: 96.4, homework: 93, quizzes: 88 },
    ];

    const subjectPerformance = [
      { subject: 'Mathematics', averageScore: 84, weakStudents: 6 },
      { subject: 'Science', averageScore: 89, weakStudents: 3 },
      { subject: 'English Arts', averageScore: 92, weakStudents: 2 },
      { subject: 'Social Studies', averageScore: 88, weakStudents: 4 },
      { subject: 'Art & Tech', averageScore: 96, weakStudents: 1 },
    ];

    const aiAlerts = [
      { id: 1, type: 'warning', text: 'Grade 4 Mathematics shows 12% drop in fraction homework completion.' },
      { id: 2, type: 'success', text: 'AI Personalized tutoring improved Grade 5 reading comprehension by 18%.' },
      { id: 3, type: 'info', text: '3 students in Grade 3 recommended for extra subtraction practice.' },
    ];

    res.status(200).json({
      success: true,
      stats: {
        totalTeachers: teachersCount || 12,
        totalStudents: studentsCount || 420,
        totalParents: parentsCount || 385,
        totalClasses: classesCount || 14,
        attendancePercentage: 96.4,
        homeworkCompletionRate: 93.2,
        quizAverageScore: 87.5,
      },
      charts: {
        attendanceTrend,
        subjectPerformance,
      },
      aiAlerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin stats.',
      error: error.message,
    });
  }
};

/* ==========================================
   TEACHER MANAGEMENT CRUD
   ========================================== */
exports.getTeachers = async (req, res) => {
  try {
    let teachers = [];
    if (mongoose.connection.readyState === 1) {
      teachers = await User.find({ role: 'teacher' }).select('-password');
    } else {
      teachers = memoryStore.findByRole('teacher');
    }
    res.status(200).json({ success: true, count: teachers.length, data: teachers });
  } catch (error) {
    console.error('getTeachers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch teachers.' });
  }
};

exports.createTeacher = async (req, res) => {
  try {
    const { name, email, password, subject, grade, assignedClass, subjects, grades } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password required.' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is unavailable. Please try again later.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Pass plain password to User.create() so userSchema.pre('save') hashes it once
    const teacher = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'teacher',
      subject: subject || 'General Primary',
      grade: grade || 'Grade 4',
      assignedClass: assignedClass || '',
      subjects: subjects || (subject ? [subject] : ['Mathematics']),
      grades: grades || (grade ? [grade] : ['Grade 4']),
      isVerified: true,
    });

    console.log(`[AUTH] Admin created teacher in MongoDB: _id=${teacher._id}`);
    return res.status(201).json({ success: true, message: 'Teacher created successfully', data: teacher });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }
    console.error('createTeacher error:', error);
    res.status(500).json({ success: false, message: 'Error creating teacher: ' + error.message });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, subject, grade, assignedClass, subjects, grades } = req.body;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const updateData = { name, email, subject, grade, assignedClass };
      if (subjects) updateData.subjects = subjects;
      if (grades) updateData.grades = grades;
      
      const teacher = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      if (teacher) return res.status(200).json({ success: true, message: 'Teacher updated', data: teacher });
    }

    const updated = memoryStore.saveUser({ id, name, email, subject, grade, assignedClass, role: 'teacher', subjects, grades });
    res.status(200).json({ success: true, message: 'Teacher updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating teacher.' });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      await User.findByIdAndDelete(id);
    }
    memoryStore.deleteUser(id);
    res.status(200).json({ success: true, message: 'Teacher deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting teacher.' });
  }
};

/* ==========================================
   STUDENT MANAGEMENT CRUD
   ========================================== */
exports.getStudents = async (req, res) => {
  try {
    let students = [];
    if (mongoose.connection.readyState === 1) {
      students = await User.find({ role: 'student' }).select('-password');
    } else {
      students = memoryStore.findByRole('student');
    }
    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    console.error('getStudents error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students.' });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, grade, assignedClass, parentName } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password required.' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is unavailable. Please try again later.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Pass plain password to User.create() so userSchema.pre('save') hashes it once
    const student = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'student',
      grade: grade || 'Grade 4',
      assignedClass: assignedClass || '',
      parentName: parentName || '',
      isVerified: true,
    });

    console.log(`[AUTH] Admin created student in MongoDB: _id=${student._id}`);
    return res.status(201).json({ success: true, message: 'Student created successfully', data: student });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }
    console.error('createStudent error:', error);
    res.status(500).json({ success: false, message: 'Error creating student: ' + error.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, grade, assignedClass, parentName } = req.body;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const student = await User.findByIdAndUpdate(
        id,
        { name, email, grade, assignedClass, parentName },
        { new: true, runValidators: true }
      );
      if (student) return res.status(200).json({ success: true, message: 'Student updated', data: student });
    }

    const updated = memoryStore.saveUser({ id, name, email, grade, assignedClass, parentName, role: 'student' });
    res.status(200).json({ success: true, message: 'Student updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating student.' });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      await User.findByIdAndDelete(id);
    }
    memoryStore.deleteUser(id);
    res.status(200).json({ success: true, message: 'Student deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting student.' });
  }
};

/* ==========================================
   PARENT MANAGEMENT CRUD
   ========================================== */
exports.getParents = async (req, res) => {
  try {
    let parents = [];
    if (mongoose.connection.readyState === 1) {
      parents = await User.find({ role: 'parent' }).select('-password');
    } else {
      parents = memoryStore.findByRole('parent');
    }
    res.status(200).json({ success: true, count: parents.length, data: parents });
  } catch (error) {
    console.error('getParents error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch parents.' });
  }
};

exports.createParent = async (req, res) => {
  try {
    const { name, email, password, phone, linkedStudent } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password required.' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is unavailable. Please try again later.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Pass plain password to User.create() so userSchema.pre('save') hashes it once
    const parent = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'parent',
      phone: phone || '',
      linkedStudent: linkedStudent || '',
      isVerified: true,
    });

    console.log(`[AUTH] Admin created parent in MongoDB: _id=${parent._id}`);
    return res.status(201).json({ success: true, message: 'Parent created successfully', data: parent });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }
    console.error('createParent error:', error);
    res.status(500).json({ success: false, message: 'Error creating parent: ' + error.message });
  }
};

exports.updateParent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, linkedStudent } = req.body;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const parent = await User.findByIdAndUpdate(
        id,
        { name, email, phone, linkedStudent },
        { new: true, runValidators: true }
      );
      if (parent) return res.status(200).json({ success: true, message: 'Parent updated', data: parent });
    }

    const updated = memoryStore.saveUser({ id, name, email, phone, linkedStudent, role: 'parent' });
    res.status(200).json({ success: true, message: 'Parent updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating parent.' });
  }
};

exports.deleteParent = async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      await User.findByIdAndDelete(id);
    }
    memoryStore.deleteUser(id);
    res.status(200).json({ success: true, message: 'Parent deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting parent.' });
  }
};

/* ==========================================
   CLASS MANAGEMENT CRUD
   ========================================== */
exports.getClasses = async (req, res) => {
  try {
    let classesList = [];
    try {
      classesList = await ClassModel.find();
    } catch (e) {
      classesList = memoryStore.classes;
    }
    if (!classesList.length) classesList = memoryStore.classes;
    res.status(200).json({ success: true, count: classesList.length, data: classesList });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch classes.' });
  }
};

exports.createClass = async (req, res) => {
  try {
    const { name, grade, section, room, teacherName, capacity } = req.body;
    if (!name || !grade || !section) {
      return res.status(400).json({ success: false, message: 'Class name, grade, and section are required.' });
    }

    try {
      const newClass = await ClassModel.create({
        name,
        grade,
        section,
        room: room || 'Main Building',
        teacherName: teacherName || 'Unassigned',
        capacity: capacity || 30,
        studentsCount: 0,
      });
      return res.status(201).json({ success: true, message: 'Class created successfully', data: newClass });
    } catch (dbErr) {
      const memClass = memoryStore.saveClass({
        name,
        grade,
        section,
        room: room || 'Main Building',
        teacherName: teacherName || 'Unassigned',
        capacity: capacity || 30,
        studentsCount: 0,
      });
      return res.status(201).json({ success: true, message: 'Class created (Demo mode)', data: memClass });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating class.' });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, grade, section, room, teacherName, capacity } = req.body;

    try {
      const updatedClass = await ClassModel.findByIdAndUpdate(
        id,
        { name, grade, section, room, teacherName, capacity },
        { new: true, runValidators: true }
      );
      if (updatedClass) return res.status(200).json({ success: true, message: 'Class updated', data: updatedClass });
    } catch (e) {}

    const updated = memoryStore.saveClass({ id, name, grade, section, room, teacherName, capacity });
    res.status(200).json({ success: true, message: 'Class updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating class.' });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await ClassModel.findByIdAndDelete(id);
    } catch (e) {}
    memoryStore.deleteClass(id);
    res.status(200).json({ success: true, message: 'Class deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting class.' });
  }
};

/* ==========================================
   SUBJECT MANAGEMENT CRUD
   ========================================== */
const SubjectModel = require('../models/Subject');

exports.getSubjects = async (req, res) => {
  try {
    let list = [];
    try {
      list = await SubjectModel.find();
    } catch (e) {}
    if (!list.length) {
      list = [
        { _id: 'subj-1', name: 'Mathematics', code: 'MATH-101', grade: 'All Grades', description: 'Core Primary Mathematics', icon: '📐' },
        { _id: 'subj-2', name: 'Science', code: 'SCI-101', grade: 'All Grades', description: 'General Science & Plants', icon: '🔬' },
        { _id: 'subj-3', name: 'English Language Arts', code: 'ENG-101', grade: 'All Grades', description: 'Reading, Writing & Grammar', icon: '📖' },
        { _id: 'subj-4', name: 'Social Studies', code: 'SOC-101', grade: 'All Grades', description: 'History, Geography & Civics', icon: '🌍' },
      ];
    }
    res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch subjects.' });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const { name, code, grade, description, icon } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Subject name is required.' });
    }
    try {
      const newSubject = await SubjectModel.create({ name, code, grade: grade || 'All Grades', description, icon: icon || '📚' });
      return res.status(201).json({ success: true, message: 'Subject created successfully', data: newSubject });
    } catch (dbErr) {
      const fallback = { _id: 'subj-' + Date.now(), name, code, grade: grade || 'All Grades', description, icon: icon || '📚' };
      return res.status(201).json({ success: true, message: 'Subject created (Demo Mode)', data: fallback });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating subject.' });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, grade, description, icon } = req.body;
    try {
      const updated = await SubjectModel.findByIdAndUpdate(id, { name, code, grade, description, icon }, { new: true });
      if (updated) return res.status(200).json({ success: true, message: 'Subject updated', data: updated });
    } catch (e) {}
    res.status(200).json({ success: true, message: 'Subject updated', data: { _id: id, name, code, grade, description, icon } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating subject.' });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await SubjectModel.findByIdAndDelete(id);
    } catch (e) {}
    res.status(200).json({ success: true, message: 'Subject deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting subject.' });
  }
};
