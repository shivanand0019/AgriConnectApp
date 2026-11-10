const Message = require('../models/Message');

// @desc    Send message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { recipientId, relatedOrder, relatedProduce, content } = req.body;

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      relatedOrder: relatedOrder || undefined,
      relatedProduce: relatedProduce || undefined,
      content,
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'name role profileImage')
      .populate('recipient', 'name role profileImage');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user conversation threads
// @route   GET /api/messages
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { withUser } = req.query;

    let query = {};
    if (withUser) {
      query = {
        $or: [
          { sender: req.user._id, recipient: withUser },
          { sender: withUser, recipient: req.user._id },
        ],
      };
    } else {
      query = {
        $or: [{ sender: req.user._id }, { recipient: req.user._id }],
      };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name role profileImage')
      .populate('recipient', 'name role profileImage')
      .sort({ createdAt: 1 });

    res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
};
