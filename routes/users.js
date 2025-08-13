const express = require('express');
const {
  getProfile,
  updateProfile,
  uploadAvatar
} = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/avatar', auth, upload.single('avatar'), uploadAvatar);

module.exports = router;
