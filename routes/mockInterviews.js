const express = require('express');
const { 
  startMockInterview, 
  submitAnswer, 
  getMockInterviews,
  getMockInterview,
  completeMockInterview 
} = require('../controllers/mockInterviewController');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

router.post('/start', auth, startMockInterview);
router.post('/:id/answer', auth, upload.single('audio'), submitAnswer);
router.get('/', auth, getMockInterviews);
router.get('/:id', auth, getMockInterview);
router.post('/:id/complete', auth, completeMockInterview);

module.exports = router;
