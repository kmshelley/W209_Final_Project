d3.custom.sparklineBar = function (){

    var margin = {top: 40, right: 25, bottom: 25, left: 25},
        width = 940 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom,
        markerWidth = 2, markerHeight = 1;

    var datePrintFormat = d3.time.format('%b %Y');

    var chartdata;

    var xScale = d3.scale.ordinal();
    var yScale = d3.scale.linear();

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "<strong>"+ datePrintFormat(d.date) +" Spend: </strong><span style='color:red'>" + Math.round(d.value/10000)/100 + " mm</span>";
        });

    function chart(selection){
        selection.each(function(data){

            chartdata = data;

            // Set up X and Y Scales

            xScale.rangeRoundBands([0, width], .1).domain(data.map(function(d) { return d.date; }));

            yScale.range([height, 0]).domain([0, d3.max(data, function(d) { return d.value; })]);

            var gapWidth = 1;
            var barWidth = xScale.range()[1]/data.length - gapWidth;
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

            g.selectAll(".bar")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "bar");

            g.selectAll(".bar")
                .attr({
                    "x": function (d) { return xScale(d.date); },
                    "width": xScale.rangeBand(),
                    "y": function (d) { return yScale(d.value); },
                    "height": function (d) { return height - yScale(d.value); }
                })
                .on("mouseover", tip.show)
                .on("mouseout", tip.hide);


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