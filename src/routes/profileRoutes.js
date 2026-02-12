const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const profileController = require('../controllers/profileController');

router.use(authMiddleware.protect);
router.get('/get-user-info', profileController.getUserInfo);

module.exports = router;
