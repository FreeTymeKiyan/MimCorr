var _     = require("lodash");
var mysql = require("mysql");

var connection = mysql.createConnection({
  host     : "localhost",
  user     : "yangliu",
  database : "genes", 
  password : "FreeTymeKiyan"
});

var testUsrInputs = ["EIF4B", "hsa-miR-1304", "HEATR1", "OR5M8", "hsa-miR-659", "hsa-miR-133a-2"];
var testInput     = "EIF4B";
var nodes         = [];
var middle        = [];
var res = { nodes : [] };

connection.connect();

var isMiRna = function (name) {
  return name.indexOf("hsa") === 0;
};

var queryCorr = function (input, cb) {
  var temp = isMiRna(input);
  var sql = getSql(temp);
  // console.log(sql);
  var values = [];
  values.push(input);
  connection.query(sql, values, function (err, rows, fields) {
    var diff = _.difference(rows, middle);
    if (diff.length === 0) {
      cb(null);
      return;
    }
    middle = middle.concat(diff);
    console.log("=============================");
    console.log(middle.length);
    // _.forEach(diff, function (val, key) {
    //   console.log(key);
    //   queryCorr((temp ? val.mrna : val.mirna), callback);
    // });
    async.eachSeries(diff, function (row, callback) {
      queryCorr((temp ? row.mrna : row.mirna), callback);
    });
  });
}

var callback = function (err) {
  console.log("stop");   
};

function processRow(row, callback) {
  console.log(row);
  if (!_.includes(middle, row)) {
    middle.push(row);
  }
  callback();
}

function getSql(isMiRna) {
  return "SELECT mrna, mirna, corr, genes_db_num FROM correlation WHERE " 
    + (isMiRna ? "mirna = ?" : "mrna = ?") 
    + " AND genes_db_num != 0 AND corr != 1000000 ORDER BY corr ASC";
}

queryCorr(testInput, callback);

connection.end();
