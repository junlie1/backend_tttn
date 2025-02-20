const admin = require('firebase-admin');
const serviceAccount = require('../../nhom18-tttn-firebase-adminsdk-5bys1-96d9bc2fa9.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Khởi tạo các collections cần thiết
const initializeCollections = async () => {
  try {
    console.log('Initializing Firestore collections...');

    // Danh sách các collections cần tạo
    const collections = [
      'schedules',
      'seatLayouts',
      'routes',
      'buses',
      'users'
    ];

    // Tạo các collections trực tiếp
    for (const collectionName of collections) {
      // Kiểm tra collection đã tồn tại chưa
      const collectionRef = db.collection(collectionName);
      const snapshot = await collectionRef.limit(1).get();
      
      if (snapshot.empty) {
        // Tạo một document tạm thời để khởi tạo collection
        const tempDoc = await collectionRef.add({
          _temp: true,
          _createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Xóa document tạm ngay lập tức
        await tempDoc.delete();
        
        console.log(`Created collection: ${collectionName}`);
      } else {
        console.log(`Collection ${collectionName} already exists`);
      }
    }

    console.log('All collections initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing collections:', error);
    throw error;
  }
};

// Export các functions và objects cần thiết
module.exports = {
  admin,
  db,
  initializeCollections
}; 