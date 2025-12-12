const mongoose = require("mongoose");

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true }, // Store rating as a number (1-5)
  image: { type: String, default: "person.circle" }, // Default image
  profession: { type: String, required: true },
});

const Worker = mongoose.model("Worker", WorkerSchema);
module.exports = Worker;
