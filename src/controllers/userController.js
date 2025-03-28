const { db } = require("../config/firebase");
const admin = require("firebase-admin");

const userController = {
    getAllUser: async (req, res) => {
        try {
            // Lấy danh sách user từ Firestore
            const snapshot = await db.collection("users").get();
            let usersFromFirestore = [];
            snapshot.forEach((doc) => {
                usersFromFirestore.push({ id: doc.id, ...doc.data() });
            });

            // Lấy danh sách user từ Firebase Authentication
            const listUsersResult = await admin.auth().listUsers();
            let usersFromAuth = listUsersResult.users.map((userRecord) => ({
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName || "",
                phoneNumber: userRecord.phoneNumber || "",
                photoURL: userRecord.photoURL || "",
                disabled: userRecord.disabled,
                createdAt: new Date(userRecord.metadata.creationTime).toISOString(),
                lastLogin: userRecord.metadata.lastSignInTime
                    ? new Date(userRecord.metadata.lastSignInTime).toISOString()
                    : null,
            }));

            // Ghép dữ liệu từ Firestore và Auth (nếu cần)
            let allUsers = usersFromAuth.map((authUser) => {
                let firestoreUser = usersFromFirestore.find((u) => u.id === authUser.uid);
                return {
                    ...authUser,
                    firestoreData: firestoreUser || null, 
                };
            });

            return res.status(200).json({
                success: true,
                data: allUsers,
            });
        } catch (error) {
            console.error("Error fetching users:", error);
            return res.status(500).json({
                success: false,
                message: "Error retrieving users",
                error: error.message,
            });
        }
    },

    getUserById: async (req,res) => {
        try {
            const {customerId} = req.params;
            const userSnapshot = await db.collection("users").doc(customerId).get();
            if(!userSnapshot.exists) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy người dùng"
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    id: userSnapshot.id,
                    ...userSnapshot.data()
                }
            });
        } catch (error) {
            console.error("Error", error);
        }
    },

    updateUserById: async (req,res) => {
        try {
            const {customerId} = req.params;
            const updateData = req.body;
            const userRef = db.collection("users").doc(customerId);
            const userSnapshot = await userRef.get();
            if(!userSnapshot.exists) {
                return res.status(404).json({
                    message: "Không tìm thấy user"
                });
            }
            await userRef.update(updateData);

            //Data user sau khi cập nhật
            const updatedUserSnapshot = await userRef.get();
            const updatedData = updatedUserSnapshot.data();
            
            return res.status(200).json({ success: true, message: "Cập nhật người dùng thành công.", data: updatedData });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Lỗi khi cập nhật người dùng.", error: error.message });
        }
    }
};

module.exports = userController;
