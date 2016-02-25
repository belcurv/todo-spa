var todoSpa = angular.module('todoSpa', ['ngRoute']);

todoSpa.config(function ($routeProvider) {
    
    $routeProvider
    
        .when('/', {
            templateUrl: 'pages/about.html',
            controller : 'loginController'
        })

        .when('/login', {
            templateUrl: 'pages/login.html',
            controller : 'loginController'
        })

        .when('/signup', {
            templateUrl: 'pages/signup.html',
            controller : 'signupController'
        })

        .when('/todos', {
            templateUrl: 'pages/todos.html',
            controller : 'todoController'
        });
});

todoSpa.controller('loginController', function ($scope, $http) {
    
    $scope.name = 'Login Controller';
    
});

todoSpa.controller('signupController', function ($scope, $http) {
    
    $scope.name = 'Signup Controller';
    
});

todoSpa.controller('todoController', function ($scope, $http) {
    
    $scope.name = 'Todo Controller';
    
});