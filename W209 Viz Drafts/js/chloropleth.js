var load_map = function(data){
	var yr = 2016;
	var parseDate = d3.time.format("%Y"),
		yAxisFormat = d3.format(".2s"),
		formatValue = d3.format(",.2f"),
		formatCurrency = function(d) { return "$" + formatValue(d); }
	var years = d3.map(data,function(d){return d.NextElection}).keys();
	console.log(years);
	
	var state_data = d3.map();
    data.forEach(function(d){
		state_data.set(d.State,+d.Contribution);
	});
	console.log(state_data);
	
	var colors = colorbrewer.RdBu[11];
	var quantize = d3.scale.quantize()
    .domain([0,d3.max(data,function(d){return d.Contribution})])
    .range(colors);
	
	var projection = d3.geo.albersUsa()
    .scale(1000)
    .translate([width / 2, height / 2]);
		
	var path = d3.geo.path()
		.projection(projection);

	d3.json("../data/states.json", function(error, us) {
	  if (error) return console.error(error);
	  console.log(us);
	
	
		
	//define state fill
	svg.selectAll(".state")
		.data(topojson.feature(us, us.objects.cb_2014_us_state_500k).features)
		.enter().append("path")
		.attr("class", function(d,i) { return "state " + d.id; })
		.attr("d", path)
		.style("fill",function(d){
			var state = d.id;
			return quantize(state_data.get(state));
		})
		.style("stroke","none");
		
	//define state inner boundaries (accounts for duplicate boundaries)
	svg.append("path")
		.datum(topojson.mesh(us, us.objects.cb_2014_us_state_500k, function(a, b) { return a !== b; }))
		.attr("d", path)
		.attr("class", "boundary")
		.style("stroke","black")
		.style("stroke-width","1px");
	
	//define state outer boundaries (accounts for duplicate boundaries)
	svg.append("path")
		.datum(topojson.mesh(us, us.objects.cb_2014_us_state_500k, function(a, b) { return a === b; }))
		.attr("d", path)
		.attr("class", "boundary")
		.style("stroke","black")
		.style("stroke-width","1px");

	svg.append("g")
		.attr("class", "legendQuant")
		.attr("transform", "translate(20,20)");

	var legend = d3.legend.color()
		.labelFormat(formatCurrency)
		.useClass(false)
		.scale(quantize);

	svg.select(".legendQuant")
		.call(legend);
	});

}

var load_recent_data = function(){
	
	
	var xmlhttp = new XMLHttpRequest();
	try {
		//query with api key 1
		var query="https://api.open.fec.gov/v1/schedules/schedule_a/by_state/?api_key=" + api1 + "&sort_nulls_large=true&page=1&cycle=2016&per_page=100"
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				var fec_data = JSON.parse(xmlhttp.responseText);
			}
			console.log(fec_data);
		};

	xmlhttp.open("GET", query, true);
	xmlhttp.send();
		} catch(err){
			console.log(err);
		}
		
	
}

//loads schedule a data
var load_sched_a_data = function(){
	d3.csv("./data/sched_a_by_state_2007-2015_to_pg5.json",function(data){
		try{
			dataset = data;
			/*
			//adjust cycle for election year
			dataset.map(function(d){
				if (d.cycle % 4 == 2){
					d.cycle = d.cycle + (d.cycle % 4);
				}
			});
			//group contribution data by election, and state
			var electionYears = d3.nest()
				.key(function(d) { return d.cycle; })
				.key(function(d) { return d.state; })
				.rollup(function(leaves) { return {"length": leaves.length, "total_spending": d3.sum(leaves, function(d) {return parseFloat(d.total);})} })
				.entries(dataset);	
			//console.log(electionYears);
			*/
			console.log(dataset);
			load_map(dataset);

		}
		catch (err){
			console.log(err);
		}
	});
};


//svg for map
var width = 960,
    height = 1160;
	
var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var dataset;
//load_recent_data();
load_sched_a_data();

