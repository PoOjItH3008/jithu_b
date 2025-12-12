const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const User = require("../models/Signup");// Import User Model
const Worker = require("../models/Worker"); // Make sure this path is correct
const Service=require("../models/Service");
const Address=require("../models/Address");
const ChatMessage = require('../models/ChatMessage');
const BookingOrder = require("../models/BookingOrder");
const BookingTimeSlot = require('../models/BookingTimeSlot');
const { v4: uuidv4 } = require("uuid");
const Booking=require("../models/BookingOrder")

const router = express.Router();
const upload = multer();
const JWT_SECRET = "your_secret_key";

/* ===================== SIGNUP ROUTE ===================== */
router.post("/signup", upload.none(), async (req, res) => {
  try {
    const { username, phoneNumber, password, confirmPassword, role } = req.body;

    // ✅ Validation
    if (!username || !phoneNumber || !password || !confirmPassword || !role) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    if (phoneNumber.length !== 13 || !phoneNumber.startsWith("+91")) {
      return res.status(400).json({ error: "Invalid phone number format." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ error: "Phone number already registered." });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create new user object
    const newUser = new User({
      username,
      phoneNumber,
      password: hashedPassword,
      role
    });

    // ✅ Save to database
    await newUser.save();

    console.log(`✅ User registered: ${username}`);
    
    // ✅ Return success (NO token!)
    return res.status(201).json({ 
      message: "User registered successfully! Please login with your credentials." 
    });

  } catch (error) {
    console.error("❌ Signup error:", error);
    return res.status(500).json({ 
      error: "Server error, please try again later.",
      details: error.message 
    });
  }
});


/* ===================== LOGIN ROUTE ===================== */
router.post("/login", upload.none(), async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    // ✅ Validation
    if (!phoneNumber || phoneNumber.length !== 13 || !phoneNumber.startsWith("+91")) {
      return res.status(400).json({ error: "Invalid phone number format." });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    // ✅ Find user
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(401).json({ error: "Invalid phone number or password." });
    }

    // ✅ Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid phone number or password." });
    }

    // ✅ Create JWT with username (LOGIN only!)
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,        // ✅ CRITICAL!
        phoneNumber: user.phoneNumber, 
        role: user.role 
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    console.log(`✅ Login successful: ${user.username}`);
    return res.status(200).json({ 
      message: "Login successful!", 
      token: token 
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ 
      error: "Server error, please try again later.",
      details: error.message 
    });
  }
});





/// fetching or getmethod
router.get("/getUser", async (req, res) => {
  const { phoneNumber } = req.query;
  try {
    const user = await User.findOne({ phoneNumber });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});


//workers profile creation
router.post("/workers", upload.single("image"), async (req, res) => {
  const { name, rating, profession } = req.body;

  if (!name || !rating || !profession) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  try {
    const newWorker = new Worker({
      name,
      rating,
      profession,
      image: req.file ? req.file.buffer.toString("base64") : "default-image.png",
    });

    await newWorker.save();
    res.status(201).json({ message: "Worker added successfully!", worker: newWorker });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error saving worker" });
  }
});
router.get("/workers", async (req, res) => {
    try {
        const workers = await Worker.find(); // Fetch all workers
        res.status(200).json(workers);
    } catch (error) {
        console.error("Error fetching workers:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});





////srevices adding 






router.post("/add", upload.none(), async (req, res) => {
  try {
    const newService = new Service(req.body);
    const savedService = await newService.save();
    res.status(201).json(savedService);
  } catch (error) {
    res.status(500).json({ error: "Error adding service", details: error.message });
  }
});

// GET /auth/service
// Supports filters: workerName, workDescription, workerCity, workerArea
router.get("/service", upload.none(), async (req, res) => {
  try {
    const { workerName, workDescription, workerCity, workerArea } = req.query;

    const query = {};

    if (workerName) {
      query.workerName = workerName;
    }

    if (workDescription) {
      query.workDescription = workDescription;
    }

    if (workerCity) {
      query.workerCity = workerCity;
    }

    // If workerArea is provided, filter by it.
    // If omitted, all areas in that city will be returned.
    if (workerArea) {
      query.workerArea = workerArea;
    }

    const services = await Service.find(query);

    if (!services.length) {
      return res.status(404).json({
        message: "No services found for given filters",
        filters: query
      });
    }

    return res.status(200).json(services);
  } catch (error) {
    res.status(500).json({
      error: "Error fetching services",
      details: error.message
    });
  }
});

// GET /auth/service/:id
router.get("/service/:id", upload.none(), async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ error: "Error fetching service", details: error.message });
  }
});

// PUT /auth/service/:id
router.put("/service/:id", upload.none(), async (req, res) => {
  try {
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedService) return res.status(404).json({ error: "Service not found" });
    res.status(200).json(updatedService);
  } catch (error) {
    res.status(500).json({ error: "Error updating service", details: error.message });
  }
});

