const admin = require('firebase-admin');

const driverController = {
  // Lấy tất cả tài xế
  getAllDriver: async (req, res) => {
    try {
      const snapshot = await admin.firestore().collection('drivers').get();
      const drivers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json({ success: true, data: drivers });
    } catch (error) {
      console.error('Lỗi khi lấy danh sách tài xế:', error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  },

  // Giao lịch trình
  assignSchedule: async (req, res) => {
    const { driverId, scheduleId } = req.body;
  
    if (!driverId || !scheduleId) {
      return res.status(400).json({ success: false, message: 'Thiếu driverId hoặc scheduleId' });
    }
  
    const db = admin.firestore();
    const driverRef = db.collection('drivers').doc(driverId);
    const scheduleRef = db.collection('schedules').doc(scheduleId);
  
    try {
      await db.runTransaction(async (transaction) => {
        const driverDoc = await transaction.get(driverRef);
        const scheduleDoc = await transaction.get(scheduleRef);
  
        // Kiểm tra tài xế có tồn tại không
        if (!driverDoc.exists) {
          throw new Error('Tài xế không tồn tại');
        }
  
        // Kiểm tra lịch trình có tồn tại không
        if (!scheduleDoc.exists) {
          throw new Error('Lịch trình không tồn tại');
        }
  
        const driverData = driverDoc.data();
        const scheduleData = scheduleDoc.data();
  
        // Kiểm tra trạng thái của driver (phải là free)
        if (driverData.status !== 'free') {
          throw new Error('Tài xế đang ở tuyến khác');
        }
  
        // Kiểm tra nếu lịch trình đã có tài xế
        if (scheduleData.driverId) {
          throw new Error('Lịch trình này đã có tài xế');
        }
  
        // Cập nhật driver: gán assignedScheduleId mới và update trạng thái thành "assigned"
        transaction.update(driverRef, {
          assignedScheduleId: scheduleId,
          status: 'assigned'
        });
  
        // Cập nhật lịch trình: gán driverId
        transaction.update(scheduleRef, { driverId: driverId });
      });
  
      res.status(200).json({ success: true, message: 'Giao lịch trình thành công!' });
    } catch (error) {
      console.error('Lỗi khi giao lịch trình:', error.message);
      res.status(400).json({ success: false, message: error.message || 'Lỗi khi giao lịch trình' });
    }
  },
  
  getAssignedSchedule: async (req, res) => {
    const { id } = req.params;
    const db = admin.firestore();
    if (!id) {
      return res.status(400).json({ success: false, message: 'Thiếu driverId' });
    }
    try {
      // 1. Lấy thông tin tài xế
      const driverRef = db.collection('drivers').doc(id);
      const driverDoc = await driverRef.get();
      if (!driverDoc.exists) {
        return res.status(404).json({ success: false, message: 'Tài xế không tồn tại' });
      }
  
      const driverData = driverDoc.data();
      const assignedScheduleId = driverData.assignedScheduleId;
  
      if (!assignedScheduleId) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'Tài xế chưa được giao lịch trình nào'
        });
      }
  
      // 2. Lấy chi tiết lịch trình từ schedules
      const scheduleRef = db.collection('schedules').doc(assignedScheduleId);
      const scheduleDoc = await scheduleRef.get();
  
      if (!scheduleDoc.exists) {
        return res.status(404).json({ success: false, message: 'Lịch trình không tồn tại' });
      }
  
      const scheduleData = scheduleDoc.data();
      if (scheduleData.routeId) {
        const routeDoc = await db.collection('routes').doc(scheduleData.routeId).get();
        scheduleData.route = routeDoc.exists ? routeDoc.data() : null;
      }
      if (scheduleData.busId) {
        const busDoc = await db.collection('buses').doc(scheduleData.busId).get();
        scheduleData.bus = busDoc.exists ? busDoc.data() : null;
      }
      if (scheduleData.seatLayoutId) {
        const seatLayoutDoc = await db.collection('seatLayouts').doc(scheduleData.seatLayoutId).get();
        scheduleData.seatLayout = seatLayoutDoc.exists ? seatLayoutDoc.data() : null;
      }
      return res.status(200).json({
        success: true,
        data: scheduleData,
      });
    } catch (error) {
      console.error('Lỗi lấy lịch trình:', error.message);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
    }
  },

  //Đánh dấu khởi hành xe
  startSchedule: async (req, res) => {
    try {
      const { scheduleId, driverId } = req.body;
      if (!scheduleId || !driverId) {
        return res.status(400).json({ success: false, message: 'Missing scheduleId or driverId' });
      }
      const db = admin.firestore();
      const scheduleRef = db.collection('schedules').doc(scheduleId);
      const scheduleDoc = await scheduleRef.get();
      if (!scheduleDoc.exists) {
        return res.status(404).json({ success: false, message: 'Schedule not found' });
      }
      const scheduleData = scheduleDoc.data();
      // Kiểm tra driver có được phép update schedule này hay không
      if (scheduleData.driverId !== driverId) {
        return res.status(403).json({ success: false, message: 'Driver not authorized to update this schedule' });
      }
      // Cập nhật trạng thái thành 'ongoing'
      await scheduleRef.update({ status: 'ongoing' });
      return res.status(200).json({ success: true, message: 'Schedule status updated to ongoing' });
    } catch (error) {
      console.error('Error updating schedule status: ', error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },

  // Đánh dấu hoàn thành chuyến đi
  completeSchedule: async (req, res) => {
    try {
      const { scheduleId, driverId } = req.body;
      if (!scheduleId || !driverId) {
        return res.status(400).json({ success: false, message: 'Missing scheduleId or driverId' });
      }
      const db = admin.firestore();
      const scheduleRef = db.collection('schedules').doc(scheduleId);
      const scheduleDoc = await scheduleRef.get();
  
      if (!scheduleDoc.exists) {
        return res.status(404).json({ success: false, message: 'Schedule not found' });
      }
  
      const scheduleData = scheduleDoc.data();
  
      // Kiểm tra driver có được phép cập nhật lịch trình này không
      if (scheduleData.driverId !== driverId) {
        return res.status(403).json({ success: false, message: 'Driver not authorized to complete this schedule' });
      }
  
      // Cập nhật trạng thái của schedule thành 'completed'
      await scheduleRef.update({ status: 'completed' });
  
      // Cập nhật driver: thêm scheduleId vào mảng completedSchedules và cập nhật status thành 'free'
      await db.collection('drivers').doc(driverId).update({
        completedSchedules: admin.firestore.FieldValue.arrayUnion(scheduleId),
        status: 'free'
      });
  
      return res.status(200).json({ 
        success: true, 
        message: 'Schedule status updated to completed, driver completedSchedules updated, and driver status set to free.' 
      });
    } catch (error) {
      console.error('Error updating schedule status: ', error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },
  // Xem lịch sử chuyến đi
  getScheduleHistory: async (req, res) => {
    const { driverId } = req.params;

    try {
      const driverRef = admin.firestore().collection('drivers').doc(driverId);
      const driverDoc = await driverRef.get();

      if (!driverDoc.exists) {
        return res.status(404).json({ success: false, message: 'Tài xế không tồn tại' });
      }

      const completedSchedules = driverDoc.data().completedSchedules || [];
      res.status(200).json({ success: true, completedSchedules });
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử:', error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  },
  deleteDriverById: async (req, res) => {
    const driverId = req.params.id;
  
    try {
      const db = admin.firestore();
      const driverRef = db.collection('drivers').doc(driverId);
      const doc = await driverRef.get();
  
      if (!doc.exists) {
        return res.status(404).json({ message: 'Tài xế không tồn tại' });
      }
  
      await driverRef.delete();
      return res.status(200).json({ message: 'Xóa tài xế thành công' });
    } catch (error) {
      console.error('Lỗi khi xóa tài xế:', error);
      return res.status(500).json({ message: 'Lỗi server khi xóa tài xế' });
    }
  },
  getDriverById: async (req,res) => {
    const { id } = req.params;

  try {
    const db = admin.firestore();
    const driverDoc = await db.collection('drivers').doc(id).get();

    if (!driverDoc.exists) {
      return res.status(404).json({ success: false, message: 'Tài xế không tồn tại' });
    }

    const driverData = driverDoc.data();
    return res.status(200).json({
      success: true,
      data: { id: driverDoc.id, ...driverData }
    });
    } catch (error) {
      console.error('Lỗi khi lấy thông tin tài xế:', error);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  },

  updateDriver: async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    try {
      const db = admin.firestore();
      const driverRef = db.collection('drivers').doc(id);
      await driverRef.update(updateData);
  
      res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (error) {
      console.error("Lỗi khi cập nhật tài xế:", error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  }
};

module.exports = driverController;
