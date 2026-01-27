require('dotenv').config();
const express = require('express');
const authRoutes = require('./src/routes/authRoutes') 
const mongoose = require('mongoose');
const groupRoutes = require('./src/routes/groupRoutes');

mongoose.connect(process.env.MONGO_DB_CONNECTION_URI).then(() => console.log("MongoDB is connected"));

 

const app = express();

app.use(express.json()); // Middleware
app.use('/group',groupRoutes);
app.use('/auth', authRoutes);

app.listen(5001, () =>{
  console.log('Server is running on port 5001');
});
