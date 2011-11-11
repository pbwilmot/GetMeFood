var db = require("./db");
var menus = require("./menus");
var email = require("./email");

// Gets a list of all foods on today's menu that match a user's favorites
// user: The User to match
// callback: a function(err, doc) to call when results are in, where doc is a list of three String arrays containing the breakfast, lunch, and dinner matches.
// Each match is itself just a String. So this might return something like [['pancakes', 'scrambled eggs'], [], ['macaroni and cheese']]
function getDailyMatches(user, callback) {
	console.log("Getting matches for " + user.email);
	var mealMatches = [[],[],[]];
	var counter = user.foods.length;
	var stop = false;
	for (var i = 0; i < user.foods.length; i++) {
		db.matchKeywords(user.foods[i], db.MenuFood, function(err, doc) {
			if (err & !stop) {
				stop = true;
				callback(err, null);
			}
			if (!stop) {
				if (doc.length > 0) {
					mealMatches[0] = doc.filter(function(a) { return a.breakfast }).map(function(a) { return a.name });
					mealMatches[1] = doc.filter(function(a) { return a.lunch }).map(function(a) { return a.name });		
					mealMatches[2] = doc.filter(function(a) { return a.dinner }).map(function(a) { return a.name });			
				}
				counter--;
				if (counter == 0) {
					callback(null, mealMatches);
				}
			}
		});
	}
	return mealMatches;
}

// Schedules a round of emails to be sent at 5AM (either today or tomorrow, depending on the time)
function scheduleMessages() {
	var now = new Date();
	var millis = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 39, 0, 0).getTime() - now.getTime();
	if (millis <= 0) // It's after 5AM today, so make it tomorrow
		millis += 1000 * 60 * 60 * 24;
	setTimeout(sendEmails, millis);
	console.log("Scheduled messages");
}

// Sends emails to any users whose favorite foods appear on today's menu. Logs any errors directly to console. Doesn't return anything.
function sendEmails() {
	scheduleMessages();
	console.log("About to send emails...");
	menus.getRattyMenu(function(items) {
		// TODO: Handle errors from getRattyMenu
		console.log("Retrieved Ratty menu");
		db.setMenu(items, function(menuerr) {
			if (err) {
				console.log("Could not set menu: " + menuerr);
				return;
			}
			console.log("Menu updated in database");
			db.User.find({}, function(usererr, userdoc) {
				if (usererr) {
					console.log("Could not retrieve users from database: " + usererr);
					return;
				}
				console.log("Fetched users from database. Sending matches...");
	
				for (var i = 0; i < userdoc.length; i++) {
					(function(index) {
						getDailyMatches(userdoc[index], function(matcherr, matches) {
							if (matcherr) {
								console.log("An error occurred getting matches for user " + userdoc[index].email + ": " + matcherr);
							}
							var data = { hasBreakfast : (matches[0].length > 0),
										hasLunch : (matches[1].length > 0),
										hasDinner : (matches[2].length > 0),
										breakfast : matches[0],
										lunch : matches[1],
										dinner: matches[2],
										name : userdoc[index].name,
										unsubscribeLink : "http://localhost:8080/unsubscribe?id=" + userdoc[index]._id };
							// TODO: Replace localhost with actual domain name
					
							if (data.hasBreakfast || data.hasLunch || data.hasDinner) {
								email.sendEmailWithTemplate(userdoc[index], "Today's Menu", "emailtemplate.txt", data, function(emailerr, data) {
									if (emailerr)
										console.log("An error occurred emailing " + userdoc[index].email + ": " + emailerr);
									else
										console.log("Message sent to " + userdoc[index].email);
									// TODO: Maybe data contains a status code which could also include an error?
								});
							}
							else
								console.log("No matches for " + userdoc[index].email);
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