// DELETE /auth/service/:id
router.delete("/service/:id", upload.none(), async (req, res) => {
  try {
    const deletedService = await Service.findByIdAndDelete(req.params.id);
    if (!deletedService) return res.status(404).json({ error: "Service not found" });
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting service", details: error.message });
  }
});


////







////// addressss



router.post("/addressadd", upload.none(), async (req, res) => {
  try {
    console.log("📥 Incoming Form-Data:", req.body);

    const newAddress = new Address({
      ...req.body,
      addressId: uuidv4(),
      userId: req.body.userId        // ✅ store signup user id
    });

    await newAddress.save();

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: newAddress
    });
  } catch (error) {
    console.error("❌ Error Adding Address:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add address"
    });
  }
});


// ✅ Get All Addresses
// ✅ Get All Addresses (optionally filtered by phoneNumber or workerName)
router.get('/address', upload.none(), async (req, res) => {
  try {
    const { phoneNumber, workerName } = req.query;

    const query = {};
    if (phoneNumber) query.phoneNumber = phoneNumber;
    if (workerName)  query.workerName  = workerName;

    const addresses = await Address.find(query);   // only Address, not Service
    res.json(addresses);
  } catch (error) {
    console.error('❌ Error Fetching Addresses:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

/// new one

// ✅ Get all addresses for a specific user (signup userId)
router.get("/address/by-user/:userId", async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.params.userId });
    return res.json(addresses);
  } catch (error) {
    console.error("❌ Error Fetching Addresses by user:", error);
    return res.status(500).json({ error: "Failed to fetch addresses" });
  }
});



// ✅ Get Address by addressId

router.get("/address/:addressId", async (req, res) => {
  try {
    const { addressId } = req.params;
    
    console.log(`🔍 Searching for address with addressId: ${addressId}`);
    
    const address = await Address.findOne({ addressId });
    
    if (!address) {
      console.log("❌ Address not found");
      return res.status(404).json({ 
        error: "Address not found",
        searchedAddressId: addressId
      });
    }
    
    console.log("✅ Found address:");
    console.log(`   - House: ${address.houseNumber}`);
    console.log(`   - City: ${address.city}`);
    console.log(`   - Phone: ${address.phoneNumber}`);
    
    return res.json(address);  // Return single object, not array
  } catch (error) {
    console.error("❌ Error Fetching Address by addressId:", error);
    return res.status(500).json({ 
      error: "Failed to fetch address",
      details: error.message 
    });
  }
});


// ✅ Update Address by addressId (PUT)
router.put("/address/:addressId", upload.none(), async (req, res) => {
    try {
        const updatedAddress = await Address.findOneAndUpdate(
            { addressId: req.params.addressId },
            req.body,
            { new: true }
        );
        if (!updatedAddress) return res.status(404).json({ error: "Address not found" });
        res.json({ message: "Address updated", data: updatedAddress });
    } catch (error) {
        console.error("❌ Error Updating Address:", error);
        res.status(500).json({ error: "Failed to update address" });
    }
});

