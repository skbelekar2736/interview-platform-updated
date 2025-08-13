const MockInterview = require('../models/MockInterview');
const openai = require('../config/openai');
const cloudinary = require('../config/cloudinary');
const { transcribeAudio } = require('../utils/speechToText');

const techQuestions = [
  "What is the difference between == and === in JavaScript?",
  "Explain the concept of closures in JavaScript.",
  "What is the time complexity of binary search?",
  "Explain the difference between SQL and NoSQL databases.",
  "What is RESTful API and its principles?"
];

const hrQuestions = [
  "Tell me about yourself.",
  "What are your strengths and weaknesses?",
  "Why do you want to work here?",
  "Where do you see yourself in 5 years?",
  "Describe a challenging situation you faced and how you handled it."
];

const startMockInterview = async (req, res) => {
  try {
    const { type } = req.body;
    const userId = req.user._id;

    const questions = type === 'technical' ? techQuestions : hrQuestions;
    const selectedQuestions = questions.slice(0, 5).map(q => ({ question: q }));

    const mockInterview = new MockInterview({
      user: userId,
      type,
      questions: selectedQuestions
    });

    await mockInterview.save();

    res.status(201).json({
      interviewId: mockInterview._id,
      questions: selectedQuestions.map(q => q.question)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const submitAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { questionIndex, textAnswer } = req.body;
    const audioFile = req.file;

    const mockInterview = await MockInterview.findById(id);
    if (!mockInterview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    let answer = textAnswer;
    let audioUrl = null;

    // If audio file is provided, transcribe it
    if (audioFile) {
      try {
        // Upload audio to cloudinary
        const audioUpload = await cloudinary.uploader.upload(audioFile.buffer, {
          resource_type: 'video',
          folder: 'interview-audio'
        });
        audioUrl = audioUpload.secure_url;

        // Transcribe audio
        answer = await transcribeAudio(audioFile.buffer);
      } catch (transcriptionError) {
        console.error('Transcription error:', transcriptionError);
        answer = textAnswer || 'Audio transcription failed';
      }
    }

    // Evaluate the answer using OpenAI
    const question = mockInterview.questions[questionIndex].question;
    const evaluationPrompt = `
      Evaluate this interview answer on a scale of 1-10:
      
      Question: ${question}
      Answer: ${answer}
      
      Interview Type: ${mockInterview.type}
      
      Please provide:
      1. Score (1-10)
      2. Detailed feedback
      3. Strengths (array)
      4. Areas for improvement (array)
      
      Format your response as JSON:
      {
        "score": number,
        "feedback": "detailed feedback",
        "strengths": ["strength1", "strength2"],
        "improvements": ["improvement1", "improvement2"]
      }
    `;

    const evaluation = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: evaluationPrompt }],
      temperature: 0.3
    });

    let evaluationData;
    try {
      evaluationData = JSON.parse(evaluation.choices[0].message.content);
    } catch (parseError) {
      evaluationData = {
        score: 5,
        feedback: "Unable to parse evaluation",
        strengths: [],
        improvements: []
      };
    }

    // Update the question with answer and evaluation
    mockInterview.questions[questionIndex] = {
      question,
      userAnswer: answer,
      audioUrl,
      evaluation: evaluationData
    };

    await mockInterview.save();

    res.json({
      evaluation: evaluationData,
      transcription: audioUrl ? answer : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMockInterviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const mockInterviews = await MockInterview.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('type overallScore status createdAt duration');

    const total = await MockInterview.countDocuments({ user: userId });

    res.json({
      mockInterviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMockInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const mockInterview = await MockInterview.findOne({
      _id: id,
      user: userId
    });

    if (!mockInterview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json(mockInterview);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const completeMockInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const mockInterview = await MockInterview.findOne({
      _id: id,
      user: userId
    });

    if (!mockInterview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Calculate overall score and feedback
    const answeredQuestions = mockInterview.questions.filter(q => q.userAnswer);
    const totalScore = answeredQuestions.reduce((sum, q) => sum + (q.evaluation?.score || 0), 0);
    const averageScore = answeredQuestions.length > 0 ? totalScore / answeredQuestions.length : 0;

    const overallFeedbackPrompt = `
      Generate overall feedback for this ${mockInterview.type} interview:
      
      Questions and Scores:
      ${answeredQuestions.map((q, i) => `
        Q${i + 1}: ${q.question}
        Score: ${q.evaluation?.score || 0}/10
        Answer Quality: ${q.evaluation?.feedback || 'No feedback'}
      `).join('\n')}
      
      Average Score: ${averageScore.toFixed(1)}/10
      
      Provide comprehensive feedback covering:
      1. Overall performance assessment
      2. Key strengths demonstrated
      3. Critical areas for improvement
      4. Specific recommendations for preparation
    `;

    const overallFeedback = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: overallFeedbackPrompt }],
      temperature: 0.3
    });

    mockInterview.overallScore = Math.round(averageScore);
    mockInterview.overallFeedback = overallFeedback.choices[0].message.content;
    mockInterview.status = 'completed';

    await mockInterview.save();

    res.json({
      overallScore: mockInterview.overallScore,
      overallFeedback: mockInterview.overallFeedback,
      message: 'Interview completed successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  startMockInterview,
  submitAnswer,
  getMockInterviews,
  getMockInterview,
  completeMockInterview
};
