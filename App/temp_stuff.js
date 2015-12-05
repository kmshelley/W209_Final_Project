            //vizAPI.get_by_employer($scope.candidate.committees[0].committee_id, $scope.cycle)
            //    .success(function(json){
            //        console.log(json);
            //    });
            //
            //vizAPI.contributors_by_state()
            //    .success(function(json){
            //        json = json.filter(function(d){
            //            return (d.candidate_id === $scope.candidate.candidate_ids[0]
            //            && +d.cycle === +($scope.cycle))
            //        });
            //
            //        //defines a mapping from locations to values
            //        var mapData = d3.map();
            //        json.forEach(function(d){ mapData.set(d.state,+d.total); });
            //        $scope.mapData.forEach(function(loc){ loc.properties["total"] = mapData.get(loc.id); });
            //        $scope.mapUpdated = true;
            //    });
            //
            //vizAPI.contributors_by_geo($scope.candidate.committees[0].committee_id, $scope.cycle, 'fips')
            //    .success(function(json){
            //        //defines a mapping from locations to values
            //        var mapData = d3.map();
            //        json.forEach(function(d){ mapData.set(d.location, d.amount); });
            //        $scope.mapData.forEach(function(loc){ loc.properties["total"] = mapData.get(loc.id); });
            //        $scope.mapUpdated = true;
            //    });

			////Added by Katherine -- for loading segmented bar chart of contributions by size
			//vizAPI.contributors_by_size($scope.candidate.committees[0].committee_id, $scope.cycle)
             //   .success(function(json){
             //       $scope.candidate.committee.contributors_by_size = json;
             //   });
            //
			////Added by Katherine -- for loading horizontal +/- bar charts for receipts/disp by candidate
			//vizAPI.get_receipts_dispersments_by_candidate($scope.candidate.candidate_ids[0], $scope.cycle)
             //   .success(function(json){
			//		json = json.filter(function(d){
             //           return (d.candidate_id === $scope.candidate.candidate_ids[0]
             //           && +d.cycle === +($scope.cycle))
             //       });
             //       //console.log(json);
			//		$scope.candidate.committee.monthly_rd = json;
             //   });




    //            <!--<div class="row">-->
    //    <!--<div class="col-xs-6">-->
    //        <!--&lt;!&ndash;<custom-chart chart-type="'choropleth'" height=500 width=960 data="mapData" watch="mapUpdated"></custom-chart>&ndash;&gt;-->
    //        <!--<custom-chart chart-type="'segmentedBar'" height=250 width=480 data="candidate.committee.contributors_by_size" watch="candidate.committee.contributors_by_size"></custom-chart>-->
    //        <!--<custom-chart chart-type="'horizontalBar'" height=250 width=480 data="candidate.committee.monthly_rd" watch="candidate.committee.monthly_rd"></custom-chart>-->
    //
    //
    //    <!--</div>-->
    //<!--</div>-->
    //
    //<!--<div class="spacer"></div>-->