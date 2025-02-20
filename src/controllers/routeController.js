const { db } = require('../config/firebase');

const routeController = {
  createRoute: async (req, res) => {
    try {
      const routeData = req.body;
      const routeRef = db.collection('routes').doc();
      await routeRef.set({ id: routeRef.id, ...routeData, createdAt: new Date().toISOString() });

      res.status(201).json({ success: true, message: 'Tuyến đường được tạo thành công', data: { id: routeRef.id, ...routeData } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getRoutes: async (req, res) => {
    try {
      const snapshot = await db.collection('routes').get();
      const routes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json({ success: true, data: routes });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getRoute: async (req, res) => {
    try {
      const { id } = req.params;
      const routeDoc = await db.collection('routes').doc(id).get();

      if (!routeDoc.exists) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy tuyến đường' });
      }

      res.status(200).json({ success: true, data: { id: routeDoc.id, ...routeDoc.data() } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateRoute: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const routeRef = db.collection('routes').doc(id);
      await routeRef.update({ ...updateData, updatedAt: new Date().toISOString() });

      res.status(200).json({ success: true, message: 'Cập nhật tuyến đường thành công' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  deleteRoute: async (req, res) => {
    try {
      const { id } = req.params;
      const routeRef = db.collection('routes').doc(id);
      await routeRef.delete();

      res.status(200).json({ success: true, message: 'Xóa tuyến đường thành công' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = routeController;
