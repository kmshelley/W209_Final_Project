(function() {
    var vizAPI = function($http) {

        var BASE_URL = "http://data.enalytica.com:9600";

        var factory = {};

        factory.get_candiates = function() {
            return $http.get('./data/candidates.json');
        };

        factory.get_by_employer = function(committee_id, cycle) {
            return $http.get(BASE_URL+'/schedule_a/by_employer/'+ committee_id +'/'+cycle);
        };

        factory.put_panel_data = function(data) {
            return $http.put(BASE_URL+'/panel_data', data);
        };

        return factory;
    };

    vizAPI.$inject = ['$http'];
    angular.module('myApp').factory('vizAPI', vizAPI);

}());