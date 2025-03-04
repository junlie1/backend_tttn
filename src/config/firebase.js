
const admin = require('firebase-admin');
const serviceAccount = require('../../nhom18-tttn-firebase-adminsdk-5bys1-08dce4c222.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { admin, db };
