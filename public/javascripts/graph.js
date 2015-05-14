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

var force = d3.layout.force() // position linked nodes, physical simulation
    .charge(-120) // negative push, positive pull
    .linkDistance(function (d) {
      if (d.corr >= 0) return 10;
      return 100;
    }) // set the link distance
    .size([width, height]);

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

d3.json("../data/graph_100.json", function(error, graph) { // add data 
  
  var nodesByName = {};

  graph.links.forEach(function (link) {
    link.source = nodeByName(link.source);
    link.target = nodeByName(link.target);
  });
  
  var link = vis.selectAll(".link") // draw link
      .data(graph.links)
    .enter().append("line")
      .attr("class", "link")
      .style("stroke", function(d) {
        return (d.corr >= 0 ? red : grey);
      })
      .style("stroke-width", function(d) { return 5;  }) // 100 * Math.abs(d.corr)
      .style("stroke-dasharray", function (d) { // set dashed-line
        if (d.type % 3 == 0) return ("2, 2");
        else if (d.type % 3 == 1) return ("10, 10");
      });

  var node = vis.selectAll(".node") // draw node
      .data(d3.values(nodesByName))
    .enter().append("path") // set shape
      .attr("class", "node")
      .attr("d", d3.svg.symbol()
        .type(function(d) { // set shape type
          if (d.type % 2) return d3.svg.symbolTypes[0];
          return d3.svg.symbolTypes[3];
        })
        .size(function(d) { // set shape size
          return 500; // d.expr / 1000
        })
      )
      .style("fill", function(d) { // d.expr
        if (d.type % 2 == 0) return c1;
        return c2;
      })
      .call(force.drag); // add drag

  node.append("title") // set title
      .text(function(d) { return d.id || d.gene; });
      
  force
      .nodes(d3.values(nodesByName)) // set the array of nodes to layout
      .links(graph.links) // set the array of links between nodes
      .start();
  
  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });

    node.attr("transform", function(d) { // transform shape paths
        return "translate(" + d.x + "," + d.y + ")";
    });
  });
  
  function nodeByName(name) {
    if (nodesByName[name]) return nodesByName[name];
    // search in graph.nodes array
    var node = _.find(graph.nodes, function(chr) {
      name = name.toLowerCase();
      if (chr.id) return _.startsWith(chr.id.toLowerCase(), name);
      return _.startsWith(chr.gene.toLowerCase(), name);
    });
    if (!node) console.log(name);
    nodesByName[name] = node;
    return nodesByName[name];
  }
});
