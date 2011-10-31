var db = require("./db");
var mongoose = require("mongoose");
var menus = require("./menus");
var querystring = require("querystring");
var cron = require('./cron');

function subscribed(req, res) {
	res.render("subscribed", {name: req.param('name'), email: req.param('email')});
}

// TODO: Break this function down
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
		else {
			foods = foodstring.split(",");
		}

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
			db.GlobalFood.find({}, function(fooderr, fooddoc) {
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

function autocomplete(req, res) {
	db.matchKeywords(req.param('query'), db.GlobalFood, function(err, docs) {
		res.send(JSON.stringify(docs.map(function(doc) { return doc.name })));
	});
}

function editGet(req, res) {
	// First validate the email address
	var emailAddr = req.param('email');
	if (!validateEmail(emailAddr)) {
		// Go back to the login
		res.render("index", {email : emailAddr, error: 'Please enter a valid email address'});
	}
	else {
		db.GlobalFood.find({}, function(fooderr, fooddoc) {
			db.User.findOne({email: emailAddr}, function(usererr, userdoc) {
				var userfoods = [];
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
	// TODO: try/catch this findById section. A badly formed id will cause findById to throw an exception
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
	db.GlobalFood.find({}, function(fooderr, globalfooddoc) {
		db.MenuFood.find({}, function(fooderr, menufooddoc) {
			db.User.find({}, function(usererr, userdoc) {
				res.render("listdb", {users: userdoc.map(JSON.stringify), globalfoods: globalfooddoc.map(JSON.stringify), menufoods: menufooddoc.map(JSON.stringify) });
			});
		});
	});
}

function matches(req, res) {
	db.User.find({}, function(usererr, userdoc) {
		if (usererr)
			throw usererr;
		var userlist = [];
		var counter = userdoc.length;
		for (var i = 0; i < userdoc.length; i++) {
			(function(index) {
				cron.getDailyMatches(userdoc[index], function(err, matches) {
					userlist.push({user: userdoc[index], bmatches: matches[0], lmatches: matches[1], dmatches: matches[2]});
					counter--;
					if (counter == 0)
						res.render('matches', {users: userlist});
				});
			})(i);
		}
	});
}

function rattymenu(req, res) {
	menus.getRattyMenu(function(items) {
		db.setMenu(items, function(err) {
			res.render("ratty", {breakfast: items[0], lunch: items[1], dinner: items[2]});
		});
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

exports.autocomplete = autocomplete;
exports.index = index;
exports.subscribed = subscribed;
exports.clearusers = clearusers;
exports.clearfoods = clearfoods;
exports.rattymenu = rattymenu;
exports.listdb = listdb;
exports.matches = matches;
exports.unsubscribeGet = unsubscribeGet;
exports.unsubscribePost = unsubscribePost;
exports.editGet = editGet;
exports.editPost = editPost;
