var width = 960,
height = 500,
    padding = 1.5, // separation between same-color nodes
    clusterPadding = 6, // separation between different-color nodes
    maxRadius = 12;
var clusters, nodes;

    var color = d3.scale.category10()
    .domain(d3.range(10));

// The largest node for each cluster.
// var clusters = new Array(m);

// var nodes = d3.range(n).map(function() {
//   var i = Math.floor(Math.random() * m),
//   r = Math.sqrt((i + 1) / m * -Math.log(Math.random())) * maxRadius,
//   d = {cluster: i, radius: r};
//   if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
//   return d;
// });

function radius (node) {
  return node.effecif;
}

// Use the pack layout to initialize node positions.

d3.json("static/data/sample.json", function(json) {

  nodes = json['nodes'],
  clusters = json['clusters'];
  nodes.forEach(function(n) {n.radius = radius(n);});
  $.each(clusters, function(k, v){clusters[k].radius = radius(clusters[k])});

  d3.layout.pack()
  .sort(null)
  .size([width, height])
  .children(function(d) { return d.values; })
  .value(function(d) { return d.radius * d.radius; })
  .nodes({values: d3.nest()
    .key(function(d) { return d.question; })
    .entries(nodes)});

  var force = d3.layout.force()
  .nodes(nodes)
  .size([width, height])
  .gravity(.02)
  .charge(0)
  .on("tick", tick)
  .start();

  var svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height);

  var node = svg.selectAll("circle")
  .data(nodes)
  .enter().append("circle")
    .style("fill", function(d) { return color(d.cluster); })
    .call(force.drag);

    node.transition()
    .duration(750)
    .delay(function(d, i) { return i * 5; })
    .attrTween("r", function(d) {
      var i = d3.interpolate(0, d.radius);
      return function(t) { return d.radius = i(t); };
    });

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
    var cluster = clusters[d.cluster];
    if (cluster === d) return;
    var x = d.x - cluster.x,
    y = d.y - cluster.y,
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
});