function chloropleth() {

	var margin = {top: 20, right: 20, bottom: 20, left: 20},
		width = 960,
		height = 500,
		xValue = function(d) { return d.id; }, //*********NEED TO MAKE THIS MORE GENERIC
		yValue = function(d) { return d.properties.total; }, //*********NEED TO MAKE THIS MORE GENERIC
		formatValue = d3.format(".2s"),
		formatCurrency = function(d) { return "$" + formatValue(d); },
		colors = colorbrewer.Greens[7];
		
		var projection = d3.geo.albersUsa()
			.scale(1000)
			.translate([width / 2, height / 2]);

		var path = d3.geo.path()
			.projection(projection);

	
  function chart(selection) {
    selection.each(function(data) {

		
		var quantize = d3.scale.quantize()
				.domain([0,d3.max(data,yValue)])
				.range(colors);
		
		var legend = d3.legend.color()
				.labelFormat(formatCurrency)
				.useClass(false)
				.scale(quantize);
			
		var svg = d3.select(this).selectAll("svg").data([data]);
		var g = svg.enter().append("svg").attr("class", "map").append("g");
		
		// Update the outer dimensions.
		svg .attr("width", width)
			.attr("height", height);
		
		var locs = g.selectAll("path").attr("class","loc").data(data);
		
			locs.enter().append("path");
			
			locs.style("fill",function(d){ 
					//console.log(xValue(d) + ": " + quantize(yValue(d)));
					return quantize(yValue(d)); 
				})
				.style("stroke","white")
				.attr("d",path);
		
		
		svg.append("g")
			.attr("class", "legendQuant")
			.attr("transform", "translate(10,10)");

		svg.select(".legendQuant")
			.call(legend);
	});
  }

	return chart;
}