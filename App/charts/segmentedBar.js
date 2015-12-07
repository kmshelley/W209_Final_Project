d3.custom.segmentedBar = function () {

    var margin = {top: 20, right: 30, bottom: 20, left: 30, middle: 25},
        w = 1000,
        h = 200,
        bar_height = 75,
        formatValue = d3.format(".2s"),
        formatCurrency = function(d) { return "$" + formatValue(d); },
        dVal = function(d) { return +d.total; },
        dCategory = function (d) { return d.size; },
        wScale = d3.scale.linear(),
        colors = colorbrewer.Blues[5],
        formatValue = d3.format(".2s"),
        formatCurrency = function(d) { return "$" + formatValue(d); },
        categories = {"0":"$200 and under", "200": "$200 - $499", "500":"$500 - $999", "1000":"$1000 - $1999","2000":"$2000+" };

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
                return "<strong>"+ categories[dCategory(d)] +": </strong><span style='color:#000000'>"+ formatCurrency(dVal(d))+"</span>";
            });
    
    var alpha = 0.5,
        spacing = 10;

    function relax(element) {
	    again = false;
	    element.each(function (d, i) {
		a = this;
		da = d3.select(a);
		x1 = da.attr("x");
		element.each(function (d, j) {
		    b = this;
		    // a & b are the same element and don't collide.
		    if (a == b) return;
		    db = d3.select(b);
		    // a & b are on opposite sides of the chart and
		    // don't collide
		    if (da.attr("y") != db.attr("y")) return;
		    // Now let's calculate the distance between
		    // these elements. 
		    x2 = db.attr("x");
		    deltaX = x1 - x2;
		    // If spacing is greater than our specified spacing,
		    // they don't collide.
		    if (Math.abs(deltaX) > spacing) return;
		    
		    // If the labels collide, we'll push each 
		    // of the two labels up and down a little bit.
		    again = true;
		    sign = deltaX > 0 ? 1 : -1;
		    adjust = sign * alpha;
		    da.attr("x",+x1 + adjust);
		    db.attr("x",+x2 - adjust);
		});
	    });
	    // Adjust our line leaders here
	    // so that they follow the labels. 
	    if(again) {
		setTimeout(relax,20)
	    }
	};


    function chart(selection) {
        selection.each(function(data) {

            var width = w - margin.left - margin.height,
                height = h - margin.top - margin.bottom,
                hcenter = h/ 2, //center from top
                left = margin.left,
                right = (w - margin.right),
                colorScale = d3.scale.ordinal().range(colors);


            //**** SCALES ****
            //update the width scale
            wScale
                .domain([0,d3.map(data,dVal).keys().reduce(function(a,b){ return +a + +b; })]) //domain is from 0 to overall total of contributions
                .range([left,right]);

            //update the color scale
            colorScale.domain(d3.map(data,dCategory).keys());

            //**** FORMAT THE DATA FOR SEGMENTED CHART ***
            data.sort(function(a,b) { return +dCategory(a) - +dCategory(b); });
            var x0 = 0;
            data.forEach(function(d){
                d.x0 = x0;
                d.x1 = x0 += dVal(d);
            });

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

            svg.call(tip);


            //**** BARS -- CENTER TO RIGHT ****
            var bar = g.selectAll("bar.seg").data(data);
            var legend = g.selectAll("legend").data(data);

            //segmented bar
            bar
                .enter() // return the selection of data with no elements yet bound
                .append("rect")
                .attr("class","bar seg");

            svg.selectAll(".bar.seg")
                .data(data)
                .transition()
                .duration(300)
                .attr("x", function(d) { return wScale(d.x0); })
                .attr("height", bar_height);

            svg.selectAll(".bar.seg")
                .attr("y", hcenter)
                .attr("width", function(d) { return wScale(d.x1) - wScale(d.x0); })
                .style("fill",function(d) { return colorScale(dCategory(d)); })
                .on("mouseover", tip.show)
                .on("mouseout", tip.hide);

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
            
            //relax(<*what do we pass here?*>);

        });
    }

    chart.w = function(_x) {
        if (!arguments.length) return w;
        w = parseInt(_x);
        return this;
    };

    chart.h = function(_x) {
        if (!arguments.length) return h;
        h = parseInt(_x);
        return this;
    };

    chart.bar_height = function(_x) {
        if (!arguments.length) return bar_height;
        bar_height = parseInt(_x);
        return this;
    };

    chart.colors = function(_x) {
        if (!arguments.length) return colors;
        colors = _x;
        return this;
    };

    return chart;
};
