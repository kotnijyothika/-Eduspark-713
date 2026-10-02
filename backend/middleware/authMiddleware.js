const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Token missing.',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'eduspark_secret_key_2026_super_secure'
    );

    if (!decoded || !decoded.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Invalid token payload.',
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is unavailable. Please try again later.',
      });
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists or unauthorized.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Invalid or expired token.',
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required.',
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route.`,
      });
    }
    next();
  };
};

// Ensure teacher owns the subject
const requireSubjectOwnership = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next(); // Admins can bypass
  }
  
  const requestedSubject = req.body.subject || req.query.subject;
  
  if (!requestedSubject) {
    return next(); // Let controller handle missing subject error
  }
  
  const subjects = req.user.subjects || (req.user.subject ? [req.user.subject] : []);
  
  if (!subjects.includes(requestedSubject)) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to access or generate content for this subject.',
    });
  }
  
  next();
};

module.exports = { protect, authorize, requireSubjectOwnership };
