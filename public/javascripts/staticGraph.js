// var width = 960,
//     height = 500;
var width = 1280,
    height = 680;
    
var xScale = d3.scale.linear()
    .domain([0, width]).range([0, width]);
var yScale = d3.scale.linear()
    .domain([0, height]).range([0, height]);
    
var zoomer = d3.behavior.zoom()
    .scaleExtent([0.1,10])
    .x(xScale)
    .y(yScale)
    .on("zoomstart", zoomstart)
    .on("zoom", redraw);

function zoomstart() {
  
}

function redraw() {
  vis.attr("transform",
   "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
}

var c1 = d3.rgb("lightgreen");
var c2 = d3.rgb("lightskyblue");
var red = d3.rgb("red");
var grey = d3.rgb("grey");

var svg = d3.select("body").append("svg") // set svg
    .attr("width", width)
    .attr("height", height);
    
var svg_graph = svg.append('svg:g')
    .call(zoomer);
    
var vis = svg_graph.append("svg:g");
vis.attr('fill', 'red')
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .attr('opacity', 0.5)
    .attr('id', 'vis')

d3.json("../data/graph_1000.json", function(error, graph) { // add data 
  
  var links = vis.selectAll(".link").data(graph.links); // draw link
  links.enter().append("line")
      .attr("class", "link")
      .style("stroke", function(d) {
        return (d.corr >= 0 ? red : grey);
      })
      .style("stroke-width", function(d) { return 5;  }) // 100 * Math.abs(d.corr)
      .style("stroke-dasharray", function (d) { // set dashed-line
        if (d.type % 3 == 0) return ("2, 2");
        else if (d.type % 3 == 1) return ("10, 10");
      });

  var nodes = vis.selectAll(".node").data(graph.nodes); // draw node
  nodes.enter().append("path") // set shape
      .attr("class", "node")
      .attr("d", d3.svg.symbol()
        .type(function(d) { // set shape type
          if (d.type % 2) return d3.svg.symbolTypes[0];
          return d3.svg.symbolTypes[3];
        })
        .size(function(d) { // set shape size
          return 50; // d.expr / 1000
        })
      )
      .style("fill", function(d) { // d.expr
        if (d.type % 2 == 0) return c1;
        return c2;
      }); // add drag

  nodes.append("title") // set title
      .text(function(d) { return d.id || d.gene; });
      
  var nodesByName = {};
  
  nodes.each(function (d) {
    if (d.id) {
      nodesByName[d.id] = d;
    } else {
      nodesByName[d.gene] = d;
    }
  });

  links.each(function (link) {
    link.source = nodeByName(link.source);
    link.target = nodeByName(link.target);
    
    
    if (!link.source.links) link.source.links = [];
    link.source.links.push(link.target);
    if (!link.target.links) link.target.links = [];
    link.target.links.push(link.source);
  });
  
  var setPosition = function(node, i) {
    if (node.type === 0) { // mirna
      node.x = i * 10;
      node.y = height * 2 / 3;
    } else { // mrna
      node.x = (i - 1046) * 10;
      node.y = height / 3;
    }
  };
  nodes.each(setPosition);
  
  nodes.attr("transform", function (d) {
    return "translate(" + d.x + ", " + d.y + ")";
  });
  links.attr("x1", function (d) {
    return d.source.x;
  }).attr("y1", function (d) {
    return d.source.y;
  }).attr("x2", function (d) {
    return d.target.x;
  }).attr("y2", function (d) {
    return d.target.y;
  })
  
  function nodeByName(name) {
    if (nodesByName[name]) return nodesByName[name];
    // search in graph.nodes array
    var node = _.find(graph.nodes, function(chr) {
      name = name.toLowerCase();
      if (chr.id) return _.startsWith(chr.id.toLowerCase(), name);
      return _.startsWith(chr.gene.toLowerCase(), name);
    });
    nodesByName[name] = node;
    return nodesByName[name];
  }
});
