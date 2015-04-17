var _     = require("lodash");
var mysql = require("mysql");
var async = require("async");
var fs    = require("fs");

const SQL = "SELECT * FROM corr_refined";

var conn = mysql.createConnection({
  host     : "localhost",
  user     : "yangliu",
  database : "genes", 
  password : "FreeTymeKiyan"
});

var res = { nodes : [], links : [] };

conn.connect();

conn.query(SQL, function (err, rows, fields) {
  var str = JSON.stringify(rows);
  fs.writeFile("./public/data/rows.json", str, function (err) {
    if (err) throw err;
    console.log("file is saved.");
  })
});

conn.end();
