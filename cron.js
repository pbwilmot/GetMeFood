var db = require("./db");
var menus = require("./menus");

function isMatch(foodpref, menuitem) {
	// This can be however sophisticated we want
	return menuitem.toLowerCase().indexOf(foodpref.toLowerCase()) != -1;
}

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
	console.log("Before:\n" + JSON.stringify(array));
	for (var i = 0; i < array.length; i++) {
		set[array[i].toLowerCase()] = array[i];
	}
	var newArray = [];
	for (var item in set) {
		newArray.push(set[item]);
	}
	console.log("After:\n" + JSON.stringify(newArray));
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

function scheduleMessages() {
	var now = new Date();
	var millis = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0, 0).getTime() - now.getTime();
	if (millis <= 0)
		millis += 1000 * 60 * 60;
	setTimeout(sendEmails, millis);
}

function sendEmails() {
	scheduleMessages();
	menus.getRattyMenu(function(items) {
		// TODO: Add items to global list
		db.User.find({}, function(usererr, userdoc) {
			if (usererr)
				throw usererr;
			console.log("Sending matches...");
			
			for (var i = 0; i < userdoc.length; i++) {
				var matches = requestHandlers.getDailyMatches(userdoc[i], items);
				var data = { hasBreakfast : (matches[0].length > 0),
							hasLunch : (matches[1].length > 0),
							hasDinner : (matches[2].length > 0),
							breakfast : matches[0],
							lunch : matches[1],
							dinner: matches[2],
							name : userdoc[i].name,
							unsubscribeLink : "http://localhost:8080/unsubscribe?id=" + userdoc[i]._id };
							
				email.sendEmailWithTemplate(userdoc[i], "Today's Menu", "emailtemplate.txt", data, function(err, result) {});
				console.log("message sent to " + userdoc[i].email);
			}
		});
	});
}

exports.scheduleMessages = scheduleMessages;
exports.removeDuplicates = removeDuplicates;
exports.getDailyMatches = getDailyMatches;
