(function() {
    var myApp = angular.module('myApp', ['ngRoute']);

    myApp.config(['$routeProvider',
        function($routeProvider) {
            $routeProvider
                .when('/', {
                    templateUrl: 'views/testing/view.html',
                    controller: 'testingController'
                })
                .otherwise({ redirectTo: '/' });
        }]);

}());