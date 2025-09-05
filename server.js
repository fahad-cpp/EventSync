const express = require("express")
const path = require("path")
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const app = express()
require('dotenv').config();

const PORT = process.env.PORT || 3000
let userState = {
  loggedin:false,
  userid:null
};
// Middleware to parse JSON and URL-encoded data
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "public")))
let con = mysql.createConnection(
    {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    }
  );
con.connect(function(err){
  if(err){
    console.log("Failed to connect database");
  }
})

app.get("/admin", async (req,res) => {
  res.sendFile(__dirname + "/public/admin.html");
});
app.post("/api/admin/login", async (req,res) =>{
  console.log("Admin Login attempt:",req.body);
  const username = req.body.adminUsername;
  const password = req.body.adminPassword;

  const [rows] = await con.promise().query("SELECT * FROM ADMINS where username = ? AND password_hash = ?;",[username,password]);
  if(rows.length === 0){
    return res.json({success:false,message:"Invalid Credentials"});
  }
  res.json({success:true,message:"Admin Login Successful"});
})
app.post("/api/auth/login", async (req, res) => {
  console.log("Login attempt:", req.body);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Email and password are required." });
    }

    // Query for user by email only (safe placeholder)
    const [rows] = await con.promise().query(
      "SELECT user_id, email, password_hash FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: "Email is not registered" });
    }

    const user = rows[0];

    // Compare entered password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.json({ success: false, message: "Incorrect password" });
    }

    // Example of storing user session state — do NOT store raw password
    userState = { loggedin: true, userid: user.user_id };

    return res.json({ success: true, message: "Login successful" });

  } catch (err) {
    console.error("Error during login:", err);
    return res.json({ success: false, message: "Server error during login" });
  }
});


app.post("/api/auth/register", async (req, res) => {
  console.log("Register attempt:", req.body);

  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.json({ success: false, message: "Email and password are required." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if email is already registered
    const [rows] = await con.promise().query(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    if (rows.length > 0) {
      return res.json({ success: false, message: "Email is already registered." });
    }

    // Insert new user
    const [result] = await con.promise().query(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)",
      [email, hashedPassword]
    );

    console.log("Insert result:", result);
    return res.json({ success: true, message: "Registration successful!" });

  } catch (err) {
    console.error("Error during registration:", err);
    return res.json({ success: false, message: "Server error during registration." });
  }
});


app.post("/api/events/create", (req, res) => {
  if(!userState.loggedin){
    return res.json({success:false,message:"User is not logged in!"});;
  }
  console.log("Event creation request:", req.body)
  const {eventName,eventDate,eventTime,eventLocation,eventDescription,eventType} = req.body;
  console.log(eventName,eventDate,eventTime,eventLocation,eventDescription,eventType);
  let isPublic = (eventType === "Public");
  let sql = "INSERT INTO Events(organizer_id,title,description,location,date,time,is_public) values(?,?,?,?,?,?,?)";
  con.query(sql,[userState.userid,eventName,eventDescription,eventLocation,eventDate,eventTime,(isPublic?1:0)], (err,res) => {
    if(err)throw err;
    console.log(res);
  });
  res.json({ success: true, message: "Event created successfully!" })
})

app.post("/api/events/join", async (req, res) => {
  console.log("Event joining request:", req.body)
  if(!userState.loggedin){
    return res.json({success:false,message:"User is not logged in."});
  }
  res.json({ success: true, message: "Successfully joined event!" })
})
app.post("/api/events/public",async (req, res) => {
  const [rows] = await con.promise().query("SELECT event_id,title,date,location,description from Events where is_public = 1");
  const eventList = rows;
  res.json({success:true,message:"Successfully fetched public events",events:eventList})
})
app.post("/api/events/:id", async (req,res) => {
  const eventId = req.params.id;
  const bodyData = req.body;
  console.log("Event id:",eventId);
  console.log("Body:",bodyData);
  const [event] = await con.promise().query("SELECT title,date,time,location,description from Events where event_id = ?",[eventId]);
  res.json({success:true,message : "Successfully fetched event details",event:event});
});

app.post("/api/contact", async (req, res) => {
  console.log("Contact form submission:", req.body)
  if(!userState.loggedin){
    return res.json({success:false,message:"User is not logged in"});
  }
  const name = req.body.name;
  const email = req.body.email;
  const msg = req.body.message;
  let sql = "INSERT INTO ContactMessages(user_id,name,email,message) values(?,?,?,?)";
  await con.promise().query(sql,[userState.userid,name,email,msg]);
  res.json({ success: true, message: "Message sent successfully!" })
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
