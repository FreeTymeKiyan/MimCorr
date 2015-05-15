const TYPE_MRNA = 0;
const TYPE_MIRNA = 1;
const KEYCODE_C = 67;

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

function keydown() {
  if (d3.event.keyCode === KEYCODE_C) {
    centerView();
  }
}

var c1   = d3.rgb("blue");
var c2   = d3.rgb("darkorange");
var red  = d3.rgb("red");
var grey = d3.rgb("darkgreen");

var force = d3.layout.force() // position linked nodes, physical simulation
    .charge(-250) // negative push, positive pull
    .linkDistance(function (d) {
      return 50;
    }) // set the link distance
    .size([width, height]);
    
var svg = d3.select("body")
    .on("keydown.brush", keydown)
    .append("svg") // set svg
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

var nodeGraph;

d3.tsv("../data/data.txt", function(error, graph) { // add data
  var nodesByName = {};
  
  graph.forEach(function (link) {
    link.source = nodeByName(link.mRNA, TYPE_MRNA);
    link.target = nodeByName(link.microRNA, TYPE_MIRNA);
    link.T_CC = +link.T_CC;
    link.N_CC = +link.N_CC;
  });
  
  nodeGraph = d3.values(nodesByName);
  
  var scale = d3.scale.pow().exponent(2)
      .domain([-1, 1])
      .range([-5, 5]);
 
  var normal = vis.selectAll(".normalLink").data(graph); 
  var normalLinks = normal.enter().append("line")// draw link
      .attr("class", "normalLink")
      .style("stroke", grey)
      .style("stroke-width", function(d) { return Math.abs(scale(d.N_CC));  })
      .style("stroke-dasharray", function (d) { // set dashed-line
        var dbNum = 0;
        if (d.Targetprofiler === "targetprofiler-Yes") dbNum += 1;
        if (d.Targetscan === "targetscan-Yes") dbNum += 1;
        if (d.MiRanda === "miRanda-Yes") dbNum += 1;
      
        if (dbNum % 3 == 0) return ("2, 2");
        else if (dbNum % 3 == 1) return ("10, 10");
      })
      .on("mouseover", function(d) { highlightLink(this, true, d); })
      .on("mouseout",  function(d) { highlightLink(this, false, d); });
    
  normalLinks.append("title").text(function(d) { return d.N_CC; });
      
  var normalSymbol = normal.enter().append("text")
      .attr("class", "normalSymbol")
      .attr("text-anchor", "middle") 
      .attr("dy", ".35em")
      .text(function (d) {
        return d.N_CC >= 0 ? "+" : "-";
      });
      
  var tumor = vis.selectAll(".tumorLink").data(graph); // draw link
  var tumorLinks = tumor.enter().append("line")
      .attr("class", "tumorLink")
      .style("stroke", red)
      .style("stroke-width", function(d) { return Math.abs(scale(d.T_CC));  })
      .style("stroke-dasharray", function (d) { // set dashed-line
        var dbNum = 0;
        if (d.Targetprofiler === "targetprofiler-Yes") dbNum += 1;
        if (d.Targetscan === "targetscan-Yes") dbNum += 1;
        if (d.MiRanda === "miRanda-Yes") dbNum += 1;
        
        if (dbNum % 3 == 0) return ("2, 2");
        else if (dbNum % 3 == 1) return ("10, 10");
      })
      .on("mouseover", function(d) { highlightLink(this, true, d); })
      .on("mouseout",  function(d) { highlightLink(this, false, d); });
      
  tumorLinks.append("title").text(function(d) { return d.T_CC; });
  
  var tumorSymbol = tumor.enter().append("text")
      // .style("stroke", "grey")
      // .style("fill", "none")
      .attr("class", "tumorSymbol")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle") 
      .text(function (d) {
        return d.T_CC >= 0 ? "+" : "-";
  });

  var node = vis.selectAll(".node") // draw node
      .data(nodeGraph)
    .enter().append("path") // set shape
      .attr("class", "node")
      .attr("id", function (d) { return d.name; })
      .attr("d", d3.svg.symbol()
        .type(function(d) { // set shape type
          if (d.type % 2) return d3.svg.symbolTypes[0];
          return d3.svg.symbolTypes[3];
        })
        .size(function(d) { // set shape size
          return 250; // d.expr / 1000
        })
      )
      .style("fill", function(d) { // d.expr
        if (d.type % 2 == 0) return c1;
        return c2;
      })
      .on("mouseover", function(d) { highlight(this, true, d); })
      .on("mouseout",  function(d) { highlight(this, false, d); })
      .on("dblclick", dblclick)
      .call(force.drag()
        .on("dragstart", dragstart)
        .on("drag", dragged)
        .on("dragend", dragended)); // add drag

  node.append("title") // set title
      .text(function(d) { return d.name; });

  force
      .nodes(nodeGraph) // set the array of nodes to layout
      .links(graph) // set the array of links between nodes
      .start();
  
  force.on("tick", function() {
    normalLinks.attr("x1", function(d) { return d.source.x - 5; })
      .attr("y1", function(d) { return d.source.y - 5; })
      .attr("x2", function(d) { return d.target.x - 5; })
      .attr("y2", function(d) { return d.target.y - 5; });
        
    normalSymbol.attr("x", function (d) { 
      return (d.source.x + d.target.x) / 2 - 5;
    }).attr("y", function (d) { 
      return (d.source.y + d.target.y) / 2 - 5;
    });
        
    tumorLinks.attr("x1", function(d) { return d.source.x + 5; })
      .attr("y1", function(d) { return d.source.y + 5; })
      .attr("x2", function(d) { return d.target.x + 5; })
      .attr("y2", function(d) { return d.target.y + 5; });
    
    tumorSymbol.attr("x", function (d) { 
      return (d.source.x + d.target.x) / 2 + 5;
    }).attr("y", function (d) { 
      return (d.source.y + d.target.y) / 2 + 5;
    });

    node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });

    node.attr("transform", function(d) { // transform shape paths
      return "translate(" + d.x + "," + d.y + ")";
    });
  
  });
  
  function nodeByName(name, type) {
    if (nodesByName[name]) return nodesByName[name];
    var node = {};
    node.name = name;
    node.type = type;
    node.expr = 1000;
    nodesByName[name] = node;
    return nodesByName[name];
  }

  function dragstart(d) {
    d3.select(this).classed("fixed", d.fixed = true);
    d3.event.sourceEvent.stopPropagation();
  }

  function dragged(d) {
    force.resume();
  }

  function dragended(d) {
    // TODO
  }

  function dblclick(d) {
    d3.select(this).classed("fixed", d.fixed = false);
  }
  
  function highlight(node, isActive, data) {
    console.log(data);
    // fade all nodes and links
    d3.selectAll("line").classed("others", isActive);
    d3.selectAll("path").classed("others", isActive);
    // highlight center node
    d3.select(node).classed("main", isActive);
    if (isActive) {
      d3.select(node).classed("others", !isActive);
      // highlight links
      if (data.type === TYPE_MRNA) { // mrna, source
        var connLinks = normalLinks.filter(function (d, i) {
          return d.mRNA === data.name;
        });
        connLinks.classed("others", !isActive);
      
        tumorLinks.filter(function (d, i) {
          return d.mRNA === data.name;
        }).classed("others", !isActive);
      
        connLinks.each(function (d) {
          d3.select("#" + d.microRNA).classed("others", !isActive);
        });
      } else { // microrna, target
        var connLinks = normalLinks.filter(function (d, i) {
          return d.microRNA === data.name;
        });
        connLinks.classed("others", !isActive);
      
        tumorLinks.filter(function (d, i) {
          return d.microRNA === data.name;
        }).classed("others", !isActive);
      
        connLinks.each(function (d) {
          d3.select("#" + d.mRNA).classed("others", !isActive);
        });
      }
    }
  }
  
  function highlightLink(link, isActive, data) {
    d3.selectAll("line").classed("others", isActive);
    d3.selectAll("path").classed("others", isActive);
    if (isActive) {
      d3.select(link).classed("others", !isActive);
      d3.select("#" + data.mRNA).classed("others", !isActive);
      d3.select("#" + data.microRNA).classed("others", !isActive);
    }
  }
});

function centerView() {
  if (nodeGraph === null) {
    return;
  }
  if (nodeGraph.length === 0) return;
  
  minX = d3.min(nodeGraph.map(function(d) {return d.x;}));
  minY = d3.min(nodeGraph.map(function(d) {return d.y;}));

  maxX = d3.max(nodeGraph.map(function(d) {return d.x;}));
  maxY = d3.max(nodeGraph.map(function(d) {return d.y;}));
  
  molWidth = maxX - minX;
  molHeight = maxY - minY;
  
  widthRatio = width / molWidth;
  heightRatio = height / molHeight;
  
  minRatio = Math.min(widthRatio, heightRatio) * 0.9;
  
  newMolWidth = molWidth * minRatio;
  newMolHeight = molHeight * minRatio;
  
  xTrans = -(minX) * minRatio + (width - newMolWidth) / 2;
  yTrans = -(minY) * minRatio + (height - newMolHeight) / 2;
  
  vis.attr("transform", "translate(" + [xTrans, yTrans] + ")" + " scale(" + minRatio + ")");
 
  zoomer.translate([xTrans, yTrans ]);
  zoomer.scale(minRatio);
}
