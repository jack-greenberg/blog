function styleSvg(svg) {
    svg.attr('height', 400)
        .attr('width', "90%");
}

function xyGraph(svg, xBounds, yBounds) {
    const margin = {
        top: 10,
        right: 40,
        bottom: 30,
        left: 30,
    };

    var g = svg.append('g')
        .attr('transform',
            'translate(' +
                margin.left + ',' +
                margin.top +
            ')'
        );

    var x = d3.scaleLinear()
        .domain(xBounds)
        .range([0, 450 - margin.left - margin.right]);

    var y = d3.scaleLinear()
        .domain(yBounds)
        .range([400 - margin.top - margin.bottom, 0]);

    g.append('g')
        .attr('transform',
            'translate(0,' +
                (400 - margin.top - margin.bottom) +
            ')'
        )
        .call(d3.axisBottom(x));

    g.append('g')
        .call(d3.axisLeft(y));

    return {
        graph: g,
        x: x,
        y: y,
    };
}
