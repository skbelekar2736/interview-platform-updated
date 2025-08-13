const express = require('express');
const {
  createExperience,
  getExperiences,
  getExperience,
  likeExperience,
  addComment,
  getUserExperiences
} = require('../controllers/experienceController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, authorize('experienced'), createExperience);
router.get('/', auth, getExperiences);
router.get('/my', auth, getUserExperiences);
router.get('/:id', auth, getExperience);
router.post('/:id/like', auth, likeExperience);
router.post('/:id/comment', auth, addComment);

module.exports = router;
