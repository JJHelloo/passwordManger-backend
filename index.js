const express = require("express");
const app = express()
const mysql = require("mysql");
const PORT = 3001;
const pool = require("./dbPool.js"); 


app.get('/', (req,res) =>{
res.send("hello world");
}) ;



//sql function
async function executeSQL(sql, params) {
    return new Promise(function(resolve, reject) {
      pool.query(sql, params, function(err, rows, fields) {
        if (err) throw err;
        resolve(rows);
      });
    });
  }
// listen to the port
app.listen(PORT, ()=>{
    console.log("Server Started");
})