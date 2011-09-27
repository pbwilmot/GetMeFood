var http = require("http");
var mustache = require("mustache");
var menus = require("./menus");
var db = require("./db");
var url = require("url");

var listTemplate = "<html><head><title>Today's Ratty Menu</title></head><body><h1>Today's Ratty Menu</h1><h2>Breakfast</h2>	<ul>{{#breakfast}}	<li>{{.}}</li>" +
			"{{/breakfast}}	</ul><h2>Lunch</h2>	<ul>{{#lunch}}<li>{{.}}</li>{{/lunch}}</ul><h2>Dinner</h2><ul>{{#dinner}}<li>{{.}}</li>	{{/dinner}}</ul></body></html>";

var signupTemplate = '<html><head><title>Login</title></head><body><form method="post" action="subscribe"><p>What\'s your name:<input type="text" length="12" name="name"' +
			'</p><p>What\'s your email address:	<input type="text" length="20" name="email"></p><p>Choose your favorite foods:</p>' +
			'<input type="text" length="12" name="food"></br><select multiple name="globalfoods" size="15">{{#globalfoods}}<option value="{{_id}}">{{name}}</option>' +
			'{{/globalfoods}}</select></form></html>';

function startServer() {
	var server = http.createServer(function(request, response) {
		response.writeHead(200, {"Content-Type": "text/html"});
		menus.getRattyMenu(function(items) {
			//db.addGlobalFoods(items.breakfast);
			//db.addGlobalFoods(items.lunch);
			//db.addGlobalFoods(items.dinner);
			
			db.getGlobalFoods(function(err, doc) {
				console.log(doc);
				response.write(mustache.to_html(signupTemplate, {globalfoods: doc}));
				response.end();
			});
		});
	});
	server.listen(8080);
	console.log("Server started on port 8080");
}

startServer();
/*var foods = db.getGlobalFoods(function(err, doc) {
	console.log(doc);
});*/
