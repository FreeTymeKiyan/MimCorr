var fs = require("fs");

var d3 = require("d3");
var _  = require("lodash");
var async = require("async");

const TYPE_MIRNA = 1;
const TYPE_MRNA = 0 ;

var data = { "nodes" : [], "links" : [] };

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
  },
  function (callback) {
    fs.readFile("/Users/yongshengbai/Downloads/Data/MimCor/refined_10000.csv", "utf8", function (err, d) {
      if (err) throw err;
      var res = d3.csv.parse(d);
      // console.log(res[0]);
      callback(null, res);
    });
  }
], function (err, res) {
  if (err) throw err;
  data.nodes = _.union(res[0], res[1]);
  data.links = res[2];
  // console.log(res.nodes[0]);
  // console.log(res.links);
  fs.writeFile("/Users/yongshengbai/Downloads/Data/MimCor/graph.json", JSON.stringify(data, null, 2), function () {
    console.log("Data saved to file");
  });
  // TODO start to render graph
  // renderGraph(res);
});

var renderGraph = function (links) {
  var width = 960;
  var height = 500;

  var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

  var force = d3.layout.force()
    .size([width, height]);

  var nodesByName = {};

  links.forEach(function (link) {
    link.source = nodeByName(link.source);
    link.target = nodeByName(link.target);
  });

  var nodes = res.nodes;
  var link = svg.selectAll(".link")
      .data(links)
    .enter().append("line")
      .attr("class", "link");

  var node = svg.selectAll(".node")
      .data(nodes)
    .enter().append("circle")
      .attr("class", "node")
      .attr("r", 4.5)
      .call(force.drag);
      
  force
      .nodes(nodes)
      .links(links)
      .on("tick", tick)
      .start();
  
  function tick() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  }
  
  function nodeByName(name) {
    return nodesByName[name] || (nodesByName[name] = {name: name});
  }
};
