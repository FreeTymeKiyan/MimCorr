var _     = require('lodash');
var mysql = require("mysql");

var connection = mysql.createConnection({
  host     : "localhost",
  user     : "yangliu",
  database : "genes", 
  password : "FreeTymeKiyan"
});

connection.connect();

var testUsrInputs = ["EIF4B", "hsa-miR-1304", "HEATR1", "OR5M8", "hsa-miR-659", "hsa-miR-133a-2"];
var testInput     = "EIF4B";
var nodes         = [];
var middle        = [];
var res = { nodes : [] };

var isMiRna = function (name) {
  return name.indexOf("hsa") === 0;
};

var queryCorr = function (input, cb) {
  var temp = isMiRna(input);
  var sql = "SELECT mrna, mirna, corr, genes_db_num FROM correlation WHERE " 
      + (temp ? "mirna = ?" : "mrna = ?") 
      + " AND genes_db_num != 0 AND corr != 1000000 ORDER BY corr ASC";
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
    _.forEach(diff, function (val, key) {
      console.log(key);
      queryCorr((temp ? val.mrna : val.mirna), callback);
    });
  });
}

var callback = function (err) {
    console.log("stop");   
};

queryCorr(testInput, callback);

// function asyncLoop(iterations, func, callback) {
//   var index = 0;
//   var done = false;
//   var loop = {
//     next: function() {
//       if (done) return;
//       if (index < iterations) {
//         index++;
//         func(loop);
//       } else {
//         done = true;
//         callback();
//       }
//     },
//
//     iteration: function() {
//       return index - 1;
//     },
//
//     break: function() {
//       done = true;
//       callback();
//     }
//
//   };
//   loop.next();
//   return loop;
// }

// _.forEach(testUsrInputs, function (val, key) {
//   var sql = "SELECT mrna, mirna, corr, genes_db_num FROM correlation WHERE " + (isMiRna(val) ? "mirna = ?" : "mrna = ?") + " AND genes_db_num != 0 AND corr != 1000000 ORDER BY corr ASC";
//   values = [];
//   values.push(val);
//   if (val === "hsa-miR-133a-2") {
//     console.log(sql);
//     console.log(values);
//   }
//   connection.query(sql, values, function (err, rows, fields) {
//     console.log(rows);
//   });
// })

connection.end();
