const admin = require('firebase-admin');

require('dotenv').config();

// Parse nội dung từ biến môi trường FIREBASE_CONFIG (JSON dạng chuỗi 1 dòng)
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

// Chuyển lại private_key thành dạng đúng (xuống dòng)
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

// Khởi tạo Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
