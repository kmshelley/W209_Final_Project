function segmentedBar() {
  var margin = {top: 20, right: 30, bottom: 20, left: 30, middle: 25},
      w = 760,
      h = w/5,
	  width = w - margin.left - margin.height,
	  height = h - margin.top - margin.bottom,
	  hcenter = 3*h/5; //center from top
	  left = margin.left,
	  right = (w - margin.right),	  
	  formatValue = d3.format(".2s"),
	  formatCurrency = function(d) { return "$" + formatValue(d); },
	  dVal = function(d) { return +d.total; },
	  dCategory = function (d) { return d.size; },
      wScale = d3.scale.linear(),
	  colorScale = d3.scale.category10(), //scale for colors
	  categories = {"0":"$200 and under", "200": "$200 - $499.99", "500":"$500 - $999.99", "1000":"$1000 - $1999.99","2000":"$2000 +" };
	  

  function chart(selection) {
    selection.each(function(data) {
		
	  //**** SCALES ****
	  //update the width scale
      wScale
          .domain([0,d3.map(data,dVal).keys().reduce(function(a,b){ return +a + +b; })]) //domain is from 0 to overall total of contributions
          .range([left,right]);
	  
	  //update the color scale
	  colorScale.domain(d3.map(data,dCategory).keys());
	  
	 //define the legend based on categories 
	  var legend = d3.legend.color()
        .useClass(false)
		.scale(colorScale)
		.labels(d3.values(categories));
	  //****	
	  
	  //**** FORMAT THE DATA FOR SEGMENTED CHART ***
	  //map the 
	  data.sort(function(a,b) { return +dCategory(a) - +dCategory(b); });
	  var x0 = 0;
	  data.forEach(function(d){
		  d.x0 = x0;
		  d.x1 = x0 += dVal(d);
	  });
	  //********
	 
      var svg = d3.select(this)
                .selectAll("svg")
                .data([data]);

	// Enter actions: these are applied to data selections with no elements existing yet
	// As a result, they are performed on 'g', which is an enter selection:
	  var g = svg.enter()// this only returns a non-empty selection when the chart is first initialized
		.append("svg")
		.attr("class", "segmented bar")
		.append("g");
		
      // Update the outer dimensions.
      svg .attr("width", w)
          .attr("height", h);
	 
	  //**** BARS -- CENTER TO RIGHT ****   
      var bar = g.selectAll("bar.seg").data(data)
	  
	  //segmented bar
	  bar	
		.enter() // return the selection of data with no elements yet bound
		.append("rect")  
		.attr("class","bar seg");	
	  
      svg.selectAll(".bar.seg")
		.data(data)
		.attr("x", function(d) { return wScale(d.x0); })
        .attr("height",height)
        .attr("y", hcenter)
        .attr("width", function(d) { return wScale(d.x1) - wScale(d.x0); })
		.style("fill",function(d) { return colorScale(dCategory(d)); });
	
	  
	  //add the legend	
	  svg.append("svg")
		.attr("class", "legendColor")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	  svg.select(".legendColor")
		.call(legend);
		  
    });
  }

 

  return chart;
}