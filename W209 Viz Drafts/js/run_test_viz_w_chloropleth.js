
function topEmployers(committee_id, candidate_id, cycle, selector, viz){
    var BASE_URL = "http://data.enalytica.com:9600";
    //var BASE_URL = "http://localhost:5000";
    var url = BASE_URL+'/schedule_a/by_employer/'+ committee_id +'/'+cycle;
    d3.json(url, function(error, json) {
        if (error) throw error;
        plotData(selector, json, viz);
		
    });
	
	d3.json("data/sched_a_by_cand+state_2007-2015_to_pg500.json", function(error, json) {
        if (error) throw error;
		//console.log(committee_id);
		jsonfiltered = json.filter(function(d){
					//console.log(d.committee_id);
					if (d.candidate_id === candidate_id && +d.cycle === +cycle){
						return true;
					}else{
						return false;
					} 
				});
		
		//defines a mapping from locations to values
		var mapData = d3.map(); 
		jsonfiltered.forEach(function(d){
			mapData.set(d.state,+d.total);
		});
		
		//load the map json	
		d3.json("data/states.json", function(error, us) {
			if (error) return console.error(error);
			var locs = topojson.feature(us, us.objects.cb_2014_us_state_500k).features;
			locs.forEach (function(loc){
				loc.properties["total"] = mapData.get(loc.id);
			});
			plotData(selector, locs, chloropleth());
		});
		
    });

}

function plotData(selector, data, plot) { return d3.select(selector).datum(data).call(plot); }



document.addEventListener("DOMContentLoaded", function(event) {
    d3.json("data/candidates.json", function(error, json) {
        if (error) throw error;
		
        var parties = null, partyIndex = null, candidates = null, candidateIndex = null,
            cycles = null, cycleIndex = null;

        function getParties(cycle){ return Object.keys(json[cycle]); }

        function getCandidates(cycle, party){
            return json[cycle][party].map(function(candidate){ return candidate.name; });
        }

        function populate_dropdown(id, list, def_val){
            d3.select(id).selectAll("option")
                .data(list)
                .enter()
                .append("option")
                .attr("value", function (d, i) { return i; })
                .property("selected", function(d, i){ return i === def_val; })
                .text(function (d) { return d; });
        }

        function update_dropdown(id, list, def_val){
            d3.select(id).selectAll("option")
                .data(list)
                .exit()
                .remove();

            d3.select(id).selectAll("option")
                .data(list)
                .enter()
                .append("option");

            d3.select(id).selectAll("option")
                .data(list)
                .attr("value", function (d, i) { return i; })
                .property("selected", function(d, i){ return i === def_val; })
                .text(function (d) { return d; });
        }

        function update_candidates(){
            candidates = getCandidates(cycles[cycleIndex], parties[partyIndex]);
            candidateIndex = 0;
            update_dropdown("#candidate_selector", candidates, candidateIndex);
        }

        function update_charts(candidateIndex){
            var candidate = json[cycles[cycleIndex]][parties[partyIndex]][candidateIndex];
            d3.select("#candidate_id").html(candidate.candidate_ids[0]);
            d3.select("#committee_id").html(candidate.committees[0].committee_id);
            topEmployers(candidate.committees[0].committee_id, candidate.candidate_ids[0], cycles[cycleIndex], '#first_viz', tableViz())
			
        }

        cycles = Object.keys(json);
        cycleIndex = cycles.length - 2; // using 2012 as default for the moment
        populate_dropdown("#cycle_selector", cycles, cycleIndex);

        partyIndex = 0;
        parties = getParties(cycles[cycleIndex]);
        populate_dropdown("#party_selector", parties, partyIndex);

        candidates = getCandidates(cycles[cycleIndex], parties[partyIndex]);
        candidateIndex = 0;
        populate_dropdown("#candidate_selector", candidates, candidateIndex);
        update_charts(candidateIndex);

        d3.select("#cycle_selector").on("change", function(){
            cycleIndex = this.value;
            update_candidates();
            update_charts(candidateIndex);
        });
        d3.select("#party_selector").on("change", function(){
            partyIndex = this.value;
            update_candidates();
            update_charts(candidateIndex);
        });
        d3.select("#candidate_selector").on("change", function(){
            candidateIndex = this.value;
            update_charts(candidateIndex);
        });

    });

});