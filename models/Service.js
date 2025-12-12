const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
  workerName: { type: String, required: true },
  workDescription: { type: String, required: true },
  workerAddress: { type: String, required: true },
  workerCity: { type: String, required: true, trim: true },
  workerArea: { type: String, trim: true },

  workerPhone: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v);   // exactly 10 digits
      },
      message: props => `${props.value} is not a valid 10‑digit phone number`
    }
  },

  pricePerDay: { type: Number, required: true },
  serviceDescription: { type: String, required: true }
});

module.exports = mongoose.model("Service", ServiceSchema);
