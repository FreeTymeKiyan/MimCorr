var fs = require("fs");

var d3 = require("d3");
var _  = require("lodash");
var async = require("async");

const TYPE_MIRNA = 1;
const TYPE_MRNA = 0 ;

var res = { nodes : [], links : [] };

var read = function (callback, type) {
  var filename = (type === 0 ? "mirna.csv" : "mrna.csv");
  fs.readFile("/Users/yongshengbai/Downloads/Data/MimCor/" + filename, "utf8", function (err, d) {
    if (err) throw err;
    var res = d3.csv.parse(d);
    _.map(res, function (n) {
      n.type = type;
    });
    // console.log(res[0]);
    callback(null, res);
  })
}

async.parallel([
  function (callback) {
    read(callback, TYPE_MRNA)
  },
  function (callback) {
    read(callback, TYPE_MIRNA)
  }
], function (err, res) {
  if (err) throw err;
  res.nodes = _.union(res[0], res[1]);
  console.log(res.nodes[0]);
});

// fs.readFile("/Users/yongshengbai/Downloads/Data/MimCor/refined.csv", "utf8", function (err, d) {
//   if (err) throw err;
//   var arr = d3.csv.parse(d);
//   console.log(arr.length);
// })
