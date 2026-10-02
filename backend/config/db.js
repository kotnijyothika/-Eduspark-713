const mongoose = require('mongoose');
const dns = require('dns');

// Disable buffering queries when not connected so operations immediately fail-over to memoryStore
mongoose.set('bufferCommands', false);

// Fix Windows DNS resolution for MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // Ignore DNS config notice
}

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  // --- Pre-flight checks ---
  if (!mongoURI) {
    throw new Error(
      'MONGODB_URI is not set in environment variables. ' +
      'Add it to your .env file: MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority'
    );
  }

  if (mongoURI.includes('<db_username>') || mongoURI.includes('<password>')) {
    throw new Error(
      'MONGODB_URI still contains placeholder text (<db_username> or <password>). ' +
      'Replace them with your actual MongoDB Atlas credentials in the .env file.'
    );
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📡 Cluster Host: ${conn.connection.host}`);
    console.log(`📦 Database Name: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    // Provide actionable diagnosis without exposing credentials
    const msg = error.message || '';
    if (msg.includes('bad auth') || msg.includes('Authentication failed')) {
      console.error('❌ MongoDB Auth Failed: The username or password in MONGODB_URI is incorrect.');
      console.error('   → Go to MongoDB Atlas → Database Access and verify your database user credentials.');
      console.error('   → Make sure the password has no unencoded special characters (use encodeURIComponent if needed).');
    } else if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
      console.error('❌ MongoDB DNS Error: Cannot resolve the cluster hostname.');
      console.error('   → Check your internet connection and verify the cluster URL in MONGODB_URI.');
    } else if (msg.includes('timed out') || msg.includes('ETIMEDOUT')) {
      console.error('❌ MongoDB Timeout: Connection timed out.');
      console.error('   → Check MongoDB Atlas Network Access — your current IP may not be whitelisted.');
      console.error('   → In Atlas: Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0) for dev.');
    } else {
      console.error('❌ MongoDB Connection Error:', msg);
    }
    throw error;
  }
};

module.exports = connectDB;
