const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

// Load service account key
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

// Initialize Firebase Admin with service account
let db;
try {
  const app = initializeApp({
    credential: cert(serviceAccount)
  });
  
  db = getFirestore(app);
  console.log('✅ Firebase connected to Firestore successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  process.exit(1);
}

module.exports = { db };
