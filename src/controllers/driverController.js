const {db} = require('../config/firebase');

const driverController = {
    getAllDriver: async (req,res) => {
        try {
            const snapshot = await db.collection("drivers").get();
            const drivers = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
            return res.status(200).json({
                success: true,
                data: drivers
            });
        } catch (error) {
            console.error("Error",error);
        }
    }
}

module.exports = driverController;