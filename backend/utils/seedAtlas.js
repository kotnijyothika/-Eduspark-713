const User = require('../models/User');

const seedDefaultAccounts = async () => {
  try {
    const defaultAccounts = [
      {
        name: 'Dr. Sarah Connor',
        email: 'admin@eduspark.ai',
        password: 'password123',
        role: 'admin',
        isVerified: true,
      },
      {
        name: 'Prof. John Keating',
        email: 'teacher@eduspark.ai',
        password: 'password123',
        role: 'teacher',
        isVerified: true,
        subject: 'Mathematics',
        subjects: ['Mathematics', 'Science'],
        grade: 'Grade 4',
        grades: ['Grade 4', 'Grade 5'],
        assignedClass: 'Grade 4 - Alpha',
      },
      {
        name: 'Leo Vance',
        email: 'student@eduspark.ai',
        password: 'password123',
        role: 'student',
        isVerified: true,
        grade: 'Grade 4',
        assignedClass: 'Grade 4 - Alpha',
        stars: 140,
        coins: 250,
        streak: 5,
      },
      {
        name: 'Eleanor Vance',
        email: 'parent@eduspark.ai',
        password: 'password123',
        role: 'parent',
        isVerified: true,
        linkedStudent: 'Leo Vance',
      },
    ];

    for (const acc of defaultAccounts) {
      const existing = await User.findOne({ email: acc.email });
      if (!existing) {
        const created = await User.create(acc);
        console.log(`[SEED] Created default MongoDB Atlas user: ${acc.email} (_id: ${created._id})`);
      }
    }
  } catch (error) {
    console.warn('[SEED] Notice while ensuring default Atlas accounts:', error.message);
  }
};

module.exports = seedDefaultAccounts;
