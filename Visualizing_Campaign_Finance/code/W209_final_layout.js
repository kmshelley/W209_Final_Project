
//loads page text
var load_title_and_layout = function(n){
	//Page title and subtitle and sections for each viz and write-up
	
	d3.select("body").append("section")
		.attr("class","title_container")
		.attr("id","title")
		.attr("width", title_w)
		.attr("height", title_h);
		
	var title = d3.select("#title").append("h1")
		
	title.append("text")
		.text("The Price of a US Presidential Election")
		.style("font","cambria")
		.style("font-size","24px")
		.style("text-align","center")
		.style("color","rgb(150,150,150)");
	
	var subtitle = d3.select("#title").append("h2");

	subtitle.append("text")
		.text("Charles Maalouf, Janak Mayer, Tom Kunicki, Katherine Shelley")
		.style("font","cambria")
		.style("font-size","16px")
		.style("text-align","center")
		.style("color","rgb(150,150,150)");
	
	//Short description of data visualization
	var description = d3.select("#title").append("p");

	description.append("text")
		.text("The purpose of this visualization is to walk the viewer through the complicated " +
				"world of campaign financing in the United States with specific emphasis on Presidential elections. " +
				"All data in this visualization comes from the Federal Election Commision (www.fec.gov). " + 
				"Each section delves into a different area of campaign financing, with interactive features that " + 
				"allow for filtering and summarizing in order to enhance understanding.")
		.style("font","cambria")
		.style("font-size","14px")
		.style("text-align","justified")
		.style("color","rgb(130,130,130)");
	
	//diplay navigation bar
	var text_svg = load_main(4);
	
	/*
	for (i = 1; i < n+1; i++){
		d3.select("body").append("section")
		.attr("class","main_container")
		.attr("id","section_" + i)
	}*/
};

//loads main body of viz
var load_main = function(n){
	d3.select("body").append("div")
		.attr("class","main_container")
		.attr("id","main")
		.style("height",n*100 + "%"); //change the height of the main body to n screen heights
	
	var main_h = Number(d3.select("#main").style("height").replace("px",""));
	
	load_navigation();
	


	d3.select("#main").append("div")
		.attr("class","viz_container")
		.attr("id","visualization");
		
	for (i = 1; i < n+1; i++){
		var div = d3.selectAll("#visualization").append("div")
		var svg = div.append("svg")
		.attr("width", viz_w)
		.attr("height", main_h/4)
		.attr("id","viz_" + i + "_svg");
		
		svg.append("rect")
			.attr("width", viz_w)
			.attr("height", main_h/4)
			.attr("fill","white")
			.attr("stoke","black");
			
	}
	
};

var load_navigation = function(){
	//loads the navigation bar
	//viz sections
	var sections = ["Contributions","Individuals","PACs and Super PACs","Candidates"];
	
	//define height of main div
	var main_h = Number(d3.select("#main").style("height").replace("px",""));
	
	var nav = d3.select("#main").append("div")
		.attr("class","text_container")
		.attr("id","navigation");
	
	console.log(d3.selectAll("#main").style("height"));
	
	var nav_svg = nav.append("svg");
	
	nav_svg.append("rect")
		.attr("x",0)
		.attr("y",0)
		.attr("rx",10)
		.attr("ry",10)
		.style("fill","rgb(0,66,124)")
		.attr("height",main_h)
		.attr("width",text_w);
		
	nav_svg.append("path")
		.attr("d","M" + (text_w/2) + " 50 V" + (text_w/2) + " " + (main_h - 50))
		.attr("stroke","rgb(150,150,150")
		.attr("stroke-width","30px")
		.attr("stroke-linecap","round");
	
	nav_svg.append("path")
		.attr("d","M" + (text_w/2) + " 50 V" + (text_w/2) + " " + (main_h - 50))
		.attr("stroke","white")
		.attr("stroke-width","20px")
		.attr("stroke-linecap","round");
	
	sections.forEach(function(section,index){
		rect_attr = {
			id: section,
			fill: "white",
			stroke: "rgb(150,150,150)",
			stroke_width: "15px",
			x: text_w/4,
			y: (y/sections.length)*(index) + 50,
			rx:10,
			ry:10,
			height:text_w/6,
			width: text_w/2
		}
		nav_svg.append("rect").attr(rect_attr).append("text")
				.text(section)
				.style("font","cambria")
				.style("font-size","18px")
				.style("text-align","justified")
				.style("color","rgb(130,130,130)")
				.attr("x",10)
				.attr("y", 10);
		
	}); 
	
}

//loads svgs for text in nth position
var load_text_area = function(n){
	var margin = {top: 20, right: 20, bottom: 20, left: 20 },
		width = text_w - margin.left - margin.right,
		height = text_h - margin.top - margin.bottom;
		
	d3.select("#section_" + n).append("div")
		.attr("class","text_container")
		.attr("id","viz" + n + "_text")
		.attr("width", text_w)
		.attr("height", text_h);
				
	var text_svg = d3.selectAll("#viz" + n + "_text").append("div")
		.attr("width", text_w)
		.attr("height", text_h)
		.attr("transform", "translate(" + 0 + "," + title_h + text_h*(n-1) + ")");	
		
	return text_svg;
	
};

//loads svgs for viz in nth position
var load_viz_area = function(n){
	var margin = {top: 20, right: 20, bottom: 20, left: 20 },
		width = viz_w - margin.left - margin.right,
		height = viz_h - margin.top - margin.bottom;
		
	d3.select("#section_" + n).append("div")
		.attr("class","viz_container")
		.attr("id","viz" + n)
		.attr("width", viz_w)
		.attr("height", viz_h)
		
	var viz_div = d3.selectAll("#viz" + n).append("svg")
		.attr("width", viz_w)
		.attr("height", viz_h);
		//.attr("transform", "translate(" + text_w + "," + title_h + viz_h*(n-1) + ")");
	
	return viz_div;
	
};


var w = window,
    x = w.innerWidth,
    y = w.innerHeight,
	n = 4, //number of visualization sections
	title_h = y/2,
	title_w = x,
	main_w = x,
	//main_h = (y * n) - title_h ,
	viz_h = y - title_h,
	viz_w = main_w * (1.6/2.6),
	text_w = main_w - viz_w;

load_title_and_layout(n);