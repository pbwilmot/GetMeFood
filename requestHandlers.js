var db = require("./db");
var mustache = require("mustache");
var fs = require("fs");
var querystring = require("querystring");

function index(pathname, response, postData) {
	db.getGlobalFoods(function(err, doc) {
		fs.readFile('index.html', function(err, template) {
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write(mustache.to_html(template.toString(), {globalfoods: doc}));
			response.end();
		});
	});
}

function subscribe(pathname, response, postdata) {
	var query = querystring.parse(postdata);
	db.User.findOne({email: query.email}, function(err, doc) {
		if (doc === null) {
			var foodstring = query.foods;
			var foods;
			if (foodstring === undefined || foodstring.length === 0) {
				foods = [];
			}
			else
				foods = foodstring.split(",");
			console.log(foodstring);
			console.log(foods);
			
		
			var user = new db.User();
			user.name = query.name;
			user.email = query.email;
			user.phone = query.phone;
			user.cellCarrier = query.cellcarrier;
			user.foods = foods;
			
			user.usePhone = (query.notify === "phone" || (query.notify instanceof Array && query.notify.indexOf("phone") != -1));
			user.useEmail = (query.notify === "email" || (query.notify instanceof Array && query.notify.indexOf("email") != -1));
			console.log(query.notify);
			console.log("phone: " + user.usePhone);
			console.log("email: " + user.useEmail);
			
			user.save();
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write("User added:\n" + user);
			response.end();
		}
		else {
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write("User already exists");
			response.end();
		}
	});
}

function populateGlobalFoods() {
	menus.getRattyMenu(function(items) {
		db.addGlobalFoods(items.breakfast);
		db.addGlobalFoods(items.lunch);
		db.addGlobalFoods(items.dinner);
	});
}

exports.index = index;
exports.subscribe = subscribe;
