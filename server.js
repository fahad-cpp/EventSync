import express from "express";
import session from "express-session";
import path from "path";
import mysql from "mysql2";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";

dotenv.config();
const app = express();
const __dirname = path.resolve();

// Middleware Setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 },
  })
);

// MySQL Connection
const con = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "eventsync",
});

con.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection error:", err);
  } else {
    console.log("✅ Connected to MySQL database");
  }
});

// ═══════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, fullName, phone } = req.body;

    if (!username || !email || !password) {
      return res.json({ success: false, message: "Username, email, and password are required." });
    }

    const [existing] = await con
      .promise()
      .query("SELECT user_id FROM users WHERE email = ?", [email]);

    if (existing.length > 0) {
      return res.json({ success: false, message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await con
      .promise()
      .query(
        "INSERT INTO users (username, email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?, 'user')",
        [username, email, hashedPassword, fullName || username, phone || ""]
      );

    res.json({ success: true, message: "Registration successful! Please login." });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ success: false, message: "Server error during registration." });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Email and password are required." });
    }

    const [rows] = await con
      .promise()
      .query("SELECT user_id, email, password_hash, role, username FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.json({ success: false, message: "Email not registered." });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.json({ success: false, message: "Incorrect password." });
    }

    req.session.user = {
      id: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role,
      loggedIn: true,
    };

    res.json({
      success: true,
      message: "Login successful.",
      user: req.session.user,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error during login." });
  }
});

// Admin Login
app.post("/api/auth/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Email and password are required." });
    }

    const [rows] = await con
      .promise()
      .query("SELECT user_id, email, password_hash, role, username FROM users WHERE email = ? AND role = 'admin'", [email]);

    if (rows.length === 0) {
      return res.json({ success: false, message: "Admin not found." });
    }

    const admin = rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
      return res.json({ success: false, message: "Incorrect password." });
    }

    req.session.user = {
      id: admin.user_id,
      email: admin.email,
      username: admin.username,
      role: admin.role,
      loggedIn: true,
    };

    res.json({
      success: true,
      message: "Admin login successful.",
      user: req.session.user,
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ success: false, message: "Server error during login." });
  }
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ success: false, message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ success: true, message: "Logged out" });
  });
});

// Auth Status
app.get("/api/auth/status", (req, res) => {
  if (req.session.user) {
    return res.json({
      loggedIn: true,
      isAdmin: req.session.user.role === "admin",
      user: req.session.user,
    });
  }
  res.json({ loggedIn: false, isAdmin: false });
});

// ═══════════════════════════════════════════════════════════
// VENUE ROUTES
// ═══════════════════════════════════════════════════════════

// Get all venues
app.get("/api/venues", async (req, res) => {
  try {
    const [venues] = await con
      .promise()
      .query("SELECT * FROM venues WHERE status = 'active' ORDER BY created_at DESC");

    res.json({ success: true, venues });
  } catch (err) {
    console.error("Error fetching venues:", err);
    res.status(500).json({ success: false, message: "Error fetching venues." });
  }
});

// Get venue by ID
app.get("/api/venues/:id", async (req, res) => {
  try {
    const [venues] = await con
      .promise()
      .query(
        "SELECT v.*, u.full_name, u.phone, u.email FROM venues v JOIN users u ON v.owner_id = u.user_id WHERE v.venue_id = ?",
        [req.params.id]
      );

    if (venues.length === 0) {
      return res.status(404).json({ success: false, message: "Venue not found." });
    }

    res.json({ success: true, venue: venues[0] });
  } catch (err) {
    console.error("Error fetching venue:", err);
    res.status(500).json({ success: false, message: "Error fetching venue." });
  }
});

