const { db } = require('../config/firebase');

const busController = {
  // 🔹 Tạo xe mới
  createBus: async (req, res) => {
    try {
      const {
        busNumber,
        busTypeId,
        licensePlate,
        manufacturer,
        model,
        yearOfManufacture,
        lastMaintenance,
        status,
        description,
        defaultPriceFloor1,
        defaultPriceFloor2,
        seatLayout,
        vendorId, 
      } = req.body;

      if (!busNumber || !busTypeId || !vendorId) {
        return res.status(400).json({ success: false, message: 'Số xe, loại xe và vendorId là bắt buộc' });
      }

      // Kiểm tra vendorId có tồn tại không
      const vendorDoc = await db.collection('vendors').doc(vendorId).get();
      if (!vendorDoc.exists) {
        return res.status(400).json({ success: false, message: 'Vendor không tồn tại' });
      }

      // Kiểm tra busTypeId có tồn tại không
      const busTypeDoc = await db.collection('busTypes').doc(busTypeId).get();
      if (!busTypeDoc.exists) {
        return res.status(400).json({ success: false, message: 'Loại xe không tồn tại' });
      }

      // Tạo seatLayout cho xe
      const seatLayoutRef = db.collection('seatLayouts').doc();
      let seatLayoutData = {
        floor1: seatLayout?.floor1 || {},
        floor2: seatLayout?.floor2 || {},
        busId: '',
        defaultPriceFloor1: Number(defaultPriceFloor1) || 0,
        defaultPriceFloor2: Number(defaultPriceFloor2) || 0,
        totalSeats: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Cập nhật tổng số ghế
      seatLayoutData.totalSeats = Object.keys(seatLayoutData.floor1).length + Object.keys(seatLayoutData.floor2).length;
      if (seatLayoutData.totalSeats === 0) {
        return res.status(400).json({ success: false, message: 'Không thể tạo xe không có ghế' });
      }

      // Tạo document cho xe
      const busRef = db.collection('buses').doc();
      const busDocData = {
        busNumber,
        busTypeId,
        licensePlate,
        manufacturer,
        model,
        yearOfManufacture,
        lastMaintenance,
        status: status || 'active',
        description,
        capacity: seatLayoutData.totalSeats,
        defaultSeatLayoutId: seatLayoutRef.id,
        defaultPriceFloor1: Number(defaultPriceFloor1) || 0,
        defaultPriceFloor2: Number(defaultPriceFloor2) || 0,
        vendorId, // 🔥 Lưu vendorId vào bus
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      seatLayoutData.busId = busRef.id;

      // Batch write để lưu dữ liệu vào Firestore
      const batch = db.batch();
      batch.set(seatLayoutRef, seatLayoutData);
      batch.set(busRef, busDocData);
      await batch.commit();

      res.status(201).json({
        success: true,
        message: 'Thêm xe thành công',
        data: { id: busRef.id, ...busDocData, defaultSeatLayout: seatLayoutData },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 🔹 Lấy danh sách xe
  getBuses: async (req, res) => {
    try {
      const snapshot = await db.collection('buses').get();
      const buses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json({ success: true, data: buses });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 🔹 Lấy chi tiết xe
  getBus: async (req, res) => {
    try {
      const { id } = req.params;
      const busDoc = await db.collection('buses').doc(id).get();

      if (!busDoc.exists) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy xe' });
      }

      res.status(200).json({ success: true, data: { id: busDoc.id, ...busDoc.data() } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 🔹 Cập nhật xe
  updateBus: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const busRef = db.collection('buses').doc(id);
      await busRef.update({ ...updateData, updatedAt: new Date().toISOString() });

      res.status(200).json({ success: true, message: 'Cập nhật xe thành công' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 🔹 Xóa xe
  deleteBus: async (req, res) => {
    try {
      const { id } = req.params;
      const busRef = db.collection('buses').doc(id);
      await busRef.delete();

      res.status(200).json({ success: true, message: 'Xóa xe thành công' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = busController;
