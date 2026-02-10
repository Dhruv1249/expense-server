const express = require('express');
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.post('/add', expenseController.addExpense);
router.get('/group/:groupId', expenseController.getGroupExpenses);
router.get('/stats', expenseController.getStats);
router.post('/settle', expenseController.settleExpense);
module.exports = router;