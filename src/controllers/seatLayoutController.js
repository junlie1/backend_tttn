const { db } = require('../config/firebase');

// Lấy chi tiết một loại xe

const seatLayoutController = {
    getSeatLayoutById: async (req, res) => {
        try {
            const seatLayoutDoc = await db.collection("seatLayouts").doc(req.params.id).get();
            console.log('seatLayoutDoc',seatLayoutDoc);
            
            if (!seatLayoutDoc.exists) {
              return res.status(404).json({ success: false, message: "Không tìm thấy sơ đồ ghế" });
            }
        
            res.json({ success: true, data: seatLayoutDoc.data() });
          } catch (error) {
            console.error("Error fetching seat layout:", error);
            res.status(500).json({ success: false, message: "Lỗi khi lấy sơ đồ ghế" });
          }
    }
}

module.exports = seatLayoutController;