// Create venue (admin only)
app.post("/api/venues/create", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  try {
    const { venueName, location, city, state, zipCode, description, capacity, pricePerEvent, amenities, contactName, contactPhone, contactEmail, bookingAdvanceDays, images_url } = req.body;

    if (!venueName || !location || !capacity || !pricePerEvent) {
      return res.json({ success: false, message: "Required fields missing." });
    }

    await con.promise().query(
      "INSERT INTO venues (venue_name, owner_id, location, city, state, zip_code, description, capacity, price_per_event, amenities, contact_name, contact_phone, contact_email, booking_advance_days, images_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')",
      [venueName, req.session.user.id, location, city, state, zipCode, description, capacity, pricePerEvent, amenities, contactName, contactPhone, contactEmail, bookingAdvanceDays || 30, images_url || null]
    );

    res.json({ success: true, message: "Venue created successfully." });
  } catch (err) {
    console.error("Error creating venue:", err);
    res.status(500).json({ success: false, message: "Error creating venue." });
  }
});

// Update venue (admin only)
app.put("/api/venues/:id", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  try {
    const { venueName, location, city, state, zipCode, description, capacity, pricePerEvent, amenities, contactName, contactPhone, contactEmail, bookingAdvanceDays, images_url } = req.body;

    if (images_url) {
      await con.promise().query(
        "UPDATE venues SET venue_name = ?, location = ?, city = ?, state = ?, zip_code = ?, description = ?, capacity = ?, price_per_event = ?, amenities = ?, contact_name = ?, contact_phone = ?, contact_email = ?, booking_advance_days = ?, images_url = ? WHERE venue_id = ?",
        [venueName, location, city, state, zipCode, description, capacity, pricePerEvent, amenities, contactName, contactPhone, contactEmail, bookingAdvanceDays || 30, images_url, req.params.id]
      );
    } else {
      await con.promise().query(
        "UPDATE venues SET venue_name = ?, location = ?, city = ?, state = ?, zip_code = ?, description = ?, capacity = ?, price_per_event = ?, amenities = ?, contact_name = ?, contact_phone = ?, contact_email = ?, booking_advance_days = ? WHERE venue_id = ?",
        [venueName, location, city, state, zipCode, description, capacity, pricePerEvent, amenities, contactName, contactPhone, contactEmail, bookingAdvanceDays || 30, req.params.id]
      );
    }

    res.json({ success: true, message: "Venue updated successfully." });
  } catch (err) {
    console.error("Error updating venue:", err);
    res.status(500).json({ success: false, message: "Error updating venue." });
  }
});

// Delete venue (admin only)
app.delete("/api/venues/:id", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  try {
    await con.promise().query("DELETE FROM venues WHERE venue_id = ?", [req.params.id]);
    res.json({ success: true, message: "Venue deleted successfully." });
  } catch (err) {
    console.error("Error deleting venue:", err);
    res.status(500).json({ success: false, message: "Error deleting venue." });
  }
});

// ═══════════════════════════════════════════════════════════
// BOOKING ROUTES
// ═══════════════════════════════════════════════════════════

// Create booking
app.post("/api/bookings/create", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Not logged in." });
  }

  try {
    const { venueId, eventType, eventDate, eventTime, guestCount, specialRequests } = req.body;

    if (!venueId || !eventType || !eventDate || !eventTime || !guestCount) {
      return res.json({ success: false, message: "Required fields missing." });
    }

    if (eventType !== "wedding" && eventType !== "birthday") {
      return res.json({ success: false, message: "Invalid event type. Only wedding or birthday allowed." });
    }

    // Get venue details
    const [venues] = await con
      .promise()
      .query("SELECT * FROM venues WHERE venue_id = ?", [venueId]);

    if (venues.length === 0) {
      return res.json({ success: false, message: "Venue not found." });
    }

    const venue = venues[0];

    // Check capacity
    if (guestCount > venue.capacity) {
      return res.json({ success: false, message: `Venue capacity is ${venue.capacity} guests.` });
    }

    // Check booking advance
    const bookingDate = new Date(eventDate);
    const today = new Date();
    const daysAhead = Math.floor((bookingDate - today) / (1000 * 60 * 60 * 24));

    if (daysAhead < venue.booking_advance_days) {
      return res.json({ success: false, message: `Minimum ${venue.booking_advance_days} days advance booking required.` });
    }

    // Check date conflict
    const [conflicts] = await con
      .promise()
      .query(
        "SELECT * FROM bookings WHERE venue_id = ? AND event_date = ? AND booking_status IN ('confirmed', 'pending')",
        [venueId, eventDate]
      );

    if (conflicts.length > 0) {
      return res.json({ success: false, message: "Date not available for this venue." });
    }

    // Create booking
    const totalAmount = venue.price_per_event;

    const [result] = await con
      .promise()
      .query(
        "INSERT INTO bookings (user_id, venue_id, event_type, event_date, event_time, guest_count, special_requests, total_amount, booking_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
        [req.session.user.id, venueId, eventType, eventDate, eventTime, guestCount, specialRequests || "", totalAmount]
      );

    res.json({
      success: true,
      message: "Booking created. Proceed to payment.",
      bookingId: result.insertId,
      totalAmount,
    });
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ success: false, message: "Error creating booking." });
  }
});

