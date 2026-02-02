require("dotenv").config();
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./src/routes/authRoutes");
const groupRoutes = require("./src/routes/groupRoutes");
const cookieParser = require("cookie-parser");
mongoose
  .connect(process.env.MONGO_DB_CONNECTION_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((error) => console.log(""));

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRoutes);
app.use("/groups", groupRoutes);
app.listen(5001, () => {
  console.log("Server is running on port 5001");
});
