# flatten data
flatten = (root) ->
  classes = []

  recurse = (key, node) ->
    if (node.children && node.children.length > 0)
      node.children.forEach (child)->
        recurse(node.key, child)
    else
      classes.push
        key: node.key
        value: node.value
        tuple: node.tuple

  recurse("", root)
  return {
    key: ""
    children: classes
  }

Array::make_key = (hierarchy) ->
  this.slice(0, hierarchy).join('/')

Array::tuple_str = ->
  "[#{this.join(", ")}]"

$ ->
  io = new RocketIO().connect("http://linda.masuilab.org")
  linda = new Linda(io)
  tuple_spaces = ["delta", "iota", "enoshima", "orf"]
  #delta = new linda.TupleSpace("delta")

  # init
  width = $("#visual").height()
  height = $("#visual").height()

  svg = d3.select("#visual").append("svg").attr("width", width).attr("height", height)
  pack = d3.layout.pack()
    .size([width, height])
    .padding(10)

  data = []
  color = d3.scale.category20()

  # rocketio
  io.on "connect", =>
    $("#status").text "#{io.type} connect"

    data = {
      key: "linda.masuilab.org",
      children: []
    }

    watch_ts = (ts) ->
      data.children.push
        key: ts.name
        children: []

      child_index = data.children.length - 1

      ts.watch [], (tuple) =>
        $("#list").prepend $("<p>").text("[#{tuple.join(", ")}]")

        # update data
        # 第一階層 sensor
        # [sensor, light, 3]
        root = data.children[child_index]

        i = 0; while i < root.children.length
          if root.children[i].key == tuple[0]
            break
          i += 1

        # なかったら
        if i == root.children.length
          h = {
              key: tuple[0]
              children: []
          }
          root.children.push h

        root = root.children[i]

        updated_key = tuple.make_key(2)
        i = 0; while i < root.children.length
          if root.children[i].key == updated_key
            break
          i += 1

        if i == root.children.length
          h = {
              key: updated_key
              value: 1
              tuple: tuple
          }
          root.children.push h
        else
          root.children[i].value += 1
          root.children[i].tuple = tuple

        # packing algorithhm
        flattened = flatten(data)
        nodes = pack.nodes(flattened)

        # for debug
        window.data = data
        window.flattened = flattened
        window.nodes = nodes

        # draws
        elems = svg.selectAll(".node")
          .data(nodes)

        window.elems = elems

        # Append
        appended = elems.enter().append("g")
          .attr("class", "node")
          .attr "transform", (d) ->
            "translate(#{d.x}, #{d.y})"

        circle = appended.append("circle")
          .attr
            "fill-opacity": 0.3
            "stroke-opacity": 0.3
            "stroke-width": 2
            "stroke": (d, i) =>
              "#ffffff"
            "fill": (d, i) =>
              color(i)
          .attr("r", 0)
          .transition()
          .duration(700)
          .ease("bounce")
          .attr "r", (d) ->
            d.r

        text_attr =
          "fill": "white"
          "text-anchor": "middle"
          "alignment-baseline": "middle"
        text_style =
          "text-shadow": "#000000 0 -2px 0"

        appended.append("text")
          .attr("class", "tuple")
          .text (d) -> #[TODO] work?
            return "" unless d.tuple
            "[#{d.tuple.join(", ")}]"
          .attr(text_attr)
          .style(text_style)

        appended.append("text")
          .attr("class", "value")
          .text (d) ->
            ""
          .attr("dy", "2em")
          .attr(text_attr)
          .style(text_style)

        # Update
        elems
          .transition()
          .duration(700)
          .attr "transform", (d) ->
            "translate(#{d.x}, #{d.y})"

        elems.select("circle")
          .attr "fill", (d, i) ->
            if d.tuple && d.tuple.make_key(2) == updated_key then "white" else color(i)
          .attr "fill-opacity", (d, i) ->
            if d.tuple && d.tuple.make_key(2) == updated_key then 0.8 else 0.3
          .transition()
          .duration(300)
          .attr "fill", (d, i) =>
            color(i)
          .attr("fill-opacity", 0.3)
          .attr "r", (d) ->
            d.r

        elems.select(".tuple").each (d) ->
          this.textContent = "[#{d.tuple.slice(0, 2).join(', ')}]" if d.tuple

        elems.select(".value").each (d) ->
          this.textContent = d.value if d.tuple

    # tuple
    for ts in tuple_spaces
      watch_ts(new linda.TupleSpace(ts))
