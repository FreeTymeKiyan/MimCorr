var mysql      = require("mysql");
var connection = mysql.createConnection({
  host     : "localhost",
  user     : "root",
  database : "test_genes"
});

connection.connect();

connection.query("SELECT * FROM correlation WHERE mirna = 'hsa-miR-1304'", function(err, rows, fields) {
  if (err) throw err;
  console.log(rows);
});

connection.query("SELECT DISTINCT mirna FROM correlation", function(err, rows, fields) {
  if (err) throw err;
  console.log(rows);
});

connection.end();
