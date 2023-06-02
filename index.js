const express = require("express");
const app = express()
const mysql = require("mysql");
const PORT = 3001;
const pool = require("./dbPool.js");
const cors = require("cors");
const {encrypt, decrypt} = require("./encryptionHandler.js");


// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

app.get('/', (req,res) =>{
  res.send("hello world");
}) ;

app.post("/addPassword", async (req, res) => {
  const {password, title} = req.body;
  // says hashed but it is encrypted will be changed
  const hashedPassword = encrypt(password);

  let sql = "INSERT INTO passwords (password, title, iv) VALUES (?,?,?)";
  let params = [hashedPassword.password, title, hashedPassword.iv];
  try {
    rows = await executeSQL(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred when inserting the password.' });
  }
});

app.get("/showPasswords", async (req,res) => {
  let sql = `SELECT *
            FROM passwords`;
  let rows = await executeSQL(sql);
  try {
    rows = await executeSQL(sql);
    res.send(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred when seleting the password.' });
  }
});

app.post('/decryptPassword', async (req,res) => {
  res.send(decrypt(req.body));
})

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

// listen to the port
app.listen(PORT, ()=>{
    console.log("Server Started");
})
