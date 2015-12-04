angular.module('myApp', ['mgcrea.ngStrap'])

    .controller('myController', ['$scope', 'vizAPI', function ($scope, vizAPI) {

        $scope.model = {
            cycles: [],
            cycle: null,
            candidates: [{},{}],
            outsideGroups: [{},{}],
            mapData: null,
            candidateJson: null
        };

        // Initialize by getting json objects for candidate and map
        vizAPI.get_map_json()  // load map json first
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

    }])

    .factory('vizAPI', function($http) {

        var BASE_URL = "http://data.enalytica.com:9600";
        //var BASE_URL = "http://127.0.0.1:5000";

        var factory = {};

        factory.get_candiates = function() {
            return $http.get('./data/candidates.json');
        };

        factory.contributors_by_state = function() {
            return $http.get('./data/sched_a_by_cand+state_2007-2015_to_pg500.json');
        };

		factory.contributors_by_size = function(committee_id, cycle) {
            return $http.get(BASE_URL+'/schedule_a/by_size/' + committee_id + '/' + cycle);
        };

        factory.contributors_by_geo = function(committee_id, cycle, geo_agg, real_nom) {
            return $http.get(BASE_URL+'/contributors/'+ committee_id +'/'+cycle +'/'+ geo_agg+'/');
        };

        factory.topPACS = function(candidate_id, cycle, for_against, topk, real_nom) {
            return $http.get(BASE_URL+'/top_pacs/'+ candidate_id +'/'+cycle +'/'+ for_against+'/'+topk +'/'+real_nom +'/');
        };

        factory.topContributorsToPACs = function(committee_id, cycle, topk, real_nom) {
            return $http.get(BASE_URL+'/top_pacs/'+ committee_id +'/'+cycle +'/'+topk +'/'+real_nom +'/');
        };

        factory.get_map_json = function() {
            return $http.get('./data/us.json');
        };

        factory.get_by_employer = function(committee_id, cycle) {
            return $http.get(BASE_URL+'/schedule_a/by_employer/'+ committee_id +'/'+cycle);
        };

		//Added by Katherine -- for loading horizontal +/- bar charts for receipts/disp by candidate
		factory.get_receipts_dispersments_by_candidate = function(candidate_id, cycle) {
            return $http.get('./data/payments_receipts_sample.json');
        };

        return factory;
    })

    .directive('candidateSelector', function(){
        return {
            restrict: 'E',
            replace: true,
            scope: {
                candidateJson: '=',
                cycle: "=",
                party: "=",
                candidate: "=",
                partyIndex: "@"
            },

            link:
                function(scope, element, attrs) {
                    scope.ddOptions = {};

                    function getParties(json, cycle) {
                        return Object.keys(json[cycle]);
                    }

                    function getCandiates(json, cycle, party) {
                        return json[cycle][party].map(function (candidate) {
                            return candidate.name;
                        });
                    }

                    function getCandidate(json, cycle, party, candidateIndex) {
                        return json[cycle][party][candidateIndex];
                    }


                    scope.updateParties = function () {
                        var parties = getParties(scope.candidateJson, scope.cycle);
                        scope.ddOptions.parties = parties;
                        scope.ddOptions.party = parties[+scope.partyIndex];
                    };

                    scope.updateCandidates = function () {
                        var candidates = getCandiates(scope.candidateJson, scope.cycle, scope.ddOptions.party);
                        var candidateIndex = 0;
                        scope.ddOptions.candidates = candidates;
                        scope.ddOptions.candidate = candidates[candidateIndex];
                        scope.updateCandidate();
                    };

                    scope.updateCandidate = function () {

                        scope.candidate = getCandidate(
                            scope.candidateJson,
                            scope.cycle,
                            scope.ddOptions.party,
                            scope.ddOptions.candidates.indexOf(scope.ddOptions.candidate)
                        );
                        //scope.candidate.committee = {};
                    };

                    scope.$watchGroup(['candidateJson','cycle'], function () {
                        if (scope.cycle) {
                            scope.updateParties();
                            scope.updateCandidates();
                        }
                    });
                },

            template:
            '<div>'+
                '<div class="form-group">' +
                    '<label for="partySelector">Select Party</label>' +
                    '<select id="partySelector" ng-model="ddOptions.party" ng-change="updateCandidates()"' +
                    'ng-options="p for p in ddOptions.parties" class="form-control">' +
                    '</select>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label for="candidateSelector">Select Candidate</label>' +
                    '<select id="candidateSelector" ng-model="ddOptions.candidate" ng-change="updateCandidate(c.value)"' +
                    'ng-options="c for c in ddOptions.candidates" class="form-control">' +
                    '</select>' +
                '</div>' +
            '</div>'
        }
    })

    .directive('outsideGroups', ['vizAPI', function(vizAPI){
        return {
            restrict: 'E',
            replace: true,
            scope: {
                candidate: '=',
                cycle: "=",
                outsideGroup: "="
            },

            link:
                function(scope, element, attrs){
                    scope.for_against = 'for';
                    scope.topk = 5;
                    scope.real_nominal = 'nominal';
                    scope.$watchGroup(['candidate','for_against', 'topk'], function() {
                        if (Object.keys(scope.candidate).length){
                            vizAPI.topPACS(scope.candidate.candidate_ids[0], scope.cycle, scope.for_against,
                                scope.topk, scope.real_nominal)
                                .success(function(json){
                                    scope.topGroups = json;
                                    scope.outsideGroup = group = scope.topGroups[0]
                                });
                        }
                    });

                    scope.selectPAC = function (group){
                        scope.outsideGroup = group;
                    }

                },

            template:
            '<div class="panel panel-default">'+
                '<div class="panel-heading">'+
                    '<h3 class="panel-title">Top {{topk}} Outside Groups Spending {{for_against}} {{candidate.short_name}}</h3>'+
                '</div>'+
                '<div class="panel-body">'+
                    '<div class="btn-toolbar">'+

                        '<div class="btn-group btn-group-xs" ng-model="for_against" bs-radio-group>'+
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="for">For</label>' +
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="against">Against</label>' +
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="both">Both</label>' +
                        '</div>'+

                        '<div class="btn-group btn-group-xs" ng-model="topk" bs-radio-group>'+
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="5">Top 5</label>' +
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="10">10</label>' +
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="20">20</label>' +
                        '</div>'+

                        '<div class="btn-group btn-group-xs" ng-model="real_nominal" bs-radio-group>'+
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="real">$ Real 2015</label>' +
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="nominal">$ Nominal</label>' +
                        '</div>'+

                    '</div>'+
                '</div>'+

                '<table class="table table-condensed table-striped table-hover">'+
                    '<tr>'+
                        '<th class="col-xs-4">Outside Group</th>'+
                        '<th class="col-xs-2">Total Spent</th>'+
                        '<th class="col-xs-2">For/Against</th>'+
                        '<th class="col-xs-4">Spending Over Time</th>'+
                    '</tr>'+
                    '<tr ng-repeat="group in topGroups" ng-click="selectPAC(group)">'+
                        '<td class="vert-align">{{ group.committee_name }}</td>'+
                        '<td class="vert-align">{{ group.total_spend/1000000 | currency }} mm</td>'+
                        '<td class="vert-align">{{ group.for_against }}</td>'+
                        '<td class="vert-align">' +
                            '<custom-chart chart-type="\'sparklineBar\'"height=25 width=150 data="group.monthly" watch="group.monthly"></custom-chart>' +
                        '</td>'+
                    '</tr>'+
                '</table>'+
            '</div>'
        }
    }])

    .directive('groupDonors', ['vizAPI', function(vizAPI){
        return {
            restrict: 'E',
            replace: true,
            scope: {
                outsideGroup: '=',
                cycle: "="
            },

            link:
                function(scope, element, attrs){
                    scope.topk = 5;
                    scope.real_nominal = 'nominal';
                    scope.$watchGroup(['outsideGroup','topk'], function() {
                        if (Object.keys(scope.outsideGroup).length){
                            vizAPI.topContributorsToPACs(scope.outsideGroup.pac_committee_id, scope.cycle, scope.topk, scope.real_nominal)
                                .success(function(json){
                                    scope.outsideGroup.contributors = json;
                                });
                        }
                    });
                },

            template:
            '<div class="panel panel-default">'+
                '<div class="panel-heading">'+
                    '<h3 class="panel-title">Top {{scope.topk}} Contributors to {{outsideGroup.committee_name}}</h3>'+
                '</div>'+
                '<div class="panel-body">'+
                    'Click on a row in the Outside Groups table above to select a group to view top contributors to.<br><br>'+

                    '<div class="btn-toolbar">'+
                        '<div class="btn-group btn-group-xs" ng-model="topk" bs-radio-group>'+
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="5">Top 5</label>' +
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="10">10</label>' +
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="20">20</label>' +
                        '</div>'+

                        '<div class="btn-group btn-group-xs" ng-model="real_nominal" bs-radio-group>'+
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="real">$ Real 2015</label>' +
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="nominal">$ Nominal</label>' +
                        '</div>'+
                    '</div>'+
                '</div>'+

                '<table class="table table-condensed table-striped table-hover">'+
                    '<tr>'+
                        '<th class="col-xs-5">Contributor</th>'+
                        '<th class="col-xs-3">Total Contributed</th>'+
                        '<th class="col-xs-4">Contributions Over Time</th>'+
                    '</tr>'+
                        '<tr ng-repeat="contributor in outsideGroup.contributors">'+
                            '<td class="vert-align">{{ contributor.contributor_name }}</td>'+
                            '<td class="vert-align">{{ contributor.total_spend/1000000 | currency }} mm</td>'+
                            '<td class="vert-align">' +
                                '<custom-chart chart-type="\'sparklineBar\'" height=25 width=150 data="contributor.monthly" watch="contributor.monthly"></custom-chart>' +
                            '</td>'+
                        '</tr>'+
                '</table>'+
            '</div>'
        }
    }])

    .directive('customChart', function(){
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="chart"></div>',
            scope:{
                height: '=',
                width: '=',
                data: '=',
                watch: '=',
                chartType: '='
            },
            link: function(scope, element, attrs){
                var chart = d3.custom[scope.chartType]()
                    .height(scope.height)
                    .width(scope.width);

                var chartEl = d3.select(element[0]);
                scope.$watch('watch', function (newValue, oldValue) {
                    if (newValue){
                        chartEl.datum(scope.data).call(chart);
                    }
                });
            }
        }
    });