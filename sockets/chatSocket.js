const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');

const chatSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', async (data) => {
      const { userId, receiverId } = data;
      
      try {
        let room = await Room.findOne({
          participants: { $all: [userId, receiverId] }
        });

        if (!room) {
          room = new Room({
            participants: [userId, receiverId]
          });
          await room.save();
        }

        socket.join(room._id.toString());
        socket.emit('room_joined', { roomId: room._id });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('send_message', async (data) => {
      const { roomId, senderId, receiverId, content, messageType } = data;

      try {
        const message = new Message({
          sender: senderId,
          receiver: receiverId,
          room: roomId,
          content,
          messageType: messageType || 'text'
        });

        await message.save();
        await message.populate('sender', 'name avatar');

        // Update room's last message
        await Room.findByIdAndUpdate(roomId, { lastMessage: message._id });

        io.to(roomId).emit('new_message', message);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('mark_as_read', async (data) => {
      const { messageId } = data;

      try {
        await Message.findByIdAndUpdate(messageId, { isRead: true });
        socket.emit('message_read', { messageId });
      } catch (error) {
        socket.emit('error', { message: 'Failed to mark message as read' });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = chatSocket;