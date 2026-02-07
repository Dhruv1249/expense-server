const express = require('express');
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require login
router.use(authMiddleware.protect);

router.post('/create', groupController.create);
router.get('/my-groups', groupController.getMyGroups);
router.get('/:groupId', groupController.getGroupDetails);
router.post('/add-members', groupController.addMembers);
router.put('/update', groupController.update);
router.post('/remove-member', groupController.removeMember);
router.delete('/:groupId', groupController.deleteGroup);
module.exports = router;