const express = require("express");
const bcrypt = require('bcrypt');
const app = express();
const crypto = require('crypto');
const PORT = process.env.PORT || 3001;
const pool = require("./dbPool.js");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require('express-session');


// Middleware to parse JSON bodies
app.use(express.json());
// Configure specific security headers
app.use(helmet.hsts()); // Strict-Transport-Security (HSTS)
app.use(helmet.noSniff()); // X-Content-Type-Options
app.use(helmet.xssFilter()); // X-XSS-Protection
app.use(helmet.frameguard({ action: 'sameorigin' })); // X-Frame-Options
app.use(cors({
  origin: 'http://localhost:3000', // replace with your actual client URL
  credentials: true,
}));
// app.use(cors());
app.use(express.urlencoded({ extend: true }));

// Session configuration
app.set('trust proxy', 1) // trust first proxy 
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

//  rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 5 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use(limiter);

app.get('/', (req,res) =>{
  res.send("hello world");
});

// Generate a random encryption key
const generateEncryptionKey = () => {
  const key = crypto.randomBytes(32).toString('hex');
  return key;
};
//handle the login for users
app.post("/login", limiter, async (req, res) => {
  const { email, masterPassword } = req.body;
  // Input validation
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email format" });
  }
  if (!masterPassword || typeof masterPassword !== "string" || masterPassword.length < 10) {
    return res.status(400).json({ error: "Invalid master password" });
  }

  const sql = `SELECT *
  FROM users
  WHERE email = ?`;
const data = await executeSQL(sql, [email]);

if (data.length > 0) {
const passwordHash = data[0].password;
console.log("M ", masterPassword, " H", passwordHash);
const email = data[0].email;
const user_id = data[0].id; // Make sure this is the correct column name in your database
const match = await bcrypt.compare(masterPassword, passwordHash);

if (match) {
// Generate and store the encryption key associated with the user's session
const encryptionKey = generateEncryptionKey();
req.session.encryptionKey = encryptionKey;  
req.session.authenticated = true;
req.session.user_id = user_id;
req.session.email = email;
req.session.masterPassword = passwordHash; // store masterPassword in the session
res.send({ authenticated: true, email: req.session.email, user_id: req.session.user_id, 
  encryptionKey: encryptionKey });
} else {
res.send({ error: "Invalid email or password" });
}
} else {
res.send({ error: "Invalid email or password" });

}
});
// handle signup
app.post("/signup", async (req, res) => {
  const {email, masterPassword } = req.body;
  // input validation
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email format" });
  }
  if (!masterPassword || typeof masterPassword !== "string" || masterPassword.length < 10) {
    return res.status(400).json({ error: "Invalid master password" });
  }

  // Check if the email is already being used
  const emailExists = await checkEmailExists(email);
  if (emailExists) {
    return res.status(400).json({ error: "Email already exit" });
  }

  // Insert the user data into the database master password is already hased from the client end
  const insertQuery = "INSERT INTO users (email, password) VALUES (?, ?)";
  const params = [email, masterPassword];

  try {
    await executeSQL(insertQuery, params);
    res.json({ message: "Registration successful" });
  } catch (error) {
    console.error("Error occurred during registration:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// redone route to hopefully work with new client code..
app.post("/addPassword", async (req, res) => {
  const { password, title, iv, salt } = req.body;
  if (!password || typeof password !== "string" || !title || typeof title !== "string") {
    return res.status(400).json({ error: "Invalid password or title" });
  }
  try {
    // Insert the password and website title into the database
    let sql = "INSERT INTO passwords (user_id, password, title, salt, iv) VALUES (?, ?, ?, ?, ?)";
    const params = [req.session.user_id, password, title, salt, iv];

    await executeSQL(sql, params);
    res.json({ message: "Password added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred when inserting the password." });
  }
});
// show the title of the users website they have stored
app.get("/showPasswords", async (req, res) => {
  try {
    const sql = `SELECT * FROM passwords WHERE user_id = ?`;
    const params = [req.session.user_id];
    const data = await executeSQL(sql, params);
    res.send(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred when selecting the passwords.' });
  }
});

async function checkEmailExists(email) {
  const query = "SELECT COUNT(*) AS count FROM users WHERE email = ?";
  const params = [email];
  try {
    const result = await executeSQL(query, params);
    return result[0].count > 0;
  } catch (error) {
    console.error("Error occurred during email existence check:", error);
    throw new Error("Email existence check failed");
  }
}

app.get("/getUserEmail", async (req, res) => {
  if (req.session.user_id != null) {
    let emailQuery = `SELECT email
              FROM users 
              WHERE id = ?`;
    let rows = await executeSQL(emailQuery, [req.session.user_id]);
    if (rows.length > 0) {
      let email = rows[0].email;
      req.session.email = email;
      res.send({email: email});
    } else {
      res.send("No email found for this user_id");
    }
  } else {
    res.send("Session user_id is not set");
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if(err) {
      return console.log(err);
    }
    res.send("Logged out!");
  });
});

//sql function
async function executeSQL(sql, params) {
  return new Promise(function(resolve, reject) {
    pool.query(sql, params, function(err, rows, fields) {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}
app.get("/checkAuthentication", (req, res) => {
  if (req.session.authenticated === true) {
    // User is authenticated
    res.json({ authenticated: true });
  } else {
    // User is not authenticated
    res.json({ authenticated: false });
  }
});
// check if logged in middleware
function isLoggedIn(req, res, next) {
  if (req.session.authenticated) {
    next();
  } else {
    // res.redirect("");
  }
}
// listen to the port
app.listen(PORT, ()=>{
    console.log("Server Started");
})
