function horizontalBar() {
  var margin = {top: 20, right: 30, bottom: 20, left: 30, middle: 25},
      w = 760,
      h = 360,
	  width = w - margin.left - margin.height,
	  height = h - margin.top - margin.bottom,
	  left = margin.left,
	  right = (w - margin.right),
	  center = w/2,
	  center_right = center + margin.middle/2,
	  center_left = center - margin.middle/2,
	  monthFormat = d3.time.format("%b"),
	  formatValue = d3.format(".2s"),
	  formatCurrency = function(d) { return "$" + formatValue(d); },
	  xLeft = function(d) { return +d.raised}, //**** NEED TO update field names
      xRight = function(d) { return +d.spent; }, //**** NEED TO update field names
      yValue = function(d) { return new Date(d.date); }, //**** NEED TO update field names
      xLeftScale = d3.scale.linear(),
	  xRightScale = d3.scale.linear(),
      yScale = d3.scale.ordinal(),
      xLeftAxis = d3.svg.axis().scale(xLeftScale).orient("top").tickSize(6, 0).tickFormat(formatCurrency),
	  xRightAxis = d3.svg.axis().scale(xRightScale).orient("top").tickSize(6, 0).tickFormat(formatCurrency),
	  yAxis = d3.svg.axis().scale(yScale).orient("left").tickSize(0, 0).tickFormat(monthFormat);

  function chart(selection) {
    selection.each(function(data) {
	
	  // place the y-axis in the middle of the chart
	  //bars that grow from center to left
      xLeftScale
          .domain([0,d3.max(data, xLeft)])
          .range([center_left,left]);
	  //bars that grow from center to right
	  xRightScale
          .domain([0,d3.max(data, xRight)])
          .range([center_right,right]);
		  
      // Update the y-scale.
      yScale
          .domain(data.map(yValue))
          .rangeBands([margin.top,h - margin.bottom],0.1);

      var svg = d3.select(this)
                .selectAll("svg")
                .data([data]);

	  // Update the inner dimensions.
      svg.select("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		  
	// Enter actions: these are applied to data selections with no elements existing yet
	// As a result, they are performed on 'g', which is an enter selection:
	  var g = svg.enter()// this only returns a non-empty selection when the chart is first initialized
		.append("svg")
		.attr("class", "horizontal bars")
		.append("g");
	
	  //add the axes	
	  g.append("g").attr("class", "x left axis");
	  g.append("g").attr("class", "x right axis");
	  g.append("g").attr("class", "y labels");
	  
      // Update the outer dimensions.
      svg .attr("width", w)
          .attr("height", h);
	 
	  // Update the inner dimensions.
      svg.selectAll("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		  
	  //add bars (from center to right)    
      var bar_r = g.selectAll("bar.right").data(data)
	  //bar_r.exit().remove(); //for proper updating
	  bar_r	
		.enter() // return the selection of data with no elements yet bound
		.append("rect")  // add the projection path elements
		.attr("class","bar right")
		.style("fill", "rgba(120,0,0,0.6)");	
	  
      svg.selectAll(".bar.right")
		.data(data)
		.attr("x", center_right)
        .attr("height", yScale.rangeBand())
        .attr("y", function(d) { return yScale(yValue(d)); })
        .attr("width", function(d) { return xRightScale(xRight(d)) - center_right; });

	  //add bars (from center to left)  
      var bar_l = g.selectAll("bar.left").data(data)
	  //bar_l.exit().remove(); //for proper updating
	  bar_l
		.enter() // return the selection of data with no elements yet bound
		.append("rect")  
		.attr("class","bar left");
	  
	  //add bars (from center to left) 
      svg.selectAll(".bar.left")
		.data(data)
		.attr("class","bar left")
		.style("fill", "rgba(120,130,40,0.6)")
        .attr("x", function(d) { return xLeftScale(xLeft(d)); })
        .attr("height", yScale.rangeBand())
        .attr("y", function(d) { return yScale(yValue(d)); })
        .attr("width", function(d) { return center_left - xLeftScale(xLeft(d)); });
		  
	  
	  // Update the x-axes.
      svg.select(".x.left.axis")
          .attr("transform", "translate(0," + margin.top + ")")
          .call(xLeftAxis);
	
	  // Update the x-axes.
      svg.select(".x.right.axis")
          .attr("transform", "translate(0," + margin.top + ")")
          .call(xRightAxis);
		/*  
	  // Update the x-axes.
      svg.select(".y.axis")
          .attr("transform", "translate(" + center + ",0)")
		  .attr("stroke","none")
		  .call(yAxis);
		  */
	  var labels = g.selectAll("y.labels").data(data)
	  labels
		.enter() // return the selection of data with no elements yet bound
		.append("text")  
		.text(function(d){ return monthFormat(yValue(d)); })
		.attr("x",center)
		.attr("y", function(d) { return yScale(yValue(d)); })
		.attr("transform", "translate(0," + margin.top + ")")
		.style("text-anchor", "middle");
		 
		  
    });
  }

 

  return chart;
}