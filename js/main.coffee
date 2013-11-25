# flatten data
flatten = (root) ->
  classes = []

  recurse = (key, node) ->
    if (node.children)
      for child in node.children
        recurse(node.key, child)
    else
      classes.push node

  recurse("", root)
  return {
    key: ""
    children: classes
  }

make_key = (tuple, hierarchy) ->
  tuple.slice(0, hierarchy).join('/')

tuple_str = (tuple) ->
  "[#{tuple.join(", ")}]"

$ ->
  io = new RocketIO().connect("http://linda.masuilab.org")
  linda = new Linda(io)
  tuple_spaces = ["delta", "iota", "enoshima", "orf"]
  #delta = new linda.TupleSpace("delta")

  # init
  width = $("#visual").width()
  height = $("#visual").height()

  svg = d3.select("#visual").append("svg").attr("width", width).attr("height", height)
  pack = d3.layout.pack()
    .size([width, height])
    .padding(2)

  data = {}
  color = d3.scale.category20()

  # rocketio
  io.on "connect", =>
    $("#status").text "#{io.type} connect"

    watch_ts = (ts) =>
      ts.watch [], (tuple) =>
        $("#list").prepend $("<p>").text("#{ts.name}: [#{tuple.join(", ")}]")

        # update data
        # 第一階層 sensor
        # [sensor, light, 3]

        flag_enoshima = false
        # もし江ノ島の風だったら
        if tuple[0] == "wind" || tuple[0] == "saykana"
          flag_enoshima = true

        for child in data.children
          if child.key == ts.name
            root = child
            break

        i = 0; while i < root.children.length
          if root.children[i].key == tuple[0]
            break
          i += 1

        # なかったら
        if i == root.children.length
          if flag_enoshima
            root.children.push
              key: tuple[0]
              tuple: tuple
              ts: ts.name
              count: 1
              value: 1
          else
            root.children.push
              key: tuple[0]
              children: []
        else if flag_enoshima
          root.children[i].count += 1
          root.children[i].value = Math.sqrt(Math.sqrt(root.children[i].count))
          root.children[i].tuple = tuple

        # 第二階層 light
        unless flag_enoshima
          root = root.children[i]
          updated_key = make_key(tuple, 2)

          i = 0; while i < root.children.length
            if root.children[i].key == updated_key
              break
            i += 1

          if i == root.children.length
            root.children.push
              key: updated_key
              tuple: tuple
              ts: ts.name
              count: 1
              value: 1
          else
            root.children[i].count += 1
            root.children[i].value = Math.sqrt(Math.sqrt(root.children[i].count))
            root.children[i].tuple = tuple

        # packing algorithhm
        flattened = flatten(data)
        nodes = pack.nodes(flattened)

        # draws
        elems = svg.selectAll(".node")
          .data(nodes)

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
          .attr("class", "now")
          .text (d) -> #[TODO] work?
            ""
          .attr(text_attr)
          .style(text_style)
          .attr("fill", "yellow")

        appended.append("text")
          .attr("class", "ts")
          .attr("dy", "-1.5em")
          .text (d) ->
            ""
          .attr(text_attr)
          .style(text_style)

        appended.append("text")
          .attr("class", "count")
          .text (d) ->
            ""
          .attr(text_attr)
          .style(text_style)
          .attr("fill", "gray")

        appended.append("text")
          .attr("class", "tuple")
          .text (d) -> #[TODO] work?
            ""
          .attr("font-size", "24")
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
            if d.tuple && make_key(d.tuple, 2) == updated_key then "white" else color(i)
          .attr "fill-opacity", (d, i) ->
            if d.tuple && make_key(d.tuple, 2) == updated_key then 0.8 else 0.3
          .transition()
          .duration(300)
          .attr "fill", (d, i) =>
            color(i)
          .attr("fill-opacity", 0.3)
          .attr "r", (d) ->
            d.r

        elems.select(".tuple").each (d) ->
          this.textContent = "[#{d.tuple.slice(0, if d.tuple[0] == "wind" || d.tuple[0] == "saykana" then 1 else 2).join(', ')}]" if d.tuple

        elems.select(".now").each (d) ->
          $(this).attr("dy", "#{d.r-30}px")
          #this.textContent = "[#{d.tuple.join(', ')}]" if d.tuple

        elems.select(".count").each (d) ->
          this.textContent = "count: #{d.count}" if d.tuple
          $(this).attr("dy", "#{d.r-30}px")

        elems.select(".ts").each (d) ->
          this.textContent = d.ts if d.ts

    data = {
      key: "linda.masuilab.org"
      children: []
    }

    # tuple
    for ts in tuple_spaces
      data.children.push
        key: ts
        children: []

    for ts in tuple_spaces
      watch_ts(new linda.TupleSpace(ts))
