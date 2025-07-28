const admin = require('firebase-admin');

function initFirebase() {
  if (admin.apps.length === 0) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_CONFIG, 'base64').toString('utf-8')
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://cheflens-ce7f2.firebaseio.com',
    });

    console.log('🔥 Firebase initialized');
  }
}

function getFirestore() {
  if (!admin.apps.length) throw new Error('Firebase not initialized');
  return admin.firestore();
}

module.exports = {
  initFirebase,
  getFirestore,
};


