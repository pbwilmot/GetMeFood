var db = require("./db");
var menus = require("./menus");
var email = require("./email");


function getDailyMatches(user, callback) {
	var mealMatches = [[],[],[]];
	var counter = user.foods.length;
	for (var i = 0; i < user.foods.length; i++) {
		console.log("searching for " + user.foods[i]);
		db.MenuFood.find({keywords: { $all : db.parseKeywords(user.foods[i]) }}, function(err, doc) {
			console.log(JSON.stringify(user.foods[i]) + ": " + JSON.stringify(doc));
			if (err)
				throw err;
			if (doc.length > 0) {
				mealMatches[0] = doc.filter(function(a) { return a.breakfast }).map(function(a) { return a.name });
				mealMatches[1] = doc.filter(function(a) { return a.lunch }).map(function(a) { return a.name });		
				mealMatches[2] = doc.filter(function(a) { return a.dinner }).map(function(a) { return a.name });			
			}
			counter--;
			if (counter == 0) {
				callback(err, mealMatches);
			}
		});
	}
	return mealMatches;
}

function scheduleMessages() {
	var now = new Date();
	var millis = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 5, 0, 0, 0).getTime() - now.getTime();
	if (millis <= 0)
		millis += 1000 * 60 * 60 * 24;
	setTimeout(sendEmails, millis);
}

function sendEmails() {
	scheduleMessages();
	menus.getRattyMenu(function(items) {
		db.setMenu(items, function(err) {
			db.User.find({}, function(usererr, userdoc) {
				if (usererr)
					throw usererr;
				console.log("Sending matches...");
			
				for (var i = 0; i < userdoc.length; i++) {
					(function(index) {
						getDailyMatches(userdoc[index], function(err, matches) {
							var data = { hasBreakfast : (matches[0].length > 0),
										hasLunch : (matches[1].length > 0),
										hasDinner : (matches[2].length > 0),
										breakfast : matches[0],
										lunch : matches[1],
										dinner: matches[2],
										name : userdoc[index].name,
										unsubscribeLink : "http://localhost:8080/unsubscribe?id=" + userdoc[index]._id };
							
							if (data.hasBreakfast || data.hasLunch || data.hasDinner) {
								email.sendEmailWithTemplate(userdoc[index], "Today's Menu", "emailtemplate.txt", data, function(err, result) {});
								console.log("message sent to " + userdoc[index].email);
							}
							else
								console.log("no matches for " + userdoc[index].email);
						});
					})(i);
				}
			});
		});
	});
}

exports.scheduleMessages = scheduleMessages;
exports.sendEmails = sendEmails;
exports.getDailyMatches = getDailyMatches;