// Get user bookings
app.get("/api/bookings/user", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Not logged in." });
  }

  try {
    const [bookings] = await con
      .promise()
      .query(
        "SELECT b.*, v.venue_name, v.location, v.contact_name FROM bookings b JOIN venues v ON b.venue_id = v.venue_id WHERE b.user_id = ? ORDER BY b.event_date DESC",
        [req.session.user.id]
      );

    res.json({ success: true, bookings });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ success: false, message: "Error fetching bookings." });
  }
});

// Cancel booking
app.put("/api/bookings/:id/cancel", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Not logged in." });
  }

  try {
    const [bookings] = await con
      .promise()
      .query("SELECT * FROM bookings WHERE booking_id = ?", [req.params.id]);

    if (bookings.length === 0) {
      return res.json({ success: false, message: "Booking not found." });
    }

    const booking = bookings[0];

    // Check authorization
    if (booking.user_id !== req.session.user.id && req.session.user.role !== "admin") {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    await con
      .promise()
      .query("UPDATE bookings SET booking_status = 'cancelled' WHERE booking_id = ?", [req.params.id]);

    res.json({ success: true, message: "Booking cancelled successfully." });
  } catch (err) {
    console.error("Error cancelling booking:", err);
    res.status(500).json({ success: false, message: "Error cancelling booking." });
  }
});

// Confirm booking (admin only)
app.put("/api/bookings/:id/confirm", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  try {
    const [bookings] = await con
      .promise()
      .query("SELECT * FROM bookings WHERE booking_id = ?", [req.params.id]);

    if (bookings.length === 0) {
      return res.json({ success: false, message: "Booking not found." });
    }

    await con
      .promise()
      .query("UPDATE bookings SET booking_status = 'confirmed' WHERE booking_id = ?", [req.params.id]);

    res.json({ success: true, message: "Booking confirmed successfully." });
  } catch (err) {
    console.error("Error confirming booking:", err);
    res.status(500).json({ success: false, message: "Error confirming booking." });
  }
});

// ═══════════════════════════════════════════════════════════
// PAYMENT ROUTES
// ═══════════════════════════════════════════════════════════

// Create payment
app.post("/api/payments/create", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Not logged in." });
  }

  try {
    const { bookingId, paymentMethod } = req.body;

    if (!bookingId || !paymentMethod) {
      return res.json({ success: false, message: "Booking ID and payment method required." });
    }

    // Get booking details
    const [bookings] = await con
      .promise()
      .query("SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?", [bookingId, req.session.user.id]);

    if (bookings.length === 0) {
      return res.json({ success: false, message: "Booking not found." });
    }

    const booking = bookings[0];

    // Create payment record
    await con
      .promise()
      .query(
        "INSERT INTO payments (booking_id, payment_method, amount, payment_status) VALUES (?, ?, ?, 'completed')",
        [bookingId, paymentMethod, booking.total_amount]
      );

    // Update booking status to confirmed
    await con
      .promise()
      .query("UPDATE bookings SET booking_status = 'confirmed' WHERE booking_id = ?", [bookingId]);

    res.json({ success: true, message: "Payment successful. Booking confirmed." });
  } catch (err) {
    console.error("Error creating payment:", err);
    res.status(500).json({ success: false, message: "Error processing payment." });
  }
});

// ═══════════════════════════════════════════════════════════
// USER PROFILE ROUTES
// ═══════════════════════════════════════════════════════════

