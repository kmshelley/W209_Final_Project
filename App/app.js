angular.module('myApp', ['mgcrea.ngStrap'])

    .controller('myController', ['$scope', 'vizAPI', function ($scope, vizAPI) {

        $scope.model = {
            cycles: [],
            candidates: [{},{}],
            outsideGroups: [{},{}],
            mapData: null,
            candidateJson: null,
            monthlyRevEx: {'left': 0, 'right': 0},
            wholeCycle: {'left': 0, 'right': 0},
            choropleth: {'left': 0, 'right': 0},
            stateFips: 'state'
        };

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

        factory.contributors_by_geo = function(committee_id, cycle, geo_agg) {
            console.log(BASE_URL+'/contributors/by_geo/'+ committee_id +'/'+cycle +'/'+ geo_agg+'/');
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
            return $http.get(BASE_URL+'/com_fins/'+ committee_ids +'/'+cycle);
        };

        factory.get_receipts_disbursements_by_candidates = function(candidate_ids, cycle) {
            return $http.get(BASE_URL+'/cand_fins/'+ candidate_ids +'/'+cycle);
        };
        return factory;
    })





    .directive('navbarSelector', ['vizAPI', '$window', function(vizAPI, $window){
        return {
            restrict: 'E',
            replace: true,
            scope: {
                cycle: "=",
                candidate: "=",
                partyIndex: "=",
                candidateJson: "="
            },

            link:
                function(scope, element, attrs) {

                    scope.innerWidth = $window.innerWidth;

                    scope.dropdownMouseEnter = function($event, item, level){
                        var el = angular.element($event.currentTarget );
                        el.addClass('open');

                        if (level > 1) {
                            return;
                        }

                        var subMenu = $event.currentTarget.getElementsByClassName('dropdown-menu')[0];
                        var MenuLeftOffset = subMenu.offsetLeft;
                        var Menu1LevelWidth = subMenu.offsetWidth;

                        if (scope.innerWidth/4 - MenuLeftOffset > Menu1LevelWidth * 2){
                            angular.element(subMenu).css('right', 'auto');
                            angular.element(subMenu).css('left', '0');
                        }else{
                            angular.element(subMenu).css('right', '0');
                            angular.element(subMenu).css('left', 'auto');
                        }

                        if ($event.currentTarget.getElementsByClassName('dropdown').length){
                            var Menu2LevelWidth = subMenu.offsetWidth;
                            if (scope.innerWidth/5 - MenuLeftOffset - Menu1LevelWidth < Menu2LevelWidth){
                                angular.element(subMenu).addClass('left-side');
                            }else{
                                angular.element(subMenu).removeClass('left-side');
                            }
                        }

                    };

                    scope.dropdownMouseLeave = function($event, item){
                        var el = angular.element($event.currentTarget);
                        el.removeClass('open');
                    };

                    scope.clickHandler = function($event, item){

                        if (typeof item.eventHandler === 'function'){
                            item.eventHandler();
                        }

                        if (typeof item.properties !== 'undefined'){
                            scope.candidate = item.properties;
                            scope.cycle = item.properties.cycle;
                            scope.navObj[0].title = scope.candidate.CAND_NAME +" ("+ scope.candidate.cycle+")";

                        }

                    };

                    // Initialize dropdown by getting json object for candidate
                    vizAPI.get_candiates()
                        .success(function(json){
                            var cycles =  Object.keys(json);
                            var cycleIndex = cycles.length - 2; // using 2012 as default for the moment
                            var cycle = cycles[cycleIndex];
                            var parties = Object.keys(json[cycle]);
                            var party = parties[+scope.partyIndex];
                            var candidates = json[cycle][party];

                            scope.cycle = cycle;
                            scope.candidate = candidates[0];
                            scope.candidateJson = json;

                            scope.navObj = [{
                                'title': scope.candidate.CAND_NAME +" ("+ scope.candidate.cycle+")",
                                'children': cycles.map(function(cycle) {
                                    return {
                                        'title': cycle,
                                        'children': Object.keys(json[cycle]).map(function(party) {
                                            return {
                                                'title': party,
                                                'children': json[cycle][party].map(function(candidate) {
                                                    return {
                                                        'title': candidate.CAND_NAME,
                                                        'properties': candidate
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }];


                        });


                },

            template:
            '<div class="collapse navbar-collapse" id="custom-collapse">'+
                '<script type="text/ng-template" id="navTree">'+
                    '<a ng-class="{\'dropdown-toggle\':item.children}" ng-href="{{item.link}}"' +
                        'ng-click="clickHandler($event, item)">{{ item.title }}</a>'+
                    '<ul ng-if="item.children" class="dropdown-menu">'+
                        '<li ng-repeat="item in item.children track by $index" ng-include="\'navTree\'"' +
                            'ng-class="{\'dropdown\': item.children}" ng-mouseenter="dropdownMouseEnter($event, item, 2)"' +
                            'ng-mouseleave="dropdownMouseLeave($event, item)" >' +
                        '</li>'+
                    '</ul>'+
                '</script>'+

                '<ul class="nav navbar-nav">'+
                    '<li ng-repeat="item in navObj track by $index" ng-include="\'navTree\'" ng-class="{\'dropdown\': item}"' +
                        'ng-mouseenter="dropdownMouseEnter($event, item, 1)" ng-mouseleave="dropdownMouseLeave($event, item)" >' +
                    '</li>'+
            '</div>'
    }
    }])



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
                    scope.$watchGroup(['candidate', 'topk', 'cycle'], function() {
                        if (Object.keys(scope.candidate).length  && scope.cycle>0){
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
                    'Selecting a row in this table will show top contributors to the selected group in the Contributors table below.<br><br>'+
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
                        '<td class="vert-align"><a href="#top-contributors">{{ group.committee_name }}</a></td>'+
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
                pos: "=",
                stateFips: "="
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

                    scope.$watchGroup(['candidate','stateFips'], function() {
                        if (Object.keys(scope.candidate).length){

                            var chart = d3.custom['choropleth']()
                                .height(scope.height)
                                .width(scope.width)
                                .scale(scope.scale)
                                .colors(parties[scope.candidate.CAND_PTY_AFFILIATION]);

                            scope.state_county = f_to_c[scope.stateFips];

                            vizAPI.contributors_by_geo(scope.candidate.Principal.id, scope.cycle, scope.stateFips)
                                .success(function(json){
                                    var map = d3.map(); //a hash to define mapping from locations to values
                                    json.forEach(function(d){ map.set(d.location_id, {'total': d.amount, 'name': d.name}); });

                                    data[scope.stateFips].forEach(function(loc){
                                        if (map.get(loc.id)){ loc.properties = map.get(loc.id); }
                                    });
                                    scope.dataCache = data;
                                    chartEl.datum([data[scope.stateFips], scope.domainMax, scope.pos]).call(chart);
                                })
                        }
                    });

                    scope.$watchGroup(['domainMax.left', 'domainMax.right'], function() {
                        if (scope.dataCache){

                            var chart = d3.custom['choropleth']()
                                .height(scope.height)
                                .width(scope.width)
                                .scale(scope.scale)
                                .colors(parties[scope.candidate.CAND_PTY_AFFILIATION]);

                            chartEl.datum([scope.dataCache[scope.stateFips], scope.domainMax, scope.pos]).call(chart);

                        }
                    });

                },

            template:
            '<div style="font-weight: bold">' +
                'Contributions > $200 to {{candidate.Principal.name}} by {{state_county}} <br><br>' +
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
            '<div style="font-weight: bold">' +
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

                    scope.$watch('candidate', function() {
                        if (Object.keys(scope.candidate).length && scope.domainMax){

                            function supporting(d){ if (d){return d.id} }
                            var ctte_ids = [scope.candidate.Principal.id].concat(scope.candidate.Supporting.map(supporting)).toString();

                            vizAPI.get_receipts_disbursements_by_committees(ctte_ids, scope.cycle)
                                .success(function(json){

                                    scope.dataCache = json;

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

                    scope.$watchGroup(['domainMax.left', 'domainMax.right'], function() {
                        if (scope.dataCache){

                            var colors = getColors(scope.candidate.CAND_PTY_AFFILIATION, scope.dataCache[0].data.length);

                            var chart = d3.custom['horizontalBar']()
                                .h(scope.height)
                                .w(scope.width)
                                .colors(colors);

                            chartEl.datum([scope.dataCache, scope.domainMax, scope.pos]).call(chart);

                            var formatValue = d3.format("0,000"),
                                formatCurrency = function(d) { return "$" + formatValue(Math.round(d/10000)/100) + "M"; };

                            scope.receipts = formatCurrency(d3.sum(scope.dataCache.map(function(d) {
                                return d3.sum(d.data.map(function(d) { return d.data.receipts }))
                            })));
                            scope.expenditures = formatCurrency(d3.sum(scope.dataCache.map(function(d) {
                                return d3.sum(d.data.map(function(d) { return d.data.expenditures }))
                            })));

                        }
                    });
                },

            template:
            '<div>' +
            '<div style="padding: 15px 0; font-weight: bold"> Monthly Fundraising and Spending by {{candidate.CAND_NAME}}\'s Principal Committee and Affiliated Groups</div>' +
            '<div class="chart" ></div>' +
                '<div style="padding: 15px 25px; font-size: 16px">' +
                    '<span>Total Raised: <strong>{{receipts}}</strong></span>' +
                    '<span class="pull-right">Total Spent: <strong>{{expenditures}}</strong></span>' +
                '</div>' +

            '</div>'
        }
    }])


    .directive('wholeCycle', ['vizAPI', function(vizAPI){
        return {
            restrict: 'E',
            replace: true,
            scope: {
                cycle: '=',
                candidateJson: "=",
                height: '=',
                width: '=',
                domainMax: "=",
                pos: "="
            },

            link:
                function(scope, element, attrs){

                    var chartEl = d3.select(element[0]).selectAll(".chart");

                    scope.$watch('cycle', function() {
                        if (scope.cycle>0 && scope.domainMax){

                            function getColors(party, i){
                                var j = Math.min(Math.max(i,3),9);
                                var cols =  {
                                    Democrat: colorbrewer.Blues[j],
                                    Republican: colorbrewer.Reds[j]
                                };
                                var colors = cols[party];
                                if (i>9){ colors = colors.concat(cols[party])}
                                return colors
                            }

                            var candidate_ids = Object.keys(scope.candidateJson[scope.cycle]).map(function(party) {
                                return scope.candidateJson[scope.cycle][party].map(function(candidate) {
                                    if(candidate.CAND_ID){ return candidate.CAND_ID }
                                })
                            });

                            candidate_ids[0] = candidate_ids[0].filter(function(n){ return n != undefined }).reverse();
                            candidate_ids[1] = candidate_ids[1].filter(function(n){ return n != undefined }).reverse();

                            var parties = Object.keys(scope.candidateJson[scope.cycle]);
                            var cLength = Math.max(candidate_ids[0].length, candidate_ids[1].length);

                            scope.colors = getColors(parties[0], cLength).slice(-candidate_ids[0].length)
                                .concat(getColors(parties[1], cLength).slice(-candidate_ids[1].length));

                            candidate_ids = [].concat.apply([], candidate_ids);


                            vizAPI.get_receipts_disbursements_by_candidates(candidate_ids, scope.cycle)
                                .success(function(json){

                                    var chart = d3.custom['horizontalBar']()
                                        .h(scope.height)
                                        .w(scope.width)
                                        .colors(scope.colors);

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

                    scope.$watchGroup(['domainMax.left', 'domainMax.right'], function() {
                        if (scope.dataCache){

                        var chart = d3.custom['horizontalBar']()
                            .h(scope.height)
                            .w(scope.width)
                            .colors(scope.colors);

                        chartEl.datum([scope.dataCache, scope.domainMax, scope.pos]).call(chart);

                        var formatValue = d3.format("0,000"),
                            formatCurrency = function(d) { return "$" + formatValue(Math.round(d/10000)/100) + "M"; };

                        scope.receipts = formatCurrency(d3.sum(scope.dataCache.map(function(d) {
                            return d3.sum(d.data.map(function(d) { return d.data.receipts }))
                        })));
                        scope.expenditures = formatCurrency(d3.sum(scope.dataCache.map(function(d) {
                            return d3.sum(d.data.map(function(d) { return d.data.expenditures }))
                        })));

                        }
                    });
                },

            template:
            '<div>' +
            '<div style="padding: 15px 0; font-weight: bold"> Monthly Fundraising and Spending by Major Candidates\' Principal Committees and Affiliated Groups in the {{cycle}} Election Cycle</div>' +
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
    })

.directive('a', function() {
  return {
    restrict: 'E',
    link: function(scope, element) {
        element.attr('href', '#' + element.attr('href'));
    }
  };
});
