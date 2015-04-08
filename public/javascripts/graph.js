var width = 960,
    height = 500;

var c1 = d3.rgb("lightgreen");
var c2 = d3.rgb("lightskyblue");

var force = d3.layout.force() // position linked nodes, physical simulation
    .charge(-120) // get or set the charge strength.
    .linkDistance(100) // set the link distance
    .size([width, height]);

var svg = d3.select("body").append("svg") // set svg
    .attr("width", width)
    .attr("height", height);

d3.json("../data/miserables.json", function(error, graph) { // add data 
  force 
      .nodes(graph.nodes) // set the array of nodes to layout
      .links(graph.links) // set the array of links between nodes
      .start();

  var link = svg.selectAll(".link") // draw link
      .data(graph.links)
    .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", function(d) { return Math.sqrt(d.value); })
      .style("stroke-dasharray", function (d) { // set dashed-line
        if (d.value % 3 == 0) return ("2, 2");
        else if (d.value % 3 == 1) return ("10, 10");
      });

  var node = svg.selectAll(".node") // draw node
      .data(graph.nodes)
    .enter().append("path") // set shape
      .attr("class", "node")
      .attr("d", d3.svg.symbol()
        .type(function(d) { // set shape type
          if (d.group % 2) return d3.svg.symbolTypes[0];
          return d3.svg.symbolTypes[3]; 
        })
        .size(function(d) { // set shape size
          return (d.group + 5) * (d.group + 5)
        })
      )
      // .attr("r", 5)
      .style("fill", function(d) { 
        if (d.group % 2 == 0) return c1.darker(d.group / 4); 
        return c2.darker(d.group / 6); 
      })
      .call(force.drag); // add drag

  node.append("title") // set title
      .text(function(d) { return d.name; });

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
});
