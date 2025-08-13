const express = require('express');
const {
  createTip,
  getTips,
  getTip,
  likeTip,
  addComment,
  getUserTips
} = require('../controllers/tipController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, authorize('experienced'), createTip);
router.get('/', auth, getTips);
router.get('/my', auth, getUserTips);
router.get('/:id', auth, getTip);
router.post('/:id/like', auth, likeTip);
router.post('/:id/comment', auth, addComment);

module.exports = router;
