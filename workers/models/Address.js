// address.js
const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema(
  {
    addressId: { type: String, unique: true, required: true },

    userId: { type: String, required: true },

    bookingId: { type: String },

    houseNumber: { type: String, required: true },
    landmark: { type: String },

    plotNo: { type: String, required: true },
    apartmentName: { type: String, required: true },

    area: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },

    pincode: { type: String, required: true },
    state: { type: String, required: true },

    phoneNumber: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/
    },

    // snapshot of worker/service details
    workerName: { type: String },
    workDescription: { type: String },
    pricePerDay: { type: Number },

    workerPhone: { type: String }   // ✅ NEW – worker’s mobile, hidden from form
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", AddressSchema);
