// Generated by CoffeeScript 1.3.3
(function() {
  var flatten, make_key, tuple_str;

  flatten = function(root) {
    var classes, recurse;
    classes = [];
    recurse = function(key, node) {
      var child, _i, _len, _ref, _results;
      if (node.children) {
        _ref = node.children;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          child = _ref[_i];
          _results.push(recurse(node.key, child));
        }
        return _results;
      } else {
        return classes.push(node);
      }
    };
    recurse("", root);
    return {
      key: "",
      children: classes
    };
  };

  make_key = function(tuple, hierarchy) {
    return tuple.slice(0, hierarchy).join('/');
  };

  tuple_str = function(tuple) {
    return "[" + (tuple.join(", ")) + "]";
  };

  $(function() {
    var color, data, height, io, linda, pack, svg, tuple_spaces, width,
      _this = this;
    io = new RocketIO().connect("http://linda.masuilab.org");
    linda = new Linda(io);
    tuple_spaces = ["delta", "iota", "enoshima", "orf"];
    width = $("#visual").width();
    height = $("#visual").height();
    svg = d3.select("#visual").append("svg").attr("width", width).attr("height", height);
    pack = d3.layout.pack().size([width, height]).padding(10);
    data = {};
    color = d3.scale.category20();
    return io.on("connect", function() {
      var ts, watch_ts, _i, _j, _len, _len1, _results;
      $("#status").text("" + io.type + " connect");
      watch_ts = function(ts) {
        return ts.watch([], function(tuple) {
          var appended, child, circle, elems, flag_enoshima, flattened, i, nodes, root, text_attr, text_style, updated_key, _i, _len, _ref;
          $("#list").prepend($("<p>").text("" + ts.name + ": [" + (tuple.join(", ")) + "]"));
          flag_enoshima = false;
          if (tuple[0] === "wind" || tuple[0] === "saykana") {
            flag_enoshima = true;
          }
          _ref = data.children;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            child = _ref[_i];
            if (child.key === ts.name) {
              root = child;
              break;
            }
          }
          i = 0;
          while (i < root.children.length) {
            if (root.children[i].key === tuple[0]) {
              break;
            }
            i += 1;
          }
          if (i === root.children.length) {
            if (flag_enoshima) {
              root.children.push({
                key: tuple[0],
                tuple: tuple,
                ts: ts.name,
                count: 1,
                value: 1
              });
            } else {
              root.children.push({
                key: tuple[0],
                children: []
              });
            }
          } else if (flag_enoshima) {
            root.children[i].count += 1;
            root.children[i].value = Math.log(root.children[i].count);
            root.children[i].tuple = tuple;
          }
          if (!flag_enoshima) {
            root = root.children[i];
            updated_key = make_key(tuple, 2);
            i = 0;
            while (i < root.children.length) {
              if (root.children[i].key === updated_key) {
                break;
              }
              i += 1;
            }
            if (i === root.children.length) {
              root.children.push({
                key: updated_key,
                tuple: tuple,
                ts: ts.name,
                count: 1,
                value: 1
              });
            } else {
              root.children[i].count += 1;
              root.children[i].value = Math.sqrt(root.children[i].count);
              root.children[i].tuple = tuple;
            }
          }
          flattened = flatten(data);
          nodes = pack.nodes(flattened);
          elems = svg.selectAll(".node").data(nodes);
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
          appended.append("text").attr("class", "now").text(function(d) {
            return "";
          }).attr(text_attr).style(text_style).attr("fill", "yellow");
          appended.append("text").attr("class", "ts").attr("dy", "-1.5em").text(function(d) {
            return "";
          }).attr(text_attr).style(text_style);
          appended.append("text").attr("class", "count").text(function(d) {
            return "";
          }).attr(text_attr).style(text_style).attr("fill", "gray");
          appended.append("text").attr("class", "tuple").text(function(d) {
            return "";
          }).attr("font-size", "24").attr(text_attr).style(text_style);
          elems.transition().duration(700).attr("transform", function(d) {
            return "translate(" + d.x + ", " + d.y + ")";
          });
          elems.select("circle").attr("fill", function(d, i) {
            if (d.tuple && make_key(d.tuple, 2) === updated_key) {
              return "white";
            } else {
              return color(i);
            }
          }).attr("fill-opacity", function(d, i) {
            if (d.tuple && make_key(d.tuple, 2) === updated_key) {
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
              return this.textContent = "[" + (d.tuple.slice(0, d.tuple[0] === "wind" || d.tuple[0] === "saykana" ? 1 : 2).join(', ')) + "]";
            }
          });
          elems.select(".now").each(function(d) {
            return $(this).attr("dy", "" + (d.r - 30) + "px");
          });
          elems.select(".count").each(function(d) {
            if (d.tuple) {
              this.textContent = "count: " + d.count;
            }
            return $(this).attr("dy", "" + (d.r - 30) + "px");
          });
          return elems.select(".ts").each(function(d) {
            if (d.ts) {
              return this.textContent = d.ts;
            }
          });
        });
      };
      data = {
        key: "linda.masuilab.org",
        children: []
      };
      for (_i = 0, _len = tuple_spaces.length; _i < _len; _i++) {
        ts = tuple_spaces[_i];
        data.children.push({
          key: ts,
          children: []
        });
      }
      _results = [];
      for (_j = 0, _len1 = tuple_spaces.length; _j < _len1; _j++) {
        ts = tuple_spaces[_j];
        _results.push(watch_ts(new linda.TupleSpace(ts)));
      }
      return _results;
    });
  });

}).call(this);
