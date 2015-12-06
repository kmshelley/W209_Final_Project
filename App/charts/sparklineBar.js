d3.custom.sparklineBar = function (){

    var margin = {top: 0, right: 0, bottom: 2, left: 0},
        width = 940 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom,
        markerWidth = 2, markerHeight = 1,
        formatValue = d3.format(".2s"),
        formatCurrency = function(d) { return "$" + formatValue(d); };

    var datePrintFormat = d3.time.format('%b %Y');
    var	parseDate = d3.time.format("%Y-%m-%d").parse;
    var chartdata;

    var xScale = d3.scale.ordinal();
    var yScale = d3.scale.linear();

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .tickFormat("");

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "<strong>"+ datePrintFormat(parseDate(d.date)) +": </strong><span style='color:#000000'>"+ formatCurrency((d.value))+"</span>";
        });

    function chart(selection){
        selection.each(function(data){

            chartdata = data;

            // Set up X and Y Scales

            xScale
                .rangeRoundBands([0, width], .1)
                .domain(data.map(function(d) { return parseDate(d.date); }));

            yScale
                .range([height, 0])
                .domain([0, d3.max(data, function(d) { return d.value; })]);

            // Select the svg element, if it exists.
            var svg = d3.select(this).selectAll("svg").data([data]);


            // Otherwise, create the skeletal chart.
            var gEnter = svg.enter().append("svg").append("g");

            // Update the outer dimensions.
            svg .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

            svg.call(tip);

            // Update the inner dimensions.
            var g = svg.select("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


            gEnter.append("g").attr("class", "x axis");


            g.selectAll(".bar")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "bar");

            g.selectAll(".bar")
                .attr({
                    "x": function (d) { return xScale(parseDate(d.date)); },
                    "width": xScale.rangeBand(),
                    "y": function (d) { return yScale(d.value); },
                    "height": function (d) { return height - yScale(d.value); }
                })
                .on("mouseover", tip.show)
                .on("mouseout", tip.hide);

            // Update the x-axis.
            g.select(".x.axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);


        });

    }


    chart.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    };

    return chart;
}