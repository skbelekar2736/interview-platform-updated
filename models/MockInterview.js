const mongoose = require('mongoose');

const mockInterviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['technical', 'hr'],
    required: true
  },
  questions: [{
    question: String,
    userAnswer: String,
    audioUrl: String,
    evaluation: {
      score: Number,
      feedback: String,
      strengths: [String],
      improvements: [String]
    }
  }],
  overallScore: Number,
  overallFeedback: String,
  duration: Number, // in minutes
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MockInterview', mockInterviewSchema);
