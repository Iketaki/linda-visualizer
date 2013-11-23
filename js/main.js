// Generated by CoffeeScript 1.3.3
(function() {
  var flatten;

  flatten = function(root) {
    var classes, recurse;
    classes = [];
    recurse = function(key, node) {
      if (node.children && node.children.length > 0) {
        return node.children.forEach(function(child) {
          return recurse(node.key, child);
        });
      } else {
        return classes.push({
          key: node.key,
          value: node.value,
          tuple: node.tuple
        });
      }
    };
    recurse("", root);
    return {
      key: "",
      children: classes
    };
  };

  Array.prototype.make_key = function(hierarchy) {
    return this.slice(0, hierarchy).join('/');
  };

  Array.prototype.tuple_str = function() {
    return "[" + (this.join(", ")) + "]";
  };

  $(function() {
    var color, data, height, io, linda, pack, svg, tuple_spaces, width,
      _this = this;
    io = new RocketIO().connect("http://linda.masuilab.org");
    linda = new Linda(io);
    tuple_spaces = ["delta", "iota", "enoshima", "orf"];
    width = $("#visual").height();
    height = $("#visual").height();
    svg = d3.select("#visual").append("svg").attr("width", width).attr("height", height);
    pack = d3.layout.pack().size([width, height]).padding(10);
    data = [];
    color = d3.scale.category20();
    return io.on("connect", function() {
      var ts, watch_ts, _i, _len, _results;
      $("#status").text("" + io.type + " connect");
      data = {
        key: "linda.masuilab.org",
        children: []
      };
      watch_ts = function(ts) {
        var child_index,
          _this = this;
        data.children.push({
          key: ts.name,
          children: []
        });
        child_index = data.children.length - 1;
        return ts.watch([], function(tuple) {
          var appended, circle, elems, flattened, h, i, nodes, root, text_attr, text_style, updated_key;
          $("#list").prepend($("<p>").text("[" + (tuple.join(", ")) + "]"));
          root = data.children[child_index];
          i = 0;
          while (i < root.children.length) {
            if (root.children[i].key === tuple[0]) {
              break;
            }
            i += 1;
          }
          if (i === root.children.length) {
            h = {
              key: tuple[0],
              children: []
            };
            root.children.push(h);
          }
          root = root.children[i];
          updated_key = tuple.make_key(2);
          i = 0;
          while (i < root.children.length) {
            if (root.children[i].key === updated_key) {
              break;
            }
            i += 1;
          }
          if (i === root.children.length) {
            h = {
              key: updated_key,
              value: 1,
              tuple: tuple
            };
            root.children.push(h);
          } else {
            root.children[i].value += 1;
            root.children[i].tuple = tuple;
          }
          flattened = flatten(data);
          nodes = pack.nodes(flattened);
          window.data = data;
          window.flattened = flattened;
          window.nodes = nodes;
          elems = svg.selectAll(".node").data(nodes);
          window.elems = elems;
          appended = elems.enter().append("g").attr("class", "node").attr("transform", function(d) {
            return "translate(" + d.x + ", " + d.y + ")";
          });
          circle = appended.append("circle").attr({
            "fill-opacity": 0.3,
            "stroke-opacity": 0.3,
            "stroke-width": 2,
            "stroke": function(d, i) {
              return "#ffffff";
            },
            "fill": function(d, i) {
              return color(i);
            }
          }).attr("r", 0).transition().duration(700).ease("bounce").attr("r", function(d) {
            return d.r;
          });
          text_attr = {
            "fill": "white",
            "text-anchor": "middle",
            "alignment-baseline": "middle"
          };
          text_style = {
            "text-shadow": "#000000 0 -2px 0"
          };
          appended.append("text").attr("class", "tuple").text(function(d) {
            if (!d.tuple) {
              return "";
            }
            return "[" + (d.tuple.join(", ")) + "]";
          }).attr(text_attr).style(text_style);
          appended.append("text").attr("class", "value").text(function(d) {
            return "";
          }).attr("dy", "2em").attr(text_attr).style(text_style);
          elems.transition().duration(700).attr("transform", function(d) {
            return "translate(" + d.x + ", " + d.y + ")";
          });
          elems.select("circle").attr("fill", function(d, i) {
            if (d.tuple && d.tuple.make_key(2) === updated_key) {
              return "white";
            } else {
              return color(i);
            }
          }).attr("fill-opacity", function(d, i) {
            if (d.tuple && d.tuple.make_key(2) === updated_key) {
              return 0.8;
            } else {
              return 0.3;
            }
          }).transition().duration(300).attr("fill", function(d, i) {
            return color(i);
          }).attr("fill-opacity", 0.3).attr("r", function(d) {
            return d.r;
          });
          elems.select(".tuple").each(function(d) {
            if (d.tuple) {
              return this.textContent = "[" + (d.tuple.slice(0, 2).join(', ')) + "]";
            }
          });
          return elems.select(".value").each(function(d) {
            if (d.tuple) {
              return this.textContent = d.value;
            }
          });
        });
      };
      _results = [];
      for (_i = 0, _len = tuple_spaces.length; _i < _len; _i++) {
        ts = tuple_spaces[_i];
        _results.push(watch_ts(new linda.TupleSpace(ts)));
      }
      return _results;
    });
  });

}).call(this);
