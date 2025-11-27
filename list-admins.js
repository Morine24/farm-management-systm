const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./farm-management-backend/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listAdmins() {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('status', '==', 'active').get();
    
    if (snapshot.empty) {
      console.log('❌ No users found');
      return;
    }

    console.log('🔐 LOGIN CREDENTIALS FOR ADMINS & MANAGERS:\n');
    console.log('=' .repeat(60));
    
    snapshot.forEach(doc => {
      const user = doc.data();
      if (user.role === 'admin' || user.role === 'manager') {
        console.log(`👤 ${user.name}`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`🔑 Password: ${user.password || 'Karibu@123'}`);
        console.log(`👔 Role: ${user.role.toUpperCase()}`);
        console.log(`🆔 ID: ${doc.id}`);
        console.log('-'.repeat(40));
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listAdmins();