const mongoose = require("mongoose");

const signupSchema = new mongoose.Schema({
  username: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ["Guest", "Worker"] } // NEW
}, { timestamps: true });

module.exports = mongoose.model("Signup", signupSchema);
