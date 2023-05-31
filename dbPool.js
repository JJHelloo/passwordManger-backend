const mysql = require('mysql');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: "root",
  user: "localhost",
  password: "root",
  database: "password-manager"
});

module.exports = pool;