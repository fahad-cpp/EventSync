const express = require("express")
const path = require("path")
const mysql = require('mysql2');
const app = express()
const PORT = process.env.PORT || 3000
require('dotenv').config();
// Middleware to parse JSON and URL-encoded data
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
let con = mysql.createConnection(
    {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    }
  );
  con.connect(function(err){
    if(err) throw err;
    let sql = "SELECT * from users";
    con.query(sql,function(err , result){
      if(err) throw err;
      console.log(result);
    })
  })
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")))

// Basic API routes (for demonstration purposes)
app.post("/api/auth/login", (req, res) => {
  console.log("Login attempt:", req.body)
  // In a real app, you'd validate credentials against a database
  if (req.body.email === "user@example.com" && req.body.password === "password") {
    res.json({ success: true, message: "Login successful!" })
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials." })
  }
})

app.post("/api/auth/register", (req, res) => {
  console.log("Register attempt:", req.body)
  // In a real app, you'd save the new user to a database
  res.json({ success: true, message: "Registration successful!" })
})

app.post("/api/events/create", (req, res) => {
  console.log("Event creation request:", req.body)
  // In a real app, you'd save the event to a database
  res.json({ success: true, message: "Event created successfully!" })
})

app.post("/api/events/join", (req, res) => {
  console.log("Event joining request:", req.body)
  // In a real app, you'd associate the user with the event
  res.json({ success: true, message: "Successfully joined event!" })
})

app.post("/api/contact", (req, res) => {
  console.log("Contact form submission:", req.body)
  // In a real app, you'd send an email or save to a CRM
  res.json({ success: true, message: "Message sent successfully!" })
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
