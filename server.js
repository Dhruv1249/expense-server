require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const mongoose = require('mongoose');
const authRoutes = require('./src/routes/authRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
//const rbacRoutes = require('./src/routes/rbacRoutes');
const expenseRoutes = require('./src/routes/expenseRoutes');

mongoose.connect(process.env.MONGO_DB_CONNECTION_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch((error) => console.log('Error Connecting to Database: ', error));

const corsOption = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Electron, etc.)
    // Also allow specific origins from environment variable
    const allowedOrigins = process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(",")
      : [];

    // Capacitor uses these origins
    allowedOrigins.push("capacitor://localhost");
    allowedOrigins.push("http://localhost");

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

const app = express();

app.use(cors(corsOption));
app.use(express.json()); // Middleware
app.use(cookieParser()); // Middleware

app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
//app.use('/rbac', rbacRoutes);
app.use('/expenses', expenseRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