// Get user profile
app.get("/api/user/profile", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

  try {
    const [rows] = await con
      .promise()
      .query("SELECT user_id, username, email, full_name, phone, address, created_at FROM users WHERE user_id = ?", [req.session.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Update user profile
app.put("/api/user/update-profile", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Not logged in." });
  }

  try {
    const { email, username, fullName, phone, address } = req.body;

    // Check if email is unique
    const [existing] = await con
      .promise()
      .query("SELECT user_id FROM users WHERE email = ? AND user_id != ?", [email, req.session.user.id]);

    if (existing.length > 0) {
      return res.json({ success: false, message: "Email already in use." });
    }

    await con
      .promise()
      .query(
        "UPDATE users SET email = ?, username = ?, full_name = ?, phone = ?, address = ? WHERE user_id = ?",
        [email, username, fullName || "", phone || "", address || "", req.session.user.id]
      );

    req.session.user.email = email;
    req.session.user.username = username;

    res.json({ success: true, message: "Profile updated successfully!" });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════════════════════

// Get all users (admin only)
app.get("/api/admin/users", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  try {
    const [users] = await con
      .promise()
      .query("SELECT user_id, username, email, full_name, phone, role, created_at FROM users ORDER BY created_at DESC");

    res.json({ success: true, users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Error fetching users." });
  }
});

// Get all bookings (admin only)
app.get("/api/admin/bookings", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  try {
    const [bookings] = await con
      .promise()
      .query(
        "SELECT b.*, v.venue_name, u.username, u.email FROM bookings b JOIN venues v ON b.venue_id = v.venue_id JOIN users u ON b.user_id = u.user_id ORDER BY b.created_at DESC"
      );

    res.json({ success: true, bookings });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ success: false, message: "Error fetching bookings." });
  }
});

// Get analytics/report (admin only)
app.get("/api/admin/reports", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  try {
    const [totalVenues] = await con.promise().query("SELECT COUNT(*) as count FROM venues");
    const [totalUsers] = await con.promise().query("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
    const [totalBookings] = await con.promise().query("SELECT COUNT(*) as count FROM bookings");
    const [confirmedBookings] = await con.promise().query("SELECT COUNT(*) as count FROM bookings WHERE booking_status = 'confirmed'");
    const [totalRevenue] = await con.promise().query("SELECT SUM(total_amount) as total FROM bookings WHERE booking_status = 'confirmed'");

    res.json({
      success: true,
      stats: {
        totalVenues: totalVenues[0].count,
        totalUsers: totalUsers[0].count,
        totalBookings: totalBookings[0].count,
        confirmedBookings: confirmedBookings[0].count,
        totalRevenue: totalRevenue[0].total || 0,
      },
    });
  } catch (err) {
    console.error("Error fetching reports:", err);
    res.status(500).json({ success: false, message: "Error fetching reports." });
  }
});

// Delete user (admin only)
app.delete("/api/admin/users/:id", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  try {
    const userId = req.params.id;

    if (userId == req.session.user.id) {
      return res.json({ success: false, message: "Cannot delete your own account." });
    }

    await con.promise().query("DELETE FROM users WHERE user_id = ? AND role = 'user'", [userId]);

    res.json({ success: true, message: "User deleted successfully." });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ success: false, message: "Error deleting user." });
  }
});

// ═══════════════════════════════════════════════════════════
// STATS ENDPOINT (for homepage)
// ═══════════════════════════════════════════════════════════

app.get("/api/stats", async (req, res) => {
  try {
    const [venues] = await con.promise().query("SELECT COUNT(*) as count FROM venues WHERE status = 'active'");
    const [bookings] = await con.promise().query("SELECT COUNT(*) as count FROM bookings WHERE booking_status IN ('confirmed', 'pending')");
    const [users] = await con.promise().query("SELECT COUNT(*) as count FROM users WHERE role = 'user'");

    res.json({
      success: true,
      totalVenues: venues[0].count,
      totalBookings: bookings[0].count,
      totalUsers: users[0].count,
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.json({
      success: true,
      totalVenues: 0,
      totalBookings: 0,
      totalUsers: 0,
    });
  }
});

// ═══════════════════════════════════════════════════════════
// STATIC FILES
// ═══════════════════════════════════════════════════════════

app.use(express.static(path.join(__dirname, "public")));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
