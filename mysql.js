var _     = require('lodash');
var mysql = require("mysql");

var connection = mysql.createConnection({
  host     : "localhost",
  user     : "root",
  database : "test_genes"
});

connection.connect();

var testUsrInput = ["EIF4B", "hsa-miR-1304", "HEATR1", "OR5M8", "hsa-miR-659", "hsa-miR-133a-2"];
var values = [];
var nodes = [];

var isMiRna = function (name) {
  return name.indexOf("hsa") === 0;
};

_.forEach(testUsrInput, function (val, key) {
  var sql = "SELECT mrna, mirna, corr, genes_db_num FROM correlation WHERE " + (isMiRna(val) ? "mirna = ?" : "mrna = ?") + " AND genes_db_num != 0 AND corr != 1000000 ORDER BY corr ASC";
  values = [];
  values.push(val);
  if (val === "hsa-miR-133a-2") {
    console.log(sql);
    console.log(values);
  }
  connection.query(sql, values, function (err, rows, fields) {
    console.log(rows);
  });
})

connection.end();
