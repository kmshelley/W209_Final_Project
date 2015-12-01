d3.custom.choropleth = function () {

	var width = 960,
		height = 500,
		yValue = function(d) { return d.properties.total; }, //*********NEED TO MAKE THIS MORE GENERIC
		formatValue = d3.format(".2s"),
		formatCurrency = function(d) { return "$" + formatValue(d); },
		colors = colorbrewer.Greens[7];

	var projection = d3.geo.albersUsa();
	var path = d3.geo.path().projection(projection);
	var quantize = d3.scale.quantize();
	
	var legend = d3.legend.color()
        .labelFormat(formatCurrency)
        .useClass(false);

	function chart(selection) {
		selection.each(function(data) {

            projection.scale(width).translate([width / 2, height / 2]);
			quantize.domain([0,d3.max(data,yValue)]).range(colors);
            legend.scale(quantize);
			
			var svg = d3.select(this)
                .selectAll("svg")
                .data([data]);

            // Enter actions: these are applied to data selections with no elements existing yet
            // As a result, they are performed on 'g', which is an enter selection:
			var g = svg.enter()// this only returns a non-empty selection when the chart is first initialized
                .append("svg")
                .attr("class", "map")
                .append("g");

			g.selectAll("path")
				.data(data)
				.enter() // return the selection of data with no elements yet bound
				.append("path")  // add the projection path elements
				.attr("class","loc");

            // Update actions: these are applied to element selections that are already bound to data
            // As a result they are performed on 'svg' which is an update selection:
            svg .attr("width", width)  // Update the outer dimensions.
				.attr("height", height);

			svg.selectAll(".loc")
				.data(data)
				.style("fill",function(d){ return quantize(yValue(d)); })
				.style("stroke","white")
				.attr("d", path);

			svg.append("g")
				.attr("class", "legendQuant")
				.attr("transform", "translate(10,10)");

			svg.select(".legendQuant")
				.call(legend);
		});
	}

    chart.width = function(_x) {
        if (!arguments.length || arguments===null) return width;
        width = parseInt(_x);
        return this;
    };

	chart.height = function(_x) {
        if (!arguments.length || arguments===null) return height;
        height = parseInt(_x);
        return this;
    };

	return chart;
};