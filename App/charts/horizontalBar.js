d3.custom.horizontalBar = function () {
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
        right_color = "rgb(180,0,0)",
        left_color = "rgb(0,180,0)",
        monthFormat = d3.time.format("%b"),
        formatValue = d3.format(".2s"),
        formatCurrency = function(d) { return "$" + formatValue(d); },
        leftFields = ["principal_comm_raised","main_pac_raised"], //**** NEED TO update field names
        rightFields = ["principal_comm_spent","main_pac_spent"], //**** NEED TO update field names
        xLeftTotal = function(d) { return +d.total_raised; }, //**** NEED TO update field names
        xLeft = function(d) { return d.left; },
        xRightTotal = function(d){ return +d.total_spent; }, //**** NEED TO update field names
        xRight = function(d) { return d.right; },
        yValue = function(d) { return new Date(d.date); },
        xLeftScale = d3.scale.linear(),
        xRightScale = d3.scale.linear(),
        yScale = d3.scale.ordinal(),
        xLeftAxis = d3.svg.axis().scale(xLeftScale).orient("top").tickSize(6, 0).tickFormat(formatCurrency),
        xRightAxis = d3.svg.axis().scale(xRightScale).orient("top").tickSize(6, 0).tickFormat(formatCurrency),
        yAxis = d3.svg.axis().scale(yScale).orient("left").tickSize(0, 0).tickFormat(monthFormat);

    function chart(selection) {
        selection.each(function(data) {

            var lcolorScale = d3.scale.ordinal().range([1.0, 0.5]).domain(leftFields); //scale for color transparency
            var rcolorScale = d3.scale.ordinal().range([1.0, 0.5]).domain(rightFields); //scale for color transparency

            //**** FORMAT THE DATA FOR STACKED CHARTS ***
            //map the data to best format for update-able stacked bar chart

            data.forEach(function(d) {
                var lx0 = 0;
                d.left = lcolorScale.domain().map(function(name) {
                    return {name: name, y: yValue(d), x0: lx0, x1: lx0 += +d[name]};
                });

                var rx0 = 0;
                d.right = rcolorScale.domain().map(function(name) {
                    return {name: name, y: yValue(d), x0: rx0, x1: rx0 += +d[name]};
                });
            });
            //flatten the left and right data sets
            var leftVals = data.map(function(d){ return xLeft(d); });
            var rightVals = data.map(function(d){ return xRight(d); });
            var leftData = [].concat.apply([], leftVals);
            var rightData = [].concat.apply([], rightVals);
            //********

            // place the y-axis in the middle of the chart
            //bars that grow from center to left
            xLeftScale
                .domain([0,d3.max(data, xLeftTotal)])
                .range([center_left,left]);
            //bars that grow from center to right
            xRightScale
                .domain([0,d3.max(data, xRightTotal)])
                .range([center_right,right]);

            // Update the y-scale.
            yScale
                .domain(data.map(yValue))
                .rangeBands([margin.top,h - margin.bottom],0.6);

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
            //bar_r.exit().remove(); //for proper updating

            //bigger, transparent, total bar
            bar_r
                .enter() // return the selection of data with no elements yet bound
                .append("rect")  // add the projection path elements
                .attr("class","bar right total")
                .style("fill", right_color)
                .style("opacity",0.3);

            svg.selectAll(".bar.right.total")
                .data(data)
                .attr("x", center_right)
                .attr("height", yScale.rangeBand() + 10)
                .attr("y", function(d) { return yScale(yValue(d)) - 5; })
                .attr("width", function(d) { return xRightScale(xRightTotal(d)) - center_right; });

            //stacked bars, center to right
            var bar_r_stacked = g.selectAll("bar.right.stacked").data(rightData)

            bar_r_stacked
                .enter()
                .append("rect")
                .attr("class","bar right stacked")
                .style("fill", right_color);

            svg.selectAll(".bar.right.stacked")
                .data(rightData)
                //.enter().append("rect")
                .attr("x", function(d) { return xRightScale(d.x0); })
                .attr("height", yScale.rangeBand())
                .attr("y", function(d) { return yScale(d.y); })
                .attr("width", function(d) { return xRightScale(d.x1) - xRightScale(d.x0); })
                .style("opacity",function(d){ return rcolorScale(d.name); });


            //**** BARS -- CENTER TO LEFT ****
            var bar_l = g.selectAll("bar.left").data(data)
            //bigger, transparent, total bar
            bar_l
                .enter() // return the selection of data with no elements yet bound
                .append("rect")  // add the projection path elements
                .attr("class","bar left total")
                .style("fill", left_color)
                .style("opacity",0.3);

            svg.selectAll(".bar.left.total")
                .data(data)
                .attr("x", function(d) { return xLeftScale(xLeftTotal(d)); })
                .attr("height", yScale.rangeBand() + 10)
                .attr("y", function(d) { return yScale(yValue(d)) - 5; })
                .attr("width", function(d) { return center_left - xLeftScale(xLeftTotal(d)); });

            //stacked bars, center to right
            var bar_l_stacked = g.selectAll("bar.left.stacked").data(leftData)

            bar_l_stacked
                .enter()
                .append("rect")
                .attr("class","bar left stacked")
                .style("fill", left_color);

            svg.selectAll(".bar.left.stacked")
                .data(leftData)
                //.enter().append("rect")
                .attr("x", function(d) { return xLeftScale(d.x1); })
                .attr("height", yScale.rangeBand())
                .attr("y", function(d) { return yScale(d.y); })
                .attr("width", function(d) { return xLeftScale(d.x0) - xLeftScale(d.x1); })
                .style("opacity",function(d){ return rcolorScale(d.name); });


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
                .attr("y", function(d) { return yScale(yValue(d)) - 10; })
                .attr("transform", "translate(0," + margin.top + ")")
                .style("text-anchor", "middle");


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