var http = require("http");
var mustache = require("mustache");
var menus = require("./menus");
var db = require("./db");
var url = require("url");
var fs = require("fs");
var requestHandlers = require("./requestHandlers");

var handlers = {};
handlers["/"] = requestHandlers.index;
handlers["/index"] = requestHandlers.index;
handlers["/subscribe"] = requestHandlers.subscribe;
handlers["/clearusers"] = requestHandlers.clearusers;
handlers["/clearfoods"] = requestHandlers.clearfoods;
handlers["/rattymenu"] = requestHandlers.rattymenu;
handlers["/listdb"] = requestHandlers.listdb;
handlers["/emailmatches"] = requestHandlers.emailmatches;
handlers["/matches"] = requestHandlers.matches;
handlers["/unsubscribe"] = requestHandlers.unsubscribe;
handlers["/edit"] = requestHandlers.edit;

function startServer() {
	var server = http.createServer(function(request, response) {
		var pathname = url.parse(request.url).pathname;
		var handler = handlers[pathname];
		if (handler === undefined) {
			response.writeHeader(404, "Content-type: text/plain");
			response.write("Page not found");
			response.end();
		}
		else {
			var postData = "";

			request.setEncoding("utf8");

			request.addListener("data", function(postDataChunk) {
				postData += postDataChunk;
			});

			request.addListener("end", function() {
				handler(pathname, request, response, postData);
			});
		}
	});
	server.listen(8080);
	console.log("Server started on port 8080");
}

startServer();
/*getDailyMenu(function(itemFoods) {
	var user = db.User.findOne({email:"victor_vu@brown.edu"}, function(err, doc) {
		console.log(doc);
		var matches = getDailyMatches(doc, itemFoods);
		//console.log(matches);
	});
});*/
/*var foods = db.getGlobalFoods(function(err, doc) {
	console.log(doc);
});*/


