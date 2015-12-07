d3.custom.choropleth = function () {

    var width = 960,
        height = 500,
        scale = 1000,
        yValue = function(d) { return d.properties.total; }, //*********NEED TO MAKE THIS MORE GENERIC
        yName = function(d) { return d.properties.name; }, //*********NEED TO MAKE THIS MORE GENERIC

        formatValue = d3.format(".2s"),
        formatCurrency = function(d) { return "$" + formatValue(d); },
        colors = colorbrewer.Greens[7];

    var projection = d3.geo.albersUsa();
    var path = d3.geo.path().projection(projection);
    var quantize = d3.scale.quantize();

    var legend = d3.legend.color()
        .labelFormat(formatCurrency)
        .useClass(false);

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .html(function(d) {
            return "<strong>"+ yName(d) +": </strong><span style='color:#000000'>" + formatCurrency(yValue(d)) + "</span>";
        });

    function chart(selection) {
        selection.each(function(d) {
            var data = d[0];
            var domainMax = d[1];
            var pos = d[2];

            domainMax[pos] = d3.max(data,yValue);
            var maxes = Object.keys(domainMax).map(function (key) { return domainMax[key]; });
            var dMax = d3.max(maxes);

            projection.scale(scale).translate([width / 2, height / 3]);
            quantize.domain([0,dMax]).range(colors);
            legend.scale(quantize);

            var svg = d3.select(this)
                .selectAll("svg")
                .data([data]);

            // Enter actions: these are applied to data selections with no elements existing yet
            // As a result, they are performed on 'g', which is an enter selection:
            svg.enter()// this only returns a non-empty selection when the chart is first initialized
                .append("svg")
                .attr("class", "map")
                .append("g");

            svg.selectAll(".loc").data(data).exit().remove();

            svg.selectAll(".loc")
                .data(data)
                .enter() // return the selection of data with no elements yet bound
                .append("path")  // add the projection path elements
                .attr("class","loc");

            // Update actions: these are applied to element selections that are already bound to data
            // As a result they are performed on 'svg' which is an update selection:
            svg .attr("width", width)  // Update the outer dimensions.
                .attr("height", height);

            svg.call(tip);

            svg.selectAll(".loc")
                .data(data)
                .style("stroke","#f5f5f5")  // Almost white, but still visible
                .attr("d", path)
                .on("mouseover", tip.show)
                .on("mouseout", tip.hide);

            svg.selectAll(".loc")
                .data(data)
                .transition()
                .duration(300)
                .style("fill",function(d){ return quantize(yValue(d)); });

            svg.append("g")
                .attr("class", "legendQuant")
                .attr("transform", "translate(5,"+(height/1.5)+")")
                .style("font-size","12px");

            svg.select(".legendQuant")
                .call(legend);
        });
    }

    chart.width = function(_x) {
        if (!arguments.length) return width;
        width = parseInt(_x);
        return this;
    };

    chart.height = function(_x) {
        if (!arguments.length) return height;
        height = parseInt(_x);
        return this;
    };

    chart.scale = function(_x) {
        if (!arguments.length) return scale;
        scale = parseInt(_x);
        return this;
    };

    chart.colors = function(_x) {
        if (!arguments.length) return colors;
        colors = _x;
        return this;
    };

    return chart;
};