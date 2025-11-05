const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

let db;
try {
  let credential;
  
  // Use environment variables in production, JSON file in development
  if (process.env.NODE_ENV === 'production') {
    credential = cert({
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL
    });
  } else {
    const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));
    credential = cert(serviceAccount);
  }
  
  const app = initializeApp({ credential });
  db = getFirestore(app);
  console.log('✅ Firebase connected to Firestore successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  process.exit(1);
}

module.exports = { db };
