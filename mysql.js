var _     = require("lodash");
var mysql = require("mysql");
var async = require("async");

var connection = mysql.createConnection({
  host     : "localhost",
  user     : "yangliu",
  database : "genes", 
  password : "FreeTymeKiyan"
});

var testUsrInputs = ["EIF4B", "hsa-miR-1304", "HEATR1", "OR5M8", "hsa-miR-659", "hsa-miR-133a-2"];
var testInput     = "EIF4B";
var res = { nodes : [], links : [] };

connection.connect();

function isMiRna(name) {
  return name.indexOf("hsa") === 0;
};

function getSql(isMiRna) {
  return "SELECT mrna, mirna, corr, genes_db_num FROM correlation WHERE " 
    + (isMiRna ? "mirna = ?" : "mrna = ?") 
    + " AND genes_db_num != 0 AND corr != 1000000 ORDER BY corr ASC";
}

function getAjacent(row, isMiRna, cb) {
  var input = isMiRna ? row.mrna : row.mirna;
  var sql = getSql(isMiRna);
  var values = [];
  values.push(input);

  connection.query(sql, values, function (err, rows, fields) {
    if (err) cb(err);
    else {
      cb(null, rows);
    }
  });
}

var middle = [];
function search(row, isMiRna) {
  if (!row) return;
  middle.push(row);
  console.log(middle.length);
  getAjacent(row, isMiRna, function (err, rows) {
    _.forEach(rows, function (val) {
      if (!_.includes(res, row)) search(row, !isMiRna);
    })
  });
}

var root = {};
root.mrna = testInput;
search(root, false);

function getNextRows(rows, isMiRna, callback1) {
  var nextRows = [];

  async.each(rows, function (row, callback2) {
    var input = isMiRna ? row.mirna : row.mrna;
    var sql = getSql(isMiRna);
    var values = [];
    values.push(input);
    connection.query(sql, values, function (err, rows) {
      if (err) {
        callback2(err);
        return;
      }
      nextRows = nextRows.concat(rows);
      console.log(nextRows.length);
      callback2();
    });
  }, function (err) {
    if (err) {
      console.log(err);
      return;
    }
    callback1(null, nextRows);
  });
}

// connection.end();
