const ChatBot = require('../models/ChatBot');
const openai = require('../config/openai');

const getChatBots = async (req, res) => {
  try {
    const chatbots = await ChatBot.find({ isActive: true });
    res.json(chatbots);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const chatWithBot = async (req, res) => {
  try {
    const { botId, message, conversationHistory = [] } = req.body;
    
    const bot = await ChatBot.findById(botId);
    if (!bot) {
      return res.status(404).json({ message: 'Chatbot not found' });
    }

    const messages = [
      { role: 'system', content: bot.systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 500,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;

    res.json({ response });
  } catch (error) {
    res.status(500).json({ message: 'Failed to chat with bot', error: error.message });
  }
};

module.exports = { getChatBots, chatWithBot };
