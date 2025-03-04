const validateScheduleData = (req, res, next) => {
  try {
      const data = req.body;

      // Validate required fields
      if (!data.routeId || !data.busId) {
          return res.status(400).json({
              success: false,
              message: 'routeId và busId là bắt buộc'
          });
      }

      // Validate seatLayout structure
      if (!data.seatLayout || typeof data.seatLayout !== 'object') {
          return res.status(400).json({
              success: false,
              message: 'seatLayout không hợp lệ'
          });
      }

      // Validate floor structure
      ['floor1', 'floor2'].forEach(floor => {
          if (!data.seatLayout[floor] || typeof data.seatLayout[floor] !== 'object') {
              return res.status(400).json({
                  success: false,
                  message: `${floor} trong seatLayout không hợp lệ`
              });
          }
      });

      // Validate seat data
      Object.entries(data.seatLayout).forEach(([floor, seats]) => {
          Object.entries(seats).forEach(([seatKey, seat]) => {
              if (!seat || typeof seat !== 'object') {
                  return res.status(400).json({
                      success: false,
                      message: `Dữ liệu ghế ${seatKey} trong ${floor} không hợp lệ`
                  });
              }
          });
      });

      // Convert data types
      req.body = {
          ...data,
          price: data.price ? String(data.price) : '0',
          seatLayout: {
              floor1: Object.fromEntries(
                  Object.entries(data.seatLayout.floor1).map(([key, seat]) => [
                      key,
                      {
                          isBooked: Boolean(seat.isBooked),
                          bookedBy: seat.bookedBy || null,
                          price: seat.price ? String(seat.price) : String(data.price) || '0',
                          type: seat.type || 'normal',
                          x: Number(seat.x) || 0,
                          y: Number(seat.y) || 0
                      }
                  ])
              ),
              floor2: Object.fromEntries(
                  Object.entries(data.seatLayout.floor2).map(([key, seat]) => [
                      key,
                      {
                          isBooked: Boolean(seat.isBooked),
                          bookedBy: seat.bookedBy || null,
                          price: seat.price ? String(seat.price) : String(data.price) || '0',
                          type: seat.type || 'normal',
                          x: Number(seat.x) || 0,
                          y: Number(seat.y) || 0
                      }
                  ])
              )
          }
      };

      next();
  } catch (error) {
      console.error('Validation error:', error);
      return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          error: error.message
      });
  }
};

module.exports = { validateScheduleData };
