var width = '1200',
height = 500;
var root;

var svg = d3.select("body").append("svg")
// .attr("viewBox", "0 0 1 1");
.attr("width", width)
.attr("height", height);

var force = d3.layout.force()
.gravity(.05)
.distance(120)
.charge(-100)
.size([width, height]);

var drag = force.drag()
.on("dragstart", dragstart);

var link = svg.selectAll(".link"),
node = svg.selectAll(".node");

var div = d3.select("body").append("div")
.attr("class", "tooltip")
.style("opacity", 0);

d3.json("static/data/sample.json", function(json) {
  root = json;
  update();
});


function update() {
  var nodes = flatten(root);
  var links = d3.layout.tree().links(nodes);

  force
  .nodes(nodes)
  .links(links)
  .start();

  var link = svg.selectAll(".link")
  .data(links)
  .enter().append("line")
  .attr("class", "link");

  var node = svg.selectAll(".node")
  .data(nodes)
  .enter().append("g")
  .attr("class", "node")
  .on("dblclick", dblclick)
      // .call(drag);
      .call(force.drag);



node.append("circle")
.attr("class", "node")
      // .attr("cx", function(d) { return d.x; })
      // .attr("cy", function(d) { return d.y; })
      .attr("r", function(d) { return d.effecif || 4.5; })
      .style("fill", color)
      .on("click", click)
      .call(force.drag)
      .on("mouseover", function(d) {
        div.transition()
        .duration(200)
        .style("opacity", .9);
        div .html('Effectif: ' + d.effecif + "<br/>Question: "  + d.question + "</br>Code: " + (d.code || '') + "</br>Repondnts: " + d.repondants + "</br>Total: " + d.total)
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
  .attr("dx", 12)
  .attr("dy", ".35em")
  .text(function(d) { return !d.code ? d.question : undefined; });


  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  });

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
    if (node.children) node.children.forEach(recurse);
    if (!node.id) node.id = ++i;
    nodes.push(node);
  }

  recurse(root);
  return nodes;
}