// ✅ Delete Address by addressId (DELETE)
router.delete("/address/:addressId", async (req, res) => {
    try {
        const deletedAddress = await Address.findOneAndDelete({ addressId: req.params.addressId });
        if (!deletedAddress) return res.status(404).json({ error: "Address not found" });
        res.json({ message: "Address deleted", data: deletedAddress });
    } catch (error) {
        console.error("❌ Error Deleting Address:", error);
        res.status(500).json({ error: "Failed to delete address" });
    }
});








//updated bookingorder




// ✅ Create a booking
// POST /auth/bookings
router.post("/booking", async (req, res) => {
  try {
    const { bookingId, serviceId, addressId, date, time, userId } = req.body;

    if (!bookingId || !serviceId || !addressId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "bookingId, serviceId, addressId, date and time are required",
      });
    }

    const existing = await Booking.findOne({ bookingId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Booking with this bookingId already exists",
      });
    }

    const booking = await Booking.create({
      bookingId,
      serviceId,
      addressId,
      date,
      time,
      userId: userId || null,
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("❌ Error creating booking:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating booking",
      error: error.message,
    });
  }
});

// ✅ Get all bookings (simple)
router.get("/booking", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error("❌ Error fetching bookings:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bookings",
      error: error.message,
    });
  }
});

// ✅ Get full booking details by bookingId (with address + service)
router.get("/booking/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findOne({
      bookingId: req.params.bookingId,
    }).lean();

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Fetch related address & service in parallel
    const [address, service] = await Promise.all([
      // addressId is your own string id
      Address.findOne({ addressId: booking.addressId }).lean(),
      // serviceId is ALSO your own string id, so query by that field
      Service.findOne({ serviceId: booking.serviceId }).lean(),
    ]);

    return res.json({
      success: true,
      booking,
      address,
      service,
    });
  } catch (error) {
    console.error("❌ Error fetching booking:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching booking",
      error: error.message,
    });
  }
});


// ✅ Update booking status or fields
router.put("/booking/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.bookingId },
      req.body,
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, message: "Booking updated", booking });
  } catch (error) {
    console.error("❌ Error updating booking:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating booking",
      error: error.message,
    });
  }
});

// ✅ Delete booking
router.delete("/booking/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findOneAndDelete({
      bookingId: req.params.bookingId,
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, message: "Booking deleted" });
  } catch (error) {
    console.error("❌ Error deleting booking:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting booking",
      error: error.message,
    });
  }
});

////
// GET /auth/bookingtimeslot/full/:bookingId
router.get("/bookingtimeslot/full/:bookingId", async (req, res) => {
  try {
    const bookingId = req.params.bookingId;

    // 1) Find the time slot for this bookingId
    const slot = await BookingTimeSlot.findOne({ bookingId }).lean();
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found",
      });
    }

    // 2) Find the booking that owns this slot
    const booking = await Booking.findOne({ bookingId }).lean();
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 3) Fetch related address & service USING STRING IDS, NOT _id
    const [address, service] = await Promise.all([
      Address.findOne({ addressId: slot.addressId }).lean(),
      Service.findOne({ serviceId: booking.serviceId }).lean(),   // <‑‑ key change
    ]);

    return res.status(200).json({
      success: true,
      bookingTimeSlot: slot,
      booking,
      address,
      service,
    });
  } catch (error) {
    console.error("❌ Error fetching booking timeslot details:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching booking timeslot details",
      error: error.message,
    });
  }
});





 /// Booking Time Slot Routes

// POST /auth/bookingtimeslot
// Accepts: form-data (bookingId, date, time)


