d3.custom.choropleth = function () {

	var margin = {top: 20, right: 20, bottom: 20, left: 20},
		width = 960,
		height = 500,
		xValue = function(d) { return d.id; }, 
		yValue = function(d) { return d.properties.total; }, //*********NEED TO MAKE THIS MORE GENERIC
		formatValue = d3.format(".2s"),
		formatCurrency = function(d) { return "$" + formatValue(d); },
		colors = colorbrewer.Greens[7];

	var projection = d3.geo.albersUsa()
		.scale(1000)
		.translate([width / 2, height / 2]);

	var path = d3.geo.path()
		.projection(projection);

	var quantize = d3.scale.quantize();
	
	var legend = d3.legend.color()
        .labelFormat(formatCurrency)
        .useClass(false);

	function chart(selection) {
		selection.each(function(data) {

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

	return chart;
}