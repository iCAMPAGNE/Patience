'use strict';

angular.module('Patience', [
  'ngRoute',
  'Patience.app'
])
.config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
	$locationProvider.hashPrefix('!');
    $routeProvider.otherwise( {
	    templateUrl: 'app/index.html',
	    controller: 'IndexCtrl'
	  });
  }]);
