const Room = require('../models/Room');
const Message = require('../models/Message');
const User = require('../models/User');

const getRooms = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const rooms = await Room.find({
      participants: userId,
      isActive: true
    })
    .populate('participants', 'name profile.avatar role')
    .populate('lastMessage', 'content createdAt')
    .sort({ updatedAt: -1 });

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    // Verify user is part of the room
    const room = await Room.findOne({
      _id: roomId,
      participants: userId
    });

    if (!room) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ room: roomId })
      .populate('sender', 'name profile.avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({ room: roomId });

    res.json({
      messages: messages.reverse(),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getExperiencedUsers = async (req, res) => {
  try {
    const { search, skills } = req.query;
    
    const query = { 
      role: 'experienced',
      isVerified: true
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'profile.company': { $regex: search, $options: 'i' } },
        { 'profile.position': { $regex: search, $options: 'i' } }
      ];
    }

    if (skills) {
      query['profile.skills'] = { $in: skills.split(',') };
    }

    const users = await User.find(query)
      .select('name profile.avatar profile.bio profile.company profile.position profile.skills')
      .limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getRooms,
  getMessages,
  getExperiencedUsers
};
