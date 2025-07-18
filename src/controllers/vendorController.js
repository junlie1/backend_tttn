const { db } = require("../config/firebase");

const vendorController = {
  getAllVendors: async (req, res) => {
    try {
      const snapshot = await db.collection("vendors").get();

      const vendors = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({ success: true, data: vendors });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách vendors:", error.message);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  updateVendor: async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
      const vendorRef = db.collection("vendors").doc(id);
      await vendorRef.update({ status });

      return res.status(200).json({
        success: true,
        message: `Đã cập nhật vendor ${id} sang trạng thái ${status}`,
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật vendor:", error.message);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  deleteVendor: async (req, res) => {
    const { id } = req.params;

    try {
      const vendorRef = db.collection("vendors").doc(id);
      await vendorRef.delete();

      return res.status(200).json({
        success: true,
        message: `Đã xoá vendor ${id}`,
      });
    } catch (error) {
      console.error("Lỗi khi xoá vendor:", error.message);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
};

module.exports = vendorController;
