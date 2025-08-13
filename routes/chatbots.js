const express = require('express');
const { getChatBots, chatWithBot } = require('../controllers/chatbotController');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, getChatBots);
router.post('/chat', auth, chatWithBot);

module.exports = router;
