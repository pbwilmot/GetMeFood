var http = require("http");
var mustache = require("mustache");

var ratty = '/Student_Services/Food_Services/eateries/refectory_menu.php';
var vdub = '/Student_Services/Food_Services/eateries/verneywoolley_menu.php';

var foodExp = /<td( width="[0-9]*")?>([^<]*)<\/td>/g;
var blank = /\s*&nbsp;\s*/;
var meal = /Breakfast at the Ratty|Lunch  at the Ratty|Dinner at the Ratty/g;

var template = "<html><head><title>Today's Ratty Menu</title></head><body><h1>Today's Ratty Menu</h1><h2>Breakfast</h2>	<ul>{{#breakfast}}	<li>{{.}}</li>" +
			"{{/breakfast}}	</ul><h2>Lunch</h2>	<ul>{{#lunch}}<li>{{.}}</li>{{/lunch}}</ul><h2>Dinner</h2><ul>{{#dinner}}<li>{{.}}</li>	{{/dinner}}</ul></body></html>";

function getMenu(path, callback) {
	var options = {
		host: "www.brown.edu",
		port: 80,
		path: path
	};
	var pageText = "";
	var request = http.get(options, function(res) {
		res.setEncoding('utf8');
		res.on("data", function(chunk) {
			pageText += chunk;
		});
		res.on("end", function() {
			var items = parseMenu(pageText);
			callback(items);
		});
	});
	request.on("error", function(e) {
		console.log("Error: " + e.message);
	});
}

function parseMenu(pageText) {
	var meals = pageText.split(meal);
	var breakfast = meals[1];
	var lunch = meals[2];
	var dinner = meals[3];
	
	var food = { breakfast: parseFoodList(breakfast),
		lunch: parseFoodList(lunch),
		dinner: parseFoodList(dinner)
	};
	
	return food;
}

function parseFoodList(foodText) {
	var result;
	var list = [];
	while ((result = foodExp.exec(foodText)) != null) {
		if (blank.exec(result[2]) == null) {// ignore &nbsp;
			result[2] = result[2].replace(/&amp;/, "&");
			list.push(result[2]);
		}
	}
	
	// Put them in alphabetical order
	list.sort(function(a,b) {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});
	return list;
}

function startServer() {
	var server = http.createServer(function(request, response) {
		response.writeHead(200, {"Content-Type": "text/html"});
		getMenu(ratty, function(items) {
			response.write(mustache.to_html(template, items));
			response.end();
		});
	});
	server.listen(8080);
	console.log("Server started on port 8080");
}

startServer();
