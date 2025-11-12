// server.js — Full working version for EventSync
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

// ─────────────────────────────
// 🧩 Middleware Setup
// ─────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"], // adjust if needed
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

// ─────────────────────────────
// 🧩 MySQL Connection
// ─────────────────────────────
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

// ─────────────────────────────
// 🧠 AUTH: REGISTER
// ─────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  console.log("Register attempt:", req.body);

  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.json({ success: false, message: "Username, email, and password are required." });
    }

    // Check if user already exists
    const [existing] = await con
      .promise()
      .query("SELECT user_id FROM users WHERE email = ?", [email]);

    if (existing.length > 0) {
      return res.json({ success: false, message: "Email is already registered." });
    }

    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user including username
    const [result] = await con
      .promise()
      .query(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        [username, email, hashedPassword]
      );

    console.log("User registered:", result.insertId);

    res.json({ success: true, message: "Registration successful!" });
  } catch (err) {
    console.error("Error during registration:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error during registration." });
  }
});


// ─────────────────────────────
// 🧠 AUTH: LOGIN
// ─────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  console.log("Login attempt:", req.body);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Email and password are required." });
    }

    // Query for user by email
    const [rows] = await con
      .promise()
      .query("SELECT user_id, email, password_hash FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.json({ success: false, message: "Email is not registered." });
    }

    const user = rows[0];

    // Compare entered password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.json({ success: false, message: "Incorrect password." });
    }

    // Store session (no plain password)
    req.session.user = {
      id: user.user_id,
      email: user.email,
      loggedIn: true,
    };

    console.log("✅ User logged in:", req.session.user);

    res.json({
      success: true,
      message: "Login successful.",
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ success: false, message: "Server error during login." });
  }
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err)
      return res.status(500).json({ success: false, message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ success: true, message: "Logged out" });
  });
});

// Auth Status
app.get("/api/auth/status", (req, res) => {
  if (req.session.admin) {
    return res.json({ userLoggedIn: false, adminLoggedIn: true });
  }
  if (req.session.user) {
    return res.json({ userLoggedIn: true, adminLoggedIn: false });
  }
  res.json({ userLoggedIn: false, adminLoggedIn: false });
});

// ─────────────────────────────
// 🧠 ADMIN LOGIN
// ─────────────────────────────
app.post("/api/admin/login", (req, res) => {
  const { adminUsername, adminPassword } = req.body;

  if (
    adminUsername === process.env.ADMIN_USER ||
    adminUsername === "admin@example.com"
  ) {
    if (
      adminPassword === process.env.ADMIN_PASS ||
      adminPassword === "admin123"
    ) {
      req.session.admin = { username: adminUsername };
      return res.json({ success: true, message: "Admin login successful" });
    }
  }

  res.json({ success: false, message: "Invalid admin credentials" });
});

