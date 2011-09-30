var db = require("./db");
var mongoose = require("mongoose");
var mustache = require("mustache");
var email = require("./email");
var menus = require("./menus");
var fs = require("fs");
var querystring = require("querystring");
var url = require("url");

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

function removeDuplicates(array) {
	var set = {};
	for (var i = 0; i < array.length; i++) {
		set[array[i].toLowerCase()] = array[i];
	}
	var newArray = [];
	for (var item in set) {
		newArray.push(set[item]);
	}
	return newArray;
}

function getDailyMatches(user, menufoods) {
	var counter = 3;
	var mealMatches = [[],[],[]];
	for (var i = 0; i < 3; i++) {
		mealMatches[i] = getMealMatches(user, menufoods[i]);
	}
	return mealMatches;
}

function edit(pathname, request, response, postData) {
	db.Food.find({}, function(fooderr, fooddoc) {
		var emailAddr = url.parse(request.url, parseQueryString=true).query["email"];
		db.User.findOne({email: emailAddr}, function(usererr, userdoc) {
			console.log("userdoc: " + JSON.stringify(userdoc));
			fs.readFile('edit.html', function(err, template) {
				response.writeHead(200, {"Content-Type": "text/html"});
				var userfoods = null;
				var username = null;
				if (userdoc != null) {
					userfoods = userdoc.foods;
					username = userdoc.name;
				}
				response.write(mustache.to_html(template.toString(), {globalfoods: fooddoc, email : emailAddr, userfoods: userfoods, username: username}));
				response.end();
			});
		});
	});
}

function index(pathname, request, response, postData) {
	db.Food.find({}, function(err, doc) {
		fs.readFile('index.html', function(err, template) {
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write(template); // no mustache in the landing page
			response.end();
		});
	});
}

function unsubscribe(pathname, request, response, postData) {
	var query;
	if (request.method === 'GET') 
		query = url.parse(request.url, parseQueryString=true).query;
	else
		query = querystring.parse(postData);
	var confirm = query.confirm;
	var id = query.id;
	if (confirm != 'true' || request.method === 'GET') {
		response.writeHead(200, {"Content-Type": "text/html"});
		db.User.findById(id, function(err, doc) {
			if (err) {
				response.write(JSON.stringify(err));
				response.end();
			}
			else {
				fs.readFile('unsubscribe.html', function(err, template) {
					if (template === null)
						response.write("User not found");
					else
						response.write(mustache.to_html(template.toString(), doc));
					response.end();
				});
			}
		});
	}
	else {
		db.User.remove({_id : id}, function(err, doc) {
			response.writeHead(200, {"Content-Type": "text/html"});
			if (!err)
				response.write("User removed");
			else
				response.write(JSON.stringify(err));
			response.end();
		});
	}
}

function listdb(pathname, request, response, postData) {
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

function matches(pathname, request, response, postData) {
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

function emailmatches(pathname, request, response, postData) {
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
							name : userdoc[i].name,
							unsubscribeLink : "http://" + request.headers.host + "/unsubscribe?id=" + userdoc[i]._id };
							
				email.sendEmailWithTemplate(userdoc[i], "Today's Menu", "emailtemplate.txt", data, function(err, result) {});
			}
		});
	});
}

function rattymenu(pathname, request, response, postData) {
	menus.getRattyMenu(function(items) {
		var allitems = removeDuplicates(items[0].concat(items[1], items[2]));
		db.addGlobalFoods(allitems);
		fs.readFile('ratty.html', function(err, template) {
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write(mustache.to_html(template.toString(), {breakfast: items[0], lunch: items[1], dinner: items[2]}));
			response.end();
		});
	});
}

function clearusers(pathname, request, response, postData) {
	db.User.remove({}, function(err, doc) {
		if (!err)
			response.write("All users cleared");
		else
			response.write(err);
		response.end();
	});
}

function clearfoods(pathname, request, response, postData) {
	db.Food.remove({}, function(err, doc) {
		if (!err)
			response.write("All foods cleared");
		else
			response.write(err);
		response.end();
	});
}

function subscribe(pathname, request, response, postdata) {
	var query = querystring.parse(postdata);
	db.User.findOne({email: query.email}, function(err, doc) {
		var user;
		if (doc === null)
			user = new db.User();
		else
			user = doc;
			
		var foodstring = query.foods;
		var foodstrings;
		if (foodstring === undefined || foodstring.length === 0) {
			foods = [];
		}
		else
			foods = foodstring.split(",");
	
		user.name = query.name;
		user.email = query.email;
		user.foods = foods;
		user.save();
		
		response.writeHead(200, {"Content-Type": "text/html"});
		response.write("User " + (doc === null ? "added:\n" : "updated:\n") + JSON.stringify(user));
		response.end();
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
exports.unsubscribe = unsubscribe;
exports.edit = edit;
