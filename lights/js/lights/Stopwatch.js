

LIGHTS.Stopwatch = function() {

	this.initialize();
};

LIGHTS.Stopwatch.prototype = {

    // _______________________________________________________________________________________ Constructor

	initialize: function() {

		this.date = new Date();
	},

    // _______________________________________________________________________________________ Public

	start: function() {

		this.startTime = this.date.getTime();
	},

	stop: function() {

		this.time = this.date.getTime() - this.startTime;
		console.log( this.time );
	}
}
