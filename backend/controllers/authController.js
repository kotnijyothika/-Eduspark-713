const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Helper to generate JWT Token
const generateToken = (id, role) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id.toString())) {
    throw new Error('Invalid user ObjectId for JWT generation');
  }
  return jwt.sign(
    { id: id.toString(), role },
    process.env.JWT_SECRET || 'eduspark_secret_key_2026_super_secure',
    { expiresIn: '30d' }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, grade, grades, subject, subjects, phone, assignedClass } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role.',
      });
    }

    const validRoles = ['admin', 'teacher', 'parent', 'student'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role specified. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('[AUTH] Registration failed: MongoDB is not connected (readyState !== 1)');
      return res.status(503).json({
        success: false,
        message: 'Database is unavailable. Please try again later.',
      });
    }

    console.log(`[AUTH] MongoDB readyState: ${mongoose.connection.readyState}, database: ${mongoose.connection.name}`);
    console.log(`[AUTH] Registering user: email=${email.toLowerCase().trim()}, role=${role}`);

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Create User in MongoDB - pre-save hook in User.js handles password hashing
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      grade: grade || '',
      grades: Array.isArray(grades) ? grades : (grade ? [grade] : []),
      subject: subject || '',
      subjects: Array.isArray(subjects) ? subjects : (subject ? [subject] : []),
      phone: phone || '',
      assignedClass: assignedClass || '',
      isVerified: true,
      verificationToken,
    });

    console.log(`[AUTH] MongoDB User created: _id=${user._id}`);

    const token = generateToken(user._id, user.role);
    console.log(`[AUTH] JWT generated for MongoDB user: _id=${user._id}`);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to EduSpark AI.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        grade: user.grade || '',
        grades: user.grades || [],
        subject: user.subject || '',
        subjects: user.subjects || [],
        department: user.department || '',
        teacherId: user.teacherId || '',
        assignedClass: user.assignedClass || '',
        phone: user.phone || '',
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }
    console.error('[AUTH] MongoDB registration failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create account in database: ' + (error.message || 'Server error'),
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('[AUTH] Login failed: MongoDB is not connected (readyState !== 1)');
      return res.status(503).json({
        success: false,
        message: 'Database is unavailable. Please try again later.',
      });
    }

    console.log(`[AUTH] Attempting login: email=${email.toLowerCase().trim()}`);

    // Query MongoDB for user with password
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Role check if client specified role on login
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Account found, but it is registered as a '${user.role}', not '${role}'.`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(user._id.toString())) {
      console.error('[AUTH] User _id is not a valid ObjectId:', user._id);
      return res.status(500).json({
        success: false,
        message: 'Invalid user database record.',
      });
    }

    console.log(`[AUTH] Login MongoDB user found: _id=${user._id}`);
    const token = generateToken(user._id, user.role);
    console.log(`[AUTH] JWT generated for MongoDB user: _id=${user._id}`);

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        grade: user.grade || '',
        grades: user.grades || [],
        subject: user.subject || '',
        subjects: user.subjects || [],
        department: user.department || '',
        teacherId: user.teacherId || '',
        assignedClass: user.assignedClass || '',
        phone: user.phone || '',
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('[AUTH] Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login: ' + (error.message || 'Unknown error'),
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

// @desc    Forgot Password - Request reset link
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email address.',
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is unavailable. Please try again later.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Security best practice: don't reveal if user doesn't exist
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been generated.',
        demoResetToken: null,
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    console.log(`🔑 [Password Reset Token for ${email}]: ${resetToken}`);

    return res.status(200).json({
      success: true,
      message: 'Password reset link/token generated. Check your email or server console.',
      resetToken: process.env.NODE_ENV === 'production' ? undefined : resetToken,
    });
  } catch (error) {
    console.error('[AUTH] Forgot Password Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing forgot password request.',
    });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both the reset token and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is unavailable. Please try again later.',
      });
    }

    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });
    }

    // Set new password (User.js pre-save hook will hash it)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password successfully reset! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('[AUTH] Reset Password Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password.',
    });
  }
};

// @desc    Verify Email Placeholder
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is unavailable. Please try again later.',
      });
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email verification token.',
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email successfully verified!',
    });
  } catch (error) {
    console.error('[AUTH] Verify Email Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying email.',
    });
  }
};

// @desc    Get Current User Profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. User profile not found.',
    });
  }

  const userSafe = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    grade: req.user.grade || '',
    grades: req.user.grades || [],
    subject: req.user.subject || '',
    subjects: req.user.subjects || [],
    department: req.user.department || '',
    teacherId: req.user.teacherId || '',
    assignedClass: req.user.assignedClass || '',
    phone: req.user.phone || '',
    isVerified: req.user.isVerified,
  };

  return res.status(200).json({
    success: true,
    user: userSafe,
  });
};
