const express = require('express');
const rbacController = require('../controllers/rbacController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();
router.use(authMiddleware.protect);
router.post('/create',  rbacController.create);
router.put('/update',  rbacController.update);
router.post('/delete',  rbacController.delete);
router.get('/getAllUser',  rbacController.getAllUser);

module.exports = router;
