var width = 1200,
    height = 500,
    padding = 1.5, // separation between same-color nodes
    clusterPadding = 6, // separation between different-color nodes
    maxRadius = 12;
var collide, cluster, clusters, nodes, node;

code_color = 'rgba(150, 131, 236, 0.5)';
overcode_color = 'rgba(102, 0, 153, 0.5)';

var color = d3.scale.category10()
    .domain(d3.range(10));

var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

function radius(node, key) {
    var key = key || "effecif";
    return node[key] * 2.5;
}

// Use the pack layout to initialize node positions.
var svg;

var layout_pack, force;

layout_pack = d3.layout.pack()
    .sort(null)
    .size([width, height])
    .children(function(d) {
        return d.values;
    })
    .value(function(d) {
        return d.radius * d.radius;
    });
force = d3.layout.force()
    .size([width, height])
    .gravity(-.000)
    .charge(0);

function update() {d3.json("static/data/sample.json", function(json) {
  $("body > svg").remove();
  svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);


    nodes = json['nodes'],
    clusters = json['clusters'];
    $.each(clusters, function(k, v) {
        v.overcode = true;
        nodes.push(v);
    });
    nodes.forEach(function(n) {
        n.radius = radius(n);
        if (!n.overcode) {
            n.overcode = false;
        }
    });

    layout_pack
        .nodes({
            values: d3.nest()
                .key(function(d) {
                    return d.question;
                })
                .entries(nodes)
        });

    force
        .nodes(nodes)
        .on("tick", tick)
        .start();

    node = svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .call(force.drag);



    node
        .append("circle")
        .attr("class", function(d) {
            var c = d.overcode ? "overcode" : "code";
            return "node " + c;
        })
        .attr("r", function(d) {
            return d.radius || 4.5;
        })
        // .style("fill", function(d) {
            // return d.overcode ? overcode_color : code_color;
        // }) //function(d) { return color(d.cluster); })
    .call(force.drag)
        .on("mouseover", function(d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html('Effectif: ' + d.radius + "<br/>Question: " + d.question + "</br>Code: " + (d.code || '') + "</br>Repondents: " + d.repondants + "</br>Total: " + d.total)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });


    node.append("text")
    // .attr("dx", function(d) {return -d.radius;})
    .attr("dy", ".1em")
        .attr("class", "circle-text")
    // .attr("textLength", function(d) {return d.radius * 2;})
    .text(function(d) {
        var txt = !d.code ? d.question : undefined;
        return txt;
    })
        .style("font-size", function(d) {
            return Math.max(10, Math.min(2 * d.radius, (2 * d.radius - 8) / this.getComputedTextLength() * 12)) + "px";
        })
        .style("fill", "black")
        .call(wrap, 50);

    // svg.selectAll(".node")
    // .transition()
    // .duration(750)
    // .delay(function(d, i) { return i * 5; })
    // .attrTween("r", function(d) {
    //   var i = d3.interpolate(0, d.radius * 2);
    //   return function(t) { return d.radius = i(t); };
    // });

    svg.selectAll(".node").transition().duration(1000)
        .ease("linear");


    // Move d to be adjacent to the cluster node.
    cluster = function(alpha) {
        return function(d) {
            var cluster = clusters[d.cluster];
            if (cluster === d) return;
            var clusters_dist = 20;
            var x = d.x - cluster.x,
                y = d.y - cluster.y,
                l = Math.sqrt(x * x + y * y),
                r = d.radius + cluster.radius - clusters_dist;
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
    collide = function(alpha) {
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
});}

function generatePointOnCircle(angle, w, h) { //in degree
    var rads = angle / 180 * Math.PI;
    var r = Math.sqrt(w * w + h * h);
    var x = Math.cos(rads) * r;
    var y = Math.sin(rads) * r;

    return {
        x: x,
        y: y
    };
}



function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 0.5, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", -width / 2).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}

function tick(e) {
    node
        .each(cluster(10 * e.alpha * e.alpha))
        .each(collide(.5))
        .attr("cx", function(d) {
            return d.x;
        })
        .attr("cy", function(d) {
            return d.y;
        });

    node.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
    });
}


update();