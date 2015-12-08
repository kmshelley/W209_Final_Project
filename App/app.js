angular.module('myApp', ['mgcrea.ngStrap'])

    .controller('myController', ['$scope', 'vizAPI', function ($scope, vizAPI) {

        $scope.model = {
            cycles: [],
            cycle: null,
            candidates: [{},{}],
            outsideGroups: [{},{}],
            mapData: null,
            candidateJson: null,
            monthlyRevEx: {'left': 0, 'right': 0},
            choropleth: {'left': 0, 'right': 0}
        };

        // Initialize by getting json object for candidate
        vizAPI.get_candiates()
            .success(function(json){
                $scope.model.candidateJson = json;

                var cycles = Object.keys($scope.model.candidateJson);
                var cycleIndex = cycles.length - 2; // using 2012 as default for the moment
                $scope.model.cycles = cycles;
                $scope.model.cycle = cycles[cycleIndex];

            });

    }])

    .factory('vizAPI', function($http) {

        var BASE_URL = "http://data.enalytica.com:9600";
        //var BASE_URL = "http://127.0.0.1:5000";

        var factory = {};

        factory.get_candiates = function() {
            return $http.get('./data/candidates.json');
        };

		factory.contributors_by_size = function(committee_id, cycle) {
            return $http.get(BASE_URL+'/schedule_a/by_size/' + committee_id + '/' + cycle);
        };

        factory.contributors_by_geo = function(committee_id, cycle, geo_agg, real_nom) {
            return $http.get(BASE_URL+'/contributors/by_geo/'+ committee_id +'/'+cycle +'/'+ geo_agg+'/');
        };

        factory.outsideForAgainst = function(candidate_id, cycle, for_against, topk, real_nom) {
            return $http.get(BASE_URL+'/outside/for-against/'+ candidate_id +'/'+cycle +'/'+ for_against+'/'+topk +'/'+real_nom +'/');
        };

        factory.outsideTopContributors = function(committee_id, cycle, topk, real_nom) {
            return $http.get(BASE_URL+'/outside/top-contributors/'+ committee_id +'/'+cycle +'/'+topk +'/'+real_nom +'/');
        };

        factory.get_county_json = function() {
            return $http.get('./data/us.json');
        };

        factory.get_state_json = function() {
            return $http.get('./data/states.json');
        };

        factory.get_by_employer = function(committee_id, cycle, topk) {
            return $http.get(BASE_URL+'/schedule_a/by_employer/'+ committee_id +'/'+cycle +'/'+topk);
        };

        factory.get_receipts_disbursements_by_committees = function(committee_ids, cycle) {
            //console.log(BASE_URL+'/com_fins/'+ committee_ids +'/'+cycle);
            return $http.get(BASE_URL+'/com_fins/'+ committee_ids +'/'+cycle);
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
                candidate: "=",
                partyIndex: "="
            },

            link:
                function(scope, element, attrs) {
                    scope.ddOptions = {};

                    function getParties(json, cycle) {
                        return Object.keys(json[cycle]);
                    }

                    function getCandiates(json, cycle, party) {
                        return json[cycle][party].map(function (candidate) {
                            return candidate.CAND_NAME;
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
                    };

                    scope.$watchGroup(['candidateJson','cycle'], function () {
                        if (scope.cycle) {
                            scope.updateParties();
                            scope.updateCandidates();
                        }
                    });
                },

            template:
            '<div class="form-inline">'+
                '<div class="form-group">' +
                    '<label for="partySelector" class="white-text">Party:&nbsp;</label>' +
                    '<select id="partySelector" ng-model="ddOptions.party" ng-change="updateCandidates()"' +
                    'ng-options="p for p in ddOptions.parties" class="form-control input-xs">' +
                    '</select>' +
                '</div>&nbsp;' +
                '<div class="form-group">' +
                    '<label for="candidateSelector" class="white-text">Candidate:&nbsp;</label>' +
                    '<select id="candidateSelector" ng-model="ddOptions.candidate" ng-change="updateCandidate(c.value)"' +
                    'ng-options="c for c in ddOptions.candidates" class="form-control input-xs">' +
                    '</select>' +
                '</div>' +
            '</div>'
        }
    })

        .directive('byEmployer', ['vizAPI', function(vizAPI){
        return {
            restrict: 'E',
            replace: true,
            scope: {
                candidate: '=',
                cycle: "="
            },

            link:
                function(scope, element, attrs){
                    var formatValue = d3.format(".2s"),
                        formatCurrency = function(d) { return "$" + formatValue(d); };
                    scope.topk = 5;
                    scope.$watchGroup(['candidate', 'topk'], function() {
                        if (Object.keys(scope.candidate).length){
                            vizAPI.get_by_employer(scope.candidate.Principal.id, scope.cycle, scope.topk)
                                .success(function(json){
                                    scope.employers = json;
                                    scope.employers.forEach(function (d) {
                                        d.total = formatCurrency(+d.total);
                                    });
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
                    '<h3 class="panel-title">Top {{topk}} Employers of Employees contributing > $200 to {{candidate.Principal.name}}</h3>'+
                '</div>'+
                '<div class="panel-body">'+
                    '<div class="btn-toolbar">'+

                        '<div class="btn-group btn-group-xs" ng-model="topk" bs-radio-group>'+
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="5">Top 5</label>' +
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="10">10</label>' +
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="20">20</label>' +
                        '</div>'+
                    '</div>'+
                '</div>'+

                '<table class="table table-condensed table-striped table-hover">'+
                    '<tr>'+
                        '<th class="col-xs-8">Employer</th>'+
                        '<th class="col-xs-4">Total</th>'+
                    '</tr>'+
                    '<tr ng-repeat="e in employers">'+
                        '<td class="vert-align">{{ e.employer }}</td>'+
                        '<td class="vert-align">{{ e.total }}</td>'+
                    '</tr>'+
                '</table>'+
            '</div>'
        }
    }])




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
                    var formatValue = d3.format(".2s"),
                        formatCurrency = function(d) { return "$" + formatValue(d); };
                    scope.for_against = 'for';
                    scope.topk = 5;
                    scope.real_nominal = 'nominal';
                    scope.$watchGroup(['candidate','for_against', 'topk'], function() {
                        if (Object.keys(scope.candidate).length){
                            vizAPI.outsideForAgainst(scope.candidate.CAND_ID, scope.cycle, scope.for_against,
                                scope.topk, scope.real_nominal)
                                .success(function(json){
                                    scope.topGroups = json;
                                    scope.topGroups.forEach(function (d) {
                                        d.total_spend_formatted = formatCurrency(+d.total_spend);
                                    });
                                    scope.outsideGroup = group = scope.topGroups[0];

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
                    '<h3 class="panel-title">Top {{topk}} Outside Groups Spending {{for_against}} {{candidate.CAND_NAME}}</h3>'+
                '</div>'+
                '<div class="panel-body">'+
                    '<div class="btn-toolbar">'+

                        '<div class="btn-group btn-group-xs" ng-model="for_against" bs-radio-group>'+
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="for">For</label>' +
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="against">Against</label>' +
                        '</div>'+

                        '<div class="btn-group btn-group-xs" ng-model="topk" bs-radio-group>'+
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="5">Top 5</label>' +
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="10">10</label>' +
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="20">20</label>' +
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
                        '<td class="vert-align">{{ group.total_spend_formatted }}</td>'+
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
                    var formatValue = d3.format(".2s"),
                        formatCurrency = function(d) { return "$" + formatValue(d); };
                    scope.topk = 5;
                    scope.real_nominal = 'nominal';
                    scope.$watchGroup(['outsideGroup','topk'], function() {
                        if (scope.outsideGroup){
                            if (Object.keys(scope.outsideGroup).length){
                                vizAPI.outsideTopContributors(scope.outsideGroup.pac_committee_id, scope.cycle, scope.topk, scope.real_nominal)
                                    .success(function(json){
                                        scope.outsideGroup.contributors = json;
                                        scope.outsideGroup.contributors.forEach(function (d) {
                                            d.total_spend_formatted = formatCurrency(+d.total_spend);
                                        });
                                    });
                            }
                        }

                    });
                },

            template:
            '<div class="panel panel-default">'+
                '<div class="panel-heading">'+
                    '<h3 class="panel-title">Top {{topk}} Contributors to {{outsideGroup.committee_name}}</h3>'+
                '</div>'+
                '<div class="panel-body">'+
                    'Click on a row in the Outside Groups table above to select a group to view top contributors to.<br><br>'+

                    '<div class="btn-toolbar">'+
                        '<div class="btn-group btn-group-xs" ng-model="topk" bs-radio-group>'+
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="5">Top 5</label>' +
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="10">10</label>' +
                            '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="20">20</label>' +
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
                            '<td class="vert-align">{{ contributor.total_spend_formatted }}</td>'+
                            '<td class="vert-align">' +
                                '<custom-chart chart-type="\'sparklineBar\'" height=25 width=150 data="contributor.monthly" watch="contributor.monthly"></custom-chart>' +
                            '</td>'+
                        '</tr>'+
                '</table>'+
            '</div>'
        }
    }])

    .directive('choropleth', ['vizAPI', function(vizAPI){
        return {
            restrict: 'E',
            replace: true,
            scope: {
                candidate: '=',
                cycle: '=',
                height: '=',
                width: '=',
                scale: '=',
                domainMax: "=",
                pos: "="
            },

            link:
                function(scope, element, attrs){

                    var data = {};
                    var parties = {
                        Democrat: colorbrewer.Blues[9].slice(1),
                        Republican: colorbrewer.Reds[9].slice(1)
                    };
                    var f_to_c = {state: 'State', fips: 'County'};

                    vizAPI.get_county_json()
                        .success(function(us){
                            data['fips'] = topojson.feature(us, us.objects.counties).features;
                        });
                    vizAPI.get_state_json()
                        .success(function(us){
                            data['state'] = topojson.feature(us, us.objects.cb_2014_us_state_500k).features;
                        });

                    var chartEl = d3.select(element[0]);

                    scope.state_fips = 'state';

                    scope.$watchGroup(['candidate','state_fips', 'domainMax.left', 'domainMax.right'], function() {
                        if (Object.keys(scope.candidate).length){

                            var chart = d3.custom['choropleth']()
                                .height(scope.height)
                                .width(scope.width)
                                .scale(scope.scale)
                                .colors(parties[scope.candidate.CAND_PTY_AFFILIATION]);

                            scope.state_county = f_to_c[scope.state_fips];

                            vizAPI.contributors_by_geo(scope.candidate.Principal.id, scope.cycle, scope.state_fips)
                                .success(function(json){
                                    var map = d3.map(); //a hash to define mapping from locations to values
                                    json.forEach(function(d){ map.set(d.location_id, {'total': d.amount, 'name': d.name}); });
                                    data[scope.state_fips].forEach(function(loc){
                                        if (map.get(loc.id)){ loc.properties = map.get(loc.id); }
                                    });
                                    chartEl.datum([data[scope.state_fips], scope.domainMax, scope.pos]).call(chart);
                                })
                        }
                    });
                },

            template:
            '<div>' +
                'Contributions > $200 to {{candidate.Principal.name}} by {{state_county}} <br><br>' +
                '<div class="btn-toolbar">'+
                    '<div class="btn-group btn-group-xs" ng-model="state_fips" bs-radio-group>'+
                        '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="state">State</label>' +
                        '<label class="btn btn-default"><input type="radio" class="btn btn-default" value="fips">County</label>' +
                    '</div>'+
                '</div>'+
                '<div class="chart"></div>' +
            '</div>'
        }
    }])

    .directive('contributionsBySize', ['vizAPI', function(vizAPI){
        return {
            restrict: 'E',
            replace: true,
            scope: {
                candidate: '=',
                cycle: '=',
                height: '=',
                width: '='
            },

            link:
                function(scope, element, attrs){
                    var parties = {
                        Democrat: colorbrewer.Blues[7].slice(2),
                        Republican: colorbrewer.Reds[7].slice(2)
                    };

                    var chartEl = d3.select(element[0]);

                    scope.$watch('candidate', function() {
                        if (Object.keys(scope.candidate).length){

                            var chart = d3.custom['segmentedBar']()
                                .h(scope.height)
                                .w(scope.width)
                                .bar_height(20)
                                .colors(parties[scope.candidate.CAND_PTY_AFFILIATION]);

                            vizAPI.contributors_by_size(scope.candidate.Principal.id, scope.cycle)
                                .success(function(json){
                                    chartEl.datum(json).call(chart);
                                });
                        }
                    });
                },

            template:
            '<div>' +
                'Contributions to {{candidate.Principal.name}} by Size' +
                '<div class="chart"></div>' +
            '</div>'
        }
    }])


    .directive('monthlyRevEx', ['vizAPI', function(vizAPI){
        return {
            restrict: 'E',
            replace: true,
            scope: {
                candidate: '=',
                cycle: '=',
                height: '=',
                width: '=',
                domainMax: "=",
                pos: "="
            },

            link:
                function(scope, element, attrs){

                    function getColors(party, i){
                        var j = Math.min(Math.max(i,3),9);
                        var slicer = Math.max(0,j-i);
                        var cols =  {
                            Democrat: colorbrewer.Blues[j].slice(slicer),
                            Republican: colorbrewer.Reds[j].slice(slicer)
                        };

                        return cols[party].reverse();
                    }
                    var chartEl = d3.select(element[0]).selectAll(".chart");

                    scope.$watchGroup(['candidate', 'domainMax.left', 'domainMax.right'], function() {
                        if (Object.keys(scope.candidate).length && scope.domainMax){

                            function supporting(d){ if (d){return d.id} }
                            var ctte_ids = [scope.candidate.Principal.id].concat(scope.candidate.Supporting.map(supporting)).toString()

                            vizAPI.get_receipts_disbursements_by_committees(ctte_ids, scope.cycle)
                                .success(function(json){

                                    var colors = getColors(scope.candidate.CAND_PTY_AFFILIATION, json[0].data.length);

                                    var chart = d3.custom['horizontalBar']()
                                        .h(scope.height)
                                        .w(scope.width)
                                        .colors(colors);

                                    chartEl.datum([json, scope.domainMax, scope.pos]).call(chart);

                                    var formatValue = d3.format("0,000"),
                                        formatCurrency = function(d) { return "$" + formatValue(Math.round(d/10000)/100) + "M"; };

                                    scope.receipts = formatCurrency(d3.sum(json.map(function(d) {
                                        return d3.sum(d.data.map(function(d) { return d.data.receipts }))
                                    })));
                                    scope.expenditures = formatCurrency(d3.sum(json.map(function(d) {
                                        return d3.sum(d.data.map(function(d) { return d.data.expenditures }))
                                    })));


                                });
                        }
                    });
                },

            template:
            '<div>' +
            '<div style="padding: 15px 0;"> Monthy Fundraising and Spending by {{candidate.CAND_NAME}}\'s Principal Committee and Affiliated Groups</div>' +
            '<div class="chart" ></div>' +
                '<div style="padding: 15px 25px; font-size: 16px">' +
                    '<span>Total Raised: <strong>{{receipts}}</strong></span>' +
                    '<span class="pull-right">Total Spent: <strong>{{expenditures}}</strong></span>' +
                '</div>' +

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