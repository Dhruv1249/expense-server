const express = require('express');
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);
router.post('/create',groupController.create);
router.post('/update', groupController.update);
router.post('/addMembers',groupController.addMembers);
router.post('/removeMembers',groupController.removeMembers);
router.post('/getGroupByEmail', groupController.getGroupByEmail);
router.post('/getGroupByStatus',groupController.getGroupByStatus);


module.exports = router;
