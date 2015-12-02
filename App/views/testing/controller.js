(function() {

    var testingController = function ($scope, vizAPI) {
        $scope.candidate = {};
        $scope.mapUpdated = false;

        $scope.ddOptions = {};
        $scope.candidateJSON = null;

        function getParties(json, cycle){ return Object.keys(json[cycle]); }

        function getCandiates(json, cycle, party){
            return json[cycle][party].map(function(candidate){ return candidate.name; });
        }

        function getCandidate(json, cycle, party, candidateIndex){
            return json[cycle][party][candidateIndex];
        }

        $scope.getTopPACs = function(for_against){
            vizAPI.topPACS($scope.candidate.candidate_ids[0], $scope.ddOptions.cycle, for_against, '10', 'real')
                .success(function(json){
                    $scope.candidate.topPACs = json;
                });
        };

        $scope.updateParties = function (){
            var parties =  getParties($scope.candidateJSON, $scope.ddOptions.cycle);
            var partyIndex = 0;
            $scope.ddOptions.parties = parties;
            $scope.ddOptions.party = parties[partyIndex];
        };

        $scope.updateCandidates = function (){
            var candidates =  getCandiates($scope.candidateJSON, $scope.ddOptions.cycle, $scope.ddOptions.party);
            var candidateIndex = 0;
            $scope.ddOptions.candidates = candidates;
            $scope.ddOptions.candidate = candidates[candidateIndex];
            $scope.updateCandidate();
        };

        $scope.updateCandidate = function(){
            $scope.mapUpdated = false;
            $scope.candidate = getCandidate(
                $scope.candidateJSON,
                $scope.ddOptions.cycle,
                $scope.ddOptions.party,
                $scope.ddOptions.candidates.indexOf($scope.ddOptions.candidate)
            );

            //vizAPI.get_by_employer($scope.candidate.committees[0].committee_id, $scope.ddOptions.cycle)
            //    .success(function(json){
            //        console.log(json);
            //    });

            //vizAPI.contributors_by_state()
            //    .success(function(json){
            //        json = json.filter(function(d){
            //            return (d.candidate_id === $scope.candidate.candidate_ids[0]
            //            && +d.cycle === +($scope.ddOptions.cycle))
            //        });
            //
            //        //defines a mapping from locations to values
            //        var mapData = d3.map();
            //        json.forEach(function(d){ mapData.set(d.state,+d.total); });
            //        $scope.mapData.forEach(function(loc){ loc.properties["total"] = mapData.get(loc.id); });
            //        $scope.mapUpdated = true;
            //    });

            //vizAPI.contributors_by_geo($scope.candidate.committees[0].committee_id, $scope.ddOptions.cycle, 'fips')
            //    .success(function(json){
            //        //defines a mapping from locations to values
            //        var mapData = d3.map();
            //        json.forEach(function(d){ mapData.set(d.location, d.amount); });
            //        $scope.mapData.forEach(function(loc){ loc.properties["total"] = mapData.get(loc.id); });
            //        $scope.mapUpdated = true;
            //    });

            $scope.getTopPACs('against')
        };

        $scope.initialize = function () {
            vizAPI.get_map_json()  // load map json on init first
                .success(function(us){
                    $scope.mapData = topojson.feature(us, us.objects.counties).features;

                    vizAPI.get_candiates()  // then load the candidates json
                        .success(function(json){
                            $scope.candidateJSON = json;

                            var cycles = Object.keys($scope.candidateJSON);
                            var cycleIndex = cycles.length - 2; // using 2012 as default for the moment
                            $scope.ddOptions.cycles = cycles;
                            $scope.ddOptions.cycle = cycles[cycleIndex];
                            $scope.updateParties();
                            $scope.updateCandidates();
                        });
                });
        };


        $scope.initialize();
    };

    testingController.$inject = ['$scope', 'vizAPI'];
    angular.module('myApp').controller('testingController', testingController);
}());