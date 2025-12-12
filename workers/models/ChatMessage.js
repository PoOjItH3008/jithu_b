const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      index: true
    },
    senderName: {
      type: String,
      required: true
    },
    senderRole: {
      type: String,
      enum: ['Guest', 'Worker'],
      required: true
    },
    text: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
