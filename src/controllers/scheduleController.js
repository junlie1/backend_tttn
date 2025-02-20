const { db } = require('../config/firebase');

const scheduleController = {
  // Lấy danh sách lịch trình
  getSchedules: async (req, res) => {
    try {
      const schedulesRef = db.collection('schedules');
      const snapshot = await schedulesRef.get();
      
      const schedules = [];
      
      // Lấy dữ liệu lịch trình và join với routes, buses và seatLayout
      for (const doc of snapshot.docs) {
        const scheduleData = { id: doc.id, ...doc.data() };
        
        // Lấy thông tin tuyến đường
        if (scheduleData.routeId) {
          const routeDoc = await db.collection('routes').doc(scheduleData.routeId).get();
          if (routeDoc.exists) {
            const routeData = routeDoc.data();
            scheduleData.route = {
              id: routeDoc.id,
              routeName: routeData.routeName,
              startPoint: routeData.startPoint,
              endPoint: routeData.endPoint,
              distance: routeData.distance,
              duration: routeData.duration
            };
          }
        }
        
        // Lấy thông tin xe
        if (scheduleData.busId) {
          const busDoc = await db.collection('buses').doc(scheduleData.busId).get();
          if (busDoc.exists) {
            const busData = busDoc.data();
            scheduleData.bus = {
              id: busDoc.id,
              busNumber: busData.busNumber,
              manufacturer: busData.manufacturer,
              model: busData.model,
              status: busData.status
            };
          }
        }

        // Lấy thông tin seatLayout
        if (scheduleData.seatLayoutId) {
          try {
            const seatLayoutDoc = await db.collection('seatLayouts').doc(scheduleData.seatLayoutId).get();
            if (seatLayoutDoc.exists) {
              scheduleData.seatLayout = seatLayoutDoc.data();
            } else {
              console.log(`SeatLayout not found for schedule ${scheduleData.id}`);
              // Nếu không tìm thấy seatLayout, lấy từ defaultSeatLayout của xe
              if (scheduleData.busId) {
                const busDoc = await db.collection('buses').doc(scheduleData.busId).get();
                if (busDoc.exists) {
                  const busData = busDoc.data();
                  if (busData.defaultSeatLayoutId) {
                    const defaultSeatLayoutDoc = await db.collection('seatLayouts')
                      .doc(busData.defaultSeatLayoutId)
                      .get();
                    if (defaultSeatLayoutDoc.exists) {
                      scheduleData.seatLayout = defaultSeatLayoutDoc.data();
                      console.log(`Using default seatLayout from bus ${scheduleData.busId}`);
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Error getting seatLayout for schedule ${scheduleData.id}:`, error);
          }
        }
        
        schedules.push(scheduleData);
      }
      
      res.json({
        success: true,
        data: schedules
      });
    } catch (error) {
      console.error('Error getting schedules:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Lấy chi tiết một lịch trình
  getSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID lịch trình là bắt buộc'
        });
      }

      const scheduleRef = db.collection('schedules').doc(id);
      const schedule = await scheduleRef.get();

      if (!schedule.exists) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lịch trình'
        });
      }

      const scheduleData = {
        id: schedule.id,
        ...schedule.data()
      };

      // Lấy thông tin seatLayout
      if (scheduleData.seatLayoutId) {
        const seatLayoutDoc = await db.collection('seatLayouts').doc(scheduleData.seatLayoutId).get();
        if (seatLayoutDoc.exists) {
          scheduleData.seatLayout = seatLayoutDoc.data();
        }
      }

      res.json({
        success: true,
        data: scheduleData
      });
    } catch (error) {
      console.error('Error getting schedule:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Tạo lịch trình mới
  createSchedule: async (req, res) => {
    try {
      const scheduleData = req.body;
      // Validate required fields
      if (!scheduleData.routeId || !scheduleData.busId) {
        return res.status(400).json({
          success: false,
          message: 'routeId và busId là bắt buộc'
        });
      }

      // 1. Lấy thông tin xe và seatLayout mặc định
      const busRef = db.collection('buses').doc(scheduleData.busId);
      const busDoc = await busRef.get();

      if (!busDoc.exists) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy xe'
        });
      }

      const busData = busDoc.data();
      console.log('busData',busData);
      
      // Kiểm tra defaultSeatLayoutId
      if (!busData.defaultSeatLayoutId) {
        return res.status(400).json({
          success: false,
          message: 'Xe không có cấu hình ghế mặc định'
        });
      }

      const defaultSeatLayoutRef = db.collection('seatLayouts').doc(busData.defaultSeatLayoutId);
      const defaultSeatLayout = await defaultSeatLayoutRef.get();

      if (!defaultSeatLayout.exists) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy cấu hình ghế của xe'
        });
      }

      // 2. Tạo bản sao của seatLayout cho lịch trình này
      const scheduleSeatLayoutRef = db.collection('seatLayouts').doc();
      const defaultSeatLayoutData = defaultSeatLayout.data();
      
      // Tạo dữ liệu ghế mới dựa trên mẫu, với giá và trạng thái mới
      const seatLayoutData = {
        floor1: {},
        floor2: {},
        busId: scheduleData.busId,
        scheduleId: '', // Sẽ được cập nhật sau
        defaultPriceFloor1: scheduleData.defaultPriceFloor1 || defaultSeatLayoutData.defaultPriceFloor1,
        defaultPriceFloor2: scheduleData.defaultPriceFloor2 || defaultSeatLayoutData.defaultPriceFloor2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Xử lý ghế tầng 1
      if (defaultSeatLayoutData.floor1) {
        Object.entries(defaultSeatLayoutData.floor1).forEach(([key, seat]) => {
          const customSeat = scheduleData.seatLayout?.floor1?.[key] || {};
          seatLayoutData.floor1[key] = {
            isBooked: customSeat.isBooked || false,
            bookedBy: customSeat.bookedBy || null,
            price: Number(customSeat.price) || Number(scheduleData.defaultPriceFloor1) || seat.price,
            type: seat.type || 'normal'
          };
        });
      }

      // Xử lý ghế tầng 2
      if (defaultSeatLayoutData.floor2) {
        Object.entries(defaultSeatLayoutData.floor2).forEach(([key, seat]) => {
          const customSeat = scheduleData.seatLayout?.floor2?.[key] || {};
          seatLayoutData.floor2[key] = {
            isBooked: customSeat.isBooked || false,
            bookedBy: customSeat.bookedBy || null,
            price: Number(customSeat.price) || Number(scheduleData.defaultPriceFloor2) || seat.price,
            type: seat.type || 'normal'
          };
        });
      }

      // 3. Tạo document cho schedule
      const scheduleRef = db.collection('schedules').doc();
      const scheduleDocData = {
        routeId: scheduleData.routeId,
        busId: scheduleData.busId,
        departureTime: scheduleData.departureTime || null,
        arrivalTime: scheduleData.arrivalTime || null,
        price: Number(scheduleData.price) || 0,
        status: scheduleData.status || 'upcoming',
        seatLayoutId: scheduleSeatLayoutRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 4. Thực hiện batch write
      const batch = db.batch();
      seatLayoutData.scheduleId = scheduleRef.id; // Cập nhật scheduleId cho seatLayout
      batch.set(scheduleSeatLayoutRef, seatLayoutData);
      batch.set(scheduleRef, scheduleDocData);
      await batch.commit();

      // 5. Trả về response với dữ liệu đầy đủ
      const responseData = {
        id: scheduleRef.id,
        ...scheduleDocData,
        seatLayout: seatLayoutData
      };

      res.status(201).json({
        success: true,
        data: responseData
      });
    } catch (error) {
      console.error('Error creating schedule:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Cập nhật lịch trình
  updateSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID lịch trình là bắt buộc'
        });
      }

      // 1. Lấy thông tin schedule hiện tại
      const scheduleRef = db.collection('schedules').doc(id);
      const scheduleDoc = await scheduleRef.get();

      if (!scheduleDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lịch trình'
        });
      }

      const currentSchedule = scheduleDoc.data();

      // 2. Cập nhật seatLayout nếu có thay đổi về giá hoặc trạng thái đặt chỗ
      if (updateData.seatLayout) {
        const seatLayoutRef = db.collection('seatLayouts').doc(currentSchedule.seatLayoutId);
        const currentSeatLayout = await seatLayoutRef.get();
        
        if (!currentSeatLayout.exists) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy cấu hình ghế của lịch trình'
          });
        }

        const currentSeatLayoutData = currentSeatLayout.data();
        const updates = {};

        // Cập nhật thông tin ghế tầng 1
        if (updateData.seatLayout.floor1) {
          Object.entries(updateData.seatLayout.floor1).forEach(([key, seat]) => {
            if (!currentSeatLayoutData.floor1[key]) return;
            
            // Cập nhật tất cả các trường của ghế nếu có thay đổi
            if (seat.price !== undefined) {
              updates[`floor1.${key}.price`] = Number(seat.price);
            }
            if (seat.type !== undefined) {
              updates[`floor1.${key}.type`] = seat.type;
            }
            if (seat.isBooked !== undefined) {
              updates[`floor1.${key}.isBooked`] = seat.isBooked;
            }
            if (seat.bookedBy !== undefined) {
              updates[`floor1.${key}.bookedBy`] = seat.bookedBy;
            }
          });
        }

        // Cập nhật thông tin ghế tầng 2
        if (updateData.seatLayout.floor2) {
          Object.entries(updateData.seatLayout.floor2).forEach(([key, seat]) => {
            if (!currentSeatLayoutData.floor2[key]) return;
            
            // Cập nhật tất cả các trường của ghế nếu có thay đổi
            if (seat.price !== undefined) {
              updates[`floor2.${key}.price`] = Number(seat.price);
            }
            if (seat.type !== undefined) {
              updates[`floor2.${key}.type`] = seat.type;
            }
            if (seat.isBooked !== undefined) {
              updates[`floor2.${key}.isBooked`] = seat.isBooked;
            }
            if (seat.bookedBy !== undefined) {
              updates[`floor2.${key}.bookedBy`] = seat.bookedBy;
            }
          });
        }

        // Chỉ cập nhật nếu có thay đổi
        if (Object.keys(updates).length > 0) {
          updates.updatedAt = new Date().toISOString();
          await seatLayoutRef.update(updates);
        }
      }

      // 3. Cập nhật thông tin schedule
      const scheduleUpdate = {
        routeId: updateData.routeId || currentSchedule.routeId,
        busId: updateData.busId || currentSchedule.busId,
        departureTime: updateData.departureTime || currentSchedule.departureTime,
        arrivalTime: updateData.arrivalTime || currentSchedule.arrivalTime,
        price: Number(updateData.price) || currentSchedule.price,
        status: updateData.status || currentSchedule.status,
        updatedAt: new Date().toISOString()
      };

      await scheduleRef.update(scheduleUpdate);

      // 4. Lấy dữ liệu đã cập nhật
      const updatedSchedule = await scheduleRef.get();
      const updatedSeatLayout = await db.collection('seatLayouts')
        .doc(currentSchedule.seatLayoutId)
        .get();

      // Lấy thêm thông tin route và bus
      let routeData = null;
      let busData = null;
      const scheduleData = updatedSchedule.data();

      if (scheduleData.routeId) {
        const routeDoc = await db.collection('routes').doc(scheduleData.routeId).get();
        if (routeDoc.exists) {
          routeData = {
            id: routeDoc.id,
            ...routeDoc.data()
          };
        }
      }

      if (scheduleData.busId) {
        const busDoc = await db.collection('buses').doc(scheduleData.busId).get();
        if (busDoc.exists) {
          busData = {
            id: busDoc.id,
            ...busDoc.data()
          };
        }
      }

      const responseData = {
        id: updatedSchedule.id,
        ...scheduleData,
        route: routeData,
        bus: busData,
        seatLayout: {
          ...updatedSeatLayout.data(),
          floor1: updatedSeatLayout.data().floor1 || {},
          floor2: updatedSeatLayout.data().floor2 || {}
        }
      };

      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Xóa lịch trình
  deleteSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID lịch trình là bắt buộc'
        });
      }

      const scheduleRef = db.collection('schedules').doc(id);
      const schedule = await scheduleRef.get();

      if (!schedule.exists) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lịch trình'
        });
      }

      const scheduleData = schedule.data();

      // Xóa seatLayout trước
      if (scheduleData.seatLayoutId) {
        await db.collection('seatLayouts').doc(scheduleData.seatLayoutId).delete();
      }

      // Sau đó xóa schedule
      await scheduleRef.delete();

      res.json({
        success: true,
        message: 'Xóa lịch trình thành công'
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = scheduleController; 
