var http = require("http");

function getRattyMenu(callback) {
	var options = {
		host: "www.brown.edu",
		port: 80,
		path: '/Student_Services/Food_Services/eateries/refectory_menu.php'
	};
	var pageText = "";
	var request = http.get(options, function(res) {
		console.log("Got response: " + res.statusCode);
		res.setEncoding('utf8');
		res.on("data", function(chunk) {
			pageText += chunk;
		});
		res.on("end", function() {
			var items = parseMenu(pageText);
		});
	});
	request.on("error", function(e) {
		console.log("Error: " + e.message);
	});
}

function parseMenu(pageText) {
	console.log(pageText);
}

getRattyMenu();
