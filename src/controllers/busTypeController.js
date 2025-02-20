const { db } = require('../config/firebase');

// Tạo loại xe mới
exports.createBusType = async (req, res) => {
  try {
    const { typeName, capacity, seatLayout } = req.body;
    
    const busTypeRef = db.collection('busTypes').doc();
    await busTypeRef.set({
      busTypeId: busTypeRef.id,
      typeName,
      capacity,
      seatLayout
    });

    res.status(201).json({ 
      success: true,
      message: 'Bus type created successfully',
      data: {
        busTypeId: busTypeRef.id,
        typeName,
        capacity,
        seatLayout
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Lấy danh sách loại xe
exports.getBusTypes = async (req, res) => {
  try {
    const busTypesSnapshot = await db.collection('busTypes').get();
    const busTypes = [];
    
    busTypesSnapshot.forEach(doc => {
      busTypes.push(doc.data());
    });

    res.status(200).json({
      success: true,
      data: busTypes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Lấy chi tiết một loại xe
exports.getBusType = async (req, res) => {
  try {
    const { id } = req.params;
    const busTypeDoc = await db.collection('busTypes').doc(id).get();

    if (!busTypeDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Bus type not found'
      });
    }

    res.status(200).json({
      success: true,
      data: busTypeDoc.data()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 