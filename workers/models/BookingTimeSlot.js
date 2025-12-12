// models/BookingTimeSlot.js 
const mongoose = require('mongoose');

const bookingTimeSlotSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    addressId: {                   // ✅ link to Address
      type: String,
      required: true,
      trim: true,
    },
    status: {                      // ✅ NEW: worker/guest-visible status
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled", "Completed"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BookingTimeSlot', bookingTimeSlotSchema);
