const admin = require('firebase-admin');

function initFirebase() {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_CONFIG, 'base64').toString('utf-8')
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://cheflens-ce7f2.firebaseio.com',
  });
}

module.exports = { initFirebase };