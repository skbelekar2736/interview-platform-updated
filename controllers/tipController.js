const Tip = require('../models/Tip');

const createTip = async (req, res) => {
  try {
    const { category, title, content, tags } = req.body;
    const userId = req.user._id;

    const tip = new Tip({
      user: userId,
      category,
      title,
      content,
      tags: tags || []
    });

    await tip.save();
    await tip.populate('user', 'name profile.avatar');

    res.status(201).json(tip);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getTips = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tags, search } = req.query;

    const query = { isApproved: true };

    if (category) {
      query.category = category;
    }

    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const tips = await Tip.find(query)
      .populate('user', 'name profile.avatar profile.company profile.position')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Tip.countDocuments(query);

    res.json({
      tips,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getTip = async (req, res) => {
  try {
    const { id } = req.params;

    const tip = await Tip.findById(id)
      .populate('user', 'name profile.avatar profile.company profile.position')
      .populate('comments.user', 'name profile.avatar');

    if (!tip) {
      return res.status(404).json({ message: 'Tip not found' });
    }

    res.json(tip);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const likeTip = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const tip = await Tip.findById(id);
    if (!tip) {
      return res.status(404).json({ message: 'Tip not found' });
    }

    const likeIndex = tip.likes.findIndex(like => 
      like.user.toString() === userId.toString()
    );

    if (likeIndex > -1) {
      tip.likes.splice(likeIndex, 1);
    } else {
      tip.likes.push({ user: userId });
    }

    await tip.save();

    res.json({
      likes: tip.likes.length,
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

    const tip = await Tip.findById(id);
    if (!tip) {
      return res.status(404).json({ message: 'Tip not found' });
    }

    tip.comments.push({
      user: userId,
      text
    });

    await tip.save();
    await tip.populate('comments.user', 'name profile.avatar');

    const newComment = tip.comments[tip.comments.length - 1];

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserTips = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const tips = await Tip.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Tip.countDocuments({ user: userId });

    res.json({
      tips,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createTip,
  getTips,
  getTip,
  likeTip,
  addComment,
  getUserTips
};
