function horizontalBar() {
//d3.custom.horizontalBar = function () {
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
		
		/*
			INPUT DATA FORMAT
			[
				{'date': date, 
				 'data': [
							{'cte_id': 'C00431445', name:'Obama For America', data: {"reciepts": amount, "expenditures": amount}},
							{'cte_id': 'C00495861', name:'Priorities USA Action', data: {"reciepts": amount, "expenditures": amount}},
							{'cte_id': 'C00010603', name:'DNC Services Corp', data: {"reciepts": amount, "expenditures": amount}}
						]
				}
			]
		*/
		//functions to access data
		xData = function(d) { return d.data; }, //access data for stacked bar mapping
		xName = function(d) { return d.name; },
		xLeftValue = function(d) { return +d.data.receipts; }, 	
		xRightValue = function(d) { return +d.data.expenditures; }, 
        yValue = function(d) { return new Date(d.date); },
		
		xLeft = function(d) { return d.left; },
        xRight = function(d) { return d.right; },
		xTotal = function(d) { return d.x1; }, 
		
        xLeftScale = d3.scale.linear(),
        xRightScale = d3.scale.linear(),
        yScale = d3.scale.ordinal(),
        xLeftAxis = d3.svg.axis().scale(xLeftScale).orient("top").tickSize(6, 0).tickFormat(formatCurrency),
        xRightAxis = d3.svg.axis().scale(xRightScale).orient("top").tickSize(6, 0).tickFormat(formatCurrency),
        yAxis = d3.svg.axis().scale(yScale).orient("left").tickSize(0, 0).tickFormat(monthFormat)
		
		rcolors = colorbrewer.Blues[5],
		lcolors = colorbrewer.Reds[5];

    function chart(selection) {
        selection.each(function(data) {
	
			//**** FORMAT THE DATA FOR STACKED CHARTS ***
            //map the data to best format for update-able stacked bar chart
            data.forEach(function(d) {
                var lx0 = 0;
				y = yValue(d)
				
                d.left = xData(d).map(function(dt) {
                    return {name: xName(dt), y: y, x0: lx0, x1: lx0 += +xLeftValue(dt)};
                });

                var rx0 = 0;
                d.right = xData(d).map(function(dt) {
                    return {name: xName(dt), y: y, x0: rx0, x1: rx0 += +xRightValue(dt)};
                });
            });
            //flatten the left and right data sets
            var leftVals = data.map(function(d){ return xLeft(d); });
            var rightVals = data.map(function(d){ return xRight(d); });
            var leftData = [].concat.apply([], leftVals);
            var rightData = [].concat.apply([], rightVals);
			
			//update color scales
			var rfields = d3.map(rightData, function(d){return d.name;}).keys()
			var lfields = d3.map(leftData, function(d){return d.name;}).keys()
			rcolorScale = d3.scale.ordinal().range(rcolors).domain(rfields); //scale for right colors
			lcolorScale = d3.scale.ordinal().range(lcolors).domain(lfields); //scale for left colors
			
            //********

            // place the y-axis in the middle of the chart
            //bars that grow from center to left
            xLeftScale
                .domain([0,d3.max(leftData, xTotal)])
                .range([center_left,left]);
            //bars that grow from center to right
            xRightScale
                .domain([0,d3.max(rightData, xTotal)])
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

            //**** BARS -- CENTER TO RIGHT ****
            var bar_r = g.selectAll("bar.right").data(data)
			
            //stacked bars, center to right
            var bar_r_stacked = g.selectAll("bar.right.stacked").data(rightData)

            bar_r_stacked
                .enter()
                .append("rect")
                .attr("class","bar right stacked");

            svg.selectAll(".bar.right.stacked")
                .data(rightData)
                .attr("x", function(d) { return xRightScale(d.x0); })
                .attr("height", yScale.rangeBand())
                .attr("y", function(d) { return yScale(d.y); })
                .attr("width", function(d) { return xRightScale(d.x1) - xRightScale(d.x0); })
                .style("fill",function(d){ return rcolorScale(d.name); });

            //**** BARS -- CENTER TO LEFT ****
            var bar_l = g.selectAll("bar.left").data(data)
			
            //stacked bars, center to right
            var bar_l_stacked = g.selectAll("bar.left.stacked").data(leftData)

            bar_l_stacked
                .enter()
                .append("rect")
                .attr("class","bar left stacked");

            svg.selectAll(".bar.left.stacked")
                .data(leftData)
                //.enter().append("rect")
                .attr("x", function(d) { return xLeftScale(d.x1); })
                .attr("height", yScale.rangeBand())
                .attr("y", function(d) { return yScale(d.y); })
                .attr("width", function(d) { return xLeftScale(d.x0) - xLeftScale(d.x1); })
                .style("fill",function(d){ return lcolorScale(d.name); });


            //**** AXES ****
            // Update the x-axes.
            svg.select(".x.left.axis")
                .attr("transform", "translate(0," + margin.top + ")")
                .call(xLeftAxis);

            // Update the x-axes.
            svg.select(".x.right.axis")
                .attr("transform", "translate(0," + margin.top + ")")
                .call(xRightAxis);

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

    chart.rcolors = function(_x) {
        if (!arguments.length) return rcolors;
        rcolors = _x;
        return this;
    };

	chart.lcolors = function(_x) {
        if (!arguments.length) return lcolors;
        lcolors = _x;
        return this;
    };


    return chart;
};