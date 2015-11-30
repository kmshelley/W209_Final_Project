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
                watch: '=',
                chartType: '='
            },
            link: function(scope, element, attrs) {
                var chart = d3.custom[scope.chartType]();
                var chartEl = d3.select(element[0]);
                scope.$watch('watch', function (newValue, oldValue) {
                    if (newValue){
                        chartEl.datum(scope.data).call(chart);
                    }

                });
            }
        }
    };

    angular
        .module('myApp')
        .directive('customChart', customChart)

}());