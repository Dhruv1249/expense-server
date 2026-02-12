const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const paymentsController = require('../controllers/paymentsController');

router.use(authMiddleware.protect);

router.post('/create-order', authMiddleware.protect, paymentsController.createOrder);
router.post('/verify-order', authMiddleware.protect, paymentsController.verifyOrder);
router.post('/create-subscription', authMiddleware.protect, paymentsController.createSubscription);
router.post('/verify-subscription', authMiddleware.protect, paymentsController.verifySubscription);
router.post('/cancel-subscription', authMiddleware.protect, paymentsController.cancelSubscription);
router.post('/webhook', paymentsController.webhook);

module.exports = router;
