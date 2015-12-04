angular.module('myApp')

    .controller('testingController', ['$scope', 'vizAPI', function ($scope, vizAPI) {

        $scope.model = {
            cycles: [],
            cycle: null,
            candidates: [{},{}],
            outsideGroups: [{},{}],
            mapData: null,
            candidateJson: null
        };

        // Initialize by getting json objects for candidate and map
        vizAPI.get_map_json()  // load map json on init first
            .success(function(us){
                $scope.model.mapData = topojson.feature(us, us.objects.counties).features;

                vizAPI.get_candiates()  // then load the candidates json
                    .success(function(json){
                        $scope.model.candidateJson = json;

                        var cycles = Object.keys($scope.model.candidateJson);
                        var cycleIndex = cycles.length - 2; // using 2012 as default for the moment
                        $scope.model.cycles = cycles;
                        $scope.model.cycle = cycles[cycleIndex];

                    });
            });

    }]);



