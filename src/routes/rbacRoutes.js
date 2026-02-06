const express = require('express');
const rbacController = require('../controllers/rbacController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');

const router = express.Router();
router.use(authMiddleware.protect);
router.post('/create',authorizeMiddleware("user:create"),  rbacController.create);
router.put('/update', authorizeMiddleware("user:update"),  rbacController.update);
router.post('/delete', authorizeMiddleware("user:delete"),  rbacController.delete);
router.get('/getAllUser', authorizeMiddleware("user:view"),  rbacController.getAllUser);

module.exports = router;
