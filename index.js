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
				handler(pathname, response, postData);
			});
		}
	});
	server.listen(8080);
	console.log("Server started on port 8080");
}

//startServer();
/*var foods = db.getGlobalFoods(function(err, doc) {
	console.log(doc);
});*/

/*var email = require("./email");
var patrick = new db.User();
patrick.email = "patrick_temple@brown.edu";
patrick.phone = "7742710724";
patrick.cellCarrier = "vtext.com";
email.sendText(patrick, "asdf", function(err, result) {
	if (err)
		console.log(err);
	console.log(result);
});*/

var email = require("./email");
var webber = new db.User();
webber.email = "patrick_temple@brown.edu";
webber.phone = "6177715184";
webber.cellCarrier = "txt.att.net";
email.sendText(webber, "The game starts tomorrow at dinnertime. Eliminate the oven roasted tofu triangles.", function(err, result) {
	if (err)
		console.log(err);
	console.log(result);
});

