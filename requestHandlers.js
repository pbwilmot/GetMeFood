var db = require("./db");
var mongoose = require("mongoose");
var email = require("./email");
var menus = require("./menus");
var querystring = require("querystring");

function getMealMatches(user, menufoods) {
	var matches = [];
	for (var i = 0; i < user.foods.length; i++) {
		for (var j = 0; j < menufoods.length; j++) {
			if (isMatch(menufoods[j], user.foods[i])) {
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

function subscribed(req, res) {
	res.render("subscribed", {name: req.param('name'), email: req.param('email')});
}

function editPost(req, res) {
	var errors = [];
	db.User.findOne({email: req.param('email')}, function(err, doc) {
		if (err != null) {
			// Something weird happened
			throw err; // this seems reasonable??
		}
		var user;
		if (doc === null)
			user = new db.User();
		else
			user = doc;
		
		var foodstring = req.param('foods');
		var foodstrings;
		if (foodstring === undefined || foodstring.length === 0) {
			foods = [];
		}
		else
			foods = foodstring.split(",");

		user.name = req.param('name');
		if (user.name === undefined || user.name.length == 0)
			errors.push('You must enter a name');
		user.email = req.param('email');
		if (!validateEmail(user.email))
			errors.push('You must enter a valid email address');
		user.foods = foods;
		if (user.foods.length == 0)
			errors.push('You must select at least one food item');
			
		if (errors.length == 0) {
			// Update their information
			user.save(function (err) {
				if (err)
					throw err; // Not a form validation error, but an internal server error
				else
					res.redirect("/subscribed?" + querystring.stringify({name : user.name, email : user.email}));
			});
		}
		else {
			// Redisplay the form and list the errors
			db.Food.find({}, function(fooderr, fooddoc) {
				if (fooderr)
					throw fooderr;
				res.render('edit', {globalfoods : fooddoc, email : user.email, userfoods: user.foods, username: user.name, errors: errors});
			});
		}
	
	});
}

function validateEmail(addr) {
	return addr && addr.length > 0;
}

function editGet(req, res) {
	// First validate the email address
	var emailAddr = req.param('email');
	if (!validateEmail(emailAddr)) {
		// Go back to the login
		res.render("index", {email : emailAddr, error: 'Please enter a valid email address'});
	}
	else {
		db.Food.find({}, function(fooderr, fooddoc) {
			db.User.findOne({email: emailAddr}, function(usererr, userdoc) {
				var userfoods = {};
				var username = "";
				if (userdoc != null) {
					userfoods = userdoc.foods;
					username = userdoc.name;
				}
				res.render("edit", {globalfoods: fooddoc, email : emailAddr, userfoods: userfoods, username: username, errors: []});
			});
		});
	}
}

function index(req, res) {
	res.render("index", {});
}

function unsubscribeGet(req, res) {
	var id = req.param('id');
	if (!id)
		res.send('No user specified');
	db.User.findById(id, function(err, doc) {
		if (err)
			throw err;
		else if (doc === null)
			res.send('User not found');
		else {
			res.render('confirmUnsubscribe', {user : doc});
		}
	});
}

function unsubscribePost(req, res) {
	var id = req.param('id');
	if (!id)
		res.send('No user specified');
	// TODO: try/catch this findById section. An ill-formatted id will cause findById to throw an exception
	db.User.findById(id, function(usererr, userdoc) {
		if (usererr)
			throw usererr;
		else if (userdoc === null)
			res.send('User not found');
		else {
			db.User.remove({_id : id}, function(remerr, remdoc) {
				if (usererr)
					throw usererr;
				res.render('unsubscribed', {user : userdoc});
			});
		}
	});
}

function listdb(req, res) {
	db.Food.find({}, function(fooderr, fooddoc) {
		db.User.find({}, function(usererr, userdoc) {
			var userstrings = [];
			for (var i = 0; i < userdoc.length; i++) {
				userstrings.push(JSON.stringify(userdoc[i]));
			}
			var foodstrings = [];
			for (var i = 0; i < fooddoc.length; i++) {
				foodstrings.push(JSON.stringify(fooddoc[i]));
			}
			res.render("listdb", {users: userstrings, foods: foodstrings});
		});
	});
}

function isMatch(foodpref, menuitem) {
	// This can be however sophisticated we want
	return menuitem.toLowerCase().indexOf(foodpref.toLowerCase()) != -1;
}

function matches(req, res) {
	menus.getRattyMenu(function(items) {
		db.User.find({}, function(usererr, userdoc) {
			if (usererr)
				throw usererr;
			var userlist = [];
			for (var i = 0; i < userdoc.length; i++) {
				var matches = getDailyMatches(userdoc[i], items);
				userlist.push({user: userdoc[i], bmatches: matches[0], lmatches: matches[1], dmatches: matches[2]});
			}
			res.render('matches', {users: userlist});
		});
	});
}

function emailmatches(req, res) {
	menus.getRattyMenu(function(items) {
		db.User.find({}, function(usererr, userdoc) {
			if (usererr)
				throw usererr;
			res.send("Sending matches...");
			
			for (var i = 0; i < userdoc.length; i++) {
				var matches = getDailyMatches(userdoc[i], items);
				var data = { hasBreakfast : (matches[0].length > 0),
							hasLunch : (matches[1].length > 0),
							hasDinner : (matches[2].length > 0),
							breakfast : matches[0],
							lunch : matches[1],
							dinner: matches[2],
							name : userdoc[i].name,
							unsubscribeLink : "http://" + req.headers.host + "/unsubscribe?id=" + userdoc[i]._id };
							
				email.sendEmailWithTemplate(userdoc[i], "Today's Menu", "emailtemplate.txt", data, function(err, result) {});
			}
		});
	});
}

function rattymenu(req, res) {
	menus.getRattyMenu(function(items) {
		var allitems = removeDuplicates(items[0].concat(items[1], items[2]));
		db.addGlobalFoods(allitems);
		res.render("ratty", {breakfast: items[0], lunch: items[1], dinner: items[2]});
	});
}

function clearusers(req, res) {
	db.User.remove({}, function(err, doc) {
		if (!err)
			res.send("All users cleared");
		else
			res.send(err);
	});
}

function clearfoods(req, res) {
	db.Food.remove({}, function(err, doc) {
		if (!err)
			res.send("All foods cleared");
		else
			res.send(err);
	});
}

exports.index = index;
exports.subscribed = subscribed;
exports.clearusers = clearusers;
exports.clearfoods = clearfoods;
exports.rattymenu = rattymenu;
exports.listdb = listdb;
exports.matches = matches;
exports.emailmatches = emailmatches;
exports.unsubscribeGet = unsubscribeGet;
exports.unsubscribePost = unsubscribePost;
exports.editGet = editGet;
exports.editPost = editPost;
exports.getDailyMatches = getDailyMatches;