// ─────────────────────────────
// 🧠 USER PROFILE
// ─────────────────────────────
app.get("/api/user/profile", async (req, res) => {
  const user = req.session.user;

  if (!user) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

  try {
    const [rows] = await con
      .promise()
      .query(
        "SELECT user_id, username, email, created_at, updated_at FROM users WHERE user_id = ?",
        [user.id]
      );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const fullUser = rows[0];

    res.json({
      success: true,
      user: {
        id: fullUser.user_id,
        username: fullUser.username,
        email: fullUser.email,
        createdAt: fullUser.created_at,
        updatedAt: fullUser.updated_at,
      },
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─────────────────────────────
// 🧠 UPDATE USER PROFILE
// ─────────────────────────────
app.put("/api/user/update-profile", async (req, res) => {
  const user = req.session.user;

  if (!user) {
    return res.status(401).json({ success: false, message: "Not logged in." });
  }

  const { email, username } = req.body;

  if (!email || !username) {
    return res
      .status(400)
      .json({ success: false, message: "Email and username cannot be empty." });
  }

  try {
    // Check if email is already used by another user
    const [existing] = await con
      .promise()
      .query(
        "SELECT user_id FROM users WHERE email = ? AND user_id != ?",
        [email, user.id]
      );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Email is already in use." });
    }

    // Update user in database
    await con
      .promise()
      .query(
        "UPDATE users SET email = ?, username = ? WHERE user_id = ?",
        [email, username, user.id]
      );

    // Update session with new values
    req.session.user.email = email;
    req.session.user.username = username;

    res.json({ success: true, message: "Profile updated successfully!" });
  } catch (err) {
    console.error("Error updating profile:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error. Try again later." });
  }
});

// ─────────────────────────────
// 🧠 EVENTS ROUTES
// ─────────────────────────────

// Create Event
app.post("/api/events/create", (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ success: false, message: "Not logged in" });

  const { eventName, eventDate, eventTime, eventLocation, eventDescription, eventType } =
    req.body;

  const event = {
    title: eventName,
    date: eventDate,
    time: eventTime,
    location: eventLocation,
    description: eventDescription,
    is_public: eventType === "Public" ? 1 : 0,
    organizer_id: req.session.user.id,
  };

  con.query("INSERT INTO Events SET ?", event, (err) => {
    if (err) return res.status(500).json({ success: false, message: "DB error" });
    res.json({ success: true, message: "Event created successfully!" });
  });
});
// GET /api/stats — Returns total events and attendees
app.get("/api/stats", async (req, res) => {
  try {
    // Total events
    const [events] = await con.promise().query(
      "SELECT COUNT(*) AS totalEvents FROM Events"
    );

    // Total attendees across all events
    const [attendees] = await con.promise().query(
      "SELECT COUNT(*) AS totalAttendees FROM EventParticipants"
    );

    res.json({
      success: true,
      totalEvents: events[0].totalEvents,
      totalAttendees: attendees[0].totalAttendees,
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Join Event
// ─────────────────────────────
// 🧠 JOIN EVENT
// ─────────────────────────────
app.post("/api/events/join", async (req, res) => {
  console.log("Join attempt :",eventId);
  const { eventId, code } = req.body;
  const user = req.session.user;
  if (!user) {
    return res.status(401).json({ success: false, message: "Not logged in." });
  }

  try {
    // Check event exists
    const [events] = await con
      .promise()
      .query("SELECT * FROM events WHERE event_id = ?", [eventId]);

    if (events.length === 0) {
      return res.json({ success: false, message: "Event not found." });
    }

    const event = events[0];

    // Check private event code
    if (!event.is_public) {
      if (!code) {
        return res.json({ success: false, message: "Event code required." });
      }
      if (code !== event.code) {
        return res.json({ success: false, message: "Invalid event code." });
      }
    }

    // Check if already joined
    const [existing] = await con
      .promise()
      .query(
        "SELECT * FROM eventparticipants WHERE event_id = ? AND user_id = ?",
        [eventId, user.id]
      );

    if (existing.length > 0) {
      return res.json({ success: false, message: "Already registered for this event." });
    }

    // Add to participants
    await con
      .promise()
      .query(
        "INSERT INTO eventparticipants (event_id, user_id) VALUES (?, ?)",
        [eventId, user.id]
      );

    res.json({ success: true, message: "Successfully registered for this event!" });
  } catch (err) {
    console.error("Error joining event:", err);
    res.status(500).json({ success: false, message: "Server error joining event." });
  }
});


// Public Events
app.post("/api/events/public", (req, res) => {
  con.query("SELECT * FROM Events WHERE is_public = 1", (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "DB error" });
    res.json({ success: true, events: results });
  });
});

// User Dashboard Events
app.get("/api/events/user-dashboard", (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ success: false, message: "Not logged in" });

  const userId = req.session.user.id;

  const queries = [
    new Promise((resolve, reject) => {
      con.query("SELECT * FROM Events WHERE organizer_id = ?", [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    }),
    new Promise((resolve, reject) => {
      con.query(
        "SELECT e.* FROM Events e JOIN EventParticipants p ON e.event_id = p.event_id WHERE p.user_id = ?",
        [userId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    }),
  ];

  Promise.all(queries)
    .then(([createdEvents, joinedEvents]) => {
      res.json({ success: true, createdEvents, joinedEvents });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ success: false, message: "Error fetching dashboard data" });
    });
});

// ─────────────────────────────
// 🧠 CONTACT FORM — SAVE TO DATABASE
// ─────────────────────────────
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  try {
    // Save to contactmessages table
    await con
      .promise()
      .query(
        "INSERT INTO contactmessages (name, email, message) VALUES (?, ?, ?)",
        [name, email, message]
      );

    console.log("📩 Contact message saved from:", email);
    res.json({
      success: true,
      message: "Message received! We'll contact you soon.",
    });
  } catch (err) {
    console.error("Error saving contact message:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error saving message." });
  }
});

// ─────────────────────────────
// 🧠 GET EVENT BY ID
// ─────────────────────────────
app.get("/api/events/:id", async (req, res) => {
  const eventId = req.params.id;

  try {
    // Fetch event by ID
    const [events] = await con
      .promise()
      .query("SELECT * FROM Events WHERE event_id = ?", [eventId]);

    if (events.length === 0) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const event = events[0];

    // Fetch participants for this event
    const [participants] = await con
      .promise()
      .query(
        `SELECT u.user_id, u.email 
         FROM EventParticipants p 
         JOIN users u ON p.user_id = u.user_id 
         WHERE p.event_id = ?`,
        [eventId]
      );

    res.json({
      success: true,
      event,
      participants,
    });
  } catch (err) {
    console.error("Error fetching event:", err);
    res.status(500).json({ success: false, message: "Server error fetching event." });
  }
});

// ─────────────────────────────
// 🧠 STATIC FRONTEND + FALLBACK
// ─────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint not found" });
});

// ─────────────────────────────
// 🧠 START SERVER
// ─────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
