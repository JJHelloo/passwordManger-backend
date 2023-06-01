const mysql = require('mysql');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: "root",
  database: "password-manager",
  // port: 3306 // Add this line if your MySQL server is running on a different port
});


module.exports = pool;
