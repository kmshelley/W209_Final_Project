function tableViz(){

    var columns = ['Employer', 'Total'];

    function chart(selection){
        selection.each(function(data){
            var t = d3.select(this).selectAll("table").data([data]);
            var table = t.enter().append("table").attr("class", "table-condensed");

            var tableHead = table.append("thead");
            var tableBody = table.append("tbody");

            tableHead.append("tr").selectAll("th")
                .data(columns)
                .enter()
                .append("th")
                .text(function(d){ return d; });

            var rows = tableBody.selectAll("tr")
                .data(data)
                .enter()
                .append("tr");

            rows.append("td")
                .attr("class", "employer");

            rows.append("td")
                .attr("class", "pull-right")
                .attr("class", "total");

            t.selectAll(".employer")
                .data(data)
                .html(function(d){ return d.employer; });

            t.selectAll(".total")
                .data(data)
                .html(function(d){ return d.total; });

        });

    }
    chart.columns = function(_) {
        // Accessor functions to come here to enable things like column headings to be changed to suit different data
    };

    return chart;
}