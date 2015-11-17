

var writeup_1 = function(){
	//displays write-up for time-series chart
	var margin = {top: 20, right: 10, bottom: 20, left: 10},
		width = text_w - margin.left - margin.right,
		height = text_h - margin.top - margin.bottom;
		
	var div = load_text_area(1);
	
	div.append("p")
		.text("Political Contributions")
		.style("font","cambria")
		.style("font-size","18px")
		.style("text-align","centered")
		.style("color","rgb(130,130,130)");
		//.attr("transform", "translate(" + margin.right + "," + margin.top + ")");
		
	div.append("p")
		.text("Political Contributions II")
		.style("font","cambria")
		.style("font-size","18px")
		.style("text-align","justified")
		.style("color","rgb(130,130,130)")
		.attr("transform", "translate(" + margin.right + "," + margin.top + ")");
		
};

var viz1 = function(){
	
};

var line_chart_1 = function(data){
	//Displays total contributions time series chart
	
	//group contribution data by election
	var electionYears = d3.nest()
		.key(function(d) {
			return d.NextElection;
		})
		.entries(data);	
	
	var parseDate = d3.time.format("%Y"),
		yAxisFormat = d3.format(".2s"),
		formatValue = d3.format(",.2f"),
		formatCurrency = function(d) { return "$" + formatValue(d); },
		duration = 2000; //duration for animations
	
	var margin = {top: 20, right: 50, bottom: 20, left: 50},
		width = viz_w - margin.left - margin.right,
		height = viz_h - margin.top - margin.bottom;
 
	var x = d3.time.scale()
			.rangeRound([margin.left, viz_w - margin.right])
			.domain([new Date("9/1/1903"),new Date("11/1/1904")]); //dates have been adjusted to "normalize" across election seasons
	
	//ordinal scale for month grouping
	var x1 = d3.scale.ordinal()
			.rangeBands([margin.left, viz_w - margin.right])
			.domain([new Date("9/1/1903"),new Date("11/1/1904")]);
			
	var y = d3.scale.linear()
		.range([height, 0])
		.domain([0,d3.max(data, function(d) { return d.Contribution; })+10000000]);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient('bottom')
		.ticks(d3.time.months, 1)
		.tickFormat(d3.time.format('%b'))
		.tickSize(0)
		.tickPadding(8);
	
	var yAxis = d3.svg.axis()
		.scale(y)
		.tickFormat(function(d){return yAxisFormat(d);})
		.orient("left");

	var color = "#a1d99b";
	var colors = colorbrewer.Greens[9];

	var line = d3.svg.line()
		.x(function(d) { return x(d.MonthAdj); })
		.y(function(d) { return y(d.Contribution); });
			
	var svg = d3.select("#viz_1_svg");
	
	//x-axis
	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(" + 0 + "," + height + ")")
		.call(xAxis);
		
	//y-axis
	svg.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(" + margin.left + "," + 0 + ")")
		.call(yAxis)
		.append("text")
		.attr("y", -20)
		.attr("x",-150)
		.attr("dy", ".71em")
		.style("text-anchor", "start")
		.text("Total Contributions");
	
	svg.append("clipPath")
		.attr("id","chart_clip")
		.append("rect")
		.attr("width", width)
		.attr("height", height)
		//.append("g")
		.attr("transform", "translate(" + margin.left + "," + 0 + ")");
	

	//iterate through the nested contribution data, chart the contribution data	
	electionYears.forEach(function(election,index){
		var electionDate = new Date(election.key)
		var dt = election.values;
		dt.sort(function(a, b) { return a.MonthAdj - b.MonthAdj; });
		
		var path = svg.append("g")
			.datum(dt)
			.append("path")
			.attr("class", "line")
			.attr("clip-path", "url(#chart_clip)")
			.attr("d", line)
			.style("stroke",colors[8])
			.style("stroke-width",2);

		var totalLength = path.node().getTotalLength();
		
		//animate the appearance of the lines (one after another)
		path
			.attr("stroke-dasharray", totalLength + " " + totalLength)
			.attr("stroke-dashoffset", totalLength)
			.transition()
			.delay(index * duration) //delay based on index of election year
			.each("end", function() {
			   d3.select(this)
					.transition()            
					.duration(duration/4)           
					.style("stroke", colors[4]);
			})
			.duration(duration)
			.ease("linear")
			.attr("stroke-dashoffset", 0);
	});
	
	//unhide circle and line tool-tip on hover
	var mouseover = function(d){
		d3.selectAll(".hover-" + d.MonthID)
			.style("opacity",1);
	};
	
	var mouseout = function(d){
		d3.selectAll(".hover-" + d.MonthID)
			.style("opacity",0);
		};
			
	var electionMonths = d3.nest()
		.key(function(d) {
			return d.MonthID;
		})
		.entries(data);
	
	//add group of rect and dots for highlighting
	electionMonths.forEach(function(month){
		//find the year with the largest contributions in this month
		var max_cont = d3.max(month.values,function(d){return d.Contribution;});
		var maxData = (month.values).filter(function(d){ if (d.Contribution === max_cont){return d};});
		
		//path and dot group
		var g = svg.append("g");
		
		//vertical line tool-tip
		var vline = g.selectAll("vline")
			.data(maxData)
			.enter()
			.append("line")
			.attr("class",function(d){return "vline hover-" + d.MonthID;})
			.attr("clip-path", "url(#chart_clip)")
			.attr("x1",function(d) { return x(d.MonthAdj); } )
			.attr("x2",function(d) { return x(d.MonthAdj); } )
			.attr("y1",function(d) { return y(d.Contribution); } )
			.attr("y2",height)
			.style("stroke",color)
			.style("stroke-width",2)
			.style("stroke-dasharray","1 1")
			.style("opacity",0);
		
		var dot = g.selectAll("circle") 
			.data(month.values)
			.enter()
			.append("circle")
			.attr("class",function(d){return "circle hover-" + d.MonthID;})
			.attr("clip-path", "url(#chart_clip)")
			.style("fill","none")
			.style("stroke",function(d,i){return colors[i];})
			.style("stroke-width",3)
			.style("opacity",0)
			.attr("cx",function(d) { return x(d.MonthAdj); } )
			.attr("cy",function(d) { return y(d.Contribution); } )
			.attr("r", 4)
			.attr("data-legend",function(d) { return parseDate(d.NextElection);});
		
		var text = g.selectAll("text")
			.data(maxData)
			.enter()
			.append("text")
			.attr("class", function(d){return "circle hover-" + d.MonthID;})
			.style("opacity",0)
			.attr("x",function(d) { return x(d.MonthAdj) + 10; } )
			.attr("y",function(d) { return y(d.Contribution); } )
			.text(function(d){return parseDate(d.NextElection) + "\n: " + formatCurrency(d.Contribution);});
			
		//add a single bar for hovering over every month
		var bar = g.selectAll(".bar")
			.data(maxData)
			.enter()
			.append("rect")
			//.transition()
			//.delay(duration*electionYears.length)//don't allow tool-tips to appear until animation is over
			.attr("class",function(d){return "bar hover-" + d.MonthID;})
			.attr("clip-path", "url(#chart_clip)")
			.attr("x",function(d) { return x(d.MonthAdj); } )
			.attr("y",0)
			.attr("width",width/20)
			.attr("height",height)
			.style("fill","none")
			.style("pointer-events","all")
			.on("mouseover",mouseover)
			.on("mouseout",mouseout);
	});

	
};


//loads the data
var load_data = function(){
	d3.csv("./data/all_contributions_1978-2015.csv",function(data){
		try{
			dataset = data;
			dataset.map(function(d){
			    d.Month = new Date(d.Month);
				d.MonthAdj = new Date(d.MonthAdj);
				d.NextElection = new Date(d.NextElection);
				d.Contribution = Number(d.Contribution);
			});
			//writeup_1(1);
			line_chart_1(dataset);
		}
		catch (err){
			console.log(err);
		}
	});
};
/*
var w = window,
    x = w.innerWidth,
    y = w.innerHeight,
	n = 4, //number of visualization sections
	title_h = 200,
	title_w = x,
	nav_h = (y - title_h) * n,
	nav_w = 100,
	main_w = x - nav_w,
	viz_h = y - title_h,
	viz_w = x * (1.6/2.6),
	text_h = viz_h,
	text_w = main_w - viz_w;
*/	
var dataset;
load_data();

