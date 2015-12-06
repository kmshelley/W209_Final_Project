d3.custom.horizontalBar = function () {
    var margin = {top: 40, right: 20, bottom: 20, left: 20, middle: 35},
        w = 760,
        h = 360,
        monthFormat = d3.time.format("%b"),
        monthYrFormat = d3.time.format("%b '%y"),
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
        xLeftAxis = d3.svg.axis().scale(xLeftScale).orient("top").tickSize(6, 0).ticks(4).tickFormat(formatCurrency),
        xRightAxis = d3.svg.axis().scale(xRightScale).orient("top").tickSize(6, 0).ticks(4).tickFormat(formatCurrency),
        yAxis = d3.svg.axis().scale(yScale).orient("left").tickSize(0, 0).tickFormat(monthFormat),

        rcolors = colorbrewer.Blues[5],
        lcolors = colorbrewer.Reds[5];

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-5, 0])
            .html(function(d) {
                return "<strong>"+ monthYrFormat(d.y)+": </strong><span style='color:#000000'>"+ d.name+" - " + formatCurrency (d.x1)+"</span>";
        });

    function chart(selection) {
        selection.each(function(data) {

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
            var rfields = d3.map(rightData, function(d){return d.name;}).keys();
            var lfields = d3.map(leftData, function(d){return d.name;}).keys();
            rcolorScale = d3.scale.ordinal().range(rcolors).domain(rfields); //scale for right colors
            lcolorScale = d3.scale.ordinal().range(lcolors).domain(lfields); //scale for left colors

            //********

            // place the y-axis in the middle of the chart
            //bars that grow from center to left
            xLeftScale
                .domain([0,d3.max(leftData.concat(rightData), xTotal)])
                .range([center_left,0]);
            //bars that grow from center to right
            xRightScale
                .domain([0,d3.max(leftData.concat(rightData), xTotal)])
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
            var g = svg.enter()// this only returns a non-empty selection when the chart is first initialized
                .append("svg")
                .attr("class", "horizontal bars")
                .append("g");

            //add the axes
            svg.append("g").attr("class", "x left axis");
            svg.append("g").attr("class", "x right axis");


            // Update the outer dimensions.
            svg .attr("width", w)
                .attr("height", h);

            svg.call(tip);

            // Update the inner dimensions.
            svg.selectAll("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            //**** BARS -- CENTER TO RIGHT ****
            //stacked bars, center to right
            g.selectAll("bar.right.stacked")
                .data(rightData)
                .enter()
                .append("rect")
                .attr("class","bar right stacked");

            svg.selectAll(".bar.right.stacked")
                .data(rightData)
                .attr("x", function(d) { return xRightScale(d.x0); })
                .attr("height", yScale.rangeBand())
                .attr("y", function(d) { return yScale(d.y); })
                .attr("width", function(d) { return xRightScale(d.x1) - xRightScale(d.x0); })
                .style("fill",function(d){ return rcolorScale(d.name); })
                .on("mouseover", tip.show)
                .on("mouseout", tip.hide);

            //**** BARS -- CENTER TO LEFT ****
            //stacked bars, center to right
            g.selectAll("bar.left.stacked")
                .data(leftData)
                .enter()
                .append("rect")
                .attr("class","bar left stacked");

            svg.selectAll(".bar.left.stacked")
                .data(leftData)
                .attr("x", function(d) { return xLeftScale(d.x1); })
                .attr("height", yScale.rangeBand())
                .attr("y", function(d) { return yScale(d.y); })
                .attr("width", function(d) { return xLeftScale(d.x0) - xLeftScale(d.x1); })
                .style("fill",function(d){ return lcolorScale(d.name); })
                .on("mouseover", tip.show)
                .on("mouseout", tip.hide);


            //**** AXES ****
            // Update the x-axes.
            svg.select(".x.left.axis")
                .call(xLeftAxis);

            // Update the x-axes.
            svg.select(".x.right.axis")
                .call(xRightAxis);

            g.selectAll("y.labels")
                .data(data)
                .enter() // return the selection of data with no elements yet bound
                .append("g")
                .attr("class", "y labels")
                .append("text")
                .text(function(d){
                    if(yValue(d).getMonth()==0){ return monthYrFormat(yValue(d)); }
                    else{ return monthFormat(yValue(d)) }
                })
                .attr("x", center)
                .attr("y", function(d) { return yScale(yValue(d)) + yScale.rangeBand(); })
                //.attr("transform", "translate(0," + margin.top + ")")
                .style("text-anchor", "middle")
                .style("font-size","10px");

            svg.selectAll("receipts.label")
                .data([data])
                .enter() // return the selection of data with no elements yet bound
                .append("g")
                .attr("class", "receipts label")
                .append("text")
                .text("Receipts")
                .attr("x", margin.left)
                .attr("y", 10)
                .style("text-anchor", "start")
                .style("font-size","10px");

            svg.selectAll("disbursements.label")
                .data([data])
                .enter() // return the selection of data with no elements yet bound
                .append("g")
                .attr("class", "disbursements label")
                .append("text")
                .text("Disbursements")
                .attr("x", width)
                .attr("y", 10)
                .style("text-anchor", "end")
                .style("font-size","10px");


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
