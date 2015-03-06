// It's the most dirty code in the world
// I'm very sorry for it...


var padding = 1.5, // separation between same-color nodes
    clusterPadding = 60, // separation between different-color nodes
    maxRadius = 12,
    margin = {
        top: 40,
        right: 40,
        bottom: 40,
        left: 40
    };
var w = window.innerWidth,
    h = window.innerHeight;

var cluster_density = 0;

var width = w,
    height = h;

var collide, cluster, clusters, nodes, node;

var color = d3.scale.category10()
    .domain(d3.range(10));

var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

function radius(node, key) {
    var key = key || "effecif";
    return node[key] * 2.0;
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
    .gravity(.00)
// .friction(1.0);
// .alpha(-100);
.charge(50);

function update() {
    d3.json("static/data/sample.json", function(json) {
        $("body > svg").remove();
        var svg_parent = $("#svg").parent();
        w = svg_parent.width() - 50;
        h = Math.max(height, svg_parent.height()) - 100;
        svg = d3.select("#svg")
            .attr("width", w + 100)
            .attr("height", h)
            .attr("pointer-events", "all")
            .append('svg:g')
            .call(d3.behavior.zoom().on("zoom", redraw))
            .append('svg:g');

        svg
            .append('svg:rect')
            .attr('width', w)
            .attr('height', h)
            .attr('fill', 'none');

        function redraw() {
          svg.attr("transform",
              "translate(" + d3.event.translate + ")"
              + " scale(" + d3.event.scale + ")");
        }


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
            })
            .on("click", function(d) {
                $.post('/ajax_get_answers?id=' + d.code, function(answer) {
                    a = answer;
                    bootbox.dialog({
                        message: '<table id="table-methods-table" data-height="299">' +
                            '<thead>' +
                            '<tr>' +
                            '<th data-field="state" data-checkbox="true"></th>' +
                            '<th data-field="id">Responder ID</th>' +
                            '<th data-field="answer">Item Answer</th>' +
                            '</tr>' +
                            '</thead>' +
                            '</table>',
                        title: d.question,
                        buttons: {
                            success: {
                                label: 'Ok',
                                className: 'btn-default'
                            }
                        }
                    });
                    $table = $('#table-methods-table').bootstrapTable({
                    data: answer.result
                });
                })
            });



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
        ;


        node.append("text")
        // .attr("dx", function(d) {return -d.radius;})
        .attr("dy", ".1em")
            .attr("class", "circle-text")
        // .attr("textLength", function(d) {return d.radius * 2;})
        .text(function(d) {
            return d.title;
        })
            .style("font-size", function(d) {
                return Math.max(6, Math.min(2 * d.radius, (2 * d.radius - 8) / this.getComputedTextLength() * 12)) + "px";
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

        // svg.selectAll(".node").transition().duration(1000)
        // .ease("linear");


        // Move d to be adjacent to the cluster node.
        cluster = function(alpha) {
            return function(d) {
                var cluster = clusters[d.cluster];
                if (cluster === d) return;
                var clusters_dist = -20;
                var x = d.x - cluster.x,
                    y = d.y - cluster.y,
                    l = Math.sqrt(x * x + y * y) - clusters_dist,
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
                            l = Math.sqrt(x * x + y * y) + cluster_density,
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
            if (d.x > w - d.r) d.x -= 1
            else if (d.x < d.r) d.x += 1
            return d.x;
        })
        .attr("cy", function(d) {
            if (d.y > h - d.r) d.y -= 1
            else if (d.y < d.r) d.y += 1
            return d.y;
        });

    node.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
    })
        .style("animation-duration", function() {
            return Math.random() * 10 + "s";
        });
}

update();

// So now you see, that this code is absolute shit