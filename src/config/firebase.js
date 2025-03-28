
const admin = require('firebase-admin');
const serviceAccount = require('../../nhom18-tttn-firebase-adminsdk-5bys1-d63e10180a.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db,auth };
