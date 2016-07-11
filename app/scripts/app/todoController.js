(function(){

	angular
		.module('app', ['ngMaterial', 'ngAnimate'])
		.controller('TodoController', ['$scope', '$http', TodoController]);

	function TodoController($scope, $http) {

		// List of bindable properties and methods
		var todo = this;
		todo.tasks = [];
		todo.incompleteTasks = [];
		todo.completedTasks = [];
		todo.addTask = addTask;
		todo.inputTask = "";
		todo.refreshTasks = refreshTasks;
        todo.updateTask = updateTask;
		todo.showCompleted = false;
		todo.toggleCompletedTasks = toggleCompletedTasks;

		activate();

		/**
		 * Initialize sample controller data.
		 */
		function activate() {
			// Fill sample tasks
            $http.post('http://localhost:3000/tasks', null).then(function(response){
                response.data.rows.forEach(function(row, index, arr) {
                   todo.tasks.push(row.doc);
                });
                refreshTasks();
            });
		}

		/**
		 * Run through all tasks and see which are complete and which are not.
		 */
		function refreshTasks() {
			todo.completedTasks = [];
			todo.incompleteTasks = [];
			todo.tasks.forEach(function(task, index, arr) {
				if (task.completed)
					todo.completedTasks.push(task);
				else
					todo.incompleteTasks.push(task);
			});
		}

        /**
         * update completed state of the given task
         */
        function updateTask(task){
            $http.post('http://localhost:3000/update', task).then(function(response){
                refreshTasks();
            });
        }

		/**
		 * Add new task to collection.
		 */
		function addTask() {
			// Only add task if something actually exists
			if (todo.inputTask) {
                var newTask = {
                    "_id": todo.inputTask,
                    "text": todo.inputTask,
                    "completed": false
                };
                $http.post('http://localhost:3000/add', newTask).then(function(response){
                    todo.tasks.push(newTask);
				todo.incompleteTasks.push(newTask);
				// Reset input to add new task
				todo.inputTask = "";
                });
			}
		}

		/**
		 * Show or hide completed tasks.
		 */
		function toggleCompletedTasks() {
			todo.showCompleted = !todo.showCompleted;
		}

	}

})();
