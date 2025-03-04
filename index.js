const express = require('express');
const cors = require('cors');
const session = require('express-session'); 
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Cấu hình express-session
app.use(session({
  secret: process.env.JWT_SECRET, 
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, sameSite: 'lax' } // chuyển thành true nếu đang dùng HTTPS
}));

// Routes
app.use('/api', routes);

// Khởi tạo collections và start server
const startServer = async () => {
  try {
    // Khởi tạo collections nếu cần
    // await initializeCollections();
    // console.log('Firebase collections initialized');

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
