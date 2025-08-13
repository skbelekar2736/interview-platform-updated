const express = require('express');
const {
  getRooms,
  getMessages,
  getExperiencedUsers
} = require('../controllers/chatController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/rooms', auth, getRooms);
router.get('/rooms/:roomId/messages', auth, getMessages);
router.get('/experienced-users', auth, authorize('student'), getExperiencedUsers);

module.exports = router;
