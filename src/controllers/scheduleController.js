const { log } = require('firebase-functions/logger');
const { db } = require('../config/firebase');
const { getHours, getMinutes, format } = require('date-fns-tz');

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
              duration: routeData.duration,
              from: routeData.from,
              to: routeData.to
            };
          }
        }

        // Lấy thông tin xe
        if (scheduleData.busId) {
          const busDoc = await db.collection('buses').doc(scheduleData.busId).get();
          if (busDoc.exists) {
            const busData = busDoc.data();
            let busTypeName = "Unknown";
            if (busData.busTypeId) {
              const busTypeDoc = await db.collection('busTypes').doc(busData.busTypeId).get();
              const busTypeData = busTypeDoc.data();
              busTypeName = busTypeData.typeName || "Unknown";
            }
            scheduleData.bus = {
              id: busDoc.id,
              busNumber: busData.busNumber,
              manufacturer: busData.manufacturer,
              model: busData.model,
              status: busData.status,
              busType: busTypeName
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

  getScheduleApp: async (req, res) => {
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
            duration: routeData.duration,
            from: routeData.from,
            to: routeData.to
          };
        }
      }

      // Lấy thông tin xe
      if (scheduleData.busId) {
        const busDoc = await db.collection('buses').doc(scheduleData.busId).get();
        if (busDoc.exists) {
          const busData = busDoc.data();
          let busTypeName = "Unknown";
          if (busData.busTypeId) {
            const busTypeDoc = await db.collection('busTypes').doc(busData.busTypeId).get();
            const busTypeData = busTypeDoc.data();
            busTypeName = busTypeData.typeName || "Unknown";
          }
          scheduleData.bus = {
            id: busDoc.id,
            busNumber: busData.busNumber,
            manufacturer: busData.manufacturer,
            model: busData.model,
            status: busData.status,
            busType: busTypeName
          };
        }
      }

      // Lấy thông tin seatLayout
      if (scheduleData.seatLayoutId) {
        const seatLayoutDoc = await db.collection('seatLayouts').doc(scheduleData.seatLayoutId).get();
        if (seatLayoutDoc.exists) {
          scheduleData.seatLayout = seatLayoutDoc.data();
        }
      } else {
        // Nếu không có seatLayoutId, dùng defaultSeatLayout của xe nếu có
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
              }
            }
          }
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
      if (!scheduleData.routeId || !scheduleData.busId) {
        return res.status(400).json({
          success: false,
          message: "routeId và busId là bắt buộc",
        });
      }

      const busRef = db.collection("buses").doc(scheduleData.busId);
      const busDoc = await busRef.get();
      if (!busDoc.exists) {
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy xe",
        });
      }

      const busData = busDoc.data();
      if (!busData.defaultSeatLayoutId) {
        return res.status(400).json({
          success: false,
          message: "Xe không có sơ đồ ghế mặc định",
        });
      }

      const defaultSeatLayoutRef = db.collection("seatLayouts").doc(busData.defaultSeatLayoutId);
      const defaultSeatLayoutDoc = await defaultSeatLayoutRef.get();
      if (!defaultSeatLayoutDoc.exists) {
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy sơ đồ ghế mặc định của xe",
        });
      }

      const defaultSeatLayoutData = defaultSeatLayoutDoc.data();

      const newSeatLayoutRef = db.collection("seatLayouts").doc();
      const newSeatLayoutData = {
        ...defaultSeatLayoutData,
        scheduleId: "", // Cập nhật sau khi có `scheduleId`
        busId: scheduleData.busId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await newSeatLayoutRef.set(newSeatLayoutData);

      const scheduleRef = db.collection("schedules").doc();
      const scheduleDocData = {
        routeId: scheduleData.routeId,
        busId: scheduleData.busId,
        departureTime: scheduleData.departureTime || null,
        arrivalTime: scheduleData.arrivalTime || null,
        price: scheduleData.price ? String(scheduleData.price) : "0",
        status: scheduleData.status || "upcoming",
        seatLayoutId: newSeatLayoutRef.id, // Gán ID sơ đồ ghế mới
        id: scheduleRef.id,
        vendorId: scheduleData.vendorId
      };

      await newSeatLayoutRef.update({ scheduleId: scheduleRef.id });

      await scheduleRef.set(scheduleDocData);

      res.status(201).json({
        success: true,
        data: {
          id: scheduleRef.id,
          ...scheduleDocData,
        },
      });
    } catch (error) {
      console.error("Lỗi khi tạo lịch trình:", error);
      res.status(500).json({
        success: false,
        message: error.message,
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

      const scheduleRef = db.collection('schedules').doc(id);
      const scheduleDoc = await scheduleRef.get();

      if (!scheduleDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lịch trình'
        });
      }

      const scheduleUpdate = {
        price: updateData.price ? String(updateData.price) : String(scheduleDoc.data().price) || '0', // Chuyển đổi price thành string
        status: updateData.status || scheduleDoc.data().status,
        updatedAt: new Date().toISOString()
      };

      await scheduleRef.update(scheduleUpdate);

      res.json({
        success: true,
        message: 'Cập nhật lịch trình thành công'
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
  },

  updateTimeSchedule: async (req, res) => {
    try {
      const scheduleRef = db.collection("schedules");
      const scheduleSnapshot = await scheduleRef.get();

      const now = new Date();
      const vnToday = new Date(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }));
      const todayStartVN = new Date(`${vnToday.toISOString().slice(0, 10)}T00:00:00+07:00`);

      let updatedCount = 0;

      for (const doc of scheduleSnapshot.docs) {
        const data = doc.data();

        const departureTime = data.departureTime?.toDate?.() || new Date(data.departureTime);
        const arrivalTime = data.arrivalTime?.toDate?.() || new Date(data.arrivalTime);

        if (!departureTime || !arrivalTime || data.status === 'completed') continue;

        const updates = {};

        // ====== Kiểm tra và update departureTime nếu cần
        const depDateVN = new Date(departureTime.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }));
        if (depDateVN < todayStartVN) {
          const newDeparture = new Date(todayStartVN);
          const hourVN = getHours(departureTime, { timeZone: 'Asia/Ho_Chi_Minh' });
          const minuteVN = getMinutes(departureTime, { timeZone: 'Asia/Ho_Chi_Minh' });
          newDeparture.setHours(hourVN, minuteVN, 0, 0);

          const isoDeparture = format(newDeparture, "yyyy-MM-dd'T'HH:mm:ssXXX", {
            timeZone: 'Asia/Ho_Chi_Minh'
          });
          updates.departureTime = isoDeparture;
        }

        // ====== Kiểm tra và update arrivalTime nếu cần
        const arrDateVN = new Date(arrivalTime.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }));
        if (arrDateVN < todayStartVN) {
          const newArrival = new Date(todayStartVN);
          const hourVN = getHours(arrivalTime, { timeZone: 'Asia/Ho_Chi_Minh' });
          const minuteVN = getMinutes(arrivalTime, { timeZone: 'Asia/Ho_Chi_Minh' });
          newArrival.setHours(hourVN, minuteVN, 0, 0);

          const isoArrival = format(newArrival, "yyyy-MM-dd'T'HH:mm:ssXXX", {
            timeZone: 'Asia/Ho_Chi_Minh'
          });
          updates.arrivalTime = isoArrival;
        }

        if (Object.keys(updates).length > 0) {
          await scheduleRef.doc(doc.id).update(updates);
          updatedCount++;
        }
      }

      res.status(200).json({ message: `Updated ${updatedCount} schedule(s)` });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: 'Failed to update schedules',
        error: error.message
      });
    }
  }
};

module.exports = scheduleController; 
