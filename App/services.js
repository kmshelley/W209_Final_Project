(function() {
    var vizAPI = function($http) {

        var BASE_URL = "http://data.enalytica.com:9600";
        //var BASE_URL = "http://127.0.0.1:5000";

        var factory = {};

        factory.get_candiates = function() {
            return $http.get('./data/candidates.json');
        };

        factory.contributors_by_state = function() {
            return $http.get('./data/sched_a_by_cand+state_2007-2015_to_pg500.json');
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

        return factory;
    };

    vizAPI.$inject = ['$http'];
    angular.module('myApp').factory('vizAPI', vizAPI);

}());