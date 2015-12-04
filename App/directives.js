angular.module('myApp')

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
                    scope.topk = '5';
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
                        '<div class="btn-group btn-group-xs">'+
                            '<label class="btn btn-default" ng-model="for_against" uib-btn-radio="\'for\'" uncheckable>Spending For</label>'+
                            '<label class="btn btn-default" ng-model="for_against" uib-btn-radio="\'against\'" uncheckable>Against</label>'+
                            '<label class="btn btn-default" ng-model="for_against" uib-btn-radio="\'both\'" uncheckable>For & Against</label>'+
                        '</div>'+

                        '<div class="btn-group btn-group-xs">'+
                            '<label class="btn btn-default" ng-model="topk" uib-btn-radio="\'5\'" uncheckable>Top 5</label>'+
                            '<label class="btn btn-default" ng-model="topk" uib-btn-radio="\'10\'" uncheckable>10</label>'+
                            '<label class="btn btn-default" ng-model="topk" uib-btn-radio="\'20\'" uncheckable>20</label>'+
                        '</div>'+

                        '<div class="btn-group btn-group-xs">'+
                            '<label class="btn btn-default" ng-model="real_nominal" uib-btn-radio="\'real\'" uncheckable>$ Real 2015</label>'+
                            '<label class="btn btn-default" ng-model="real_nominal" uib-btn-radio="\'nominal\'" uncheckable>$ Nominal</label>'+
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
                    scope.topk = '5';
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
                        '<div class="btn-group btn-group-xs">'+
                            '<label class="btn btn-default" ng-model="topk" uib-btn-radio="\'5\'" uncheckable>Top 5</label>'+
                            '<label class="btn btn-default" ng-model="topk" uib-btn-radio="\'10\'" uncheckable>10</label>'+
                            '<label class="btn btn-default" ng-model="topk" uib-btn-radio="\'20\'" uncheckable>20</label>'+
                        '</div>'+

                        '<div class="btn-group btn-group-xs">'+
                            '<label class="btn btn-default" ng-model="real_nominal" uib-btn-radio="\'real\'" uncheckable>$ Real 2015</label>'+
                            '<label class="btn btn-default" ng-model="real_nominal" uib-btn-radio="\'nominal\'" uncheckable>$ Nominal</label>'+
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