(function() {

    var customChart = function(){

        return {
            restrict: 'E',
            replace: true,
            template: '<div class="chart"></div>',
            scope:{
                height: '=',
                width: '=',
                data: '=',
                chartType: '='
            },
            link: function(scope, element, attrs) {
                var chart = d3.custom[scope.chartType]()
                    .height(scope.height);

                var chartEl = d3.select(element[0]);

                scope.$watch('data', function (newVal, oldVal) {
                    chartEl.datum(newVal).call(chart);
                });
            }
        }
    };

    angular
        .module('myApp')
        .directive('customChart', customChart)

}());