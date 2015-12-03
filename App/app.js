(function() {
    var myApp = angular.module('myApp', ['ui.router', 'ui.bootstrap']);

    myApp.config(['$stateProvider', '$urlRouterProvider',
        function($stateProvider, $urlRouterProvider) {

            $urlRouterProvider.otherwise("/");

            $stateProvider
                .state('testing', {
                    url: "/",
                    templateUrl: "views/testing/view.html",
                    controller: 'testingController'
                });

        }]);

}());