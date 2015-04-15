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

var temp = isMiRna(testInput);
var sql = getSql(temp);
var values = [];
values.push(input);

connection.query(sql, values, function (err, rows, fields) {
  
  
});

function processRow(row, is, callback) {
  var sql = getSql(is);
  var values = [];
  values.push((is ? row.mrna : row.mirna));=
  connection.query(sql, values, function (err, rows, fields) {
    async.each(rows, processRow, function (err) {
      if (err) console.log(err);
    });
  });
}

function getNextRows(rows, isMiRna, callback1) {
  var nextRows = [];
  async.each(rows, function (row, callback2) {
    var input = isMiRna ? row.mrna : row.mirna;
    var sql = getSql(isMiRna);
    var values = [];
    values.push(input);
    connection.query(sql, values, function (err, rows) {
      if (err) {
        callback2(err);
        return;
      }
      callback2(null, rows);
    });
  }, function (err, rows) {
    console.log(callback2);
    if (err) {
      console.log(err);
      return;
    }
    nextRows = nextRows.concat(rows);
    callback1(null, nextRows);
  });
}


// ====

// var diff   = [];
// var middle = [];
//
// var t = {
//   mrna : testInput
// };
// diff.push(t);
//

//
// var queryCorr = function (input, cb) {
//   var temp = isMiRna(input);
//   var sql = getSql(temp);
//   // console.log(sql);
//   var values = [];
//   values.push(input);
//   connection.query(sql, values, function (err, rows, fields) {
//     diff = _.difference(rows, middle);
//     middle = middle.concat(diff);
//   });
// };
var queryCorrWithRow = function (row, isMiRna, cb) {
  var input = isMiRna ? row.mirna : row.mrna;
  var sql = getSql(isMiRna);
  // console.log(sql);
  var values = [];
  values.push(input);
  connection.query(sql, values, function (err, rows, fields) {
    if (err) {
      cb(err);
    }
    // get more rows from rows
    var diff = _.difference(rows, middle);
    if (diff.length === 0) {
      cb(null, diff);
    }
  });
};

var callback = function (err, res) {
  if (err) {
    console.log(err);
    return;
  }
  return res;
}

var test = function () { // continue when true
  return diff.length !== 0; // diff len of middle and rows is not 0
};

async.whilst(
  test,
  queryCorrWithRow(), // query diff for rows
  callback
);
// async.whilst(
//   test,
//   aysnc.each(diff, queryCorr, callback), // query diff for rows
//   callback
// );
//
// queryCorr(testInput, callback);
//
// connection.end();

async = require("async");
  
async.each(
  rows,
  function(item, callback){
    // Call an asynchronous function, often a save() to DB
    item.someAsyncCall(function (){
      // Async call is done, alert via callback
      callback();
    });
  },
  // 3rd param is the function to call when everything's done
  function(err){
    // All tasks are done now
    doSomethingOnceAllAreDone();
  }
);
