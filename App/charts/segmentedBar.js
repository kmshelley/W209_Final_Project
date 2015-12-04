d3.custom.segmentedBar = function () {
	
    var margin = {top: 20, right: 30, bottom: 20, left: 30, middle: 25},
      w = 1000,
      h = 200,
	  width = w - margin.left - margin.height,
	  height = h - margin.top - margin.bottom,
	  hcenter = h/2; //center from top
	  bar_height = 75,
	  left = margin.left,
	  right = (w - margin.right),	  
	  formatValue = d3.format(".2s"),
	  formatCurrency = function(d) { return "$" + formatValue(d); },
	  dVal = function(d) { return +d.total; },
	  dCategory = function (d) { return d.size; },
      wScale = d3.scale.linear(),
	  colorScale = d3.scale.category10(), //scale for colors
	  categories = {"0":"$200 and under", "200": "$200 - $499", "500":"$500 - $999", "1000":"$1000 - $1999","2000":"$2000+" };
	  

  function chart(selection) {
    selection.each(function(data) {
	  //**** SCALES ****
	  //update the width scale
      wScale
          .domain([0,d3.map(data,dVal).keys().reduce(function(a,b){ return +a + +b; })]) //domain is from 0 to overall total of contributions
          .range([left,right]);
	  
	  //update the color scale
	  colorScale.domain(d3.map(data,dCategory).keys());
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
      var bar = g.selectAll("bar.seg").data(data);
	  var legend = g.selectAll("legend").data(data)
	  
	  //segmented bar
	  bar	
		.enter() // return the selection of data with no elements yet bound
		.append("rect")  
		.attr("class","bar seg");	
	  
      svg.selectAll(".bar.seg")
		.data(data)
		.attr("x", function(d) { return wScale(d.x0); })
        .attr("height",75)
        .attr("y", hcenter)
        .attr("width", function(d) { return wScale(d.x1) - wScale(d.x0); })
		.style("fill",function(d) { return colorScale(dCategory(d)); });
	
	  legend	
		.enter() // return the selection of data with no elements yet bound
		.append("text")  
		.attr("class","legend");	
	  
      svg.selectAll(".legend")
		.data(data)
		.text(function(d){ return categories[dCategory(d)]; })
		.attr("x", function(d) { return wScale(d.x0); })
		.attr("y", function(d,i){ 
			if (i%2 === 0){
				return hcenter - 5;
			}else{
				return hcenter + bar_height + 10; 
			}
		})
		.style("fill",function(d) { return colorScale(dCategory(d)); })
		.style("font-size","10px");
		  
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