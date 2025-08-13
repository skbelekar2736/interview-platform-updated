const mongoose = require('mongoose');

const chatBotSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['tech_tips', 'hr_tips', 'manners_tips', 'mock_tech', 'mock_hr'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  systemPrompt: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatBot', chatBotSchema);
