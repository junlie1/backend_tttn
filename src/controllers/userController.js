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
};

module.exports = userController;
