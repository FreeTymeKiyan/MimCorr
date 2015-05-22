const TYPE_MRNA = 0;
const TYPE_MIRNA = 1;
const KEYCODE_C = 67;

// var width = 960,
//     height = 500;
var width = window.innerWidth - 15,
    height = window.innerHeight - 40;
    
var xScale = d3.scale.linear()
    .domain([0, width]).range([0, width]);
var yScale = d3.scale.linear()
    .domain([0, height]).range([0, height]);
    
var zoomer = d3.behavior.zoom()
    .scaleExtent([0.1, 10])
    .x(xScale)
    .y(yScale)
    .on("zoomstart", zoomstart)
    .on("zoom", redraw);

var normalGene;
var tumorGene;
var normalMirna;
var tumorMirna;

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
    .friction(0.8)
    .theta(0.7)
    .linkStrength(0.1)
    .linkDistance(30) // set the link distance
    .charge(-40) // negative push, positive pull
    .chargeDistance(height - 200)
    .alpha(10)
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
    .attr('opacity', 0.6)
    .attr('id', 'vis')

var nodeGraph;
var highlight;
var highlightLinkType;
var corrFilter;
var weightFilter;
var exprFilter;
var linkTypeFilter;
var posCorrFilter;

d3.csv("../data/data.csv", function(error, graph) { // add data
  var nodesByName = {};
  
  graph.forEach(function (link) {
    link.source = nodeByName(link.mRNA, TYPE_MRNA);
    link.target = nodeByName(link.microRNA, TYPE_MIRNA);
    link.T_CC = +link.T_CC;
    link.N_CC = +link.N_CC;
  });
  
  nodeGraph = d3.values(nodesByName);
  
  var scale = d3.scale.linear()
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
        d.type = dbNum;
        if (dbNum % 3 === 1) return ("2, 2"); // 1 database
        else if (dbNum % 3 === 2) return ("8, 2"); // 2 databases
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
        d.type = dbNum;        
        if (dbNum % 3 === 1) return ("2, 2");
        else if (dbNum % 3 === 2) return ("8, 2");
      })
      .on("mouseover", function(d) { highlightLink(this, true, d); })
      .on("mouseout",  function(d) { highlightLink(this, false, d); });
      
  tumorLinks.append("title").text(function(d) { return d.T_CC; });
  
  var tumorSymbol = tumor.enter().append("text")
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
      .on("dblclick", dblclick)
      .call(force.drag()
        .on("dragstart", dragstart)
        .on("drag", dragged)
        .on("dragend", dragended)); // add drag
        
  d3.tsv("../data/gene.normal.txt", function(error, normalGene) {
    d3.tsv("../data/gene.tumor.txt", function(error, tumorGene) {
      var exprScale = buildScale(normalGene, tumorGene, TYPE_MRNA);
      
      node.filter(function (d) {
        return d.type % 2 === TYPE_MRNA;
      }).attr("d", d3.svg.symbol()
          .type("square")
          .size(function(d) { // set shape size
            // normalGene, average
            d.expr = _.result(_.find(normalGene, function (g) {
              return g.gene === d.name;
            }), 'average');
            d.tumorExpr = _.result(_.find(tumorGene, function (g) {
              return g.gene === d.name;
            }), 'average');
            return exprScale(d.expr); 
          })
        )
        .on("mouseover", function(d) { 
          highlight(d, true);
          var curNode = d3.select("#" + d.name);
          curNode.transition()
            .duration(500)
            .attr("d", d3.svg.symbol().type("square").size(exprScale(d.tumorExpr)));
        })
        .on("mouseout", function(d) { 
          highlight(d, false);
          d3.select("#" + d.name)
            .transition()
            .duration(500)
            .attr("d", d3.svg.symbol().type("square").size(exprScale(d.expr)));
        })
        .append("title").text(function (d) {
          return "mRNA:\t" + d.name 
              + "\nN_Expr:\t" + d.expr 
              + "\nT_Expr:\t" + d.tumorExpr;
        });
    });
  });
  
  d3.tsv("../data/miRNA.normal.txt", function(error, normalMirna) {
    d3.tsv("../data/miRNA.tumor.txt", function(error, tumorMirna) {
      var exprScale = buildScale(normalMirna, tumorMirna, TYPE_MIRNA);
      
      node.filter(function (d) {
        return d.type % 2 === TYPE_MIRNA;
      }).attr("d", d3.svg.symbol()
          .type("circle")
          .size(function(d) {
            d.expr = _.result(_.find(normalMirna, function (g) {
              return g.mirna === d.name;
            }), 'average');
            d.tumorExpr = _.result(_.find(tumorMirna, function (g) {
              return g.mirna === d.name;
            }), 'average');
            return exprScale(d.expr); 
          })
        )
        .on("mouseover", function(d) { 
          highlight(d, true);
          var curNode = d3.select("#" + d.name);
          curNode.transition()
            .duration(500)
            .attr("d", d3.svg.symbol().type("circle").size(exprScale(d.tumorExpr)));
        })
        .on("mouseout", function(d) { 
          highlight(d, false);
          d3.select("#" + d.name)
            .transition()
            .duration(500)
            .attr("d", d3.svg.symbol().type("circle").size(exprScale(d.expr)));
        })
        .append("title").text(function (d) {
          return "miRNA:\t" + d.name 
              + "\nN_Expr:\t" + d.expr 
              + "\nT_Expr:\t" + d.tumorExpr;
        });
    });
  });

  force
      .nodes(nodeGraph) // set the array of nodes to layout
      .links(graph) // set the array of links between nodes
      .start();
  
  force.on("tick", function() {
    normalLinks.attr("x1", function(d) { return d.source.x - 3; })
      .attr("y1", function(d) { return d.source.y - 3; })
      .attr("x2", function(d) { return d.target.x - 3; })
      .attr("y2", function(d) { return d.target.y - 3; });
        
    normalSymbol.attr("x", function (d) { 
      return (d.source.x + d.target.x) / 2 - 3;
    }).attr("y", function (d) { 
      return (d.source.y + d.target.y) / 2 - 3;
    });
        
    tumorLinks.attr("x1", function(d) { return d.source.x + 3; })
      .attr("y1", function(d) { return d.source.y + 3; })
      .attr("x2", function(d) { return d.target.x + 3; })
      .attr("y2", function(d) { return d.target.y + 3; });
    
    tumorSymbol.attr("x", function (d) { 
      return (d.source.x + d.target.x) / 2 + 3;
    }).attr("y", function (d) { 
      return (d.source.y + d.target.y) / 2 + 3;
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
  
  highlight = function (data, isActive) {
    // fade all nodes and links
    d3.selectAll("line.normalLink").classed("others", isActive);
    d3.selectAll("line.tumorLink").classed("others", isActive);
    d3.selectAll("path").classed("others", isActive);
    d3.selectAll("text").classed("others", isActive);
    // highlight center node
    d3.select("#" + data.name).classed("main", isActive);
    if (isActive) {
      d3.select("#" + data.name).classed("others", !isActive);
      // highlight links
      if (data.type === TYPE_MRNA) { // mrna, source
        var connLinks = normalLinks.filter(function (d, i) {
          return d.mRNA === data.name;
        });
        connLinks.classed("others", !isActive);
        normalSymbol.filter(function (d) {
          return d.mRNA === data.name;
        }).classed("others", !isActive);
      
        tumorLinks.filter(function (d, i) {
          return d.mRNA === data.name;
        }).classed("others", !isActive);
        tumorSymbol.filter(function (d) {
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
        normalSymbol.filter(function (d) {
          return d.microRNA === data.name;
        }).classed("others", !isActive);
      
        tumorLinks.filter(function (d, i) {
          return d.microRNA === data.name;
        }).classed("others", !isActive);
        tumorSymbol.filter(function (d) {
          return d.microRNA === data.name;
        }).classed("others", !isActive);
      
        connLinks.each(function (d) {
          d3.select("#" + d.mRNA).classed("others", !isActive);
        });
      }
    }
  }
  
  function highlightLink(link, isActive, data) {
    d3.selectAll("line.normalLink").classed("others", isActive);
    d3.selectAll("line.tumorLink").classed("others", isActive);
    d3.selectAll("path").classed("others", isActive);
    d3.selectAll("text").classed("others", isActive);
    if (isActive) {
      d3.select(link).classed("others", !isActive);
      d3.select("#" + data.mRNA).classed("others", !isActive);
      d3.select("#" + data.microRNA).classed("others", !isActive);
      if (d3.select(link).attr("class") === "normalLink") {
        normalSymbol.filter(function (d) {
          return data.mRNA === d.mRNA && data.microRNA === d.microRNA;
        }).classed("others", !isActive);
      } else {
        tumorSymbol.filter(function (d) {
          return data.mRNA === d.mRNA && data.microRNA === d.microRNA;
        }).classed("others", !isActive);
      }
    }
  }
  
  highlightLinkType = function (id) {
    resetGraph();
    fadeGraph();

    normalLinks.filter(function (d, i) {
      return d.type === id;
    }).each(function (d) {
      d3.select("#" + d.mRNA).classed("others", false);
      d3.select("#" + d.microRNA).classed("others", false);
    })
    .classed("others", false);
    tumorLinks.filter(function (d, i) {
      return d.type === id;
    }).classed("others", false);
    
    normalSymbol.filter(function (d) {
      return d.type === id;
    }).classed("others", false);
    tumorSymbol.filter(function (d) {
      return d.type === id;
    }).classed("others", false);
  };
  
  highlightNodeType = function (type) {
    resetGraph();
    fadeGraph();
    
    node.filter(function (d, i) {
      return d.type === type;
    }).classed("others", false);
  };
  
  corrFilter = function (val) {
    resetGraph();
    fadeGraph();
    
    var min;
    var max;
    if (val === 0) {
      max = 1;
      min = 0.8;
    } else if (val === 1) {
      max = 0.8;
      min = 0.5;
    } else {
      max = 0.5;
      min = 0;
    }
    
    normalLinks.filter(function (d, i) {
      var normalCorr = Math.abs(d.N_CC);
      return min < normalCorr && normalCorr <= max;
    }).each(function (d) {
      d3.select("#" + d.mRNA).classed("others", false);
      d3.select("#" + d.microRNA).classed("others", false);
    })
    .classed("others", false);
    
    tumorLinks.filter(function (d, i) {
      var tumorCorr = Math.abs(d.T_CC);
      return min < tumorCorr && tumorCorr <= max;
    }).each(function (d) {
      d3.select("#" + d.mRNA).classed("others", false);
      d3.select("#" + d.microRNA).classed("others", false);
    })
    .classed("others", false);
    
    normalSymbol.filter(function (d) {
      var normalCorr = Math.abs(d.N_CC);
      return min < normalCorr && normalCorr <= max;
    }).classed("others", false);
    tumorSymbol.filter(function (d) {
      var tumorCorr = Math.abs(d.T_CC);
      return min < tumorCorr && tumorCorr <= max;
    }).classed("others", false);
  };
  
  weightFilter = function (val) {
    resetGraph();
    fadeGraph();
    
    var max = Number.MAX_VALUE;
    var min;
    if (val === 0) {
      min = 10;
    } else if (val === 1) {
      max = 10;
      min = 5;
    } else {
      max = 5;
      min = 0;
    }
    
    node.filter(function (d) {
      return min < d.weight && d.weight <= max;
    })
    .classed("others", false);
    
  };
  
  exprFilter = function (val) {
    resetGraph();
    fadeGraph();
    
    node.filter(function (d) {
      return val === 0 ? (d.tumorExpr > d.expr) : (d.tumorExpr < d.expr);
    }).classed("others", false);
  };
  
  linkTypeFilter = function (val) {
    resetGraph();
    fadeGraph();
    
    if (val) {
      tumorSymbol.classed("others", false);
      tumorLinks
          .each(function (d) {
            d3.select("#" + d.mRNA).classed("others", false);
            d3.select("#" + d.microRNA).classed("others", false);
          })
          .classed("others", false);
    } else {
      normalSymbol.classed("others", false);
      normalLinks
          .each(function (d) {
            d3.select("#" + d.mRNA).classed("others", false);
            d3.select("#" + d.microRNA).classed("others", false);
          })
          .classed("others", false);
    }
  };
  
  posCorrFilter = function (val) {
    resetGraph();
    fadeGraph();
    
    if (val) {
      normalLinks
          .filter(function (d) {
            return d.N_CC < 0;
          })
          .each(function (d) {
            d3.select("#" + d.mRNA).classed("others", false);
            d3.select("#" + d.microRNA).classed("others", false);
          })
          .classed("others", false);
      normalSymbol.filter(function (d) {
        return d.N_CC < 0;
      }).classed("others", false);
      tumorLinks
          .filter(function (d) {
            return d.T_CC < 0;
          })
          .each(function (d) {
            d3.select("#" + d.mRNA).classed("others", false);
            d3.select("#" + d.microRNA).classed("others", false);
          })
          .classed("others", false);
      tumorSymbol.filter(function (d) {
        return d.T_CC < 0;;
      }).classed("others", false);
    } else {
      normalLinks
          .filter(function (d) {
            return d.N_CC > 0;
          })
          .each(function (d) {
            d3.select("#" + d.mRNA).classed("others", false);
            d3.select("#" + d.microRNA).classed("others", false);
          })
          .classed("others", false);
      normalSymbol.filter(function (d) {
        return d.N_CC > 0;
      }).classed("others", false);
      
      tumorLinks
          .filter(function (d) {
            return d.T_CC > 0;
          })
          .each(function (d) {
            d3.select("#" + d.mRNA).classed("others", false);
            d3.select("#" + d.microRNA).classed("others", false);
          })
          .classed("others", false);
      tumorSymbol.filter(function (d) {
        return d.T_CC > 0;;
      }).classed("others", false);
    }
  };
  
  generateList(node);
});

function highlightBySearch() {
  resetGraph();
  var name = $("#name").val(); // get node name
  // return if no name entered
  if (name === "") {
    console.log("no name entered"); // TODO add noti
    return;
  }
  // get node
  var curNode = force.nodes().filter(function (d) {
    return d.name.toUpperCase() === name.toUpperCase();
  });
  // node not found in graph
  if (curNode.length === 0) {
    console.log("node not found"); // TODO add noti
    return;
  }
  centerOnNode(curNode[0]);
}

function resetGraph() {
  d3.selectAll("line.normalLink").classed("others", false);
  d3.selectAll("line.tumorLink").classed("others", false);
  d3.selectAll("path").classed("others", false);
  d3.selectAll("path").classed("main", false);
  d3.selectAll("text").classed("others", false);
}

function fadeGraph() {
  d3.selectAll("line.normalLink").classed("others", true);
  d3.selectAll("line.tumorLink").classed("others", true);
  d3.selectAll("path").classed("others", true);
  d3.selectAll("text").classed("others", true);
}

function centerOnNode(d) {
  // move and scale
  zoomer.scale(1);
  var cx = (window.innerWidth / 2 - d.x * zoomer.scale());
	var cy = (window.innerHeight / 2 - d.y * zoomer.scale());
  vis.attr("transform", "translate(" + cx + "," + cy  + ") scale(" + zoomer.scale() + ")");
  zoomer.translate([cx, cy]);
  highlight(d, true);
}

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
  
  widthRatio = window.innerWidth / molWidth;
  heightRatio = window.innerHeight / molHeight;
  
  minRatio = Math.min(widthRatio, heightRatio) * 0.9;
  
  newMolWidth = molWidth * minRatio;
  newMolHeight = molHeight * minRatio;
  
  xTrans = -(minX) * minRatio + (width - newMolWidth) / 2;
  yTrans = -(minY) * minRatio + (height - newMolHeight) / 2;
  
  vis.attr("transform", "translate(" + [xTrans, yTrans] + ")" + " scale(" + minRatio + ")");
 
  zoomer.translate([xTrans, yTrans ]);
  zoomer.scale(minRatio);
}

function buildScale(expr, tumorExpr, type) {
  var max = Math.max(
    _.max(expr, function (g) {
      g.average = +g.average;
      return g.average;
    }).average, 
    _.max(tumorExpr, function (g) {
      g.average = +g.average;
      return g.average;
    }).average
  );
  var min = Math.min(
    _.min(expr, function (g) {
        g.average = +g.average;
        return g.average;
      }).average, 
    _.min(tumorExpr, function (g) {
        g.average = +g.average;
        return g.average;
      }).average
  );
  return type === TYPE_MIRNA ? 
      d3.scale.log()
      .clamp(true)
      .base(1.1)
      .domain([min, max])
      .range([75, 375]) 
    : d3.scale.linear()
      .clamp(true)
      .domain([min, max])
      .range([75, 375]);
}

function generateList(node) {
  node.filter(function (d) {
    return d.type === TYPE_MRNA;
  }).each(function (d) {
    $("#mrna_list").append("<li>" + d.name + "</li>");
  });
  
  node.filter(function (d) {
    return d.type === TYPE_MIRNA;
  }).each(function (d) {
    $("#mirna_list").append("<li>" + d.name + "</li>");
  });
}
