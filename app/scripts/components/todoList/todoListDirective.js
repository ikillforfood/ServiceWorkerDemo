(function(){

	angular
		.module('app')
		.directive('todoList', todoList);

	function todoList() {

		var directive = {
			scope: {
				tasks: "=",
				updateTask: "&"
			},
            controller: function($scope){
                $scope.update = function(task){
                    $scope.updateTask({task: task});
                };
            },
			templateUrl: 'scripts/components/todoList/todoListView.html',
			restrict: 'E'
		}

		return directive;
	}

})();
