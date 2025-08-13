const Experience = require('../models/Experience');

const createExperience = async (req, res) => {
  try {
    const { title, company, position, interviewType, content, tags } = req.body;
    const userId = req.user._id;

    const experience = new Experience({
      user: userId,
      title,
      company,
      position,
      interviewType,
      content,
      tags: tags || []
    });

    await experience.save();
    await experience.populate('user', 'name profile.avatar');

    res.status(201).json(experience);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getExperiences = async (req, res) => {
  try {
    const { page = 1, limit = 10, interviewType, tags, search } = req.query;

    const query = { isApproved: true };

    if (interviewType) {
      query.interviewType = interviewType;
    }

    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const experiences = await Experience.find(query)
      .populate('user', 'name profile.avatar profile.company profile.position')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Experience.countDocuments(query);

    res.json({
      experiences,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getExperience = async (req, res) => {
  try {
    const { id } = req.params;

    const experience = await Experience.findById(id)
      .populate('user', 'name profile.avatar profile.company profile.position')
      .populate('comments.user', 'name profile.avatar');

    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    res.json(experience);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const likeExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const experience = await Experience.findById(id);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    const likeIndex = experience.likes.findIndex(like => 
      like.user.toString() === userId.toString()
    );

    if (likeIndex > -1) {
      experience.likes.splice(likeIndex, 1);
    } else {
      experience.likes.push({ user: userId });
    }

    await experience.save();

    res.json({
      likes: experience.likes.length,
      isLiked: likeIndex === -1
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const experience = await Experience.findById(id);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    experience.comments.push({
      user: userId,
      text
    });

    await experience.save();
    await experience.populate('comments.user', 'name profile.avatar');

    const newComment = experience.comments[experience.comments.length - 1];

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserExperiences = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const experiences = await Experience.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Experience.countDocuments({ user: userId });

    res.json({
      experiences,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createExperience,
  getExperiences,
  getExperience,
  likeExperience,
  addComment,
  getUserExperiences
};
