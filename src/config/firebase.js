
const admin = require('firebase-admin');
const serviceAccount = require('../../nhom18-tttn-firebase-adminsdk-5bys1-cda862488a.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { admin, db };
