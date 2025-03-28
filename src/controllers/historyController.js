const {db} = require('../config/firebase');

const historyController = {
    getAllHistory: async (req,res) => {
        try {
            const snapshot = await db.collection("tickets").get();
            const tickets = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
            return res.status(200).json({
                success: true,
                data: tickets
            });
        } catch (error) {
            console.error("Error", error);
        }
    },
    getHistoryByCustomerId: async (req,res) => {
        try {
            const {customerId} = req.params;
            const snapshot = await db.collection("tickets").where('customerId', '==',customerId).get();
            if(snapshot.empty) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy vé theo người dùng"
                });
            }
            const tickets = snapshot.docs.map((doc) => ({id:doc.id, ...doc.data()}));
            return res.status(200).json({
                success: true,
                data: tickets
            });
        } catch (error) {
            console.error("Error", error);
        }
    }
}

module.exports = historyController;