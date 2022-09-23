---
title: "Test Page"
date: 2021-07-27T14:13:50-07:00
toc: false
draft: true
---

Testing out some things on this page. If you see it, feel free to ignore it.

{{<message from="me">}}Hey what was the name of the restaurant you were
telling me about?{{</message>}}

{{<message from="me">}}Test{{</message>}}

{{<message from="you">}}Hey how's it going?{{</message>}}

{{<message from="me" read="">}}You didn't answer...{{</message>}}

Here you should see an emoji: :tada:.

```rust {linenos=table,hl_lines=["2-3"],linenostart=199}
trait CAN {
    fn send() -> Result<(), CanErr>;
    fn receive() -> CanMessage;
}
```

Here's a line break!

---

And an image:

![](/images/block.svg)

And then some more text and a graph.

{{<d3 id="asdf">}}
styleSvg(svg);
var axes = xyGraph(svg, [0, 10], [0, 10]);

var data = [ {x:1, y:2}, {x:4, y:9}, {x:8, y:5} ];

axes['graph'].selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
        .attr("cx", function(d){ return axes['x'](d.x) })
        .attr("cy", function(d){ return axes['y'](d.y) })
        .attr("r", 7)
{{</d3>}}
