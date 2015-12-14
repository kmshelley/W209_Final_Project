d3.custom.horizontalBar = function () {
    var margin = {top: 40, right: 50, bottom: 20, left: 20, middle: 35},
        w = 760,
        h = 360,
        monthFormat = d3.time.format("%b"),
        monthYrFormat = d3.time.format("%b '%y"),
        formatValue = d3.format(".2s"),
        formatCurrency = function(d) { return "$" + formatValue(d); },

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
        xLeftAxis = d3.svg.axis().scale(xLeftScale).orient("top").tickSize(6, 0).ticks(4).tickFormat(formatCurrency),
        xRightAxis = d3.svg.axis().scale(xRightScale).orient("top").tickSize(6, 0).ticks(4).tickFormat(formatCurrency);
        colors = null;

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-5, 0])
            .html(function(d) {
                return "<strong>"+ monthYrFormat(d.y)+": </strong><span style='color:#000000'>"+ d.name+" - " + formatCurrency (d.x1 - d.x0)+"</span>";
        });

		
    function chart(selection) {
        selection.each(function(d) {
            var data = d[0];
            var domainMax = d[1];
            var pos = d[2];

            var width = w - margin.left - margin.right,
                height = h - margin.top - margin.bottom,
                center = width/2,
                center_right = center + margin.middle/2,
                center_left = center - margin.middle/2;

            //**** FORMAT THE DATA FOR STACKED CHARTS ***
            //map the data to best format for update-able stacked bar chart
            data.forEach(function(d) {
                var lx0 = 0;
                y = yValue(d);

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
            var fields = d3.map(rightData.concat(leftData), function(d){return d.name;}).keys();
            if (colors){
                var color = d3.scale.ordinal().range(colors).domain(fields);
            } else {
                var color = d3.scale.category20().domain(fields);
            }


            //********

            // place the y-axis in the middle of the chart
            //bars that grow from center to left
            domainMax[pos] = d3.max(leftData.concat(rightData), xTotal);
            var maxes = Object.keys(domainMax).map(function (key) { return domainMax[key]; });
            var dMax = d3.max(maxes);

            xLeftScale
                .domain([0, dMax])
                .range([center_left,0]);
            //bars that grow from center to right
            xRightScale
                .domain([0, dMax])
                .range([center_right,width]);

            // Update the y-scale.
            yScale
                .domain(data.map(yValue))
                .rangeBands([0,height],0.1);

            var svg = d3.select(this)
                .selectAll("svg")
                .data([data]);

            // Enter actions: these are applied to data selections with no elements existing yet
            // As a result, they are performed on 'g', which is an enter selection:
            var gEnter = svg.enter()// this only returns a non-empty selection when the chart is first initialized
                .append("svg")
                .attr("class", "horizontal bars")
                .append("g");

            //add the axes
			gEnter.append("g").attr("class", "x left axis");
            gEnter.append("g").attr("class", "x right axis");


            // Update the outer dimensions.
            svg .attr("width", w)
                .attr("height", h);

            svg.call(tip);

            // Update the inner dimensions.
            var g = svg.select("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            //**** BARS -- CENTER TO RIGHT ****
            //stacked bars, center to right

            g.selectAll(".bar.right.stacked").data(rightData).exit().remove();

            g.selectAll(".bar.right.stacked")
                .data(rightData)
                .enter()
                .append("rect")
                .attr("class","bar right stacked");

            g.selectAll(".bar.right.stacked")
                .data(rightData)
                .transition()
                .duration(300)
                .attr("x", function(d) { return xRightScale(d.x0); })
                .attr("height", yScale.rangeBand());

            g.selectAll(".bar.right.stacked")
                .data(rightData)
                .attr("y", function(d) { return yScale(d.y); })
                .attr("width", function(d) { return xRightScale(d.x1) - xRightScale(d.x0); })
                .style("fill",function(d){ return color(d.name); })
                .on("mouseover", tip.show)
                .on("mouseout", tip.hide);

            //**** BARS -- CENTER TO LEFT ****
            //stacked bars, center to right
            g.selectAll(".bar.left.stacked").data(leftData).exit().remove();

            g.selectAll(".bar.left.stacked")
                .data(leftData)
                .enter()
                .append("rect")
                .attr("class","bar left stacked");

            g.selectAll(".bar.left.stacked")
                .data(leftData)
                .transition()
                .duration(300)
                .attr("x", function(d) { return xLeftScale(d.x1); })
                .attr("height", yScale.rangeBand());

            g.selectAll(".bar.left.stacked")
                .attr("y", function(d) { return yScale(d.y); })
                .data(leftData)
                .attr("width", function(d) { return xLeftScale(d.x0) - xLeftScale(d.x1); })
                .style("fill",function(d){ return color(d.name); })
                .on("mouseover", tip.show)
                .on("mouseout", tip.hide);

            //**** AXES ****
            // Update the x-axes.
            svg.select(".x.left.axis")
                .call(xLeftAxis);

            // Update the x-axes.
            svg.select(".x.right.axis")
                .call(xRightAxis);

            g.selectAll(".y.labels")
                .data(data)
                .enter() // return the selection of data with no elements yet bound
                .append("text")
                .attr("class", "y labels");

            g.selectAll(".y.labels")
                .data(data)
                .text(function(d){
                    if(yValue(d).getMonth()==0){ return monthYrFormat(yValue(d)); }
                    else{ return monthFormat(yValue(d)) }
                })
                .attr("x", center)
                .attr("y", function(d) { return yScale(yValue(d)) + yScale.rangeBand(); })
                .style("text-anchor", "middle")
                .style("font-size","10px");

            svg.selectAll(".receipts.label")
                .data([data])
                .enter() // return the selection of data with no elements yet bound
                .append("text")
                .attr("class", "receipts label");

            svg.selectAll(".receipts.label")
                .data([data])
                .text("Receipts")
                .attr("x", margin.left)
                .attr("y", 10)
                .style("text-anchor", "start")
                .style("font-size","10px");

            svg.selectAll(".disbursements.label")
                .data([data])
                .enter() // return the selection of data with no elements yet bound
                .append("text")
                .attr("class", "disbursements label")

            svg.selectAll(".disbursements.label")
                .data([data])
                .text("Disbursements")
                .attr("x", width)
                .attr("y", 10)
                .style("text-anchor", "end")
                .style("font-size","10px");


            svg.selectAll(".legend")
                .data(color.domain().slice().reverse())
                .exit()
                .remove();

            var legend = svg.selectAll(".legend")
                .data(color.domain().slice().reverse())
                .enter()
                .append("g")
                .attr("class", "legend")
                .attr("transform", function(d, i) { return "translate(0," + (margin.top + (i * 15)) + ")"; });

            legend.append("rect")
                .attr("x", w - 13)
                .attr("width", 13)
                .attr("height", 13);

            svg.selectAll(".legend rect")
                .data(color.domain().slice().reverse())
                .style("fill", color);

            legend.append("text")
                .attr("x", w - 22)
                .attr("y", 9)
                .attr("dy", ".35em");

            svg.selectAll(".legend text")
                .data(color.domain().slice().reverse())
                .style("text-anchor", "end")
                .style("font-size","9px")
                .text(function(d) { return d; });

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

    chart.colors = function(_x) {
        if (!arguments.length) return colors;
        colors = _x;
        return this;
    };

    return chart;
};
