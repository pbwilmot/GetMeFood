var db = require("./db");
var mongoose = require("mongoose");
var mustache = require("mustache");
var email = require("./email");
var menus = require("./menus");
var fs = require("fs");
var querystring = require("querystring");

function getMealMatches(user, menufoods) {
	var matches = [];
	console.log("getMealMatches");
	for (var i = 0; i < user.foods.length; i++) {
		for (var j = 0; j < menufoods.length; j++) {
			console.log("[" + menufoods[j] + "," + user.foods[i] + "]");
			if (isMatch(menufoods[j], user.foods[i])) {
				console.log("match: " + menufoods[j]);
				matches.push(menufoods[j]);
			}
		}
	}
	return matches;
}

function getDailyMatches(user, menufoods) {
	var counter = 3;
	var mealMatches = [[],[],[]];
	for (var i = 0; i < 3; i++) {
		mealMatches[i] = getMealMatches(user, menufoods[i]);
	}
	return mealMatches;
}

function index(pathname, response, postData) {
	db.Food.find({}, function(err, doc) {
		fs.readFile('index.html', function(err, template) {
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write(mustache.to_html(template.toString(), {globalfoods: doc}));
			response.end();
		});
	});
}

function listdb(pathname, response, postData) {
	db.Food.find({}, function(fooderr, fooddoc) {
		db.User.find({}, function(usererr, userdoc) {
				fs.readFile('listdb.html', function(err, template) {
				response.writeHead(200, {"Content-Type": "text/html"});
				var userstrings = [];
				for (var i = 0; i < userdoc.length; i++) {
					userstrings.push(JSON.stringify(userdoc[i]));
				}
				var foodstrings = [];
				for (var i = 0; i < fooddoc.length; i++) {
					foodstrings.push(JSON.stringify(fooddoc[i]));
				}
				response.write(mustache.to_html(template.toString(), {users: userstrings, foods: foodstrings}));
				response.end();
			});
		});
	});
}

function isMatch(foodpref, menuitem) {
	// This can be however sophisticated we want
	return (foodpref.toLowerCase() == menuitem.toLowerCase());
}

function matches(pathname, response, postData) {
	menus.getRattyMenu(function(items) {
		db.User.find({}, function(usererr, userdoc) {
			fs.readFile('matches.html', function(err, template) {
				var userlist = [];
				for (var i = 0; i < userdoc.length; i++) {
					var matches = getDailyMatches(userdoc[i], items);
					console.log(matches);
					userlist.push({usertext: JSON.stringify(userdoc[i]), bmatches: matches[0], lmatches: matches[1], dmatches: matches[2]});
				}
				response.writeHead(200, {"Content-Type": "text/html"});
			
				response.write(mustache.to_html(template.toString(), {users: userlist}));
				response.end();
			});
		});
	});
}

function emailmatches(pathname, response, postData) {
	menus.getRattyMenu(function(items) {
		db.User.find({}, function(usererr, userdoc) {
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write("Matches sent");
			response.end();
			
			for (var i = 0; i < userdoc.length; i++) {
				var matches = getDailyMatches(userdoc[i], items);
				var data = { hasBreakfast : (matches[0].length > 0),
							hasLunch : (matches[1].length > 0),
							hasDinner : (matches[2].length > 0),
							breakfast : matches[0],
							lunch : matches[1],
							dinner: matches[2],
							name : userdoc[i].name };
							
				email.sendEmailWithTemplate(userdoc[i], "Today's Menu", "emailtemplate.txt", data, function(err, result) {});
			}
		});
	});
}

function rattymenu(pathname, response, postData) {
	menus.getRattyMenu(function(items) {
		db.addGlobalFoods(items[0]); // breakfast
		db.addGlobalFoods(items[1]);
		db.addGlobalFoods(items[2]);
		fs.readFile('ratty.html', function(err, template) {
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write(mustache.to_html(template.toString(), {breakfast: items[0], lunch: items[1], dinner: items[2]}));
			response.end();
		});
	});
}

function clearusers(pathname, response, postData) {
	db.User.remove({}, function(err, doc) {
		if (!err)
			response.write("All users cleared");
		else
			response.write(err);
		response.end();
	});
}

function clearfoods(pathname, response, postData) {
	db.Food.remove({}, function(err, doc) {
		if (!err)
			response.write("All foods cleared");
		else
			response.write(err);
		response.end();
	});
}

function subscribe(pathname, response, postdata) {
	var query = querystring.parse(postdata);
	db.User.findOne({email: query.email}, function(err, doc) {
		if (doc === null) {
			var foodstring = query.foods;
			var foodstrings;
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

exports.index = index;
exports.subscribe = subscribe;
exports.clearusers = clearusers;
exports.clearfoods = clearfoods;
exports.rattymenu = rattymenu;
exports.listdb = listdb;
exports.matches = matches;
exports.emailmatches = emailmatches;