router.post('/bookingtimeslot', async (req, res) => {
  try {
    console.log('📥 Body received:', req.body);

    const { bookingId, date, time, addressId } = req.body;

    if (!bookingId || !date || !time || !addressId) {
      return res.status(400).json({
        success: false,
        message: 'bookingId, date, time and addressId are required',
      });
    }

    const existing = await BookingTimeSlot.findOne({ bookingId });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Time slot already saved",
        booking: existing,
      });
    }

    const booking = await BookingTimeSlot.create({ bookingId, date, time, addressId });

    return res.status(201).json({
      success: true,
      message: 'Time slot saved successfully',
      booking,
    });

  } catch (error) {
    console.error('❌ Error saving booking time slot:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while saving time slot',
      error: error.message,
    });
  }
});

/**
 * GET /auth/bookingtimeslot
 * Fetch all booking time slots
 */
router.get('/bookingtimeslot',upload.none(), async (req, res) => {
  try {
    const bookings = await BookingTimeSlot.find().sort({ createdAt: -1 });
    return res.json(bookings);
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    return res.status(500).json({
      message: 'Server error while fetching bookings',
      error: error.message,
    });
  }
});

/**
 * GET /auth/bookingtimeslot/:bookingId
 * Fetch booking by bookingId (not _id)
 */
router.get('/bookingtimeslot/:bookingId',upload.none(), async (req, res) => {
  try {
    const booking = await BookingTimeSlot.findOne({
      bookingId: req.params.bookingId,
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    return res.json(booking);
  } catch (error) {
    console.error('❌ Error fetching booking:', error);
    return res.status(500).json({
      message: 'Server error while fetching booking',
      error: error.message,
    });
  }
});

/**
 * PUT /auth/bookingtimeslot/:bookingId
 * Update date/time of a booking by bookingId
 * Accepts: form-data (date, time)
 */
/**
 * PUT /auth/bookingtimeslot/:bookingId/status
 * Update only the status of a booking (worker accept/decline)
 * Body (JSON or form-data): { status: "Confirmed" | "Cancelled" | "Completed" }
 */
router.put('/bookingtimeslot/:bookingId/status', upload.none(), async (req, res) => {
  try {
    const { status } = req.body;
    const { bookingId } = req.params;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    if (!["Pending", "Confirmed", "Cancelled", "Completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const updated = await BookingTimeSlot.findOneAndUpdate(
      { bookingId },
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    console.log(`✅ Booking ${bookingId} status updated to ${status}`);
    return res.json({
      success: true,
      message: 'Booking status updated successfully',
      booking: updated
    });
  } catch (error) {
    console.error('❌ Error updating booking status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating booking status',
      error: error.message
    });
  }
});


/**
 * DELETE /auth/bookingtimeslot/:bookingId
 * Delete booking by bookingId
 */
router.delete('/bookingtimeslot/:bookingId',upload.none(), async (req, res) => {
  try {
    const booking = await BookingTimeSlot.findOneAndDelete({
      bookingId: req.params.bookingId,
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    return res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting booking:', error);
    return res.status(500).json({
      message: 'Server error while deleting booking',
      error: error.message,
    });
  }
});
//// chat view

router.post('/chat', async (req, res) => {
  try {
    const { bookingId, senderName, senderRole, text } = req.body;

    if (!bookingId || !senderName || !senderRole || !text) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    if (!['Guest', 'Worker'].includes(senderRole)) {
      return res.status(400).json({ message: 'Invalid senderRole' });
    }

    const msg = await ChatMessage.create({
      bookingId,
      senderName,
      senderRole,
      text
    });

    return res.status(201).json(msg);
  } catch (err) {
    console.error('❌ Error saving chat message:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /auth/chat/:bookingId  -> all messages of conversation
router.get('/chat/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const messages = await ChatMessage
      .find({ bookingId })
      .sort({ createdAt: 1 }); // oldest first

    return res.json(messages);
  } catch (err) {
    console.error('❌ Error fetching chat messages:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});



module.exports = router;

