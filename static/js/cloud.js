var width = 960,
height = 500;
var root;
var clusters = {};

var     padding = 1.5, // separation between same-color nodes
    clusterPadding = 6, // separation between different-color nodes
    maxRadius = 12;

var svg = d3.select("body").append("svg")
// .attr("viewBox", "0 0 1 1");
.attr("width", width)
.attr("height", height);

var force = d3.layout.force()
.gravity(.05)
// .distance(50)
.charge(-100)
.size([width, height]);

var force = d3.layout.force()
    // .nodes(nodes)
    .size([width, height])
    .distance(150)
    .gravity(.02)
    .charge(0)
    // .on("tick", tick)
    .start();

var drag = force.drag()
.on("dragstart", dragstart);

// var link = svg.selectAll(".link"),
var node = svg.selectAll(".node");

var div = d3.select("body").append("div")
.attr("class", "tooltip")
.style("opacity", 0);

d3.json("static/data/sample.json", function(json) {
  root = json;
  // clusters = root.children;
  root.children.forEach(function(cl) {clusters[cl.question] = cl;});
  update();
});


function update() {
  var nodes = flatten(root);
  // var links = d3.layout.tree().links(nodes);


  d3.layout.pack()
    .sort(null)
    .size([width, height])
    .children(function(d) { return d.children; })
    .value(function(d) { return d.radius * d.radius; })
    .nodes({values: d3.nest()
      .key(function(d) { return d.cluster; })
      .entries(nodes)});


  force
  .nodes(nodes)
  // .links(links)
  .start();

  // var link = svg.selectAll(".link")
  // .data(links)
  // .enter().append("line")
  // .attr("class", "link");

  var node = svg.selectAll(".node")
  .data(nodes)
  .enter().append("g")
  .attr("class", "node")
  .on("dblclick", dblclick)
      .call(force.drag);



node.append("circle")
.attr("class", "node")
      // .attr("cx", function(d) { return d.x; })
      // .attr("cy", function(d) { return d.y; })
      .attr("r", function(d) { return d.radius || 4.5; })
      .style("fill", 'rgba(223, 242, 255, 0.5)')//'#DFF2FF')//color)
      .on("click", click)
      .call(force.drag)
      .on("mouseover", function(d) {
        div.transition()
        .duration(200)
        .style("opacity", .9);
        div .html('Effectif: ' + d.radius + "<br/>Question: "  + d.question + "</br>Code: " + (d.code || '') + "</br>Repondnts: " + d.repondants + "</br>Total: " + d.total)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
        div.transition()
        .duration(500)
        .style("opacity", 0);
      });

  // node.append("image")
  //     .attr("xlink:href", "https://github.com/favicon.ico")
  //     .attr("x", -8)
  //     .attr("y", -8)
  //     .attr("width", 16)
  //     .attr("height", 16);

  node.append("text")
  .attr("dx", function(d) {return -d.radius;})
  // .attr("dy", ".35em")
  .text(function(d) { return !d.code ? d.question : undefined; })
  .style("font-size", function(d) { return Math.min(2 * d.radius, (2 * d.radius - 8) / this.getComputedTextLength() * 24) + "px"; });


function tick(e) {
  node
      .each(cluster(10 * e.alpha * e.alpha))
      .each(collide(.5))
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

// Move d to be adjacent to the cluster node.
function cluster(alpha) {
  return function(d) {
    console.log('d', d);
    var cluster = clusters[d.cluster];
    if (cluster === undefined && d.name != 'root') {
      cluster = clusters[d.question];
    } else {
      return;
    }
    if (cluster === d) return;
    var cx = "x" in cluster ? cluster.x : Math.random();
    var cy = "y" in cluster ? cluster.y : Math.random();
    var x = d.x - cx,
        y = d.y - cy,
        l = Math.sqrt(x * x + y * y),
        r = d.radius + cluster.radius;
    if (l != r) {
      l = (l - r) / l * alpha;
      d.x -= x *= l;
      d.y -= y *= l;
      cluster.x += x;
      cluster.y += y;
    }
  };
}

// Resolves collisions between d and all other circles.
function collide(alpha) {
  var quadtree = d3.geom.quadtree(nodes);
  return function(d) {
    var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
        if (l < r) {
          l = (l - r) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  };
}
force.on("tick", tick);


  // force.on("tick", function() {
  //   link.attr("x1", function(d) { return d.source.x; })
  //   .attr("y1", function(d) { return d.source.y; })
  //   .attr("x2", function(d) { return d.target.x; })
  //   .attr("y2", function(d) { return d.target.y; });

    // node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  // });

}


// Color leaf nodes orange, and packages white or blue.
function color(d) {
  return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
}

function click(d) {
  // if (!d3.event.defaultPrevented) {
  //   if (d.children) {
  //     d._children = d.children;
  //     d.children = null;
  //   } else {
  //     d.children = d._children;
  //     d._children = null;
  //   }
  //   update();
  // }
}


function dblclick(d) {
  d3.select(this).classed("fixed", d.fixed = false);
}

function dragstart(d) {
  d3.select(this).classed("fixed", d.fixed = true);
}

function flatten(root) {
  var nodes = [], i = 0;

  function recurse(node) {
    if (node.children) node.children.forEach(function(child){child.cluster = node.question;});
    if (node.children) node.children.forEach(recurse);
    if (!node.id) node.id = ++i;
    if(!node.radius) node.radius = node.effecif > 4.5 ? node.effecif : 4.5;
    node.radius = node.radius * 2;
    nodes.push(node);
  }

  recurse(root);
  return nodes;
}