const express = require("express");
const bcrypt = require('bcrypt');
const app = express()
const mysql = require("mysql");
const dotenv = require('dotenv').config();
const PORT = process.env.PORT || 3001;
const pool = require("./dbPool.js");
const cors = require("cors");
const {encrypt, decrypt} = require("./encryptionHandler.js");
const session = require('express-session');
const saltRounds = 12;



// Middleware to parse JSON bodies
app.use(express.json());
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

app.get('/', (req,res) =>{
  res.send("hello world");
});

//handle the login for users
app.post("/login", async (req, res) => {
  const { email, masterPassword } = req.body;

  const sql = `SELECT *
  FROM users
  WHERE email = ?`;
const data = await executeSQL(sql, [email]);

if (data.length > 0) {
const passwordHash = data[0].password;
const email = data[0].email;
const user_id = data[0].id; // Make sure this is the correct column name in your database
const match = await bcrypt.compare(masterPassword, passwordHash);

if (match) {
req.session.authenticated = true;
req.session.user_id = user_id;
req.session.email = email;
req.session.masterPassword = passwordHash; // store masterPassword in the session

res.send({ authenticated: true, email: req.session.email, user_id: req.session.user_id});
} else {
console.log("not logged In :/");
res.send({ error: "not logged In :/" });
}
} else {
res.send({ error: "Invalid email or password" });
console.log("not logged In :/");
}
});
// handle signup
app.post("/signup", async (req, res) => {
  const {email, masterPassword } = req.body;

  // Check if the email is already being used
  const emailExists = await checkEmailExists(email);
  if (emailExists) {
    return res.status(400).json({ error: "Email already exit" });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(masterPassword, saltRounds);

  // Insert the user data into the database
  const insertQuery = "INSERT INTO users (email, password) VALUES (?, ?)";
  const params = [email, hashedPassword];

  try {
    await executeSQL(insertQuery, params);
    res.json({ message: "Registration successful" });
  } catch (error) {
    console.error("Error occurred during registration:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/addPassword", async (req, res) => {
  const { password, title } = req.body;

  // Retrieve the user's master password from the database
  const getUserIdQuery = "SELECT password FROM users WHERE id = ?";
  const user = await executeSQL(getUserIdQuery, [req.session.user_id]);

  if (user.length === 0) {
    return res.status(401).json({ error: "User not found" });
  }
  
  // Set the value for the master password
  const masterPassword = user[0].password;
  // if (masterPassword) {
  //   // If the master password was successfully retrieved, set it in the user's session data
  //   req.session.masterPassword = masterPassword;
  //   res.status(200).send('Login successful.');
  // } else {
  //   res.status(401).send('Invalid credentials.');
  // }

  try {
    // Encrypt the password using the master password
    const encryptedPassword = await encrypt(password, masterPassword);

    // Insert the encrypted password and website title into the database
    let sql = "INSERT INTO passwords (user_id, password, title, salt, iv) VALUES (?, ?, ?, ?, ?)";
    let params = [req.session.user_id, encryptedPassword.data, title, encryptedPassword.salt, encryptedPassword.iv];

    await executeSQL(sql, params);
    res.json({ message: "Password added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred when inserting the password." });
  }
});
//decrytion for the passwords..
app.post('/decryptPassword', async (req, res) => {
  const { password, iv, id } = req.body;
  const { user_id, masterPassword } = req.session;
  
  const getPasswordQuery = `
    SELECT password, salt, iv
    FROM passwords
    WHERE id = ? AND user_id = ?
  `;
  const passwordData = await executeSQL(getPasswordQuery, [id, user_id]);
  
  if (passwordData.length === 0) {
    return res.status(401).json({ error: "Password not found" });
  }

  const { salt, iv: passwordIv } = passwordData[0];
  
  try {
    const decryptedData = await decrypt({ data: password, salt, iv }, masterPassword);
    res.send(decryptedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred during password decryption.' });
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


// app.get("/getUserEmail", async (req, res) => {
//   const sql = `SELECT email FROM users WHERE id = ?`;
//   const [result] = await executeSQL(sql, [user_id]);

//   if (result) {
//     const email = result.email;
//     res.send({ email: email });
//   } else {
//     res.status(404).send({ error: "User not found" });
//   }
// });
// app.use((req, res, next) => {
//   console.log(req.session);
//   next();
// });


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
