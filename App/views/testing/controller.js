(function() {

    var testingController = function ($scope, vizAPI) {



        $scope.options = {width: 500, height: 300, 'bar': 'aaa'};
        $scope.data = [1, 2, 3, 4];


        $scope.candidate = {};
        $scope.ddOptions = {};
        $scope.candidateJSON = null;

        function getParties(json, cycle){ return Object.keys(json[cycle]); }

        function getCandiates(json, cycle, party){
            return json[cycle][party].map(function(candidate){ return candidate.name; });
        }

        function getCandidate(json, cycle, party, candidateIndex){
            return json[cycle][party][candidateIndex];
        }

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
        };



        $scope.populateDropdowns = function () {
            vizAPI.get_candiates()
                .success(function(json){
                    $scope.candidateJSON = json;

                    var cycles = Object.keys($scope.candidateJSON);
                    var cycleIndex = cycles.length - 2; // using 2012 as default for the moment
                    $scope.ddOptions.cycles = cycles;
                    $scope.ddOptions.cycle = cycles[cycleIndex];
                    $scope.updateParties();
                    $scope.updateCandidates();
                });
        };

        $scope.populateDropdowns();
    };

    testingController.$inject = ['$scope', 'vizAPI'];
    angular.module('myApp').controller('testingController', testingController);
}());